import { Wifi, WifiOff } from 'lucide-react';

interface ConnectionIndicatorProps {
  isOnline: boolean;
  pendingCount?: number;
}

export function ConnectionIndicator({ isOnline, pendingCount = 0 }: ConnectionIndicatorProps) {
  return (
    <div
      className={`flex items-center gap-1.5 px-2 py-1 rounded-md border transition-all ${
        isOnline
          ? 'bg-success/10 border-success/30'
          : 'bg-danger/10 border-danger/30'
      }`}
      title={isOnline ? 'Conectado' : 'Sem conexão — pedidos serão salvos localmente'}
    >
      {isOnline ? (
        <Wifi size={12} className="text-success" />
      ) : (
        <WifiOff size={12} className="text-danger" />
      )}
      <span className={`text-[10px] font-bold uppercase tracking-wide ${isOnline ? 'text-success' : 'text-danger'}`}>
        {isOnline ? 'Online' : 'Offline'}
      </span>
      {!isOnline && pendingCount > 0 && (
        <span className="text-[9px] font-bold bg-warning text-white px-1.5 py-0.5 rounded-full min-w-[16px] h-[16px] flex items-center justify-center">
          {pendingCount > 9 ? '9+' : pendingCount}
        </span>
      )}
    </div>
  );
}
