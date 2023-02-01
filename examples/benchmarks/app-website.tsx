import React from 'react';

import App from './app';

// eslint-disable-next-line import/no-extraneous-dependencies
import {setPathPrefix} from '@loaders.gl/core';

// TODO - for gatsby website. Naybe we could do this in website/src/html.js
setPathPrefix('https://raw.githubusercontent.com/visgl/loaders.gl/master');

export default function WebSiteApp(props) {
  return <App {...props} />;
}
