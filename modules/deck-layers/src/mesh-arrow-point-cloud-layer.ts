// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as arrow from 'apache-arrow';
import {
  CompositeLayer,
  type Color,
  type CompositeLayerProps,
  type DefaultProps,
  type GetPickingInfoParams,
  type Layer,
  type PickingInfo,
  type UpdateParameters
} from '@deck.gl/core';
import {PointCloudLayer, type PointCloudLayerProps} from '@deck.gl/layers';
import {getDeckBinaryDataFromArrowMesh} from '@loaders.gl/core/geoarrow';
import {isArrowRecordBatch} from '@loaders.gl/core/schema-utils';
import {
  getArrowTableRowProperties,
  getBatchIndexFromLayerId,
  isAsyncIterable,
  type MeshArrowPointCloudData
} from './mesh-arrow-point-cloud-layer-utils';

type MeshArrowPointCloudLayerState = {
  /** Arrow table batches loaded so far from async data. */
  arrowTableBatches: arrow.Table[];
  /** Monotonic stream identifier used to ignore stale async data. */
  streamId: number;
  /** Error raised while consuming the current async data stream. */
  streamError: Error | null;
  /** Async iterable currently being consumed. */
  streamingData: AsyncIterable<arrow.RecordBatch> | null;
};

/** Row properties returned when a Mesh Arrow point is picked. */
export type MeshArrowPointCloudPickingObject = {
  /** Row index inside the picked Arrow table or batch. */
  index: number;
  /** Point attribute values keyed by Arrow column name. */
  properties: Record<string, unknown>;
};

/** Props for {@link MeshArrowPointCloudLayer}. */
export type MeshArrowPointCloudLayerProps = CompositeLayerProps & {
  /** Native Apache Arrow table or asynchronous record batches. */
  data: MeshArrowPointCloudData;
  /** Fallback point color used when the Arrow table does not contain a `COLOR_0` column. */
  defaultPointColor?: Color;
  /** Optional props forwarded to deck.gl's PointCloudLayer. */
  pointCloudLayerProps?: Partial<PointCloudLayerProps>;
};

const defaultProps: DefaultProps<MeshArrowPointCloudLayerProps> = {
  id: 'mesh-arrow-point-cloud-layer',
  data: {type: 'object', compare: false, value: null},
  defaultPointColor: {type: 'color', value: [200, 200, 255]},
  pointCloudLayerProps: {type: 'object', compare: false, value: {}}
};

/**
 * Internal deck.gl layer that renders loaders.gl Mesh Arrow point clouds through binary attributes.
 */
export class MeshArrowPointCloudLayer extends CompositeLayer<MeshArrowPointCloudLayerProps> {
  /** deck.gl layer name used in debugging output. */
  static layerName = 'MeshArrowPointCloudLayer';

  /** Default props shared across Mesh Arrow point cloud layers. */
  static defaultProps: DefaultProps = defaultProps;

  /** Initializes state used for streaming Arrow table batches. */
  initializeState(): void {
    this.setState({
      arrowTableBatches: [],
      streamId: 0,
      streamError: null,
      streamingData: null
    } satisfies MeshArrowPointCloudLayerState);
  }

  /** Starts or resets async batch consumption when data changes. */
  updateState({props, oldProps, changeFlags}: UpdateParameters<this>): void {
    if (!changeFlags.dataChanged && props.data === oldProps.data) {
      return;
    }

    if (isAsyncIterable(props.data)) {
      const streamId = ((this.state as MeshArrowPointCloudLayerState).streamId || 0) + 1;
      this.setState({
        arrowTableBatches: [],
        streamId,
        streamError: null,
        streamingData: props.data
      } satisfies MeshArrowPointCloudLayerState);
      void this.consumeArrowTableBatches(props.data, streamId);
      return;
    }

    this.setState({
      arrowTableBatches: [],
      streamError: null,
      streamingData: null
    } satisfies Partial<MeshArrowPointCloudLayerState>);
  }

  /** Renders the Mesh Arrow table or currently loaded Arrow table batches as point clouds. */
  renderLayers(): Layer | Layer[] | null {
    if (!this.props.data) {
      return null;
    }

    if (isAsyncIterable(this.props.data)) {
      const {arrowTableBatches, streamError} = this.state as MeshArrowPointCloudLayerState;
      if (streamError) {
        throw streamError;
      }
      return arrowTableBatches.map((arrowTableBatch, batchIndex) =>
        this.renderPointCloudLayer(arrowTableBatch, `points-${batchIndex}`)
      );
    }

    const arrowTable = this.props.data;
    return this.renderPointCloudLayer(arrowTable, 'points');
  }

  private renderPointCloudLayer(arrowTable: arrow.Table, id: string): Layer {
    const pointCloudData = getDeckBinaryDataFromArrowMesh(arrowTable);
    const pointCloudLayerProps = this.props.pointCloudLayerProps || {};
    const getColor =
      pointCloudData.attributes.getColor || pointCloudLayerProps.getColor
        ? pointCloudLayerProps.getColor
        : this.props.defaultPointColor;

    return new PointCloudLayer({
      ...this.getSubLayerProps({id}),
      ...pointCloudLayerProps,
      data: pointCloudData,
      getColor,
      updateTriggers: pointCloudLayerProps.updateTriggers
    }) as unknown as Layer;
  }

  /** Adds Arrow row values to deck.gl picking info. */
  getPickingInfo(params: GetPickingInfoParams): PickingInfo {
    const info = params.info;
    if (!info.picked || info.index < 0) {
      return info;
    }

    const arrowTable = this.getPickedArrowTable(params.sourceLayer?.id);
    if (!arrowTable || info.index >= arrowTable.numRows) {
      return info;
    }

    info.object = {
      index: info.index,
      properties: getArrowTableRowProperties(arrowTable, info.index)
    } satisfies MeshArrowPointCloudPickingObject;

    return info;
  }

  /** Returns the Arrow table that contains the picked point. */
  private getPickedArrowTable(sourceLayerId?: string): arrow.Table | null {
    if (!this.props.data) {
      return null;
    }

    if (isAsyncIterable(this.props.data)) {
      const batchIndex = getBatchIndexFromLayerId(sourceLayerId);
      const arrowTableBatch = (this.state as MeshArrowPointCloudLayerState).arrowTableBatches[
        batchIndex
      ];
      return arrowTableBatch || null;
    }

    return this.props.data;
  }

  private async consumeArrowTableBatches(
    arrowTableBatchIterator: AsyncIterable<arrow.RecordBatch>,
    streamId: number
  ): Promise<void> {
    try {
      for await (const arrowTableBatch of arrowTableBatchIterator) {
        const state = this.state as MeshArrowPointCloudLayerState;
        if (state.streamId !== streamId || state.streamingData !== arrowTableBatchIterator) {
          return;
        }

        if (!isArrowRecordBatch(arrowTableBatch)) {
          throw new Error('MeshArrowPointCloudLayer async data requires Arrow RecordBatch values.');
        }

        this.setState({
          arrowTableBatches: [
            ...state.arrowTableBatches,
            new arrow.Table(arrowTableBatch.schema, [arrowTableBatch])
          ]
        } satisfies Partial<MeshArrowPointCloudLayerState>);
      }
    } catch (error) {
      const state = this.state as MeshArrowPointCloudLayerState;
      if (state.streamId === streamId && state.streamingData === arrowTableBatchIterator) {
        this.setState({
          streamError: error instanceof Error ? error : new Error(String(error))
        } satisfies Partial<MeshArrowPointCloudLayerState>);
      }
    }
  }
}
