const {ImageLoader} = require('@loaders.gl/images');

if (typeof self !== 'undefined') {
  /* global self */
  self.onmessage = event => {
    const data = event.data;

    ImageLoader.parse(data, {})
      .then(image => {
        // @ts-ignore self is WorkerGlobalContext!
        self.postMessage({image}, [image]);
      })
      .catch(error => {
        // @ts-ignore self is WorkerGlobalContext!
        self.postMessage({error: error.message});
      });
  };
}
