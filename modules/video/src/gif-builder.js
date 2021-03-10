// A GIFBuilder based on the gifshot module
import {assert} from './lib/utils/assert';
import gifshot from './libs/gifshot'; // TODO - load dynamically to avoid bloating

// These are gifshot module options
const GIF_BUILDER_OPTIONS = {
  source: 'images',
  width: 200, // Desired width of the image
  height: 200, // Desired height of the image

  crossOrigin: 'Anonymous', // Options are 'Anonymous', 'use-credentials', or a falsy value to not set a CORS attribute.

  // CALLBACKS
  progressCallback: captureProgress => {}, // Callback that provides the current progress of the current image
  completeCallback: () => {}, // Callback function that is called when the current image is completed

  // QUALITY SETTINGS
  numWorkers: 2, // how many web workers to use to process the animated GIF frames. Default is 2.
  sampleInterval: 10, // pixels to skip when creating the palette. Default is 10. Less is better, but slower.
  interval: 0.1, // The amount of time (in seconds) to wait between each frame capture
  offset: null, // The amount of time (in seconds) to start capturing the GIF (only for HTML5 videos)
  numFrames: 10, // The number of frames to use to create the animated GIF. Note: Each frame is captured every 100 milliseconds of a video and every ms for existing images
  frameDuration: 1, // The amount of time (10 = 1s) to stay on each frame

  // CSS FILTER OPTIONS
  filter: '', // CSS filter that will be applied to the image (eg. blur(5px))

  // WATERMARK OPTIONS
  waterMark: null, // If an image is given here, it will be stamped on top of the GIF frames
  waterMarkHeight: null, // Height of the waterMark
  waterMarkWidth: null, // Height of the waterMark
  waterMarkXCoordinate: 1, // The X (horizontal) Coordinate of the watermark image
  waterMarkYCoordinate: 1, // The Y (vertical) Coordinate of the watermark image

  // TEXT OPTIONS
  text: '', // The text that covers the animated GIF
  showFrameText: true, // If frame-specific text is supplied with the image array, you can force to not be displayed
  fontWeight: 'normal', // The font weight of the text that covers the animated GIF
  fontSize: '16px', // The font size of the text that covers the animated GIF
  minFontSize: '10px', // The minimum font size of the text that covers the animated GIF
  resizeFont: false, // Whether or not the animated GIF text will be resized to fit within the GIF container
  fontFamily: 'sans-serif', // The font family of the text that covers the animated GIF
  fontColor: '#ffffff', // The font color of the text that covers the animated GIF
  textAlign: 'center', // The horizontal text alignment of the text that covers the animated GIF
  textBaseline: 'bottom', // The vertical text alignment of the text that covers the animated GIF
  textXCoordinate: null, // The X (horizontal) Coordinate of the text that covers the animated GIF
  textYCoordinate: null, // The Y (vertical) Coordinate of the text that covers the animated GIF

  // ADVANCED OPTIONS

  // WEBCAM CAPTURE OPTIONS
  webcamVideoElement: null, // You can pass an existing video element to use for the webcam GIF creation process,
  keepCameraOn: false, // Whether or not you would like the user's camera to stay on after the GIF is created
  cameraStream: null, // Expects a cameraStream Media object

  // CANVAS OPTIMIZATION OPTIONS
  saveRenderingContexts: false, // Whether or not you would like to save all of the canvas image binary data
  savedRenderingContexts: [] // Array of canvas image data
};

export default class GIFBuilder {
  static get properties() {
    return {
      id: 'gif',
      name: 'GIF',
      extensions: ['gif'],
      mimeTypes: ['image/gif'],
      builder: GIFBuilder,
      options: GIF_BUILDER_OPTIONS
    };
  }

  constructor(options) {
    this.options = {...options};
    this.source = options.source;
    delete options.source;

    // Allow files to be added
    this.files = [];

    // Expose the gifshot module so that the full gifshot API is available to apps (Experimental)
    this.gifshot = gifshot;
  }

  async initialize(options) {
    // Expose the gifshot module so that the full gifshot API is available to apps (Experimental)
    // this.gifshot = await loadGifshotModule(options);
  }

  async add(file) {
    await this.initialize();
    this.files.push(file);
  }

  async build() {
    await this.initialize();
    this._cleanOptions(this.options);

    switch (this.source) {
      case 'images':
        this.options.images = this.files;
        break;
      case 'video':
        this.options.video = this.files;
        break;
      case 'webcam':
        assert(this.files.length === 0);
        break;
      default:
        throw new Error('GIFBuilder: invalid source');
    }

    return await this._createGIF();
  }

  // PRIVATE

  async _createGIF() {
    return new Promise((resolve, reject) => {
      this.gifshot.createGIF(this.options, result => {
        // callback object properties
        // --------------------------
        // image - Base 64 image
        // cameraStream - The webRTC MediaStream object
        // error - Boolean that determines if an error occurred
        // errorCode - Helpful error label
        // errorMsg - Helpful error message
        // savedRenderingContexts - An array of canvas image data (will only be set if the saveRenderingContexts option was used)

        if (result.error) {
          reject(result.errorMsg);
          return;
        }

        // image - Base 64 image
        resolve(result.image);

        // var image = obj.image,
        // animatedImage = document.createElement('img');
        // animatedImage.src = image;
        // document.body.appendChild(animatedImage);
      });
    });
  }

  // Remove some gifshot options
  _cleanOptions(options) {
    if (options.video || options.images || options.gifWidth || options.gifHeight) {
      console.warn('GIFBuilder: ignoring options'); // eslint-disable-line
    }

    // We control these through options.source instead
    delete options.video;
    delete options.images;

    // Use width/height props (to standardize across builders)
    options.gifWidth = options.width;
    options.gifHeight = options.height;
    delete options.width;
    delete options.height;
  }
}
