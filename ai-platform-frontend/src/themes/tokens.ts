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
  contentWidth: string;
  cardPadding: string;
  antd: {
    token: Record<string, string | number>;
    components: Record<string, Record<string, string | number>>;
  };
};

export const themes: Record<ThemeName, ThemeTokens> = {
  'minimal-reference': {
    name: 'minimal-reference',
    label: '极简风',
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
    displayFont: '"Noto Serif SC", "PingFang SC", serif',
    contentWidth: '1180px',
    cardPadding: '28px',
    antd: {
      token: {
        colorPrimary: '#85684f',
        colorBgLayout: '#faf9f6',
        colorBgContainer: 'rgba(255,255,255,0.86)',
        colorText: '#1f1c18',
        colorTextSecondary: '#6d675f',
        colorBorder: '#e4ddd2',
        borderRadius: 8,
        fontFamily: 'Manrope, "PingFang SC", "Microsoft YaHei", sans-serif'
      },
      components: {
        Card: { paddingLG: 28 },
        Table: { headerBg: '#f3efe8', rowHoverBg: '#fbfaf7' },
        Menu: { itemSelectedBg: '#f3efe8', itemSelectedColor: '#1f1c18' }
      }
    }
  },
  'minimal-modern': {
    name: 'minimal-modern',
    label: '现代风',
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
    displayFont: 'Manrope, "PingFang SC", sans-serif',
    contentWidth: '1280px',
    cardPadding: '20px',
    antd: {
      token: {
        colorPrimary: '#0052ff',
        colorBgLayout: '#fafafa',
        colorBgContainer: '#ffffff',
        colorText: '#0f172a',
        colorTextSecondary: '#64748b',
        colorBorder: '#e2e8f0',
        borderRadius: 8,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif'
      },
      components: {
        Card: { paddingLG: 20 },
        Table: { headerBg: '#f8fafc', rowHoverBg: '#eff6ff' },
        Menu: { itemSelectedBg: '#eff6ff', itemSelectedColor: '#0052ff' }
      }
    }
  }
};
