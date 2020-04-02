// eslint-disable-next-line import/no-extraneous-dependencies
import {setPathPrefix} from '@loaders.gl/core';

// TODO - for gatsby website. Naybe we could do this in website/src/html.js
setPathPrefix('https://raw.githubusercontent.com/uber-web/loaders.gl/master');

export {default} from './app';
