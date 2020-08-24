/** @typedef {import('./modes')} types */
import {GL} from '../constants';
import assert from '../utils/assert';

/** @type {types['getPrimitiveModeType']} */
export function getPrimitiveModeType(mode) {
  switch (mode) {
    case GL.POINTS: // draw single points.
      return GL.POINTS;
    case GL.LINES: // draw lines. Each set of two vertices is treated as a separate line segment.
    case GL.LINE_STRIP: // draw lines. Each vertex connects to the one after it.
    case GL.LINE_LOOP: // draw a connected group of line segments from the first vertex to the last
      return GL.LINES;
    case GL.TRIANGLES:
    case GL.TRIANGLE_STRIP:
    case GL.TRIANGLE_FAN: // draw a connected group of triangles.
      return GL.TRIANGLES;
    default:
      // @ts-ignore
      return assert(false);
  }
}

/** @type {types['isPrimitiveModeExpandable']} */
export function isPrimitiveModeExpandable(mode) {
  switch (mode) {
    case GL.LINE_STRIP: // draw lines. Each vertex connects to the one after it.
    case GL.LINE_LOOP: // draw a connected group of line segments from the first vertex to the last
    case GL.TRIANGLE_STRIP: // draw a connected group of triangles.
    case GL.TRIANGLE_FAN: // draw a connected group of triangles.
      return true;
    default:
      return false;
  }
}

/** @type {types['getPrimitiveModeExpandedLength']} */
export function getPrimitiveModeExpandedLength(mode, length) {
  switch (mode) {
    case GL.POINTS: // draw single points.
      return length;
    case GL.LINES: // draw lines. Each set of two vertices is treated as a separate line segment.
      return length;
    case GL.LINE_STRIP: // draw lines. Each vertex connects to the one after it.
      return length;
    case GL.LINE_LOOP: // draw a connected group of line segments from the first vertex to the last
      return length + 1;
    case GL.TRIANGLES: // draw triangles. Each set of three vertices creates a separate triangle.
      return length;
    case GL.TRIANGLE_STRIP: // draw a connected group of triangles.
    case GL.TRIANGLE_FAN: // draw a connected group of triangles.
      return (length - 2) * 3;
    default:
      // @ts-ignore
      return assert(false);
  }
}
