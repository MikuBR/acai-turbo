import { FullConfig } from '@playwright/test';
import { getViteProcess } from './global-setup';

async function globalTeardown(config: FullConfig) {
  const viteProcess = getViteProcess();
  if (viteProcess) {
    viteProcess.kill('SIGTERM');
    console.log('[E2E] Vite dev server stopped');
  }
}

export default globalTeardown;
