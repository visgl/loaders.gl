#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const TEST_CONTEXT_NAMES = new Set(['t', 'tt']);

/**
 * Converts one or more tape-style test files to native Vitest syntax.
 * This codemod handles the common assertion forms used in loaders.gl test files.
 */
async function main() {
  const filePaths = process.argv.slice(2);

  if (filePaths.length === 0) {
    console.error('Usage: node scripts/convert-tape-to-vitest.mjs <file> [file...]');
    process.exit(1);
  }

  for (const filePath of filePaths) {
    const absolutePath = path.resolve(filePath);
    const sourceText = fs.readFileSync(absolutePath, 'utf8');
    const transformedText = transformTapeToVitest(sourceText, absolutePath);
    fs.writeFileSync(absolutePath, transformedText);
  }
}

/**
 * Rewrites a tape-style test file into native Vitest syntax.
 * @param {string} sourceText
 * @param {string} filePath
 * @returns {string}
 */
function transformTapeToVitest(sourceText, filePath) {
  const scriptKind = getScriptKind(filePath);
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    scriptKind
  );

  const transformer = context => {
    /**
     * Visits a node and rewrites tape-specific syntax.
     * @param {ts.Node} node
     * @returns {ts.VisitResult<ts.Node>}
     */
    function visitNode(node) {
      if (ts.isSourceFile(node)) {
        return ts.factory.updateSourceFile(node, visitStatements(node.statements));
      }

      if (ts.isBlock(node)) {
        return ts.factory.updateBlock(node, visitStatements(node.statements));
      }

      if (ts.isImportDeclaration(node) && isTapeImport(node)) {
        return createVitestImports(node);
      }

      if (ts.isExpressionStatement(node) && isEndCall(node.expression)) {
        return undefined;
      }

      if (ts.isCallExpression(node)) {
        return visitTapeCallExpression(node, context, visitNode);
      }

      return ts.visitEachChild(node, visitNode, context);
    }

    /**
     * Visits child statements and drops removed statements.
     * @param {readonly ts.Statement[]} statements
     * @returns {ts.Statement[]}
     */
    function visitStatements(statements) {
      const nextStatements = [];

      for (const statement of statements) {
        const visitedStatement =
          ts.isImportDeclaration(statement) && isTapeImport(statement)
            ? createVitestImports(statement)
            : ts.visitNode(statement, visitNode);
        if (!visitedStatement) {
          continue;
        }

        if (Array.isArray(visitedStatement)) {
          nextStatements.push(...visitedStatement);
          continue;
        }

        nextStatements.push(visitedStatement);
      }

      return nextStatements;
    }

    return visitNode;
  };

  const transformed = ts.transform(sourceFile, [transformer]);
  const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});
  const printedText = printer.printFile(transformed.transformed[0]);
  transformed.dispose();

  return `${printedText}\n`;
}

/**
 * Returns the TypeScript script kind for a file path.
 * @param {string} filePath
 * @returns {ts.ScriptKind}
 */
function getScriptKind(filePath) {
  if (filePath.endsWith('.ts')) {
    return ts.ScriptKind.TS;
  }

  if (filePath.endsWith('.tsx')) {
    return ts.ScriptKind.TSX;
  }

  if (filePath.endsWith('.mjs')) {
    return ts.ScriptKind.JS;
  }

  return ts.ScriptKind.JS;
}

/**
 * Returns true when an import declaration is a tape compatibility import.
 * @param {ts.ImportDeclaration} node
 * @returns {boolean}
 */
function isTapeImport(node) {
  return (
    ts.isStringLiteral(node.moduleSpecifier) &&
    (node.moduleSpecifier.text === 'tape-promise/tape' ||
      node.moduleSpecifier.text === 'tape' ||
      node.moduleSpecifier.text === 'test/utils/vitest-tape')
  );
}

/**
 * Creates the standard Vitest import used by migrated test files and retains
 * named imports from the local compatibility shim.
 * @param {ts.ImportDeclaration} node
 * @returns {ts.ImportDeclaration | ts.ImportDeclaration[]}
 */
function createVitestImports(node) {
  const vitestImport = ts.factory.createImportDeclaration(
    undefined,
    ts.factory.createImportClause(
      false,
      undefined,
      ts.factory.createNamedImports([
        ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('expect')),
        ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier('test'))
      ])
    ),
    ts.factory.createStringLiteral('vitest'),
    undefined
  );

  if (node.moduleSpecifier.text !== 'test/utils/vitest-tape') {
    return vitestImport;
  }

  const namedBindings = node.importClause?.namedBindings;
  if (!namedBindings) {
    return vitestImport;
  }

  const shimImportClause = ts.factory.createImportClause(false, undefined, namedBindings);
  const shimImport = ts.factory.updateImportDeclaration(
    node,
    node.modifiers,
    shimImportClause,
    node.moduleSpecifier,
    node.attributes
  );

  return [vitestImport, shimImport];
}

/**
 * Removes a tape test context parameter from a registered test callback.
 * @param {ts.ArrowFunction | ts.FunctionExpression | ts.FunctionDeclaration} node
 * @returns {ts.Node}
 */
function removeTestContextParameter(node) {
  if (node.parameters.length !== 1 || !TEST_CONTEXT_NAMES.has(node.parameters[0].name.getText())) {
    return node;
  }

  const parameters = [];

  if (ts.isArrowFunction(node)) {
    return ts.factory.updateArrowFunction(
      node,
      node.modifiers,
      node.typeParameters,
      parameters,
      node.type,
      node.equalsGreaterThanToken,
      node.body
    );
  }

  if (ts.isFunctionExpression(node)) {
    return ts.factory.updateFunctionExpression(
      node,
      node.modifiers,
      node.asteriskToken,
      node.name,
      node.typeParameters,
      parameters,
      node.type,
      node.body
    );
  }

  return ts.factory.updateFunctionDeclaration(
    node,
    node.modifiers,
    node.asteriskToken,
    node.name,
    node.typeParameters,
    parameters,
    node.type,
    node.body
  );
}

/**
 * Returns true when a call registers a test callback with the tape shim.
 * @param {ts.CallExpression} node
 * @returns {boolean}
 */
function isTestRegistrationCall(node) {
  const functionName = getIdentifierText(node.expression);
  return Boolean(functionName && (functionName === 'test' || functionName.startsWith('testIf')));
}

/**
 * Rewrites tape call expressions to Vitest equivalents.
 * @param {ts.CallExpression} node
 * @param {ts.TransformationContext} context
 * @param {(node: ts.Node) => ts.VisitResult<ts.Node>} visitNode
 * @returns {ts.Node}
 */
function visitTapeCallExpression(node, context, visitNode) {
  let visitedNode = ts.visitEachChild(node, visitNode, context);

  if (!ts.isCallExpression(visitedNode)) {
    return visitedNode;
  }

  if (isTestRegistrationCall(visitedNode)) {
    const callbackIndex = visitedNode.arguments.length - 1;
    const callback = visitedNode.arguments[callbackIndex];
    if (callback && (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback))) {
      const updatedCallback = removeTestContextParameter(callback);
      if (updatedCallback !== callback) {
        const argumentsArray = [...visitedNode.arguments];
        argumentsArray[callbackIndex] = updatedCallback;
        visitedNode = ts.factory.updateCallExpression(
          visitedNode,
          visitedNode.expression,
          visitedNode.typeArguments,
          argumentsArray
        );
      }
    }
  }

  if (!ts.isPropertyAccessExpression(visitedNode.expression)) {
    return visitedNode;
  }

  const objectName = getIdentifierText(visitedNode.expression.expression);
  const methodName = visitedNode.expression.name.text;

  if (!objectName || !TEST_CONTEXT_NAMES.has(objectName)) {
    return visitedNode;
  }

  const [firstArg, secondArg, thirdArg] = visitedNode.arguments;

  switch (methodName) {
    case 'comment':
      return ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('console'), 'log'),
        undefined,
        visitedNode.arguments
      );

    case 'plan':
      return ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(ts.factory.createIdentifier('expect'), 'assertions'),
        undefined,
        firstArg ? [firstArg] : []
      );

    case 'equal':
    case 'equals':
    case 'is':
    case 'isEqual':
    case 'strictEqual':
      return createExpectationCall('toBe', firstArg, secondArg, thirdArg);

    case 'notEqual':
      return createNegatedExpectationCall('toBe', firstArg, secondArg, thirdArg);

    case 'deepEqual':
    case 'deepEquals':
    case 'same':
    case 'isEquivalent':
      return createExpectationCall('toEqual', firstArg, secondArg, thirdArg);

    case 'notDeepEqual':
      return createNegatedExpectationCall('toEqual', firstArg, secondArg, thirdArg);

    case 'ok':
      return createMatcherOnlyExpectationCall('toBeTruthy', firstArg, secondArg);

    case 'notOk':
      return createMatcherOnlyExpectationCall('toBeFalsy', firstArg, secondArg);

    case 'true':
      return createExpectationCall('toBe', firstArg, ts.factory.createTrue(), secondArg);

    case 'false':
      return createExpectationCall('toBe', firstArg, ts.factory.createFalse(), secondArg);

    case 'throws':
      return createThrowsExpectationCall(false, firstArg, secondArg, thirdArg);

    case 'doesNotThrow':
      return createThrowsExpectationCall(true, firstArg, secondArg, thirdArg);

    case 'rejects':
      return createRejectsExpectationCall(false, firstArg, secondArg, thirdArg);

    case 'doesNotReject':
      return createRejectsExpectationCall(true, firstArg, secondArg, thirdArg);

    case 'pass':
      return createMatcherOnlyExpectationCall(
        'toBe',
        ts.factory.createTrue(),
        firstArg,
        [ts.factory.createTrue()]
      );

    case 'fail':
      return ts.factory.createImmediatelyInvokedArrowFunction([
        ts.factory.createThrowStatement(
          ts.factory.createNewExpression(ts.factory.createIdentifier('Error'), undefined, [
            firstArg || ts.factory.createStringLiteral('Forced failure')
          ])
        )
      ]);

    default:
      return visitedNode;
  }
}

/**
 * Returns true when an expression is a tape `end()` call.
 * @param {ts.Expression} expression
 * @returns {boolean}
 */
function isEndCall(expression) {
  return (
    ts.isCallExpression(expression) &&
    ts.isPropertyAccessExpression(expression.expression) &&
    TEST_CONTEXT_NAMES.has(getIdentifierText(expression.expression.expression) || '') &&
    expression.expression.name.text === 'end'
  );
}

/**
 * Returns the text for a bare identifier expression.
 * @param {ts.Expression} expression
 * @returns {string | null}
 */
function getIdentifierText(expression) {
  return ts.isIdentifier(expression) ? expression.text : null;
}

/**
 * Creates a positive expect matcher call.
 * @param {string} matcherName
 * @param {ts.Expression | undefined} actualExpression
 * @param {ts.Expression | undefined} expectedExpression
 * @param {ts.Expression | undefined} messageExpression
 * @returns {ts.CallExpression}
 */
function createExpectationCall(matcherName, actualExpression, expectedExpression, messageExpression) {
  const expectCall = createExpectCall(actualExpression, messageExpression);

  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(expectCall, matcherName),
    undefined,
    expectedExpression ? [expectedExpression] : []
  );
}

/**
 * Creates a negated expect matcher call.
 * @param {string} matcherName
 * @param {ts.Expression | undefined} actualExpression
 * @param {ts.Expression | undefined} expectedExpression
 * @param {ts.Expression | undefined} messageExpression
 * @returns {ts.CallExpression}
 */
function createNegatedExpectationCall(
  matcherName,
  actualExpression,
  expectedExpression,
  messageExpression
) {
  const expectCall = createExpectCall(actualExpression, messageExpression);
  const negatedExpectCall = ts.factory.createPropertyAccessExpression(expectCall, 'not');

  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(negatedExpectCall, matcherName),
    undefined,
    expectedExpression ? [expectedExpression] : []
  );
}

/**
 * Creates an expect matcher call that only depends on the actual expression.
 * @param {string} matcherName
 * @param {ts.Expression | undefined} actualExpression
 * @param {ts.Expression | undefined} messageExpression
 * @param {ts.Expression[]} [matcherArguments=[]]
 * @returns {ts.CallExpression}
 */
function createMatcherOnlyExpectationCall(
  matcherName,
  actualExpression,
  messageExpression,
  matcherArguments = []
) {
  const expectCall = createExpectCall(actualExpression, messageExpression);

  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(expectCall, matcherName),
    undefined,
    matcherArguments
  );
}

/**
 * Creates an `expect(...)` call with an optional message.
 * @param {ts.Expression | undefined} actualExpression
 * @param {ts.Expression | undefined} messageExpression
 * @returns {ts.CallExpression}
 */
function createExpectCall(actualExpression, messageExpression) {
  const argumentsArray = [];

  if (actualExpression) {
    argumentsArray.push(actualExpression);
  }

  if (messageExpression) {
    argumentsArray.push(messageExpression);
  }

  return ts.factory.createCallExpression(ts.factory.createIdentifier('expect'), undefined, argumentsArray);
}

/**
 * Creates a throw or does-not-throw expectation call.
 * @param {boolean} negate
 * @param {ts.Expression | undefined} callbackExpression
 * @param {ts.Expression | undefined} expectedOrMessageExpression
 * @param {ts.Expression | undefined} messageExpression
 * @returns {ts.CallExpression}
 */
function createThrowsExpectationCall(
  negate,
  callbackExpression,
  expectedOrMessageExpression,
  messageExpression
) {
  const isMessageOnly = expectedOrMessageExpression && ts.isStringLiteralLike(expectedOrMessageExpression) && !messageExpression;
  const expectCall = createExpectCall(
    callbackExpression,
    isMessageOnly ? expectedOrMessageExpression : messageExpression
  );
  const targetExpression = negate
    ? ts.factory.createPropertyAccessExpression(expectCall, 'not')
    : expectCall;

  return ts.factory.createCallExpression(
    ts.factory.createPropertyAccessExpression(targetExpression, 'toThrow'),
    undefined,
    !isMessageOnly && expectedOrMessageExpression ? [expectedOrMessageExpression] : []
  );
}

/**
 * Creates a promise rejection or resolution expectation call.
 * @param {boolean} resolve
 * @param {ts.Expression | undefined} promiseExpression
 * @param {ts.Expression | undefined} expectedOrMessageExpression
 * @param {ts.Expression | undefined} messageExpression
 * @returns {ts.AwaitExpression}
 */
function createRejectsExpectationCall(
  resolve,
  promiseExpression,
  expectedOrMessageExpression,
  messageExpression
) {
  const resolvedPromiseExpression = unwrapPromiseFactory(promiseExpression);
  const isMessageOnly = expectedOrMessageExpression && ts.isStringLiteralLike(expectedOrMessageExpression) && !messageExpression;
  const expectCall = createExpectCall(
    resolvedPromiseExpression,
    isMessageOnly ? expectedOrMessageExpression : messageExpression
  );
  const chainRoot = ts.factory.createPropertyAccessExpression(
    expectCall,
    resolve ? 'resolves' : 'rejects'
  );

  const matcherCall = expectedOrMessageExpression && !isMessageOnly
    ? ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(chainRoot, 'toThrow'),
        undefined,
        [expectedOrMessageExpression]
      )
    : ts.factory.createCallExpression(
        ts.factory.createPropertyAccessExpression(chainRoot, 'toBeDefined'),
        undefined,
        []
      );

  return ts.factory.createAwaitExpression(matcherCall);
}

/**
 * Unwraps a callback that returns a promise into a direct promise expression.
 * @param {ts.Expression | undefined} expression
 * @returns {ts.Expression | undefined}
 */
function unwrapPromiseFactory(expression) {
  if (!expression) {
    return expression;
  }

  if (
    (ts.isArrowFunction(expression) || ts.isFunctionExpression(expression)) &&
    expression.parameters.length === 0
  ) {
    if (ts.isBlock(expression.body)) {
      const returnStatement = expression.body.statements.find(statement => ts.isReturnStatement(statement));
      if (returnStatement && returnStatement.expression) {
        return returnStatement.expression;
      }
    } else {
      return expression.body;
    }
  }

  return expression;
}

await main();
