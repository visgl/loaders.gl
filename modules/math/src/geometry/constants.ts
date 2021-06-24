// Subset of WebGL constants

export const GL_PRIMITIVE = {
  POINTS: 0x0000, // Points. single points.
  LINES: 0x0001, // Lines. Each vertex connects to the one after it.
  TRIANGLES: 0x0004 // Triangles. Each set of three vertices creates a separate triangle.
};

// Primitive modes
export const GL_PRIMITIVE_MODE = {
  POINTS: 0x0000, // Points. single points.
  LINES: 0x0001, // Lines. Each vertex connects to the one after it.
  LINE_LOOP: 0x0002, // Lines. Each set of two vertices is treated as a separate line segment.
  LINE_STRIP: 0x0003, // Lines/ a connected group of line segments from the first vertex to the last
  TRIANGLES: 0x0004, // Triangles. Each set of three vertices creates a separate triangle.
  TRIANGLE_STRIP: 0x0005, // Triangles. A connected group of triangles.
  TRIANGLE_FAN: 0x0006 // Triangles. A connected group of triangles.
  // Each vertex connects to the previous and the first vertex in the fan.
};

type glType = {
  BYTE: number;
  UNSIGNED_BYTE: number;
  SHORT: number;
  UNSIGNED_SHORT: number;
  INT: number;
  UNSIGNED_INT: number;
  FLOAT: number;
  DOUBLE: number;
};

export const GL_TYPE: glType = {
  BYTE: 5120,
  UNSIGNED_BYTE: 5121,
  SHORT: 5122,
  UNSIGNED_SHORT: 5123,
  INT: 5124,
  UNSIGNED_INT: 5125,
  FLOAT: 5126,
  DOUBLE: 5130
};

export const GL = {
  ...GL_PRIMITIVE_MODE,
  ...GL_TYPE
};
