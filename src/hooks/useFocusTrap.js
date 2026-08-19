import { useEffect, useRef } from 'react';

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Trava o foco dentro de um container (modal/dialog).
 * - Foca o primeiro elemento focável assim que ativado.
 * - Intercepta Tab / Shift+Tab para impedir que o foco escape do container.
 * - Remove o listener ao desativar / desmontar.
 *
 * @param {boolean} isActive - define se o trap está ativo (ex: modal aberto).
 * @returns {import('react').RefObject<HTMLElement|null>} containerRef - anexar ao elemento raiz do container.
 */
export default function useFocusTrap(isActive = true) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isActive) return undefined;
    const container = containerRef.current;
    if (!container) return undefined;

    const getFocusable = () =>
      Array.from(container.querySelectorAll(FOCUSABLE_SELECTOR));

    const handleKeyDown = (e) => {
      if (e.key !== 'Tab') return;
      const focusables = getFocusable();
      if (focusables.length === 0) {
        e.preventDefault();
        return;
      }
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;
      const isInside = container.contains(active);

      if (e.shiftKey) {
        if (!isInside || active === first) {
          e.preventDefault();
          last.focus();
        }
      } else if (!isInside || active === last) {
        e.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    const initial = getFocusable()[0];
    if (initial && !container.contains(document.activeElement)) {
      initial.focus();
    }

    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isActive]);

  return containerRef;
}
