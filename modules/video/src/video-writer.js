import {encodeVideo} from './lib/encoders/encode-video';

export default {
  id: 'video',
  name: 'Video',
  extensions: ['jpeg'],
  encode: encodeVideo,
  DEFAULT_OPTIONS: {
    type: 'mp4'
  }
};
