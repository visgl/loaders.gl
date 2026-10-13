// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {parseArgs} from 'node:util';
import {readFeatureSchema} from './node-feature-schema.js';
import {TileConversionError} from '@loaders.gl/tile-converter/v5/core';
import {createNodeTilesetConversionSource, NODE_TILESET_LIMITS} from './node-source.js';
import type {NodeTileConversionOutputFormat} from './node-conversion.js';

/** Text destinations supplied by the process wrapper or a hermetic caller. */
export interface TileConverterCLIOutput {
  /** Writes a complete JSON result or help text. */
  readonly stdout: (text: string) => void;
  /** Writes a JSON error without contaminating stdout. */
  readonly stderr: (text: string) => void;
}

/** Usage for bounded metadata inspection and selected static mesh conversion. */
const HELP = `Usage: tile-converter-v5 inspect|convert|validate <input path or URL> [options]

  --input-format 3d-tiles|3tz|i3s|slpk  Explicit input format (default: 3d-tiles)
  --geometric-error N        Required source error in meters for I3S to 3D Tiles
  --integrated-mesh-policy as-3d-object  Authorize I3S layer-type change
  --preserve-hierarchy        Retain a complete explicit 3D Tiles tree (3D Tiles/3TZ only)
  --feature-schema PATH       Local JSON feature class/schema mapping (at most 64 KiB)
  --resource ID               Selected content placement; repeat for multiple selections
  --output-format 3d-tiles|3tz|slpk  Target profile (default: 3tz)
  --output PATH               New destination (required for convert, forbidden for validate)
  --max-input-bytes N          Lower the 16 MiB input/read budget
  --max-resources N            Lower the 1,000 content-declaration limit
  --max-documents N            Lower the 32 metadata-document limit
  --max-output-bytes N         Lower the 32 MiB output/archive budget
  --help                      Show this help

Inspect reads metadata only, following declared .json external tilesets.
Convert/validate require explicit selections; I3S uses declared CRS and shared spatial preparation.
Validate decodes, converts and packages the selected target profile without writing files.
Output defaults to a partial flat mesh collection. --preserve-hierarchy requires every declared content.
Remote archives require HTTP 206 ranges and a stable ETag or Last-Modified validator.
I3S inspect lists leaf nodes; feature-bearing conversion requires --feature-schema.
Hierarchy mode supports at most 32 document placements, 256 tiles and one mesh per content, including ordered 1.1 contents arrays.
`;

/** Runs a bounded v5 operation, returning an exit code after source/output cleanup. */
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
        'preserve-hierarchy': {type: 'boolean'},
        'input-format': {type: 'string', default: '3d-tiles'},
        'max-input-bytes': {type: 'string', default: String(NODE_TILESET_LIMITS.maxInputBytes)},
        'max-resources': {type: 'string', default: String(NODE_TILESET_LIMITS.maxInputResources)},
        'max-documents': {type: 'string', default: String(NODE_TILESET_LIMITS.maxTilesetDocuments)},
        'max-output-bytes': {type: 'string', default: String(32 * 1024 * 1024)},
        'output-format': {type: 'string', default: '3tz'},
        output: {type: 'string'},
        resource: {type: 'string', multiple: true},
        'feature-schema': {type: 'string'},
        'geometric-error': {type: 'string'},
        'integrated-mesh-policy': {type: 'string'}
      }
    });
    if (values.help || !argumentsList.length) {
      output.stdout(HELP);
      return 0;
    }
    if (
      positionals.length !== 2 ||
      !['inspect', 'convert', 'validate'].includes(positionals[0]) ||
      !['3d-tiles', '3tz', 'i3s', 'slpk'].includes(values['input-format'])
    )
      throw new TileConversionError(
        'CLI_USAGE_ERROR',
        'Use inspect, convert or validate with one input and --input-format 3d-tiles, 3tz, i3s or slpk'
      );
    const format = values['input-format'] as '3d-tiles' | '3tz' | 'i3s' | 'slpk';
    const operation = positionals[0];
    const sourceOptions = {
      input: positionals[1],
      format,
      signal,
      maxInputBytes: parseLimit(values['max-input-bytes']),
      maxInputResources: parseLimit(values['max-resources']),
      maxTilesetDocuments: parseLimit(values['max-documents']),
      inspectNestedTilesets: true
    };
    if (operation !== 'inspect') {
      if (
        !values.resource?.length ||
        !['3d-tiles', '3tz', 'slpk'].includes(values['output-format']) ||
        (operation === 'convert' ? !values.output : values.output !== undefined)
      )
        throw new TileConversionError(
          'CLI_USAGE_ERROR',
          'Convert/validate require --resource selections and a supported --output-format; only convert requires --output'
        );
      if (
        values['integrated-mesh-policy'] !== undefined &&
        values['integrated-mesh-policy'] !== 'as-3d-object'
      )
        throw new TileConversionError(
          'CLI_USAGE_ERROR',
          'Use --integrated-mesh-policy as-3d-object'
        );
      const features =
        values['feature-schema'] === undefined
          ? undefined
          : await readFeatureSchema(
              values['feature-schema'],
              format === 'i3s' || format === 'slpk',
              signal
            );
      const {convertNodeTileset} = await import('./node-conversion.js');
      const report = await convertNodeTileset({
        ...sourceOptions,
        ...features,
        resourceIds: values.resource,
        preserveHierarchy: values['preserve-hierarchy'],
        outputFormat: values['output-format'] as NodeTileConversionOutputFormat,
        output: values.output,
        maxOutputBytes: parseLimit(values['max-output-bytes']),
        geometricError:
          values['geometric-error'] === undefined
            ? undefined
            : parseGeometricError(values['geometric-error']),
        integratedMeshPolicy: values['integrated-mesh-policy'] as 'as-3d-object' | undefined
      });
      output.stdout(
        `${JSON.stringify({operation, input: positionals[1], inputFormat: format, outputFormat: values['output-format'], ...(values.output ? {output: values.output} : {}), report}, null, 2)}\n`
      );
      return 0;
    }
    if (
      values['feature-schema'] !== undefined ||
      values['preserve-hierarchy'] !== undefined ||
      values['geometric-error'] !== undefined ||
      values['integrated-mesh-policy'] !== undefined ||
      values.resource ||
      values.output ||
      values['output-format'] !== '3tz' ||
      values['max-output-bytes'] !== String(32 * 1024 * 1024)
    )
      throw new TileConversionError(
        'CLI_USAGE_ERROR',
        'Inspect does not accept conversion/output options'
      );
    const source =
      format === 'i3s' || format === 'slpk'
        ? await (await import('./node-i3s-source.js')).createNodeI3SConversionSource({
            ...sourceOptions,
            format
          })
        : await createNodeTilesetConversionSource({...sourceOptions, format});
    const inspection = await source.inspect(signal).finally(() => source.close());
    output.stdout(
      `${JSON.stringify({operation: 'inspect', input: positionals[1], inputFormat: format, ...inspection}, null, 2)}\n`
    );
    return 0;
  } catch (error) {
    output.stderr(
      `${JSON.stringify({
        code: error instanceof Error && 'code' in error ? error.code : 'CONVERSION_FAILED',
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

/** Parses an explicit metric source error without inferring I3S screen-size semantics. */
function parseGeometricError(value: string): number {
  if (!/^(?:\d+(?:\.\d+)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value) || !Number.isFinite(Number(value)))
    throw new TileConversionError(
      'CLI_USAGE_ERROR',
      'Geometric error must be a finite nonnegative number in meters'
    );
  return Number(value);
}
