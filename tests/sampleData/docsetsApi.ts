/**
 * Fixtures for the Next.js docsets API, in both the legacy (repos_branches +
 * docsets) layout it serves today and the new (platform/versioning) layout it
 * will serve after the migration.
 *
 * The two arrays describe the same published projects, so mapping either one
 * must produce the same /projects response -- with the single documented
 * exception noted in docsets.test.ts.
 */

const DOTCOM_URL = {
  dotcomprd: 'http://mongodb.com/',
  dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
};

export const legacyDocsetsApiResponse = [
  {
    repoName: 'cloud-docs',
    displayName: 'MongoDB Atlas',
    project: 'cloud-docs',
    internalOnly: false,
    url: DOTCOM_URL,
    prefix: { dotcomstg: 'docs/atlas', dotcomprd: 'docs/atlas' },
    search: { categoryName: 'atlas', categoryTitle: 'Atlas' },
    branches: [
      {
        gitBranchName: 'master',
        active: true,
        isStableBranch: true,
        versionSelectorLabel: 'master',
        urlSlug: null,
      },
    ],
  },
  {
    // Single version carrying a real slug: the slug must NOT appear in fullUrl.
    repoName: 'docs-compass',
    displayName: 'MongoDB Compass',
    project: 'compass',
    internalOnly: false,
    url: DOTCOM_URL,
    prefix: { dotcomstg: 'docs/compass', dotcomprd: 'docs/compass' },
    search: { categoryTitle: 'Compass' },
    branches: [
      {
        gitBranchName: 'current',
        active: true,
        isStableBranch: true,
        versionSelectorLabel: 'Latest',
        urlSlug: 'current',
      },
    ],
  },
  {
    // Multi-version: slugs are appended. gitBranchName === urlSlug here, so the
    // legacy and new mappings agree; docsets.test.ts covers the divergent case.
    repoName: 'docs-node',
    displayName: 'Node.js Driver',
    project: 'node',
    internalOnly: false,
    url: DOTCOM_URL,
    prefix: { dotcomstg: 'docs/drivers/node', dotcomprd: 'docs/drivers/node' },
    search: { categoryTitle: 'Node.js Driver' },
    branches: [
      {
        gitBranchName: 'v6.0',
        active: true,
        isStableBranch: true,
        versionSelectorLabel: '6.0 (current)',
        urlSlug: 'v6.0',
      },
      {
        gitBranchName: 'v5.0',
        active: false,
        isStableBranch: false,
        versionSelectorLabel: '5.0',
        urlSlug: 'v5.0',
        eol_type: 'download' as const,
        noIndexing: null,
        offlineUrl: 'https://example.com/node-v5.0.tar.gz',
      },
    ],
  },
  {
    // Filtered out: the live legacy feed still serves internal-only projects.
    repoName: 'dop-docs',
    displayName: 'DOP Docs',
    project: 'dop-docs',
    internalOnly: true,
    url: DOTCOM_URL,
    prefix: { dotcomstg: 'docs/dop', dotcomprd: 'docs/dop' },
    branches: [
      {
        gitBranchName: 'master',
        active: true,
        isStableBranch: true,
        versionSelectorLabel: 'master',
        urlSlug: null,
      },
    ],
  },
  {
    // Filtered out: docset rows with no branches were never in the old response.
    project: 'snooty',
    displayName: 'Snooty',
    url: DOTCOM_URL,
    prefix: { dotcomstg: 'docs/snooty', dotcomprd: 'docs/snooty' },
  },
];

/** The published subset of the above, expressed in the new schema. */
export const newDocsetsApiResponse = [
  {
    displayName: 'MongoDB Atlas',
    project: 'cloud-docs',
    url: DOTCOM_URL,
    prefix: 'docs/atlas',
    search: { categoryTitle: 'Atlas', categoryName: 'atlas' },
    versions: [{ versionName: 'master', versionSelectorLabel: 'master', stable: true }],
  },
  {
    displayName: 'MongoDB Compass',
    project: 'compass',
    url: DOTCOM_URL,
    prefix: 'docs/compass',
    // categoryName omitted: it must default to the project name.
    search: { categoryTitle: 'Compass' },
    versions: [{ versionName: 'current', versionSelectorLabel: 'Latest', stable: true }],
  },
  {
    displayName: 'Node.js Driver',
    project: 'node',
    url: DOTCOM_URL,
    prefix: 'docs/drivers/node',
    search: { categoryTitle: 'Node.js Driver' },
    versions: [
      // `active` omitted: it must default to true.
      { versionName: 'v6.0', versionSelectorLabel: '6.0 (current)', stable: true },
      {
        versionName: 'v5.0',
        active: false,
        versionSelectorLabel: '5.0',
        eolType: 'download' as const,
        offlineUrl: 'https://example.com/node-v5.0.tar.gz',
      },
    ],
  },
];
