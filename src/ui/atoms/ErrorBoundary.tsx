import { Component, ErrorInfo, ReactNode } from 'react';
import { Button } from '@/ui/atoms/button/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
          <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 mb-6">
            <AlertCircle className="size-8 text-destructive" />
          </div>
          <h1 className="text-2xl font-bold mb-2">Something went wrong</h1>
          <p className="text-muted-foreground max-w-md mb-8">
            An unexpected error occurred. We've logged this issue and will fix
            it soon.
          </p>

          {this.state.error && (
            <div className="w-full max-w-md bg-muted/50 rounded-lg p-4 mb-8 text-left overflow-auto max-h-48">
              <code className="text-xs font-mono text-muted-foreground whitespace-pre-wrap">
                {this.state.error.toString()}
              </code>
            </div>
          )}

          <Button onClick={this.handleReload} className="gap-2">
            <RefreshCw className="size-4" />
            Reload Application
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
