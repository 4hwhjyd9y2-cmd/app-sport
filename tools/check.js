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
    " renderWarmup, renderStretch, stretchStart, stretchTransition, prepHtml, STRETCHES, MOVES," +
    " suggestLoad, loadLevels, saveLevel, renderHome, goEffort, hasPrep, renderPrep, exAny: exById };})()"
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
      if (api.hasPrep(ex[i])) api.renderPrep();
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
  api.setProgram("C");
  const ex = exById("C", 104);
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
  api.goEffort(); steps.push(api.state.phase);
  const ex = api.EX(); api.state.exIndex = ex.length - 1; api.state.setIndex = ex[ex.length - 1].sets - 1;
  api.skipSet(); steps.push(api.state.phase);
  api.stretchDone("skipped");
  const h = api.getHistory();
  steps.push(api.state.phase, h[h.length - 1].warmup, h[h.length - 1].stretch);
  return same(steps, ["warmup", "prep", 0, 0, "done", "effort", "stretch", "end", "done", "skipped"]);
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
test("11 · page Préparation avant la 1re série, rien sur l'écran d'effort ni pendant les repos", () => {
  const pages = {};
  for (const id of ["C", "A", "B"]) {
    api.setProgram(id); api.start(true); api.warmupDone("done");
    pages[id] = [];
    while (api.state.phase === "prep" || api.state.phase === "effort") {
      if (api.state.phase === "prep") { pages[id].push(api.EX()[api.state.exIndex].id); api.goEffort(); }
      if (/Séries de montée|Préparation/.test(screen.innerHTML)) return "préparation sur l'écran d'effort de " + id;
      api.skipSet();
    }
    api.stretchDone("skipped");
  }
  api.setProgram("B"); api.start(true); api.warmupDone("done");
  const page = screen.innerHTML, out = [/1\. Préparation/.test(page) && /2\. Séries de montée/.test(page)];
  api.leaveSession(); out.push(api.getActive().phase); api.resume(); out.push(api.state.phase);
  api.goEffort(); api.skipSet(); api.skipSet(); api.goRecovery(); api.leaveSession();
  out.push(api.getActive().exIndex, api.getActive().phase);
  const noRest = api.PROGRAMS.every((p) => p.ex.every((e) => !e.restPrep));
  const M = api.MOVES;
  const keys = api.PROGRAMS.map((p) => p.ex.map((e) => e.prep || [])).flat(2).concat(api.STRETCHES.map((x) => x.move), ["deadBug"]);
  const items = keys.every((k) => M[k] && M[k].name && M[k].dose &&
    ["place", "move", "feel", "avoid"].every((f) => M[k].tech[f]) && !JSON.stringify(M[k]).includes("—"));
  return same([pages, out, noRest, items], [{ C: [104, 202, 103], A: [101, 116], B: [202, 104, 201, 113, 209] }, [true, "prep", "prep", 1, "prep"], true, true]);
});
test("12b · texte de transition des étirements", () => {
  const S = api.STRETCHES, msgs = [];
  for (let k = 1; k < S.length; k++) msgs.push(api.stretchTransition(S[k - 1], S[k]));
  return same(msgs, ["Encore une fois", "Étirement suivant", "Change de côté", "Change de côté", "Change de côté"]);
});
test("12 · rendu des écrans Échauffement et Étirements", () => {
  for (const id of ["C", "A", "B"]) {
    api.setProgram(id); api.start(true); api.renderWarmup();
    api.warmupDone("done");
    for (let k = 0; k < api.STRETCHES.length; k++) { api.state.stretchStep = k; api.renderStretch(false); api.renderStretch(k > 0); }
    api.state.stretchStep = 0; api.stretchStart(); api.stretchDone("skipped");
  }
  return true;
});

// Semaine en 3 séances (lundi haut, mardi jambes et abdos, jeudi corps entier), à partir du 30/11/2026
const reset = () => { for (const k of Object.keys(mem)) if (k.startsWith("TEMPO_S_")) delete mem[k]; };
const day = (d) => "2026-12-" + String(d).padStart(2, "0") + "T17:00:00.000Z";
const put = (prog, list) => ls.setItem("TEMPO_S_HIST_" + prog, JSON.stringify(list));
const done = (id, sets, extra) => ({ [id]: Object.assign({ sets }, extra || {}) });
const x = (n, r) => Array(n).fill(0).map(() => Object.assign({}, r));
const fresh = (prog) => { api.setProgram(prog); api.state.session = null; api.state.gym = "1"; api.state.levels = api.loadLevels(); };
const sug = (prog, id) => { const e = exById(prog, id); return api.suggestLoad(e); };

test("13 · programme de la semaine", () => {
  const plan = (id) => api.PROGRAMS.find((p) => p.id === id).ex.map((e) =>
    e.id + ":" + e.sets + "x" + (e.type === "hold" ? e.hold + "s" : e.lo + "-" + e.hi) + "/" + e.rest);
  return same([api.PROGRAMS.map((p) => p.id + " " + p.label), plan("C"), plan("A"), plan("B")], [
    ["C Lundi", "A Mardi", "B Jeudi", "M Maison"],
    ["104:4x4-6/120", "202:4x6-10/120", "103:3x8-10/120", "204:3x8-12/120", "301:3x12-15/60", "115:3x25s/90", "112:2x40s/60"],
    ["101:4x8-10/120", "116:3x8-10/120", "107:3x10-12/90", "208:4x15-20/45", "111:3x8-12/60", "205:3x25s/60"],
    ["202:3x6-10/120", "104:3x4-6/120", "201:3x8-10/90", "113:3x10-12/90", "204:3x8-12/120", "209:3x8-10/120", "115:3x25s/90", "112:2x40s/60"],
  ]);
});
test("14 · un id désigne le même exercice dans toutes les séances", () => {
  const seen = {}, bad = [];
  const sig = (e) => JSON.stringify([e.name, e.type, e.levels, e.assistLevels, e.startKg, e.kgStep, e.startAssist, e.assistStep, e.lo, e.hi, e.hold, e.gymDep, e.perSide]);
  for (const p of api.PROGRAMS) for (const e of p.ex) { const s = sig(e); if (e.id in seen && seen[e.id] !== s) bad.push(p.id + "/" + e.id); seen[e.id] = s; }
  return same(bad, []);
});
test("15 · niveau commun aux séances qui partagent un exercice", () => {
  reset();
  ls.setItem("TEMPO_S_LEVELS_A", JSON.stringify({ 115: 4, 104: 0 }));   // enregistrés par l'ancienne séance A
  fresh("C");
  const out = [api.state.levels[115], api.state.levels[104]];
  api.saveLevel(115, 2);
  fresh("B");
  out.push(api.state.levels[115], api.state.levels[104], JSON.parse(mem.TEMPO_S_LEVELS_A)[115]);
  return same(out, [4, 0, 2, 0, 4]);
});
test("16 · progression d'une séance à l'autre, séries prévues ce jour-là", () => {
  reset();
  const top = { reps: 6, assist: 15, lvl: 0 };
  put("C", [{ date: day(1), prog: "C", gym: "1", entries: done(104, x(4, { reps: 5, assist: 15, lvl: 0 })) }]);
  put("B", [{ date: day(3), prog: "B", gym: "1", entries: done(104, x(3, top), { easy: true }) }]);
  fresh("C"); api.state.levels[104] = 0;
  const out = [sug("C", 104)];                                 // jeudi en mode easy : ignoré
  put("B", [{ date: day(24), prog: "B", gym: "1", entries: done(104, x(3, top)) }]);
  out.push(sug("C", 104));                                     // jeudi normal, 3 séries sur 3 au top
  put("B", [{ date: day(24), prog: "B", gym: "1", entries: done(104, x(2, top).concat([{ skipped: true }])) }]);
  out.push(sug("C", 104));                                     // une série sautée : pas de montée
  return same(out, [{ assist: 15, bumped: false }, { assist: 12.5, bumped: true }, { assist: 15, bumped: false }]);
});
test("17 · stagnation sur machine : -10 %, au moins un palier", () => {
  reset();
  const s = (d, reps, kg) => ({ date: day(d), prog: "A", gym: "1", entries: done(101, reps.map((r) => ({ reps: r, kg }))) });
  fresh("A");
  put("A", [s(1, [9, 9, 8, 8], 100), s(8, [9, 8, 8, 8], 100), s(15, [8, 9, 8, 8], 100)]);
  const out = [sug("A", 101)];
  put("A", [s(1, [9, 9, 8, 8], 100), s(8, [9, 9, 9, 8], 100), s(15, [8, 9, 8, 8], 100)]);
  out.push(sug("A", 101));                                     // une répétition gagnée entre-temps
  put("A", [s(1, [9, 9, 8, 8], 95), s(8, [9, 8, 8, 8], 100), s(15, [8, 9, 8, 8], 100)]);
  out.push(sug("A", 101));                                     // seulement 2 séances à cette charge
  put("A", [s(1, [10, 10, 10, 10], 100), s(8, [10, 10, 10, 10], 100), s(15, [10, 10, 10, 10], 100)]);
  out.push(sug("A", 101));                                     // tout au top : on monte
  put("A", []);
  put("C", [1, 8, 15].map((d) => ({ date: day(d), prog: "C", gym: "1", entries: done(301, x(3, { reps: 12, kg: 4 })) })));
  out.push(sug("C", 301));                                     // 10 % de 4 kg : un palier de 1 kg
  return same(out, [{ kg: 90, bumped: false, reset: true, delta: 10 }, { kg: 100, bumped: false }, { kg: 100, bumped: false },
    { kg: 105, bumped: true }, { kg: 3, bumped: false, reset: true, delta: 1 }]);
});
test("18 · stagnation en assistance, séances easy mises de côté", () => {
  reset();
  const s = (prog, d, reps, extra) => ({ date: day(d), prog, gym: "1", entries: done(104, reps.map((r) => ({ reps: r, assist: 15, lvl: 0 })), extra) });
  put("C", [s("C", 1, [5, 5, 4, 4]), s("C", 8, [5, 4, 4, 4]), s("C", 15, [5, 5, 4, 4])]);
  fresh("C"); api.state.levels[104] = 0;
  const out = [sug("C", 104)];
  put("C", [s("C", 1, [5, 5, 4, 4]), s("C", 15, [5, 5, 4, 4])]);
  put("B", [s("B", 10, [5, 4, 4], { easy: true })]);
  out.push(sug("C", 104));                                     // la séance easy ne compte pas
  return same(out, [{ assist: 17.5, bumped: false, reset: true, delta: 2.5 }, { assist: 15, bumped: false }]);
});
test("19 · rappel du jeudi : séries marquées easy et message à l'écran", () => {
  reset();
  const dips = exById("B", 202), keep = dips.easyUntil, out = [];
  for (const until of ["2999-12-31", "2000-01-01"]) {
    dips.easyUntil = until;
    fresh("B"); api.start(true); api.warmupDone("done"); api.goEffort();
    out.push(api.state.session.entries[202].easy === true, screen.innerHTML.includes("2 à 3 répétitions avant l'échec"));
  }
  dips.easyUntil = keep;
  const monday = exById("C", 202);
  return same([out, monday.easyUntil, keep], [[true, true, false, false], undefined, "2026-12-17"]);
});
test("20 · messages de stagnation à l'écran", () => {
  reset();
  put("A", [1, 8, 15].map((d) => ({ date: day(d), prog: "A", gym: "1", entries: done(101, x(4, { reps: 9, kg: 100 })) })));
  fresh("A"); api.start(true); api.warmupDone("done");
  const prep = screen.innerHTML.includes("toutes tes séries à 90 kg");
  api.goEffort();
  const effort = screen.innerHTML.includes("−10 kg");
  api.goRecovery();
  return same([prep, effort, screen.innerHTML.includes("charge baissée pour repartir")], [true, true, true]);
});
test("21 · export d'une séance enregistrée avant la nouvelle semaine", () => {
  reset(); fresh("A");
  const old = { date: "2026-11-24T17:00:00.000Z", prog: "A", gym: "1", entries: Object.assign(
    done(101, x(4, { reps: 9, kg: 100 })), done(104, x(4, { reps: 5, assist: 15, lvl: 0 }), { levelIndex: 0 }), done(103, x(3, { reps: 9, kg: 12 }))) };
  const now = { date: day(1), prog: "A", gym: "1", entries: Object.assign(done(205, x(3, { sec: 25, lvl: 0 })), done(101, x(4, { reps: 9, kg: 100 })), done(116, x(3, { reps: 9, kg: 12 }))) };
  const head = (s) => api.sessionText(s).split("\n").slice(1).map((l) => l.split(" (")[0].split(" : ")[0]);
  return same([api.sessionText(old).split("\n")[0], head(old), head(now)], ["Séance du mardi · 24/11/2026 · Salle 1",
    ["1. Presse à cuisses", "2. Développé couché", "3. Tractions assistées"], ["1. Presse à cuisses", "2. Soulevé de terre roumain", "3. Hollow body"]]);
});
test("22 · séance en cours enregistrée par l'ancienne version", () => {
  reset();
  ls.setItem("TEMPO_S_ACTIVE_A", JSON.stringify({ exIndex: 6, setIndex: 3, session: { date: day(1), prog: "A", gym: "1", entries: {} } }));
  fresh("A"); api.renderHome(); api.resume();
  return same([api.state.exIndex, api.state.setIndex], [5, 2]);
});

test("23 · aperçu « À suivre » sur l'écran de repos", () => {
  reset();
  put("A", [{ date: day(1), prog: "A", gym: "1", entries: done(101, x(4, { reps: 9, kg: 100 })) }]);
  fresh("B"); api.start(true); api.warmupDone("done"); api.goEffort();
  const text = () => screen.innerHTML.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
  const out = [];
  api.goRecovery(); out.push(/Série 2 sur 3 Dips assistés 6–10 réps assistance 25 kg \+15 s/.test(text()));
  api.state.setIndex = 2; api.goRecovery();
  out.push(/Exercice 2 sur 8 · préparation d'abord Tractions assistées/.test(text()), /Avant : tractions scapulaires\./.test(text()));
  const ex = api.EX(); api.state.exIndex = ex.length - 1; api.state.setIndex = ex[ex.length - 1].sets - 1; api.goRecovery();
  out.push(/Fin de séance Étirements/.test(text()));
  fresh("A"); api.start(true); api.warmupDone("done"); api.goEffort(); api.state.setIndex = 3; api.goRecovery();
  out.push(/Soulevé de terre roumain .* 8–10 réps 10 kg Avant : séries de montée\./.test(text()));
  return same(out, [true, true, true, true, true]);
});

if (errors) { console.error("\n" + errors + " erreur(s)."); process.exit(1); }
console.log("OK  " + tests + " tests (échauffement, étirements, semaine en 3 séances)");
for (const p of api.PROGRAMS) {
  const sets = p.ex.reduce((s, e) => s + e.sets, 0);
  const min = Math.round(p.ex.reduce((s, e) => s + e.sets * (e.rest + 35) + 180, 0) / 60);
  console.log("OK  " + p.label.padEnd(9) + " " + String(p.ex.length).padStart(2) + " exercices, " + sets + " séries, ~" + min + " min");
}
process.exit(0);
