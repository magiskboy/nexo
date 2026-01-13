import { ChatSidebar } from '@/features/chat/ui/ChatSidebar';
import { ChatArea } from '@/features/chat/ui/chat/ChatArea';
import { ChatLayout } from '@/features/chat/ui/ChatLayout';
import { ChatRightPanel } from '@/features/chat/ui/ChatRightPanel';

export function ChatScreen() {
  return (
    <ChatLayout
      sidebar={<ChatSidebar />}
      content={<ChatArea />}
      rightArea={<ChatRightPanel />}
    />
  );
}
