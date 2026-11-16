import { useState } from "react";
import { Button } from "@/components/ui/button";
import { activeChapter } from "../chapters";
import { drawExam, languageRoll } from "../languages";
import { useGame } from "../store";
import { Portrait } from "./Portrait";

/** Five questions, answered individually; the result resolves with the rest of the block. */
export function LanguageExam() {
  const g = useGame();
  const [answers, setAnswers] = useState<{ question: string; answer: number }[]>([]);
  const [notice, setNotice] = useState("");
  const host = activeChapter().manifest.hostLanguage;
  const exam = host?.exam;
  if (
    !host ||
    !exam ||
    g.day !== exam.day ||
    g.block !== exam.block ||
    (g.character?.languages?.[host.id] ?? 0) < 2 ||
    g.storyFlags.some((flag) => flag.startsWith("language-exam:"))
  )
    return null;
  const attempt = g.character?.examAttempts ?? 0;
  const questions = drawExam(exam.questions, g.seed, attempt);
  const question = questions[answers.length];
  const ordered = question?.answers
    .map((answer, index) => ({ ...answer, index }))
    .sort(
      (a, b) =>
        languageRoll(g.seed, `${question.id}:${a.index}`) -
        languageRoll(g.seed, `${question.id}:${b.index}`),
    );
  const lessons = g.log.filter((entry) => entry.text.includes(`${host.name} is now level`)).length;
  const hint =
    question &&
    ((g.character?.languages?.[host.id] ?? 0) >= 3 || lessons >= 4) &&
    languageRoll(g.seed, `${question.id}:hint`) % 2 === 0
      ? ordered?.find((answer) => !answer.correct)?.index
      : undefined;
  const queued = g.pending.some((p) => p.id === "language-exam");
  return (
    <section className="mt-4 border-t border-border pt-3" aria-label="Language examination">
      <h3 className="text-xl">
        {host.name} examination · {exam.examiner}
      </h3>
      {exam.portrait && <Portrait portrait={exam.portrait} size={64} />}
      {queued ? (
        <p>The examination is scheduled for the end of this block.</p>
      ) : question ? (
        <>
          <p className="text-sm">
            Question {answers.length + 1} of 5 · The examination costs 2 DP.
          </p>
          <p className="font-bold">{question.prompt}</p>
          {hint !== undefined && <p className="text-xs">Your lessons rule out one answer.</p>}
          <div className="mt-2 flex flex-col items-start gap-1">
            {ordered?.map((answer) => (
              <Button
                key={answer.index}
                variant="outline"
                disabled={answer.index === hint}
                className="h-auto whitespace-normal text-left"
                onClick={() =>
                  setAnswers([...answers, { question: question.id, answer: answer.index }])
                }
              >
                {answer.text}
              </Button>
            ))}
          </div>
        </>
      ) : (
        <Button
          onClick={() => {
            const ok = g.queue({
              id: "language-exam",
              kind: "work",
              source: `${host.name} examination`,
              text: "The Ministry conducts your language examination.",
              effects: {},
              timeCost: 2,
              examAnswers: answers,
            });
            setNotice(ok ? "Examination scheduled." : useGame.getState().planError);
          }}
        >
          Submit examination · 2 DP
        </Button>
      )}
      {notice && <p role="status">{notice}</p>}
    </section>
  );
}
