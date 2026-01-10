import {
  Settings as SettingsIcon,
  Network,
  Server,
  FileText,
  Info,
  Package,
  BarChart,
  Bot,
  Github,
  Globe,
  BookOpen,
  Heart,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { setSettingsSection } from '@/features/ui/state/uiSlice';
import { SettingsLayout } from '@/features/settings/ui/SettingsLayout';
import { Separator } from '@/ui/atoms/separator';
import { Button } from '@/ui/atoms/button/button';

// Section Components
import { LLMConnections } from '@/features/llm';
import { MCPServerConnections } from '@/features/mcp';
import { AppSettings, PromptManagement } from '@/features/settings';
import { AddonSettings } from '@/features/addon';
import { UsagePage } from '@/features/usage';
import { AgentSettings } from '@/features/agent';
import { UpdateSection } from '@/features/updater/ui/UpdateSection';

export function SettingsScreen() {
  const { t } = useTranslation(['settings', 'common']);
  const dispatch = useAppDispatch();
  const selectedSection = useAppSelector((state) => state.ui.settingsSection);

  // Section Navigation
  const sections = [
    {
      id: 'general',
      label: t('title'),
      icon: <SettingsIcon className="size-4" />,
    },
    {
      id: 'llm',
      label: t('llmConnections'),
      icon: <Network className="size-4" />,
    },
    {
      id: 'mcp',
      label: t('mcpServerConnections'),
      icon: <Server className="size-4" />,
    },
    {
      id: 'prompts',
      label: t('promptManagement'),
      icon: <FileText className="size-4" />,
    },
    {
      id: 'agent',
      label: 'Agent',
      icon: <Bot className="size-4" />,
    },
    {
      id: 'addon',
      label: 'Addon',
      icon: <Package className="size-4" />,
    },
    {
      id: 'usage',
      label: 'Usage',
      icon: <BarChart className="size-4" />,
    },
    {
      id: 'about',
      label: t('about'),
      icon: <Info className="size-4" />,
    },
  ] as const;

  const renderContent = () => {
    switch (selectedSection) {
      case 'general':
        return <AppSettings />;
      case 'llm':
        return <LLMConnections />;
      case 'mcp':
        return <MCPServerConnections />;
      case 'prompts':
        return <PromptManagement />;
      case 'agent':
        return <AgentSettings />;
      case 'addon':
        return <AddonSettings />;
      case 'usage':
        return <UsagePage />;
      case 'about':
        return <AboutContent />;
      default:
        return <AppSettings />;
    }
  };

  function AboutContent() {
    const { t: tCommon } = useTranslation('common');
    const { t: tSettings } = useTranslation('settings');

    const openExternalLink = async (url: string) => {
      try {
        const { openUrl } = await import('@tauri-apps/plugin-opener');
        await openUrl(url);
      } catch (error) {
        console.error('Failed to open external link:', error);
      }
    };

    const GITHUB_URL = 'https://github.com/Nexo-Agent/nexo';
    const WEBSITE_URL = 'https://nexo.nkthanh.dev';
    const DOCS_URL = 'https://nexo-docs.nkthanh.dev';

    return (
      <div className="space-y-6">
        <UpdateSection />

        {/* Description */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold">{tCommon('aboutTitle')}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {tSettings('aboutDescription') || tCommon('appDescription')}
          </p>
        </div>

        <Separator />

        {/* Version Info */}
        <div className="space-y-2">
          <h4 className="font-medium text-sm text-foreground">
            {tCommon('version')}
          </h4>
          <p className="text-sm text-muted-foreground">
            <span className="font-mono font-medium">
              {tCommon('appVersion')}
            </span>
          </p>
        </div>

        <Separator />

        {/* Features Grid */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-foreground">
            {tCommon('keyFeatures', { defaultValue: 'Key Features' })}
          </h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="text-xs font-medium text-foreground">
                Multi-LLM Support
              </div>
              <div className="text-xs text-muted-foreground">
                Connect to multiple AI providers
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="text-xs font-medium text-foreground">
                MCP Integration
              </div>
              <div className="text-xs text-muted-foreground">
                Model Context Protocol support
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="text-xs font-medium text-foreground">
                Custom Prompts
              </div>
              <div className="text-xs text-muted-foreground">
                Manage prompt templates
              </div>
            </div>
            <div className="rounded-lg border bg-card p-3 space-y-1">
              <div className="text-xs font-medium text-foreground">
                Privacy First
              </div>
              <div className="text-xs text-muted-foreground">
                Local data storage
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* Links */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-foreground">
            {tCommon('resources', { defaultValue: 'Resources' })}
          </h4>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full h-auto flex-col gap-2 py-3"
              onClick={() => openExternalLink(GITHUB_URL)}
            >
              <Github className="size-4" />
              <span className="text-xs">GitHub</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-auto flex-col gap-2 py-3"
              onClick={() => openExternalLink(WEBSITE_URL)}
            >
              <Globe className="size-4" />
              <span className="text-xs">Website</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="w-full h-auto flex-col gap-2 py-3"
              onClick={() => openExternalLink(DOCS_URL)}
            >
              <BookOpen className="size-4" />
              <span className="text-xs">Docs</span>
            </Button>
          </div>
        </div>

        <Separator />

        {/* Footer */}
        <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <span>{tCommon('madeWith', { defaultValue: 'Made with' })}</span>
          <Heart className="size-3 fill-red-500 text-red-500" />
          <span>{tCommon('byTeam', { defaultValue: 'by the Nexo team' })}</span>
        </div>
      </div>
    );
  }

  const sidebar = (
    <div className="p-3">
      {sections.map((section) => (
        <button
          key={section.id}
          onClick={() => dispatch(setSettingsSection(section.id))}
          data-tour={section.id === 'llm' ? 'settings-llm-tab' : undefined}
          className={cn(
            'mb-2 w-full flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all',
            'hover:bg-accent hover:text-accent-foreground',
            selectedSection === section.id
              ? 'bg-accent text-accent-foreground shadow-sm'
              : 'text-muted-foreground'
          )}
        >
          <span
            className={cn(
              'transition-transform',
              selectedSection === section.id && 'scale-110'
            )}
          >
            {section.icon}
          </span>
          <span>{section.label}</span>
        </button>
      ))}
    </div>
  );

  const content = (
    <div className="h-full overflow-auto">
      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">
            {sections.find((s) => s.id === selectedSection)?.label}
          </h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );

  return (
    <SettingsLayout sidebar={sidebar} title={t('title')}>
      {content}
    </SettingsLayout>
  );
}
