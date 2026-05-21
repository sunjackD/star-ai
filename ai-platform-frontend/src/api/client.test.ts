import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { apiClient, getData, getPublicData } from './client';

describe('api client auth handling', () => {
  let capturedConfig: AxiosRequestConfig | undefined;

  beforeEach(() => {
    capturedConfig = undefined;
    useAuthStore.setState({ token: undefined, profile: undefined });
    apiClient.defaults.adapter = (async (config) => {
      capturedConfig = config;
      return {
        config,
        data: { data: 'ok' },
        headers: {},
        status: 200,
        statusText: 'OK'
      };
    }) as AxiosAdapter;
  });

  it('keeps public queries free of auth headers and internal skip markers', async () => {
    useAuthStore.setState({ token: 'jwt-token' });

    await getPublicData('/agents');

    expect(capturedConfig?.headers).not.toHaveProperty('Authorization');
    expect(capturedConfig?.headers).not.toHaveProperty('X-Skip-Auth');
  });

  it('adds bearer auth to protected queries when a token exists', async () => {
    useAuthStore.setState({ token: 'jwt-token' });

    await getData('/developer/dashboard');

    expect(capturedConfig?.headers).toHaveProperty('Authorization', 'Bearer jwt-token');
  });
});
