# Google Gemini Image Generation Integration Guide

This guide explains how to integrate Google's Nano Banana image generation models into the existing LLM provider architecture.

## Overview

**Nano Banana** is the marketing name for Gemini's native image generation capabilities. Google provides two models with image generation support:

- **Nano Banana** = Gemini 2.5 Flash Image (`gemini-2.5-flash-image`) - Optimized for speed and efficiency
- **Nano Banana Pro** = Gemini 3 Pro Image Preview (`gemini-3-pro-image-preview`) - For professional asset production with up to 4K resolution

These are Gemini models with image generation capabilities, not separate "Nano Banana" models.

## Key Differences from Text-to-Text

The multi-turn flow for image generation is **identical** to text-to-text chat, with only these additions:

1. Add `"IMAGE"` to `responseModalities`
2. Handle `inlineData` in parts (for both input and output)
3. Optional `imageConfig` for aspect ratio and size control
4. Decode base64 image data in responses

## API Endpoint

```
POST https://generativelanguage.googleapis.com/v1beta/models/{model-name}:generateContent
```

**Headers:**

```
x-goog-api-key: YOUR_API_KEY
Content-Type: application/json
```

## Request Format

### 1. Text-to-Image (Simple)

```json
{
  "contents": [
    {
      "parts": [{ "text": "A cat wearing a wizard hat" }]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

### 2. Text-to-Image with Image Config

```json
{
  "contents": [
    {
      "parts": [{ "text": "Create a modern logo for a coffee shop" }]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "imageConfig": {
      "aspectRatio": "16:9",
      "imageSize": "2K"
    }
  }
}
```

### 3. Image-to-Image (Editing)

```json
{
  "contents": [
    {
      "parts": [
        { "text": "Add a wizard hat to this cat" },
        {
          "inlineData": {
            "mimeType": "image/png",
            "data": "<BASE64_ENCODED_IMAGE>"
          }
        }
      ]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

### 4. Multi-turn Conversation

**First turn:**

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Create a logo for a coffee shop" }]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

**Second turn (editing the generated image):**

```json
{
  "contents": [
    {
      "role": "user",
      "parts": [{ "text": "Create a logo for a coffee shop" }]
    },
    {
      "role": "model",
      "parts": [
        { "text": "Here's a modern coffee shop logo..." },
        {
          "inlineData": {
            "mimeType": "image/png",
            "data": "<PREVIOUS_IMAGE_BASE64>"
          }
        }
      ]
    },
    {
      "role": "user",
      "parts": [{ "text": "Make the colors warmer" }]
    }
  ],
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"]
  }
}
```

## Response Format

```json
{
  "candidates": [
    {
      "content": {
        "parts": [
          {
            "text": "Here's the image you requested..."
          },
          {
            "inlineData": {
              "mimeType": "image/png",
              "data": "<BASE64_ENCODED_IMAGE>"
            }
          }
        ],
        "role": "model"
      },
      "finishReason": "STOP"
    }
  ],
  "usageMetadata": {
    "promptTokenCount": 10,
    "candidatesTokenCount": 1290,
    "totalTokenCount": 1300
  }
}
```

## Configuration Options

### Response Modalities

- `["TEXT", "IMAGE"]` - Return both text and image (default)
- `["IMAGE"]` - Return only image, no text description

### Image Config (for gemini-3-pro-image-preview)

**Aspect Ratios:**

- `"1:1"`, `"2:3"`, `"3:2"`, `"3:4"`, `"4:3"`, `"4:5"`, `"5:4"`, `"9:16"`, `"16:9"`, `"21:9"`

**Image Sizes:**

- `"1K"` - ~1024px resolution
- `"2K"` - ~2048px resolution
- `"4K"` - ~4096px resolution

**Note:** `imageSize` is only available for `gemini-3-pro-image-preview`. The `gemini-2.5-flash-image` model always generates at 1024px resolution.

### Example with all options:

```json
{
  "generationConfig": {
    "responseModalities": ["TEXT", "IMAGE"],
    "imageConfig": {
      "aspectRatio": "16:9",
      "imageSize": "2K"
    },
    "temperature": 1.0,
    "topP": 0.95,
    "topK": 40
  }
}
```

## Streaming Support

Image generation **does not support streaming**. You must use the non-streaming endpoint and wait for the complete response.

## Token Costs

### gemini-2.5-flash-image

All aspect ratios: **1290 tokens** per image at 1024px resolution

### gemini-3-pro-image-preview

| Aspect Ratio | 1K Tokens | 2K Tokens | 4K Tokens |
| ------------ | --------- | --------- | --------- |
| All ratios   | 1120      | 1120      | 2000      |

## Implementation Notes

### 1. Reuse Existing Multi-turn Logic

The conversation history structure is identical to text-to-text:

```rust
// Same structure as text chat
let mut messages = vec![
    Message {
        role: "user",
        content: vec![
            Part::Text("Create a logo".to_string())
        ]
    },
    Message {
        role: "model",
        content: vec![
            Part::Text("Here's the logo...".to_string()),
            Part::InlineData {
                mime_type: "image/png",
                data: "<base64>"
            }
        ]
    },
    // ... more turns
];
```

### 2. Handle Image Data in Parts

Add a new variant to your `Part` enum:

```rust
pub enum Part {
    Text(String),
    InlineData {
        mime_type: String,
        data: String, // base64 encoded
    },
}
```

### 3. Decode Base64 Images

```rust
use base64::{Engine as _, engine::general_purpose};

fn decode_image(base64_data: &str) -> Result<Vec<u8>, Error> {
    general_purpose::STANDARD
        .decode(base64_data)
        .map_err(|e| Error::DecodeError(e.to_string()))
}
```

### 4. Add Image Config to Request Builder

```rust
pub struct ImageConfig {
    pub aspect_ratio: Option<String>,
    pub image_size: Option<String>, // "1K", "2K", "4K"
}

pub struct GenerationConfig {
    pub response_modalities: Vec<String>, // ["TEXT", "IMAGE"]
    pub image_config: Option<ImageConfig>,
    pub temperature: Option<f32>,
    // ... other fields
}
```

### 5. Model Selection

```rust
pub enum GoogleModel {
    // Text models
    Gemini15Pro,
    Gemini15Flash,
    Gemini20FlashExp,

    // Image generation models
    Gemini25FlashImage,      // "gemini-2.5-flash-image"
    Gemini3ProImagePreview,  // "gemini-3-pro-image-preview"
}

impl GoogleModel {
    pub fn supports_image_generation(&self) -> bool {
        matches!(self,
            Self::Gemini25FlashImage |
            Self::Gemini3ProImagePreview
        )
    }

    pub fn supports_image_size_config(&self) -> bool {
        matches!(self, Self::Gemini3ProImagePreview)
    }
}
```

## Input Image Limits

- **gemini-2.5-flash-image**: Up to 3 input images
- **gemini-3-pro-image-preview**: Up to 5 high-fidelity images, 14 images total

## Error Handling

Common errors:

1. **Invalid aspect ratio**: Must be one of the supported ratios
2. **Invalid image size**: Must be "1K", "2K", or "4K" (and only for Pro model)
3. **Too many input images**: Exceeds model limits
4. **Invalid base64**: Image data is corrupted
5. **Streaming not supported**: Must use non-streaming endpoint

## Example Integration Flow

```rust
// 1. User sends text prompt
let user_message = Message {
    role: "user",
    content: vec![Part::Text("Create a cat logo".to_string())]
};

// 2. Build request with image generation config
let request = GenerateContentRequest {
    contents: vec![user_message],
    generation_config: GenerationConfig {
        response_modalities: vec!["TEXT".to_string(), "IMAGE".to_string()],
        image_config: Some(ImageConfig {
            aspect_ratio: Some("1:1".to_string()),
            image_size: Some("2K".to_string()),
        }),
        ..Default::default()
    },
};

// 3. Send request and parse response
let response = send_request(request).await?;

// 4. Extract image from response
for part in response.candidates[0].content.parts {
    match part {
        Part::Text(text) => println!("Description: {}", text),
        Part::InlineData { mime_type, data } => {
            let image_bytes = decode_base64(&data)?;
            save_image("output.png", &image_bytes)?;
        }
    }
}

// 5. For next turn, include the generated image in history
let model_message = Message {
    role: "model",
    content: response.candidates[0].content.parts.clone()
};

// 6. User can now edit the image
let edit_message = Message {
    role: "user",
    content: vec![Part::Text("Make it blue".to_string())]
};

// Continue conversation...
```

## Best Practices

1. **Always include previous images in multi-turn**: The model needs context
2. **Use appropriate model**: Flash for speed, Pro for quality
3. **Set reasonable aspect ratios**: Match your UI requirements
4. **Handle token costs**: Image generation uses more tokens
5. **Cache decoded images**: Don't decode the same image multiple times
6. **Validate input images**: Check size and format before encoding

## Testing

Example curl command:

```bash
curl -X POST \
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent" \
  -H "x-goog-api-key: $GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "contents": [{
      "parts": [{"text": "A cute cat wearing a wizard hat"}]
    }],
    "generationConfig": {
      "responseModalities": ["TEXT", "IMAGE"]
    }
  }'
```

## References

- [Official Documentation](https://ai.google.dev/gemini-api/docs/image-generation)
- [Model Pricing](https://ai.google.dev/pricing)
- [API Reference](https://ai.google.dev/api)
