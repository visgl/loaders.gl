import {ImageType} from './image-type';

export function isImage(image: any): boolean;
export function getImageType(image: any, throwOnError?: boolean): ImageType;
export function getImageData(image: any): Uint8Array;
export function getImageSize(image: any): {width: number; height: number};
