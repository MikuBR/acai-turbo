import { FullConfig } from '@playwright/test';
import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';
import { waitForServer } from './wait-for-server';

// Shared state between global-setup and global-teardown
let viteProcess: ChildProcess | null = null;

export function getViteProcess(): ChildProcess | null {
  return viteProcess;
}

async function globalSetup(config: FullConfig) {
  const rootDir = resolve(__dirname, '..');
  
  // Start Vite dev server
  viteProcess = spawn('npx', ['vite', '--port', '5173', '--strictPort'], {
    cwd: rootDir,
    stdio: 'pipe',
    shell: true,
  });

  // Wait for Vite to be ready
  await waitForServer('http://localhost:5173', 30000);

  console.log('[E2E] Vite dev server ready at http://localhost:5173');
}

export default globalSetup;
