# Chat Issues - Tiến độ Fix

## Issue #03: Thiếu timeout cho streaming messages ✅

**Trạng thái**: Hoàn thành
**Nhánh**: `fix/issue-03-timeout-streaming`
**Commit**: `12287b5670c0`
**Ngày hoàn thành**: 2026-01-02

### Tóm tắt

Đã implement streaming timeout mechanism với countdown timer để ngăn UI bị stuck với loading spinner vô hạn khi streaming fails.

### Thay đổi chính

1. **State Management** (`src/store/slices/messages/state.ts`):
   - Thêm `StreamingError` interface để track lỗi timeout
   - Thêm `streamingErrors` và `streamingStartTimes` vào `MessagesState`

2. **Reducers** (`src/store/slices/messages/reducers.ts`):
   - `setStreamingError`: Set error khi streaming timeout
   - `clearStreamingError`: Clear error state
   - `setStreamingStartTime`: Track thời điểm bắt đầu streaming
   - `clearStreamingStartTime`: Clear start time

3. **Event Handler** (`src/hooks/useChatStreaming.ts`):
   - Set streaming start time khi `MESSAGE_STARTED` event fires
   - Clear start time khi `MESSAGE_COMPLETE` hoặc `MESSAGE_ERROR`

4. **Timeout Hook** (`src/hooks/useMessages.ts`):
   - Implement timeout mechanism (60 giây)
   - Countdown timer update mỗi giây
   - Auto stop streaming khi timeout
   - Hiển thị error notification
   - Streaming tiếp tục in background khi switch chat

5. **UI Components**:
   - **ChatArea.tsx**: Truyền `streamingError`, `timeLeft`, `handleRetryStreaming` xuống ChatMessages
   - **ChatMessages.tsx**:
     - Hiển thị countdown warning khi còn ≤ 10 giây
     - Hiển thị error banner với retry button khi timeout
6. **Translations**:
   - Thêm `streamingTimeout`, `streamingTimeoutError`, `retry` cho tiếng Việt và tiếng Anh

### Tính năng

- ✅ Timeout 60 giây cho streaming
- ✅ Countdown timer hiển thị 10 giây cuối
- ✅ Error message khi timeout
- ✅ Retry button
- ✅ Streaming tiếp tục in background khi switch chat
- ✅ Translations (vi/en)

### Checklist từ issue (6/7)

- ✅ Add timeout cho streaming (60s default)
- ✅ Auto-stop streaming khi timeout
- ✅ Hiển thị error message cho user
- ✅ Add "Retry" button
- ⏳ Add "Cancel" button khi đang streaming (TODO: có thể implement sau)
- ✅ Clear timeout khi streaming complete
- ✅ Test với mock slow/stuck streaming

### Files đã thay đổi

```
src/hooks/useChatStreaming.ts
src/hooks/useMessages.ts
src/i18n/locales/en/chat.json
src/i18n/locales/vi/chat.json
src/store/slices/messages/index.ts
src/store/slices/messages/reducers.ts
src/store/slices/messages/state.ts
src/ui/chat-area/ChatArea.tsx
src/ui/chat-area/ChatMessages.tsx
```

### Ghi chú

- ESLint warning về `setState in effect` đã được suppress với comment vì đây là legitimate use case cho countdown timer
- Cancel button có thể được thêm vào sau nếu cần thiết
