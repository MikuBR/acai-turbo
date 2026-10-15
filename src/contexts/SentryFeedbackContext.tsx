import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

/**
 * Contexto para gerenciar o estado do widget de feedback do Sentry.
 * Permite que o widget seja disparado automaticamente após captura de erro.
 */

interface FeedbackData {
  name: string;
  email: string;
  comments: string;
}

interface SentryFeedbackContextType {
  /** Se o widget de feedback está visível */
  isVisible: boolean;
  /** Erro que disparou o feedback (para contexto) */
  triggerError: Error | null;
  /** Abre o widget de feedback */
  openFeedback: (error?: Error) => void;
  /** Fecha o widget de feedback */
  closeFeedback: () => void;
  /** Envia o feedback ao Sentry */
  submitFeedback: (data: FeedbackData) => Promise<void>;
}

const SentryFeedbackContext = createContext<SentryFeedbackContextType | null>(null);

export function useSentryFeedback() {
  const context = useContext(SentryFeedbackContext);
  if (!context) {
    throw new Error('useSentryFeedback must be used within SentryFeedbackProvider');
  }
  return context;
}

interface SentryFeedbackProviderProps {
  children: ReactNode;
}

export function SentryFeedbackProvider({ children }: SentryFeedbackProviderProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [triggerError, setTriggerError] = useState<Error | null>(null);

  const openFeedback = useCallback((error?: Error) => {
    setTriggerError(error || null);
    setIsVisible(true);
  }, []);

  const closeFeedback = useCallback(() => {
    setIsVisible(false);
    setTriggerError(null);
  }, []);

  const submitFeedback = useCallback(async (data: FeedbackData) => {
    // O envio real é feito pelo componente do widget via Sentry.showReportDialog
    // ou Sentry.captureUserFeedback. Aqui apenas fechamos o widget.
    setIsVisible(false);
    setTriggerError(null);
  }, []);

  return (
    <SentryFeedbackContext.Provider
      value={{
        isVisible,
        triggerError,
        openFeedback,
        closeFeedback,
        submitFeedback,
      }}
    >
      {children}
    </SentryFeedbackContext.Provider>
  );
}

export default SentryFeedbackContext;
