/** A colleague's interpreting competes with their normal staff capacity. */
export function InterpreterSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="mb-2 block text-xs">
      Interpreter{" "}
      <select
        aria-label="Interpreter"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="border border-input bg-muted p-1"
      >
        <option value="">None</option>
        <option value="sola">Sola · 1 staff DP</option>
        <option value="anselm">Anselm · 1 staff DP</option>
        <option value="maxim">Maxim · 1 staff DP</option>
      </select>
    </label>
  );
}
