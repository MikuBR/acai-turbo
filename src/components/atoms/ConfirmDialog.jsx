import { AlertTriangle } from 'lucide-react';

const VARIANT_STYLES = {
  danger: {
    icon: 'text-danger',
    iconBg: 'bg-danger/10',
    iconBorder: 'border-danger/30',
    confirmBtn: 'bg-danger hover:bg-danger',
  },
  warning: {
    icon: 'text-warning',
    iconBg: 'bg-warning/10',
    iconBorder: 'border-warning/30',
    confirmBtn: 'bg-warning hover:bg-warning',
  },
  info: {
    icon: 'text-info',
    iconBg: 'bg-info/10',
    iconBorder: 'border-info/30',
    confirmBtn: 'bg-info hover:bg-info',
  },
};

/**
 * ConfirmDialog — Modal de confirmação estilizado.
 * Substitui window.confirm() por um componente React com o tema do app.
 *
 * @param {boolean} isOpen — Se o modal está visível
 * @param {string} title — Título do modal
 * @param {string} message — Mensagem de confirmação
 * @param {string} [confirmLabel='Confirmar'] — Texto do botão de confirmar
 * @param {string} [cancelLabel='Cancelar'] — Texto do botão de cancelar
 * @param {'danger'|'warning'|'info'} [variant='warning'] — Variante de cor
 * @param {function} onConfirm — Callback ao confirmar
 * @param {function} onCancel — Callback ao cancelar
 */
export default function ConfirmDialog({
  isOpen,
  title = 'Confirmação',
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  variant = 'warning',
  onConfirm,
  onCancel,
}) {
  if (!isOpen) return null;

  const styles = VARIANT_STYLES[variant] || VARIANT_STYLES.warning;

  return (
    <div className="fixed inset-0 bg-surface/80 z-[901] flex items-center justify-center p-6 animate-in fade-in duration-200">
      <div className="bg-card w-full max-w-sm rounded-2xl border border-border p-6 shadow-2xl">
        <div className="flex flex-col items-center text-center gap-4">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center border ${styles.iconBg} ${styles.iconBorder}`}>
            <AlertTriangle size={28} className={styles.icon} />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-primary">{title}</h3>
          <p className="text-xs text-muted leading-relaxed">{message}</p>
        </div>
        <div className="flex gap-2 mt-6">
          <button
            onClick={onCancel}
            className="flex-1 bg-surface-light hover:bg-border py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest text-muted transition-all"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 ${styles.confirmBtn} py-3 rounded-lg font-bold text-[10px] uppercase tracking-widest text-white transition-all active:scale-95`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}