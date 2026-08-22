// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** One typed Jaeger tag or log field. */
export type JaegerTag = {
  key: string;
  type: 'string' | 'bool' | 'int64' | 'float64' | 'binary';
  value: unknown;
};

/** One Jaeger process descriptor. */
export type JaegerProcess = {
  serviceName: string;
  tags?: JaegerTag[];
};

/** One Jaeger span reference. */
export type JaegerSpanReference = {
  refType: 'CHILD_OF' | 'FOLLOWS_FROM' | string;
  traceID: string;
  spanID: string;
};

/** One Jaeger span log. */
export type JaegerLog = {
  timestamp: number;
  fields: JaegerTag[];
};

/** One span in Jaeger JSON interchange data. */
export type JaegerSpan = {
  traceID: string;
  spanID: string;
  operationName: string;
  references?: JaegerSpanReference[];
  flags?: number;
  startTime: number;
  duration: number;
  tags?: JaegerTag[];
  logs?: JaegerLog[];
  processID?: string;
  process?: JaegerProcess;
  warnings?: string[] | null;
};

/** One trace in a Jaeger query response. */
export type JaegerTrace = {
  traceID: string;
  spans: JaegerSpan[];
  processes?: Record<string, JaegerProcess>;
  warnings?: string[] | null;
};

/** Jaeger Query API response envelope. */
export type JaegerQueryResponse = {
  data: JaegerTrace[];
  total?: number;
  limit?: number;
  offset?: number;
  errors?: unknown[] | null;
};
