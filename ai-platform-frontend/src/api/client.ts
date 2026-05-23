import axios from 'axios';
import type { ApiResponse } from '../types';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (config.headers?.['X-Skip-Auth'] === 'true') {
    delete config.headers['X-Skip-Auth'];
    return config;
  }
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getData<T>(url: string): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url);
  return response.data.data;
}

export async function getPublicData<T>(url: string): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url, { headers: { 'X-Skip-Auth': 'true' } });
  return response.data.data;
}

export async function postData<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function postPublicData<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body, { headers: { 'X-Skip-Auth': 'true' } });
  return response.data.data;
}

export async function uploadData<T>(url: string, formData: FormData): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data.data;
}

export async function putData<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.put<ApiResponse<T>>(url, body);
  return response.data.data;
}

export async function deleteData<T>(url: string): Promise<T> {
  const response = await apiClient.delete<ApiResponse<T>>(url);
  return response.data.data;
}

export function apiUrl(url: string): string {
  const baseUrl = (apiClient.defaults.baseURL ?? '/api/v1').replace(/\/$/, '');
  if (/^https?:\/\//i.test(baseUrl)) {
    return `${baseUrl}${url}`;
  }
  return `${window.location.origin}${baseUrl}${url}`;
}

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const response = (error as { response?: { data?: { message?: unknown } } }).response;
    if (typeof response?.data?.message === 'string' && response.data.message.trim()) {
      return response.data.message;
    }
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
}

export async function downloadFile(url: string, fallbackFileName: string): Promise<void> {
  const response = await apiClient.get<Blob>(url, { responseType: 'blob' });
  const fileName = parseFileName(response.headers['content-disposition']) ?? fallbackFileName;
  const blobUrl = URL.createObjectURL(response.data);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(blobUrl);
}

function parseFileName(contentDisposition: string | undefined): string | undefined {
  if (!contentDisposition) {
    return undefined;
  }
  const utf8Match = /filename\*=UTF-8''([^;]+)/i.exec(contentDisposition);
  if (utf8Match) {
    return decodeURIComponent(utf8Match[1]);
  }
  const asciiMatch = /filename="?([^";]+)"?/i.exec(contentDisposition);
  return asciiMatch?.[1];
}
