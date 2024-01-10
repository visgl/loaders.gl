import {GeometryType} from '../flat-geobuf/geometry-type.js';
import {toGeometryType} from '../generic/geometry.js';
import {IFeature} from './feature.js';
import {IGeoJsonFeature} from '../geojson/feature.js';

function featureGeomType(feature: IFeature | IGeoJsonFeature): GeometryType {
  if (feature.getGeometry) {
    return toGeometryType(feature.getGeometry().getType());
  }
  return toGeometryType((feature as IGeoJsonFeature).geometry.type);
}

export function inferGeometryType(features: (IFeature | IGeoJsonFeature)[]): GeometryType {
  let geometryType: GeometryType | undefined;

  for (const f of features) {
    if (geometryType === GeometryType.Unknown) {
      break;
    }

    const gtype = featureGeomType(f);
    if (geometryType === undefined) {
      geometryType = gtype;
    } else if (geometryType !== gtype) {
      geometryType = GeometryType.Unknown;
    }
  }
  if (geometryType === undefined) {
    throw new Error('Could not infer geometry type for collection of features.');
  }
  return geometryType;
}
