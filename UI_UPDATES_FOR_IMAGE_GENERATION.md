# UI Updates for Image Generation Support

## Tóm tắt

Sau khi implement image generation ở backend (Rust), các thay đổi cần thiết cho UI/Frontend đã được hoàn thành. Dưới đây là chi tiết.

---

## ✅ Đã Update

### 1. **Frontend Type Definitions**

#### File: `src/features/llm/types.ts`

- ✅ Thêm field `supportsImageGeneration: boolean` vào `LLMModel` interface
- Cho phép UI biết model nào hỗ trợ image generation

```typescript
export interface LLMModel {
  id: string;
  name: string;
  created?: number;
  owned_by?: string;
  supportsTools: boolean;
  supportsThinking: boolean;
  supportsImageGeneration: boolean; // ← NEW
}
```

### 2. **Backend Metadata Handling**

#### File: `src-tauri/src/services/chat_service.rs`

- ✅ Tự động convert generated images thành data URLs
- ✅ Lưu images vào metadata của assistant message
- ✅ Format tương thích với UI hiện tại (sử dụng field `images`)

```rust
// Images được convert thành format:
{
  "tokenUsage": { ... },
  "images": [
    "data:image/png;base64,iVBORw0KGgoA...",
    "data:image/jpeg;base64,/9j/4AAQSkZJ..."
  ]
}
```

---

## ✅ Không Cần Update

### 1. **Message Display Components**

#### File: `src/features/chat/ui/chat/MessageItem.tsx`

- ✅ **Đã hỗ trợ sẵn** hiển thị images từ metadata
- ✅ Sử dụng component `MessageImage` để render
- ✅ Hỗ trợ click để preview image

Đoạn code hiện tại:

```typescript
// Check for Files/Images in metadata
if (message.metadata) {
  const parsed = JSON.parse(message.metadata);

  // Supports both 'files' and 'images' arrays
  if (parsed.images && Array.isArray(parsed.images)) {
    // Render images using MessageImage component
  }
}
```

### 2. **Image Preview Component**

#### File: `src/features/chat/ui/chat/MessageImage.tsx`

- ✅ **Đã hỗ trợ sẵn** data URLs
- ✅ Hiển thị loading state
- ✅ Error handling

### 3. **Message Types**

#### File: `src/features/chat/types.ts`

- ✅ **Không cần update** - `Message` interface đã có field `metadata` để lưu images
- Images được lưu dưới dạng JSON string trong metadata

---

## 🎯 Cách Hoạt Động

### Flow tổng quát:

1. **User gửi request** → có thể chọn model hỗ trợ image generation
2. **Backend xử lý:**
   - Gọi Google Gemini Image Generation API
   - Nhận response với images (base64)
   - Convert thành data URLs: `data:image/png;base64,...`
   - Lưu vào metadata của message
3. **Frontend tự động hiển thị:**
   - Parse metadata từ message
   - Tìm field `images` array
   - Render mỗi image với `MessageImage` component
   - Cho phép preview khi click

### Ví dụ message metadata sau khi generate image:

```json
{
  "tokenUsage": {
    "promptTokens": 10,
    "completionTokens": 1290,
    "totalTokens": 1300
  },
  "images": ["data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."]
}
```

---

## 🚀 Testing

### Manual Testing:

1. **Chọn model hỗ trợ image generation:**
   - `gemini-2.5-flash-image`
   - `gemini-3-pro-image-preview`

2. **Gửi prompt:**

   ```
   Create a logo for a coffee shop
   ```

3. **Verify:**
   - ✅ Message hiển thị với text description
   - ✅ Image được render dưới text
   - ✅ Click vào image mở preview dialog
   - ✅ Metadata chứa tokenUsage và images

### Multi-turn Conversation:

1. **First turn:**

   ```
   Create a modern logo for a tech startup
   ```

2. **Second turn:**

   ```
   Make it more colorful with blue and green
   ```

3. **Verify:**
   - ✅ Conversation context được giữ lại
   - ✅ Model có thể "nhìn thấy" ảnh trước đó để chỉnh sửa
   - ✅ New image được generate và hiển thị

---

## 📝 Notes

### 1. **Tương thích ngược (Backwards Compatibility)**

- ✅ Tất cả message cũ vẫn hoạt động bình thường
- ✅ Models không hỗ trợ image generation không bị ảnh hưởng
- ✅ UI component đã hỗ trợ images từ trước (cho attachments)

### 2. **Performance**

- Images được lưu dưới dạng base64 trong metadata
- Data URLs được load trực tiếp, không cần fetch bổ sung
- `MessageImage` component có lazy loading

### 3. **Format hỗ trợ**

- PNG, JPEG, GIF, WebP (tất cả formats mà Google Gemini hỗ trợ)
- MIME types được bảo toàn từ backend

### 4. **Limitations hiện tại**

- ⚠️ Chưa có UI để cấu hình `imageConfig` (aspect ratio, image size)
- ⚠️ Chưa có UI để chọn `responseModalities` (TEXT only, IMAGE only, hoặc cả hai)
- ℹ️ Có thể thêm settings này vào Chat Input options nếu cần

---

## 🔮 Future Enhancements (Optional)

### 1. **Image Generation Settings Panel**

Có thể thêm vào Chat Input area:

```typescript
interface ImageGenerationSettings {
  enabled: boolean;
  aspectRatio?: '1:1' | '16:9' | '9:16' | ...;
  imageSize?: '1K' | '2K' | '4K';
  modalities: ('TEXT' | 'IMAGE')[];
}
```

### 2. **Image Download Button**

Thêm button để download generated images:

```typescript
// In MessageImage component
<Button onClick={downloadImage}>
  <Download className="h-4 w-4" />
  Download
</Button>
```

### 3. **Image Gallery View**

Hiển thị tất cả images trong conversation dạng gallery:

```typescript
// New component: ImageGallery.tsx
<ImageGallery images={allImagesInChat} />
```

---

## ✅ Checklist Hoàn Thành

- [x] Backend: Thêm types cho image generation
- [x] Backend: Implement Google provider image generation
- [x] Backend: Lưu images vào metadata
- [x] Backend: Convert images thành data URLs
- [x] Frontend: Update LLMModel type
- [x] Frontend: Verify MessageItem hiển thị images
- [x] Frontend: Verify MessageImage component
- [x] Testing: Verify compilation
- [x] Documentation: Tạo guide

---

## 🎉 Kết Luận

**UI không cần thay đổi gì thêm!**

Tất cả infrastructure cần thiết để hiển thị images đã có sẵn trong codebase. Backend đã được cập nhật để tự động lưu generated images vào metadata với format mà UI đã hỗ trợ từ trước (cho image attachments).

Chỉ cần:

1. ✅ Thêm field `supportsImageGeneration` vào frontend types (đã xong)
2. ✅ Backend tự động convert và lưu images (đã xong)
3. ✅ UI tự động hiển thị (đã có sẵn)

**Ready to use!** 🚀
