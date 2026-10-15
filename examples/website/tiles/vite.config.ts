import {defineConfig} from 'vite';
import fs from 'node:fs';
import {fileURLToPath} from 'node:url';

/** Maps workspace packages and parser subpaths to local source during example development. */
const getAliases = async (frameworkName: string, frameworkRootDirectory: string) => {
  const modules = await fs.promises.readdir(`${frameworkRootDirectory}/modules`);
  const aliases: Record<string, string> = {};
  for (const module of modules)
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDirectory}/modules/${module}/src`;
  return aliases;
};

export default defineConfig(async () => ({
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: await getAliases('@loaders.gl', fileURLToPath(new URL('../../..', import.meta.url)))
  },
  build: {
    rollupOptions: {
      input: {
        viewer: fileURLToPath(new URL('./index.html', import.meta.url)),
        authoring: fileURLToPath(new URL('./authoring.html', import.meta.url))
      }
    }
  },
  server: {open: true}
}));
