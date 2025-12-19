/** Supported Image Types @note duplicates definition in images/schema to avoid circular deps */
export type ImageType = ImageBitmap | ImageDataType | HTMLImageElement;

/** data images @note duplicates definition in images/schema to avoid circular deps */
export type ImageDataType = {
  data: Uint8Array;
  width: number;
  height: number;
  compressed?: boolean;
};
