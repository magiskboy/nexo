import { ChatSidebar } from '@/ui/organisms/ChatSidebar';
import { ChatArea } from '@/ui/organisms/chat/ChatArea';
import { ChatLayout } from '@/ui/layouts/ChatLayout';

export function ChatScreen() {
  return <ChatLayout sidebar={<ChatSidebar />} content={<ChatArea />} />;
}
