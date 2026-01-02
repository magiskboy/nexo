import { useTranslation } from 'react-i18next';
import { Download, FileText, FileJson } from 'lucide-react';
import { Button } from '@/ui/atoms/button/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/ui/atoms/dropdown-menu';
import type { Message } from '@/store/types';

interface ChatHeaderProps {
  chatId: string;
  messages: Message[];
}

export function ChatHeader({ chatId, messages }: ChatHeaderProps) {
  const { t } = useTranslation('chat');

  const handleExportMarkdown = () => {
    const markdown = messages
      .map((m) => {
        const role = m.role === 'user' ? '**You**' : '**Assistant**';
        const timestamp = new Date(m.timestamp).toLocaleString();
        return `### ${role} (${timestamp})\n\n${m.content}\n\n---\n`;
      })
      .join('\n');

    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${chatId}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    const data = {
      chatId,
      exportedAt: new Date().toISOString(),
      messages,
    };
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${chatId}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (messages.length === 0) return null;

  return (
    <div className="flex h-12 shrink-0 items-center justify-end border-b border-border bg-background px-4">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Download className="h-4 w-4" />
            {t('exportChat')}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={handleExportMarkdown}>
            <FileText className="mr-2 h-4 w-4" />
            Markdown (.md)
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleExportJSON}>
            <FileJson className="mr-2 h-4 w-4" />
            JSON (.json)
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
