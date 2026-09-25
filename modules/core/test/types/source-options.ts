// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createDataSource, load} from '@loaders.gl/core';
import {MVTSourceLoader, MVTTileSource} from '@loaders.gl/mvt';
import {PMTilesSourceLoader} from '@loaders.gl/pmtiles';
import {WMSSourceLoader} from '@loaders.gl/wms';
import type {DataSourceOptions, SourcePropsType} from '@loaders.gl/loader-utils';

// Compile only: node node_modules/typescript/bin/tsc --project modules/core/test/types/tsconfig.json
const source: MVTTileSource = createDataSource('memory://tiles', [MVTSourceLoader], {
  core: {worker: false},
  mvt: {metadataUrl: null, layerProperty: 'layer'}
});
source.getSchema();
createDataSource('memory://tiles', [MVTSourceLoader]);
createDataSource('memory://tiles', [MVTSourceLoader, PMTilesSourceLoader] as const, {
  core: {type: 'pmtiles', worker: false},
  pmtiles: {shape: 'arrow-table'},
  mvt: {layerProperty: 'layer'},
  mlt: {layers: ['roads']}
});
const declaredOptions: SourcePropsType<typeof MVTSourceLoader> = {mvt: {metadataUrl: null}};
void declaredOptions;
// Unknown namespaces remain supported for dynamic parsers, but known fields stay typed.
const extensionOptions: DataSourceOptions = {customParser: {customSetting: true}};
void extensionOptions;
// @ts-expect-error PMTiles retains the rejection of the removed source alias from #4031.
createDataSource('memory://tiles', [PMTilesSourceLoader], {loadOptions: {}});
// @ts-expect-error PMTiles also rejects the former nested replacement.
createDataSource('memory://tiles', [PMTilesSourceLoader], {core: {loadOptions: {}}});
// @ts-expect-error Unknown core controls are not accepted.
createDataSource('memory://tiles', [MVTSourceLoader], {core: {unknownSetting: true}});
// @ts-expect-error Known parser fields retain their declared types.
createDataSource('memory://tiles', [MVTSourceLoader], {mvt: {layers: 123}});
// @ts-expect-error Multiple source candidates must not hide invalid known parser options.
createDataSource('memory://tiles', [MVTSourceLoader, WMSSourceLoader], {mvt: {layers: 123}});
// @ts-expect-error The nested wrapper was removed.
createDataSource('memory://tiles', [MVTSourceLoader], {core: {loadOptions: {}}});
// @ts-expect-error A generic loadOptions bag is not the replacement API.
createDataSource('memory://tiles', [MVTSourceLoader], {loadOptions: {}});
void load('memory://tiles', MVTSourceLoader, {core: {worker: false}, mvt: {metadataUrl: null}});
// @ts-expect-error load must enforce the same source option contract.
void load('memory://tiles', MVTSourceLoader, {core: {loadOptions: {}}});
// @ts-expect-error Known parser options are checked through load as well.
void load('memory://tiles', MVTSourceLoader, {mvt: {layers: 123}});
// @ts-expect-error Source arrays use the same checked contract.
void load('memory://tiles', [MVTSourceLoader, WMSSourceLoader], {mvt: {layers: 123}});
