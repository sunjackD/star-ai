import type { ThemeName } from '../types';

export type ThemeTokens = {
  name: ThemeName;
  label: string;
  accent: string;
  background: string;
  surface: string;
  surfaceStrong: string;
  text: string;
  textSoft: string;
  border: string;
  radius: string;
  shadow: string;
  font: string;
  displayFont: string;
};

export const themes: Record<ThemeName, ThemeTokens> = {
  'minimal-reference': {
    name: 'minimal-reference',
    label: '原型7 极简参考版',
    accent: '#85684f',
    background: '#faf9f6',
    surface: 'rgba(255,255,255,0.82)',
    surfaceStrong: '#ffffff',
    text: '#1f1c18',
    textSoft: '#6d675f',
    border: '#e4ddd2',
    radius: '8px',
    shadow: '0 18px 42px rgba(31,28,24,0.08)',
    font: 'Manrope, "PingFang SC", "Microsoft YaHei", sans-serif',
    displayFont: '"Noto Serif SC", "PingFang SC", serif'
  },
  'minimal-modern': {
    name: 'minimal-modern',
    label: '原型6 Minimalist Modern',
    accent: '#0052ff',
    background: '#fafafa',
    surface: '#ffffff',
    surfaceStrong: '#ffffff',
    text: '#0f172a',
    textSoft: '#64748b',
    border: '#e2e8f0',
    radius: '8px',
    shadow: '0 12px 32px rgba(15,23,42,0.08)',
    font: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
    displayFont: 'Manrope, "PingFang SC", sans-serif'
  }
};

