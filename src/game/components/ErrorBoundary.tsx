import { Component, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { CRASH_APOLOGY, CRASH_REASSURANCE, errorReport } from "../error-report";

interface BoundaryProps {
  children: ReactNode;
  /** Called with the error cleared: the parent shows the title screen. Saves are not touched. */
  onBackToTitle: () => void;
}
interface BoundaryState {
  error: Error | null;
}

class Boundary extends Component<BoundaryProps, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack);
  }

  private backToTitle = () => {
    this.setState({ error: null });
    this.props.onBackToTitle();
  };

  override render() {
    const { error } = this.state;
    if (!error) return this.props.children;
    return <CrashPanel error={error} onBack={this.backToTitle} />;
  }
}

/** Catches a render error below it and shows a short apology in place of the screens. */
export function ErrorBoundary(props: BoundaryProps) {
  return <Boundary {...props} />;
}

function CrashPanel({ error, onBack }: { error: Error; onBack: () => void }) {
  const [report] = useState(() => errorReport(error));
  const [note, setNote] = useState("");
  const [showText, setShowText] = useState(false);
  const box = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (showText) {
      box.current?.focus();
      box.current?.select();
    }
  }, [showText]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(report);
      setShowText(false);
      setNote("Copied to the clipboard.");
    } catch {
      setShowText(true);
      setNote("Copying was blocked. The report is selected: press Ctrl+C to copy it.");
    }
  };

  return (
    <main className="mx-auto mt-16 w-full max-w-lg px-4">
      <div className="paper p-4 sm:p-6" role="alert">
        <p className="text-base font-bold">{CRASH_APOLOGY}</p>
        <p className="mt-2 text-sm">{CRASH_REASSURANCE}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button className="retro-button" onClick={onBack}>
            Back to the title screen
          </Button>
          <Button variant="outline" className="retro-button" onClick={copy}>
            Copy error report
          </Button>
        </div>
        {note && (
          <p role="status" className="mt-2 text-xs">
            {note}
          </p>
        )}
        {showText && (
          <textarea
            ref={box}
            readOnly
            value={report}
            rows={8}
            aria-label="Error report"
            className="mt-2 w-full rounded border border-input bg-card p-2 font-mono text-xs text-card-foreground"
          />
        )}
      </div>
    </main>
  );
}
