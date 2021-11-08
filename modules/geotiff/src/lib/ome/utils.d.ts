import type { OMEXML } from '../ome/omexml';
import type { Labels } from '../../types';
export declare function getLabels(dimOrder: OMEXML[0]['Pixels']['DimensionOrder']): Labels<["t", "c", "z"] | ["c", "t", "z"] | ["z", "t", "c"] | ["t", "z", "c"] | ["z", "c", "t"] | ["c", "z", "t"]>;
export declare function getDims<S extends string>(labels: S[]): (name: S) => number;
