import axios from 'axios';
import type { ApiResponse } from '../types';
import { useAuthStore } from '../store/authStore';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? '/api/v1',
  timeout: 15000
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export async function getData<T>(url: string): Promise<T> {
  const response = await apiClient.get<ApiResponse<T>>(url);
  return response.data.data;
}

export async function postData<T>(url: string, body?: unknown): Promise<T> {
  const response = await apiClient.post<ApiResponse<T>>(url, body);
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
