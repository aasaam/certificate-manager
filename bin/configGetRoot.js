const fs = require('fs');
const { resolve, basename } = require('path');

const validator = require('validator').default;

const inquirer = require('inquirer');

const outputDir = resolve(`${process.env.PROJECT_PATH}/output`);

const organizations = [];
fs.readdirSync(outputDir).forEach((f) => {
  const filePath = `${outputDir}/${f}`;
  if (fs.statSync(filePath).isDirectory()) {
    organizations.push(basename(filePath));
  }
});

const questions = [
  {
    type: 'list',
    name: 'organizationId',
    message: 'Select your identifier?',
    choices: organizations,
  },
  {
    type: 'input',
    name: 'fqdn',
    message: "What's your txt domain name (ca.example.tld)?",
    validate(value) {
      if (validator.isFQDN(value)) {
        return true;
      }

      return 'Domain must be valid like (ca.example.tld)';
    },
  },
];

module.exports = async () => await inquirer.prompt(questions);
