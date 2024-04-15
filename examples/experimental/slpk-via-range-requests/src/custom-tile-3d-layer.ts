import {Tile3DLayer, Tile3DLayerProps} from '@deck.gl/geo-layers';
import {UpdateParameters} from '@deck.gl/core/typed';

export default class CustomTile3DLayer<
  DataT = any,
  // eslint-disable-next-line @typescript-eslint/ban-types
  ExtraProps extends {} = {}
> extends Tile3DLayer<DataT, Tile3DLayerProps & ExtraProps> {
  static layerName = 'CustomLayer';
  static defaultProps = Tile3DLayer.defaultProps as any;

  //@ts-expect-error
  updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    //@ts-expect-error
    if ((props.data || typeof props.data === 'string') && props.data !== oldProps.data) {
      //@ts-expect-error call of private method of the base class
      this._loadTileset(props.data);
    }

    if (changeFlags.viewportChanged) {
      //@ts-expect-error call of private method of the base class
      const {activeViewports} = this.state;
      const viewportsNumber = Object.keys(activeViewports).length;
      if (viewportsNumber) {
        //@ts-expect-error call of private method of the base class
        this._updateTileset(activeViewports);
        //@ts-expect-error
        this.state.lastUpdatedViewports = activeViewports;
        //@ts-expect-error
        this.state.activeViewports = {};
      }
    }
    if (changeFlags.propsChanged) {
      //@ts-expect-error
      const {layerMap} = this.state;
      for (const key in layerMap) {
        layerMap[key].needsUpdate = true;
      }
    }
  }
}
