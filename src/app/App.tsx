import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes';
import { initializeDatabase } from '@/db/migrations';
import { useUIStore } from '@/stores/uiStore';

function App() {
  const { theme, defaultTheme } = useUIStore((state) => ({
    theme: state.theme,
    defaultTheme: state.settings.defaultTheme,
  }));

  useEffect(() => {
    initializeDatabase().catch(console.error);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const applyTheme = (selection: 'light' | 'dark' | 'system') => {
      const resolvedTheme = selection === 'system' ? (mediaQuery.matches ? 'dark' : 'light') : selection;
      root.classList.toggle('dark', resolvedTheme === 'dark');
      root.dataset.theme = resolvedTheme;
    };

    applyTheme(theme ?? defaultTheme);

    if (theme === 'system') {
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme, defaultTheme]);

  return <RouterProvider router={router} />;
}

export default App;
