// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {readFileSync} from 'node:fs';
import path from 'node:path';
import typescript from 'typescript';
import {expect, test} from 'vitest';
import minimumArrowExports from './data/apache-arrow-17-exports.json';

test('type facade supports Apache Arrow 17 without leaking runtime exports', () => {
  const filename = path.resolve('modules/arrow/src/types.ts');
  const sourceFile = typescript.createSourceFile(
    filename,
    readFileSync(filename, 'utf8'),
    typescript.ScriptTarget.Latest,
    true
  );
  const supportedNames = new Set(minimumArrowExports.exports);
  const upstreamExports = sourceFile.statements.filter(
    statement =>
      typescript.isExportDeclaration(statement) &&
      statement.moduleSpecifier &&
      typescript.isStringLiteral(statement.moduleSpecifier) &&
      statement.moduleSpecifier.text === 'apache-arrow'
  );
  expect(upstreamExports.length).toBeGreaterThan(0);
  const unsupportedNames: string[] = [];
  for (const statement of upstreamExports) {
    if (!typescript.isExportDeclaration(statement)) continue;
    expect(statement.isTypeOnly).toBe(true);
    expect(statement.exportClause && typescript.isNamedExports(statement.exportClause)).toBe(true);
    if (!statement.exportClause || !typescript.isNamedExports(statement.exportClause)) continue;
    for (const element of statement.exportClause.elements) {
      const exportedName = element.propertyName?.text ?? element.name.text;
      if (!supportedNames.has(exportedName)) unsupportedNames.push(exportedName);
    }
  }
  expect(unsupportedNames).toEqual([]);
});
