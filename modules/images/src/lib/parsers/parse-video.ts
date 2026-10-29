// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

/** Parse a Blob to a platform defined video type (HTMLVideoElement in browser). */
export async function parseVideoBlob(blob: Blob): Promise<HTMLVideoElement> {
  const video = document.createElement('video');
  video.src = URL.createObjectURL(blob);
  return video;
}

// Parse to platform defined video type (HTMLVideoElement in browser)
export default async function parseVideo(arrayBuffer: ArrayBuffer): Promise<HTMLVideoElement> {
  return await parseVideoBlob(new Blob([arrayBuffer]));
}
