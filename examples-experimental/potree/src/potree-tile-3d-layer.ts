import {Tile3DLayer, Tile3DLayerProps} from '@deck.gl/geo-layers';
import {Viewport, UpdateParameters, COORDINATE_SYSTEM} from '@deck.gl/core';
import {Source} from '@loaders.gl/loader-utils';
import {PointcloudTileset} from './pointcloud-tileset';
import { PointCloudLayer } from '@deck.gl/layers';

export type PotreeTile3DLayerProps = {
  source: Source;
};

export class PotreeTile3DLayer<
  DataT = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraProps extends {} = {}
> extends Tile3DLayer<DataT, Tile3DLayerProps & PotreeTile3DLayerProps & ExtraProps> {
  static layerName = 'PotreeTile3DLayer';
  static defaultProps = Tile3DLayer.defaultProps;

  //@ts-expect-error
  updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    if (props.data && props.data !== oldProps.data) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      this._loadTileset(props.data);
    }

    if (changeFlags.viewportChanged) {
      const {activeViewports} = this.state;
      const viewportsNumber = Object.keys(activeViewports).length;
      if (viewportsNumber) {
        this._updateTileset(activeViewports);
        this.state.lastUpdatedViewports = activeViewports;
        this.state.activeViewports = {};
      }
    }
    if (changeFlags.propsChanged) {
      const {layerMap} = this.state;
      for (const key in layerMap) {
        layerMap[key].needsUpdate = true;
      }
    }
  }

  private async _loadTileset(tilesetUrl) {
    const {loadOptions = {}} = this.props;

    const dataSource = this.props.source.createDataSource(tilesetUrl, {});

    const tileset3d = new PointcloudTileset(dataSource);

    this.setState({
      tileset3d,
      layerMap: {}
    });

    this._updateTileset(this.state.activeViewports);
    // @ts-expect-error we replaced the standard Tileset3D
    this.props.onTilesetLoad(tileset3d);
  }

  private _updateTileset(viewports: {[viewportId: string]: Viewport} | null): void {
    if (!viewports) {
      return;
    }
    const {tileset3d} = this.state;
    const {timeline} = this.context;
    const viewportsNumber = Object.keys(viewports).length;
    if (!timeline || !viewportsNumber || !tileset3d) {
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    tileset3d.selectTiles(Object.values(viewports)).then((frameNumber) => {
      const tilesetChanged = this.state.frameNumber !== frameNumber;
      if (tilesetChanged) {
        this.setState({frameNumber});
      }
    });
  }

  private _makePointCloudLayer(
    tileHeader: Tile3D,
    oldLayer?: PointCloudLayer<DataT>
  ): PointCloudLayer<DataT> | null {
    const {
      attributes,
      pointCount,
      constantRGBA,
      cartographicOrigin,
      modelMatrix,
      coordinateSystem = COORDINATE_SYSTEM.METER_OFFSETS
    } = tileHeader.content;
    const {positions, normals, colors} = attributes;

    if (!positions) {
      return null;
    }
    const data = (oldLayer && oldLayer.props.data) || {
      header: {
        vertexCount: pointCount
      },
      attributes: {
        POSITION: positions,
        NORMAL: normals,
        COLOR_0: colors
      }
    };

    const {pointSize, getPointColor} = this.props;
    const SubLayerClass = this.getSubLayerClass('pointcloud', PointCloudLayer);
    return new SubLayerClass(
      {
        pointSize
      },
      this.getSubLayerProps({
        id: 'pointcloud'
      }),
      {
        id: `${this.id}-pointcloud-${tileHeader.id}`,
        tile: tileHeader,
        data,
        coordinateSystem,
        coordinateOrigin: cartographicOrigin,
        modelMatrix,
        getColor: constantRGBA || getPointColor,
        _offset: 0
      }
    );
  }
}
