import fs from 'fs';
import {defineConfig} from 'vite';

/** Create aliases that make the standalone example consume local loaders.gl source modules. */
async function getAliases(
  frameworkName: string,
  frameworkRootDirectory: string
): Promise<Record<string, string>> {
  const moduleNames = await fs.promises.readdir(`${frameworkRootDirectory}/modules`);
  return Object.fromEntries(
    moduleNames.map((moduleName) => [
      `${frameworkName}/${moduleName}`,
      `${frameworkRootDirectory}/modules/${moduleName}/src`
    ])
  );
}

export default defineConfig(async () => ({
  resolve: {
    extensions: ['.ts', '.tsx', '.mjs', '.js', '.jsx', '.json'],
    alias: await getAliases('@loaders.gl', `${__dirname}/../../..`)
  },
  server: {open: true}
}));
