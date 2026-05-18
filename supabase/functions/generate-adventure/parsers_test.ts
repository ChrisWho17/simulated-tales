// Regression tests for parser helpers used by the streaming + non-streaming
// adventure-generation paths.

import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  parseMechanicsFromNarrative,
  calculateSimilarity,
  pickVarianceFocus,
  VARIANCE_FOCUSES,
} from "./parsers.ts";

Deno.test("parseMechanicsFromNarrative: single damage tag", () => {
  const r = parseMechanicsFromNarrative("You take a hit. [DAMAGE:6]");
  assertEquals(r.damage, 6);
  assertEquals(r.damageCount, 1);
  assertEquals(r.heal, 0);
});

Deno.test("parseMechanicsFromNarrative: multi damage tags are SUMMED (regression)", () => {
  // Ambush + bleeding wound: both tags must land. The previous bug used .match()
  // and only the first one counted.
  const narrative = "An arrow slams home. [DAMAGE:8] You stagger and the venom burns. [DAMAGE:5]";
  const r = parseMechanicsFromNarrative(narrative);
  assertEquals(r.damage, 13);
  assertEquals(r.damageCount, 2);
});

Deno.test("parseMechanicsFromNarrative: multi heal tags are SUMMED", () => {
  const r = parseMechanicsFromNarrative("Potion. [HEAL:20] Bandage. [HEAL:8]");
  assertEquals(r.heal, 28);
  assertEquals(r.healCount, 2);
});

Deno.test("parseMechanicsFromNarrative: mixed gold and damage", () => {
  const r = parseMechanicsFromNarrative("[GOLD:+50] [DAMAGE:3] [GOLD:-10]");
  assertEquals(r.goldGained, 50);
  assertEquals(r.goldLost, 10);
  assertEquals(r.damage, 3);
});

Deno.test("parseMechanicsFromNarrative: loot, drop, use arrays", () => {
  const r = parseMechanicsFromNarrative(
    "[LOOT:rusty sword] [LOOT:health potion] [DROP:old boots] [USE:Healing Potion] [HEAL:25]"
  );
  assertEquals(r.loot, ["rusty sword", "health potion"]);
  assertEquals(r.drop, ["old boots"]);
  assertEquals(r.use, ["Healing Potion"]);
  assertEquals(r.heal, 25);
});

Deno.test("parseMechanicsFromNarrative: empty / null input is safe", () => {
  const r = parseMechanicsFromNarrative("");
  assertEquals(r.damage, 0);
  assertEquals(r.loot, []);
});

Deno.test("calculateSimilarity: identical strings → 1", () => {
  assertEquals(calculateSimilarity("the quick brown fox", "the quick brown fox"), 1);
});

Deno.test("calculateSimilarity: disjoint strings → 0", () => {
  assertEquals(calculateSimilarity("alpha beta", "gamma delta"), 0);
});

Deno.test("calculateSimilarity: partial overlap is between 0 and 1", () => {
  const s = calculateSimilarity("the quick brown fox", "the lazy brown dog");
  assert(s > 0 && s < 1);
});

Deno.test("calculateSimilarity: empty inputs → 0 (no NaN regression)", () => {
  assertEquals(calculateSimilarity("", "anything"), 0);
  assertEquals(calculateSimilarity("anything", ""), 0);
});

Deno.test("calculateSimilarity: callable at module top-level (hoisting regression)", () => {
  // If this file imports parsers.ts and the symbol resolves, hoisting is fine.
  assertEquals(typeof calculateSimilarity, "function");
});

Deno.test("pickVarianceFocus: deterministic for same seed", () => {
  const a = pickVarianceFocus("seed-abc");
  const b = pickVarianceFocus("seed-abc");
  assertEquals(a.focus, b.focus);
  assertEquals(a.index, b.index);
  assert(VARIANCE_FOCUSES.includes(a.focus));
});

Deno.test("pickVarianceFocus: numeric seed", () => {
  const r = pickVarianceFocus(3);
  assertEquals(r.index, 3);
  assertEquals(r.focus, VARIANCE_FOCUSES[3]);
});
