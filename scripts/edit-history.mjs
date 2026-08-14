#!/usr/bin/env node
/**
 * EDIT_HISTORY_AND_IDEAS.txt tooling.
 *
 *   node scripts/edit-history.mjs check
 *       Completeness check: every version in version.ts / public/changelog.json
 *       must be documented in the history log, and the pending-ideas section
 *       must exist and be non-empty. Exits non-zero when something is missing.
 *
 *   node scripts/edit-history.mjs export
 *       Generates a downloadable, versioned changelog file per published build
 *       into public/changelogs/ (plus index.json), sourced from the history log
 *       and public/changelog.json.
 *
 *   node scripts/edit-history.mjs append --version 0.4.8008 --title "Optimization" \
 *        --note "..." --note "..."
 *       Appends a new version entry to the history log (used on publish or when
 *       key systems are modified). Also refreshes the header stamp.
 *
 *   node scripts/edit-history.mjs append --system "Image generation" --note "..."
 *       Appends a dated system-change note under the current version.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HISTORY = path.join(root, 'EDIT_HISTORY_AND_IDEAS.txt');
const CHANGELOG = path.join(root, 'public', 'changelog.json');
const VERSION_TS = path.join(root, 'src', 'lib', 'version.ts');
const OUT_DIR = path.join(root, 'public', 'changelogs');

const read = (p) => fs.readFileSync(p, 'utf8');

function appVersion() {
  const m = read(VERSION_TS).match(/APP_VERSION\s*=\s*"([^"]+)"/);
  const s = read(VERSION_TS).match(/APP_STAGE\s*=\s*"([^"]+)"/);
  return { version: m?.[1] ?? '0.0.0', stage: s?.[1] ?? 'alpha' };
}

function changelogEntries() {
  return JSON.parse(read(CHANGELOG)).entries ?? [];
}

function historyVersions(text) {
  return new Set([...text.matchAll(/^(\d+\.\d+\.\d+[\w.-]*)\s+—/gm)].map((m) => m[1].replace(/-alpha$/, '')));
}

function pendingIdeas(text) {
  const sec = text.split(/5\.\s+PENDING \/ EXPERIMENTAL IDEAS/i).pop() ?? '';
  return sec
    .split('\n')
    .filter((l) => l.trim().startsWith('- '))
    .map((l) => l.trim().slice(2).trim());
}

function monthYear(d = new Date()) {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric', timeZone: 'UTC' });
}

/* ---------------------------------------------------------------- check */
function check() {
  const text = read(HISTORY);
  const hv = historyVersions(text);
  const { version, stage } = appVersion();
  const problems = [];

  const missing = changelogEntries()
    .map((e) => e.version)
    .filter((v) => !hv.has(v));
  if (missing.length) problems.push(`Published builds missing from history log: ${missing.join(', ')}`);

  if (!hv.has(version)) problems.push(`Current APP_VERSION ${version} has no section in the history log.`);
  if (!text.includes(`APP_VERSION:  ${version}`) && !text.includes(`APP_VERSION: ${version}`))
    problems.push(`History header still points at an older APP_VERSION (expected ${version}).`);
  if (!text.includes(`v${version}-${stage}`))
    problems.push(`History "Last updated" stamp does not mention v${version}-${stage}.`);

  const ideas = pendingIdeas(text);
  if (ideas.length === 0) problems.push('Pending / Experimental Ideas section is empty.');

  for (const n of [1, 2, 3, 4, 5]) {
    if (!new RegExp(`^\\s*${n}\\.\\s+[A-Z]`, 'm').test(text)) problems.push(`Missing top-level section ${n}.`);
  }

  console.log(`Documented versions: ${hv.size}`);
  console.log(`Published builds:    ${changelogEntries().length}`);
  console.log(`Pending ideas:       ${ideas.length}`);

  if (problems.length) {
    console.error('\nCOMPLETENESS CHECK FAILED');
    problems.forEach((p) => console.error(` - ${p}`));
    process.exitCode = 1;
    return false;
  }
  console.log('\nCOMPLETENESS CHECK PASSED — history log covers every published build and lists pending ideas.');
  return true;
}

/* --------------------------------------------------------------- export */
function historySectionFor(text, version) {
  const re = new RegExp(`^${version.replace(/\./g, '\\.')}[\\w.-]*\\s+—[^\\n]*\\n-+\\n([\\s\\S]*?)(?=\\n\\d+\\.\\d+\\.\\d+[\\w.-]*\\s+—|\\n={10,})`, 'm');
  return (text.match(re)?.[1] ?? '').trim();
}

function exportChangelogs() {
  const text = read(HISTORY);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const index = [];

  for (const entry of changelogEntries()) {
    const v = entry.version;
    const lines = [];
    lines.push('='.repeat(70));
    lines.push(`  UNTOLD STORIES — v${v} (${entry.date ?? ''})`.trimEnd());
    lines.push(`  ${entry.title ?? 'Release notes'}`);
    lines.push('='.repeat(70), '');

    const block = (label, items) => {
      if (!items?.length) return;
      lines.push(label, '-'.repeat(label.length));
      items.forEach((i) => lines.push(`  - ${i}`));
      lines.push('');
    };
    block('Highlights', entry.highlights);
    block('Features', entry.features);
    block('Improvements', entry.improvements);
    block('Fixes', entry.fixes);

    const internal = historySectionFor(text, v);
    if (internal) {
      lines.push('Build log', '---------');
      internal.split('\n').forEach((l) => lines.push(`  ${l.replace(/^-\s*/, '- ')}`.trimEnd()));
      lines.push('');
    }
    lines.push(`Generated from EDIT_HISTORY_AND_IDEAS.txt on ${new Date().toISOString().slice(0, 10)}`);

    const file = `untold-stories-v${v}.txt`;
    fs.writeFileSync(path.join(OUT_DIR, file), lines.join('\n') + '\n');
    index.push({ version: v, title: entry.title ?? '', date: entry.date ?? '', file: `/changelogs/${file}` });
  }

  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({ builds: index }, null, 2) + '\n');
  console.log(`Exported ${index.length} versioned changelog files to public/changelogs/`);
}

/* --------------------------------------------------------------- append */
function parseArgs(argv) {
  const out = { notes: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--note') out.notes.push(argv[++i]);
    else if (a.startsWith('--')) out[a.slice(2)] = argv[++i];
  }
  return out;
}

function append(argv) {
  const args = parseArgs(argv);
  let text = read(HISTORY);
  const { stage } = appVersion();
  const notes = args.notes.length ? args.notes : ['Optimization.'];

  if (args.version) {
    const version = args.version;
    const header = `${version}-${stage} — ${args.title ? args.title + ' — ' : ''}${monthYear()}`;
    const entry = `${header}\n${'-'.repeat(header.length)}\n${notes.map((n) => `- ${n}`).join('\n')}\n\n`;

    if (!historyVersions(text).has(version)) {
      const marker = /(^\s*4\.\s+VERSION-BY-VERSION HISTORY[^\n]*\n=+\n\n?)/m;
      text = marker.test(text) ? text.replace(marker, `$1${entry}`) : text.replace(/(={10,}\n\s*5\.)/m, `${entry}$1`);
    }
    // refresh header stamp
    text = text
      .replace(/Last updated: [^\n]*/, `Last updated: ${new Date().toISOString().slice(0, 10)} (v${version}-${stage})`)
      .replace(/APP_VERSION:\s+[\w.-]+/, `APP_VERSION:  ${version}`)
      .replace(/Display:\s+v[\w.-]+/, `Display:      v${version}-${stage}`);
    console.log(`Appended v${version} to the history log.`);
  } else {
    // system-change note under the current version section
    const { version } = appVersion();
    const re = new RegExp(`(^${version.replace(/\./g, '\\.')}[\\w.-]*\\s+—[^\\n]*\\n-+\\n)`, 'm');
    const stamped = notes
      .map((n) => `- [${new Date().toISOString().slice(0, 10)}]${args.system ? ` ${args.system}:` : ''} ${n}`)
      .join('\n');
    if (!re.test(text)) {
      console.error(`No section for current version ${version}; run with --version first.`);
      process.exitCode = 1;
      return;
    }
    text = text.replace(re, `$1${stamped}\n`);
    text = text.replace(/Last updated: [^\n]*/, `Last updated: ${new Date().toISOString().slice(0, 10)} (v${version}-${stage})`);
    console.log(`Appended ${notes.length} system note(s) to v${version}.`);
  }

  fs.writeFileSync(HISTORY, text);
}

/* ----------------------------------------------------------------- main */
const [cmd, ...rest] = process.argv.slice(2);
switch (cmd) {
  case 'check':
    check();
    break;
  case 'export':
    exportChangelogs();
    break;
  case 'append':
    append(rest);
    break;
  case 'publish':
    // convenience: append + check + export in one pass
    append(rest);
    if (check()) exportChangelogs();
    break;
  default:
    console.log('Usage: node scripts/edit-history.mjs <check|export|append|publish> [options]');
    process.exitCode = 1;
}
