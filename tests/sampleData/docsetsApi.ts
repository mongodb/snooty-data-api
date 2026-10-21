/**
 * Fixtures for the Next.js docsets API (the platform/versioning layout).
 */

const DOTCOM_URL = {
  dotcomprd: 'http://mongodb.com/',
  dotcomstg: 'https://mongodbcom-cdn.website.staging.corp.mongodb.com/',
};

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
    // Single version carrying a real slug: the name must NOT appear in fullUrl.
    displayName: 'MongoDB Compass',
    project: 'compass',
    url: DOTCOM_URL,
    prefix: 'docs/compass',
    // categoryName omitted: it must default to the project name.
    search: { categoryTitle: 'Compass' },
    versions: [{ versionName: 'current', versionSelectorLabel: 'Latest', stable: true }],
  },
  {
    // Multi-version: version names are appended.
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
  {
    // Filtered out: internalOnly is retained in the schema, so the listing
    // excludes these entries.
    displayName: 'DOP Docs',
    project: 'dop-docs',
    internalOnly: true,
    url: DOTCOM_URL,
    prefix: 'docs/dop',
    versions: [{ versionName: 'main', versionSelectorLabel: 'main', stable: true }],
  },
  {
    // Filtered out: an entry with no versions array is bad data, not a docset.
    project: 'snooty',
    displayName: 'Snooty',
    url: DOTCOM_URL,
    prefix: 'docs/snooty',
  },
];

/** The subset of the above that should survive filtering. */
export const newDocsetsApiPublishedProjects = ['cloud-docs', 'compass', 'node'];
