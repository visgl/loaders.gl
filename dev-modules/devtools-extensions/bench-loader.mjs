import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';

const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  const workspaceBenchmarkPath = getWorkspaceBenchmarkPath(specifier);
  if (workspaceBenchmarkPath) {
    return resolveFileWithCandidates(workspaceBenchmarkPath);
  }

  if (isFileLikeSpecifier(specifier)) {
    const parentPath = context.parentURL
      ? fileURLToPath(context.parentURL)
      : path.join(ROOT_DIR, 'test/bench/node.js');
    const candidatePath = path.resolve(path.dirname(parentPath), specifier);
    const resolvedFile = findCandidateFile(candidatePath, specifier);
    if (resolvedFile) {
      return {
        shortCircuit: true,
        url: pathToFileURL(resolvedFile).href
      };
    }
  }

  return nextResolve(specifier, context);
}

function getWorkspaceBenchmarkPath(specifier) {
  if (!specifier.startsWith('@loaders.gl/') || !specifier.includes('/test/')) {
    return null;
  }

  const modulePath = specifier.slice('@loaders.gl/'.length);
  const [moduleName, ...rest] = modulePath.split('/');
  return path.join(ROOT_DIR, 'modules', moduleName, ...rest);
}

function isFileLikeSpecifier(specifier) {
  return specifier.startsWith('.') || specifier.startsWith('/');
}

function resolveFileWithCandidates(basePath) {
  const resolvedFile = findCandidateFile(basePath, basePath);
  if (!resolvedFile) {
    throw new Error(`Unable to resolve benchmark module: ${basePath}`);
  }

  return {
    shortCircuit: true,
    url: pathToFileURL(resolvedFile).href
  };
}

function findCandidateFile(basePath, originalSpecifier) {
  const extension = path.extname(originalSpecifier);
  const hasConcreteExtension = ['.js', '.ts', '.mjs', '.cjs', '.json'].includes(extension);
  const candidates = hasConcreteExtension
    ? [basePath]
    : [
        `${basePath}.js`,
        `${basePath}.ts`,
        `${basePath}.mjs`,
        `${basePath}.cjs`,
        path.join(basePath, 'index.js'),
        path.join(basePath, 'index.ts')
      ];

  if (originalSpecifier.endsWith('.node')) {
    candidates.push(`${basePath}.js`, `${basePath}.ts`);
  }

  return candidates.find(candidate => fs.existsSync(candidate)) || null;
}
