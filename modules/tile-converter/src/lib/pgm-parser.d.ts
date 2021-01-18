/**
 * Parse header of "Earth Gravity Model" *.pgm file
 * The implementation is ported from GeographicLib-1.50.1
 * https://geographiclib.sourceforge.io/html/index.html
 */

/**
 * Parse "Earth Gravity Model" loaded from a *.pgm file
 * https://geographiclib.sourceforge.io/html/geoid.html
 * @param {Uint8Array} data - binary buffer of pgm file
 * @param {Object} options - loader options
 * @returns {GeoidHeightModel} - instance of GeoidHeightModel class
 */
export function parsePgm(data, options);
