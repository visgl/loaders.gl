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

## Generated Descriptor Data

Each generated TypeScript file contains one base64 string passed to `fileDesc(...)`. This is a
serialized protobuf **schema descriptor**, not an embedded trace, fixture, executable, or network
payload. It describes the messages and fields from the adjacent readable `.proto` source files so
the standards-compliant protobuf runtime can support binary and protobuf-JSON encoding.

At this pinned version, the four descriptor strings decode to 4,097 bytes in total. The complete
generated TypeScript files are 49,497 bytes, mostly readable type declarations and source
comments. They are marked `linguist-generated` so GitHub collapses them during review; the
canonical `.proto` files remain visible and reviewable. Do not add captured traces or other sample
data to `generated/`.

When updating the protocol version, regenerate all four files together, restore the
`SPDX-License-Identifier: Apache-2.0` header if the generator does not emit it, and run the OTLP
public round-trip tests in both Node and Chromium.
