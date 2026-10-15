import { test, expect, Page, ElectronApplication, _electron as electron } from '@playwright/test';
import { IfoodApiMock } from './helpers/ifood-mock';
import { resolve } from 'path';

let electronApp: ElectronApplication;
let page: Page;
let ifoodMock: IfoodApiMock;

test.beforeAll(async () => {
  // Launch Electron (Vite is already started by global-setup)
  electronApp = await electron.launch({
    args: [resolve(__dirname, '..')],
    env: {
      ...process.env,
      NODE_ENV: 'test',
      ELECTRON_ENABLE_LOGGING: '1',
    },
  });

  // Wait for the app to be ready
  await electronApp.waitForEvent('window');
  page = await electronApp.firstWindow();
  await page.waitForLoadState('domcontentloaded');
  
  // Configure iFood credentials so the poll handler makes HTTP calls
  await page.evaluate(async () => {
    const config = window.electron.ipcRenderer;
    await config.invoke('config:update', { key: 'ifood_client_id', value: 'mock-client-id' });
    await config.invoke('config:update', { key: 'ifood_client_secret', value: 'mock-client-secret' });
    await config.invoke('config:update', { key: 'ifood_access_token', value: 'mock-access-token' });
    await config.invoke('config:update', { key: 'ifood_merchant_id', value: 'mock-merchant-id' });
    await config.invoke('config:update', { key: 'ifood_token_expires_at', value: String(Date.now() + 3600000) });
  });
  
  // Initialize iFood mock
  ifoodMock = new IfoodApiMock(page);
  await ifoodMock.setup();
  
  console.log('[E2E] Electron app ready');
});

test.beforeEach(async () => {
  // Reset mock state between tests
  ifoodMock.reset();
});

test.afterAll(async () => {
  if (electronApp) {
    await electronApp.close();
  }
});

test.describe('iFood Integration E2E', () => {
  test('should complete full order flow: placed → confirmed → preparing → ready → dispatched', async () => {
    // Create a new order
    const order = ifoodMock.createOrder('João Silva', [
      { name: 'Açaí 500ml', quantity: 1, price: 15.00 },
      { name: 'Granola', quantity: 1, price: 5.00 },
    ]);

    // Add PLACED event
    ifoodMock.addEvent({
      orderId: order.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });

    // Trigger poll via IPC
    const pollResult = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    expect(pollResult.success).toBe(true);
    expect(pollResult.events).toHaveLength(1);
    expect(pollResult.events[0].orderId).toBe(order.id);

    // Verify order was added to pending orders
    const pendingCount = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });
    expect(pendingCount.pendingCount).toBeGreaterThan(0);

    // Start preparation
    const startPrepResult = await page.evaluate(async (orderId) => {
      return await window.electron.ipcRenderer.invoke('ifood:start-preparation', { orderId });
    }, order.id);

    expect(startPrepResult.success).toBe(true);

    // Verify order status changed
    const updatedOrder = ifoodMock.getOrder(order.id);
    expect(updatedOrder?.status).toBe('PREPARING');

    // Ready to pickup
    const readyResult = await page.evaluate(async (orderId) => {
      return await window.electron.ipcRenderer.invoke('ifood:ready-to-pickup', { orderId });
    }, order.id);

    expect(readyResult.success).toBe(true);
    expect(ifoodMock.getOrder(order.id)?.status).toBe('READY');

    // Dispatch
    const dispatchResult = await page.evaluate(async (orderId) => {
      return await window.electron.ipcRenderer.invoke('ifood:dispatch', { orderId });
    }, order.id);

    expect(dispatchResult.success).toBe(true);
    expect(ifoodMock.getOrder(order.id)?.status).toBe('DISPATCHED');
  });

  test('should handle order cancellation', async () => {
    // Create a new order
    const order = ifoodMock.createOrder('Maria Santos', [
      { name: 'Açaí 300ml', quantity: 2, price: 10.00 },
    ]);

    // Add PLACED event
    ifoodMock.addEvent({
      orderId: order.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });

    // Poll to process the order
    await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    // Add CANCELLED event
    ifoodMock.addEvent({
      orderId: order.id,
      code: 'CAN',
      fullCode: 'CANCELLED',
      merchantId: 'mock-merchant-id',
      data: {
        cancellationReason: 'Cliente cancelou o pedido',
      },
    });

    // Poll to process cancellation
    const pollResult = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    expect(pollResult.success).toBe(true);

    // Verify order status changed to cancelled
    const updatedOrder = ifoodMock.getOrder(order.id);
    expect(updatedOrder?.status).toBe('CANCELLED');
  });

  test('should handle connection loss and recovery', async () => {
    // Create a new order
    const order = ifoodMock.createOrder('Pedro Oliveira', [
      { name: 'Açaí 700ml', quantity: 1, price: 20.00 },
    ]);

    // Add PLACED event
    ifoodMock.addEvent({
      orderId: order.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });

    // Simulate connection loss by making the next poll fail
    ifoodMock.setFailNextPoll(true);

    // Poll should handle error gracefully
    const pollResult = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    // Should return error (not crash)
    expect(pollResult.success).toBe(false);

    // Add event again (simulating recovery)
    ifoodMock.addEvent({
      orderId: order.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });

    // Poll again - should work
    const recoveryPollResult = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    expect(recoveryPollResult.success).toBe(true);
    expect(recoveryPollResult.events.length).toBeGreaterThan(0);
  });

  test('should handle multiple orders simultaneously', async () => {
    // Create multiple orders
    const order1 = ifoodMock.createOrder('Customer 1', [
      { name: 'Açaí 500ml', quantity: 1, price: 15.00 },
    ]);
    const order2 = ifoodMock.createOrder('Customer 2', [
      { name: 'Açaí 300ml', quantity: 2, price: 10.00 },
    ]);
    const order3 = ifoodMock.createOrder('Customer 3', [
      { name: 'Açaí 700ml', quantity: 1, price: 20.00 },
    ]);

    // Add events for all orders
    ifoodMock.addEvent({
      orderId: order1.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });
    ifoodMock.addEvent({
      orderId: order2.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });
    ifoodMock.addEvent({
      orderId: order3.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });

    // Poll to process all orders
    const pollResult = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    expect(pollResult.success).toBe(true);
    expect(pollResult.events).toHaveLength(3);

    // Verify all orders are in pending
    const pendingResult = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });
    expect(pendingResult.pendingCount).toBeGreaterThanOrEqual(3);
  });

  test('should handle token refresh on 401 error', async () => {
    // This test verifies that the app handles token expiration gracefully
    // The mock will return 401 on first request, then 200 after token refresh
    
    const order = ifoodMock.createOrder('Token Test Customer', [
      { name: 'Açaí 500ml', quantity: 1, price: 15.00 },
    ]);

    ifoodMock.addEvent({
      orderId: order.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });

    // Make the next token request fail with 401
    ifoodMock.setFailNextToken(true);

    // Poll should handle token refresh automatically
    const pollResult = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    expect(pollResult.success).toBe(true);
  });

  test('should acknowledge events after processing', async () => {
    const order = ifoodMock.createOrder('Ack Test Customer', [
      { name: 'Açaí 500ml', quantity: 1, price: 15.00 },
    ]);

    ifoodMock.addEvent({
      orderId: order.id,
      code: 'PLC',
      fullCode: 'PLACED',
      merchantId: 'mock-merchant-id',
    });

    // Poll to process
    await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    // Verify events were cleared (acknowledged)
    const secondPollResult = await page.evaluate(async () => {
      return await window.electron.ipcRenderer.invoke('ifood:poll');
    });

    // Should not return the same events again
    expect(secondPollResult.events).toHaveLength(0);
  });
});
