import {
  Component,
  ErrorInfo,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { Streamdown } from '@/ui/atoms/streamdown';
import { useAppSelector } from '@/store/hooks';
import { cn } from '@/lib/utils';
import { CustomCodeComponent } from './CustomCodeComponent';

export function MarkdownContent({
  content,
  className,
  messageId,
}: MarkdownContentProps) {
  const { t } = useTranslation('common');
  const sanitizedContent =
    typeof content === 'string' ? content : String(content || '');
  const streamingMessageId = useAppSelector(
    (state) => state.messages.streamingMessageId
  );
  const isStreaming = messageId ? streamingMessageId === messageId : false;

  const [streamBuffer, setStreamBuffer] = useState(sanitizedContent);
  const lastUpdateLength = useRef(sanitizedContent.length);
  const bufferTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (isStreaming) {
      // Initialize buffer when streaming starts
      setStreamBuffer(sanitizedContent);
      lastUpdateLength.current = sanitizedContent.length;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStreaming]);

  useEffect(() => {
    if (!isStreaming) return;

    const newContentLength = sanitizedContent.length;
    const diff = newContentLength - lastUpdateLength.current;

    // Check newline count in the new chunk
    // Optimization: no need to slice if diff is zero
    if (diff === 0) return;

    const newChunk = sanitizedContent.slice(lastUpdateLength.current);
    const newlineCount = (newChunk.match(/\n/g) || []).length;

    // Update if > 5 newlines or > 500 chars or user stopped typing for 800ms
    // This creates larger chunks of text appearing at once
    const shouldUpdate = newlineCount >= 5 || diff > 500;

    if (shouldUpdate) {
      if (bufferTimeout.current) clearTimeout(bufferTimeout.current);

      setStreamBuffer(sanitizedContent);
      lastUpdateLength.current = newContentLength;
    } else {
      if (bufferTimeout.current) clearTimeout(bufferTimeout.current);

      bufferTimeout.current = setTimeout(() => {
        setStreamBuffer(sanitizedContent);
        lastUpdateLength.current = newContentLength;
      }, 800);
    }

    return () => {
      if (bufferTimeout.current) clearTimeout(bufferTimeout.current);
    };
  }, [sanitizedContent, isStreaming]);

  const displayedContent = isStreaming ? streamBuffer : sanitizedContent;

  // Override code component to add run button
  const components = useMemo(
    () => ({
      code: CustomCodeComponent,
    }),
    []
  );

  return (
    <MarkdownErrorBoundary
      fallback={(error) => (
        <div className={cn('markdown-content', className)}>
          <div className="whitespace-pre-wrap wrap-break-words text-sm text-muted-foreground">
            {sanitizedContent}
          </div>
          {error && (
            <div className="mt-2 text-xs text-destructive">
              {t('markdownDisplayError')} {error.message}
            </div>
          )}
        </div>
      )}
    >
      <div className={cn('markdown-content', className)}>
        <Streamdown
          mode="streaming"
          isAnimating={isStreaming}
          parseIncompleteMarkdown={true}
          controls
          components={components}
          className={cn(
            isStreaming &&
              '[&>*]:animate-in [&>*]:fade-in [&>*]:slide-in-from-bottom-1 [&>*]:duration-1000'
          )}
        >
          {displayedContent}
        </Streamdown>
      </div>
    </MarkdownErrorBoundary>
  );
}

interface MarkdownContentProps {
  content: string;
  className?: string;
  messageId?: string; // Message ID to check if it's currently streaming
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class MarkdownErrorBoundary extends Component<
  { children: ReactNode; fallback: (error?: Error) => ReactNode },
  ErrorBoundaryState
> {
  constructor(props: {
    children: ReactNode;
    fallback: (error?: Error) => ReactNode;
  }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Markdown rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <>{this.props.fallback(this.state.error)}</>;
    }
    return <>{this.props.children}</>;
  }
}
