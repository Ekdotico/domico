---
"@ekdotico/domico": patch
---

The agent hook stays inside the project and fails closed; the linter bounds its
work; the installer refuses to write through a symlink.

**The PostToolUse hook runs only the project's own linter.** It walked up from
the edited file to the filesystem root and ran whatever `ekdotico-lint` it found
beside the first `.ekdotico-lint.json` it met. That is a program chosen by the
directory a file sits in: an agent asked to fix a typo in a checkout under
`/tmp`, or in a repository vendored under the project, ran that checkout's
binary or committed `dist/` with the developer's privileges and fed its output
back into the model. The hook now resolves `CLAUDE_PROJECT_DIR`, exits at once
for a file whose real path lies outside it, and stops the walk at the project
root — never above it. The walk itself stays, because the estate is several
repositories under one parent and a session opened at the parent must still
find each repository's own config.

**The hook reports a linter that did not run.** Its exit status and stderr were
discarded, so a crash, a malformed config, a `files` glob matching nothing, or
the hook timeout all passed the edit in silence. Exit 0 and exit 1 from the
linter mean it ran; any other status is reported on stderr as "did not run"
with the captured output, and the hook exits 2. A linter that is not installed
still exits 0, since a consumer that has not installed the package yet must be
able to, but now says so on stderr. `ekdotico-lint` itself now reports a config
it cannot parse and exits 2 rather than throwing.

**The linter bounds two paths that grew with the file.** The file-path
exemption's regular expression had no length bound on either side of the `/`,
which is quadratic on a long run of dotted identifiers; both sides are capped.
`vocabularyFindings` lowercased the whole source once per vocabulary hit per
canonical phrase; it does so once per file. A file over 1 MiB is skipped and
the skip is reported on stderr, since no copy surface is that large and the
hook has a timeout to keep.

**The installer never writes through a symlink and never throws.** A
`.claude` or `.claude/hooks` that is a symbolic link, or a hook destination that
is one, is reported on stderr and left alone. A write that fails is reported the
same way. Both exit 0, as the contract states: the install path never fails a
consumer's install over a hook. `--target` with no value is now a message rather
than a stack trace.
