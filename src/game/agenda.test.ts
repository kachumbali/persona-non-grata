import { describe, expect, it } from "vitest";
import { describeCommitment, agendaItems } from "./agenda";
import { portHesperia2006 as chapter } from "./chapters";
import { useGame } from "./store";
import type { PendingDecision } from "./rules";

const base: PendingDecision = {
  id: "test",
  source: "Fallback",
  text: "secret result",
  effects: {},
  kind: "event",
};
describe("agenda descriptions", () => {
  it("describes event choices without exposing results", () => {
    const event = chapter.campaign.events[0]!;
    const d = describeCommitment(
      { ...base, eventId: event.id, eventChoice: event.choices[0]!.id },
      chapter,
    );
    expect(d.what).toBe(event.title);
    expect(d.choice).toBe(event.choices[0]!.label);
    expect(JSON.stringify(d)).not.toContain("secret result");
  });
  it.each(["attend", "delegate", "decline"] as const)(
    "describes invitation response %s",
    (response) => {
      const invitation = chapter.invitations[0]!;
      const d = describeCommitment(
        {
          ...base,
          eventId: invitation.id,
          eventChoice: response,
          worker: response === "delegate" ? "anselm" : undefined,
        },
        chapter,
      );
      expect(d.what).toBe(invitation.title);
      expect(d.choice).toBe(invitation.choices[response].label);
      expect(d.where).toBe(
        chapter.campaign.locations.find((l) => l.id === invitation.location)?.name,
      );
      expect(d.who).toBe(
        response === "delegate"
          ? chapter.campaign.characters.find((c) => c.id === "anselm")?.name
          : "You",
      );
    },
  );
  it("describes mission routes, mail, travel and fallback", () => {
    const [task, steps] = Object.entries(chapter.manifest.missionSteps).find(([, values]) =>
      values.some((s) => s.routes?.length),
    )!;
    const step = steps.find((s) => s.routes?.length)!;
    expect(
      describeCommitment({ ...base, task, step: step.id, route: step.routes![0]!.id }, chapter),
    ).toMatchObject({ what: step.label, choice: step.routes![0]!.label });
    const mail = chapter.emails[0]!;
    expect(
      describeCommitment({ ...base, emailId: mail.id, emailAction: "reply" }, chapter).what,
    ).toBe(mail.subject);
    expect(
      describeCommitment({ ...base, id: "travel-1-eu", location: "eu" }, chapter).what,
    ).toMatch(/^Travel to /);
    expect(describeCommitment(base, chapter).what).toBe("Fallback");
  });
  it("removes an invitation from unanswered items when queued", () => {
    const i = chapter.invitations[0]!;
    const state = {
      ...useGame.getState(),
      day: i.day,
      block: i.block,
      storyOutcomes: {},
      pending: [],
      events: [],
    };
    expect(agendaItems(state, chapter).some((item) => item.id === i.id)).toBe(true);
    expect(
      agendaItems({ ...state, pending: [{ ...base, eventId: i.id }] }, chapter).some(
        (item) => item.id === i.id,
      ),
    ).toBe(false);
  });
});

describe("other commitment types", () => {
  it("describes a location lead and its choice", () => {
    const event = chapter.campaign.events.find((e) => e.location)!;
    const result = describeCommitment(
      { ...base, eventId: event.id, eventChoice: event.choices[0]!.id },
      chapter,
    );
    expect(result).toMatchObject({
      what: event.title,
      choice: event.choices[0]!.label,
      where: chapter.campaign.locations.find((l) => l.id === event.location)?.name,
    });
  });
  it.each(["self", "colleague", "eu", "note"] as const)(
    "describes the %s démarche route",
    (kind) => {
      const d = chapter.demarches.instructions[0]!;
      const result = describeCommitment(
        { ...base, demarcheId: d.id, demarcheRoute: kind },
        chapter,
      );
      expect(result.what).toBe(d.subject);
      expect(result.choice).toBe(d.routes.find((r) => r.kind === kind)?.label);
      expect(result.where).toBeTruthy();
    },
  );
  it("shows the worker and partner on a delegated mission step", () => {
    const [task, steps] = Object.entries(chapter.manifest.missionSteps)[0]!;
    const result = describeCommitment(
      { ...base, task, step: steps[0]!.id, worker: "anselm", partner: "maxim" },
      chapter,
    );
    expect(result.what).toBe(steps[0]!.label);
    expect(result.who).toContain(chapter.campaign.characters.find((c) => c.id === "anselm")!.name);
    expect(result.who).toContain(chapter.campaign.characters.find((c) => c.id === "maxim")!.name);
    expect(describeCommitment({ ...base, task, step: steps[0]!.id }, chapter).who).toBe("You");
  });
  it("shows the venue and guest for a meal and describes rest", () => {
    const venue = chapter.campaign.venues[0]!;
    const guest = chapter.campaign.characters[0]!;
    expect(
      describeCommitment({ ...base, kind: "social", venue: venue.id, worker: guest.id }, chapter),
    ).toMatchObject({ where: venue.name, who: guest.name });
    expect(
      describeCommitment({ ...base, id: "rest", source: "Personal time", kind: "work" }, chapter),
    ).toMatchObject({ what: "Personal time", who: "You" });
  });
});

describe("the language exam", () => {
  const host = chapter.manifest.hostLanguage!;
  const exam = host.exam!;
  const withLevel = (level: number, day: number, block: number, extra = {}) => {
    const s = useGame.getState();
    return {
      ...s,
      day,
      block,
      pending: [],
      storyFlags: [],
      events: [],
      character: { ...s.character!, languages: { [host.id]: level } },
      ...extra,
    };
  };
  const find = (s: ReturnType<typeof withLevel>) =>
    agendaItems(s, chapter).find((i) => i.id === "language-exam");
  it("is today's item on exam day for an eligible player, with what, where and when", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "T", portrait: "diplomat-1", bio: "", traits: [] });
    const item = find(withLevel(2, exam.day, exam.block));
    expect(item).toMatchObject({ day: exam.day, block: exam.block });
    expect(item?.what).toContain(exam.examiner);
    expect(item?.where).toContain("Staff & diary");
  });
  it("appears in the three days before, stating the requirement when not yet eligible", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "T", portrait: "diplomat-1", bio: "", traits: [] });
    const eligible = find(withLevel(2, exam.day - 2, 0));
    expect(eligible?.what).not.toContain("needs");
    const not = find(withLevel(0, exam.day - 2, 0));
    expect(not?.what).toContain("needs");
    expect(not?.what).toContain("level 2");
  });
  it("is hidden when it can no longer be taken or has been taken", () => {
    useGame
      .getState()
      .start({ title: "Mx", name: "T", portrait: "diplomat-1", bio: "", traits: [] });
    expect(find(withLevel(0, exam.day, exam.block))).toBeUndefined();
    expect(find(withLevel(3, exam.day + 1, 0))).toBeUndefined();
    expect(
      find(withLevel(3, exam.day, exam.block, { storyFlags: ["language-exam:pass"] })),
    ).toBeUndefined();
  });
});

describe("commitment lines carry no raw ids", () => {
  it("names a language lesson's teacher and never prints an id", () => {
    const d = describeCommitment(
      { ...base, id: "language-lesson", source: "Language lesson with Sola", worker: "sola" },
      chapter,
    );
    expect(d.who).toBe(chapter.campaign.characters.find((c) => c.id === "sola")!.name);
    const unknown = describeCommitment({ ...base, worker: "ghost", location: "nowhere" }, chapter);
    expect(unknown.who).toBe("You");
    expect(unknown.where).toBeUndefined();
  });
});
