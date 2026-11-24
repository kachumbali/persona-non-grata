import { describe, expect, it } from "vitest";
import { portHesperia2006 as chapter } from "./chapters";

describe("first three days' authored text variants", () => {
  it("covers dated mail and early story texts, including remote versions", () => {
    expect(chapter.postingBriefing.introVariants).toHaveLength(3);
    for (const section of chapter.postingBriefing.sections)
      expect(section.variants, section.title).toHaveLength(3);
    for (const email of chapter.emails.filter((item) => item.day <= 3)) {
      expect(email.bodyVariants, email.id).toHaveLength(3);
      expect(email.ignore.textVariants, `${email.id}:ignore`).toHaveLength(3);
      for (const [action, outcome] of Object.entries(email.options)) {
        expect(outcome.textVariants, `${email.id}:${action}`).toHaveLength(3);
        expect(outcome.labelVariants, `${email.id}:${action}:label`).toHaveLength(3);
      }
    }
    for (const event of chapter.campaign.events.filter((item) => item.minDay <= 3)) {
      expect(event.variants, event.id).toHaveLength(3);
      if (event.remoteText) expect(event.remoteTextVariants, event.id).toHaveLength(3);
      if (event.onMiss) expect(event.onMiss.textVariants, `${event.id}:miss`).toHaveLength(3);
      for (const choice of event.choices) {
        expect(choice.labelVariants, `${event.id}:${choice.id}:label`).toHaveLength(3);
        if (choice.result)
          expect(choice.resultVariants, `${event.id}:${choice.id}:result`).toHaveLength(3);
      }
    }
    for (const instruction of chapter.demarches.instructions.filter((item) => item.issuedDay <= 3))
      expect(instruction.instructionVariants, instruction.id).toHaveLength(3);
  });
  it("covers reusable conversation nodes except the protected menu", () => {
    for (const [npc, topics] of Object.entries(chapter.dialogues))
      for (const topic of topics)
        for (const [id, node] of Object.entries(topic.nodes)) {
          if (npc === "ketu" && topic.id === "menu") continue;
          expect(node.variants, `${npc}:${topic.id}:${id}`).toHaveLength(3);
          for (const [i, choice] of node.choices.entries()) {
            expect(choice.labelVariants, `${npc}:${topic.id}:${id}:${i}:label`).toHaveLength(3);
            if (choice.result)
              expect(choice.resultVariants, `${npc}:${topic.id}:${id}:${i}:result`).toHaveLength(3);
          }
        }
    for (const [id, node] of Object.entries(chapter.campaign.dialogue)) {
      expect(node.variants, id).toHaveLength(3);
      for (const choice of node.choices) {
        expect(choice.labelVariants, `${id}:${choice.id}:label`).toHaveLength(3);
        if (choice.result)
          expect(choice.resultVariants, `${id}:${choice.id}:result`).toHaveLength(3);
      }
    }
  });
});
