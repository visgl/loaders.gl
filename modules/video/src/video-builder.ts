import Worker from 'webm-wasm/dist/webm-worker';

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
  worker: Worker;

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
    const worker = new Worker();
    options = {...VIDEO_BUILDER_OPTIONS, ...options};
    debugger;

    worker.postMessage(
      require.resolve('web-wasm/dist/web-wasm.wasm')
      // import.meta.url
      // 'https://unpkg.com/webm-wasm@0.4.1/dist/webm-wasm.wasm'
    );
    await nextEvent(worker, 'message');

    const {bitrate, framerate, height, width, realtime} = options;

    worker.postMessage({timebaseDen: framerate, width, height, bitrate, realtime});

    this.worker = worker;
  }

  async addFrame(buffer): Promise<void> {
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
