// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {WriterOptions, WriterWithEncoder} from '@loaders.gl/loader-utils';

import type {PerfettoTrace} from './perfetto-trace-arrow-schema';
import {
  concatenateUint8Arrays,
  encodeProtobufBytesField,
  encodeProtobufStringField,
  encodeProtobufVarintField
} from './perfetto-protobuf';

/** Perfetto trace writer options. */
export type PerfettoTraceWriterOptions = WriterOptions & {
  perfettoTrace?: Record<string, never>;
};

/** Serializes package-owned Arrow tables as a canonical Perfetto protobuf trace. */
export const PerfettoTraceWriter = {
  name: 'Perfetto Trace Writer',
  id: 'perfettoTrace',
  module: 'traces',
  version: 'latest',
  extensions: ['perfetto-trace', 'pftrace'],
  mimeTypes: ['application/x-perfetto-trace', 'application/vnd.google.protobuf'],
  binary: true,
  options: {},
  encode: async (trace: PerfettoTrace) => encodePerfettoTrace(trace),
  encodeSync: encodePerfettoTrace
} as const satisfies WriterWithEncoder<PerfettoTrace, never, PerfettoTraceWriterOptions>;

/** Encodes one Arrow-backed trace into the Perfetto Trace protobuf envelope. */
function encodePerfettoTrace(trace: PerfettoTrace): ArrayBuffer {
  const processRows = readArrowRows(trace.processes);
  const threadRows = readArrowRows(trace.threads);
  const processNames = new Map(
    processRows.map(row => [readNumber(row.pid), readOptionalString(row.name)])
  );
  const threadDetails = new Map(
    threadRows.map(row => [
      readNumber(row.tid),
      {pid: readOptionalNumber(row.pid), name: readOptionalString(row.name)}
    ])
  );
  const packets: Uint8Array[] = [];

  for (const row of processRows) {
    packets.push(wrapTracePacket(43, encodeProcessDescriptor(row)));
  }
  for (const row of threadRows) {
    packets.push(wrapTracePacket(44, encodeThreadDescriptor(row)));
  }
  for (const row of readArrowRows(trace.tracks)) {
    packets.push(wrapTracePacket(60, encodeTrackDescriptor(row, processNames, threadDetails)));
  }

  const sliceRows = readArrowRows(trace.slices).sort((left, right) => {
    const leftTimestamp = readBigInt(left.ts);
    const rightTimestamp = readBigInt(right.ts);
    return leftTimestamp < rightTimestamp ? -1 : leftTimestamp > rightTimestamp ? 1 : 0;
  });
  for (const row of sliceRows) {
    const duration = readBigInt(row.dur);
    if (duration === 0n) {
      packets.push(wrapTracePacket(11, encodeTrackEvent(row, 3, true), readBigInt(row.ts)));
    } else {
      const timestamp = readBigInt(row.ts);
      packets.push(wrapTracePacket(11, encodeTrackEvent(row, 1, true), timestamp));
      packets.push(wrapTracePacket(11, encodeTrackEvent(row, 2, false), timestamp + duration));
    }
  }

  const bytes = concatenateUint8Arrays(packets.map(packet => encodeProtobufBytesField(1, packet)));
  const arrayBuffer = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(arrayBuffer).set(bytes);
  return arrayBuffer;
}

/** Wraps one nested descriptor or event in a TracePacket. */
function wrapTracePacket(fieldNumber: number, message: Uint8Array, timestamp?: bigint): Uint8Array {
  const fields = timestamp === undefined ? [] : [encodeProtobufVarintField(8, timestamp)];
  fields.push(encodeProtobufBytesField(fieldNumber, message));
  return concatenateUint8Arrays(fields);
}

/** Encodes a standalone process descriptor. */
function encodeProcessDescriptor(row: Record<string, unknown>): Uint8Array {
  const fields = [encodeProtobufVarintField(1, readNumber(row.pid))];
  const name = readOptionalString(row.name);
  if (name !== undefined) {
    fields.push(encodeProtobufStringField(6, name));
  }
  return concatenateUint8Arrays(fields);
}

/** Encodes a standalone thread descriptor. */
function encodeThreadDescriptor(row: Record<string, unknown>): Uint8Array {
  const fields: Uint8Array[] = [];
  const pid = readOptionalNumber(row.pid);
  if (pid !== undefined) {
    fields.push(encodeProtobufVarintField(1, pid));
  }
  fields.push(encodeProtobufVarintField(2, readNumber(row.tid)));
  const name = readOptionalString(row.name);
  if (name !== undefined) {
    fields.push(encodeProtobufStringField(5, name));
  }
  return concatenateUint8Arrays(fields);
}

/** Encodes one track descriptor and its optional ownership descriptor. */
function encodeTrackDescriptor(
  row: Record<string, unknown>,
  processNames: ReadonlyMap<number, string | undefined>,
  threadDetails: ReadonlyMap<number, {pid?: number; name?: string}>
): Uint8Array {
  const fields: Uint8Array[] = [];
  const name = readOptionalString(row.name);
  if (name !== undefined) {
    fields.push(encodeProtobufStringField(2, name));
  }
  fields.push(encodeProtobufVarintField(1, readBigInt(row.track_uuid)));
  const parentTrackUuid = readOptionalBigInt(row.parent_track_uuid);
  if (parentTrackUuid !== undefined) {
    fields.push(encodeProtobufVarintField(5, parentTrackUuid));
  }

  const type = readOptionalString(row.type);
  const pid = readOptionalNumber(row.pid);
  const tid = readOptionalNumber(row.tid);
  if (type === 'process' && pid !== undefined) {
    fields.push(
      encodeProtobufBytesField(3, encodeProcessDescriptor({pid, name: processNames.get(pid)}))
    );
  } else if (type === 'thread' && tid !== undefined) {
    const details = threadDetails.get(tid);
    fields.push(
      encodeProtobufBytesField(
        4,
        encodeThreadDescriptor({tid, pid: pid ?? details?.pid, name: details?.name})
      )
    );
  } else if (type === 'counter') {
    fields.push(
      encodeProtobufBytesField(8, name ? encodeProtobufStringField(1, name) : new Uint8Array())
    );
  }

  return concatenateUint8Arrays(fields);
}

/** Encodes one begin, end, or instant track event. */
function encodeTrackEvent(
  row: Record<string, unknown>,
  type: 1 | 2 | 3,
  includeName: boolean
): Uint8Array {
  const fields = [
    encodeProtobufVarintField(9, type),
    encodeProtobufVarintField(11, readBigInt(row.track_uuid))
  ];
  const name = readOptionalString(row.name);
  if (includeName && name !== undefined) {
    fields.push(encodeProtobufStringField(23, name));
  }
  return concatenateUint8Arrays(fields);
}

/** Materializes Arrow rows for format-level encoding. */
function readArrowRows(table: PerfettoTrace[keyof PerfettoTrace]): Record<string, unknown>[] {
  return Array.from(table as Iterable<Record<string, unknown>>);
}

/** Reads a required integer-like Arrow value. */
function readNumber(value: unknown): number {
  const numberValue = typeof value === 'bigint' ? Number(value) : value;
  if (typeof numberValue !== 'number' || !Number.isFinite(numberValue)) {
    throw new Error('Perfetto Arrow data is missing a required integer value.');
  }
  return numberValue;
}

/** Reads an optional integer-like Arrow value. */
function readOptionalNumber(value: unknown): number | undefined {
  return value == null ? undefined : readNumber(value);
}

/** Reads a required uint64-like Arrow value. */
function readBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') {
    return value;
  }
  if (typeof value === 'number' || typeof value === 'string') {
    return BigInt(value);
  }
  throw new Error('Perfetto Arrow data is missing a required uint64 value.');
}

/** Reads an optional uint64-like Arrow value. */
function readOptionalBigInt(value: unknown): bigint | undefined {
  return value == null ? undefined : readBigInt(value);
}

/** Reads an optional Arrow string value. */
function readOptionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
