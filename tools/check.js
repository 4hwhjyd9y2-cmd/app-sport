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
    "return (function(){" + src + "; return { PROGRAMS, setProgram, start, renderEffort, goRecovery, state, EX: () => EX };})()"
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

if (errors) { console.error("\n" + errors + " erreur(s)."); process.exit(1); }
for (const p of api.PROGRAMS) {
  const sets = p.ex.reduce((s, e) => s + e.sets, 0);
  const min = Math.round(p.ex.reduce((s, e) => s + e.sets * (e.rest + 35) + 180, 0) / 60);
  console.log("OK  " + p.label.padEnd(9) + " " + String(p.ex.length).padStart(2) + " exercices, " + sets + " séries, ~" + min + " min");
}
process.exit(0);
