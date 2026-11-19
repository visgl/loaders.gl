// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {existsSync, readdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, extname, join, relative, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import ts from 'typescript';

/** Directory containing emitted types from the legacy v4 converter. */
const declarationsDirectory = fileURLToPath(new URL('../dist/v4/', import.meta.url));

/** Give legacy extensionless relative imports the suffix required by NodeNext consumers. */
function fixDeclarationImports(directory) {
  for (const entry of readdirSync(directory, {withFileTypes: true})) {
    /** Absolute path to the current declaration or directory. */
    const filename = join(directory, entry.name);
    if (entry.isDirectory()) {
      fixDeclarationImports(filename);
    } else if (entry.name.endsWith('.d.ts')) {
      fixDeclarationFile(filename);
    }
  }
}

/** Rewrites actual module references without changing comments or legacy source files. */
function fixDeclarationFile(filename) {
  /** Emitted TypeScript declarations and their module reference positions. */
  const declarations = readFileSync(filename, 'utf8');
  const source = ts.createSourceFile(filename, declarations, ts.ScriptTarget.Latest);
  const replacements = [];
  collectModuleSpecifiers(source);
  /** Apply replacements from the end of the file to preserve preceding offsets. */
  let rewritten = declarations;
  for (const {start, end, specifier} of replacements.reverse()) {
    rewritten = rewritten.slice(0, start) + specifier + rewritten.slice(end);
  }
  if (rewritten !== declarations) {
    writeFileSync(filename, rewritten);
  }

  /** Visits static imports, re-exports and inline import types. */
  function collectModuleSpecifiers(node) {
    const reference =
      ts.isImportDeclaration(node) || ts.isExportDeclaration(node)
        ? node.moduleSpecifier
        : ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)
          ? node.argument.literal
          : undefined;
    if (reference && ts.isStringLiteral(reference) && /^\.{1,2}\//.test(reference.text)) {
      const specifier = qualifyDeclarationSpecifier(filename, reference.text);
      if (specifier !== reference.text) {
        replacements.push({
          start: reference.getStart(source) + 1,
          end: reference.getEnd() - 1,
          specifier
        });
      }
    }
    ts.forEachChild(node, collectModuleSpecifiers);
  }
}

/** Resolves TypeScript file and directory imports against the emitted declaration tree. */
function qualifyDeclarationSpecifier(filename, specifier) {
  if (extname(specifier)) {
    return specifier;
  }
  const target = resolve(dirname(filename), specifier);
  if (existsSync(`${target}.d.ts`)) {
    return `${specifier}.js`;
  }
  if (existsSync(join(target, 'index.d.ts'))) {
    return `${specifier}/index.js`;
  }
  throw new Error(`Unresolved v4 declaration ${specifier} in ${relative(declarationsDirectory, filename)}`);
}

fixDeclarationImports(declarationsDirectory);
