const VIDEO_BUILDER_OPTIONS = {
  width: 512,
  height: 512,
  framerate: 24,
  bitrate: 200,
  realtime: false
};

type VideoBuilderOptions = Partial<typeof VIDEO_BUILDER_OPTIONS>;

function nextEvent(target, name): Promise<{data: any}> {
  return new Promise((resolve) => {
    target.addEventListener(name, resolve, {once: true});
  });
}

export default class VideoBuilder {
  worker: Worker = new Worker('node_modules/webm-wasm/dist/webm-worker.js');

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
    const {bitrate, framerate, height, width, realtime} = {...VIDEO_BUILDER_OPTIONS, ...options};

    this.worker.postMessage('./webm-wasm.wasm');
    await nextEvent(this.worker, 'message');

    this.worker.postMessage({timebaseDen: framerate, width, height, bitrate, realtime});
  }

  addFrame(source): void {
    let buffer = source;

    if (Buffer.isBuffer(source)) {
      buffer = source;
    } else if (source instanceof ImageData) {
      buffer = source.data;
    } else if (source instanceof HTMLCanvasElement) {
      buffer = source.getContext('2d')!.getImageData(0, 0, source.width, source.height).data;
    } else if (source instanceof CanvasRenderingContext2D) {
      buffer = source.getImageData(0, 0, source.canvas.width, source.canvas.height).data;
    } else if (
      source instanceof WebGLRenderingContext ||
      source instanceof WebGL2RenderingContext
    ) {
      const gl = source;
      // const {width, height} = gl.canvas;
      const [, , width, height] = gl.getParameter(gl.VIEWPORT);
      const data = new Uint8Array(width * height * 4);
      source.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      buffer = data.buffer;
    }

    this.worker.postMessage(buffer, [buffer]);
  }

  async finalize(): Promise<string> {
    this.worker.postMessage(null);

    const webm = (await nextEvent(this.worker, 'message')).data;
    const blob = new Blob([webm], {type: 'video/webm'});
    const url = URL.createObjectURL(blob);

    return url;
  }
}
