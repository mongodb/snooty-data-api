import { mapDocsetsResponse, RepoResponse } from '../../src/services/docsets';
import { legacyDocsetsApiResponse, newDocsetsApiResponse } from '../sampleData/docsetsApi';

const byProject = (repos: RepoResponse[]) => Object.fromEntries(repos.map((r) => [r.project, r]));

describe('docsets schema mapping', () => {
  const legacy = mapDocsetsResponse(legacyDocsetsApiResponse as any);
  const next = mapDocsetsResponse(newDocsetsApiResponse as any);

  it('sorts projects by project name', () => {
    expect(legacy.map((r) => r.project)).toEqual(['cloud-docs', 'compass', 'node']);
    expect(next.map((r) => r.project)).toEqual(['cloud-docs', 'compass', 'node']);
  });

  it('produces identical output from both layouts, apart from documented defaults', () => {
    // The intended differences: the new schema defaults search.categoryName to
    // the project name, and reports repoName as the project name since the field
    // no longer exists upstream. Compared by value rather than by serialized
    // string: key order within `search` differs between the two paths, which is
    // immaterial to JSON consumers.
    const applyNewSchemaDefaults = (repos: RepoResponse[]) =>
      repos.map((repo) => ({
        ...repo,
        // The new schema has no repoName, so it mirrors the project name.
        repoName: repo.project,
        search: repo.search
          ? { categoryTitle: repo.search.categoryTitle, categoryName: repo.search.categoryName ?? repo.project }
          : undefined,
      }));

    expect(next).toEqual(applyNewSchemaDefaults(legacy));
  });

  describe('fullUrl construction', () => {
    it('omits the version segment for an unversioned project', () => {
      expect(byProject(next)['cloud-docs'].branches[0].fullUrl).toBe('http://mongodb.com/docs/atlas/');
    });

    it('omits the version segment for a single version that carries a name', () => {
      // /docs/compass/current/ is a redirect, not the published URL.
      expect(byProject(next)['compass'].branches[0].fullUrl).toBe('http://mongodb.com/docs/compass/');
      expect(byProject(legacy)['compass'].branches[0].fullUrl).toBe('http://mongodb.com/docs/compass/');
    });

    it('appends the version segment for multi-version projects', () => {
      expect(byProject(next)['node'].branches.map((b) => b.fullUrl)).toEqual([
        'http://mongodb.com/docs/drivers/node/v6.0',
        'http://mongodb.com/docs/drivers/node/v5.0',
      ]);
    });

    it('never appends main or master, even for a multi-version project', () => {
      const [repo] = mapDocsetsResponse([
        {
          project: 'example',
          prefix: 'docs/example',
          url: { dotcomprd: 'http://mongodb.com/', dotcomstg: '' },
          versions: [{ versionName: 'main' }, { versionName: 'v1.0' }],
        },
      ] as any);
      expect(repo.branches.map((b) => b.fullUrl)).toEqual([
        'http://mongodb.com/docs/example/',
        'http://mongodb.com/docs/example/v1.0',
      ]);
    });
  });

  describe('new schema defaults', () => {
    const node = byProject(next)['node'];

    it('defaults active to true', () => {
      expect(node.branches[0].active).toBe(true);
      expect(node.branches[1].active).toBe(false);
    });

    it('defaults label to versionName', () => {
      const [repo] = mapDocsetsResponse([
        {
          project: 'example',
          prefix: 'docs/example',
          url: { dotcomprd: 'http://mongodb.com/', dotcomstg: '' },
          versions: [{ versionName: 'v1.0' }],
        },
      ] as any);
      expect(repo.branches[0].label).toBe('v1.0');
    });

    it('maps stable to isStableBranch as a boolean', () => {
      expect(node.branches.map((b) => b.isStableBranch)).toEqual([true, false]);
    });

    it('defaults search.categoryName to the project name', () => {
      expect(byProject(next)['compass'].search).toEqual({ categoryTitle: 'Compass', categoryName: 'compass' });
    });

    it('leaves search absent when the docset has none', () => {
      const [repo] = mapDocsetsResponse([
        {
          project: 'example',
          prefix: 'docs/example',
          url: { dotcomprd: 'http://mongodb.com/', dotcomstg: '' },
          versions: [{ versionName: 'main' }],
        },
      ] as any);
      expect(repo.search).toBeUndefined();
    });

    it('preserves offlineUrl and omits it when absent', () => {
      expect(node.branches[1].offlineUrl).toBe('https://example.com/node-v5.0.tar.gz');
      expect(JSON.stringify(node.branches[0])).not.toContain('offlineUrl');
    });
  });

  it('emits versionName as gitBranchName, which diverges when the git name differed', () => {
    // The manual's master branch published under urlSlug v7.0. Consumers that keyed
    // off gitBranchName === 'master' will now see 'v7.0'. This is intended by the
    // versionName rule, but it is a visible change for these projects.
    const [legacyDocs] = mapDocsetsResponse([
      {
        project: 'docs',
        internalOnly: false,
        url: { dotcomprd: 'http://mongodb.com/', dotcomstg: '' },
        prefix: { dotcomprd: 'docs', dotcomstg: 'docs' },
        branches: [
          {
            gitBranchName: 'master',
            active: true,
            isStableBranch: true,
            versionSelectorLabel: 'v7.0',
            urlSlug: 'v7.0',
          },
          { gitBranchName: 'v6.0', active: true, isStableBranch: false, versionSelectorLabel: 'v6.0', urlSlug: 'v6.0' },
        ],
      },
    ] as any);
    const [newDocs] = mapDocsetsResponse([
      {
        project: 'docs',
        url: { dotcomprd: 'http://mongodb.com/', dotcomstg: '' },
        prefix: 'docs',
        versions: [
          { versionName: 'v7.0', versionSelectorLabel: 'v7.0', stable: true },
          { versionName: 'v6.0', versionSelectorLabel: 'v6.0' },
        ],
      },
    ] as any);

    expect(legacyDocs.branches[0].gitBranchName).toBe('master');
    expect(newDocs.branches[0].gitBranchName).toBe('v7.0');
    // The URLs, which are what most consumers actually resolve, are unchanged.
    expect(newDocs.branches.map((b) => b.fullUrl)).toEqual(legacyDocs.branches.map((b) => b.fullUrl));
  });
});

describe('legacy feed filtering', () => {
  const mapped = mapDocsetsResponse(legacyDocsetsApiResponse as any);

  it('excludes internal-only projects', () => {
    expect(mapped.find((r) => r.project === 'dop-docs')).toBeUndefined();
  });

  it('excludes docset rows that carry no branches', () => {
    expect(mapped.find((r) => r.project === 'snooty')).toBeUndefined();
  });

  it('keeps every published project', () => {
    expect(mapped.map((r) => r.project)).toEqual(['cloud-docs', 'compass', 'node']);
  });

  it('does not filter new-schema entries, which carry no internalOnly field', () => {
    expect(mapDocsetsResponse(newDocsetsApiResponse as any)).toHaveLength(newDocsetsApiResponse.length);
  });
});

describe('repoName under the new schema', () => {
  it('mirrors the project name, changing the value for most projects', () => {
    const legacy = mapDocsetsResponse(legacyDocsetsApiResponse as any);
    const next = mapDocsetsResponse(newDocsetsApiResponse as any);
    const find = (repos: RepoResponse[], project: string) => repos.find((r) => r.project === project)!;

    // The legacy feed reported the GitHub repo id; the new schema has no such field.
    expect(find(legacy, 'node').repoName).toBe('docs-node');
    expect(find(next, 'node').repoName).toBe('node');
  });

  it('is always present, so consumers reading it never see undefined', () => {
    const next = mapDocsetsResponse(newDocsetsApiResponse as any);
    next.forEach((repo) => expect(repo.repoName).toBe(repo.project));
  });
});

describe('environment resolution', () => {
  const original = process.env.SNOOTY_ENV;
  afterEach(() => {
    if (original === undefined) delete process.env.SNOOTY_ENV;
    else process.env.SNOOTY_ENV = original;
  });

  it('rejects an unknown SNOOTY_ENV instead of emitting "//" urls', () => {
    // "prod" is not a key in the env maps (they use "prd"), which previously
    // resolved to an empty host and produced fullUrls like "//upcoming".
    process.env.SNOOTY_ENV = 'prod';
    expect(() => mapDocsetsResponse(legacyDocsetsApiResponse as any)).toThrow('Invalid SNOOTY_ENV');
  });

  it('resolves staging hosts when SNOOTY_ENV is dotcomstg', () => {
    process.env.SNOOTY_ENV = 'dotcomstg';
    const [first] = mapDocsetsResponse(legacyDocsetsApiResponse as any);
    expect(first.branches[0].fullUrl).toContain('mongodbcom-cdn.website.staging.corp.mongodb.com');
  });

  it('skips entries with no resolvable host rather than emitting "//"', () => {
    const mapped = mapDocsetsResponse([
      ...(legacyDocsetsApiResponse as any),
      {
        project: 'cloud',
        internalOnly: false,
        url: null,
        prefix: null,
        branches: [
          { gitBranchName: 'main', active: true, isStableBranch: true, versionSelectorLabel: 'main', urlSlug: null },
        ],
      },
    ] as any);
    expect(mapped.find((r) => r.project === 'cloud')).toBeUndefined();
    mapped.forEach((r) => r.branches.forEach((b) => expect(b.fullUrl.startsWith('//')).toBe(false)));
  });
});
