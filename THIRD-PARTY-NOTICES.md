# Third-party notices

`@ekdotico/domico` is licensed under the GNU Affero General Public License,
version 3 only. The material below belongs to other people and stays under the
licence each of them chose. Nothing in [LICENSE](./LICENSE) changes those terms.

## Typefaces

Crimson Pro, Commissioner, and Fira Code are each licensed under the SIL Open
Font License, version 1.1.

This package ships **loading configuration, not font files**: `src/fonts/`
names the three families and their Google Fonts sources, and an application
fetches the files itself at build time. No font file is in the published
tarball, so there is no copy of the Open Font License to carry beside one. An
application that serves the fonts takes on that licence's notice requirement
for the copies it serves. `fontLicences` from `@ekdotico/domico/fonts` gives
the SPDX identifiers for an attribution page.

## Icons

Every icon in `src/components/icons.tsx` other than the Ekdotico logo mark is
from Lucide, with its path data copied unchanged from `lucide-static`. Lucide
is distributed under the ISC License, and some of its icons derive from Feather
under the MIT License. Both notices follow.

```
ISC License

Copyright (c) 2026 Lucide Icons and Contributors

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

```
The MIT License (MIT) (for the Lucide icons derived from the Feather project)

Copyright (c) 2013-present Cole Bemis

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
