import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { buildDebrief } from "../debrief";
import { newPosting } from "../saves";
import { useGame } from "../store";
import { Portrait } from "./Portrait";

export function Debrief() {
  const g = useGame();
  const result = buildDebrief(g);
  const [fallback, setFallback] = useState(false);
  const [message, setMessage] = useState("");
  const area = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, []);
  useEffect(() => {
    if (fallback) {
      area.current?.focus();
      area.current?.select();
    }
  }, [fallback]);
  const copy = async () => {
    try {
      if (!navigator.clipboard?.writeText) throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(result.text);
      setMessage("Debrief copied.");
    } catch {
      setFallback(true);
      setMessage("Copy the selected text below.");
    }
  };
  const file = result.sections[0]!;
  const dayOne = [file.lines[0], file.lines[4], file.lines[6]],
    last = [file.lines[1], file.lines[2], file.lines[3], file.lines[5], file.lines[7]];
  return (
    <main className="mx-auto max-w-4xl px-3 py-6">
      <article className="paper space-y-5 p-4 sm:p-8">
        <header>
          <h1 className="text-3xl text-destructive">{result.title}</h1>
          <p className="mt-3 font-serif">{result.cable}</p>
          {result.variant && <p className="mt-2">{result.variant}</p>}
          {g.character && <Portrait portrait={g.character.portrait} size={64} />}
        </header>
        <section>
          <h2 className="text-xl font-bold">{file.heading}</h2>
          <div className="grid grid-cols-2 gap-3">
            <div className="min-w-0 border border-border p-2">
              <h3 className="font-bold">Day 1</h3>
              {dayOne.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
            <div className="min-w-0 border border-border p-2">
              <h3 className="font-bold">Last day</h3>
              {last.map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        </section>
        {result.sections.slice(1).map((section) => (
          <section key={section.heading}>
            <h2 className="text-xl font-bold">{section.heading}</h2>
            {section.lines.length ? (
              section.lines.map((line, i) => (
                <p className="mt-1" key={i}>
                  {line}
                </p>
              ))
            ) : (
              <p>None recorded.</p>
            )}
          </section>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={copy}>
            Copy as text
          </Button>
          <Button onClick={newPosting}>Request a new posting</Button>
        </div>
        {message && <p role="status">{message}</p>}
        {fallback && (
          <textarea
            ref={area}
            aria-label="Debrief text to copy"
            readOnly
            value={result.text}
            className="min-h-48 w-full border border-input bg-background p-2"
          />
        )}
      </article>
    </main>
  );
}
