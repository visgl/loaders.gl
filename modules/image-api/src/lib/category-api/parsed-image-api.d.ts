import {ImageType, ImageTypeEnum, ImageDataType} from '../../types';

export function isImage(image: ImageType): boolean;
export function getImageType(image: ImageType, throwOnError?: boolean): ImageTypeEnum;
export function getImageData(image: ImageType): ImageDataType | ImageData;
export function getImageSize(image: ImageType): {width: number; height: number};
