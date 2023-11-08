import { ObjectId } from 'mongodb';

export const sampleDocsets = [
  {
    _id: new ObjectId('6500937d24fcc731b4735c9a'),
    project: 'cloud-docs',
    bucket: {
      regression: 'docs-atlas-stg',
      dev: 'docs-atlas-dev',
      stg: 'docs-atlas-stg',
      prd: 'docs-atlas-prd',
      dotcomstg: 'docs-atlas-dotcomstg',
      dotcomprd: 'docs-atlas-dotcomprd',
    },
    directories: {
      snooty_toml: '/cloud-docs',
    },
    prefix: {
      stg: '',
      prd: '',
      dotcomstg: 'docs-qa/atlas',
      dotcomprd: 'docs-qa/atlas',
    },
    repos: [new ObjectId('5fc999ce3f17b4e8917e0494'), new ObjectId('651ee0dd723f30893f27583f')],
    url: {
      regression: 'https://docs-atlas-integration.mongodb.com',
      dev: 'https://docs-atlas-staging.mongodb.com',
      stg: 'https://docs-atlas-staging.mongodb.com',
      prd: 'https://docs.atlas.mongodb.com',
      dotcomprd: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
      dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
    },
  },
  {
    _id: new ObjectId('6500937e24fcc731b4735d8b'),
    project: 'landing',
    bucket: {
      regression: 'docs-mongodb-org-stg',
      dev: 'docs-mongodb-org-dev',
      stg: 'docs-mongodb-org-stg',
      prd: 'docs-mongodb-org-prd',
      dotcomstg: 'docs-mongodb-org-dotcomstg',
      dotcomprd: 'docs-mongodb-org-dotcomprd',
    },
    directories: {
      snooty_toml: '/docs-landing',
    },
    prefix: {
      stg: '/',
      prd: '/',
      dotcomstg: 'docs-qa',
      dotcomprd: 'docs-qa',
    },
    repos: [new ObjectId('5f6aaeb682989d521a60636a'), new ObjectId('651ee377723f30893f275842')],
    url: {
      regression: 'https://docs-mongodbcom-integration.corp.mongodb.com',
      dev: 'https://docs-mongodborg-staging.corp.mongodb.com',
      stg: 'https://docs-mongodborg-staging.corp.mongodb.com',
      prd: 'https://docs.mongodb.com',
      dotcomprd: 'http://mongodb.com/',
      dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
    },
  },
  {
    _id: new ObjectId('6500937d24fcc731b4735cff'),
    project: 'docs',
    bucket: {
      regression: 'docs-mongodb-org-stg',
      dev: 'docs-mongodb-org-dev',
      stg: 'docs-mongodb-org-stg',
      prd: 'docs-mongodb-org-prd',
      dotcomstg: 'docs-mongodb-org-dotcomstg',
      dotcomprd: 'docs-mongodb-org-dotcomprd',
    },
    directories: {
      snooty_toml: '/docs',
    },
    prefix: {
      stg: '',
      prd: '',
      dotcomstg: 'docs-qa',
      dotcomprd: 'docs',
    },
    repos: [new ObjectId('5fac1ce373a72fca02ec90c5'), new ObjectId('614b9f5b8d181382ca755ade')],
    url: {
      regression: 'https://docs-mongodbcom-integration.corp.mongodb.com',
      dev: 'https://docs-mongodborg-staging.corp.mongodb.com',
      stg: 'https://docs-mongodborg-staging.corp.mongodb.com',
      prd: 'https://docs.mongodb.com',
      dotcomprd: 'http://mongodb.com/',
      dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
    },
  },
];
