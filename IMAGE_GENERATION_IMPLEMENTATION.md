# Image Generation Implementation Summary

## Overview

This document summarizes the implementation of Google Gemini image generation support (Nano Banana models) in the Nexo project.

## Changes Made

### 1. Type System Updates (`src-tauri/src/models/llm_types.rs`)

#### Added New Types:

- **`InlineData` struct**: For handling base64-encoded image data

  ```rust
  pub struct InlineData {
      pub mime_type: String,
      pub data: String, // base64 encoded
  }
  ```

- **`ImageConfig` struct**: For configuring image generation parameters

  ```rust
  pub struct ImageConfig {
      pub aspect_ratio: Option<String>,
      pub image_size: Option<String>, // "1K", "2K", "4K"
  }
  ```

- **`AssistantContent` enum**: To support both text and multi-part responses from assistants
  ```rust
  pub enum AssistantContent {
      Text(String),
      Parts(Vec<ContentPart>),
  }
  ```

#### Updated Types:

- **`ContentPart` enum**: Added `InlineData` variant for inline image data
- **`ChatMessage::Assistant`**: Changed content type from `String` to `AssistantContent`
- **`LLMChatRequest`**: Added `response_modalities` and `image_config` fields
- **`LLMChatResponse`**: Added `images` field to return generated images
- **`LLMModel`**: Added `supports_image_generation` flag

### 2. Google Provider Updates (`src-tauri/src/services/llm/providers/google.rs`)

#### Model Detection:

- Updated `check_model_capabilities()` to detect image generation models
- Returns 3-tuple: `(supports_tools, supports_thinking, supports_image_generation)`
- Detects models containing "image", "gemini-2.5-flash-image", or "gemini-3-pro-image"

#### Fallback Models:

- Added `gemini-2.5-flash-image` model
- Added `gemini-3-pro-image-preview` model
- Updated all existing models with `supports_image_generation: false`

#### Request Building:

- Added support for `responseModalities` in generation config
- Added support for `imageConfig` with aspect ratio and image size
- Handle `AssistantContent::Parts` for multi-turn image conversations
- Support `ContentPart::InlineData` for passing images in conversation history

#### Response Parsing:

- **Streaming handler**: Parse `inlineData` from response parts and collect images
- **Non-streaming handler**: Parse `inlineData` from response parts and collect images
- Return images in `LLMChatResponse.images` field

### 3. Other Provider Updates

#### Anthropic Provider (`src-tauri/src/services/llm/providers/anthropic.rs`)

- Updated to handle `AssistantContent::Text` and `AssistantContent::Parts`
- Added `ContentPart::InlineData` handling (converts to image blocks if applicable)
- Added `supports_image_generation: false` to all models
- Added `images: None` to all responses

#### OpenAI Provider (`src-tauri/src/services/llm/providers/openai.rs`)

- Added `supports_image_generation: false` to all models
- Added `images: None` to all responses

#### OpenAI Compatible Provider (`src-tauri/src/services/llm/providers/openai_compat.rs`)

- Added `supports_image_generation: false` to all models
- Added `images: None` to all responses

### 4. Chat Service Updates (`src-tauri/src/services/chat_service.rs`)

- Updated `LLMChatRequest` creation to include `response_modalities: None` and `image_config: None`
- Updated `ChatMessage::Assistant` creation to wrap content in `AssistantContent::Text()`

## How to Use

### Basic Text-to-Image Generation

```rust
let request = LLMChatRequest {
    model: "gemini-2.5-flash-image".to_string(),
    messages: vec![
        ChatMessage::User {
            content: UserContent::Text("Create a cat wearing a wizard hat".to_string())
        }
    ],
    response_modalities: Some(vec!["TEXT".to_string(), "IMAGE".to_string()]),
    image_config: Some(ImageConfig {
        aspect_ratio: Some("1:1".to_string()),
        image_size: Some("2K".to_string()),
    }),
    // ... other fields
};
```

### Multi-turn Image Editing

```rust
// First turn - generate image
let first_response = llm_service.chat(request1).await?;

// Extract generated image
let generated_image = first_response.images.as_ref().unwrap()[0].clone();

// Second turn - edit the image
let request2 = LLMChatRequest {
    messages: vec![
        // Previous conversation
        ChatMessage::User {
            content: UserContent::Text("Create a cat logo".to_string())
        },
        ChatMessage::Assistant {
            content: AssistantContent::Parts(vec![
                ContentPart::Text { text: "Here's your logo...".to_string() },
                ContentPart::InlineData { inline_data: generated_image }
            ]),
            tool_calls: None,
        },
        // New request
        ChatMessage::User {
            content: UserContent::Text("Make it blue".to_string())
        }
    ],
    response_modalities: Some(vec!["TEXT".to_string(), "IMAGE".to_string()]),
    // ... other fields
};
```

## Supported Models

### Google Gemini Image Generation Models:

1. **gemini-2.5-flash-image** (Nano Banana)
   - Optimized for speed and efficiency
   - Fixed 1024px resolution
   - Supports all aspect ratios
   - Up to 3 input images

2. **gemini-3-pro-image-preview** (Nano Banana Pro)
   - Professional asset production
   - Configurable resolution: 1K, 2K, 4K
   - Supports all aspect ratios
   - Up to 5 high-fidelity images (14 total)

### Supported Aspect Ratios:

- `1:1`, `2:3`, `3:2`, `3:4`, `4:3`, `4:5`, `5:4`, `9:16`, `16:9`, `21:9`

### Supported Image Sizes (gemini-3-pro-image-preview only):

- `1K` - ~1024px resolution
- `2K` - ~2048px resolution
- `4K` - ~4096px resolution

## Key Features

1. **Multi-turn conversations**: Images are preserved in conversation history for editing
2. **Flexible modalities**: Can request text-only, image-only, or both
3. **Configuration options**: Control aspect ratio and image size
4. **Base64 encoding**: Images are returned as base64-encoded data
5. **Backwards compatibility**: All existing functionality remains unchanged

## Notes

- Image generation does **not support streaming**
- Generated images are returned as base64-encoded data in the `images` field
- The `responseModalities` field controls what types of content are generated
- Image configuration is optional - defaults are used if not specified
- Token costs vary by aspect ratio and resolution (see guide for details)

## Testing

To test the implementation:

```bash
# Verify compilation
cd src-tauri && cargo check --no-default-features

# Run clippy
cargo clippy --no-default-features

# Build the project
cargo build
```

## References

- Implementation guide: `GOOGLE_TEXT_TO_IMAGE.md`
- Official documentation: https://ai.google.dev/gemini-api/docs/image-generation
- Model pricing: https://ai.google.dev/pricing
