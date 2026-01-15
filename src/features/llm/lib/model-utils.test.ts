import { describe, it, expect } from 'vitest';
import {
  getEnabledLLMConnections,
  isVisionModel,
  getVisionModelPatterns,
} from './model-utils';
import type { LLMConnection } from '../types';

describe('model-utils', () => {
  describe('getEnabledLLMConnections', () => {
    it('should filter only enabled connections', () => {
      const connections: LLMConnection[] = [
        {
          id: '1',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com',
          provider: 'openai',
          apiKey: 'key1',
          enabled: true,
          models: [],
        },
        {
          id: '2',
          name: 'Anthropic',
          baseUrl: 'https://api.anthropic.com',
          provider: 'anthropic',
          apiKey: 'key2',
          enabled: false,
          models: [],
        },
        {
          id: '3',
          name: 'Google',
          baseUrl: 'https://api.google.com',
          provider: 'google',
          apiKey: 'key3',
          enabled: true,
          models: [],
        },
      ];

      const enabled = getEnabledLLMConnections(connections);

      expect(enabled).toHaveLength(2);
      expect(enabled[0].id).toBe('1');
      expect(enabled[1].id).toBe('3');
    });

    it('should return empty array if no connections enabled', () => {
      const connections: LLMConnection[] = [
        {
          id: '1',
          name: 'OpenAI',
          baseUrl: 'https://api.openai.com',
          provider: 'openai',
          apiKey: 'key1',
          enabled: false,
          models: [],
        },
      ];

      const enabled = getEnabledLLMConnections(connections);

      expect(enabled).toHaveLength(0);
    });

    it('should return empty array for empty input', () => {
      const enabled = getEnabledLLMConnections([]);
      expect(enabled).toHaveLength(0);
    });
  });

  describe('isVisionModel', () => {
    describe('OpenAI models', () => {
      it('should detect GPT-4o models as vision', () => {
        expect(isVisionModel('gpt-4o')).toBe(true);
        expect(isVisionModel('gpt-4o-mini')).toBe(true);
        expect(isVisionModel('gpt-4o-2024-05-13')).toBe(true);
        expect(isVisionModel('GPT-4O')).toBe(true);
      });

      it('should detect GPT-4 Turbo as vision', () => {
        expect(isVisionModel('gpt-4-turbo')).toBe(true);
        expect(isVisionModel('gpt-4-turbo-preview')).toBe(true);
        expect(isVisionModel('GPT-4-TURBO')).toBe(true);
      });

      it('should detect specific GPT-4 vision versions', () => {
        expect(isVisionModel('gpt-4-vision-preview')).toBe(true);
        expect(isVisionModel('gpt-4-0125-preview')).toBe(true);
        expect(isVisionModel('gpt-4-1106-preview')).toBe(true);
        expect(isVisionModel('gpt-4-2024-04-09')).toBe(true);
        expect(isVisionModel('gpt-4-2024-08-06')).toBe(true);
        expect(isVisionModel('gpt-4-2024-11-20')).toBe(true);
      });

      it('should detect O1 models as vision', () => {
        expect(isVisionModel('o1')).toBe(true);
        expect(isVisionModel('o1-preview')).toBe(true);
        expect(isVisionModel('o1-mini')).toBe(true);
      });

      it('should detect GPT-5 models as vision', () => {
        expect(isVisionModel('gpt-5')).toBe(true);
        expect(isVisionModel('gpt-5-turbo')).toBe(true);
      });

      it('should not detect non-vision GPT models', () => {
        expect(isVisionModel('gpt-3.5-turbo')).toBe(false);
        expect(isVisionModel('gpt-4')).toBe(false);
      });
    });

    describe('Anthropic Claude models', () => {
      it('should detect Claude 3 models as vision', () => {
        expect(isVisionModel('claude-3-opus')).toBe(true);
        expect(isVisionModel('claude-3-sonnet')).toBe(true);
        expect(isVisionModel('claude-3-haiku')).toBe(true);
        expect(isVisionModel('claude-3-opus-20240229')).toBe(true);
      });

      it('should detect Claude 3.5 models as vision', () => {
        expect(isVisionModel('claude-3-5-sonnet')).toBe(true);
        expect(isVisionModel('claude-3-5-opus')).toBe(true);
        expect(isVisionModel('claude-3-5-sonnet-20241022')).toBe(true);
      });

      it('should not detect older Claude models', () => {
        expect(isVisionModel('claude-2')).toBe(false);
        expect(isVisionModel('claude-instant')).toBe(false);
      });
    });

    describe('Google Gemini models', () => {
      it('should detect all Gemini models as vision', () => {
        expect(isVisionModel('gemini-pro')).toBe(true);
        expect(isVisionModel('gemini-pro-vision')).toBe(true);
        expect(isVisionModel('gemini-1.5-pro')).toBe(true);
        expect(isVisionModel('gemini-1.5-flash')).toBe(true);
        expect(isVisionModel('gemini-2.0-flash')).toBe(true);
      });
    });

    describe('Ollama vision models', () => {
      it('should detect LLaVA models as vision', () => {
        expect(isVisionModel('llava')).toBe(true);
        expect(isVisionModel('llava:7b')).toBe(true);
        expect(isVisionModel('bakllava')).toBe(true);
      });

      it('should detect other vision models', () => {
        expect(isVisionModel('minicpm-v')).toBe(true);
        expect(isVisionModel('moondream')).toBe(true);
        expect(isVisionModel('custom-vision-model')).toBe(true);
      });
    });

    describe('Edge cases', () => {
      it('should return false for null or undefined', () => {
        expect(isVisionModel(null)).toBe(false);
        expect(isVisionModel(undefined)).toBe(false);
      });

      it('should return false for empty string', () => {
        expect(isVisionModel('')).toBe(false);
      });

      it('should be case-insensitive', () => {
        expect(isVisionModel('GPT-4O')).toBe(true);
        expect(isVisionModel('Claude-3-Opus')).toBe(true);
        expect(isVisionModel('GEMINI-PRO')).toBe(true);
      });

      it('should return false for unknown models', () => {
        expect(isVisionModel('unknown-model')).toBe(false);
        expect(isVisionModel('text-davinci-003')).toBe(false);
      });
    });
  });

  describe('getVisionModelPatterns', () => {
    it('should return array of vision model patterns', () => {
      const patterns = getVisionModelPatterns();

      expect(Array.isArray(patterns)).toBe(true);
      expect(patterns.length).toBeGreaterThan(0);
    });

    it('should include common vision model patterns', () => {
      const patterns = getVisionModelPatterns();

      expect(patterns).toContain('gpt-4-vision');
      expect(patterns).toContain('gpt-4-turbo');
      expect(patterns).toContain('gpt-4o');
      expect(patterns).toContain('claude-3');
      expect(patterns).toContain('gemini-pro-vision');
      expect(patterns).toContain('llava');
    });

    it('should return consistent results', () => {
      const patterns1 = getVisionModelPatterns();
      const patterns2 = getVisionModelPatterns();

      expect(patterns1).toEqual(patterns2);
    });
  });
});
