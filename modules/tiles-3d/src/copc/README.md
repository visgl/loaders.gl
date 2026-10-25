# COPC implementation notes

The primary COPC reader is implemented in this module and has no runtime dependency on `copc.js`. It provides:

- Native LAS 1.4, VLR/EVLR, COPC info, and hierarchy parsing.
- Browser, HTTP, Blob, and Node random-access reads through loaders.gl file abstractions.
- TypeScript LAZ decoding directly into Arrow attributes.
- Selective and progressive PDRF 6-8 field delivery.

The original module and test fixtures were based on Connor Manning's `copc.js` project. The attribution and license are retained below.

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
