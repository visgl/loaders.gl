import {ChildProcessProxy} from '@loaders.gl/worker-utils';

const MODULE_ROOT = `${__dirname}/../../..`;

/*
 * @see https://github.com/TimvanScherpenzeel/texture-compressor
 */
export async function encodeImageURLToCompressedTextureURL(inputUrl, outputUrl) {
  // prettier-ignore
  const args = [
    // Note: our actual executable is `npx`, so `texture-compressor` is an argument
    'texture-compressor',
    '--type', 's3tc',
    '--compression', 'DXT1',
    '--quality', 'normal',
    '--input', inputUrl,
    '--output', outputUrl
  ];
  const childProcess = new ChildProcessProxy();
  await childProcess.start({
    command: 'npx',
    arguments: args,
    spawn: {
      cwd: MODULE_ROOT
    }
  });
  return outputUrl;
}
