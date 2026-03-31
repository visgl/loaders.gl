type NodeImageData = {
  data: Uint8Array;
  width: number;
  height: number;
};

/**
 * Minimal Node.js `ImageBitmap` polyfill backed by decoded pixel data.
 * This is intentionally limited to the functionality needed by `ImageBitmapLoader`
 * and `getImageBitmapData()`.
 */
export class NodeImageBitmap {
  /** Width of the decoded bitmap in pixels. */
  width: number;

  /** Height of the decoded bitmap in pixels. */
  height: number;

  /** Backing pixel data retained until `close()` is called. */
  private data: Uint8Array | null;

  /** Creates a bitmap wrapper around decoded Node.js image data. */
  constructor(imageData: NodeImageData) {
    if (!imageData || !imageData.data || !imageData.width || !imageData.height) {
      throw new Error('NodeImageBitmap requires decoded image data');
    }

    this.width = imageData.width;
    this.height = imageData.height;
    this.data = imageData.data;
  }

  /** Releases the backing pixel data and invalidates further reads. */
  close(): void {
    this.width = 0;
    this.height = 0;
    this.data = null;
  }

  /** Returns the decoded image data backing this bitmap. */
  _getImageData(): NodeImageData {
    if (!this.data) {
      throw new Error('ImageBitmap is closed');
    }

    return {
      data: this.data,
      width: this.width,
      height: this.height
    };
  }
}

/**
 * Detects whether a value is a Node.js `ImageBitmap` installed by `@loaders.gl/polyfills`.
 */
export function isNodeImageBitmap(image: unknown): image is NodeImageBitmap {
  return image instanceof NodeImageBitmap;
}

/**
 * Returns decoded image data from a Node.js `ImageBitmap`.
 */
export function getImageBitmapDataNode(image: unknown): NodeImageData {
  if (!isNodeImageBitmap(image)) {
    throw new Error('getImageBitmapData');
  }

  return image._getImageData();
}
