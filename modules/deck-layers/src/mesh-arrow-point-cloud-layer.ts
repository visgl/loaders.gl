// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import type * as arrow from 'apache-arrow';
import {
  CompositeLayer,
  type CompositeLayerProps,
  type DefaultProps,
  type Layer,
  type UpdateParameters
} from '@deck.gl/core';
import {PointCloudLayer, type PointCloudLayerProps} from '@deck.gl/layers';
import {getDeckBinaryDataFromArrowMesh} from '@loaders.gl/geoarrow';
import type {ArrowTableBatch, MeshArrowTable} from '@loaders.gl/schema';

type MeshArrowPointCloudData = MeshArrowTable | arrow.Table | AsyncIterable<ArrowTableBatch> | null;

type MeshArrowPointCloudLayerState = {
  /** Arrow table batches loaded so far from async data. */
  arrowTableBatches: ArrowTableBatch[];
  /** Monotonic stream identifier used to ignore stale async data. */
  streamId: number;
  /** Error raised while consuming the current async data stream. */
  streamError: Error | null;
  /** Async iterable currently being consumed. */
  streamingData: AsyncIterable<ArrowTableBatch> | null;
};

/** Props for {@link MeshArrowPointCloudLayer}. */
export type MeshArrowPointCloudLayerProps = CompositeLayerProps & {
  /** loaders.gl Mesh Arrow table wrapper, raw Apache Arrow table, or loaders.gl Arrow table batches. */
  data: MeshArrowPointCloudData;
  /** Optional props forwarded to deck.gl's PointCloudLayer. */
  pointCloudLayerProps?: Partial<PointCloudLayerProps>;
};

const defaultProps: DefaultProps<MeshArrowPointCloudLayerProps> = {
  id: 'mesh-arrow-point-cloud-layer',
  data: {type: 'object', compare: false, value: null},
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
        this.renderPointCloudLayer(arrowTableBatch.data, `points-${batchIndex}`)
      );
    }

    const arrowTable = getArrowTable(this.props.data);
    return this.renderPointCloudLayer(arrowTable, 'points');
  }

  private renderPointCloudLayer(arrowTable: arrow.Table, id: string): Layer {
    const pointCloudData = getDeckBinaryDataFromArrowMesh(arrowTable);

    return new PointCloudLayer({
      ...this.getSubLayerProps({id}),
      ...this.props.pointCloudLayerProps,
      data: pointCloudData,
      updateTriggers: this.props.pointCloudLayerProps?.updateTriggers
    }) as unknown as Layer;
  }

  private async consumeArrowTableBatches(
    arrowTableBatchIterator: AsyncIterable<ArrowTableBatch>,
    streamId: number
  ): Promise<void> {
    try {
      for await (const arrowTableBatch of arrowTableBatchIterator) {
        const state = this.state as MeshArrowPointCloudLayerState;
        if (state.streamId !== streamId || state.streamingData !== arrowTableBatchIterator) {
          return;
        }

        if (!isArrowTableBatch(arrowTableBatch)) {
          throw new Error('MeshArrowPointCloudLayer async data requires ArrowTableBatch values.');
        }

        this.setState({
          arrowTableBatches: [...state.arrowTableBatches, arrowTableBatch]
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

function getArrowTable(
  data: MeshArrowTable | arrow.Table | AsyncIterable<ArrowTableBatch>
): arrow.Table {
  return isMeshArrowTable(data) ? data.data : (data as arrow.Table);
}

/** Checks whether layer data is a loaders.gl Arrow table wrapper. */
function isMeshArrowTable(data: unknown): data is MeshArrowTable {
  return (data as MeshArrowTable).shape === 'arrow-table';
}

/** Returns true when data can be consumed as async Arrow table batches. */
function isAsyncIterable(data: unknown): data is AsyncIterable<ArrowTableBatch> {
  return Boolean(
    data && typeof (data as AsyncIterable<ArrowTableBatch>)[Symbol.asyncIterator] === 'function'
  );
}

/** Returns true when a value is a loaders.gl Arrow table data batch. */
function isArrowTableBatch(data: unknown): data is ArrowTableBatch {
  const arrowTableBatch = data as ArrowTableBatch;
  return (
    arrowTableBatch?.shape === 'arrow-table' &&
    arrowTableBatch.batchType === 'data' &&
    isArrowTable(arrowTableBatch.data)
  );
}

/** Returns true when a value is an Apache Arrow table. */
function isArrowTable(data: unknown): data is arrow.Table {
  return Boolean(data && typeof (data as arrow.Table).getChild === 'function');
}
