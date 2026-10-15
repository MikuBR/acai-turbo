import { useCallback } from 'react'
import { usePreloadOnHover } from '../../hooks/usePreloadRoute.js'

interface PreloadLinkProps {
  to: string
  modulePath: string
  children: React.ReactNode
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void
  [key: string]: unknown
}

/**
 * Link com preload de rota no hover/focus.
 * 
 * Quando o usuário passa o mouse ou foca no link, o chunk da rota
 * é carregado antecipadamente, acelerando a navegação.
 */
export default function PreloadLink({ to, modulePath, children, ...rest }: PreloadLinkProps) {
  const { handleMouseEnter, handleFocus } = usePreloadOnHover(modulePath);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    // Se já está preloadado, a navegação é instantânea
    // O react-router cuida da navegação normal
    if (rest.onClick) {
      rest.onClick(e);
    }
  }, [rest]);

  return (
    <a
      href={`#${to}`}
      onMouseEnter={handleMouseEnter}
      onFocus={handleFocus}
      onClick={handleClick}
      {...rest}
    >
      {children}
    </a>
  );
}
