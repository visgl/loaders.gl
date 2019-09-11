// Forked from github AnthumChris/fetch-progress-indicators under MIT license
/* global fetch, document, URL */
import {_fetchProgress} from '@loaders.gl/core';

const PROGRESS_IMAGE_URL = 'https://fetch-progress.anthum.com/30kbps/images/sunrise-baseline.jpg';
// 'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/images/test/progress/sunrise-baseline.jpg';
// 'https://raw.githubusercontent.com/uber-web/loaders.gl/master/modules/images/test/data/img1-preview.jpeg';

const elStatus = document.getElementById('status');
const elProgress = document.getElementById('progress');
const elImage = document.getElementById('img');

async function main() {
  elStatus.innerHTML = 'Downloading with fetch()...';

  try {
    const response = await _fetchProgress(
      fetch(PROGRESS_IMAGE_URL),
      (percent, {loadedBytes, totalBytes}) => {
        elProgress.innerHTML = `${percent}% ${Math.round(loadedBytes / 1000)} of ${Math.round(
          totalBytes / 1000
        )} Kbytes`;
      }
    );
    const data = await response.blob();
    elStatus.innerHTML = 'download completed';
    elImage.src = URL.createObjectURL(data);
  } catch (error) {
    console.error(error); // eslint-disable-line
    elStatus.innerHTML = error;
  }
}

main();

/*
unction progress(percent {loadedBytes, totalBytes}) {
elProgress.innerHTML = Math.round(loadedBytes/totalBytes*100)+'%';
*/
