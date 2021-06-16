export function validateLoader(t, loader, name = '') {
  t.ok(typeof loader.id === 'string', `Loader ${name} loader.id is not defined`);
  t.ok(loader, `Loader ${name} defined`);
  t.equal(typeof loader.name, 'string', `Loader ${name} has a name`);
  t.ok(Array.isArray(loader.extensions), `Loader ${name} has an extensions array`);
  t.ok(Array.isArray(loader.mimeTypes), `Loader ${name} has a mimeTypes array`);

  const options = loader.options || {};
  t.ok(!('workerUrl' in options), 'workerUrl is not defined on loader.options');
  if (name.includes('Worker')) {
    t.ok('worker' in loader, `Loader ${name} loader.worker is not defined`);
  }

  const loaderOptions = options[loader.id] || {};
  if (!loader.parse) {
    // t.ok(loaderOptions.workerUrl, 'options.<loaderId>.workerUrl');
  } else {
    t.equal(typeof loader.parse, 'function', `Loader ${name} has 'parse' function`);
    // Call parse just to ensure it returns a promise
    const promise = loader.parse(null, {}).catch(_ => {});
    t.ok(promise.then, `Loader ${name} is async (returns a promise)`);
  }
}

export function validateWriter(t, writer, name = '') {
  t.ok(writer, `Writer ${name} defined`);
  t.equal(typeof writer.name, 'string', `Writer ${name} has a name`);
}

export function validateBuilder(t, builder, name = '') {
  t.ok(builder, `Builder ${name} defined`);
  t.equal(typeof builder.name, 'string', `Builder ${name} has a name`);
}

/**
 * Check if the returned data from loaders use the format specified in:
 *  /docs/developer-guide/category-pointcloud.md
 */
export function validateMeshCategoryData(t, data) {
  // t.ok(data.loaderData && data.loaderData.header, 'data has original header');

  t.ok(data.header && Number.isFinite(data.header.vertexCount), 'data has normalized header');
  t.ok(data.header.boundingBox
    && data.header.boundingBox.length === 2
    && data.header.boundingBox.every(p =>
      p.length === 3 && p.every(Number.isFinite)
    ), 'data header has boundingBox');

  t.ok(Number.isFinite(data.mode), 'data has draw mode');

  let attributesError = data.attributes ? null : 'data does not have attributes';
  if (data.indices) {
    attributesError = attributesError || validateAttribute('indices', data.indices);
  }
  for (const attributeName in data.attributes) {
    attributesError =
      attributesError || validateAttribute(attributeName, data.attributes[attributeName]);
  }
  t.notOk(attributesError, 'data has valid attributes');
}

function validateAttribute(attributeName, attribute) {
  if (!ArrayBuffer.isView(attribute.value)) {
    return `${attributeName} value is not typed array`;
  }
  if (attribute.value.slice(0, 10).some(x => !Number.isFinite(x))) {
    return `${attributeName} contains invalid value`;
  }
  if (!Number.isFinite(attribute.size)) {
    return `${attributeName} does not have size`;
  }
  // if (!Number.isFinite(attribute.componentType)) {
  //   return `${attributeName} does not have type`;
  // }
  return null;
}
