<!-- SPDX-License-Identifier: Apache-2.0 -->

# OpenTelemetry Protocol Schemas

This directory contains the trace-related protocol definitions required by the OTLP loaders and
writers. The source files are pinned to the OpenTelemetry Protocol v1.11.0 release:

- `opentelemetry/proto/common/v1/common.proto`
- `opentelemetry/proto/resource/v1/resource.proto`
- `opentelemetry/proto/trace/v1/trace.proto`
- `opentelemetry/proto/collector/trace/v1/trace_service.proto`

The TypeScript files under `generated/` are produced from the source files with
`@bufbuild/protoc-gen-es` v2.14.0. Source and generated schema files retain the upstream
Apache-2.0 license. The surrounding loaders.gl adapters are MIT licensed.

When updating the protocol version, regenerate all four files together, restore the
`SPDX-License-Identifier: Apache-2.0` header if the generator does not emit it, and run the OTLP
public round-trip tests in both Node and Chromium.
