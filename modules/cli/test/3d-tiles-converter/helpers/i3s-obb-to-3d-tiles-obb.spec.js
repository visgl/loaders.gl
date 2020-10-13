import test from 'tape-promise/tape';
import {i3sObbTo3dTilesObb} from '../../../src/3d-tiles-converter/helpers/i3s-obb-to-3d-tiles-obb';

test('cli - Converters#converts I3S OBB to 3D-Tiles OBB', async t => {
  const tiles3DObb = i3sObbTo3dTilesObb({
    center: [-122.40277014424709, 37.795204290863012, 134.5439856108278],
    halfSize: [100.45386505126953, 91.120384216308594, 426.03338623046875],
    quaternion: [
      0.64432936906814575,
      0.76474469900131226,
      -0.0020481476094573736,
      0.0010012148413807154
    ]
  });
  t.deepEqual(tiles3DObb, [
    162.84049618913744,
    46.596495538402905,
    -6366708.0820186045,
    -17.044740507911246,
    98.99636360349382,
    -0.41896401976407743,
    89.79905117716781,
    15.46048110602704,
    -0.16787981318476183,
    -0.47205173558557734,
    -1.8842793374379618,
    -426.02894738381406
  ]);
});
