import { findAllRepos, _resetDocsetsCache } from '../../src/services/docsets';
import { newDocsetsApiResponse } from '../sampleData/docsetsApi';

const okResponse = (body: unknown) => ({ ok: true, status: 200, statusText: 'OK', json: async () => body });

describe('docsets caching', () => {
  const fetchMock = jest.fn();

  beforeAll(() => {
    process.env.DOCSETS_API_URL = 'https://example.com/docs/api/docsets';
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  beforeEach(() => {
    fetchMock.mockReset();
    _resetDocsetsCache();
  });

  it('fetches once and serves the cache on subsequent calls', async () => {
    fetchMock.mockResolvedValue(okResponse(newDocsetsApiResponse));
    const first = await findAllRepos();
    const second = await findAllRepos();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(second).toEqual(first);
  });

  it('accepts both a bare array and a { data } envelope', async () => {
    fetchMock.mockResolvedValue(okResponse({ data: newDocsetsApiResponse }));
    const repos = await findAllRepos();
    expect(repos).toHaveLength(newDocsetsApiResponse.length);
  });

  it('dedupes concurrent refreshes into a single upstream call', async () => {
    fetchMock.mockResolvedValue(okResponse(newDocsetsApiResponse));
    await Promise.all([findAllRepos(), findAllRepos(), findAllRepos()]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('throws rather than returning an empty response', async () => {
    fetchMock.mockResolvedValue(okResponse([]));
    await expect(findAllRepos()).rejects.toThrow('zero projects');
  });

  it('throws on a non-array payload', async () => {
    fetchMock.mockResolvedValue(okResponse({ message: 'not found' }));
    await expect(findAllRepos()).rejects.toThrow('not an array');
  });

  it('throws on a non-2xx upstream response', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable' });
    await expect(findAllRepos()).rejects.toThrow('503');
  });

  it('throws when there is no cache to fall back on', async () => {
    fetchMock.mockRejectedValue(new Error('ECONNREFUSED'));
    await expect(findAllRepos()).rejects.toThrow('ECONNREFUSED');
  });

  it('serves stale data when a refresh fails', async () => {
    // A zero TTL forces every call to attempt a refresh.
    process.env.DOCSETS_CACHE_TTL_MS = '0';
    try {
      fetchMock.mockResolvedValueOnce(okResponse(newDocsetsApiResponse));
      const warm = await findAllRepos();

      fetchMock.mockRejectedValueOnce(new Error('upstream down'));
      const stale = await findAllRepos();

      expect(stale).toEqual(warm);
      expect(fetchMock).toHaveBeenCalledTimes(2);
    } finally {
      delete process.env.DOCSETS_CACHE_TTL_MS;
    }
  });
});
