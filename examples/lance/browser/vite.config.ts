import {defineConfig} from 'vite';
import fs from 'fs';
import path from 'path';
import {fileURLToPath} from 'url';

const directoryName = path.dirname(fileURLToPath(import.meta.url));

async function getAliases(): Promise<Record<string, string>> {
  const repositoryRoot = path.resolve(directoryName, '../../..');
  const modules = await fs.promises.readdir(path.join(repositoryRoot, 'modules'));
  return Object.fromEntries(
    modules.map(moduleName => [`@loaders.gl/${moduleName}`, path.join(repositoryRoot, 'modules', moduleName, 'src')])
  );
}

export default defineConfig(async () => ({
  root: directoryName,
  resolve: {alias: await getAliases()},
  server: {host: '127.0.0.1', port: 5173}
}));
