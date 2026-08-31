/**
 * Which repositories in the organisation are behind the published package.
 *
 * Every other guard in this directory reads this repository. This one reads the
 * repositories that depend on it, because the failure it looks for cannot be
 * seen from here: a release is published, the consumers carry on pinned to what
 * they had, and nothing anywhere goes red. Drift by inaction. The estate has
 * already paid for it once — three applications migrated onto this package and
 * none updated its written account afterwards, and by the time that surfaced the
 * documents were instructing agents to reintroduce the faults they described.
 *
 * What this deliberately does NOT do is open a pull request bumping the pin.
 * Every consumer pins exactly on purpose: a floating range would let an
 * unreviewed visual change reach an application through a routine install,
 * bypassing the four-theme review gate their own specifications require. An
 * upgrade is a deliberate act reviewed across four themes in both modes, so the
 * right output here is a notification a person acts on, not a branch a bot
 * merges. Automating the bump would automate past the gate.
 *
 *   node scripts/check-consumers.mjs [--out <path>] [--org <name>] [--version <v>]
 *
 * Exits 0 whether or not consumers are behind. A stale consumer is the normal
 * state for the hours after a release, and a workflow that goes red on the
 * normal state is a workflow people learn to ignore — the same reasoning the
 * tag write in audit.yml is non-fatal for. The signal is the report: when
 * --out is given and something is behind, the file is written and the caller
 * acts on its existence. Nothing is written when every consumer is current, so
 * `[ -s "$file" ]` is the whole of the caller's logic.
 *
 * Exits 1 only on a fault of its own — no token, the API refusing, or a token
 * that cannot see what it was asked about. That last one is the reason for the
 * three guards below: an organisation it cannot list, an organisation that
 * lists no repositories, and repositories whose package.json it cannot read all
 * produce "0 consumer(s), 0 needing attention" and exit 0 if they are allowed
 * to, which the caller then reads as every consumer being current.
 *
 * Needs a token that can read the organisation's repositories. GITHUB_TOKEN
 * inside a workflow is scoped to the repository it runs in and cannot see the
 * others, so this reads EKDOTICO_SUITE_TOKEN first and falls back to
 * GITHUB_TOKEN for the single-repository case a developer running it locally
 * might have.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const PKG = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8'));

const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

const ORG = arg('org', 'Ekdotico');
const OUT = arg('out', null);
/**
 * The version to measure against. Defaults to this checkout's package.json,
 * which after a changesets publish is the version that was just released — the
 * release commit lands on main before this ever runs. --version exists for
 * re-running the check against an older release without checking it out.
 */
const CURRENT = arg('version', PKG.version);
const NAME = PKG.name;

const TOKEN = process.env.EKDOTICO_SUITE_TOKEN || process.env.GITHUB_TOKEN;
if (!TOKEN) {
  console.error('No token. Set EKDOTICO_SUITE_TOKEN to a token that can read');
  console.error(`the ${ORG} organisation's repositories and their package.json.`);
  console.error('');
  console.error('GITHUB_TOKEN inside a workflow is scoped to the repository it');
  console.error('runs in, so it cannot answer this question and is not a');
  console.error('substitute. This exits rather than reporting every consumer as');
  console.error('unreadable, which is what a 404-per-repository run looks like.');
  process.exit(1);
}

async function api(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: {
      accept: 'application/vnd.github+json',
      authorization: `Bearer ${TOKEN}`,
      'x-github-api-version': '2022-11-28',
      'user-agent': 'ekdotico-check-consumers',
    },
  });
  // 404 on a contents path means the repository has no package.json, which is
  // an answer rather than a failure. Every other non-2xx is a fault: a rate
  // limit or a token without the scope reads exactly like "no consumer is
  // behind" if it is swallowed, which is the most expensive way for this to be
  // wrong.
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GET ${path} → ${res.status} ${res.statusText}\n${await res.text()}`);
  }
  return res.json();
}

/** Every repository in the organisation, archived ones excluded. */
async function repositories() {
  const all = [];
  for (let page = 1; ; page += 1) {
    const batch = await api(`/orgs/${ORG}/repos?per_page=100&type=all&page=${page}`);

    // api() maps 404 to null because a repository without a package.json is an
    // answer rather than a failure. That rule does not hold on this endpoint.
    // GitHub answers 404, not 403, for an organisation the credential is not
    // allowed to know exists, so a token owned by a personal account, or one
    // still awaiting organisation approval, lands here — and reading that as an
    // empty list walks zero repositories and prints a clean bill of health,
    // which is the one outcome this script exits to avoid. The first page is
    // therefore not allowed to be null.
    if (page === 1 && batch === null) {
      throw new Error(
        `GET /orgs/${ORG}/repos → 404.\n\n` +
          `The token cannot see the ${ORG} organisation. GitHub answers 404 rather\n` +
          'than 403 here, so this is the shape of a token owned by the wrong account,\n' +
          'or one still awaiting organisation approval — not an empty organisation.',
      );
    }

    if (!batch || batch.length === 0) break;
    all.push(...batch);
    if (batch.length < 100) break;
  }

  // 404 is not the only door, and on this organisation it is not the usual one.
  // Ekdotico is publicly visible while every repository in it is private, so a
  // credential with no access to those repositories is answered 200 with an
  // empty array — measured against the live endpoint, not assumed. An expired
  // token is the safe case: that is 401, and api() already throws on it. The
  // rest arrive here as zero repositories, and zero repositories in an
  // organisation that has several is a credential, not a fact.
  if (all.length === 0) {
    throw new Error(
      `${ORG} lists no repositories.\n\n` +
        'A publicly visible organisation answers 200 with an empty array to a\n' +
        'credential that cannot see its private repositories, so this is the shape\n' +
        "of a token without repository access rather than an empty organisation.\n" +
        "Check the token's access before believing a report of no consumers.",
    );
  }

  // An archived repository is a record, not a consumer. Bumping a pin in one is
  // not work anybody wants listed every month.
  return all.filter((r) => !r.archived).sort((a, b) => a.name.localeCompare(b.name));
}

async function manifest(repo) {
  const file = await api(`/repos/${ORG}/${repo}/contents/package.json`);
  if (!file || !file.content) return null;
  try {
    return JSON.parse(Buffer.from(file.content, 'base64').toString('utf8'));
  } catch {
    // A package.json that does not parse is the repository's own problem and
    // not this check's to report on.
    return null;
  }
}

/**
 * Numeric compare on the three parts. No semver dependency, because every
 * consumer is required to pin exactly and an exact pin is three integers —
 * anything carrying a range operator is a finding in its own right rather than
 * a version to compare.
 */
const parse = (v) => v.split('.').map((n) => Number.parseInt(n, 10));
function behind(pin, current) {
  const a = parse(pin);
  const b = parse(current);
  if (a.some(Number.isNaN) || b.some(Number.isNaN)) return false;
  for (let i = 0; i < 3; i += 1) {
    if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) < (b[i] ?? 0);
  }
  return false;
}

const FIELDS = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];

function findings(pkg) {
  const out = [];
  for (const field of FIELDS) {
    const spec = pkg?.[field]?.[NAME];
    if (!spec) continue;
    if (!/^\d+\.\d+\.\d+$/.test(spec)) {
      // A caret or a tilde is worse than being behind: it means the next
      // routine install moves the design system underneath the application
      // without anybody deciding to.
      out.push({ field, spec, kind: 'range' });
    } else if (behind(spec, CURRENT)) {
      out.push({ field, spec, kind: 'behind' });
    }
  }
  return out;
}

const repos = await repositories();
console.log(`${NAME}@${CURRENT} — checking ${repos.length} repositories in ${ORG}\n`);

const stale = [];
let consumers = 0;
let readable = 0;

for (const repo of repos) {
  const pkg = await manifest(repo.name);
  if (!pkg) continue;
  readable += 1;
  const found = findings(pkg);
  const depends = FIELDS.some((f) => pkg?.[f]?.[NAME]);
  if (!depends) continue;
  consumers += 1;

  if (found.length === 0) {
    console.log(`  ok    ${repo.name}`);
  } else {
    for (const f of found) {
      const label = f.kind === 'range' ? 'RANGE ' : 'BEHIND';
      console.log(`  ${label} ${repo.name}  ${f.field}: ${f.spec}`);
    }
    stale.push({ repo: repo.name, url: repo.html_url, found });
  }
}

// The last way a credential fault can still read as good news. Contents (read)
// is a separate permission from listing the organisation, and without it every
// manifest() 404s — which api() maps to null, indistinguishable from a
// repository that genuinely has no package.json. Every repository in this
// organisation is a Node project, so none of them being readable is a
// permission rather than a fact about the repositories.
if (readable === 0) {
  throw new Error(
    `Listed ${repos.length} repositories in ${ORG} and read package.json in none.\n\n` +
      'That is the shape of a token without Contents (read), not an organisation of\n' +
      'repositories that have no manifest. Check the permission before believing a\n' +
      'report of no consumers.',
  );
}

// Three counts rather than one, because "no consumers" is only believable
// alongside the number of manifests actually read.
console.log(
  `\n${repos.length} repositories, ${readable} with a package.json, ${consumers} depending on ${NAME}.`,
);
console.log(`${stale.length} needing attention.`);

if (stale.length === 0 || !OUT) {
  if (stale.length > 0 && !OUT) console.log('No --out given, so no report was written.');
  process.exit(0);
}

const lines = [
  `\`${NAME}@${CURRENT}\` is published, and ${stale.length} of ${consumers} consumers do not have it.`,
  '',
  '| Repository | Field | Pinned | Wanted |',
  '| --- | --- | --- | --- |',
];
for (const s of stale) {
  for (const f of s.found) {
    const pinned = f.kind === 'range' ? `\`${f.spec}\` — not an exact pin` : `\`${f.spec}\``;
    lines.push(`| [${s.repo}](${s.url}) | \`${f.field}\` | ${pinned} | \`${CURRENT}\` |`);
  }
}
lines.push(
  '',
  'Each of these is a deliberate act, not a bump to merge. Every consumer pins',
  'exactly so that a visual change cannot reach an application through a routine',
  'install, and their specifications require an upgrade to be reviewed across the',
  'four themes in both modes. This issue is the notification; the review is the work.',
  '',
  'A row reading "not an exact pin" is the more urgent kind: a range means the next',
  'install in that repository moves the design system with nobody deciding to.',
  '',
  '<sub>Opened by `scripts/check-consumers.mjs`. Closed automatically when every',
  'consumer is current.</sub>',
);

writeFileSync(OUT, `${lines.join('\n')}\n`);
console.log(`Report written to ${OUT}.`);
