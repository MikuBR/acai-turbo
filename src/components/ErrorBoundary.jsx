import { Component } from 'react';
import logger from '../services/logger.js';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: !!error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('ErrorBoundary caught an error', { error: error?.message || String(error), componentStack: errorInfo?.componentStack });
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
                  {this.state.errorInfo.componentStack}
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

export default ErrorBoundary;
