import commonjs from '@rollup/plugin-commonjs';
import {nodeResolve} from '@rollup/plugin-node-resolve';

export default {
  input: 'src/module.mjs',
  output: [
    {
      file: 'dist/module.mjs',
      format: 'es'
    }
  ],
  plugins: [commonjs(), nodeResolve()]
};
