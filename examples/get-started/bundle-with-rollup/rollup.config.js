import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import alias from '@rollup/plugin-alias';
import typescript from '@rollup/plugin-typescript';
import fs from 'fs';

/** Run against local source */
const getAliases = async (frameworkName, frameworkRootDir) => {
  const modules = await fs.promises.readdir(`${frameworkRootDir}/modules`)
  const aliases = {}
  modules.forEach(module => {
    aliases[`${frameworkName}/${module}`] = `${frameworkRootDir}/modules/${module}/src`;
  })
  console.log(aliases);
  return aliases
}

export default async () => ({
  input: 'app.js',
  output: {
    file: 'dist/bundle.js',
    format: 'iife', // immediately-invoked function expression — suitable for <script> tags
    sourcemap: true
  },
  plugins: [
    typescript(),
    alias({
      entries: {} // await getAliases('@loaders.gl', `${__dirname}/../../..`)
    }),
    resolve({
      browser: true,
      preferBuiltins: false
    }),
    commonjs()
  ]
});
