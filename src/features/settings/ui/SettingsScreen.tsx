import { useEffect } from 'react';
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
  Shield,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { logger } from '@/lib/logger';
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  setSettingsSection,
  navigateToChat,
} from '@/features/ui/state/uiSlice';
import { Separator } from '@/ui/atoms/separator';
import { Button } from '@/ui/atoms/button/button';
import { ScrollArea } from '@/ui/atoms/scroll-area';
import { Card, CardContent } from '@/ui/atoms/card';

// Section Components
import { LLMConnections } from '@/features/llm';
import { MCPServerConnections } from '@/features/mcp';
import { AppSettings, PromptManagement } from '@/features/settings';
import { AddonSettings } from '@/features/addon';
import { HubScreen } from '@/features/hub/ui/HubScreen';
import { UsagePage } from '@/features/usage';
import { AgentSettings } from '@/features/agent';
import { UpdateSection } from '@/features/updater/ui/UpdateSection';

export function SettingsScreen() {
  const { t } = useTranslation(['settings', 'common']);
  const dispatch = useAppDispatch();
  const selectedSection = useAppSelector((state) => state.ui.settingsSection);

  // Handle ESC key to navigate back to chat
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        dispatch(navigateToChat());
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [dispatch]);

  // Section Navigation
  const sections = [
    {
      id: 'general',
      label: t('generalSetting'),
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
      label: t('agents'),
      icon: <Bot className="size-4" />,
    },
    {
      id: 'addon',
      label: t('addons'),
      icon: <Package className="size-4" />,
    },
    {
      id: 'hub',
      label: 'Hub',
      icon: <Globe className="size-4" />,
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
      case 'hub':
        return <HubScreen />;
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
        return <HubScreen />;
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
        logger.error('Failed to open external link in Settings:', {
          url,
          error,
        });
      }
    };

    const GITHUB_URL = 'https://github.com/Nexo-Agent/nexo';
    const WEBSITE_URL = 'https://nexo.nkthanh.dev';
    const DOCS_URL = 'https://nexo-docs.nkthanh.dev';

    return (
      <div className="max-w-3xl mx-auto pb-10 space-y-8 animate-in fade-in duration-500">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center space-y-4 pt-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-3xl blur opacity-40 group-hover:opacity-75 transition duration-500" />
            <div className="relative flex items-center justify-center size-24 rounded-2xl bg-background shadow-xl ring-1 ring-border/50">
              <img
                src="/icon.svg"
                alt="Nexo Logo"
                className="size-14 drop-shadow-sm"
              />
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {tCommon('aboutTitle', { defaultValue: 'Nexo Agent' })}
            </h3>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              {tSettings('aboutDescription') || tCommon('appDescription')}
            </p>
          </div>
        </div>

        {/* Update Section */}
        <div className="max-w-xl mx-auto w-full">
          <UpdateSection />
        </div>

        <Separator className="opacity-50" />

        {/* Features/Highlights */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-foreground/80 uppercase tracking-wider px-1">
            {tCommon('keyFeatures', { defaultValue: 'Core Capabilities' })}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FeatureCard
              icon={<Network className="size-5" />}
              title="Multi-LLM Support"
              description="Connect seamlessly to OpenAI, Anthropic, Gemini, and Local LLMs."
            />
            <FeatureCard
              icon={<Server className="size-5" />}
              title="MCP Integration"
              description="Full support for Model Context Protocol servers and tools."
            />
            <FeatureCard
              icon={<FileText className="size-5" />}
              title="Custom Prompts"
              description="Create, manage, and reuse your own specialized system prompts."
            />
            <FeatureCard
              icon={<Shield className="size-5" />}
              title="Privacy First"
              description="Your data stays locally on your device. No cloud collection."
            />
          </div>
        </div>

        {/* Resources & Links */}
        <div className="space-y-4">
          <h4 className="font-semibold text-sm text-foreground/80 uppercase tracking-wider px-1">
            {tCommon('resources', { defaultValue: 'Resources' })}
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <ResourceButton
              icon={<Github className="size-4" />}
              label="GitHub"
              onClick={() => openExternalLink(GITHUB_URL)}
            />
            <ResourceButton
              icon={<Globe className="size-4" />}
              label="Website"
              onClick={() => openExternalLink(WEBSITE_URL)}
            />
            <ResourceButton
              icon={<BookOpen className="size-4" />}
              label="Documentation"
              onClick={() => openExternalLink(DOCS_URL)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-8 text-center space-y-1">
          <p className="text-xs text-muted-foreground">
            Built with Tauri, React & Rust
          </p>
          <p className="text-[10px] text-muted-foreground/60">
            © {new Date().getFullYear()} Nexo Agent. Open Source Software.
          </p>
        </div>
      </div>
    );
  }

  function FeatureCard({
    icon,
    title,
    description,
  }: {
    icon: React.ReactNode;
    title: string;
    description: string;
  }) {
    return (
      <Card className="border bg-card/50 hover:bg-card hover:shadow-md transition-all duration-300 group">
        <CardContent className="p-4 flex gap-4">
          <div className="p-2.5 rounded-xl bg-primary/5 text-primary group-hover:bg-primary/10 transition-colors h-fit">
            {icon}
          </div>
          <div className="space-y-1">
            <h5 className="font-semibold text-sm text-foreground">{title}</h5>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  function ResourceButton({
    icon,
    label,
    onClick,
  }: {
    icon: React.ReactNode;
    label: string;
    onClick: () => void;
  }) {
    return (
      <Button
        variant="outline"
        className="w-full justify-start h-12 gap-3 hover:bg-accent/50 group border-muted-foreground/20"
        onClick={onClick}
      >
        <div className="text-muted-foreground group-hover:text-foreground transition-colors">
          {icon}
        </div>
        <span className="text-sm font-medium">{label}</span>
      </Button>
    );
  }

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 lg:w-72 xl:w-80 border-r border-sidebar-border bg-sidebar flex flex-col shrink-0">
        <ScrollArea className="flex-1">
          <div className="p-3">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => dispatch(setSettingsSection(section.id))}
                data-tour={
                  section.id === 'llm' ? 'settings-llm-tab' : undefined
                }
                className={cn(
                  'relative mb-1 w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-all group',
                  'hover:bg-accent hover:text-accent-foreground',
                  selectedSection === section.id
                    ? 'bg-accent/80 text-accent-foreground shadow-sm'
                    : 'text-muted-foreground'
                )}
              >
                {selectedSection === section.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-primary rounded-l-md" />
                )}
                <span
                  className={cn(
                    'transition-transform duration-200',
                    selectedSection === section.id && 'scale-110'
                  )}
                >
                  {section.icon}
                </span>
                <span>{section.label}</span>
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl lg:max-w-5xl xl:max-w-6xl mx-auto w-full space-y-6">
            <div className="mb-6">
              {selectedSection !== 'about' && (
                <h1 className="text-2xl font-bold">
                  {sections.find((s) => s.id === selectedSection)?.label}
                </h1>
              )}
            </div>
            {renderContent()}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
