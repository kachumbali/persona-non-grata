import { useRef, useState } from "react";
import city from "@/assets/port-hesperia.jpg";
import { Button } from "@/components/ui/button";
import {
  beginNewCareer,
  continueSlot,
  deleteSlot,
  describeSlot,
  exportSlot,
  importIntoSlot,
  SLOT_COUNT,
  useSaveNotice,
  useSaves,
  type SlotIndex,
} from "../saves";
import { activeChapter } from "../chapters";
import { Portrait } from "./Portrait";

type Panel = { slot: SlotIndex; kind: "delete" | "replace" | "export" };

export function TitleScreen({ onNew, onLoad }: { onNew: () => void; onLoad: () => void }) {
  const slots = useSaves((s) => s.slots);
  const notice = useSaveNotice((s) => s.message);
  const chapter = activeChapter().manifest;
  const [panel, setPanel] = useState<Panel | null>(null);
  const [code, setCode] = useState("");
  const [copyNote, setCopyNote] = useState("");
  const [imports, setImports] = useState<Record<number, string>>({});
  const [importErrors, setImportErrors] = useState<Record<number, string>>({});
  const codeBox = useRef<HTMLTextAreaElement>(null);

  const open = (next: Panel | null) => {
    setPanel(next);
    setCopyNote("");
    setCode(next?.kind === "export" ? (exportSlot(next.slot) ?? "") : "");
  };
  const copy = async () => {
    const box = codeBox.current;
    try {
      await navigator.clipboard.writeText(code);
      setCopyNote("Copied to the clipboard.");
    } catch {
      box?.focus();
      box?.select();
      setCopyNote("Copying was blocked. The code is selected: press Ctrl+C to copy it.");
    }
  };

  return (
    <main className="title-screen" style={{ backgroundImage: `url(${city})` }}>
      <div className="retro-builder mx-auto w-full max-w-lg p-0">
        <div className="retro-titlebar">Main Menu</div>
        <div className="p-4 text-center sm:p-6">
          <p className="font-mono text-lg uppercase text-muted-foreground">
            Republic of Bellaluxe presents
          </p>
          <h1 className="game-logo my-2">Persona Non Grata</h1>
          <p className="font-mono text-2xl">
            {chapter.label} · {chapter.title}
          </p>
          {notice && (
            <div className="mt-6 border-l-2 border-destructive pl-3 text-left" role="alert">
              <p className="text-sm">{notice}</p>
            </div>
          )}
          <ul className="mt-6 flex flex-col gap-3 text-left" aria-label="Save slots">
            {Array.from({ length: SLOT_COUNT }, (_, i) => i as SlotIndex).map((i) => {
              const slot = slots[i];
              const label = describeSlot(slot);
              const here = panel?.slot === i ? panel.kind : null;
              return (
                <li key={i} className="paper p-3" aria-label={`Slot ${i + 1}`}>
                  <div className="flex items-center gap-3">
                    {slot && <Portrait portrait={slot.career.identity.portrait} size={40} />}
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-xs uppercase text-muted-foreground">
                        Slot {i + 1}
                      </p>
                      <p className="break-words text-sm font-bold">{label}</p>
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {slot ? (
                      <>
                        <Button
                          size="sm"
                          className="retro-button"
                          aria-label={`Continue slot ${i + 1}`}
                          onClick={() => {
                            continueSlot(i);
                            onLoad();
                          }}
                        >
                          Continue
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="retro-button"
                          aria-label={`New career in slot ${i + 1}`}
                          onClick={() => open({ slot: i, kind: "replace" })}
                        >
                          New career
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="retro-button"
                          aria-label={`Export slot ${i + 1}`}
                          aria-expanded={here === "export"}
                          onClick={() =>
                            open(here === "export" ? null : { slot: i, kind: "export" })
                          }
                        >
                          Export
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="retro-button"
                          aria-label={`Delete slot ${i + 1}`}
                          onClick={() => open({ slot: i, kind: "delete" })}
                        >
                          Delete
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        className="retro-button"
                        aria-label={`New career in slot ${i + 1}`}
                        onClick={() => {
                          beginNewCareer(i);
                          onNew();
                        }}
                      >
                        New career
                      </Button>
                    )}
                  </div>

                  {slot && here === "delete" && (
                    <div className="mt-3 border-l-2 border-destructive pl-3" role="alert">
                      <p className="text-sm">
                        Delete {slot.career.identity.title} {slot.career.identity.name} from slot{" "}
                        {i + 1}? This cannot be undone. Export the career first if you may want it
                        back.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            deleteSlot(i);
                            open(null);
                          }}
                        >
                          Confirm delete
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => open(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {slot && here === "replace" && (
                    <div className="mt-3 border-l-2 border-destructive pl-3" role="alert">
                      <p className="text-sm">
                        Start a new career in slot {i + 1}? {slot.career.identity.title}{" "}
                        {slot.career.identity.name} is kept until you accept a new posting, then
                        replaced for good.
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => {
                            beginNewCareer(i);
                            open(null);
                            onNew();
                          }}
                        >
                          Replace career
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => open(null)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                  {slot && here === "export" && (
                    <div className="mt-3">
                      <label className="text-xs" htmlFor={`export-${i}`}>
                        Career code for slot {i + 1}. Keep it somewhere safe; paste it into an empty
                        slot to restore this career.
                      </label>
                      <textarea
                        id={`export-${i}`}
                        ref={codeBox}
                        readOnly
                        value={code}
                        rows={4}
                        onFocus={(e) => e.currentTarget.select()}
                        className="mt-1 w-full rounded border border-input bg-card p-2 font-mono text-xs text-card-foreground"
                      />
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Button size="sm" onClick={copy}>
                          Copy
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => open(null)}>
                          Close
                        </Button>
                        <span role="status" className="text-xs">
                          {copyNote}
                        </span>
                      </div>
                    </div>
                  )}
                  {!slot && (
                    <div className="mt-3">
                      <label className="text-xs" htmlFor={`import-${i}`}>
                        Or restore a career from an exported code
                      </label>
                      <textarea
                        id={`import-${i}`}
                        value={imports[i] ?? ""}
                        rows={2}
                        placeholder="PNG1.…"
                        onChange={(e) => setImports((v) => ({ ...v, [i]: e.target.value }))}
                        className="mt-1 w-full rounded border border-input bg-card p-2 font-mono text-xs text-card-foreground"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-1"
                        onClick={() => {
                          const result = importIntoSlot(i, imports[i] ?? "");
                          setImportErrors((v) => ({ ...v, [i]: result.ok ? "" : result.error }));
                          if (result.ok) setImports((v) => ({ ...v, [i]: "" }));
                        }}
                      >
                        Import into slot {i + 1}
                      </Button>
                      {importErrors[i] && (
                        <p role="alert" className="mt-1 text-sm text-destructive">
                          {importErrors[i]}
                        </p>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <p className="mt-6 text-xs text-muted-foreground">
            Your progress saves automatically in this browser. Browser storage can be cleared, so
            export a career code now and then.
          </p>
        </div>
      </div>
    </main>
  );
}
