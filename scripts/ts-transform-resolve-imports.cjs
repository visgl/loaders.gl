// loaders.gl
// SPDX-License-Identifier: MIT
// SPDX-FileCopyrightText: Copyright (c) vis.gl contributors

const path = require('node:path');
const appendExtension = require('@vis.gl/ts-plugins/ts-transform-append-extension').default;

/** Resolve directory imports before the shared extension transform emits native ESM paths. */
module.exports = function resolveImports(program, configuration, extras) {
  const {ts} = extras;
  const append = appendExtension(program, configuration, extras);
  return context => {
    const appendToSource = append(context);
    return sourceFile => {
      /** Preserve file precedence and resolve directories using TypeScript's own resolver. */
      function resolveSpecifier(specifier) {
        if (!ts.isStringLiteral(specifier) || !/^\.\.?(?:\/|$)/.test(specifier.text)) {
          return specifier;
        }
        const resolution = ts.resolveModuleName(
          specifier.text,
          sourceFile.fileName,
          program.getCompilerOptions(),
          ts.sys
        ).resolvedModule;
        if (resolution && /[/\\]index\.(?:d\.)?(?:ts|tsx)$/.test(resolution.resolvedFileName)) {
          const relativePath = path.relative(path.dirname(sourceFile.fileName), resolution.resolvedFileName)
            .replaceAll(path.sep, '/')
            .replace(/(?:\.d)?\.(?:ts|tsx)$/, '');
          return context.factory.createStringLiteral(relativePath.startsWith('.') ? relativePath : `./${relativePath}`);
        }
        return specifier;
      }
      /** Rewrite only module specifiers, leaving ordinary strings untouched. */
      function visit(node) {
        const factory = context.factory;
        if (ts.isImportTypeNode(node) && ts.isLiteralTypeNode(node.argument)) {
          const specifier = resolveSpecifier(node.argument.literal);
          if (
            ts.isStringLiteral(specifier) &&
            /^\.\.?(?:\/|$)/.test(specifier.text) &&
            !path.extname(specifier.text)
          ) {
            const argument = factory.updateLiteralTypeNode(
              node.argument,
              factory.createStringLiteral(`${specifier.text}.js`)
            );
            node = factory.updateImportTypeNode(
              node, argument, node.attributes, node.qualifier, node.typeArguments, node.isTypeOf
            );
          }
        }
        if (ts.isImportDeclaration(node)) {
          return factory.updateImportDeclaration(node, node.modifiers, node.importClause,
            resolveSpecifier(node.moduleSpecifier), node.attributes);
        }
        if (ts.isExportDeclaration(node) && node.moduleSpecifier) {
          return factory.updateExportDeclaration(node, node.modifiers, node.isTypeOnly,
            node.exportClause, resolveSpecifier(node.moduleSpecifier), node.attributes);
        }
        if (ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.ImportKeyword && node.arguments.length) {
          return factory.updateCallExpression(node, node.expression, node.typeArguments,
            [resolveSpecifier(node.arguments[0]), ...node.arguments.slice(1)]);
        }
        return ts.visitEachChild(node, visit, context);
      }
      return appendToSource(ts.visitNode(sourceFile, visit));
    };
  };
};
