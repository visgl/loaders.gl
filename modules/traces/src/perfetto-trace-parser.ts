// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';

import {
  perfettoProcessArrowSchema,
  perfettoSliceArrowSchema,
  perfettoThreadArrowSchema,
  perfettoTrackArrowSchema,
  type PerfettoTrace
} from './perfetto-trace-arrow-schema';
import {readProtobufFields, type ProtobufField} from './perfetto-protobuf';

type TrackRow = {
  trackUuid: bigint;
  parentTrackUuid: bigint | null;
  type: string;
  name: string | null;
  pid: number | null;
  tid: number | null;
};

type SliceRow = {trackUuid: bigint; ts: bigint; dur: bigint; name: string};
type ProcessRow = {pid: number; name: string | null};
type ThreadRow = {tid: number; pid: number | null; name: string | null};
type OpenSlice = {ts: bigint; name: string};

/** Decodes a canonical Perfetto protobuf trace into typed Arrow tables. */
export function parsePerfettoTrace(bytes: Uint8Array): PerfettoTrace {
  const tracks: TrackRow[] = [];
  const slices: SliceRow[] = [];
  const processes = new Map<number, ProcessRow>();
  const threads = new Map<number, ThreadRow>();
  const openSlices = new Map<bigint, OpenSlice[]>();

  for (const traceField of readProtobufFields(bytes)) {
    if (traceField.fieldNumber !== 1 || !(traceField.value instanceof Uint8Array)) {
      continue;
    }
    parseTracePacket(traceField.value, {tracks, slices, processes, threads, openSlices});
  }

  return {
    tracks: buildTrackTable(tracks),
    slices: buildSliceTable(slices),
    processes: buildProcessTable([...processes.values()]),
    threads: buildThreadTable([...threads.values()])
  };
}

/** Parses one TracePacket from the outer Perfetto Trace message. */
function parseTracePacket(
  bytes: Uint8Array,
  state: {
    tracks: TrackRow[];
    slices: SliceRow[];
    processes: Map<number, ProcessRow>;
    threads: Map<number, ThreadRow>;
    openSlices: Map<bigint, OpenSlice[]>;
  }
): void {
  for (const field of readProtobufFields(bytes)) {
    if (!(field.value instanceof Uint8Array)) {
      continue;
    }

    if (field.fieldNumber === 60) {
      parseTrackDescriptor(field.value, state);
    } else if (field.fieldNumber === 11) {
      parseTrackEvent(field.value, state.slices, state.openSlices);
    } else if (field.fieldNumber === 5) {
      const process = parseProcessDescriptor(field.value);
      if (process) {
        setProcess(state.processes, process);
      }
    } else if (field.fieldNumber === 6) {
      const thread = parseThreadDescriptor(field.value);
      if (thread) {
        setThread(state.threads, thread);
      }
    }
  }
}

/** Parses one TrackDescriptor and any embedded ownership descriptor. */
function parseTrackDescriptor(
  bytes: Uint8Array,
  state: {
    tracks: TrackRow[];
    processes: Map<number, ProcessRow>;
    threads: Map<number, ThreadRow>;
  }
): void {
  const fields = readProtobufFields(bytes);
  const trackUuid = readBigIntField(fields, 2);
  if (trackUuid === undefined) {
    return;
  }

  const processBytes = readBytesField(fields, 3);
  const threadBytes = readBytesField(fields, 4);
  const process = processBytes ? parseProcessDescriptor(processBytes) : null;
  const thread = threadBytes ? parseThreadDescriptor(threadBytes) : null;
  if (process) {
    setProcess(state.processes, process);
  }
  if (thread) {
    setThread(state.threads, thread);
  }

  state.tracks.push({
    trackUuid,
    parentTrackUuid: readBigIntField(fields, 5) ?? null,
    type: process ? 'process' : thread ? 'thread' : readBytesField(fields, 6) ? 'counter' : 'slice',
    name: readStringField(fields, 1) ?? null,
    pid: process?.pid ?? thread?.pid ?? null,
    tid: thread?.tid ?? null
  });
}

/** Merges duplicate process descriptors without discarding a previously known name. */
function setProcess(processes: Map<number, ProcessRow>, process: ProcessRow): void {
  const previous = processes.get(process.pid);
  processes.set(process.pid, {pid: process.pid, name: process.name ?? previous?.name ?? null});
}

/** Merges duplicate thread descriptors without discarding known ownership or names. */
function setThread(threads: Map<number, ThreadRow>, thread: ThreadRow): void {
  const previous = threads.get(thread.tid);
  threads.set(thread.tid, {
    tid: thread.tid,
    pid: thread.pid ?? previous?.pid ?? null,
    name: thread.name ?? previous?.name ?? null
  });
}

/** Parses one ProcessDescriptor. */
function parseProcessDescriptor(bytes: Uint8Array): ProcessRow | null {
  const fields = readProtobufFields(bytes);
  const pid = readNumberField(fields, 1);
  return pid === undefined ? null : {pid, name: readStringField(fields, 6) ?? null};
}

/** Parses one ThreadDescriptor. */
function parseThreadDescriptor(bytes: Uint8Array): ThreadRow | null {
  const fields = readProtobufFields(bytes);
  const tid = readNumberField(fields, 2);
  return tid === undefined
    ? null
    : {
        tid,
        pid: readNumberField(fields, 1) ?? null,
        name: readStringField(fields, 5) ?? null
      };
}

/** Parses one TrackEvent and resolves begin/end events into complete slices. */
function parseTrackEvent(
  bytes: Uint8Array,
  slices: SliceRow[],
  openSlices: Map<bigint, OpenSlice[]>
): void {
  const fields = readProtobufFields(bytes);
  const type = readNumberField(fields, 1);
  const trackUuid = readBigIntField(fields, 11);
  const timestamp = readBigIntField(fields, 8);
  if (type === undefined || trackUuid === undefined || timestamp === undefined) {
    return;
  }

  if (type === 1) {
    const stack = openSlices.get(trackUuid) ?? [];
    stack.push({ts: timestamp, name: readStringField(fields, 23) ?? ''});
    openSlices.set(trackUuid, stack);
  } else if (type === 2) {
    const begin = openSlices.get(trackUuid)?.pop();
    if (begin && timestamp >= begin.ts) {
      slices.push({trackUuid, ts: begin.ts, dur: timestamp - begin.ts, name: begin.name});
    }
  } else if (type === 3) {
    slices.push({
      trackUuid,
      ts: timestamp,
      dur: 0n,
      name: readStringField(fields, 23) ?? ''
    });
  }
}

/** Reads one varint field as a bigint. */
function readBigIntField(
  fields: readonly ProtobufField[],
  fieldNumber: number
): bigint | undefined {
  const value = fields.find(field => field.fieldNumber === fieldNumber)?.value;
  return typeof value === 'bigint' ? value : undefined;
}

/** Reads one varint field as a JavaScript number. */
function readNumberField(
  fields: readonly ProtobufField[],
  fieldNumber: number
): number | undefined {
  const value = readBigIntField(fields, fieldNumber);
  return value === undefined ? undefined : Number(BigInt.asIntN(32, value));
}

/** Reads one length-delimited field. */
function readBytesField(
  fields: readonly ProtobufField[],
  fieldNumber: number
): Uint8Array | undefined {
  const value = fields.find(field => field.fieldNumber === fieldNumber)?.value;
  return value instanceof Uint8Array ? value : undefined;
}

/** Reads one UTF-8 string field. */
function readStringField(
  fields: readonly ProtobufField[],
  fieldNumber: number
): string | undefined {
  const value = readBytesField(fields, fieldNumber);
  return value ? new TextDecoder().decode(value) : undefined;
}

/** Builds the typed track table. */
function buildTrackTable(rows: readonly TrackRow[]): PerfettoTrace['tracks'] {
  if (rows.length === 0) {
    return new arrow.Table(perfettoTrackArrowSchema);
  }
  return new arrow.Table(perfettoTrackArrowSchema, {
    track_uuid: arrow.vectorFromArray(
      rows.map(row => row.trackUuid),
      new arrow.Uint64()
    ),
    parent_track_uuid: arrow.vectorFromArray(
      rows.map(row => row.parentTrackUuid),
      new arrow.Uint64()
    ),
    type: arrow.vectorFromArray(
      rows.map(row => row.type),
      new arrow.Utf8()
    ),
    name: arrow.vectorFromArray(
      rows.map(row => row.name),
      new arrow.Utf8()
    ),
    pid: arrow.vectorFromArray(
      rows.map(row => row.pid),
      new arrow.Int32()
    ),
    tid: arrow.vectorFromArray(
      rows.map(row => row.tid),
      new arrow.Int32()
    )
  });
}

/** Builds the typed slice table. */
function buildSliceTable(rows: readonly SliceRow[]): PerfettoTrace['slices'] {
  if (rows.length === 0) {
    return new arrow.Table(perfettoSliceArrowSchema);
  }
  return new arrow.Table(perfettoSliceArrowSchema, {
    track_uuid: arrow.vectorFromArray(
      rows.map(row => row.trackUuid),
      new arrow.Uint64()
    ),
    ts: arrow.vectorFromArray(
      rows.map(row => row.ts),
      new arrow.Uint64()
    ),
    dur: arrow.vectorFromArray(
      rows.map(row => row.dur),
      new arrow.Uint64()
    ),
    name: arrow.vectorFromArray(
      rows.map(row => row.name),
      new arrow.Utf8()
    )
  });
}

/** Builds the typed process table. */
function buildProcessTable(rows: readonly ProcessRow[]): PerfettoTrace['processes'] {
  if (rows.length === 0) {
    return new arrow.Table(perfettoProcessArrowSchema);
  }
  return new arrow.Table(perfettoProcessArrowSchema, {
    pid: arrow.vectorFromArray(
      rows.map(row => row.pid),
      new arrow.Int32()
    ),
    name: arrow.vectorFromArray(
      rows.map(row => row.name),
      new arrow.Utf8()
    )
  });
}

/** Builds the typed thread table. */
function buildThreadTable(rows: readonly ThreadRow[]): PerfettoTrace['threads'] {
  if (rows.length === 0) {
    return new arrow.Table(perfettoThreadArrowSchema);
  }
  return new arrow.Table(perfettoThreadArrowSchema, {
    tid: arrow.vectorFromArray(
      rows.map(row => row.tid),
      new arrow.Int32()
    ),
    pid: arrow.vectorFromArray(
      rows.map(row => row.pid),
      new arrow.Int32()
    ),
    name: arrow.vectorFromArray(
      rows.map(row => row.name),
      new arrow.Utf8()
    )
  });
}
