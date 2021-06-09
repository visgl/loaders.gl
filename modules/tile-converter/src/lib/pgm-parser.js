/**
 * Parsing code is ported from GeographicLib-1.50.1
 * https://geographiclib.sourceforge.io/html/index.html
 * Location: /GeographicLib-1.50.1/src/Geoid.cpp
 *
 * File header:
 * * \file Geoid.cpp
 * * \brief Implementation for GeographicLib::Geoid class
 * *
 * * Copyright (c) Charles Karney (2009-2018) <charles@karney.com> and licensed
 * * under the MIT/X11 License.  For more information, see
 * * https://geographiclib.sourceforge.io/
 **********************************************************************/

import {GeoidHeightModel} from './geoid-height-model';

const ENDL = 10;
const PIXEL_MAX = 65535;

// eslint-disable-next-line
export function parsePgm(data, options) {
  const getline = _getLineGenerator(data);
  let currentLine = getline.next();
  if (currentLine.done || currentLine.value.line !== 'P5') {
    throw new Error('Geoid model file: File not in PGM format');
  }
  let _offset = Number.MAX_VALUE;
  let _scale = 0;
  let _maxerror = -1;
  let _rmserror = -1;
  let _description = 'NONE';
  let _datetime = 'UNKNOWN';
  let _width = 0;
  let _height = 0;
  let _datastart = null;
  let _swidth = null;
  do {
    currentLine = getline.next();
    const s = currentLine.value.line;
    if (!s.length) {
      continue; // eslint-disable-line no-continue
    }
    if (s[0] === '#') {
      const sArr = s.split(' ');
      const commentId = sArr[0];
      const key = sArr[1];
      if (commentId !== '#' || !key) {
        continue; // eslint-disable-line no-continue
      }
      const infoArr = sArr.length > 2 ? sArr.slice(2) : [];
      if (key === 'Description') {
        _description = infoArr.join(' ');
      } else if (key === 'DateTime') {
        _datetime = infoArr.join(' ');
      } else if (key === 'Offset') {
        // eslint-disable-next-line max-depth
        if (!sArr[2]) {
          throw new Error('Geoid model file: Error reading offset');
        }
        _offset = parseInt(sArr[2], 10);
      } else if (key === 'Scale') {
        // eslint-disable-next-line max-depth
        if (!sArr[2]) {
          throw new Error('Geoid model file: Error reading scale');
        }
        _scale = parseFloat(sArr[2]);
      } else if (key === (options.cubic ? 'MaxCubicError' : 'MaxBilinearError')) {
        // It's not an error if the error can't be read
        // eslint-disable-next-line max-depth
        if (isFinite(parseFloat(sArr[2]))) {
          _maxerror = parseFloat(sArr[2]);
        }
      } else if (key === (options.cubic ? 'RMSCubicError' : 'RMSBilinearError')) {
        // It's not an error if the error can't be read
        // eslint-disable-next-line max-depth
        if (isFinite(parseFloat(sArr[2]))) {
          _rmserror = parseFloat(sArr[2]);
        }
      }
    } else {
      let sArr = s.split(' ');
      sArr = sArr.filter((testString) => testString !== '');
      _width = parseInt(sArr[0], 10);
      _height = parseInt(sArr[1], 10);
      if (!(_width && _height)) {
        throw new Error('Geoid model file: Error reading raster size');
      }
      break;
    }
  } while (!currentLine.done);

  currentLine = getline.next();
  const maxval = parseInt(currentLine.value.line, 10);
  if (currentLine.done) {
    throw new Error('Geoid model file: Error reading maxval');
  }
  if (maxval !== PIXEL_MAX) {
    throw new Error('Geoid model file: Incorrect value of maxval');
  }
  // Add 1 for whitespace after maxval
  _datastart = currentLine.value.offset;
  _swidth = _width;

  if (_offset === Number.MAX_VALUE) {
    throw new Error('Geoid model file: Offset not set');
  }
  if (_scale === 0) {
    throw new Error('Geoid model file: Scale not set');
  }
  if (_scale < 0) {
    throw new Error('Geoid model file: Scale must be positive');
  }
  if (_height < 2 || _width < 2) {
    // Coarsest grid spacing is 180deg.
    throw new Error('Geoid model file: Raster size too small');
  }
  if (_width & 1) {
    // This is so that longitude grids can be extended thru the poles.
    throw new Error('Geoid model file: Raster width is odd');
  }
  if (!(_height & 1)) {
    // This is so that latitude grid includes the equator.
    throw new Error('Geoid model file: Raster height is even');
  }

  const _rlonres = _width / 360;
  const _rlatres = (_height - 1) / 180;
  return new GeoidHeightModel({
    cubic: options.cubic,
    _width,
    _height,
    _rlonres,
    _rlatres,
    _offset,
    _scale,
    _swidth,
    _datastart,
    _maxerror,
    _rmserror,
    _description,
    _datetime,
    data
  });
}

/**
 * Yields strings from pgm file (splitted by 10 - new line symbol)
 * @param {Uint8Array} data - binary buffer of pgm file
 * @returns {Generator}
 */
function* _getLineGenerator(data) {
  let offset = 0;
  do {
    const endLineIndex = data.indexOf(ENDL, offset);
    if (endLineIndex !== -1) {
      const line = data.subarray(offset, endLineIndex);
      offset = endLineIndex + 1;
      yield {offset, line: _getStringFromCharArray(line)};
    } else {
      const line = data.subarray(offset, data.length);
      offset = data.length;
      yield {offset, line: _getStringFromCharArray(line)};
    }
  } while (offset < data.length);
  return {offset, line: ''};
}

/**
 * Converts Uint8Array of char-codes to string
 * @param {Uint8Array} array - binary buffer of pgm file
 * @returns {string}
 */
function _getStringFromCharArray(array) {
  let s = '';
  for (const char of array) {
    s += String.fromCharCode(char);
  }
  return s;
}
