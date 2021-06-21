const validator = require('validator');
const fs = require('fs');
const { resolve } = require('path');

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
    message: "What's your department name?",
    default: 'IT Office',
    validate(value) {
      const pass = value.match(/^[a-z][\s\-_a-z0-9]+[a-z]$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid name (e.g. `IT Office`)';
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

      return 'Please enter a valid organization country code (e.g. `IR`)';
    },
  },
  {
    type: 'input',
    name: 'ST',
    message: "What's your organization state/province?",
    default: 'Tehran',
    validate(value) {
      const pass = value.match(/^[a-z][\s\-_a-z0-9]+[a-z]$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid organization state/province (e.g. `Tehran`)';
    },
  },
  {
    type: 'input',
    name: 'L',
    message: "What's your organization city/town?",
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
    message: "What's your organization unit?",
    default: 'IT Department',
    validate(value) {
      const pass = value.match(/^[a-z][\s\-_a-z0-9]+[a-z]$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid organization unit (e.g. `IT Department`)';
    },
  },
  {
    type: 'input',
    name: 'CN',
    message:
      "What's your client certificate common name (eg: 'John Smith' or 'IT Manager')?",
    default: 'IT Manager',
    validate(value) {
      const pass = value.match(/^[a-z][\s\-_a-z0-9]+[a-z]$/i);
      if (pass) {
        return true;
      }

      return 'Please enter a valid client certificate common name (e.g. `First Last`)';
    },
  },
  {
    type: 'input',
    name: 'E',
    message: "What's your client email?",
    validate(value) {
      if (validator.isEmail(value)) {
        return true;
      }

      return 'Please enter a valid client email (e.g. `it@example.tld`)';
    },
  },
  {
    type: 'input',
    name: 'EXPIRE',
    message: 'Default expire month?',
    default: '6',
    validate(value) {
      const pass = value.match(/^[0-9]{1,2}$/i);
      if (pass) {
        const passInt = parseInt(pass, 10);
        if (passInt >= 1 && passInt <= 24) {
          return true;
        }
      }

      return 'Please enter a valid month between 1 to 24.';
    },
  },
];

module.exports = async () => await inquirer.prompt(questions);
