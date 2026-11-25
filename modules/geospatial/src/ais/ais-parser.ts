// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type {AISRow} from './ais-schema';
import {decodeAISMessage} from './decode-ais-message';

/** AIVDM or AIVDO framing, including optional tag blocks and a log suffix after the checksum. */
const AIS_SENTENCE =
  /^((?:\\[^\\]*\\[ \t]*)*)!((AIVD[MO]),([1-9]),([1-9]),(\d?),([AB12]?),([0-W`-w]+),([0-5]))\*([0-9a-fA-F]{2})(?=$|[,\s])/;

/** Options that control handling of AIS input errors. */
type AISParseOptions = {
  /** Validate the sentence and tag block checksums. */
  validateChecksum: boolean;
  /** Skip malformed sentences and messages. */
  skipInvalidRecords: boolean;
};

/** Parsed framing for one NMEA sentence. */
type AISSentence = {
  /** Groups fragments by sentence kind, sequence identifier and receive channel. */
  fragmentKey: string;
  /** Number of sentences in this message. */
  fragmentCount: number;
  /** One-based number of this fragment. */
  fragmentNumber: number;
  /** Six-bit armored fragment. */
  payload: string;
  /** Padding bits at the end of the fragment. */
  fillBits: number;
  /** Tag-block time in Unix seconds. */
  timestamp: number | null;
  /** Receive channel as written in this sentence. */
  channel: string | null;
  /** Whether the sentence and any tag blocks have matching checksums. */
  checksumValid: boolean;
};

/** AIS fragments already received for a multipart message. */
type PendingAISMessage = {
  /** Number of sentences in the complete message. */
  fragmentCount: number;
  /** Received fragments, in sentence order. */
  payloads: string[];
  /** First available tag-block time, in Unix seconds. */
  timestamp: number | null;
  /** Source line of the first fragment. */
  firstLine: number;
};

/** Parses an NMEA log, returning the decoded rows and the number of discarded records. */
export function parseAISText(
  text: string,
  options: AISParseOptions
): {rows: AISRow[]; invalidRecordCount: number} {
  /** Decoded messages in the order their last fragment appeared. */
  const rows: AISRow[] = [];
  /** Partial messages tracked independently by sequence and channel. */
  const pending = new Map<string, PendingAISMessage>();
  /** Number of invalid sentences, malformed messages and incomplete fragment groups. */
  let invalidRecordCount = 0;

  /** Records a rejected line or reports it as a parse error in strict mode. */
  function rejectRecord(lineNumber: number, message: string, alwaysSkip = false): void {
    if (!options.skipInvalidRecords && !alwaysSkip) {
      throw new Error(`AISLoader: line ${lineNumber}: ${message}`);
    }
    invalidRecordCount++;
  }

  /** Reads a line and emits a row when the AIS message is complete. */
  function readLine(line: string, index: number): void {
    if (!line.trim()) {
      return;
    }
    const lineNumber = index + 1;
    const sentence = parseAISSentence(line.trim());
    if (!sentence) {
      rejectRecord(lineNumber, 'malformed AIVDM or AIVDO sentence');
      return;
    }

    const {fragmentKey, fragmentCount, fragmentNumber, fillBits, channel, checksumValid} = sentence;
    if (options.validateChecksum && !checksumValid) {
      if (fragmentCount > 1) {
        pending.delete(fragmentKey);
      }
      rejectRecord(lineNumber, 'checksum mismatch', true);
      return;
    }
    if (fragmentNumber > fragmentCount || (fragmentNumber < fragmentCount && fillBits !== 0)) {
      pending.delete(fragmentKey);
      rejectRecord(lineNumber, 'invalid fragment number or fill bits');
      return;
    }

    let {payload, timestamp} = sentence;
    if (fragmentCount > 1) {
      if (fragmentNumber === 1) {
        const previous = pending.get(fragmentKey);
        if (previous) {
          rejectRecord(previous.firstLine, 'incomplete multipart message');
        }
        pending.set(fragmentKey, {
          fragmentCount,
          payloads: [payload],
          timestamp,
          firstLine: lineNumber
        });
        return;
      }
      const group = pending.get(fragmentKey);
      if (group?.fragmentCount !== fragmentCount || group.payloads.length !== fragmentNumber - 1) {
        pending.delete(fragmentKey);
        rejectRecord(lineNumber, 'unexpected multipart fragment');
        return;
      }
      group.payloads.push(payload);
      group.timestamp ??= timestamp;
      if (fragmentNumber < fragmentCount) {
        return;
      }
      pending.delete(fragmentKey);
      payload = group.payloads.join('');
      timestamp = group.timestamp;
    }

    let row: AISRow | null;
    try {
      row = decodeAISMessage(payload, fillBits, timestamp, channel);
    } catch (error) {
      rejectRecord(lineNumber, (error as Error).message);
      return;
    }
    if (row) {
      rows.push(row);
    }
  }

  text.split(/\r?\n/).forEach(readLine);
  for (const {firstLine} of pending.values()) {
    rejectRecord(firstLine, 'incomplete multipart message');
  }
  return {rows, invalidRecordCount};
}

/** Reads NMEA sentence fields, checking the independent sentence and tag block checksums. */
function parseAISSentence(line: string): AISSentence | null {
  const match = AIS_SENTENCE.exec(line);
  if (!match) {
    return null;
  }

  const [
    ,
    tags,
    sentence,
    sentenceType,
    fragmentCount,
    fragmentNumber,
    sequence,
    channel,
    payload,
    fillBits,
    checksum
  ] = match;
  let checksumValid = matchesChecksum(sentence, checksum);
  let timestamp: number | null = null;
  for (const [, fields] of tags.matchAll(/\\([^\\]*)\\/g)) {
    const tag = /^(.*)\*([0-9a-fA-F]{2})$/.exec(fields);
    if (!tag) {
      return null;
    }
    checksumValid = checksumValid && matchesChecksum(tag[1], tag[2]);
    const time = /(?:^|,)c:(\d+(?:\.\d+)?)(?:,|$)/.exec(tag[1]);
    if (time && timestamp === null) {
      const secondsOrMilliseconds = Number(time[1]);
      if (Number.isFinite(secondsOrMilliseconds)) {
        timestamp =
          secondsOrMilliseconds >= 1e11 ? secondsOrMilliseconds / 1000 : secondsOrMilliseconds;
      }
    }
  }

  return {
    fragmentKey: `${sentenceType}:${sequence}:${channel}`,
    fragmentCount: Number(fragmentCount),
    fragmentNumber: Number(fragmentNumber),
    payload,
    fillBits: Number(fillBits),
    timestamp,
    channel: channel || null,
    checksumValid
  };
}

/** Compares the XOR of the characters inside a sentence or tag block with its hex checksum. */
function matchesChecksum(body: string, checksum: string): boolean {
  let actual = 0;
  for (let index = 0; index < body.length; index++) {
    actual ^= body.charCodeAt(index);
  }
  return actual === Number.parseInt(checksum, 16);
}
