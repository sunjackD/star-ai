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
    accent: '#6f5cf7',
    background: '#f7f3ff',
    surface: 'rgba(255,255,255,0.78)',
    surfaceStrong: '#ffffff',
    text: '#18152f',
    textSoft: '#6b6682',
    border: 'rgba(120,108,160,0.18)',
    radius: '22px',
    shadow: '0 24px 70px rgba(52,42,110,0.12)',
    font: 'Manrope, "PingFang SC", "Microsoft YaHei", sans-serif',
    displayFont: '"Noto Serif SC", "PingFang SC", serif',
    contentWidth: '1180px',
    cardPadding: '28px',
    antd: {
      token: {
        colorPrimary: '#6f5cf7',
        colorBgLayout: '#f7f3ff',
        colorBgContainer: 'rgba(255,255,255,0.84)',
        colorText: '#18152f',
        colorTextSecondary: '#6b6682',
        colorBorder: 'rgba(120,108,160,0.20)',
        borderRadius: 18,
        fontFamily: 'Manrope, "PingFang SC", "Microsoft YaHei", sans-serif'
      },
      components: {
        Card: { paddingLG: 28 },
        Table: { headerBg: 'rgba(247,243,255,0.82)', rowHoverBg: 'rgba(241,237,255,0.74)' },
        Menu: { itemSelectedBg: 'rgba(111,92,247,0.12)', itemSelectedColor: '#5b46e8' }
      }
    }
  },
  'minimal-modern': {
    name: 'minimal-modern',
    label: '现代风',
    accent: '#0f8cff',
    background: '#f7fbff',
    surface: 'rgba(255,255,255,0.82)',
    surfaceStrong: '#ffffff',
    text: '#0f172a',
    textSoft: '#64748b',
    border: 'rgba(148,163,184,0.24)',
    radius: '20px',
    shadow: '0 18px 48px rgba(15,23,42,0.08)',
    font: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif',
    displayFont: 'Manrope, "PingFang SC", sans-serif',
    contentWidth: '1280px',
    cardPadding: '20px',
    antd: {
      token: {
        colorPrimary: '#0f8cff',
        colorBgLayout: '#f7fbff',
        colorBgContainer: 'rgba(255,255,255,0.86)',
        colorText: '#0f172a',
        colorTextSecondary: '#64748b',
        colorBorder: 'rgba(148,163,184,0.24)',
        borderRadius: 18,
        fontFamily: 'Inter, "PingFang SC", "Microsoft YaHei", sans-serif'
      },
      components: {
        Card: { paddingLG: 20 },
        Table: { headerBg: 'rgba(248,250,252,0.88)', rowHoverBg: '#eff6ff' },
        Menu: { itemSelectedBg: 'rgba(14,165,233,0.14)', itemSelectedColor: '#38bdf8' }
      }
    }
  }
};
