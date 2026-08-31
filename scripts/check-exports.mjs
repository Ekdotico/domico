/**
 * Verify every path the export map points at is actually inside the published
 * tarball. The `files` array and the `exports` map are maintained separately,
 * so a subpath can point at a file that ships in nobody's node_modules — and
 * the failure only appears in a consuming repository, as an unresolvable
 * import, after publish.
 *
 * Wildcard targets ("./assets/*") are satisfied by at least one shipped file
 * matching the prefix; treating them as literal paths reports a false miss.
 *
 * The manifest arrives on stdout, and `npm pack` runs the `prepare` lifecycle
 * before printing it — so this parse shares a channel with every script that
 * runs on the way to a tarball, and one `console.log` in any of them is a
 * syntax error here. Lifecycle scripts report on stderr; that is the reason,
 * not a preference.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(dirname(fileURLToPath(import.meta.url)));
const pkg = JSON.parse(readFileSync(`${ROOT}/package.json`, 'utf8'));

const listed = JSON.parse(
  execFileSync('npm', ['pack', '--dry-run', '--json'], { cwd: ROOT, encoding: 'utf8' }),
);
const shipped = listed[0].files.map((f) => f.path);
const shippedSet = new Set(shipped);

const targets = new Set();
const walk = (node) => {
  if (typeof node === 'string') {
    if (node.startsWith('./')) targets.add(node.slice(2));
  } else if (node && typeof node === 'object') {
    for (const v of Object.values(node)) walk(v);
  }
};
walk(pkg.exports);
walk(pkg.bin);

const satisfied = (t) => {
  if (!t.includes('*')) return shippedSet.has(t);
  const [prefix, suffix = ''] = t.split('*');
  return shipped.some((f) => f.startsWith(prefix) && f.endsWith(suffix) && f.length > prefix.length);
};

const missing = [...targets].filter((t) => !satisfied(t)).sort();
const wildcards = [...targets].filter((t) => t.includes('*'));

console.log(`tarball: ${shipped.length} files, ${(listed[0].size / 1024).toFixed(0)} kB packed`);
console.log(`export map references ${targets.size} paths (${wildcards.length} wildcard)`);
for (const w of wildcards) {
  const [prefix] = w.split('*');
  console.log(`  ${w} → ${shipped.filter((f) => f.startsWith(prefix)).length} files ship`);
}

if (missing.length === 0) {
  console.log('\nEvery referenced path ships.');
} else {
  console.log(`\n${missing.length} referenced path(s) NOT in the tarball:`);
  for (const m of missing) console.log(`  ${m}`);
  process.exitCode = 1;
}
