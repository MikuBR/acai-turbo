import useLoadingStore from '../../store/loadingStore'

export default function LoadingOverlay() {
  const { loading, message } = useLoadingStore()

  if (!loading) return null

  return (
    <div className="fixed inset-0 bg-black/40 z-[9998] flex items-center justify-center pointer-events-auto">
      <div className="bg-card p-6 rounded-2xl border border-border shadow-2xl flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        {message && <span className="text-xs font-medium text-muted">{message}</span>}
      </div>
    </div>
  )
}
