// Parse to platform defined video type (HTMLVideoElement in browser)
export default async function parseVideo(arrayBuffer: ArrayBuffer): Promise<HTMLVideoElement> {
  // TODO It is probably somewhat inefficent to convert a File/Blob to ArrayBuffer and back
  // and could perhaps cause problems for large videos.
  // TODO MIME type is also lost from the File or Response...
  const blob = new Blob([arrayBuffer]);
  const video = document.createElement('video');
  video.src = URL.createObjectURL(blob);
  return video;
}
