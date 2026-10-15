import { Page, Route } from '@playwright/test';

export interface IfoodOrder {
  id: string;
  displayId: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED';
  customer: {
    name: string;
    phone: string;
  };
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  total: number;
  createdAt: string;
}

export interface IfoodEvent {
  id: string;
  orderId: string;
  code: string;
  fullCode: string;
  merchantId: string;
  data?: {
    cancellationReason?: string;
  };
}

const IFOOD_API_BASE = 'https://merchant-api.ifood.com.br';

export class IfoodApiMock {
  private orders: Map<string, IfoodOrder> = new Map();
  private events: IfoodEvent[] = [];
  private eventCounter = 0;
  private orderCounter = 0;
  private failNextPoll = false;
  private failNextToken = false;
  private tokenRefreshCount = 0;

  constructor(private page: Page) {}

  async setup() {
    // Mock token endpoint
    await this.page.route(`${IFOOD_API_BASE}/authentication/v1.0/oauth/token`, async (route: Route) => {
      if (this.failNextToken) {
        this.failNextToken = false;
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'invalid_client' }),
        });
        return;
      }
      this.tokenRefreshCount++;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 3600,
        }),
      });
    });

    // Mock merchant endpoint
    await this.page.route(`${IFOOD_API_BASE}/merchant/v1.0/merchants/*`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'mock-merchant-id',
          name: 'Mock Merchant',
        }),
      });
    });

    // Mock events polling endpoint
    await this.page.route(`${IFOOD_API_BASE}/events/v1.0/events:polling`, async (route: Route) => {
      if (this.failNextPoll) {
        this.failNextPoll = false;
        await route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error' }),
        });
        return;
      }
      const events = this.events.splice(0, this.events.length);
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(events),
      });
    });

    // Mock events acknowledgment endpoint
    await this.page.route(`${IFOOD_API_BASE}/events/v1.0/events/acknowledgment`, async (route: Route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock order details endpoint
    await this.page.route(`${IFOOD_API_BASE}/order/v1.0/orders/*`, async (route: Route) => {
      const url = route.request().url();
      const orderId = url.split('/orders/')[1]?.split('/')[0];
      const order = this.orders.get(orderId);
      
      if (!order) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Order not found' }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(order),
      });
    });

    // Mock order actions (startPreparation, readyToPickup, dispatch)
    await this.page.route(`${IFOOD_API_BASE}/order/v1.0/orders/*/*`, async (route: Route) => {
      const url = route.request().url();
      const parts = url.split('/orders/')[1]?.split('/');
      const orderId = parts?.[0];
      const action = parts?.[1];
      const order = this.orders.get(orderId);

      if (!order) {
        await route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Order not found' }),
        });
        return;
      }

      // Update order status based on action
      if (action === 'startPreparation') {
        order.status = 'PREPARING';
      } else if (action === 'readyToPickup') {
        order.status = 'READY';
      } else if (action === 'dispatch') {
        order.status = 'DISPATCHED';
      }

      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });
  }

  createOrder(customerName: string, items: Array<{ name: string; quantity: number; price: number }>): IfoodOrder {
    this.orderCounter++;
    const orderId = `order-${this.orderCounter}`;
    const order: IfoodOrder = {
      id: orderId,
      displayId: `#${this.orderCounter.toString().padStart(4, '0')}`,
      status: 'PENDING',
      customer: {
        name: customerName,
        phone: '(11) 99999-9999',
      },
      items,
      total: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
      createdAt: new Date().toISOString(),
    };
    this.orders.set(orderId, order);
    return order;
  }

  addEvent(event: Omit<IfoodEvent, 'id'>): IfoodEvent {
    this.eventCounter++;
    const fullEvent: IfoodEvent = {
      ...event,
      id: `event-${this.eventCounter}`,
    };
    this.events.push(fullEvent);
    return fullEvent;
  }

  getOrder(orderId: string): IfoodOrder | undefined {
    return this.orders.get(orderId);
  }

  clearEvents() {
    this.events = [];
  }

  setFailNextPoll(fail: boolean) {
    this.failNextPoll = fail;
  }

  setFailNextToken(fail: boolean) {
    this.failNextToken = fail;
  }

  getTokenRefreshCount(): number {
    return this.tokenRefreshCount;
  }

  reset() {
    this.orders.clear();
    this.events = [];
    this.eventCounter = 0;
    this.orderCounter = 0;
    this.failNextPoll = false;
    this.failNextToken = false;
    this.tokenRefreshCount = 0;
  }
}
