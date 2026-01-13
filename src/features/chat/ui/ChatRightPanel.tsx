import { Layout } from 'lucide-react';

export function ChatRightPanel() {
  return (
    <div className="flex h-full flex-col bg-background">
      <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
        <div className="mb-4 rounded-full bg-primary/10 p-4">
          <Layout className="size-8 text-primary" />
        </div>
        <h3 className="mb-2 text-lg font-medium text-foreground">
          Coming Soon
        </h3>
        <p className="max-w-[200px] text-sm text-muted-foreground">
          This area will contain secondary tools, context, or visualizations.
        </p>
      </div>
    </div>
  );
}
