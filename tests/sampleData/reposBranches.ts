import { ObjectId } from 'mongodb';

export const sampleReposBranches = [
  {
    _id: new ObjectId('5fc999ce3f17b4e8917e0494'),
    repoName: 'cloud-docs',
    branches: [
      {
        name: 'master',
        publishOriginalBranchName: 'false',
        active: 'true',
        aliases: null,
        gitBranchName: 'master',
        isStableBranch: true,
        urlAliases: null,
        urlSlug: null,
        versionSelectorLabel: 'master',
        buildsWithSnooty: true,
        id: new ObjectId('62e293ce8b1d857926ab4cbc'),
      },
    ],
    bucket: {
      regression: 'docs-atlas-stg',
      dev: 'docs-atlas-dev',
      stg: 'docs-atlas-stg',
      prd: 'docs-atlas-prd',
      dotcomstg: 'docs-atlas-dotcomstg',
      dotcomprd: 'docs-atlas-dotcomprd',
    },
    url: {
      regression: 'https://docs-atlas-integration.mongodb.com',
      dev: 'https://docs-atlas-staging.mongodb.com',
      stg: 'https://docs-atlas-staging.mongodb.com',
      prd: 'https://docs.atlas.mongodb.com',
      dotcomprd: 'http://mongodb.com/',
      dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
    },
    prefix: {
      stg: '',
      prd: '',
      dotcomstg: 'docs/atlas',
      dotcomprd: 'docs/atlas',
    },
    project: 'cloud-docs',
    search: {
      categoryName: 'atlas',
      categoryTitle: 'Atlas',
    },
  },
  {
    _id: new ObjectId('5f6aaeb682989d521a60636a'),
    repoName: 'docs-landing',
    branches: [
      {
        name: 'master',
        publishOriginalBranchName: false,
        active: true,
        aliases: null,
        gitBranchName: 'master',
        isStableBranch: false,
        urlAliases: null,
        urlSlug: null,
        versionSelectorLabel: 'master',
        buildsWithSnooty: true,
        id: new ObjectId('62e293ce8b1d857926ab4c69'),
      },
    ],
    bucket: {
      regression: 'docs-mongodb-org-stg',
      dev: 'docs-mongodb-org-dev',
      stg: 'docs-mongodb-org-stg',
      prd: 'docs-mongodb-org-prd',
      dotcomstg: 'docs-mongodb-org-dotcomstg',
      dotcomprd: 'docs-mongodb-org-dotcomprd',
    },
    url: {
      regression: 'https://docs-mongodbcom-integration.corp.mongodb.com',
      dev: 'https://docs-mongodborg-staging.corp.mongodb.com',
      stg: 'https://docs-mongodborg-staging.corp.mongodb.com',
      prd: 'https://docs.mongodb.com',
      dotcomprd: 'http://mongodb.com/',
      dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
    },
    prefix: {
      stg: '/',
      prd: '/',
      dotcomstg: 'docs',
      dotcomprd: 'docs',
    },
    project: 'landing',
  },
  {
    _id: new ObjectId('5fac1ce373a72fca02ec90c5'),
    repoName: 'docs',
    branches: [
      {
        id: new ObjectId('6447e9e7e033e0a801c80f56'),
        gitBranchName: 'master',
        active: true,
        urlAliases: ['v7.0', 'upcoming'],
        publishOriginalBranchName: false,
        urlSlug: 'v7.0',
        versionSelectorLabel: '7.0 (upcoming)',
        isStableBranch: false,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('636e7eb5dd1d7476362b4a95'),
        gitBranchName: 'v6.3',
        active: true,
        urlAliases: ['v6.3', 'rapid'],
        publishOriginalBranchName: false,
        urlSlug: 'v6.3',
        versionSelectorLabel: '6.3 (current)',
        isStableBranch: false,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('63ea94c7a80edc11445a8021'),
        gitBranchName: 'v6.2',
        active: false,
        urlAliases: [],
        publishOriginalBranchName: true,
        urlSlug: 'v6.2',
        versionSelectorLabel: '6.2',
        isStableBranch: false,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c90'),
        gitBranchName: 'v6.0',
        active: true,
        urlAliases: ['current', 'stable', 'manual'],
        publishOriginalBranchName: true,
        urlSlug: 'v6.0',
        versionSelectorLabel: '6.0 (current)',
        isStableBranch: true,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c8f'),
        gitBranchName: 'v5.0',
        active: true,
        urlAliases: [],
        publishOriginalBranchName: true,
        urlSlug: 'v5.0',
        versionSelectorLabel: '5.0',
        isStableBranch: false,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c8c'),
        gitBranchName: 'v4.4',
        active: true,
        urlAliases: null,
        publishOriginalBranchName: true,
        urlSlug: 'v4.4',
        versionSelectorLabel: '4.4',
        isStableBranch: false,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c8d'),
        gitBranchName: 'v4.2',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: 'v4.2',
        versionSelectorLabel: '4.2',
        isStableBranch: false,
        buildsWithSnooty: false,
      },
      {
        id: new ObjectId('6414a83fe033e0a801c80f0f'),
        gitBranchName: 'v6.1',
        active: false,
        urlAliases: [],
        publishOriginalBranchName: true,
        urlSlug: 'v6.1',
        versionSelectorLabel: 'v6.1',
        isStableBranch: false,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('636e7eb5dd1d7476362b4a94'),
        gitBranchName: 'v5.3',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: 'v5.3',
        versionSelectorLabel: 'v5.3',
        isStableBranch: null,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('636e7eb5dd1d7476362b4a93'),
        gitBranchName: 'v5.2',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: 'v5.2',
        versionSelectorLabel: 'v5.2',
        isStableBranch: null,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('636e7eb5dd1d7476362b4a92'),
        gitBranchName: 'v5.1',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: 'v5.1',
        versionSelectorLabel: 'v5.1',
        isStableBranch: null,
        buildsWithSnooty: true,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c8e'),
        gitBranchName: 'v4.0',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: 'v4.0',
        versionSelectorLabel: 'v4.0',
        isStableBranch: null,
        buildsWithSnooty: false,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c91'),
        gitBranchName: '3.6',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: '3.6',
        versionSelectorLabel: '3.6',
        isStableBranch: null,
        buildsWithSnooty: false,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c92'),
        gitBranchName: '3.4',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: '3.4',
        versionSelectorLabel: '3.4',
        isStableBranch: null,
        buildsWithSnooty: false,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c94'),
        gitBranchName: '3.2',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: '3.2',
        versionSelectorLabel: '3.2',
        isStableBranch: null,
        buildsWithSnooty: false,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c97'),
        gitBranchName: '3.0',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: '3.0',
        versionSelectorLabel: '3.0',
        isStableBranch: null,
        buildsWithSnooty: false,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c96'),
        gitBranchName: '2.6',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: '2.6',
        versionSelectorLabel: '2.6',
        isStableBranch: null,
        buildsWithSnooty: false,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c93'),
        gitBranchName: '2.4',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: '2.4',
        versionSelectorLabel: '2.4',
        isStableBranch: null,
        buildsWithSnooty: false,
      },
      {
        id: new ObjectId('62e293ce8b1d857926ab4c95'),
        gitBranchName: '2.2',
        active: false,
        urlAliases: null,
        publishOriginalBranchName: null,
        urlSlug: '2.2',
        versionSelectorLabel: '2.2',
        isStableBranch: null,
        buildsWithSnooty: false,
      },
    ],
    bucket: {
      regression: 'docs-mongodb-org-stg',
      dev: 'docs-mongodb-org-dev',
      stg: 'docs-mongodb-org-stg',
      prd: 'docs-mongodb-org-prd',
      dotcomstg: 'docs-mongodb-org-dotcomstg',
      dotcomprd: 'docs-mongodb-org-dotcomprd',
    },
    url: {
      regression: 'https://docs-mongodbcom-integration.corp.mongodb.com',
      dev: 'https://docs-mongodborg-staging.corp.mongodb.com',
      stg: 'https://docs-mongodborg-staging.corp.mongodb.com',
      prd: 'https://docs.mongodb.com',
      dotcomprd: 'http://mongodb.com',
      dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com',
    },
    prefix: {
      stg: '',
      prd: '',
      dotcomstg: 'docs',
      dotcomprd: 'docs',
    },
    project: 'docs',
    groups: [
      {
        id: new ObjectId('62e293ce8b1d857926ab4c98'),
        groupLabel: 'Major Release',
        includedBranches: ['master', 'v6.0', 'v5.0', 'v4.4'],
      },
      {
        id: new ObjectId('63ea94b5a80edc11445a801f'),
        groupLabel: 'Rapid Release',
        includedBranches: ['v6.3'],
      },
    ],
    search: {
      categoryName: 'manual',
      categoryTitle: 'MongoDB Server',
    },
  },
  {
    _id: new ObjectId('614b9f5b8d181382ca755ade'),
    repoName: 'docs-mongodb-internal',
    branches: [
      {
        id: new ObjectId('62e293ce8b1d857926ab4cca'),
        gitBranchName: 'v5.0',
        active: true,
        urlAliases: ['stable'],
        publishOriginalBranchName: true,
        urlSlug: 'stable',
        versionSelectorLabel: 'v5.0',
        isStableBranch: false,
        buildsWithSnooty: true,
      },
    ],
    bucket: {
      regression: 'docs-mongodb-org-stg',
      dev: 'docs-mongodb-org-dev',
      stg: 'docs-mongodb-org-stg',
      prd: 'docs-mongodb-org-prd',
      dotcomstg: 'docs-mongodb-org-dotcomstg',
      dotcomprd: 'docs-mongodb-org-dotcomprd',
    },
    url: {
      regression: 'https://docs-mongodbcom-integration.corp.mongodb.com',
      dev: 'https://docs-mongodborg-staging.corp.mongodb.com',
      stg: 'https://docs-mongodborg-staging.corp.mongodb.com',
      prd: 'https://docs.mongodb.com',
      dotcomprd: 'http://mongodb.com/',
      dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
    },
    prefix: {
      stg: '',
      prd: '',
      dotcomstg: 'docs',
      dotcomprd: 'docs',
    },
    project: 'docs',
    groups: null,
  },
];