export default class DracoBuilder {
  // draco - the draco decoder, either import `draco3d` or load dynamically
  constructor(draco, options?: object);

  destroy(): void;

  // TBD - when does this need to be called?
  destroyEncodedObject(object): void;

  /**
   * Encode mesh or point cloud
   * @param mesh =({})
   * @param options
   */
  encodeSync(mesh: object, options?: object): ArrayBuffer;
}
