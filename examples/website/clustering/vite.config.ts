import fs from 'node:fs';
import path from 'node:path';
import {defineConfig} from 'vite';

type ModuleAliases = {
  /** Package-root aliases to local loaders.gl source modules. */
  aliases: Record<string, string>;
  /** Source-file aliases that apply each module's browser entry replacements. */
  browserSourceAliases: Record<string, string>;
};

/** Resolves loaders.gl packages to local source while developing the example. */
async function getAliases(
  frameworkName: string,
  frameworkRootDirectory: string
): Promise<ModuleAliases> {
  const modules = await fs.promises.readdir(`${frameworkRootDirectory}/modules`);
  const aliases: Record<string, string> = {};
  const browserSourceAliases: Record<string, string> = {};
  for (const module of modules) {
    const moduleRoot = `${frameworkRootDirectory}/modules/${module}`;
    aliases[`${frameworkName}/${module}`] = `${moduleRoot}/src`;
    let packageJson: {browser?: Record<string, string | false>};
    try {
      packageJson = JSON.parse(
        await fs.promises.readFile(`${moduleRoot}/package.json`, 'utf8')
      ) as {browser?: Record<string, string | false>};
    } catch {
      continue;
    }
    for (const [source, replacement] of Object.entries(packageJson.browser ?? {})) {
      if (!source.startsWith('./src/') || typeof replacement !== 'string' || !replacement.startsWith('./src/')) {
        continue;
      }
      const sourcePath = path.resolve(moduleRoot, source);
      const replacementPath = path.resolve(moduleRoot, replacement);
      browserSourceAliases[sourcePath] = replacementPath;
      browserSourceAliases[sourcePath.replace(/\.(?:ts|tsx|js|jsx)$/, '')] = replacementPath;
    }
  }
  return {aliases, browserSourceAliases};
}

export default defineConfig(async () => {
  const {aliases, browserSourceAliases} = await getAliases('@loaders.gl', `${__dirname}/../../..`);
  return {
    plugins: [
      {
        name: 'loaders-gl-browser-source-aliases',
        enforce: 'pre' as const,
        /** Resolves relative imports through the matching module browser replacement. */
        resolveId(source: string, importer?: string) {
          if (!source.startsWith('.') || !importer) {
            return null;
          }
          const importerPath = importer.split('?')[0];
          const resolvedPath = path.resolve(path.dirname(importerPath), source);
          return browserSourceAliases[resolvedPath] ?? null;
        }
      }
    ],
    resolve: {
      extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
      alias: aliases
    },
    server: {open: true}
  };
});
