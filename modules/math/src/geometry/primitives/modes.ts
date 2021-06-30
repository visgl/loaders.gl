import {GL} from '../constants';

/**
 * Different methods of working with geometries depending on glType
 /**

/**
 * @param mode
 * @returns draw points | lines | triangles
 */
export function getPrimitiveModeType(mode?: number): number {
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
      throw new Error('Unknown primitive mode');
  }
}
/**
 * @param mode
 * @returns true | false
 */
export function isPrimitiveModeExpandable(mode: number): boolean {
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
/**
 * Returns new length depends on glType
 * @param mode
 * @param length
 * @returns new length
 */
export function getPrimitiveModeExpandedLength(mode: number, length: number): number {
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
      throw new Error('Unknown length');
  }
}
