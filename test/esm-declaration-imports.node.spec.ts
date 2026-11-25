// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

import {mkdtempSync, mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {createRequire} from 'node:module';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import ts from 'typescript';
import {expect, test} from 'vitest';

const require = createRequire(import.meta.url);
const resolveImports = require('../scripts/ts-transform-resolve-imports.cjs');

test('declaration emit uses NodeNext paths for explicit and inferred import types', () => {
  const root = mkdtempSync(join(tmpdir(), 'loaders-gl-declarations-'));
  try {
    mkdirSync(join(root, 'nested'));
    writeFileSync(join(root, 'package.json'), '{"type":"module"}');
    writeFileSync(join(root, 'field.ts'), 'export interface Field { value: number }');
    writeFileSync(join(root, 'index.ts'), 'export interface Options { enabled: boolean }');
    writeFileSync(
      join(root, 'nested', 'entry.ts'),
      "export type A = import('..').Options;\n" +
        "export type B = import('../field').Field;\n" +
        "export type C = import('../field.js').Field;\n" +
        "export const field = {} as import('../field').Field;\n"
    );
    const entry = join(root, 'nested', 'entry.ts');
    const outDir = join(root, 'dist');
    const program = ts.createProgram([entry], {
      types: [],
      module: ts.ModuleKind.ESNext,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
      rootDir: root,
      outDir,
      declaration: true,
      emitDeclarationOnly: true
    });
    const result = program.emit(undefined, undefined, undefined, true, {
      afterDeclarations: [resolveImports(program, {extensions: ['.js']}, {ts})]
    });
    expect(result.emitSkipped).toBe(false);

    const consumer = ts.createProgram([join(outDir, 'nested', 'entry.d.ts')], {
      types: [],
      module: ts.ModuleKind.NodeNext,
      strict: true,
      noEmit: true
    });
    expect(
      ts
        .getPreEmitDiagnostics(consumer)
        .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    ).toEqual([]);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});

test('emitted Parquet package exports typecheck for a strict NodeNext consumer', () => {
  const root = mkdtempSync(join(process.cwd(), '.parquet-declarations-'));
  try {
    const entry = join(root, 'consumer.mts');
    writeFileSync(
      entry,
      "export {ParquetLoader as Metadata} from '@loaders.gl/tables/parquet';\n" +
        "export {ParquetLoader, ParquetLoaderWithParser} from '@loaders.gl/tables/parquet/bundled';\n"
    );
    const consumer = ts.createProgram([entry], {
      types: [],
      module: ts.ModuleKind.NodeNext,
      strict: true,
      noEmit: true
    });
    expect(
      ts
        .getPreEmitDiagnostics(consumer)
        .map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))
    ).toEqual([]);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
});
