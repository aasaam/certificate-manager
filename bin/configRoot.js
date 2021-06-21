const inquirer = require('inquirer');
const { Organization } = require('@aasaam/information');

const password = require('secure-random-password');

const { safeName } = require('./functions');

const questions = [
  {
    type: 'input',
    name: 'organizationId',
    message: "What's your identifier?",
    default: safeName(Organization.en.legalName),
    validate(value) {
      const pass = value.match(/^[a-z][a-z0-9_]{1,30}[a-z]$/);
      if (pass) {
        return true;
      }

      return 'Please enter a valid identifier like `aasaam`';
    },
  },
  {
    type: 'input',
    name: 'rootCAPassword',
    message: "What's your root ca password?",
    default: password.randomString({
      length: 32,
      characters: [password.lower, password.upper, password.digits],
    }),
    validate(value) {
      if (value.length >= 32 && value.match(/^[a-zA-Z0-9]{32,64}$/)) {
        return true;
      }

      return 'Please use strong password at least 32 character using `a-zA-Z0-9`.';
    },
  },
  {
    type: 'input',
    name: 'Name',
    message: "What's your name?",
    default: Organization.en.name,
  },
  {
    type: 'input',
    name: 'O',
    message: "What's your organization name?",
    default: Organization.en.legalName,
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
    name: 'expiryInYear',
    message: "What's your root expiry in years?",
    default: '30',
    validate(value) {
      const year = parseInt(value, 10);
      if (year >= 2 && year <= 100) {
        return true;
      }

      return 'Please enter a valid year (Between 2-100 year)';
    },
  },
];

module.exports = async () => await inquirer.prompt(questions);
