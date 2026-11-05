import React from 'react';
import {FORMAT_METADATA, FormatLogo} from './format-logo';
import {name as name_arcgis, exports as exports_arcgis} from '../../../../modules/arcgis/package.json';
import {name as name_archives, exports as exports_archives} from '../../../../modules/archives/package.json';
import {name as name_compression, exports as exports_compression} from '../../../../modules/compression/package.json';
import {name as name_core, exports as exports_core} from '../../../../modules/core/package.json';
import {name as name_crypto, exports as exports_crypto} from '../../../../modules/crypto/package.json';
import {name as name_documents, exports as exports_documents} from '../../../../modules/documents/package.json';
import {name as name_geospatial, exports as exports_geospatial} from '../../../../modules/geospatial/package.json';
import {name as name_graphs, exports as exports_graphs} from '../../../../modules/graphs/package.json';
import {name as name_images, exports as exports_images} from '../../../../modules/images/package.json';
import {name as name_ogc, exports as exports_ogc} from '../../../../modules/ogc/package.json';
import {name as name_pointclouds, exports as exports_pointclouds} from '../../../../modules/pointclouds/package.json';
import {name as name_raster, exports as exports_raster} from '../../../../modules/raster/package.json';
import {name as name_scene, exports as exports_scene} from '../../../../modules/scene/package.json';
import {name as name_scientific, exports as exports_scientific} from '../../../../modules/scientific/package.json';
import {name as name_services, exports as exports_services} from '../../../../modules/services/package.json';
import {name as name_splats, exports as exports_splats} from '../../../../modules/splats/package.json';
import {name as name_sql, exports as exports_sql} from '../../../../modules/sql/package.json';
import {name as name_tables, exports as exports_tables} from '../../../../modules/tables/package.json';
import {name as name_tiles, exports as exports_tiles} from '../../../../modules/tiles/package.json';
import {name as name_tiles_3d, exports as exports_tiles_3d} from '../../../../modules/tiles-3d/package.json';
import {name as name_traces, exports as exports_traces} from '../../../../modules/traces/package.json';

const manifests = {
  'arcgis': {name: name_arcgis, exports: exports_arcgis},
  'archives': {name: name_archives, exports: exports_archives},
  'compression': {name: name_compression, exports: exports_compression},
  'core': {name: name_core, exports: exports_core},
  'crypto': {name: name_crypto, exports: exports_crypto},
  'documents': {name: name_documents, exports: exports_documents},
  'geospatial': {name: name_geospatial, exports: exports_geospatial},
  'graphs': {name: name_graphs, exports: exports_graphs},
  'images': {name: name_images, exports: exports_images},
  'ogc': {name: name_ogc, exports: exports_ogc},
  'pointclouds': {name: name_pointclouds, exports: exports_pointclouds},
  'raster': {name: name_raster, exports: exports_raster},
  'scene': {name: name_scene, exports: exports_scene},
  'scientific': {name: name_scientific, exports: exports_scientific},
  'services': {name: name_services, exports: exports_services},
  'splats': {name: name_splats, exports: exports_splats},
  'sql': {name: name_sql, exports: exports_sql},
  'tables': {name: name_tables, exports: exports_tables},
  'tiles': {name: name_tiles, exports: exports_tiles},
  'tiles-3d': {name: name_tiles_3d, exports: exports_tiles_3d},
  'traces': {name: name_traces, exports: exports_traces},
};

/** Lists every public package export, including parser, writer, source, and asset subpaths. */
export function ModuleSubpaths({module}: {module: keyof typeof manifests}) {
  const manifest = manifests[module];
  const paths = Object.keys(manifest.exports || {}).filter(path => path !== '.').sort();
  return (
    <details className="module-subpaths">
      <summary>All exported subpaths ({paths.length})</summary>
      <p>These are the package's public exports, including format entry points, parsers, writers, sources, and worker assets.</p>
      <table>
        <thead><tr><th>Format</th><th>Import subpath</th></tr></thead>
        <tbody>{paths.map(path => {
          const name = path.slice(2).split('/')[0];
          const format = FORMAT_METADATA.find(item => (item.slug === name || name.startsWith(item.slug + '-')) && (item.logo || item.ogc));
          return <tr key={path}><td>{format ? <FormatLogo slug={format.slug} /> : null}</td><td><code>{manifest.name}{path.slice(1)}</code></td></tr>;
        })}</tbody>
      </table>
    </details>
  );
}
