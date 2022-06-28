const VIDEO_BUILDER_OPTIONS = {
  width: 512,
  height: 512,
  framerate: 24,
  bitrate: 200,
  realtime: false
};

type VideoBuilderOptions = Partial<typeof VIDEO_BUILDER_OPTIONS>;

function nextMessage(target): Promise<{data: any}> {
  return new Promise((resolve) => {
    target.addEventListener('message', resolve, {once: true});
  });
}

export default class WebMVideoBuilder {
  // TODO: FIX THIS. Otherwise it'll screw up paths
  worker: Worker = new Worker('/modules/video/src/lib/webm-wasm/webm-worker.js');

  static get properties() {
    return {
      id: 'webm',
      name: 'WEBM',
      extensions: ['webm'],
      mimeTypes: ['video/webm'],
      builder: WebMVideoBuilder,
      options: VIDEO_BUILDER_OPTIONS
    };
  }

  /**
   * Asynchronously create the video container.
   */
  async initialize(options: VideoBuilderOptions): Promise<void> {
    const {bitrate, framerate, height, width, realtime} = {...VIDEO_BUILDER_OPTIONS, ...options};

    this.worker.postMessage('./webm-wasm.wasm');
    await nextMessage(this.worker);

    this.worker.postMessage({timebaseDen: framerate, width, height, bitrate, realtime});
  }

  /**
   * Add an image to the video stream. This can be a Uint8Array of RGBA pixels or canvas, webgl, or 2d context.
   */
  addFrame(
    source:
      | Uint8Array
      | HTMLCanvasElement
      | CanvasRenderingContext2D
      | WebGLRenderingContext
      | WebGL2RenderingContext
  ): void {
    let buffer: ArrayBufferLike;

    if (source instanceof HTMLCanvasElement) {
      source = source.getContext('2d')!;
    }

    if (source instanceof Uint8Array) {
      buffer = source.buffer;
    } else if (source instanceof CanvasRenderingContext2D) {
      buffer = source.getImageData(0, 0, source.canvas.width, source.canvas.height).data.buffer;
    } else if (
      source instanceof WebGLRenderingContext ||
      source instanceof WebGL2RenderingContext
    ) {
      const gl = source;
      const {width, height} = gl.canvas;
      const data = new Uint8Array(width * height * 4);
      source.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, data);
      buffer = data.buffer;
    } else {
      throw new Error('Unsupported buffer type');
    }

    this.worker.postMessage(buffer, [buffer]);
  }

  /**
   * Finish creating the video container. Returns a URL to a video blob.
   * */
  async finalize(): Promise<string> {
    this.worker.postMessage(null);

    const webm = (await nextMessage(this.worker)).data;
    const blob = new Blob([webm], {type: 'video/webm'});
    const url = URL.createObjectURL(blob);

    return url;
  }
}
