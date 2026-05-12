import { ReactNode, useEffect } from 'react';
import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { useThemeStore } from '../store/themeStore';
import { themes } from './tokens';

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeName = useThemeStore((state) => state.theme);

  useEffect(() => {
    const tokens = themes[themeName];
    const root = document.documentElement;
    root.dataset.theme = themeName;
    root.style.setProperty('--accent', tokens.accent);
    root.style.setProperty('--background', tokens.background);
    root.style.setProperty('--surface', tokens.surface);
    root.style.setProperty('--surface-strong', tokens.surfaceStrong);
    root.style.setProperty('--text', tokens.text);
    root.style.setProperty('--text-soft', tokens.textSoft);
    root.style.setProperty('--border', tokens.border);
    root.style.setProperty('--radius', tokens.radius);
    root.style.setProperty('--shadow', tokens.shadow);
    root.style.setProperty('--font', tokens.font);
    root.style.setProperty('--display-font', tokens.displayFont);
    root.style.setProperty('--content-width', tokens.contentWidth);
    root.style.setProperty('--card-padding', tokens.cardPadding);
  }, [themeName]);

  return (
    <ConfigProvider locale={zhCN} theme={themes[themeName].antd}>
      {children}
    </ConfigProvider>
  );
}
