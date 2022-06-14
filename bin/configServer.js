const fs = require('fs');
const { resolve } = require('path');

const ip = require('ip');
const IpCidr = require('ip-cidr');
const { uniq } = require('lodash');
const inquirer = require('inquirer');

const outputDir = resolve(`${process.env.PROJECT_PATH}/output`);

const intermediateList = [];
fs.readdirSync(outputDir).forEach((f) => {
  const filePath = `${outputDir}/${f}`;
  if (fs.statSync(filePath).isDirectory()) {
    fs.readdirSync(filePath).forEach((f2) => {
      const filePath2 = `${filePath}/${f2}`;
      if (
        filePath2.match(/intermediate/) &&
        fs.statSync(filePath2).isDirectory()
      ) {
        intermediateList.push({
          path: filePath2,
          name: filePath2.replace(`${outputDir}/`, '').split('/').join(': '),
        });
      }
    });
  }
});

const questions = [
  {
    type: 'list',
    name: 'intermediate',
    message: 'Select your intermediate?',
    choices: intermediateList.map((o) => o.name),
  },
  {
    type: 'input',
    name: 'O',
    message: "What's your organization name?",
    validate(value) {
      const pass = value.match(/^[a-z][\s\-_a-z0-9]+[a-z]$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid state/province (e.g. `Sample Organization`)';
    },
  },
  {
    type: 'input',
    name: 'CN',
    message: "What's your certificate common name (title)?",
    default: 'Infrastructure',
  },
  {
    type: 'input',
    name: 'C',
    message: "What's your country code?",
    default: 'IR',
    validate(value) {
      const pass = value.match(/^[A-Z]{2}$/);
      if (pass) {
        return true;
      }

      return 'Please enter a valid country code (e.g. `IR`)';
    },
  },
  {
    type: 'input',
    name: 'ST',
    message: "What's your state/province?",
    default: 'Tehran',
    validate(value) {
      const pass = value.match(/^[a-z][\s\-_a-z0-9]+[a-z]$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid state/province (e.g. `Tehran`)';
    },
  },
  {
    type: 'input',
    name: 'L',
    message: "What's your city/town?",
    default: 'Tehran',
    validate(value) {
      const pass = value.match(/^[a-z][\s\-_a-z0-9]+[a-z]$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid city/town (e.g. `Tehran`)';
    },
  },
  {
    type: 'input',
    name: 'OU',
    message: "What's your unit?",
    default: 'IT Department',
    validate(value) {
      const pass = value.match(/^[a-z][\s\-_a-z0-9]+[a-z]$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid unit (e.g. `DevOps`)';
    },
  },
  {
    type: 'input',
    name: 'dnsIps',
    message: "What's your IP(s) for certificate? [comma separated]",
    validate(value) {
      if (value === '') {
        return true;
      }
      const list = uniq(
        value
          .trim()
          .split(',')
          .map((d) => d.trim().toLocaleLowerCase()),
      );
      let valid = true;
      list.forEach((i) => {
        if (!ip.isV4Format(i)) {
          valid = false;
        }
      });
      if (valid) {
        return true;
      }

      return 'Please enter a valid IP(s) address (e.g. `127.0.0.1` or `127.0.0.1,192.168.1.1`)';
    },
  },
  {
    type: 'input',
    name: 'dnsRangeIps',
    message: "What's your range IP(s) for certificate? [comma separated]",
    validate(value) {
      if (value === '') {
        return true;
      }
      const list = uniq(
        value
          .trim()
          .split(',')
          .map((d) => d.trim().toLocaleLowerCase()),
      );
      let valid = true;
      list.forEach((i) => {
        const cidr = new IpCidr(i);
        if (cidr.size < 1 || cidr.size > 16777216) {
          valid = false;
        }
      });
      if (valid) {
        return true;
      }

      return 'Please enter a valid range IP(s) address (e.g. `127.0.0.1/8` or `127.0.0.1/8,192.168.0.0/16`)';
    },
  },
  {
    type: 'input',
    name: 'dnsDomains',
    message: "What's your domain for wildcard certificate? [comma separated]",
    validate(value) {
      if (value === '') {
        return true;
      }
      const domainList = uniq(
        value
          .trim()
          .split(',')
          .map((d) => d.trim().toLocaleLowerCase()),
      );
      const validDomains = [];
      domainList.forEach((domain) => {
        try {
          const u = new URL(`http://${domain}`);
          validDomains.push(u.hostname);
          // eslint-disable-next-line no-empty
        } catch (e) {}
      });
      if (validDomains.length >= 1) {
        return true;
      }

      return 'Please enter a valid domain (e.g. `127.0.0.1/8`)';
    },
  },
  {
    type: 'input',
    name: 'EXPIRE',
    message: 'Default expire month?',
    default: '12',
    validate(value) {
      const pass = value.match(/^[0-9]{1,2}$/i);
      if (pass) {
        const passInt = parseInt(pass, 10);
        if (passInt >= 6 && passInt <= 60) {
          return true;
        }
      }

      return 'Please enter a valid month between 6 to 60.';
    },
  },
];

module.exports = {
  prompt: async () => await inquirer.prompt(questions),
  list: intermediateList,
};
