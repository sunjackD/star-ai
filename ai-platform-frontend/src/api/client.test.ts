import type { AxiosAdapter, AxiosRequestConfig } from 'axios';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from '../store/authStore';
import { apiClient, apiErrorMessage, getData, getPublicData } from './client';

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

describe('api client error messages', () => {
  it('prefers backend response messages over generic client errors', () => {
    const error = Object.assign(new Error('Request failed with status code 400'), {
      response: { data: { message: '用户名已存在' } }
    });

    expect(apiErrorMessage(error, '保存失败')).toBe('用户名已存在');
  });

  it('falls back to local error messages before generic fallback text', () => {
    expect(apiErrorMessage(new Error('请选择 Skill 文件'), 'Skill 上传失败')).toBe('请选择 Skill 文件');
  });

  it('uses the fallback when backend and local messages are blank', () => {
    const error = { response: { data: { message: '   ' } } };

    expect(apiErrorMessage(error, '系统繁忙，请稍后重试')).toBe('系统繁忙，请稍后重试');
  });
});
