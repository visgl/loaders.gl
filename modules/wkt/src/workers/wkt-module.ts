export * from '../index';
import {createLoaderWorker} from '@loaders.gl/loader-utils';
import {HexWKBLoaderWithParser} from '../hex-wkb-loader-with-parser';
import {TWKBLoaderWithParser} from '../twkb-loader-with-parser';
import {WKBLoaderWithParser} from '../wkb-loader-with-parser';
import {WKTCRSLoaderWithParser} from '../wkt-crs-loader-with-parser';
import {WKTLoaderWithParser} from '../wkt-loader-with-parser';

createLoaderWorker({
  'wkt-crs': WKTCRSLoaderWithParser,
  'hex-wkb': HexWKBLoaderWithParser,
  twkb: TWKBLoaderWithParser,
  wkb: WKBLoaderWithParser,
  wkt: WKTLoaderWithParser
});
