import { describe, it, expect, beforeAll, afterEach, afterAll } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router';
import { render, screen, waitFor } from '@testing-library/react';
import { useAuthStore } from '../store/authStore';
import router from '../router/index.jsx';

// Helper: build a memory router for a given initial route
function buildRouter(initialEntries) {
  // Reset auth state
  useAuthStore.setState({
    currentUser: null,
    authToken: null,
    authTime: 0,
  });

  return createMemoryRouter(
    [
      {
        path: '/login',
        Component: function LoginScreen() {
          return <div data-testid="login-screen">Login Screen Mock</div>;
        },
      },
      {
        path: '/',
        loader: router.routes[1].loader,
        Component: function RootScreen() {
          return <div data-testid="pdv-screen">Main PDV Screen Mock</div>;
        },
      },
    ],
    { initialEntries }
  );
}

describe('router', () => {
  const originalError = console.error;

  beforeAll(() => {
    // React Router logs errors to console for uncaught loader rejections; suppress
    console.error = (...args) => {
      if (typeof args[0] === 'string' && args[0].includes('Could not render')) return;
      originalError.call(console, ...args);
    };
  });

  afterEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      currentUser: null,
      authToken: null,
      authTime: 0,
    });
  });

  afterAll(() => {
    console.error = originalError;
  });

  it('requiresAuth redirects / to /login when no token', async () => {
    const testRouter = buildRouter(['/']);
    render(<RouterProvider router={testRouter} />);

    await waitFor(() => {
      expect(screen.getByTestId('login-screen')).toBeInTheDocument();
    });
  });

  it('requiresAuth allows / when token present', async () => {
    localStorage.setItem('authToken', 'fake-token');
    const testRouter = buildRouter(['/']);

    render(<RouterProvider router={testRouter} />);

    await waitFor(() => {
      expect(screen.getByTestId('pdv-screen')).toBeInTheDocument();
    });
  });
});
