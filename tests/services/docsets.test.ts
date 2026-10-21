import { mapDocsetsResponse, RepoResponse } from '../../src/services/docsets';
import { newDocsetsApiResponse, newDocsetsApiPublishedProjects } from '../sampleData/docsetsApi';

const byProject = (repos: RepoResponse[]) => Object.fromEntries(repos.map((r) => [r.project, r]));

describe('docsets schema mapping', () => {
  const mapped = mapDocsetsResponse(newDocsetsApiResponse as any);

  it('sorts projects by project name', () => {
    expect(mapped.map((r) => r.project)).toEqual(['cloud-docs', 'compass', 'node']);
  });

  describe('fullUrl construction', () => {
    it('omits the version segment for an unversioned project', () => {
      expect(byProject(mapped)['cloud-docs'].branches[0].fullUrl).toBe('http://mongodb.com/docs/atlas/');
    });

    it('omits the version segment for a single version that carries a name', () => {
      // /docs/compass/current/ is a redirect, not the published URL.
      expect(byProject(mapped)['compass'].branches[0].fullUrl).toBe('http://mongodb.com/docs/compass/');
    });

    it('appends the version segment for multi-version projects', () => {
      expect(byProject(mapped)['node'].branches.map((b) => b.fullUrl)).toEqual([
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

  describe('schema defaults', () => {
    const node = byProject(mapped)['node'];

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
      expect(byProject(mapped)['compass'].search).toEqual({ categoryTitle: 'Compass', categoryName: 'compass' });
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

  it('emits versionName as gitBranchName', () => {
    // The manual's master branch published under urlSlug v7.0, so versionName is
    // v7.0. Consumers that keyed off gitBranchName === 'master' see 'v7.0'. This is
    // intended by the versionName rule, but it is a visible change for these
    // projects. The URLs, which are what most consumers actually resolve, are
    // unchanged from what the old listing served.
    const [docs] = mapDocsetsResponse([
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

    expect(docs.branches.map((b) => b.gitBranchName)).toEqual(['v7.0', 'v6.0']);
    expect(docs.branches.map((b) => b.fullUrl)).toEqual([
      'http://mongodb.com/docs/v7.0',
      'http://mongodb.com/docs/v6.0',
    ]);
  });
});

describe('feed filtering', () => {
  const mapped = mapDocsetsResponse(newDocsetsApiResponse as any);

  it('excludes internal-only projects', () => {
    expect(mapped.find((r) => r.project === 'dop-docs')).toBeUndefined();
  });

  it('excludes entries that carry no versions', () => {
    expect(mapped.find((r) => r.project === 'snooty')).toBeUndefined();
  });

  it('keeps every published project', () => {
    expect(mapped.map((r) => r.project)).toEqual(newDocsetsApiPublishedProjects);
  });

  it('treats an absent internalOnly as public', () => {
    const [repo] = mapDocsetsResponse([
      {
        project: 'example',
        prefix: 'docs/example',
        url: { dotcomprd: 'http://mongodb.com/', dotcomstg: '' },
        versions: [{ versionName: 'main' }],
      },
    ] as any);
    expect(repo.project).toBe('example');
  });

  it('excludes entries only when internalOnly is exactly true', () => {
    // Note /api/search-mapping deliberately does NOT filter internalOnly.
    const filtered = mapDocsetsResponse([
      {
        project: 'explicit-false',
        internalOnly: false,
        prefix: 'docs/a',
        url: { dotcomprd: 'http://mongodb.com/', dotcomstg: '' },
        versions: [{ versionName: 'main' }],
      },
      {
        project: 'explicit-true',
        internalOnly: true,
        prefix: 'docs/b',
        url: { dotcomprd: 'http://mongodb.com/', dotcomstg: '' },
        versions: [{ versionName: 'main' }],
      },
    ] as any);
    expect(filtered.map((r) => r.project)).toEqual(['explicit-false']);
  });
});

describe('repoName', () => {
  const mapped = mapDocsetsResponse(newDocsetsApiResponse as any);

  it('mirrors the project name, changing the value for most projects', () => {
    // The old listing reported the GitHub repo id (e.g. "docs-node"); the schema
    // has no such field.
    expect(mapped.find((r) => r.project === 'node')!.repoName).toBe('node');
  });

  it('is always present, so consumers reading it never see undefined', () => {
    mapped.forEach((repo) => expect(repo.repoName).toBe(repo.project));
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
    expect(() => mapDocsetsResponse(newDocsetsApiResponse as any)).toThrow('Invalid SNOOTY_ENV');
  });

  it('resolves staging hosts when SNOOTY_ENV is dotcomstg', () => {
    process.env.SNOOTY_ENV = 'dotcomstg';
    const [first] = mapDocsetsResponse(newDocsetsApiResponse as any);
    expect(first.branches[0].fullUrl).toContain('mongodbcom-cdn.website.staging.corp.mongodb.com');
  });

  it('skips entries with no resolvable host rather than emitting "//"', () => {
    const mapped = mapDocsetsResponse([
      ...(newDocsetsApiResponse as any),
      {
        project: 'cloud',
        internalOnly: false,
        url: null,
        prefix: null,
        versions: [{ versionName: 'main', versionSelectorLabel: 'main', stable: true }],
      },
    ] as any);
    expect(mapped.find((r) => r.project === 'cloud')).toBeUndefined();
    mapped.forEach((r) => r.branches.forEach((b) => expect(b.fullUrl.startsWith('//')).toBe(false)));
  });
});
