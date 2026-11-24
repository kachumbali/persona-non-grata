#!/usr/bin/env node
// The chapter vocabulary is explicit: extend it whenever a new proper name is authored.
const fs = require("node:fs");
const path = require("node:path");
const root = path.join(__dirname, "../src/game/chapters/port-hesperia-2006");
const campaign = JSON.parse(fs.readFileSync(path.join(root, "campaign.json"), "utf8"));
const names = new Set(
  [
    ...campaign.characters.flatMap((person) => person.name.split(/\s+/)),
    "Bellaluxe",
    "Ombrazia",
    "Chirper",
    "BlockBerry",
    "Chercheur",
    "Capital",
    "EU",
    "UN",
    "Cyprus",
    "Luxembourg",
    "France",
    "Germany",
    "Malta",
    "Sweden",
    "Team Europe",
    "Port Hesperia",
    "Mission Watch",
    "HQ",
    "Denmark",
    "Valdoria",
    "Asteria",
    "Portuguese",
  ].filter((name) => name.length >= 2),
);
const words = (text, regex) => [...text.matchAll(regex)].map((m) => m[0]).sort();
const signature = (text) => ({
  variables: words(text, /\$\{[^{}]+\}|%\{[^{}]+\}|\{[^{}]+\}|%[sdif]/g),
  numbers: words(text, /\b\d+(?:[.:]\d+)*%?/g),
  hashtags: words(text, /#[\p{L}\p{N}_]+/gu),
  names: [...names]
    .filter((name) =>
      new RegExp(
        `(?<![\\p{L}])${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?![\\p{L}])`,
        "iu",
      ).test(text),
    )
    .sort(),
});
let errors = 0,
  count = 0;
function visit(value, file, location = "$") {
  if (Array.isArray(value)) {
    value.forEach((child, i) => visit(child, file, `${location}[${i}]`));
  } else if (value && typeof value === "object") {
    for (const [field, child] of Object.entries(value)) {
      const originalField =
        field === "variants" && typeof value.text === "string"
          ? "text"
          : field.endsWith("Variants")
            ? field.slice(0, -8)
            : null;
      if (originalField && Array.isArray(child)) {
        const original = value[originalField];
        if (
          typeof original !== "string" ||
          child.length !== 3 ||
          child.some((v) => typeof v !== "string")
        ) {
          console.error(`${file}:${location}.${field}: expected a text and three variants`);
          errors++;
          continue;
        }
        if (new Set([original, ...child].map((text) => text.toLocaleLowerCase())).size !== 4) {
          console.error(`${file}:${location}.${field}: duplicate wording`);
          errors++;
        }
        const expected = signature(original);
        child.forEach((variant, index) => {
          count++;
          const actual = signature(variant);
          for (const part of Object.keys(expected))
            if (JSON.stringify(expected[part]) !== JSON.stringify(actual[part])) {
              console.error(
                `${file}:${location}.${field}[${index}]: ${part} differ: ${JSON.stringify(expected[part])} / ${JSON.stringify(actual[part])}`,
              );
              errors++;
            }
          if (variant.length < original.length * 0.8 || variant.length > original.length * 1.2) {
            console.error(`${file}:${location}.${field}[${index}]: length outside ±20%`);
            errors++;
          }
        });
      } else visit(child, file, `${location}.${field}`);
    }
  }
}
for (const file of fs.readdirSync(root).filter((name) => name.endsWith(".json"))) {
  const data = JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
  if (file === "emails.json") {
    const labels = JSON.parse(fs.readFileSync(path.join(root, "mail-choices.json"), "utf8"));
    for (const mail of data)
      for (const [action, outcome] of Object.entries(mail.options)) {
        if (outcome.labelVariants && labels[mail.id]?.[action])
          outcome.label = labels[mail.id][action];
      }
  }
  visit(data, file);
}
console.log(`Checked ${count} text variants; ${errors} errors.`);
process.exitCode = errors ? 1 : 0;
