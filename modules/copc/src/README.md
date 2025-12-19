# copc.js fork notes

copc.js was forked after some consideration:

- Split out LAZ functionality (use `@loaders.gl/las` module).
- Adapt to loaders.gl dynamic source system (replace `Getter`).
- Avoid bundling issues (e.g. dynamic import of fs) as loaders.gl already handles these.
- Modernize / simplify code (see below)

If some of the loaders.gl changes could be upstreamed we might consider unforking.

## Code "simplifications"

- Remove dated typescript constructs (e.g. ES2015 module syntax is preferred over namespaces)
- Multiple exports of same name (Hierarchy etc)
- Avoid importing Node.js dependencies
- Consolidate large number of small source code files.

## Original License

MIT License

Copyright (c) 2021 Connor Manning

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
