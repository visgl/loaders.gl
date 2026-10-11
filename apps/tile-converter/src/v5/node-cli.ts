// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseArgs} from 'node:util';
import {inspectTileset, TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import {createNodeTilesetConversionSource, NODE_TILESET_LIMITS} from './node-source.js';

/** Text destinations supplied by the process wrapper or a hermetic caller. */
export interface TileConverterCLIOutput {
  /** Writes a complete JSON result or help text. */
  readonly stdout: (text: string) => void;
  /** Writes a JSON error without contaminating stdout. */
  readonly stderr: (text: string) => void;
}

/** Usage for the first metadata-only v5 CLI profile. */
const HELP = `Usage: tile-converter-v5 inspect <tileset.json path or URL | local 3TZ> [options]

  --input-format 3d-tiles|3tz  Explicit format (default: 3d-tiles)
  --max-input-bytes N          Lower the 16 MiB input/read budget
  --max-resources N            Lower the 1,000 content-placement limit
  --help                      Show this help

Outputs JSON metadata and ordered resource declarations; does not load tile content.
I3S, remote archives, conversion and full-content validation are separate profiles.
`;

/** Runs one v5 inspection, returning an exit code and closing the source on every path. */
export async function runTileConverterCLI(
  argumentsList: string[],
  output: TileConverterCLIOutput,
  signal?: AbortSignal
): Promise<number> {
  try {
    const {values, positionals} = parseArgs({
      args: argumentsList,
      allowPositionals: true,
      options: {
        help: {type: 'boolean'},
        'input-format': {type: 'string', default: '3d-tiles'},
        'max-input-bytes': {type: 'string', default: String(NODE_TILESET_LIMITS.maxInputBytes)},
        'max-resources': {type: 'string', default: String(NODE_TILESET_LIMITS.maxInputResources)}
      }
    });
    if (values.help || !argumentsList.length) {
      output.stdout(HELP);
      return 0;
    }
    if (
      positionals.length !== 2 ||
      positionals[0] !== 'inspect' ||
      !['3d-tiles', '3tz'].includes(values['input-format'])
    )
      throw new TileConversionError(
        'CLI_USAGE_ERROR',
        'Use inspect with one input and --input-format 3d-tiles or 3tz'
      );
    const format = values['input-format'] as '3d-tiles' | '3tz';
    const source = await createNodeTilesetConversionSource({
      input: positionals[1],
      format,
      signal,
      maxInputBytes: parseLimit(values['max-input-bytes']),
      maxInputResources: parseLimit(values['max-resources'])
    });
    const inspection = await inspectTileset(source, signal).finally(() => source.close());
    output.stdout(
      `${JSON.stringify({operation: 'inspect', input: positionals[1], inputFormat: format, ...inspection}, null, 2)}\n`
    );
    return 0;
  } catch (error) {
    output.stderr(
      `${JSON.stringify({
        code: error instanceof Error && 'code' in error ? error.code : 'INSPECTION_FAILED',
        message: error instanceof Error ? error.message : String(error),
        diagnostics: error instanceof TileConversionError ? error.diagnostics : []
      })}\n`
    );
    return 1;
  }
}

/** Parses a positive decimal byte/count limit without accepting fractional or infinite values. */
function parseLimit(value: string): number {
  if (!/^[1-9]\d*$/.test(value) || !Number.isSafeInteger(Number(value)))
    throw new TileConversionError(
      'CLI_USAGE_ERROR',
      'Limits must be positive safe decimal integers'
    );
  return Number(value);
}
