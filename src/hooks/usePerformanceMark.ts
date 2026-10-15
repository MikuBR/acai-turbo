// ============================================================
// usePerformanceMark — Hook React para performance marks
// ============================================================
// Facilita a criação de performance marks em componentes React.
// Uso:
//   const { mark, measure } = usePerformanceMark();
//   mark('login-start');
//   // ... operação ...
//   mark('login-end');
//   const duration = measure('login-start', 'login-end');
// ============================================================

import { useCallback, useRef } from 'react';
import { mark as perfMark, measure as perfMeasure } from '../services/performance';

export interface UsePerformanceMarkReturn {
  mark: (name: string) => void;
  measure: (startName: string, endName: string) => number | null;
}

export function usePerformanceMark(): UsePerformanceMarkReturn {
  const marksRef = useRef<Set<string>>(new Set());

  const mark = useCallback((name: string) => {
    perfMark(name);
    marksRef.current.add(name);
  }, []);

  const measure = useCallback((startName: string, endName: string): number | null => {
    return perfMeasure(startName, endName);
  }, []);

  return { mark, measure };
}
