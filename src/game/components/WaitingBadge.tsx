/** A count badge: strong when answering matters this block, quiet when it is merely unread. */
export function WaitingBadge({
  urgent,
  unread,
  label,
  className = "",
  style,
}: {
  urgent: number;
  unread: number;
  label: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const count = urgent > 0 ? urgent : unread;
  if (count <= 0) return null;
  return (
    <span
      role="img"
      aria-label={label}
      data-kind={urgent > 0 ? "urgent" : "unread"}
      className={`waiting-badge ${className}`}
      style={style}
    >
      <span aria-hidden>{count}</span>
    </span>
  );
}
