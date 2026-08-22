<!-- SPDX-License-Identifier: MIT -->

# Trace Test Data

## `otlp/trace.json`

The OTLP trace example is copied verbatim from the OpenTelemetry Protocol v1.11.0 release:

https://github.com/open-telemetry/opentelemetry-proto/blob/v1.11.0/examples/trace.json

Copyright The OpenTelemetry Authors. Licensed under Apache-2.0. The JSON file cannot contain an
inline SPDX comment without ceasing to be valid JSON; this README records its provenance and
license.

## `jaeger/trace.json`

The Jaeger span-array fixture is copied verbatim from the Jaeger repository at revision
`9f2a7cbfbe4c9b2637ad0cbd54ff7853d00d6bac`:

https://github.com/jaegertracing/jaeger/blob/9f2a7cbfbe4c9b2637ad0cbd54ff7853d00d6bac/cmd/anonymizer/app/uiconv/fixtures/trace_success.json

Copyright The Jaeger Authors. Licensed under Apache-2.0. The JSON file cannot contain an inline
SPDX comment without ceasing to be valid JSON; this README records its provenance and license.

## `zipkin/trace.json`

The Zipkin v2 span fixture is adapted from the canonical Span example in the OpenZipkin v2 API
schema at revision `d0a8d31be170da7759945b26c110c3a0d8d927bd`:

https://github.com/openzipkin/zipkin-api/blob/d0a8d31be170da7759945b26c110c3a0d8d927bd/zipkin2-api.yaml

The adaptation adds one annotation to exercise that standard field. Copyright The OpenZipkin
Authors. Licensed under Apache-2.0. The JSON file cannot contain an inline SPDX comment without
ceasing to be valid JSON; this README records its provenance, transformation, and license.
