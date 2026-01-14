import { useAppSelector, useAppDispatch } from '@/app/hooks';
import {
  setLanguage,
  setTheme,
  setShowUsage,
  loadAppSettings,
} from '@/features/ui/state/uiSlice';

type Theme =
  | 'light'
  | 'dark'
  | 'system'
  | 'github-light'
  | 'github-dark'
  | 'gruvbox'
  | 'dracula'
  | 'solarized-light'
  | 'solarized-dark'
  | 'one-dark-pro'
  | 'one-light'
  | 'monokai'
  | 'nord'
  | 'ayu-dark';

/**
 * Hook to access and manage app settings (language and theme)
 */
export function useAppSettings() {
  const dispatch = useAppDispatch();
  const language = useAppSelector((state) => state.ui.language);
  const theme = useAppSelector((state) => state.ui.theme);
  const loading = useAppSelector((state) => state.ui.loading);
  const showUsage = useAppSelector((state) => state.ui.experiments.showUsage);

  const updateLanguage = (lang: 'vi' | 'en') => {
    dispatch(setLanguage(lang));
  };

  const updateTheme = (newTheme: Theme) => {
    dispatch(setTheme(newTheme));
  };

  const updateShowUsage = (show: boolean) => {
    dispatch(setShowUsage(show));
  };

  const reloadSettings = () => {
    dispatch(loadAppSettings());
  };

  return {
    language,
    theme,
    loading,
    showUsage,
    updateLanguage,
    updateTheme,
    updateShowUsage,
    reloadSettings,
  };
}
