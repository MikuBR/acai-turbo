/**
 * Fallback independente para Suspense durante lazy loading.
 * Não depende de nenhum store — mostra um spinner simples com mensagem.
 * Usado pelo LazyRoute para garantir feedback visual durante code splitting.
 */
export default function SuspenseFallback() {
  return (
    <div className="flex items-center justify-center h-full min-h-[200px]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium text-muted">Carregando...</span>
      </div>
    </div>
  )
}
