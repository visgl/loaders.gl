/*
import {fetchFile, selectLoader} from "@loaders.gl/core";

/**
 * Parses files within a list of files, allowing it to load other files against that list
 * @param {*} files
 *
async function parseFiles(files, loaders, options) {
  let filenames = files;
  if (files.readdir) {
    filenames = await files.readdir();
  }

  const promises = [];
  for (const filename of filenames) {
    // Check that this filename has a loader
    const loader = selectLoader(filename, loaders, options);
    if (loader) {
      options = {...files, fetch: files.fetch};
      const promise = parse(filename, loaders, options);
      promises.push(promise);
    }
  }

  return Promise.all(promises);
}

async function parseFilesInBatches(files, loaders, options) {
  let filenames = files;
  if (files.readdir) {
    filenames = await files.readdir();
  }

  const asyncIterators = [];
  for (const filename of filenames) {
    // Check that this filename has a loader
    const loader = selectLoader(filename, loaders, options);
    if (loader) {
      options = {...files, fetch: files.fetch};
      const asyncIterator = await parseInBatches(filename, loaders, options);
      asyncIterators.push(asyncIterator);
    }
  }

  return asyncIterators;
}
*/
