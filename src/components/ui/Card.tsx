interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  description?: string;
  footer?: React.ReactNode;
}

export function Card({ children, className, title, description, footer }: CardProps) {
  return (
    <div className={`bg-card rounded-lg border border-border shadow-sm ${className}`}>
      {(title || description) && (
        <div className="border-b border-border p-6">
          {title && <h3 className="text-lg font-semibold text-foreground">{title}</h3>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      <div className="p-6">{children}</div>
      {footer && (
        <div className="border-t border-border bg-muted/50 p-4 flex justify-end gap-3">
          {footer}
        </div>
      )}
    </div>
  );
} 