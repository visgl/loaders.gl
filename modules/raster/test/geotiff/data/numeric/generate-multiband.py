# loaders.gl
# SPDX-License-Identifier: MIT
# Copyright (c) vis.gl contributors
"""Generate a tiny two-band, signed-int16 overview TIFF without a decoder dependency."""
from pathlib import Path
import struct


def encode_tiff():
    """Return a 2x2 chunky raster with independent band metadata and a user-defined CRS."""
    metadata = (b'<GDALMetadata><Item name="NAME">test</Item>'
                b'<Item name="DESCRIPTION" sample="0">height</Item>'
                b'<Item name="DESCRIPTION" sample="1">uncertainty</Item></GDALMetadata>\0')
    pixels = struct.pack('<8h', -2, 11, 2, 12, 3, 13, 4, 14)
    keys = [1, 1, 0, 1, 2048, 0, 1, 32767]
    # tag, field type, count, encoded payload (TIFF 6.0).
    tags = [(254, 4, 1, struct.pack('<I', 1)),
            (256, 4, 1, struct.pack('<I', 2)), (257, 4, 1, struct.pack('<I', 2)),
            (258, 3, 2, struct.pack('<HH', 16, 16)),
            (259, 3, 1, struct.pack('<H', 1)), (262, 3, 1, struct.pack('<H', 1)),
            (273, 4, 1, b'\0' * 4), (277, 3, 1, struct.pack('<H', 2)),
            (278, 4, 1, struct.pack('<I', 2)), (279, 4, 1, struct.pack('<I', len(pixels))),
            (284, 3, 1, struct.pack('<H', 1)), (339, 3, 2, struct.pack('<HH', 2, 2)),
            (34735, 3, len(keys), struct.pack('<8H', *keys)),
            (42112, 2, len(metadata), metadata)]
    payload_start = 8 + 2 + 12 * len(tags) + 4
    payload = bytearray()
    entries = []
    for tag, kind, count, value in tags:
        if len(value) > 4:
            pointer = payload_start + len(payload)
            payload.extend(value)
            if len(payload) % 2:
                payload.append(0)
            value = struct.pack('<I', pointer)
        entries.append((tag, struct.pack('<HHI', tag, kind, count), value.ljust(4, b'\0')))
    pixel_offset = payload_start + len(payload)
    result = b'II' + struct.pack('<HIH', 42, 8, len(tags))
    for tag, header, value in entries:
        result += header + (struct.pack('<I', pixel_offset) if tag == 273 else value)
    return result + b'\0' * 4 + payload + pixels


Path(__file__).with_name('multiband.tif').write_bytes(encode_tiff())
