---
'@ekdotico/domico': patch
---

`check:consumers` refuses a credential that cannot see what it was asked about,
instead of reporting one as a clean bill of health.

`api()` mapped every 404 to `null`. That is correct on the contents endpoint,
where a repository without a `package.json` is an answer rather than a failure.
It was applied unchanged to `/orgs/{org}/repos`, where the same value means the
opposite, and the script walked zero repositories, printed
`0 consumer(s), 0 needing attention` and exited 0. `consumers.yml` reads an
absent report as every consumer being current, so the run closed the tracking
issue with the comment "Every consumer is on the published version." That is the
outcome this script's own docstring says it exits to avoid.

Three guards, because there are three doors and the obvious one is not the one
this organisation opens:

- **The organisation cannot be listed.** GitHub answers 404, not 403, for an
  organisation a credential is not allowed to know exists. The first page is no
  longer allowed to be `null`.
- **The organisation lists no repositories.** Measured against the live
  endpoint: `Ekdotico` is publicly visible while every repository in it is
  private, so a credential without access to those repositories is answered
  `200` with an empty array rather than 404. This is the door a personal-account
  token or a revoked organisation approval actually opens, and the 404 guard
  alone does not close it. An expired token is the safe case — that is 401, and
  `api()` already threw on it.
- **No `package.json` can be read.** Contents (read) is a separate permission
  from listing the organisation, and without it every `manifest()` 404s, which
  is indistinguishable from repositories that have no manifest. Every repository
  in this organisation is a Node project, so none being readable is a permission
  rather than a fact.

The run now states how many repositories were listed and how many manifests were
read, which is the number that makes a report of no consumers believable. Each
guard was verified by driving the unmodified script against a stubbed endpoint
before and after: exit 0 with a clean report before, exit 1 naming the cause
after, with the healthy run unchanged at exit 0.
