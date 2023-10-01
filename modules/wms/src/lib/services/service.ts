// loaders.gl, MIT license

import {ImageSource, ImageSourceProps} from '@loaders.gl/loader-utils';

/** Export interface source */
export interface Service<SourceT = ImageSource, SourcePropsT = ImageSourceProps> {
  source?: SourceT;
  props?: SourcePropsT;
  type: string;
  testURL: (url: string) => boolean;
  create(props: SourcePropsT): SourceT;
}
