// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Synthetic entry controls for precise malformed-container coverage, not an interoperability oracle. */
export interface FixtureEntry {
  /** Raw filename bytes; defaults to ASCII abc.txt. */
  name?: Uint8Array;
  /** Raw payload; defaults to abc or its known raw-DEFLATE encoding. */
  payload?: Uint8Array;
  /** ZIP compression method. */
  method?: number;
  /** General-purpose flags. */
  flags?: number;
  /** Shared size/offset ZIP64 sentinels. */
  zip64?: boolean;
  /** Data descriptor variant. */
  descriptor?: 'signed' | 'unsigned';
  /** Extra local records appended after any ZIP64 record. */
  localExtra?: Uint8Array;
  /** Extra central records appended after any ZIP64 record. */
  centralExtra?: Uint8Array;
  /** Raw central comment. */
  comment?: Uint8Array;
  /** Local fixed-header mutation. */
  patchLocal?: (header: DataView) => void;
  /** Central fixed-header mutation. */
  patchCentral?: (header: DataView) => void;
  /** Descriptor mutation. */
  patchDescriptor?: (header: DataView) => void;
}

/** Builds explicit small synthetic ZIP records with the independently known CRC of abc. */
export function createZipFixture(
  entries: FixtureEntry[] = [{}],
  options: {zip64?: boolean; comment?: Uint8Array; patchEnd?: (header: DataView) => void} = {}
): Uint8Array<ArrayBuffer> {
  const localChunks: Uint8Array[] = [];
  const centralChunks: Uint8Array[] = [];
  let localOffset = 0;
  for (const entry of entries) {
    const name = entry.name ?? new TextEncoder().encode('abc.txt');
    const payload =
      entry.payload ??
      (entry.method === 8 ? new Uint8Array([75, 76, 74, 6, 0]) : new TextEncoder().encode('abc'));
    const size = 3;
    const flags = (entry.flags ?? 0) | (entry.descriptor ? 8 : 0);
    const method = entry.method ?? 0;
    const localExtra = concatenateZipBytes(
      entry.zip64
        ? zip64Extra([
            entry.descriptor ? 0n : BigInt(size),
            entry.descriptor ? 0n : BigInt(payload.length)
          ])
        : new Uint8Array(),
      entry.localExtra ?? new Uint8Array()
    );
    const centralExtra = concatenateZipBytes(
      entry.zip64
        ? zip64Extra([BigInt(size), BigInt(payload.length), BigInt(localOffset)])
        : new Uint8Array(),
      entry.centralExtra ?? new Uint8Array()
    );
    const comment = entry.comment ?? new Uint8Array();
    const local = new Uint8Array(30 + name.length + localExtra.length);
    const localHeader = new DataView(local.buffer);
    localHeader.setUint32(0, 0x04034b50, true);
    localHeader.setUint16(4, entry.zip64 ? 45 : 20, true);
    localHeader.setUint16(6, flags, true);
    localHeader.setUint16(8, method, true);
    localHeader.setUint32(14, entry.descriptor ? 0 : 0x352441c2, true);
    localHeader.setUint32(
      18,
      entry.zip64 ? 0xffffffff : entry.descriptor ? 0 : payload.length,
      true
    );
    localHeader.setUint32(22, entry.zip64 ? 0xffffffff : entry.descriptor ? 0 : size, true);
    localHeader.setUint16(26, name.length, true);
    localHeader.setUint16(28, localExtra.length, true);
    local.set(name, 30);
    local.set(localExtra, 30 + name.length);
    entry.patchLocal?.(localHeader);
    const descriptor = new Uint8Array(
      entry.descriptor ? (entry.descriptor === 'signed' ? 4 : 0) + 4 + (entry.zip64 ? 16 : 8) : 0
    );
    if (entry.descriptor) {
      const view = new DataView(descriptor.buffer);
      const prefix = entry.descriptor === 'signed' ? 4 : 0;
      if (prefix) view.setUint32(0, 0x08074b50, true);
      view.setUint32(prefix, 0x352441c2, true);
      if (entry.zip64) {
        view.setBigUint64(prefix + 4, BigInt(payload.length), true);
        view.setBigUint64(prefix + 12, BigInt(size), true);
      } else {
        view.setUint32(prefix + 4, payload.length, true);
        view.setUint32(prefix + 8, size, true);
      }
      entry.patchDescriptor?.(view);
    }
    const central = new Uint8Array(46 + name.length + centralExtra.length + comment.length);
    const centralHeader = new DataView(central.buffer);
    centralHeader.setUint32(0, 0x02014b50, true);
    centralHeader.setUint16(4, entry.zip64 ? 45 : 20, true);
    centralHeader.setUint16(6, entry.zip64 ? 45 : 20, true);
    centralHeader.setUint16(8, flags, true);
    centralHeader.setUint16(10, method, true);
    centralHeader.setUint32(16, 0x352441c2, true);
    centralHeader.setUint32(20, entry.zip64 ? 0xffffffff : payload.length, true);
    centralHeader.setUint32(24, entry.zip64 ? 0xffffffff : size, true);
    centralHeader.setUint16(28, name.length, true);
    centralHeader.setUint16(30, centralExtra.length, true);
    centralHeader.setUint16(32, comment.length, true);
    centralHeader.setUint32(42, entry.zip64 ? 0xffffffff : localOffset, true);
    central.set(name, 46);
    central.set(centralExtra, 46 + name.length);
    central.set(comment, 46 + name.length + centralExtra.length);
    entry.patchCentral?.(centralHeader);
    localChunks.push(local, payload, descriptor);
    centralChunks.push(central);
    localOffset += local.length + payload.length + descriptor.length;
  }
  const directory = concatenateZipBytes(...centralChunks);
  const footer = new Uint8Array(options.zip64 ? 76 : 0);
  if (options.zip64) {
    const view = new DataView(footer.buffer);
    view.setUint32(0, 0x06064b50, true);
    view.setBigUint64(4, 44n, true);
    view.setUint16(12, 45, true);
    view.setUint16(14, 45, true);
    view.setBigUint64(24, BigInt(entries.length), true);
    view.setBigUint64(32, BigInt(entries.length), true);
    view.setBigUint64(40, BigInt(directory.length), true);
    view.setBigUint64(48, BigInt(localOffset), true);
    view.setUint32(56, 0x07064b50, true);
    view.setBigUint64(64, BigInt(localOffset + directory.length), true);
    view.setUint32(72, 1, true);
  }
  const archiveComment = options.comment ?? new Uint8Array();
  const end = new Uint8Array(22 + archiveComment.length);
  const endHeader = new DataView(end.buffer);
  endHeader.setUint32(0, 0x06054b50, true);
  endHeader.setUint16(8, options.zip64 ? 0xffff : entries.length, true);
  endHeader.setUint16(10, options.zip64 ? 0xffff : entries.length, true);
  endHeader.setUint32(12, options.zip64 ? 0xffffffff : directory.length, true);
  endHeader.setUint32(16, options.zip64 ? 0xffffffff : localOffset, true);
  endHeader.setUint16(20, archiveComment.length, true);
  end.set(archiveComment, 22);
  options.patchEnd?.(endHeader);
  return concatenateZipBytes(...localChunks, directory, footer, end);
}

/** Concatenates bounded synthetic records. */
export function concatenateZipBytes(...chunks: Uint8Array[]): Uint8Array<ArrayBuffer> {
  const result = new Uint8Array(chunks.reduce((size, chunk) => size + chunk.length, 0));
  let position = 0;
  for (const chunk of chunks) {
    result.set(chunk, position);
    position += chunk.length;
  }
  return result;
}

/** Constructs the ZIP64 record specified by its required sentinel fields. */
function zip64Extra(values: bigint[]): Uint8Array {
  const bytes = new Uint8Array(4 + values.length * 8);
  const view = new DataView(bytes.buffer);
  view.setUint16(0, 1, true);
  view.setUint16(2, values.length * 8, true);
  values.forEach((value, index) => view.setBigUint64(4 + index * 8, value, true));
  return bytes;
}
