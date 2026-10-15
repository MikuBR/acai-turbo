import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { SentryFeedbackProvider, useSentryFeedback } from '../contexts/SentryFeedbackContext.tsx';

// Mock do Sentry
const { mockSentry } = vi.hoisted(() => ({
  mockSentry: {
    init: vi.fn(),
    addBreadcrumb: vi.fn(),
    captureException: vi.fn(() => 'event-id-123'),
    withScope: vi.fn((fn) => fn({ setExtra: vi.fn(), setTag: vi.fn() })),
    setUser: vi.fn(),
    setTag: vi.fn(),
    setContext: vi.fn(),
    browserTracingIntegration: vi.fn(() => ({ name: 'browserTracing' })),
    showReportDialog: vi.fn(),
    captureUserFeedback: vi.fn(),
  },
}));

vi.mock('@sentry/react', () => mockSentry);

// Componente de teste para acessar o contexto
function TestComponent() {
  const { isVisible, triggerError, openFeedback, closeFeedback, submitFeedback } = useSentryFeedback();
  
  return (
    <div>
      <div data-testid="visible">{isVisible.toString()}</div>
      <div data-testid="error">{triggerError?.message || 'none'}</div>
      <button onClick={() => openFeedback(new Error('Test error'))}>Open</button>
      <button onClick={closeFeedback}>Close</button>
      <button onClick={() => submitFeedback({ name: 'Test', email: 'test@test.com', comments: 'Test comment' })}>
        Submit
      </button>
    </div>
  );
}

describe('SentryFeedbackContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should provide initial state', () => {
    render(
      <SentryFeedbackProvider>
        <TestComponent />
      </SentryFeedbackProvider>
    );

    expect(screen.getByTestId('visible').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('should open feedback with error', () => {
    render(
      <SentryFeedbackProvider>
        <TestComponent />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));

    expect(screen.getByTestId('visible').textContent).toBe('true');
    expect(screen.getByTestId('error').textContent).toBe('Test error');
  });

  it('should close feedback', () => {
    render(
      <SentryFeedbackProvider>
        <TestComponent />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByTestId('visible').textContent).toBe('true');

    fireEvent.click(screen.getByText('Close'));
    expect(screen.getByTestId('visible').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('none');
  });

  it('should submit feedback', async () => {
    render(
      <SentryFeedbackProvider>
        <TestComponent />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));
    fireEvent.click(screen.getByText('Submit'));

    await waitFor(() => {
      expect(screen.getByTestId('visible').textContent).toBe('false');
    });
  });

  it('should throw error when used outside provider', () => {
    // Suprime o erro esperado do console
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponent />);
    }).toThrow('useSentryFeedback must be used within SentryFeedbackProvider');

    consoleSpy.mockRestore();
  });
});
