import { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { removeNotification } from '@/store/slices/notificationSlice';
import {
  Network,
  Database,
  Terminal,
  Code,
  Archive,
  Plug,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';

export function useNotificationListener() {
  const dispatch = useAppDispatch();
  const notifications = useAppSelector(
    (state) => state.notifications.notifications
  );
  const shownNotificationsRef = useRef<Set<string>>(new Set());

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'Network':
      case 'Http':
        return <Network className="size-4" />;
      case 'Database':
        return <Database className="size-4" />;
      case 'Python':
      case 'Node':
      case 'Runtime':
        return <Terminal className="size-4" />;
      case 'Code':
      case 'Serialization':
        return <Code className="size-4" />;
      case 'Zip':
      case 'IO':
        return <Archive className="size-4" />;
      case 'MCP':
      case 'Addon':
        return <Plug className="size-4" />;
      case 'Prompt':
      case 'LLM':
        return <MessageSquare className="size-4" />;
      default:
        return <AlertCircle className="size-4" />;
    }
  };

  useEffect(() => {
    notifications.forEach((notification) => {
      const { id, type, title, description, duration, category } = notification;

      // Skip if already shown
      if (shownNotificationsRef.current.has(id)) {
        return;
      }

      // Mark as shown
      shownNotificationsRef.current.add(id);

      // Show toast based on type
      switch (type) {
        case 'success':
          toast.success(title, {
            description,
            duration: duration || 4000,
            onDismiss: () => {
              shownNotificationsRef.current.delete(id);
              dispatch(removeNotification(id));
            },
          });
          break;
        case 'error':
          toast.error(title, {
            description,
            duration: duration || 5000,
            icon: category ? getCategoryIcon(category) : undefined,
            onDismiss: () => {
              shownNotificationsRef.current.delete(id);
              dispatch(removeNotification(id));
            },
          });
          break;
        case 'warning':
          toast.warning(title, {
            description,
            duration: duration || 4000,
            onDismiss: () => {
              shownNotificationsRef.current.delete(id);
              dispatch(removeNotification(id));
            },
          });
          break;
        case 'info':
        default:
          toast.info(title, {
            description,
            duration: duration || 4000,
            onDismiss: () => {
              shownNotificationsRef.current.delete(id);
              dispatch(removeNotification(id));
            },
          });
          break;
      }

      // Remove notification from store immediately after showing
      dispatch(removeNotification(id));
    });
  }, [notifications, dispatch]);
}
