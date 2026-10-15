import { request } from '@playwright/test';

export async function waitForServer(url: string, timeoutMs: number): Promise<void> {
  const start = Date.now();
  const interval = 500;
  
  while (Date.now() - start < timeoutMs) {
    try {
      const response = await request.get(url);
      if (response.ok()) {
        return;
      }
    } catch {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, interval));
  }
  
  throw new Error(`Server at ${url} did not start within ${timeoutMs}ms`);
}
