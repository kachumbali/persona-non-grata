# Writing guide

House style for every scene, mail, conversation and newspaper item in Persona Non Grata. The audience knows diplomatic life. They laugh at recognition, not at explanation.

## Tone

Dry, institutional, deadpan. The narrator never winks. The humour comes from officials taking small things with total seriousness and large things with a shrug. Cliché is welcome when it is used exactly right ("taking note", "a useful exchange of views").

Jokes aim at institutions and habits: procedure, hierarchy, versioning, lunches, communiqués, budgets. Never at nationality, ethnicity, religion, accent or the way anyone speaks a language.

Do and don't, in the game's voice:

1. **Understate.**
   Do: "The minister is described as 'engaged'. He has left the building."
   Don't: "The minister storms out in a rage!"
2. **Let the process be the joke.**
   Do: "A corrected seating plan is issued, showing the lunch as it occurred and recording it as intended."
   Don't: "Everyone sat in the wrong places and it was hilarious."
3. **Use official language for unofficial events.**
   Do: "The incident is recorded as 'a full and frank exchange of biscuits'."
   Don't: "A fight broke out over biscuits."
4. **Keep numbers precise and slightly wrong.**
   Do: "Version 7.3 of the annex lists forty-one guests for a table of twelve."
   Don't: "There were way too many guests."
5. **Aim at the habit, not the person's origin.**
   Do: "The delegation answers every question with a question about the agenda."
   Don't: "Typical of people from that country, they never answer."
6. **Show the consequence in the result text.**
   Do: "Pavel files the incident report with deep satisfaction. The stapler remains missing."
   Don't: "That went well."
7. **Let the colleague have the last line.**
   Do: "'Ministers come and go,' says Pavel. 'The stapler was permanent.'"
   Don't: "Pavel disagrees with you."
8. **Keep the stakes small.**
   Do: "The summit's future depends on who speaks before the coffee."
   Don't: "War breaks out because of the seating chart."

## Hyperbole rules

Exaggerate the machinery, not the harm.

- **Scale up the bureaucracy; keep the stakes small.** A coffee order needs three signatures and a legal opinion. Nobody is hurt, nothing falls.
- **Follow the rule to its absurd conclusion.** If the rule says every delegation speaks for equal time, someone brings a stopwatch. If the budget share is 17.6%, someone claims 17.6% of the biscuits.
- **Understate in official language.** The more absurd the event, the flatter the sentence. "The chair noted that the situation had developed."
- **One absurd element per scene.** Everything else is plausible. The reader should believe the room.
- **Escalate by procedure, not by violence.** A problem produces a form, a form produces a committee, a committee produces a new problem.
- **Let the setting's numbers recur.** 17.6%, version numbers, annexes. Repetition is a running gag, not padding.

## Anonymising checklist

Run every anecdote through all of these. Do at least four. The more the better.

- [ ] Change the country (Bellaluxe, Ombrazia, other fictional countries; real names only for EU member states).
- [ ] Change the decade, or move it to the game's era.
- [ ] Change the rank of everyone (the ambassador becomes a head of section, the junior becomes a first secretary).
- [ ] Merge two people into one, or split one into two.
- [ ] Move the venue (a lunch becomes a reception, a capital becomes a port city).
- [ ] Change the object at the centre (a clock becomes a stopwatch, a flag becomes a cake).
- [ ] Drop anything ongoing, anything classified, and anything involving an identifiable private individual.
- [ ] Remove any phrase, nickname or catchphrase that belongs to one real person.

Two tests, both must pass:

1. **The source may recognise it.** The person who told the story should see their anecdote in the scene.
2. **A third party must not be able to identify the source or the people.** Someone who was in the room, or heard it second hand, should not be able to say who or where it came from.

If the second test is doubtful, change more. If it still reads as a specific real event, reject the anecdote.

## Structure rules for a scene

- **Every choice needs a visible result text.** The player always sees what happened.
- **At least one choice is available to every character build.** An ungated choice must exist. Gated choices are extras, never the only way forward.
- **Record consequences with flags.** Set a `flag` on choices that matter (kebab-case, for example `seating-moved`). Later events (`requiresFlag`, `requiresChoice`) and press clippings (`trigger.flag`, `trigger.outcome`) read them.
- **Optional stories never block the chapter's main mission.** A side story may cost goodwill, trust or time. It must never be required to finish the mission.
- **Trait-tagged choices** use `requiresTrait` (ids from `src/game/data/traits.json`). Give them an upside. Where it fits, add a backfire as well (a stat cost such as `sanity: -1`, or a result that quietly turns against you).
- **Three or four choices.** One safe, one bold, one cynical or procedural, optionally one trait choice.
- **No block without a decision.** Every scene asks the player to decide something.
- **Failure is funny.** The worst choice should be the most entertaining result, not a flat punishment.

## Length limits

Based on the existing content (measured in words).

| Item                 | Limit | Existing max        |
| -------------------- | ----- | ------------------- |
| Event `title`        | 6     | 7                   |
| Event `text`         | 60    | 70 (most are 20-30) |
| Choice `label`       | 12    | 11                  |
| Choice `result`      | 30    | 27                  |
| Dialogue node `text` | 30    |                     |
| Email `subject`      | 10    |                     |
| Email `body`         | 40    | 29                  |
| Email option `text`  | 30    |                     |
| Press `headline`     | 6     | 5                   |
| Press `body`         | 40    | 33                  |

Shorter is nearly always funnier. Put the joke at the end of the sentence.

## Setting rules

- **Bellaluxe** is the fictional player country and the embassy's home.
- **Ombrazia** is the fictional host country; **Port Hesperia** is where the embassy is.
- Call the group **the EU**. No membership numbers.
- Use real country names only for EU member states (as in the current cast: Germany, France, Malta, Sweden).
- Every other country is fictional and non-obvious. No thinly veiled real states.
- No real individuals, no real office holders, no real companies or newspapers.
- The default setting is around 2006: BlockBerry, fax, desktop computers. "Team Europe" is a deliberate anachronism.
- Other eras (1980s, around 2001, 2013, 2022) may be used when a chapter calls for them. Keep technology and vocabulary consistent with the era.

## Recurring comic devices

Reuse these. A running gag is a reward for the player who has been paying attention.

- **The reply-all.** One message reaches everyone, including the caterer.
- **The seating plan.** Rank, feuds and who must not sit near the press.
- **The non-paper.** A document that does not exist but must be circulated.
- **The démarche.** Delivered urgently, to someone who cannot act on it.
- **The 17.6% budget share.** Extended to speaking time, biscuits and credit.
- **Forms with version numbers.** v7.3, rev. B, "superseding the superseded draft".
- **"Taking note."** The diplomatic act of doing nothing, minuted.
- **The annex.** Where problems go to be filed, and where a stopwatch ends up.
- **The useful exchange of views.** Nobody changed their mind.
