// Mesh category utilities
// TODO - move to mesh category module, or to math.gl/geometry module

type Attribute = {
  size?: number;
  type?: number;
  value: number;
};
type Attributes = { [key: string]: Attribute};

/**
 * Holds an axis aligned bounding box 
 * 
 * TODO - make sure AxisAlignedBoundingBox in math.gl/culling understands this format (or change this format)
 */
type BoundingBox = [[number, number, number], [number, number, number]];

/**
 * Get number of vertices in mesh
 * @param attributes 
 */
export function getMeshSize(attributes: Attributes): number;

/**
 * Get the (axis aligned) bounding box of a mesh
 * @param attributes 
 * @returns array of two vectors representing the axis aligned bounding box
 */
export function getMeshBoundingBox(attributes: Attributes): BoundingBox;
