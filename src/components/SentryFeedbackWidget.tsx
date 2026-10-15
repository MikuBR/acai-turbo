import { useState, useEffect, useCallback, useRef } from 'react';
import { useSentryFeedback } from '../contexts/SentryFeedbackContext.tsx';
import { getSentry, isSentryInitialized } from '../services/sentry.js';

/**
 * Widget de feedback do usuário para o Sentry.
 * 
 * Características:
 * - Aparece como painel deslizante (não-modal, não interrompe o usuário)
 * - Auto-dismiss após 30 segundos se o usuário não interagir
 * - Coleta nome, email e comentários
 * - Envia feedback ao Sentry via captureUserFeedback
 * - Disparado automaticamente após captura de erro (via contexto)
 * - Também pode ser aberto manualmente via SentryFeedbackButton
 */

export default function SentryFeedbackWidget() {
  const { isVisible, triggerError, closeFeedback, submitFeedback } = useSentryFeedback();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comments, setComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [isExpanded, setIsExpanded] = useState(false);
  const autoDismissRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const widgetRef = useRef<HTMLDivElement>(null);

  // Auto-dismiss após 30 segundos
  useEffect(() => {
    if (isVisible) {
      setIsExpanded(false);
      setSubmitStatus('idle');
      
      autoDismissRef.current = setTimeout(() => {
        closeFeedback();
      }, 30000);

      return () => {
        if (autoDismissRef.current) {
          clearTimeout(autoDismissRef.current);
        }
      };
    }
  }, [isVisible, closeFeedback]);

  // Foco no widget quando abrir
  useEffect(() => {
    if (isVisible && widgetRef.current) {
      widgetRef.current.focus();
    }
  }, [isVisible]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSentryInitialized()) {
      setSubmitStatus('error');
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus('idle');

    try {
      const Sentry = getSentry();
      
      // Envia feedback ao Sentry associado ao erro (se houver)
      const eventId = triggerError 
        ? Sentry.captureException(triggerError, {
            tags: { feedback_triggered: true },
          })
        : undefined;

      // Se temos um eventId, associamos o feedback
      if (eventId && Sentry.captureUserFeedback) {
        Sentry.captureUserFeedback({
          event_id: eventId,
          name,
          email,
          comments,
        });
      }

      setSubmitStatus('success');
      
      // Fecha após 2 segundos
      setTimeout(() => {
        closeFeedback();
      }, 2000);
    } catch (err) {
      console.error('[SentryFeedback] Erro ao enviar feedback:', err);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [name, email, comments, triggerError, closeFeedback]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      closeFeedback();
    }
  }, [closeFeedback]);

  if (!isVisible) {
    return null;
  }

  return (
    <div
      ref={widgetRef}
      role="dialog"
      aria-label="Enviar feedback sobre o problema"
      aria-modal="false"
      tabIndex={-1}
      onKeyDown={handleKeyDown}
      className="fixed bottom-4 right-4 z-50 w-80 max-w-[calc(100vw-2rem)] animate-slide-up"
    >
      <div className="bg-card border border-border rounded-2xl shadow-modal overflow-hidden">
        {/* Header */}
        <div className="bg-gray-700 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"
              />
            </svg>
            <span className="font-semibold text-sm">Reportar um problema</span>
          </div>
          <button
            onClick={closeFeedback}
            className="text-white/70 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="text-sm text-muted mb-3">
            Ocorreu um erro inesperado. Descreva o que aconteceu para nos ajudar a melhorar.
          </p>

          {triggerError && (
            <div className="mb-3 p-2 bg-surface-light rounded-lg text-xs text-muted">
              <strong>Erro:</strong> {triggerError.message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label htmlFor="feedback-name" className="block text-xs font-medium text-muted mb-1">
                Nome (opcional)
              </label>
              <input
                id="feedback-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Seu nome"
              />
            </div>

            <div>
              <label htmlFor="feedback-email" className="block text-xs font-medium text-muted mb-1">
                E-mail (opcional)
              </label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="seu@email.com"
              />
            </div>

            <div>
              <label htmlFor="feedback-comments" className="block text-xs font-medium text-muted mb-1">
                Descreva o problema *
              </label>
              <textarea
                id="feedback-comments"
                value={comments}
                onChange={(e) => setComments(e.target.value)}
                required
                rows={3}
                className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-sm text-primary focus:outline-none focus:ring-2 focus:ring-gray-500 resize-none"
                placeholder="O que você estava fazendo quando o erro ocorreu?"
              />
            </div>

            {submitStatus === 'success' && (
              <div className="p-2 bg-success/10 border border-success/30 rounded-lg text-sm text-success">
                Feedback enviado com sucesso! Obrigado!
              </div>
            )}

            {submitStatus === 'error' && (
              <div className="p-2 bg-danger/10 border border-danger/30 rounded-lg text-sm text-danger">
                Erro ao enviar feedback. Tente novamente.
              </div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeFeedback}
                className="flex-1 px-4 py-2 bg-surface border border-border rounded-lg text-sm text-muted hover:bg-surface-light transition-colors"
              >
                Fechar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !comments.trim()}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
