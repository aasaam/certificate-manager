const fs = require('fs');
const { resolve, basename } = require('path');

const inquirer = require('inquirer');

const outputDir = resolve(`${process.env.PROJECT_PATH}/output`);

const { Organization } = require('@aasaam/information');

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
    name: 'rootCAPassword',
    message: "What's your root ca password?",
    validate(value) {
      if (value.length >= 32 && value.match(/^[a-zA-Z0-9]{32,64}$/)) {
        return true;
      }

      return 'Please use strong password at least 32 character using `a-zA-Z0-9`.';
    },
  },
  {
    type: 'input',
    name: 'O',
    message: "What's your organization name?",
    default: Organization.en.legalName,
  },
  {
    type: 'input',
    name: 'forOrganization',
    message: "What's your target organization?",
    default: Organization.en.description,
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
    default: 'Infrastructure',
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
    name: 'EXPIRE',
    message: 'Default expire month?',
    default: '24',
    validate(value) {
      const pass = value.match(/^[0-9]{1,3}$/i);
      if (pass) {
        const passInt = parseInt(pass, 10);
        if (passInt >= 3 && passInt <= 240) {
          return true;
        }
      }

      return 'Please enter a valid month between 3 to 240.';
    },
  },
];

module.exports = async () => await inquirer.prompt(questions);
