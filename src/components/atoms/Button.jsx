
const variants = {
  primary: 'bg-success hover:bg-success text-white shadow-lg active:scale-95',
  secondary: 'bg-surface-light hover:bg-surface-light text-primary',
  danger: 'bg-danger hover:bg-danger text-white',
  ghost: 'bg-transparent hover:bg-surface-light/40 text-muted hover:text-primary',
  gradient: 'bg-gradient-to-br from-primary to-success text-white',
  'emerald-outline': 'bg-success/10 border border-success text-success',
};

const sizes = {
  sm: 'py-1.5 px-3 text-[10px]',
  md: 'py-2.5 px-4 text-xs',
  lg: 'py-3 px-6 text-sm',
  xl: 'py-4 px-8 text-base',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  onClick,
  type = 'button',
  title,
  ...props
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`
        font-bold uppercase tracking-widest rounded-lg transition-all
        ${variants[variant] || variants.primary}
        ${sizes[size] || sizes.md}
        ${disabled ? 'opacity-50 cursor-not-allowed bg-surface-light hover:bg-surface-light text-muted shadow-none active:scale-100' : ''}
        ${className}
      `}
      {...props}
    >
      {children}
    </button>
  );
}