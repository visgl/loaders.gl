import {ChildProcessProxy} from '@loaders.gl/worker-utils';

/*
 * @see https://github.com/TimvanScherpenzeel/texture-compressor
 */
export async function encodeImageURLToCompressedTextureURL(
  inputUrl: string,
  outputUrl: string,
  options?: {cwd?: string}
): Promise<string> {
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
    spawn: options
  });
  return outputUrl;
}
