// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** A local or remote Zipkin network endpoint. */
export type ZipkinEndpoint = {
  serviceName?: string;
  ipv4?: string;
  ipv6?: string;
  port?: number;
};

/** A timestamped Zipkin span annotation. */
export type ZipkinAnnotation = {
  timestamp: number | string;
  value: string;
};

/** One Zipkin v2 JSON span. */
export type ZipkinSpan = {
  traceId: string;
  id: string;
  parentId?: string;
  name?: string;
  kind?: 'CLIENT' | 'SERVER' | 'PRODUCER' | 'CONSUMER';
  timestamp?: number | string;
  duration?: number | string;
  localEndpoint?: ZipkinEndpoint;
  remoteEndpoint?: ZipkinEndpoint;
  annotations?: ZipkinAnnotation[];
  tags?: Record<string, string>;
  debug?: boolean;
  shared?: boolean;
};
