/*
Asynchronously maps a deep structure of values (e.g. objects and arrays of urls).

E.g. a mipmapped cubemap
{
  [CUBE_FACE_FRONT]: [
    "image-front-0.jpg",
    "image-front-1.jpg",
    "image-front-2.jpg",
  ],
  [CUBE_MAP_BACK]: [
    ...
  ]
}
*/

const isObject = (value) => value && typeof value === 'object';

// Loads a deep structure of urls (objects and arrays of urls)
// Returns an object with six key-value pairs containing the images (or image mip arrays)
// for each cube face
export async function asyncDeepMap(tree, func, options = {}) {
  return await mapSubtree(tree, func, options);
}

export async function mapSubtree(object, func, options) {
  if (Array.isArray(object)) {
    return await mapArray(object, func, options);
  }

  if (isObject(object)) {
    return await mapObject(object, func, options);
  }

  // TODO - ignore non-urls, non-arraybuffers?
  const url = object;
  return await func(url, options);
}

// HELPERS

async function mapObject(object, func, options) {
  const promises = [];
  const values = {};

  for (const key in object) {
    const url = object[key];
    const promise = mapSubtree(url, func, options).then((value) => {
      values[key] = value;
    });
    promises.push(promise);
  }

  await Promise.all(promises);

  return values;
}

async function mapArray(urlArray, func, options = {}) {
  const promises = urlArray.map((url) => mapSubtree(url, func, options));
  return await Promise.all(promises);
}
