# Independent ZIP reader fixtures

All payloads are `abc` (three bytes); all archives are below 1 KiB.

- `python.zip`: Python 3 `zipfile`; STORE directory/member, UTF-8 DEFLATE member, entry/archive comments.
- `python-descriptor.zip`: Python `zipfile` writing to a nonseekable output (signed ZIP32 descriptor).
- `python-descriptor64.zip`: the same with `force_zip64=True` (signed ZIP64 descriptor).
- `python-local64.zip`: Python `zipfile` with `force_zip64=True` on a seekable output (populated ZIP64 local header).
- `7zip.zip`: official 7-Zip 26.04 (macOS arm64), `7zz a -tzip -mm=Deflate -mtc=off -mta=off 7zip.zip abc.txt`.
- `infozip.zip`: macOS Info-ZIP `zip -X -0 infozip.zip abc.txt`, with the input timestamp set by `touch -t 198001010000 abc.txt`.

Fixtures are committed binary assets; build and tests do not require Python or external archive tools. Malformed and sparse boundary cases are synthesized in the tests; they are not claimed as independent interoperability fixtures.

`indexed-baseline.zip` is a 381-byte deterministic indexed STORE archive captured from #4214 before removing JSZip. It preserves the populated-header layout previously qualified against JSZip; it is a byte-regression fixture, not an independent reader fixture.
