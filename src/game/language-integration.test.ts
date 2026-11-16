import { beforeEach, describe, expect, it } from "vitest";
import { activeChapter, setActiveChapter } from "./chapters";
import { drawExam } from "./languages";
import { characterOf, exportCareer, importCareer, newCareer } from "./career";
import { useGame } from "./store";

beforeEach(() => {
  setActiveChapter("port-hesperia-2006");
  useGame.getState().start({
    title: "Mx",
    name: "Tester",
    portrait: "diplomat-1",
    bio: "",
    traits: [],
    languages: { bellaluxian: 3, ombrazian: 0 },
  });
});

describe("language activities", () => {
  it("imports old career codes and preserves progress and retake count in new codes", () => {
    const character = useGame.getState().character!;
    const base = newCareer(character, null, "2006-01-01T00:00:00Z");
    const legacy = { ...base, languages: {} };
    delete legacy.languageProgress;
    delete legacy.examAttempts;
    const old = importCareer(exportCareer({ career: legacy, posting: null }));
    expect(old.ok).toBe(true);
    if (!old.ok) return;
    expect(characterOf(old.slot.career).languages).toMatchObject({ bellaluxian: 3, ombrazian: 0 });
    const career = {
      ...base,
      languages: { bellaluxian: 3, ombrazian: 2 },
      languageProgress: { ombrazian: 5 },
      examAttempts: 1,
    };
    const restored = importCareer(exportCareer({ career, posting: null }));
    expect(restored.ok).toBe(true);
    if (restored.ok)
      expect(characterOf(restored.slot.career)).toMatchObject({
        languages: career.languages,
        languageProgress: career.languageProgress,
        examAttempts: 1,
      });
  });
  it("charges personal funds only when a tutor lesson resolves", () => {
    const start = useGame.getState();
    const balance = start.personalFunds;
    const funds = start.economy.funds;
    expect(
      start.queue({
        id: "language-lesson",
        kind: "dialogue",
        source: "Tutor",
        text: "A lesson.",
        effects: {},
        timeCost: 1,
        languageLesson: "tutor",
      }),
    ).toBe(true);
    expect(useGame.getState().personalFunds).toBe(balance);
    useGame.getState().advance();
    const after = useGame.getState();
    expect(after.personalFunds).toBe(balance - 100);
    expect(after.economy.funds).toBe(funds);
    expect(after.character?.languages?.["ombrazian"]).toBe(1);
    expect(after.character?.languageProgress?.["ombrazian"]).toBe(0);
  });
  it("requires the scheduled block and awards certification only after a passing examination", () => {
    const character = useGame.getState().character!;
    useGame.setState({
      day: 13,
      block: 1,
      character: { ...character, languages: { bellaluxian: 3, ombrazian: 2 } },
    });
    const g = useGame.getState();
    const questions = drawExam(activeChapter().manifest.hostLanguage!.exam!.questions, g.seed, 0);
    const examAnswers = questions.map((question) => ({
      question: question.id,
      answer: question.answers.findIndex((answer) => answer.correct),
    }));
    expect(
      g.queue({
        id: "language-exam",
        kind: "work",
        source: "Exam",
        text: "Exam",
        effects: {},
        timeCost: 2,
        examAnswers,
      }),
    ).toBe(true);
    expect(useGame.getState().character?.languages?.["ombrazian"]).toBe(2);
    useGame.getState().advance();
    expect(useGame.getState().character?.languages?.["ombrazian"]).toBe(4);
  });
});
