import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const mainSrc = readFileSync(resolve(ROOT, 'main.cjs'), 'utf8');

/**
 * Extract all createHandler() channel names from main.cjs.
 * Pattern: createHandler('channel:name', ...) or createHandler("channel:name", ...)
 */
const createHandlerRe = /createHandler\(\s*['"]([a-z0-9]+(?::[a-z0-9-]+)+)['"]/g;

function extractHandlerChannels(src) {
  const channels = [];
  let m;
  while ((m = createHandlerRe.exec(src)) !== null) {
    channels.push(m[1]);
  }
  return channels;
}

describe('IPC handler uniqueness (main.cjs)', () => {
  it('discovers handlers', () => {
    const channels = extractHandlerChannels(mainSrc);
    expect(channels.length).toBeGreaterThan(50);
  });

  it('no IPC channel is registered more than once via createHandler', () => {
    const channels = extractHandlerChannels(mainSrc);
    const seen = new Set();
    const duplicates = [];
    for (const ch of channels) {
      if (seen.has(ch)) {
        duplicates.push(ch);
      }
      seen.add(ch);
    }
    expect(duplicates).toEqual([]);
  });

  it('clients:get-by-phone appears exactly once', () => {
    const channels = extractHandlerChannels(mainSrc);
    const count = channels.filter(ch => ch === 'clients:get-by-phone').length;
    expect(count).toBe(1);
  });

  it('clients:get appears exactly once', () => {
    const channels = extractHandlerChannels(mainSrc);
    const count = channels.filter(ch => ch === 'clients:get').length;
    expect(count).toBe(1);
  });
});
