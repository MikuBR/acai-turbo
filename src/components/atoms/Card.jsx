
export default function Card({ children, className = '', hover = false, padding = 'p-4', onClick, ...props }) {
  return (
    <div
      onClick={onClick}
      className={`bg-card border-border rounded-xl shadow-sm ${padding} ${hover ? 'hover:border-primary transition-all cursor-pointer active:scale-[0.98]' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
