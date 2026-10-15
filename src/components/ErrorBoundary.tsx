import { Component, ReactNode } from 'react';
import logger from '../services/logger.js';
import { reportError } from '../services/sentry.js';
import { useSentryFeedback } from '../contexts/SentryFeedbackContext.tsx';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: { componentStack: string } | null;
}

/**
 * ErrorBoundary que captura erros React e:
 * 1. Reporta ao Sentry com contexto completo
 * 2. Dispara o widget de feedback automaticamente
 * 3. Mostra UI de erro amigável
 */
class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: !!error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    logger.error('ErrorBoundary caught an error', { error: error?.message || String(error), componentStack: errorInfo?.componentStack });
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Reporta ao Sentry (apenas em produção — o SDK se auto-desabilita em dev)
    reportError(error, {
      tags: { type: 'react_error_boundary' },
      context: { componentStack: errorInfo?.componentStack },
    });

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const isDev = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development';

      return (
        <div className="flex h-screen bg-surface items-center justify-center">
          <div className="bg-card p-8 rounded-2xl border border-border shadow-modal max-w-md text-center">
            <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-danger/30">
              <svg className="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">Erro na Aplicação</h2>
            <p className="text-muted text-sm mb-4">Ocorreu um erro inesperado. Por favor, reinicie o aplicativo.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-success hover:bg-success text-white py-3 px-6 rounded-lg font-bold text-sm uppercase tracking-widest transition-all"
            >
              Reiniciar Aplicação
            </button>
            {isDev && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted cursor-pointer">Detalhes do erro</summary>
                <pre className="mt-2 text-xs bg-surface-light p-2 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Wrapper funcional que usa o hook useSentryFeedback para disparar
 * o widget de feedback automaticamente quando um erro é capturado.
 */
export default function ErrorBoundary({ children }: ErrorBoundaryProps) {
  const { openFeedback } = useSentryFeedback();

  return (
    <ErrorBoundaryClassWithFeedback openFeedback={openFeedback}>
      {children}
    </ErrorBoundaryClassWithFeedback>
  );
}

interface ErrorBoundaryClassWithFeedbackProps extends ErrorBoundaryProps {
  openFeedback: (error?: Error) => void;
}

class ErrorBoundaryClassWithFeedback extends Component<ErrorBoundaryClassWithFeedbackProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryClassWithFeedbackProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: !!error };
  }

  componentDidCatch(error: Error, errorInfo: { componentStack: string }) {
    logger.error('ErrorBoundary caught an error', { error: error?.message || String(error), componentStack: errorInfo?.componentStack });
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Reporta ao Sentry (apenas em produção — o SDK se auto-desabilita em dev)
    reportError(error, {
      tags: { type: 'react_error_boundary' },
      context: { componentStack: errorInfo?.componentStack },
    });

    // Dispara o widget de feedback automaticamente
    this.props.openFeedback(error);

    this.setState({ error, errorInfo });
  }

  render() {
    if (this.state.hasError) {
      const isDev = typeof import.meta !== 'undefined' && import.meta.env?.MODE === 'development';

      return (
        <div className="flex h-screen bg-surface items-center justify-center">
          <div className="bg-card p-8 rounded-2xl border border-border shadow-modal max-w-md text-center">
            <div className="w-20 h-20 bg-danger/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-danger/30">
              <svg className="w-10 h-10 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-primary mb-2">Erro na Aplicação</h2>
            <p className="text-muted text-sm mb-4">Ocorreu um erro inesperado. Por favor, reinicie o aplicativo.</p>
            <button
              onClick={() => window.location.reload()}
              className="bg-success hover:bg-success text-white py-3 px-6 rounded-lg font-bold text-sm uppercase tracking-widest transition-all"
            >
              Reiniciar Aplicação
            </button>
            {isDev && this.state.error && (
              <details className="mt-4 text-left">
                <summary className="text-xs text-muted cursor-pointer">Detalhes do erro</summary>
                <pre className="mt-2 text-xs bg-surface-light p-2 rounded overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
