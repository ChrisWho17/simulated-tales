import { describe, expect, it } from 'vitest';
import {
  isValidSceneImageUrl,
  stripHeavyImagesFromStory,
  toDisplayImageUrl,
} from '@/lib/sceneImageUrl';

describe('sceneImageUrl', () => {
  it('rejects truncated data URLs that would paint as empty boxes', () => {
    expect(isValidSceneImageUrl('data:image/png;base64,abc')).toBe(false);
    expect(isValidSceneImageUrl(null)).toBe(false);
    expect(isValidSceneImageUrl('')).toBe(false);
  });

  it('accepts https URLs', () => {
    expect(isValidSceneImageUrl('https://example.com/scene.png')).toBe(true);
  });

  it('materializes a small-but-valid-enough synthetic data URL to blob', () => {
    // Build a payload past MIN_DATA_PAYLOAD_CHARS with valid base64 padding
    const chunk = 'A'.repeat(8000);
    const dataUrl = `data:image/png;base64,${chunk}`;
    // atob may throw on non-base64 A's length - use real base64
    const real = btoa('x'.repeat(9000));
    const url = `data:image/png;base64,${real}`;
    expect(isValidSceneImageUrl(url)).toBe(true);
    const display = toDisplayImageUrl(url);
    expect(display).toMatch(/^blob:/);
    if (display) URL.revokeObjectURL(display);
  });

  it('strips heavy images before persist', () => {
    const story = [
      { id: '1', content: 'hi', imageUrl: 'data:image/png;base64,' + 'A'.repeat(100) },
      { id: '2', content: 'yo', imageUrl: 'https://cdn.example/a.png' },
    ];
    const stripped = stripHeavyImagesFromStory(story);
    expect(stripped[0].imageUrl).toBeUndefined();
    expect(stripped[1].imageUrl).toBe('https://cdn.example/a.png');
  });
});
