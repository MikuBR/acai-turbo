import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import SentryFeedbackWidget from '../components/SentryFeedbackWidget.tsx';
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

// Mock do sentry.js
vi.mock('../services/sentry.js', () => ({
  getSentry: vi.fn(() => mockSentry),
  isSentryInitialized: vi.fn(() => true),
  reportError: vi.fn(),
  addBreadcrumb: vi.fn(),
  setUser: vi.fn(),
  setTag: vi.fn(),
  setContext: vi.fn(),
  initSentry: vi.fn(),
}));

describe('SentryFeedbackWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should not render when not visible', () => {
    render(
      <SentryFeedbackProvider>
        <SentryFeedbackWidget />
      </SentryFeedbackProvider>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should render when visible', () => {
    function TestWrapper() {
      const { openFeedback } = useSentryFeedback();
      
      return (
        <>
          <button onClick={() => openFeedback(new Error('Test error'))}>Open</button>
          <SentryFeedbackWidget />
        </>
      );
    }

    render(
      <SentryFeedbackProvider>
        <TestWrapper />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Reportar um problema')).toBeInTheDocument();
  });

  it('should show error message when triggered by error', () => {
    function TestWrapper() {
      const { openFeedback } = useSentryFeedback();
      
      return (
        <>
          <button onClick={() => openFeedback(new Error('Test error message'))}>Open</button>
          <SentryFeedbackWidget />
        </>
      );
    }

    render(
      <SentryFeedbackProvider>
        <TestWrapper />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));

    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  it('should close on Escape key', () => {
    function TestWrapper() {
      const { openFeedback } = useSentryFeedback();
      
      return (
        <>
          <button onClick={() => openFeedback()}>Open</button>
          <SentryFeedbackWidget />
        </>
      );
    }

    render(
      <SentryFeedbackProvider>
        <TestWrapper />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('should auto-dismiss after 30 seconds', async () => {
    function TestWrapper() {
      const { openFeedback } = useSentryFeedback();
      
      return (
        <>
          <button onClick={() => openFeedback()}>Open</button>
          <SentryFeedbackWidget />
        </>
      );
    }

    render(
      <SentryFeedbackProvider>
        <TestWrapper />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await act(async () => {
      vi.advanceTimersByTime(30000);
    });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  }, 10000);

  it('should submit feedback successfully', async () => {
    function TestWrapper() {
      const { openFeedback } = useSentryFeedback();
      
      return (
        <>
          <button onClick={() => openFeedback(new Error('Test error'))}>Open</button>
          <SentryFeedbackWidget />
        </>
      );
    }

    render(
      <SentryFeedbackProvider>
        <TestWrapper />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));

    fireEvent.change(screen.getByLabelText(/nome/i), { target: { value: 'João' } });
    fireEvent.change(screen.getByLabelText(/e-mail/i), { target: { value: 'joao@test.com' } });
    fireEvent.change(screen.getByLabelText(/descreva/i), { target: { value: 'O app travou quando tentei salvar' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Enviar'));
    });

    expect(mockSentry.captureException).toHaveBeenCalled();
  }, 10000);

  it('should disable submit button when comments are empty', () => {
    function TestWrapper() {
      const { openFeedback } = useSentryFeedback();
      
      return (
        <>
          <button onClick={() => openFeedback()}>Open</button>
          <SentryFeedbackWidget />
        </>
      );
    }

    render(
      <SentryFeedbackProvider>
        <TestWrapper />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));

    const submitButton = screen.getByText('Enviar');
    expect(submitButton).toBeDisabled();
  });

  it('should show success message after submission', async () => {
    function TestWrapper() {
      const { openFeedback } = useSentryFeedback();
      
      return (
        <>
          <button onClick={() => openFeedback(new Error('Test error'))}>Open</button>
          <SentryFeedbackWidget />
        </>
      );
    }

    render(
      <SentryFeedbackProvider>
        <TestWrapper />
      </SentryFeedbackProvider>
    );

    fireEvent.click(screen.getByText('Open'));

    fireEvent.change(screen.getByLabelText(/descreva/i), { target: { value: 'Test comment' } });

    await act(async () => {
      fireEvent.click(screen.getByText('Enviar'));
    });

    expect(screen.getByText(/feedback enviado com sucesso/i)).toBeInTheDocument();
  }, 10000);
});
