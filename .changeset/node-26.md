---
'@ekdotico/domico': minor
---

`engines.node` is `>=24 <27`, from `>=22`. The package is built and published on Node 26, which `.nvmrc` now pins, and stays supported on 24 because deree and the documentation site deploy on Vercel, which offers 24 at most. No consumer runs it on 22. CI verifies on both 24 and 26; the publish, audit and consumers jobs read `.nvmrc`.
