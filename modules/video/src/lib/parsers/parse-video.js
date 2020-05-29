/* global document, URL */

// Parse to platform defined video type (HTMLVideoElement in browser)
export default async function parseVideo(response, options) {
  const blob = await response.blob();
  const video = document.createElement('video');
  video.src = URL.createObjectURL(blob);
  return video;
}
