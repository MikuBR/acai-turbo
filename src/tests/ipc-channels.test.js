import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect } from 'vitest';
import { validateIPC } from '../../database/validate.cjs';

/**
 * Consistência IPC (política documentada em AGENTS.md):
 *   1. Todo canal no allowlist do preload.js tem handler em main.cjs.
 *   2. Todo handler em main.cjs está no allowlist do preload.js (canal fantasma
 *      do contrário — o renderer nunca consegue invocá-lo).
 *   3. Canais push (main → renderer, via webContents.send) não têm
 *      `ipcMain.handle`, mas precisam estar no allowlist para o `on`/`once`
 *      do preload não logar erro de canal não permitido.
 */

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const read = (rel) => readFileSync(resolve(ROOT, rel), 'utf8');

const preloadSrc = read('preload.js');
const mainSrc = read('main.cjs');

const CHANNEL = String.raw`[a-z0-9]+(?::[a-z0-9-]+)+`;

const extractChannels = (src, pattern) => {
  const re = new RegExp(pattern, 'g');
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
};

const allowed = new Set(extractChannels(
  preloadSrc.match(/ALLOWED_CHANNELS\s*=\s*\{([\s\S]*?)\n\};/)[1],
  String.raw`['"](${CHANNEL})['"]\s*:\s*true`,
));

const handled = new Set([
  ...extractChannels(mainSrc, String.raw`createHandler\(\s*['"](${CHANNEL})['"]`),
  ...extractChannels(mainSrc, String.raw`ipcMain\.handle\(\s*['"](${CHANNEL})['"]`),
]);

// Canais push registrados no renderer via `on`/`once` (main → renderer).
const PUSH_ONLY = new Set(['ifood:new-order', 'ifood:order-cancelled']);
const SOURCE_EXTENSIONS = /\.(js|jsx|ts|tsx)$/;

const walk = (dir, rel = '', out = []) => {
  for (const entry of readdirSync(dir)) {
    const abs = resolve(dir, entry);
    const path = rel ? `${rel}/${entry}` : entry;
    if (statSync(abs).isDirectory()) walk(abs, path, out);
    else if (SOURCE_EXTENSIONS.test(entry)) out.push({ path, abs });
  }
  return out;
};

describe('IPC channel consistency (preload.js ↔ main.cjs)', () => {
  it('discovers the expected surfaces', () => {
    expect(allowed.size).toBeGreaterThan(60);
    expect(handled.size).toBeGreaterThan(50);
  });

  it('every main.cjs handler is allowlisted in preload.js', () => {
    const orphanHandlers = [...handled].filter(c => !allowed.has(c)).sort();
    expect(orphanHandlers).toEqual([]);
  });

  it('every preload.js allowlist entry has a main.cjs handler (or is push-only)', () => {
    const ghosts = [...allowed]
      .filter(c => !handled.has(c) && !PUSH_ONLY.has(c))
      .sort();
    expect(ghosts).toEqual([]);
  });

  it('audit #1 — ifood:start-polling is allowlisted, handled and validated', () => {
    expect(allowed.has('ifood:start-polling')).toBe(true);
    expect(handled.has('ifood:start-polling')).toBe(true);
    expect(
      validateIPC('ifood:start-polling', { clientId: 'c', clientSecret: 's', merchantId: 'm', enabled: true }).success,
    ).toBe(true);
  });

  it('audit #2 — app:check-unsaved-orders and app:shutdown left the allowlist', () => {
    expect(allowed.has('app:check-unsaved-orders')).toBe(false);
    expect(allowed.has('app:shutdown')).toBe(false);
  });

  it('audit #2 — clients:get-by-phone is allowlisted, handled and validated', () => {
    expect(allowed.has('clients:get-by-phone')).toBe(true);
    expect(handled.has('clients:get-by-phone')).toBe(true);
    expect(validateIPC('clients:get-by-phone', '(11) 99999-9999').success).toBe(true);
  });

  it('no live source file references the removed ghost channels', () => {
    const offenders = walk(resolve(ROOT, 'src'))
      .filter(({ path, abs }) =>
        !path.endsWith('App.jsx')
        && !path.endsWith('tests/ipc-channels.test.js')
        && /app:check-unsaved-orders|app:shutdown/.test(readFileSync(abs, 'utf8')))
      .map(({ path }) => path)
      .sort();
    expect(offenders).toEqual([]);
  });

  it('ghost components from the audit report are deleted', () => {
    const dead = [
      'src/App.jsx',
      'src/App.css',
      'src/components/organisms/Sidebar.jsx',
      'src/components/organisms/CatalogPanel.jsx',
      'src/components/templates/MainLayout.jsx',
      'src/components/templates/ModalLayout.jsx',
      'src/components/molecules/AdjustStockModal.jsx',
      'src/components/atoms/ConfirmDialog.jsx',
      'src/components/molecules/ModalHeader.jsx',
      'src/components/molecules/ModalFooter.jsx',
      'src/components/ui/ThemeToggle.jsx',
      'src/components/ui/ScrollArea.jsx',
      'src/components/ui/Divider.jsx',
    ];
    const stillThere = dead.filter((f) => existsSync(resolve(ROOT, f)));
    expect(stillThere).toEqual([]);
  });
});
