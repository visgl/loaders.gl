import webmWasm from 'webm-wasm/dist/webm-wasm';

const VIDEO_BUILDER_OPTIONS = {
  width: 512,
  height: 512,
  framerate: 24,
  bitrate: 200,
  realtime: false
};

type VideoBuilderOptions = Partial<typeof VIDEO_BUILDER_OPTIONS>;

export default class VideoBuilder {
  encoder: webmWasm;
  url: Promise<string>;

  static get properties() {
    return {
      id: 'webm',
      name: 'WEBM',
      extensions: ['webm'],
      mimeTypes: ['video/webm'],
      builder: VideoBuilder,
      options: VIDEO_BUILDER_OPTIONS
    };
  }

  async initialize(options: VideoBuilderOptions): Promise<void> {
    const {WebmEncoder} = await new Promise((resolve) => {
      const module = webmWasm({
        // Just to be safe, don't automatically invoke any wasm functions
        noInitialRun: true,
        locateFile(url) {
          if (url.endsWith('.wasm')) {
            return './node_modules/webm-wasm/dist/webm-wasm.wasm';
            // return 'https://unpkg.com/webm-wasm@0.4.1/dist/webm-wasm.wasm';
            // return wasmUrl;
          }
          return url;
        },
        onRuntimeInitialized() {
          // An Emscripten is a then-able that resolves with itself, causing an infite loop when you
          // wrap it in a real promise. Delete the `then` prop solves this for now.
          // https://github.com/kripken/emscripten/issues/5820
          delete module.then;
          resolve(module);
        }
      });
    });

    const {bitrate, framerate, height, width, realtime} = {...VIDEO_BUILDER_OPTIONS, ...options};

    const numerator = 1;
    const kLive = realtime;

    let resolve;
    this.url = new Promise((res) => {
      resolve = res;
    });
    const onFinished = (chunk) => {
      debugger;
      const blob = new Blob([chunk], {type: 'video/webm'});
      const url = URL.createObjectURL(blob);
      resolve(url);
    };

    this.encoder = new WebmEncoder(
      numerator,
      framerate,
      width,
      height,
      bitrate,
      realtime,
      kLive,
      onFinished
    );
  }

  async addFrame(buffer): Promise<void> {
    this.encoder.addRGBAFrame(buffer);
  }

  async finalize(): Promise<string> {
    this.encoder.finalize();
    this.encoder.delete();

    return await this.url;
  }
}
