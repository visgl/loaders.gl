/**
 * class GeoidHeightModel - "Gravity Height Model"
 * Calculates difference between mean see level height and WGS84 ellipsoid height
 * Input data have to be loaded from "Earth Gravity Model" *.pgm file with "PGMLoader"
 * A particular model file can be loaded on https://geographiclib.sourceforge.io/html/geoid.html
 *
 * The implementation is ported from GeographicLib-1.50.1
 */
export class GeoidHeightModel {
  /**
   * @constructs
   * Create a GeoidHeightModel instance.
   * @param options - object which includes parameters parsed from *.pgm header
   * @param options.data - binary buffer of *.pgm file
   */
  constructor(options: {
    cubic: boolean;
    _width: number;
    _height: number;
    _rlonres: number;
    _rlatres: number;
    _offset: number;
    _scale: number;
    _swidth: number;
    _datastart: number;
    _maxerror: number;
    _rmserror: number;
    _description: string;
    _datetime: string;
    data: Uint8Array;
  });

  /**
   * Calculates difference between mean see level height and WGS84 ellipsoid height
   * Code is ported from /GeographicLib-1.50.1/src/Geoid.cpp
   * @param lat - latitude
   * @param lon - longitude
   * @returns height in meters
   */
  getHeight(lat: number, lon: number): number;
}
