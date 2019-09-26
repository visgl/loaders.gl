const {ImageLoader} = require('@loaders.gl/images');

if (typeof self !== 'undefined') {
  /* global self */
  self.onmessage = event => {
    const data = event.data;

    ImageLoader.parse(data, {})
      .then(image => {
        self.postMessage({image}, [image]);
      })
      .catch(error => {
        self.postMessage({error: error.message});
      });
  };
}
