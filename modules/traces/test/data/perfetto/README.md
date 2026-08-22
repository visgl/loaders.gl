# Perfetto test fixture

`track-event-tracks.perfetto-trace` is compiled from Perfetto commit
`4b69bf97ccd38b0fb161ccd94c6389887bdf7a04` and its
`test/trace_processor/diff_tests/parser/track_event/track_event_tracks.textproto`
fixture using the official fused `perfetto_trace.proto` schema.

Source: https://github.com/google/perfetto

Perfetto is licensed under the Apache License 2.0.

`interned-event-names.perfetto-trace` is derived from the same commit's
`test/trace_processor/diff_tests/parser/graphics/gpu_api_slice.textproto` fixture. The unrelated
out-of-tree GPU extension fields were removed before compiling with `perfetto_trace.proto`; the
packet sequence, interned event names, timestamps, and TrackEvents are unchanged.
