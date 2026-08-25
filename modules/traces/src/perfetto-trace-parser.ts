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
type SequenceState = {defaultTrackUuid: bigint; eventNames: Map<bigint, string>};

/** Limits retained state while decoding an untrusted streaming trace. */
export type PerfettoTraceParserOptions = {
  maxStateEntries?: number;
  maxOpenSlices?: number;
};

const DEFAULT_MAX_STATE_ENTRIES = 100_000;
const DEFAULT_MAX_OPEN_SLICES = 100_000;

/** Decodes a canonical Perfetto protobuf trace into typed Arrow tables. */
export function parsePerfettoTrace(
  bytes: Uint8Array,
  options?: PerfettoTraceParserOptions
): PerfettoTrace {
  const parser = new PerfettoTraceParser(options);

  for (const traceField of readProtobufFields(bytes)) {
    if (traceField.fieldNumber === 1 && traceField.value instanceof Uint8Array) {
      parser.addTracePacket(traceField.value);
    }
  }
  return parser.finish();
}

/** Stateful decoder for canonical Perfetto TracePacket messages. */
export class PerfettoTraceParser {
  private readonly maxStateEntries: number;
  private readonly maxOpenSlices: number;
  private openSliceCount = 0;
  private internedEventNameCount = 0;
  /** Latest descriptor for each globally unique track UUID. */
  private readonly tracks = new Map<bigint, TrackRow>();
  /** Completed slices and instant events waiting to be returned. */
  private readonly slices: SliceRow[] = [];
  /** Latest process descriptor for each process ID. */
  private readonly processes = new Map<number, ProcessRow>();
  /** Latest thread descriptor for each thread ID. */
  private readonly threads = new Map<number, ThreadRow>();
  /** Nested slice starts waiting for matching end events, keyed by track UUID. */
  private readonly openSlices = new Map<bigint, OpenSlice[]>();
  /** Incremental TrackEvent state keyed by trusted packet sequence ID. */
  private readonly sequences = new Map<number, SequenceState>();
  /** Track descriptor updates waiting for the next streaming drain. */
  private readonly pendingTracks = new Map<bigint, TrackRow>();
  /** Process descriptor updates waiting for the next streaming drain. */
  private readonly pendingProcesses = new Map<number, ProcessRow>();
  /** Thread descriptor updates waiting for the next streaming drain. */
  private readonly pendingThreads = new Map<number, ThreadRow>();

  /** Creates a parser with bounded retained incremental state. */
  constructor(options: PerfettoTraceParserOptions = {}) {
    this.maxStateEntries = normalizeParserLimit(options.maxStateEntries, DEFAULT_MAX_STATE_ENTRIES);
    this.maxOpenSlices = normalizeParserLimit(options.maxOpenSlices, DEFAULT_MAX_OPEN_SLICES);
  }

  /** Adds one decoded TracePacket to the accumulated trace. */
  addTracePacket(bytes: Uint8Array): void {
    const fields = readProtobufFields(bytes);
    const sequenceId = readNumberField(fields, 10) ?? 0;
    const sequenceFlags = readNumberField(fields, 13) ?? 0;
    const incrementalStateCleared = readNumberField(fields, 41) === 1 || (sequenceFlags & 1) !== 0;
    let sequence = this.sequences.get(sequenceId);
    if (!sequence || incrementalStateCleared) {
      if (!sequence && this.sequences.size >= this.maxStateEntries) {
        throw new Error('Perfetto trace contains too many incremental-state sequences.');
      }
      sequence = {defaultTrackUuid: 0n, eventNames: new Map()};
      this.sequences.set(sequenceId, sequence);
    }

    const internedData = readBytesField(fields, 12);
    if (internedData) {
      this.internedEventNameCount = parseInternedData(
        internedData,
        sequence,
        this.maxStateEntries,
        this.internedEventNameCount
      );
    }
    const defaults = readBytesField(fields, 59);
    if (defaults) {
      parseTracePacketDefaults(defaults, sequence);
    }

    for (const field of fields) {
      if (!(field.value instanceof Uint8Array)) {
        continue;
      }
      if (field.fieldNumber === 60) {
        this.parseTrackDescriptor(field.value);
      } else if (field.fieldNumber === 11) {
        const timestamp = readBigIntField(fields, 8);
        if (timestamp !== undefined) {
          this.parseTrackEvent(field.value, timestamp, sequence);
        }
      } else if (field.fieldNumber === 43) {
        const process = parseProcessDescriptor(field.value);
        if (process) {
          this.setProcess(process);
        }
      } else if (field.fieldNumber === 44) {
        const thread = parseThreadDescriptor(field.value);
        if (thread) {
          this.setThread(thread);
        }
      }
    }
  }

  /** Drains completed rows accumulated since the previous drain into Arrow tables. */
  drain(): PerfettoTrace {
    const trace = {
      tracks: buildTrackTable([...this.pendingTracks.values()]),
      slices: buildSliceTable(this.slices),
      processes: buildProcessTable([...this.pendingProcesses.values()]),
      threads: buildThreadTable([...this.pendingThreads.values()])
    };
    this.pendingTracks.clear();
    this.slices.length = 0;
    this.pendingProcesses.clear();
    this.pendingThreads.clear();
    return trace;
  }

  /** Finishes a non-streaming parse and returns the complete Arrow-backed trace. */
  finish(): PerfettoTrace {
    return {
      tracks: buildTrackTable([...this.tracks.values()]),
      slices: buildSliceTable(this.slices),
      processes: buildProcessTable([...this.processes.values()]),
      threads: buildThreadTable([...this.threads.values()])
    };
  }

  /** Parses one TrackDescriptor and any embedded ownership descriptor. */
  private parseTrackDescriptor(bytes: Uint8Array): void {
    const fields = readProtobufFields(bytes);
    const trackUuid = readBigIntField(fields, 1);
    if (trackUuid === undefined) {
      return;
    }

    const processBytes = readBytesField(fields, 3);
    const threadBytes = readBytesField(fields, 4);
    const process = processBytes ? parseProcessDescriptor(processBytes) : null;
    const thread = threadBytes ? parseThreadDescriptor(threadBytes) : null;
    if (process) {
      this.setProcess(process);
    }
    if (thread) {
      this.setThread(thread);
    }

    const previous = this.tracks.get(trackUuid);
    const track: TrackRow = {
      trackUuid,
      parentTrackUuid: readBigIntField(fields, 5) ?? previous?.parentTrackUuid ?? null,
      type: process
        ? 'process'
        : thread
          ? 'thread'
          : readBytesField(fields, 8)
            ? 'counter'
            : (previous?.type ?? 'slice'),
      name:
        readStringField(fields, 2) ??
        readStringField(fields, 10) ??
        readStringField(fields, 13) ??
        previous?.name ??
        null,
      pid: process?.pid ?? thread?.pid ?? previous?.pid ?? null,
      tid: thread?.tid ?? previous?.tid ?? null
    };
    this.tracks.set(trackUuid, track);
    this.pendingTracks.set(trackUuid, track);
  }

  /** Parses a TrackEvent and resolves begin/end events into complete slices. */
  private parseTrackEvent(bytes: Uint8Array, timestamp: bigint, sequence: SequenceState): void {
    const fields = readProtobufFields(bytes);
    const legacyEvent = readBytesField(fields, 6);
    const legacyFields = legacyEvent ? readProtobufFields(legacyEvent) : [];
    const legacyPhase = readNumberField(legacyFields, 2);
    const type = readNumberField(fields, 9) ?? getTrackEventTypeFromLegacyPhase(legacyPhase);
    const trackUuid = readBigIntField(fields, 11) ?? sequence.defaultTrackUuid;
    if (type === undefined) {
      return;
    }
    const nameIid = readBigIntField(fields, 10);
    const name =
      readStringField(fields, 23) ??
      (nameIid === undefined ? undefined : sequence.eventNames.get(nameIid)) ??
      '';

    if (type === 1) {
      if (this.openSliceCount >= this.maxOpenSlices) {
        throw new Error('Perfetto trace contains too many unmatched begin events.');
      }
      const stack = this.openSlices.get(trackUuid) ?? [];
      stack.push({ts: timestamp, name});
      this.openSlices.set(trackUuid, stack);
      this.openSliceCount++;
    } else if (type === 2) {
      const begin = this.openSlices.get(trackUuid)?.pop();
      if (begin) {
        this.openSliceCount--;
      }
      if (begin && timestamp >= begin.ts) {
        this.slices.push({trackUuid, ts: begin.ts, dur: timestamp - begin.ts, name: begin.name});
      }
    } else if (type === 3) {
      this.slices.push({trackUuid, ts: timestamp, dur: 0n, name});
    } else if (legacyPhase === 88) {
      const durationMicroseconds = readBigIntField(legacyFields, 3) ?? 0n;
      this.slices.push({
        trackUuid,
        ts: timestamp,
        dur: BigInt.asIntN(64, durationMicroseconds) * 1000n,
        name
      });
    }
  }

  /** Merges a process descriptor without discarding a previously known name. */
  private setProcess(process: ProcessRow): void {
    const previous = this.processes.get(process.pid);
    const merged = {pid: process.pid, name: process.name ?? previous?.name ?? null};
    this.processes.set(process.pid, merged);
    this.pendingProcesses.set(process.pid, merged);
  }

  /** Merges a thread descriptor without discarding known ownership or names. */
  private setThread(thread: ThreadRow): void {
    const previous = this.threads.get(thread.tid);
    const merged = {
      tid: thread.tid,
      pid: thread.pid ?? previous?.pid ?? null,
      name: thread.name ?? previous?.name ?? null
    };
    this.threads.set(thread.tid, merged);
    this.pendingThreads.set(thread.tid, merged);
  }
}

/** Maps legacy Chrome trace phases that have direct TrackEvent equivalents. */
function getTrackEventTypeFromLegacyPhase(phase: number | undefined): number | undefined {
  if (phase === 66) {
    return 1;
  }
  if (phase === 69) {
    return 2;
  }
  if (phase === 73 || phase === 105) {
    return 3;
  }
  if (phase === 88) {
    return 4;
  }
  return undefined;
}

/** Adds stable TrackEvent interned names to one packet sequence. */
function parseInternedData(
  bytes: Uint8Array,
  sequence: SequenceState,
  maxStateEntries: number,
  internedEventNameCount: number
): number {
  for (const field of readProtobufFields(bytes)) {
    if (field.fieldNumber === 2 && field.value instanceof Uint8Array) {
      const eventNameFields = readProtobufFields(field.value);
      const iid = readBigIntField(eventNameFields, 1);
      const name = readStringField(eventNameFields, 2);
      if (iid !== undefined && name !== undefined) {
        if (!sequence.eventNames.has(iid) && sequence.eventNames.size >= maxStateEntries) {
          throw new Error('Perfetto trace contains too many interned event names.');
        }
        if (!sequence.eventNames.has(iid)) {
          internedEventNameCount++;
          if (internedEventNameCount > maxStateEntries) {
            throw new Error('Perfetto trace contains too many interned event names.');
          }
        }
        sequence.eventNames.set(iid, name);
      }
    }
  }
  return internedEventNameCount;
}

/** Applies TrackEvent defaults for one packet sequence. */
function parseTracePacketDefaults(bytes: Uint8Array, sequence: SequenceState): void {
  const trackEventDefaults = readBytesField(readProtobufFields(bytes), 11);
  if (trackEventDefaults) {
    const trackUuid = readBigIntField(readProtobufFields(trackEventDefaults), 11);
    if (trackUuid !== undefined) {
      sequence.defaultTrackUuid = trackUuid;
    }
  }
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

/** Normalizes a parser resource limit. */
function normalizeParserLimit(value: number | undefined, defaultValue: number): number {
  return value && Number.isFinite(value) && value > 0 ? Math.floor(value) : defaultValue;
}
