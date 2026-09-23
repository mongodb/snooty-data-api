import { ObjectId } from 'mongodb';
import { getRequestId, assertTrailingSlash, escapeRegExp } from '../src/utils';
import { Request as ExpressRequest } from 'express';

describe('getRequestId', () => {
  it('returns undefined for nullish or list values', () => {
    const nullRequest = {
      headers: {
        'req-id': '',
      },
    };
    const res = getRequestId(nullRequest as unknown as ExpressRequest);
    expect(res).toBeUndefined();
    const listRequest = {
      headers: {
        'req-id': ['test-value'],
      },
    };
    const listRes = getRequestId(listRequest as unknown as ExpressRequest);
    expect(listRes).toBeUndefined();
  });

  it('returns value of req id header', () => {
    const reqId = new ObjectId().toString();
    const req = {
      headers: { 'req-id': reqId },
    };
    const res = getRequestId(req as unknown as ExpressRequest);
    expect(res).toBe(reqId);
  });
});

describe('assertTrailingSlash', () => {
  it('returns a string with a trailing slash without mutations', () => {
    const inputs = ['test', 'test////', ''];
    const res = inputs.map((s) => assertTrailingSlash(s));
    expect(inputs).toBe(inputs);
    res.forEach((s) => {
      expect(s[s.length - 1]).toBe('/');
    });
  });
});

describe('escapeRegExp', () => {
  it('escapes regex metacharacters', () => {
    expect(escapeRegExp('.*')).toBe('\\.\\*');
    expect(escapeRegExp('docs|node')).toBe('docs\\|node');
    expect(escapeRegExp('a+b?c^d$e{f}g(h)i[j]k\\l')).toBe('a\\+b\\?c\\^d\\$e\\{f\\}g\\(h\\)i\\[j\\]k\\\\l');
  });

  it('leaves valid project and branch names unchanged', () => {
    ['cloud-docs', 'master', 'test-same-branch', 'node_v2'].forEach((name) => {
      expect(escapeRegExp(name)).toBe(name);
    });
  });

  it('escapes periods so that branch names match literally', () => {
    expect(new RegExp(`^${escapeRegExp('v1.0')}/`).test('v1x0/page')).toBe(false);
    expect(new RegExp(`^${escapeRegExp('v1.0')}/`).test('v1.0/page')).toBe(true);
  });
});
