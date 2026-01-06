import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/ui/atoms/button/button';

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'left' | 'right' | 'top' | 'bottom';
  className?: string;
  showCloseButton?: boolean;
}

export function Drawer({
  open,
  onOpenChange,
  children,
  side = 'right',
  className,
  showCloseButton = true,
}: DrawerProps) {
  const [isMounted, setIsMounted] = React.useState(false);

  // Close on Escape key
  React.useEffect(() => {
    if (!open) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onOpenChange]);

  // Mount/unmount for smooth animation
  React.useEffect(() => {
    if (open) {
      setIsMounted(true);
    } else {
      // Delay unmount to allow exit animation
      const timer = setTimeout(() => setIsMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  const sideClasses = {
    right: 'right-0 top-0 h-full',
    left: 'left-0 top-0 h-full',
    top: 'top-0 left-0 w-full',
    bottom: 'bottom-0 left-0 w-full',
  };

  const widthClasses = {
    right: 'w-[500px] max-w-[calc(100vw-2rem)]',
    left: 'w-[500px] max-w-[calc(100vw-2rem)]',
    top: 'h-[500px] max-h-[calc(100vh-2rem)]',
    bottom: 'h-[500px] max-h-[calc(100vh-2rem)]',
  };

  if (!isMounted) return null;

  return (
    <>
      {/* Overlay with fade animation */}
      <div
        className={cn(
          'fixed inset-0 z-50 bg-black/30 backdrop-blur-sm transition-opacity duration-300',
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Drawer Panel with slide animation */}
      <div
        className={cn(
          'fixed z-50 bg-background border-l border-border shadow-2xl',
          'transition-transform duration-300 ease-out',
          sideClasses[side],
          widthClasses[side],
          side === 'right' && (open ? 'translate-x-0' : 'translate-x-full'),
          side === 'left' && (open ? 'translate-x-0' : '-translate-x-full'),
          side === 'top' && (open ? 'translate-y-0' : '-translate-y-full'),
          side === 'bottom' && (open ? 'translate-y-0' : 'translate-y-full'),
          className
        )}
        role="dialog"
        aria-modal="true"
      >
        {showCloseButton && (
          <div className="absolute top-3 right-3 z-10">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className="h-7 w-7 hover:bg-muted"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
        {children}
      </div>
    </>
  );
}

interface DrawerContentProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerContent({ children, className }: DrawerContentProps) {
  return (
    <div className={cn('flex flex-col h-full overflow-hidden', className)}>
      {children}
    </div>
  );
}

interface DrawerHeaderProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerHeader({ children, className }: DrawerHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 px-5 pt-4 pb-3 border-b border-border bg-muted/30 shrink-0',
        className
      )}
    >
      {children}
    </div>
  );
}

interface DrawerTitleProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerTitle({ children, className }: DrawerTitleProps) {
  return (
    <h2 className={cn('text-lg font-semibold leading-none', className)}>
      {children}
    </h2>
  );
}

interface DrawerDescriptionProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerDescription({
  children,
  className,
}: DrawerDescriptionProps) {
  return (
    <p className={cn('text-sm text-muted-foreground', className)}>{children}</p>
  );
}

interface DrawerBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function DrawerBody({ children, className }: DrawerBodyProps) {
  return (
    <div className={cn('flex-1 overflow-y-auto px-4 py-3', className)}>
      {children}
    </div>
  );
}
