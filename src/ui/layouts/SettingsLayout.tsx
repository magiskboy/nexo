import { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { ScrollArea } from '@/ui/atoms/scroll-area';
import { Button } from '@/ui/atoms/button/button';
import { useAppDispatch } from '@/store/hooks';
import { navigateToChat } from '@/store/slices/uiSlice';

interface SettingsLayoutProps {
  children: ReactNode;
  sidebar: ReactNode;
  title: string;
}

export function SettingsLayout({
  children,
  sidebar,
  title,
}: SettingsLayoutProps) {
  const dispatch = useAppDispatch();

  return (
    <div className="flex h-screen bg-background text-foreground">
      {/* Sidebar */}
      <div className="w-64 border-r border-border bg-muted/30 flex flex-col shrink-0">
        <div className="p-4 border-b border-border flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => dispatch(navigateToChat())}
            className="h-8 w-8"
          >
            <ArrowLeft className="size-4" />
          </Button>
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <ScrollArea className="flex-1 [&_[data-slot='scroll-area-scrollbar']]:hidden">
          {sidebar}
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 [&_[data-slot='scroll-area-scrollbar']]:hidden">
          {children}
        </ScrollArea>
      </div>
    </div>
  );
}
