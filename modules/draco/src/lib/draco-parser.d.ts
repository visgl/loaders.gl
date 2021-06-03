export default class DracoParser {
  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco);

  /**
   * Destroy draco resources
   */
  destroy(): void;

  /**
   *
   * @param dracoGeometry
   */
  destroyGeometry(dracoGeometry);

  /**
   * NOTE: caller must call `destroyGeometry` on the return value after using it
   * @param arrayBuffer
   * @param options
   */
  parseSync(arrayBuffer: ArrayBuffer, options?);
}
