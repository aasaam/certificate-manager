#!/usr/bin/env node

// eslint-disable-next-line node/shebang
const { resolve } = require('path');
const childProcess = require('child_process');
const fs = require('fs');
const util = require('util');

const { to } = require('await-to-js');

const password = require('secure-random-password');
const chalk = require('chalk');
const ip = require('ip');
const IpCidr = require('ip-cidr');
const program = require('commander');
const { uniq } = require('lodash');
const { mdToPdf } = require('md-to-pdf');

process.env.PROJECT_PATH = resolve(`${__dirname}/..`);

const { safeName, replaceDocument } = require('./functions');
const configClient = require('./configClient');
const configIntermediate = require('./configIntermediate');
const configRoot = require('./configRoot');
const configGetRoot = require('./configGetRoot');

const {
  prompt: configServer,
  list: intermediateList,
} = require('./configServer');

const exec = util.promisify(childProcess.exec);
const fsp = fs.promises;
const { log } = console;

program
  .command('root')
  .description('Create new root certificate')
  .action(async () => {
    log(chalk.yellow('Starting to create new root certificate authority.'));
    const answers = await configRoot();

    const configDir = `${process.env.PROJECT_PATH}/output/${answers.organizationId}`;
    const rootCaDir = `${configDir}/root`;
    const csrRootPath = `${rootCaDir}/csr-root.json`;

    if (fs.existsSync(csrRootPath)) {
      log(chalk.redBright('Requested root certificate already exists.'));
      return;
    }

    const caCsr = JSON.parse(
      await fsp.readFile(`${process.env.PROJECT_PATH}/config/csr-root.json`),
    );

    caCsr.CN = `${answers.Name} Root CA`;
    caCsr.ca.expiry = `${parseInt(answers.expiryInYear, 10) * 24 * 365}h`;
    caCsr.names[0].O = answers.O;
    caCsr.names[0].C = answers.C;
    caCsr.names[0].OU = answers.OU;
    caCsr.names[0].ST = answers.ST;
    caCsr.names[0].L = answers.L;

    await exec([`mkdir -p ${configDir}`, `mkdir -p ${rootCaDir}`].join(' && '));
    await fsp.writeFile(csrRootPath, JSON.stringify(caCsr, null, 2));

    const commands = [
      `cd ${rootCaDir}`,
      `cfssl gencert -initca ${csrRootPath} | cfssljson -bare root-ca -`,
      'openssl x509 -text -noout -in root-ca.pem > root-ca.info.txt',
      'openssl x509 -outform der -in root-ca.pem -out root-ca.crt',
      `7za a -t7z -mhe=on -mx9 -y -p${answers.rootCAPassword} -mhe root-ca-key.pem.7z root-ca-key.pem`,
      'rm root-ca-key.pem',
      'cd ..',
      'tar -czf root.tgz root',
    ];

    await exec(commands.join(' && '));
  });

program
  .command('intermediate')
  .description('Create new intermediate certificate for selected organization')
  .action(async () => {
    log(
      chalk.yellow(
        'Starting to create new intermediate certificate authority base on selected organization identifier.',
      ),
    );

    const answers = await configIntermediate();
    const configDir = `${process.env.PROJECT_PATH}/output/${answers.organizationId}`;
    const rootCaDir = `${configDir}/root`;

    const passwordCommands = [
      `cd ${rootCaDir}`,
      `7z x root-ca-key.pem.7z -p${answers.rootCAPassword}`,
    ];

    const [passwordError] = await to(exec(passwordCommands.join(' && ')));
    const [rootPrivateError] = await to(
      fsp.stat(`${rootCaDir}/root-ca-key.pem`),
    );

    if (passwordError || rootPrivateError) {
      log(chalk.red('Password error for root ca'));
      return;
    }

    const intermediateSafeName = `intermediate.${safeName(
      answers.forOrganization,
    )}`;

    const intermediateCaDir = `${configDir}/${intermediateSafeName}`;
    const csrIntermediatePath = `${intermediateCaDir}/csr-intermediate.json`;

    const caCsr = JSON.parse(
      await fsp.readFile(
        `${process.env.PROJECT_PATH}/config/csr-intermediate.json`,
      ),
    );

    caCsr.CN = `${answers.forOrganization} Intermediate CA`;
    caCsr.names[0].O = answers.forOrganization;
    caCsr.names[0].C = answers.C;
    caCsr.names[0].OU = answers.OU;
    caCsr.names[0].ST = answers.ST;
    caCsr.names[0].L = answers.L;

    await exec(
      [
        `mkdir -p ${configDir}`,
        `rm -rf ${intermediateCaDir}`,
        `mkdir -p ${intermediateCaDir}`,
      ].join(' && '),
    );
    await fsp.writeFile(csrIntermediatePath, JSON.stringify(caCsr, null, 2));

    const caConfig = JSON.parse(
      await fsp.readFile(`${process.env.PROJECT_PATH}/config/ca-config.json`),
    );

    caConfig.signing.profiles.intermediate.expiry = `${
      parseInt(answers.EXPIRE, 10) * 30 * 24
    }h`;

    await fsp.writeFile(
      `${intermediateCaDir}/ca-config.json`,
      JSON.stringify(caConfig, null, 2),
    );

    const commands = [
      `cd ${intermediateCaDir}`,
      `cfssl gencert -initca ${csrIntermediatePath} | cfssljson -bare intermediate-ca -`,
      `cfssl sign -ca ${rootCaDir}/root-ca.pem -ca-key ${rootCaDir}/root-ca-key.pem -config ${intermediateCaDir}/ca-config.json -profile intermediate intermediate-ca.csr | cfssljson -bare intermediate-ca`,
      `rm -rf ${rootCaDir}/root-ca-key.pem`,
      'openssl x509 -text -noout -in intermediate-ca.pem > intermediate-ca.info.txt',
      `cd ${configDir}`,
      `tar -czf ${intermediateSafeName}.tgz ${intermediateSafeName}`,
      `tar -czf ${intermediateSafeName}.${new Date().getTime()}.root-intermediate.tgz ${intermediateSafeName} root`,
    ];

    await exec(commands.join(' && '));
  });

program
  .command('server')
  .description('Create new server certificate')
  .action(async () => {
    log(
      chalk.yellow(
        'Starting to create new server certificate base on selected organization identifier.',
      ),
    );
    const answers = await configServer();

    const { path: intermediateCaDir, name: intermediateName } =
      intermediateList.find((i) => i.name === answers.intermediate);

    const configDir = resolve(`${intermediateCaDir}/..`);
    const rootCaDir = `${configDir}/root`;
    const rootCa = `${rootCaDir}/root-ca.pem`;

    const domains = [];
    let baseDomains = [];
    if (answers.dnsDomains.trim().length) {
      baseDomains = uniq(
        answers.dnsDomains
          .trim()
          .split(',')
          .map((d) => d.trim().toLocaleLowerCase()),
      );
    }
    baseDomains.forEach((d) => {
      domains.push(d);
    });
    const ips = uniq(
      answers.dnsIps
        .trim()
        .split(',')
        .map((d) => d.trim().toLocaleLowerCase()),
    ).filter((i) => ip.isV4Format(i));
    const ipRanges = uniq(
      answers.dnsRangeIps
        .trim()
        .split(',')
        .map((d) => d.trim().toLocaleLowerCase()),
    ).filter((i) => IpCidr.isValidAddress(i));
    ipRanges.forEach((ipr) => {
      const cidr = new IpCidr(ipr);
      cidr.loop((i) => {
        ips.push(i);
      });
    });
    const dns = uniq(ips.concat(domains));

    const serverCertDir = `${configDir}/servers/${safeName(
      `${answers.CN}.${intermediateName}`,
    )}`;
    const csrPath = `${serverCertDir}/csr-server.json`;
    const csr = JSON.parse(
      await fsp.readFile(`${process.env.PROJECT_PATH}/config/csr-server.json`),
    );

    csr.CN = answers.CN;
    csr.hosts = dns;
    csr.names[0].O = answers.O;
    csr.names[0].C = answers.C;
    csr.names[0].OU = answers.OU;
    csr.names[0].ST = answers.ST;
    csr.names[0].L = answers.L;
    await exec([`mkdir -p ${serverCertDir}`].join(' && '));
    await fsp.writeFile(csrPath, JSON.stringify(csr, null, 2));

    const caConfig = JSON.parse(
      await fsp.readFile(`${process.env.PROJECT_PATH}/config/ca-config.json`),
    );

    caConfig.signing.profiles.server.expiry = `${
      parseInt(answers.EXPIRE, 10) * 30 * 24
    }h`;

    await fsp.writeFile(
      `${serverCertDir}/ca-config.json`,
      JSON.stringify(caConfig, null, 2),
    );

    const commands = [
      `cd ${serverCertDir}`,
      `cfssl gencert -initca ${csrPath} | cfssljson -bare server -`,
      `cfssl sign -ca ${intermediateCaDir}/intermediate-ca.pem -ca-key ${intermediateCaDir}/intermediate-ca-key.pem -config ${serverCertDir}/ca-config.json -profile server server.csr | cfssljson -bare server`,
      'openssl x509 -text -noout -in server.pem > server.info.txt',
      `cat ${serverCertDir}/server.pem ${intermediateCaDir}/intermediate-ca.pem > ${serverCertDir}/server-fullchain.pem`,
      `cp ${rootCa} ${serverCertDir}/root-ca.pem`,
      `cp ${rootCaDir}/root-ca.crt ${serverCertDir}/root-ca.crt`,
    ];

    await exec(commands.join(' && '));
  });

program
  .command('client')
  .description('Create new client certificate')
  .action(async () => {
    log(
      chalk.yellow(
        'Starting to create new client certificate base on selected organization identifier.',
      ),
    );
    const answers = await configClient();

    const { path: intermediateCaDir, name: intermediateName } =
      intermediateList.find((i) => i.name === answers.intermediate);

    const configDir = resolve(`${intermediateCaDir}/..`);
    const rootCaDir = `${configDir}/root`;
    const rootCa = `${rootCaDir}/root-ca.pem`;

    const clientSafeName = safeName(`${answers.CN}.${intermediateName}`);
    const clientCertDir = `${configDir}/clients/${clientSafeName}`;
    await exec([`mkdir -p ${clientCertDir}`].join(' && '));

    const csrPath = `${clientCertDir}/csr-client.json`;

    const csr = JSON.parse(
      await fsp.readFile(`${process.env.PROJECT_PATH}/config/csr-server.json`),
    );

    const intermediateData = JSON.parse(
      await fsp.readFile(`${intermediateCaDir}/csr-intermediate.json`),
    );

    csr.CN = `${answers.CN} (client)`;
    csr.names[0].O = answers.O;
    csr.names[0].C = answers.C;
    csr.names[0].OU = answers.OU;
    csr.names[0].ST = answers.ST;
    csr.names[0].L = answers.L;
    csr.names[0].E = answers.E;
    await fsp.writeFile(csrPath, JSON.stringify(csr, null, 2));

    const csrConfig = JSON.parse(
      await fsp.readFile(`${process.env.PROJECT_PATH}/config/ca-config.json`),
    );

    csrConfig.signing.profiles.client.expiry = `${
      parseInt(answers.EXPIRE, 10) * 30 * 24
    }h`;

    await fsp.writeFile(
      `${clientCertDir}/ca-config.json`,
      JSON.stringify(csrConfig, null, 2),
    );

    const clientPassword = password.randomString({
      length: 16,
      characters: [password.lower, password.upper, password.digits],
    });

    const archivePassword = password.randomString({
      length: 16,
      characters: [password.lower, password.upper, password.digits],
    });

    let commands = [
      `cd ${clientCertDir}`,
      `cfssl gencert -initca ${csrPath} | cfssljson -bare client -`,
      `cfssl sign -ca ${intermediateCaDir}/intermediate-ca.pem -ca-key ${intermediateCaDir}/intermediate-ca-key.pem -config ${clientCertDir}/ca-config.json -profile client client.csr | cfssljson -bare client`,
      `openssl pkcs12 -export -out ${clientCertDir}/client.p12 -in ${clientCertDir}/client.pem -inkey ${clientCertDir}/client-key.pem -passin pass: -passout pass:"${clientPassword}"`,
      'openssl x509 -text -noout -in client.pem > client.info.txt',
      `cp ${rootCa} ${clientCertDir}/root-ca.pem`,
      `cp ${rootCaDir}/root-ca.crt ${clientCertDir}/root-ca.crt`,
    ];

    await exec(commands.join(' && '));

    commands = [`cfssl certinfo -cert ${clientCertDir}/client.pem`];

    const certInfo = await exec(
      `cfssl certinfo -cert ${clientCertDir}/client.pem`,
    );
    const clientCertInfo = JSON.parse(certInfo.stdout);

    let markdown = await fsp.readFile(
      `${process.env.PROJECT_PATH}/config/USER_CERT_README.md`,
    );

    markdown = replaceDocument(markdown, {
      INTERMEDIATE_NAME: intermediateData.CN,
      CLIENT_EMAIL: answers.E,
      CLIENT_NAME: answers.CN,
      PASSWORD: clientPassword,
      EXPIRE_DATE: new Date(clientCertInfo.not_after).toString(),
    });

    let installBat = await fsp.readFile(
      `${process.env.PROJECT_PATH}/config/install.bat`,
    );

    installBat = replaceDocument(installBat, {
      CLIENT_EMAIL: answers.E,
      CLIENT_NAME: answers.CN,
      PASSWORD: clientPassword,
      EXPIRE_DATE: new Date(clientCertInfo.not_after).toString(),
    });

    let installPs1 = await fsp.readFile(
      `${process.env.PROJECT_PATH}/config/install.ps1`,
    );

    installPs1 = replaceDocument(installPs1, {
      CLIENT_EMAIL: answers.E,
      CLIENT_NAME: answers.CN,
      PASSWORD: clientPassword,
      EXPIRE_DATE: new Date(clientCertInfo.not_after).toString(),
    });

    let installShell = await fsp.readFile(
      `${process.env.PROJECT_PATH}/config/install.sh`,
    );

    installShell = replaceDocument(installShell, {
      CLIENT_EMAIL: answers.E,
      CLIENT_NAME: answers.CN,
      PASSWORD: clientPassword,
      EXPIRE_DATE: new Date(clientCertInfo.not_after).toString(),
    });

    fsp.writeFile(`${clientCertDir}/README.md`, markdown);
    fsp.writeFile(`${clientCertDir}/install.bat`, installBat);
    fsp.writeFile(`${clientCertDir}/install.ps1`, installPs1);
    fsp.writeFile(`${clientCertDir}/install.sh`, installShell);

    const pdf = await mdToPdf(
      {
        path: `${clientCertDir}/README.md`,
      },
      {
        css: `
          body { font-family: "Courier New", Courier, monospace !important; font-size: 8px !important; }
          table { width: 100%; font-size: 8px !important; }
        `,
        launch_options: {
          args: ['--no-sandbox'],
        },
        pdf_options: {
          format: 'A4',
          margin: {
            top: '10mm',
            right: '10mm',
            bottom: '10mm',
            left: '10mm',
          },
        },
      },
    );

    fsp.writeFile(`${clientCertDir}/README.pdf`, pdf.content);

    await exec(
      [
        `cd ${clientCertDir}`,
        'rm -rf logo.png',
        'cd ..',
        `rm -rf ${clientSafeName}.7z`,
        `7za a -t7z -mhe=on -mx9 -y -p${archivePassword} -mhe ${clientSafeName}.7z ${clientSafeName}`,
      ].join(' && '),
    );

    log(
      chalk.greenBright(
        `Archive is ready on '${clientCertDir}/${safeName(
          answers.CN,
        )}.7z' and password is '${archivePassword}'`,
      ),
    );
  });

program
  .command('ca-dns-txt')
  .description('Generate base64 for TXT record of domain')
  .action(async () => {
    const answers = await configGetRoot();

    const configDir = `${process.env.PROJECT_PATH}/output/${answers.organizationId}`;
    const rootCaDir = `${configDir}/root`;
    const rootCa = `${rootCaDir}/root-ca.pem`;

    const data = await fsp.readFile(rootCa, { encoding: 'base64' });
    log('='.repeat(80));
    log(data);
    log('='.repeat(80));
    log(chalk.cyan('You can use this command to get root ca from txt record.'));
    log(
      `dig @1.1.1.1 -t txt +short ${answers.fqdn} | sed 's: ::g' | tr -d '\\"' | base64 -d`,
    );
    log('='.repeat(80));
    log(
      `host -s -t txt ${answers.fqdn} | grep -oP "text \\K.*" | sed 's: ::g' | tr -d '\\"' | base64 -d`,
    );
  });

program.parse(process.argv);
