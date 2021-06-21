const { snakeCase, replace } = require('lodash');

const { Organization } = require('@aasaam/information');

const safeName = (name) =>
  snakeCase(
    name
      .toLocaleLowerCase()
      .replace(/[^a-z0-9]/g, ' ')
      .trim(),
  );

const replaceDocument = (doc, params) => {
  let markdown = doc;
  markdown = replace(markdown, /INTERMEDIATE_NAME/g, params.INTERMEDIATE_NAME);
  markdown = replace(markdown, /CLIENT_EMAIL/g, params.CLIENT_EMAIL);
  markdown = replace(markdown, /CLIENT_NAME/g, params.CLIENT_NAME);
  markdown = replace(markdown, /PASSWORD/g, params.PASSWORD);
  markdown = replace(
    markdown,
    /EXPIRE_DATE/g,
    new Date(params.EXPIRE_DATE).toString(),
  );
  markdown = replace(markdown, /DATE/g, new Date().toString());
  markdown = replace(markdown, /PROVIDER_NAME/g, Organization.en.legalName);
  markdown = replace(markdown, /PROVIDER_WEBSITE/g, Organization.en.url);
  markdown = replace(markdown, /PROVIDER_TEL/g, Organization.en.telephone);
  markdown = replace(markdown, /PROVIDER_EMAIL/g, Organization.en.email);

  return markdown;
};

module.exports = {
  safeName,
  replaceDocument,
};
