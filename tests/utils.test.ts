import { ObjectId } from 'mongodb';
import { getRequestId, assertTrailingSlash } from '../src/utils';
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
