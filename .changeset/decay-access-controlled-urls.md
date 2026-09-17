---
"@ekdotico/domico": patch
---

`ekdotico-check decay` no longer reports a URL as one that "no longer answers" when
the host answered by refusing the anonymous probe. A 401, 403, 407, or 429 means the
page is behind a login, a bot challenge, or a rate limit, each of which the estate
runs on purpose; the first run after deree switched on Attack Challenge Mode read the
site's own address as a dead link and went red. Only a 4xx that describes the request,
such as 404 or 410, is a finding now. A 5xx is recorded as inconclusive rather than as
a finding, because the origin failing at the moment of the probe is what the monthly
re-run exists to see again.
