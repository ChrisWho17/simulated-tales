/**
 * Scene images often arrive as ~1–3 MB base64 data URLs. Persisting those
 * through localStorage / LZ compress / campaign JSON truncates or corrupts
 * them, so the <img> gets a truthy-but-invalid src and shows an empty
 * bg-muted box (onError doesn't always fire for malformed data URLs).
 *
 * Display path: materialize to a blob: URL in memory.
 * Persist path: strip heavy data:/blob: URLs from story before save.
 */

const MIN_DATA_PAYLOAD_CHARS = 8_000; // real 1024 PNG base64 is far larger

export function isHeavyInlineImageUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.startsWith('data:image/') || url.startsWith('blob:');
}

/** True when the string looks like a usable image URL (not truncated junk). */
export function isValidSceneImageUrl(url: string | null | undefined): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed.length > 12;
  }
  if (trimmed.startsWith('blob:')) {
    return trimmed.length > 10;
  }
  if (trimmed.startsWith('data:image/')) {
    const comma = trimmed.indexOf(',');
    if (comma < 0) return false;
    const payload = trimmed.slice(comma + 1);
    return payload.length >= MIN_DATA_PAYLOAD_CHARS;
  }
  return false;
}

/**
 * Convert a data: URL to a blob: URL for reliable <img> display.
 * Returns the original https/blob URL unchanged. Returns null if invalid.
 */
export function toDisplayImageUrl(url: string | null | undefined): string | null {
  if (!isValidSceneImageUrl(url) || !url) return null;
  const trimmed = url.trim();

  if (
    trimmed.startsWith('https://') ||
    trimmed.startsWith('http://') ||
    trimmed.startsWith('blob:')
  ) {
    return trimmed;
  }

  if (!trimmed.startsWith('data:image/')) return null;

  try {
    const comma = trimmed.indexOf(',');
    const header = trimmed.slice(0, comma);
    const b64 = trimmed.slice(comma + 1);
    const mime = header.match(/data:([^;]+)/)?.[1] || 'image/png';
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return URL.createObjectURL(new Blob([bytes], { type: mime }));
  } catch (e) {
    console.warn('[sceneImageUrl] Failed to materialize data URL:', e);
    return null;
  }
}

export function revokeDisplayImageUrl(url: string | null | undefined): void {
  if (url && url.startsWith('blob:')) {
    try {
      URL.revokeObjectURL(url);
    } catch {
      // ignore
    }
  }
}

/** Drop inline image payloads before writing story to storage. */
export function stripHeavyImagesFromStory<T extends { imageUrl?: string }>(
  story: T[]
): T[] {
  return story.map((entry) => {
    if (!entry.imageUrl || !isHeavyInlineImageUrl(entry.imageUrl)) {
      return entry;
    }
    const { imageUrl: _drop, ...rest } = entry;
    return rest as T;
  });
}
