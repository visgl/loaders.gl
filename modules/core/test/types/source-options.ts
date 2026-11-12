// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {createDataSource, createDataSourceSync} from '@loaders.gl/core';
import {MVTSourceLoader, MVTTileSource} from '@loaders.gl/tiles/mvt';
import {PMTilesSourceLoader} from '@loaders.gl/tiles/pmtiles';
import {WMSSourceLoader} from '@loaders.gl/ogc/wms';
import type {DataSourceOptions, SourcePropsType} from '@loaders.gl/core/loader-utils';

// Compile only: node node_modules/typescript/bin/tsc --project modules/core/test/types/tsconfig.json
const source: MVTTileSource = createDataSourceSync('memory://tiles', [MVTSourceLoader], {
  core: {worker: false},
  mvt: {metadataUrl: null, layerProperty: 'layer'}
});
source.getSchema();
createDataSourceSync('memory://tiles', [MVTSourceLoader]);
createDataSourceSync('memory://tiles', [MVTSourceLoader, PMTilesSourceLoader] as const, {
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
createDataSourceSync('memory://tiles', [PMTilesSourceLoader], {loadOptions: {}});
// @ts-expect-error PMTiles also rejects the former nested replacement.
createDataSourceSync('memory://tiles', [PMTilesSourceLoader], {core: {loadOptions: {}}});
// @ts-expect-error Unknown core controls are not accepted.
createDataSourceSync('memory://tiles', [MVTSourceLoader], {core: {unknownSetting: true}});
// @ts-expect-error Known parser fields retain their declared types.
createDataSourceSync('memory://tiles', [MVTSourceLoader], {mvt: {layers: 123}});
// @ts-expect-error Multiple source candidates must not hide invalid known parser options.
createDataSourceSync('memory://tiles', [MVTSourceLoader, WMSSourceLoader], {mvt: {layers: 123}});
// @ts-expect-error The nested wrapper was removed.
createDataSourceSync('memory://tiles', [MVTSourceLoader], {core: {loadOptions: {}}});
// @ts-expect-error A generic loadOptions bag is not the replacement API.
createDataSourceSync('memory://tiles', [MVTSourceLoader], {loadOptions: {}});
void createDataSource('memory://tiles', MVTSourceLoader, {
  core: {worker: false},
  mvt: {metadataUrl: null}
});
// @ts-expect-error Async source creation must enforce the same source option contract.
void createDataSource('memory://tiles', MVTSourceLoader, {core: {loadOptions: {}}});
// @ts-expect-error Known parser options are checked through load as well.
void createDataSource('memory://tiles', MVTSourceLoader, {mvt: {layers: 123}});
// @ts-expect-error Source arrays use the same checked contract.
void createDataSource('memory://tiles', [MVTSourceLoader, WMSSourceLoader], {mvt: {layers: 123}});
