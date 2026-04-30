// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ZodError, z} from 'zod';

/**
 * Supported Chrome trace phase values.
 * @see https://www.chromium.org/developers/how-tos/trace-event-profiling-tool/trace-event-reading
 */
export const CHROME_TRACE_PHASE_VALUES = [
  'B',
  'E',
  'X',
  'I',
  'i',
  'C',
  'b',
  'e',
  'n',
  's',
  't',
  'f',
  'M',
  'N',
  'O',
  'P',
  'D',
  'S',
  'T',
  'R',
  'F',
  'v',
  'd'
] as const;

const chromeTraceEventPhaseSchema = z.enum(CHROME_TRACE_PHASE_VALUES);
const chromeTraceIdLikeSchema = z.union([z.string(), z.number()]);
const chromeTraceScopeSchema = z.enum(['g', 'p', 't']);

const chromeTraceEventSchema = z
  .object({
    name: z.string(),
    ph: chromeTraceEventPhaseSchema,
    ts: z.number().optional(),
    pid: chromeTraceIdLikeSchema,
    tid: chromeTraceIdLikeSchema,
    cat: z.string().optional(),
    dur: z.number().optional(),
    tdur: z.number().optional(),
    tts: z.number().optional(),
    id: chromeTraceIdLikeSchema.optional(),
    bind_id: chromeTraceIdLikeSchema.optional(),
    id2: z
      .object({
        local: chromeTraceIdLikeSchema.optional(),
        global: chromeTraceIdLikeSchema.optional()
      })
      .partial()
      .optional(),
    s: chromeTraceScopeSchema.optional(),
    scope: chromeTraceScopeSchema.optional(),
    args: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

const chromeTraceFileSchema = z
  .object({
    traceEvents: z.array(chromeTraceEventSchema),
    displayTimeUnit: z.string().optional(),
    systemTraceEvents: z.unknown().optional(),
    metadata: z.record(z.string(), z.unknown()).optional()
  })
  .passthrough();

/**
 * One validated Chrome trace file.
 */
export type ChromeTraceFileSchema = z.infer<typeof chromeTraceFileSchema>;

/**
 * One validated Chrome trace event row.
 */
export type ChromeTraceEventSchema = z.infer<typeof chromeTraceEventSchema>;

/**
 * One supported Chrome trace phase.
 */
export type ChromeTraceEventPhase = z.infer<typeof chromeTraceEventPhaseSchema>;

/**
 * Validation options shared by the Chrome trace helpers.
 */
export type ChromeTraceValidationOptions = {
  /** Maximum number of events to validate structurally before returning the input. */
  maxLength?: number;
};

const DEFAULT_MAX_LENGTH = 1000;

/**
 * Returns whether an unknown value resembles a Chrome trace file.
 */
export function maybeChromeTraceFile(data: unknown): data is ChromeTraceFileSchema {
  return Boolean(
    data && typeof data === 'object' && Array.isArray((data as {traceEvents?: unknown}).traceEvents)
  );
}

/**
 * Validates one parsed Chrome trace file and preserves any passthrough fields.
 */
export function validateChromeTraceFile(
  pathData: unknown,
  options: ChromeTraceValidationOptions = {}
): ChromeTraceFileSchema {
  const {maxLength = DEFAULT_MAX_LENGTH} = options;

  try {
    if (!pathData || typeof pathData !== 'object') {
      return chromeTraceFileSchema.parse(pathData);
    }

    const traceEvents = (pathData as {traceEvents?: unknown}).traceEvents;
    const slicedTraceEvents = Array.isArray(traceEvents)
      ? traceEvents.slice(0, maxLength)
      : traceEvents;

    chromeTraceFileSchema.parse({
      ...(pathData as Record<string, unknown>),
      traceEvents: slicedTraceEvents
    });

    return pathData as ChromeTraceFileSchema;
  } catch (error) {
    if (error instanceof ZodError) {
      const message = error.issues
        .map(issue => `${issue.message}: ${issue.path.join('.')}`)
        .join('\n');
      throw new Error(message);
    }
    throw error;
  }
}
