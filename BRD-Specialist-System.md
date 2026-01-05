# Business Requirement Document (BRD)

# Feature: Specialist Agent System (Plugin Architecture)

**Version:** 1.0  
**Date:** 2026-01-05  
**Status:** DRAFT  
**Author:** Antigravity (AI Assistant) & User

---

## 1. Tổng quan (Executive Summary)

Tính năng **Specialist Agent System** chuyển đổi Nexo từ một ứng dụng Chatbot đơn thuần thành một nền tảng Hợp tác Đa tác tử (Multi-Agent Collaboration Platform).

Tính năng cho phép mở rộng khả năng của ứng dụng thông qua các gói đóng gói (Plugins) gọi là "Specialist" (Chuyên gia). Mỗi chuyên gia sở hữu kiến thức (Prompts) và công cụ (Python Tools) riêng biệt. Người dùng tương tác với chuyên gia thông qua cơ chế định tuyến `@mention` trong giao diện chat chính, tạo ra các phiên làm việc song song (Sub-sessions) được quản lý độc lập nhưng hiển thị thống nhất.

---

## 2. Kiến trúc Gói Chuyên gia (Specialist Package Specification)

Mỗi chuyên gia là một file nén `.zip`, khi giải nén sẽ có cấu trúc thư mục chuẩn hoá như sau:

```text
my-specialist-v1/
├── manifest.yaml        # Metadata định danh
├── icon.png             # Avatar hiển thị (Square, 512x512)
├── tools/               # Tool thực thi (Python & MCP)
│   ├── main.py          # Entrypoint (MCP Stdio Server)
│   ├── utils.py         # Helper code
│   └── requirements.txt # Python dependencies
└── instructions/        # Tri thức & Chỉ dẫn
    ├── persona.md       # System Prompt mặc định
    └── workflows/       # (Optional) Các quy trình cụ thể
```

### 2.1. Manifest Specification (`manifest.yaml`)

```yaml
id: 'com.community.seo_expert' # Unique ID (Reverse domain style)
name: 'SEO Audit Master' # Tên hiển thị
version: '1.0.0'
author: 'MagiskBoy'
description: 'Chuyên gia phân tích SEO on-page và tối ưu từ khóa.'
entrypoint: 'tools/main.py' # File python khởi chạy MCP Server
instructions:
  default: 'instructions/persona.md' # File prompt gốc
```

### 2.2. Tool Implementation Standard

- **Ngôn ngữ:** 100% Python.
- **Giao thức:** Sử dụng chuẩn **MCP (Model Context Protocol)** qua `stdio`.
- **Cơ chế:**
  - File `main.py` phải lắng nghe `sys.stdin` và trả kết quả ra `sys.stdout`.
  - Hỗ trợ các JSON-RPC method: `initialize`, `tools/list`, `tools/call`.
- **Môi trường:** Mỗi chuyên gia chạy trong một môi trường ảo (venv) riêng hoặc chung được quản lý bởi `uv` để đảm bảo không xung đột dependencies.

---

## 3. Hệ thống Phân phối & Quản lý (Distribution & Hub)

### 3.1. Specialist Hub (Registry)

Hệ thống phân phối hoạt động theo mô hình **Static Registry** (tương tự Homebrew Taps).

- **Host:** GitHub Repo hoặc S3 Bucket.
- **Index File (`index.json`):** Chứa danh sách các chuyên gia khả dụng.

```json
{
  "packages": [
    {
      "id": "com.community.seo_expert",
      "name": "SEO Audit Master",
      "version": "1.0.0",
      "download_url": "https://hub.nexo.ai/packages/seo_v1.zip",
      "hash": "sha256:...",
      "icon_url": "..."
    }
  ]
}
```

### 3.2. Quy trình Cài đặt (Installation Flow)

**A. Cài từ Hub (Online):**

1. User mở **Specialist Store** trên UI.
2. App fetch `index.json` -> Render danh sách.
3. User Click "Install".
4. App download `.zip` -> Verify Hash -> Unzip vào `~/.nexo/specialists/<id>`.
5. App chạy lệnh setup: `uv pip install -r requirements.txt` (tạo môi trường chạy).

**B. Cài từ Local (Offline/Dev):**

1. User chọn "Import form Disk".
2. Chọn file `.zip`.
3. App thực hiện Unzip và Setup tương tự như trên.

---

## 4. Kiến trúc Runtime & Multi-Agent (Functional Requirements)

### 4.1. Mô hình Phiên làm việc (Session Model)

Hệ thống sử dụng mô hình **Parent-Child Sessions**:

- **Main Session (Parent):** Là luồng chat chính nơi User tương tác. Quản lý luồng hội thoại tổng quát.
- **Specialist Session (Child):** Là các phiên chat phụ, được tạo ra khi User gọi chuyên gia cụ thể trong một Main Session.
  - **Quy tắc:** Mỗi cặp `(MainChatID, SpecialistID)` chỉ tồn tại duy nhất 1 Specialist Session đang active. Điều này giúp Chuyên gia có "trí nhớ" (Memory) xuyên suốt cuộc hội thoại.

### 4.2. Cơ chế Định tuyến (Routing Logic)

Hệ thống KHÔNG dựa vào LLM để quyết định gọi agent, mà dựa vào mệnh lệnh tường minh (**Explicit Intent**):

1. **Trigger:** User bắt đầu tin nhắn bằng ký tự `@`.
2. **Detection:** Frontend/Backend parse chuỗi text. Ví dụ `@coder fix bug`.
3. **Action:**
   - Hệ thống **Bypass** luồng Main Agent.
   - Hệ thống chuyển payload `"fix bug"` sang **Specialist Service**.
   - Service kích hoạt (hoặc resume) Specialist Session của `@coder`.

### 4.3. Luồng dữ liệu (Data Flow) khi gọi Chuyên gia

1. **Input:** User gửi `@agent do task`.
2. **Main UI:** Hiển thị **Agent Card** (Trạng thái: "Đang suy nghĩ...").
3. **Backend Processing:**
   - Load Prompt từ `instructions/persona.md`.
   - Setup MCP Client kết nối tới `main.py` của chuyên gia.
   - Gửi message vào loop xử lý riêng.
   - Chuyên gia tự do suy nghĩ, gọi tool python, đọc file...
4. **Completion:**
   - Chuyên gia hoàn thành.
   - Trả về 2 kết quả:
     - `display_response`: Kết quả hiển thị cho User.
     - `metadata_summary`: Tóm tắt kỹ thuật (để lưu ngầm vào history của Main Agent nếu cần).
5. **Main UI:** Update **Agent Card** thành trạng thái "Done" và hiển thị tóm tắt.

---

## 5. Thiết kế Giao diện & Trải nghiệm (UI/UX)

### 5.1. Chat Interface (Main View)

- **Input Autocomplete:** Khi gõ `@`, hiển thị popover gợi ý danh sách chuyên gia đã cài đặt.
- **Participant Rail:** (Optional) Hiển thị row các avatar chuyên gia đang hoạt động trong chat này ở top header.
- **Collaboration Elements:**
  - Tin nhắn gọi chuyên gia không hiển thị dạng bubble text thông thường.
  - Hiển thị dạng **Interactive Block (Agent Card)**:
    - **Header:** Avatar + Tên chuyên gia.
    - **Body:** Tóm tắt ngắn gọn ("Đã sửa 3 file", "Đang chạy script...").
    - **Actions:** Button "View Details" (Xem chi tiết).

### 5.2. Detail View (Drawer / Sidebar)

Khi User click "View Details" trên Agent Card hoặc Avatar chuyên gia:

- **Interaction:** Một Panel trượt ra từ bên phải (Drawer), che phủ 40-50% màn hình, không làm mất Main Chat.
- **Content:**
  - Hiển thị toàn bộ lịch sử chat RIÊNG TƯ giữa User và Chuyên gia đó.
  - Hiển thị đầy đủ Log: Suy luận (Chain of Thought), Tool Call Input/Output, Code Error, v.v.
  - Có Input riêng để User chat tiếp với chuyên gia này (Context-isolated).

### 5.3. Hub / Verification UI

- Trang Settings quản lý Agent:
  - Tab "Store": Brower online packages.
  - Tab "Installed": Quản lý, Update, Uninstall.
  - Hiển thị rõ permissions mà Agent yêu cầu (nếu sau này mở rộng security).

---

## 6. Hướng dẫn Triển khai Kỹ thuật (Technical Guidelines)

### 6.1. Database Schema (SQLite)

```sql
-- Quản lý liên kết giữa Main Chat và Agent Sessions
CREATE TABLE specialist_sessions (
    id TEXT PRIMARY KEY,                 -- UUID
    parent_chat_id TEXT NOT NULL,        -- FK to chats.id
    specialist_package_id TEXT NOT NULL, -- e.g "com.nexo.coder"
    created_at INTEGER,
    updated_at INTEGER,
    metadata JSON                        -- Lưu trạng thái phụ
);

-- Note: Bảng messages sẽ dùng chat_id tham chiếu tới specialist_sessions.id
-- để lưu nội dung chat chi tiết của session con.
```

### 6.2. Service Layer Refactoring

- **`SpecialistManagerService`**: Quản lý cài đặt, unzip, path resolution, virtual environment (`uv`).
- **`SpecialistRuntimeService`**:
  - Quản lý Process Lifecycle (Spawn/Kill python processes).
  - Duy trì kết nối MCP stateful cho các active sessions.
  - Xử lý "Garbage Collection": Kill process nếu idle quá 30 phút.

---

## 7. Lộ trình phát triển (Roadmap Phased)

### Phase 1: MVP

- [x] Định nghĩa chuẩn Package & Manifest.
- [ ] Implement `SpecialistManager` (Install/Load local zip).
- [ ] Implement UI `@mention` routing.
- [ ] Implement Session DB Schema.
- [ ] Basic Agent Card UI & Drawer View.

### Phase 2: Hub & Remote

- [ ] Xây dựng Static Hub (JSON trên GitHub).
- [ ] Implement Install from URL.
- [ ] Auto-update mechanism.

### Phase 3: Advanced Collaboration

- [ ] Cho phép Main Agent tự đề xuất gọi Specialist (Agent as a Tool).
- [ ] Multi-agent group chat (nhiều agent cùng chat trong Drawer).
