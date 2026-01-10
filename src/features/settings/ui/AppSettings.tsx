import { useTranslation } from 'react-i18next';
import { Languages, Palette, User } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/ui/atoms/select';
import { Separator } from '@/ui/atoms/separator';
import { useAppSettings } from '@/hooks/useAppSettings';
import i18n from '@/i18n/config';

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

export function AppSettings() {
  const { t } = useTranslation(['settings', 'common']);
  const {
    language: currentLanguage,
    userMode: currentUserMode,
    theme: currentTheme,
    updateLanguage,
    updateUserMode,
    updateTheme,
  } = useAppSettings();

  const handleLanguageChange = (lang: 'vi' | 'en') => {
    updateLanguage(lang);
    i18n.changeLanguage(lang);
  };

  const handleUserModeChange = (mode: 'normal' | 'developer') => {
    updateUserMode(mode);
  };

  const handleThemeChange = (newTheme: Theme) => {
    updateTheme(newTheme);
  };

  return (
    <div className="space-y-6">
      {/* Language */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Languages className="size-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{t('language')}</h3>
        </div>
        <Select
          value={currentLanguage}
          onValueChange={(value: 'vi' | 'en') => handleLanguageChange(value)}
        >
          <SelectTrigger id="language-select" className="w-full">
            <SelectValue placeholder={t('selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="en">{t('english')}</SelectItem>
            <SelectItem value="vi">{t('vietnamese')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Theme */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Palette className="size-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{t('theme')}</h3>
        </div>
        <Select
          value={currentTheme}
          onValueChange={(value: Theme) => handleThemeChange(value)}
        >
          <SelectTrigger id="theme-select" className="w-full">
            <SelectValue placeholder={t('selectTheme')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">{t('lightTheme')}</SelectItem>
            <SelectItem value="dark">{t('darkTheme')}</SelectItem>
            <SelectItem value="system">{t('systemTheme')}</SelectItem>
            {/* <SelectItem value="github-light">
              {t('githubLightTheme')}
            </SelectItem>
            <SelectItem value="github-dark">{t('githubDarkTheme')}</SelectItem>
            <SelectItem value="gruvbox">{t('gruvboxTheme')}</SelectItem>
            <SelectItem value="dracula">{t('draculaTheme')}</SelectItem>
            <SelectItem value="solarized-light">
              {t('solarizedLightTheme')}
            </SelectItem>
            <SelectItem value="solarized-dark">
              {t('solarizedDarkTheme')}
            </SelectItem>
            <SelectItem value="one-dark-pro">{t('oneDarkProTheme')}</SelectItem>
            <SelectItem value="one-light">{t('oneLightTheme')}</SelectItem>
            <SelectItem value="monokai">{t('monokaiTheme')}</SelectItem>
            <SelectItem value="nord">{t('nordTheme')}</SelectItem>
            <SelectItem value="ayu-dark">{t('ayuDarkTheme')}</SelectItem> */}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* User Mode */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <User className="size-4 text-muted-foreground" />
          <h3 className="font-medium text-sm">{t('userMode')}</h3>
        </div>
        <Select
          value={currentUserMode}
          onValueChange={(value: 'normal' | 'developer') =>
            handleUserModeChange(value)
          }
        >
          <SelectTrigger id="user-mode-select" className="w-full">
            <SelectValue placeholder={t('selectUserMode')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="normal">{t('normalUser')}</SelectItem>
            <SelectItem value="developer">{t('developerUser')}</SelectItem>
          </SelectContent>
        </Select>
        {currentUserMode === 'developer' && (
          <p className="text-xs text-muted-foreground">
            {t('developerModeDescription')}
          </p>
        )}
      </div>
    </div>
  );
}
