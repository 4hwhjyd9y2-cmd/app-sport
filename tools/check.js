#!/usr/bin/env node
// Vérifie salle.html : syntaxe du script, cohérence des exercices, ids uniques par séance,
// et rendu sans erreur de chaque écran d'effort et de récupération.
// Usage : node tools/check.js [chemin/vers/salle.html]
"use strict";
const fs = require("fs");
const path = require("path");

const file = process.argv[2] || path.join(__dirname, "..", "salle.html");
const html = fs.readFileSync(file, "utf8");
const m = html.match(/<script>([\s\S]*)<\/script>/);
if (!m) { console.error("Aucun <script> trouvé dans " + file); process.exit(1); }
const src = m[1];

let errors = 0;
const fail = (msg) => { console.error("ERREUR  " + msg); errors++; };

try { new Function(src); } catch (e) { fail("syntaxe JS : " + e.message); process.exit(1); }

// Environnement navigateur minimal
const screen = { innerHTML: "", querySelector: () => el(), querySelectorAll: () => [] };
const el = () => ({ innerHTML: "", className: "", textContent: "", value: "", style: {}, dataset: {},
  classList: { add() {}, remove() {} }, querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, getAttribute: () => null });
const doc = { getElementById: (id) => (id === "screen" ? screen : el()), addEventListener() {},
  querySelector: () => el(), body: el() };
const mem = {};
const ls = { get length() { return Object.keys(mem).length; }, key: (i) => Object.keys(mem)[i],
  getItem: (k) => (k in mem ? mem[k] : null), setItem: (k, v) => { mem[k] = String(v); },
  removeItem: (k) => { delete mem[k]; } };
global.setInterval = () => 0; global.clearInterval = () => {};

let api;
try {
  api = new Function("document", "localStorage", "window", "navigator",
    "return (function(){" + src + "; return { PROGRAMS, setProgram, start, renderEffort, goRecovery, state, EX: () => EX," +
    " rampSets, sessionText, resume, warmupDone, stretchDone, skipSet, leaveSession, getActive, getHistory," +
    " renderWarmup, renderStretch, stretchStart, stretchTransition, prepHtml, STRETCHES, MOVES, FIGS };})()"
  )(doc, ls, {}, {});
} catch (e) { fail("exécution du script : " + e.message); process.exit(1); }

const TYPES = ["machine", "reps", "pushup", "hold"];
for (const p of api.PROGRAMS) {
  const ids = new Set();
  for (const e of p.ex) {
    const where = p.id + "/" + e.id + " " + e.short;
    if (ids.has(e.id)) fail(where + " : id en double dans la séance");
    ids.add(e.id);
    if (!TYPES.includes(e.type)) fail(where + " : type inconnu " + e.type);
    if (!(e.sets > 0)) fail(where + " : sets manquant");
    if (!(e.rest > 0)) fail(where + " : rest manquant");
    if (e.levels) {
      if (!e.techByLevel) fail(where + " : levels sans techByLevel");
      else if (e.techByLevel.length !== e.levels.length) fail(where + " : " + e.levels.length + " niveaux pour " + e.techByLevel.length + " fiches");
      if (!(e.lvl0 >= 0 && e.lvl0 < e.levels.length)) fail(where + " : lvl0 hors bornes");
    } else if (!e.tech) fail(where + " : pas de fiche technique");
    if (e.type === "machine" && e.startKg == null) fail(where + " : startKg manquant");
    if (e.type === "hold" && !(e.hold > 0)) fail(where + " : hold manquant");
    if (e.assistLevels && e.startAssist == null) fail(where + " : startAssist manquant");
    const fiches = e.techByLevel || [e.tech];
    for (const t of fiches) {
      for (const k of ["place", "move", "feel", "avoid"]) if (!t || !t[k]) fail(where + " : fiche sans " + k);
      if (t && JSON.stringify(t).includes("—")) fail(where + " : tiret long dans une fiche");
    }
  }
}

// Rendu de chaque écran, pour chaque séance
for (const p of api.PROGRAMS) {
  try {
    api.setProgram(p.id);
    api.start(true);
    const ex = api.EX();
    for (let i = 0; i < ex.length; i++) {
      api.state.exIndex = i; api.state.setIndex = 0;
      api.renderEffort();
      if (ex[i].type !== "hold") api.goRecovery();
    }
  } catch (e) { fail("rendu séance " + p.id + " : " + e.message); }
}

// Échauffement, séries de montée et étirements (cahier des charges docs/echauffement, section 6)
let tests = 0;
const test = (name, fn) => { tests++; try { const r = fn(); if (r !== true) fail("test " + name + " : " + r); } catch (e) { fail("test " + name + " : " + e.message); } };
const same = (got, want) => JSON.stringify(got) === JSON.stringify(want) ? true : "obtenu " + JSON.stringify(got) + ", attendu " + JSON.stringify(want);
const ramp = (r, step, base, perSide) => api.rampSets({ ramp: r, kgStep: step, perSide }, base);
const kgs = (rows) => rows.map((x) => (x.kg != null ? x.kg : x.text) + " x" + x.reps);
const exById = (prog, id) => api.PROGRAMS.find((p) => p.id === prog).ex.find((e) => e.id === id);

test("1 · 50 % et 75 % de 100 kg", () => same(kgs(ramp([{ pct: 50, reps: 8 }, { pct: 75, reps: 4 }], 5, { kg: 100 })), ["50 x8", "75 x4"]));
test("2 · égalité arrondie vers le bas", () => same(kgs(ramp([{ pct: 50, reps: 8 }, { pct: 75, reps: 4 }], 5, { kg: 115 })), ["55 x8", "85 x4"]));
test("3 · palier décimal", () => same(kgs(ramp([{ pct: 50, reps: 8 }, { pct: 75, reps: 4 }], 2.5, { kg: 15 })), ["7.5 x8", "10 x4"]));
test("4 · jamais moins d'un palier", () => same(kgs(ramp([{ pct: 50, reps: 8 }], 2.5, { kg: 4 })), ["2.5 x8"]));
test("5 · poids du corps puis 60 %", () => same(kgs(ramp([{ bodyweight: true, reps: 6 }, { pct: 60, reps: 4 }], 2, { kg: 12 }, true)), ["Poids du corps x6", "8 x4"]));
test("6 · assistance + 10 kg, rien hors niveau assisté", () => {
  api.setProgram("A");
  const ex = exById("A", 104);
  api.state.levels[104] = 0;
  const assisted = api.rampSets(ex, { assist: 12 });
  api.state.levels[104] = 1;
  const band = api.rampSets(ex, { assist: 12 });
  api.state.levels[104] = 0;
  return same([assisted.map((x) => x.text + " x" + x.reps), band.length], [["Assistance 22 kg x4"], 0]);
});
test("7 · déroulé de la séance A", () => {
  api.setProgram("A"); api.start(true);
  const steps = [api.state.phase];
  api.warmupDone("done");
  steps.push(api.state.phase, api.state.exIndex, api.state.setIndex, api.state.session.warmup);
  const ex = api.EX(); api.state.exIndex = ex.length - 1; api.state.setIndex = ex[ex.length - 1].sets - 1;
  api.skipSet(); steps.push(api.state.phase);
  api.stretchDone("skipped");
  const h = api.getHistory();
  steps.push(api.state.phase, h[h.length - 1].warmup, h[h.length - 1].stretch);
  return same(steps, ["warmup", "effort", 0, 0, "done", "stretch", "end", "done", "skipped"]);
});
test("8 · séance Maison inchangée", () => {
  api.setProgram("M"); api.start(true);
  const steps = [api.state.phase];
  const ex = api.EX(); api.state.exIndex = ex.length - 1; api.state.setIndex = ex[ex.length - 1].sets - 1;
  api.skipSet();
  const h = api.getHistory(), last = h[h.length - 1];
  steps.push(api.state.phase, "warmup" in last, "stretch" in last);
  return same(steps, ["effort", "end", false, false]);
});
test("9 · reprise sur l'échauffement et sur les étirements", () => {
  api.setProgram("B"); api.start(true); api.leaveSession();
  const out = [api.state.phase, api.getActive().phase];
  api.resume(); out.push(api.state.phase);
  api.warmupDone("skipped");
  const ex = api.EX(); api.state.exIndex = ex.length - 1; api.state.setIndex = ex[ex.length - 1].sets - 1;
  api.skipSet(); api.leaveSession();
  out.push(api.getActive().phase);
  api.resume(); out.push(api.state.phase, api.state.stretchStep);
  api.stretchDone("skipped");
  return same(out, ["home", "warmup", "warmup", "stretch", "stretch", 0]);
});
test("10 · ligne d'export", () => {
  api.setProgram("A");
  const withF = api.sessionText({ date: "2026-01-06T17:00:00.000Z", prog: "A", entries: {}, warmup: "done", stretch: "skipped" }).split("\n");
  const without = api.sessionText({ date: "2026-01-06T17:00:00.000Z", prog: "A", entries: {} }).split("\n");
  return same([withF[1], without.length], ["Échauffement : fait · Étirements : passés", 1]);
});
test("11 · préparation à la 1re série seulement, retirée des repos", () => {
  api.setProgram("B"); api.start(true); api.warmupDone("done");
  const ex = api.EX(), i = ex.findIndex((e) => e.id === 202);
  const out = [];
  for (const k of [0, 1]) { api.state.exIndex = i; api.state.setIndex = k; out.push(api.prepHtml(ex[i]) !== ""); }
  const noRest = api.PROGRAMS.every((p) => p.ex.every((e) => !e.restPrep));
  const M = api.MOVES, F = api.FIGS;
  const keys = api.PROGRAMS.map((p) => p.ex.map((e) => e.prep || [])).flat(2).concat(api.STRETCHES.map((x) => x.move), ["deadBug"]);
  const items = keys.every((k) => M[k] && M[k].name && M[k].dose && F[k] && F[k].length &&
    ["place", "move", "feel", "avoid"].every((f) => M[k].tech[f]) && !JSON.stringify(M[k]).includes("—"));
  return same([out, noRest, items], [[true, false], true, true]);
});
test("12b · texte de transition des étirements", () => {
  const S = api.STRETCHES, msgs = [];
  for (let k = 1; k < S.length; k++) msgs.push(api.stretchTransition(S[k - 1], S[k]));
  return same(msgs, ["Encore une fois", "Étirement suivant", "Change de côté", "Change de côté", "Change de côté"]);
});
test("12 · rendu des écrans Échauffement et Étirements", () => {
  for (const id of ["A", "B"]) {
    api.setProgram(id); api.start(true); api.renderWarmup();
    api.warmupDone("done");
    for (let k = 0; k < api.STRETCHES.length; k++) { api.state.stretchStep = k; api.renderStretch(false); api.renderStretch(k > 0); }
    api.state.stretchStep = 0; api.stretchStart(); api.stretchDone("skipped");
  }
  return true;
});

if (errors) { console.error("\n" + errors + " erreur(s)."); process.exit(1); }
console.log("OK  " + tests + " tests échauffement et étirements");
for (const p of api.PROGRAMS) {
  const sets = p.ex.reduce((s, e) => s + e.sets, 0);
  const min = Math.round(p.ex.reduce((s, e) => s + e.sets * (e.rest + 35) + 180, 0) / 60);
  console.log("OK  " + p.label.padEnd(9) + " " + String(p.ex.length).padStart(2) + " exercices, " + sets + " séries, ~" + min + " min");
}
process.exit(0);
