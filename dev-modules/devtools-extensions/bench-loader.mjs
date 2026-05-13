import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {transformSync} from 'esbuild';

const ROOT_DIR = fileURLToPath(new URL('../..', import.meta.url));

export async function resolve(specifier, context, nextResolve) {
  const workspaceBenchmarkPath = getWorkspaceBenchmarkPath(specifier);
  if (workspaceBenchmarkPath) {
    return resolveFileWithCandidates(workspaceBenchmarkPath);
  }

  const workspaceSourcePath = getWorkspaceSourcePath(specifier);
  if (workspaceSourcePath) {
    return resolveFileWithCandidates(workspaceSourcePath);
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

export async function load(url, context, nextLoad) {
  if (url.startsWith('file:') && url.endsWith('.ts')) {
    const filePath = fileURLToPath(url);
    if (filePath.startsWith(ROOT_DIR)) {
      const source = await fs.promises.readFile(filePath, 'utf8');
      const result = transformSync(source, {
        format: 'esm',
        loader: 'ts',
        sourcemap: 'inline',
        sourcefile: filePath,
        target: 'node20'
      });

      return {
        format: 'module',
        shortCircuit: true,
        source: result.code
      };
    }
  }

  return nextLoad(url, context);
}

function getWorkspaceBenchmarkPath(specifier) {
  if (!specifier.startsWith('@loaders.gl/') || !specifier.includes('/test/')) {
    return null;
  }

  const modulePath = specifier.slice('@loaders.gl/'.length);
  const [moduleName, ...rest] = modulePath.split('/');
  return path.join(ROOT_DIR, 'modules', moduleName, ...rest);
}

function getWorkspaceSourcePath(specifier) {
  if (!specifier.startsWith('@loaders.gl/') || specifier.includes('/test/')) {
    return null;
  }

  const modulePath = specifier.slice('@loaders.gl/'.length);
  const [moduleName, ...rest] = modulePath.split('/');
  const moduleDirectory = path.join(ROOT_DIR, 'modules', moduleName);

  if (!fs.existsSync(moduleDirectory)) {
    return null;
  }

  return path.join(moduleDirectory, 'src', ...rest);
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
