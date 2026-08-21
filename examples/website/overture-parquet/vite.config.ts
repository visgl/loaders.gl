import fs from 'fs';
import {defineConfig} from 'vite';

/** Resolves loaders.gl packages to local source while developing the example. */
async function getAliases(
  frameworkName: string,
  frameworkRootDirectory: string
): Promise<Record<string, string>> {
  const modules = await fs.promises.readdir(`${frameworkRootDirectory}/modules`);
  const aliases: Record<string, string> = {};
  for (const module of modules) {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDirectory}/modules/${module}/src`;
  }
  return aliases;
}

export default defineConfig(async () => ({
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: await getAliases('@loaders.gl', `${__dirname}/../../..`)
  },
  server: {open: true}
}));
