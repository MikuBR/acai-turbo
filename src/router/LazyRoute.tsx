import { Suspense, useEffect, useRef } from 'react'
import { useLocation } from 'react-router'
import SuspenseFallback from './SuspenseFallback'
import { mark, measure } from '../services/performance'

/**
 * Wrapper component que provides Suspense fallback para rotas lazy.
 * Usado em routes.tsx para envolver componentes carregados com React.lazy().
 * O fallback é independente de stores para garantir feedback visual durante code splitting.
 *
 * Também instrumenta o tempo de transição de rota com performance marks.
 */
function LazyRoute({ children }: { children: React.ReactNode }) {
  const location = useLocation()
  const prevPathRef = useRef<string | null>(null)
  const transitionStartRef = useRef<string | null>(null)

  useEffect(() => {
    const currentPath = location.pathname
    const prevPath = prevPathRef.current

    if (prevPath !== null && prevPath !== currentPath) {
      // Transição de rota detectada
      transitionStartRef.current = `route:${prevPath}:start`
      mark(transitionStartRef.current)
    }

    prevPathRef.current = currentPath
  }, [location])

  useEffect(() => {
    const currentPath = location.pathname
    const transitionStart = transitionStartRef.current

    if (transitionStart) {
      const transitionEnd = `route:${currentPath}:end`
      mark(transitionEnd)
      const duration = measure(transitionStart, transitionEnd)
      if (duration !== null) {
        console.log(`[route] transition ${transitionStart} → ${transitionEnd}:`, duration, 'ms')
      }
      transitionStartRef.current = null
    }
  }, [location])

  return (
    <Suspense fallback={<SuspenseFallback />}>
      {children}
    </Suspense>
  )
}

export default LazyRoute
