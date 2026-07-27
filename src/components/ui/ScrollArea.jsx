export default function ScrollArea({ children, className }) {
  return <div className={`scroll-area ${className || ''}`}>{children}</div>;
}
