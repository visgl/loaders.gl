/** Sidebar entries used to resolve canonical format documentation routes. */
type SidebarEntry = string | {type?: string; label?: string; items?: readonly SidebarEntry[]};

const sidebar = require('../../../../docs/docs-sidebar.json') as readonly SidebarEntry[];
const fallbackPaths: Readonly<Record<string, string>> = {
  avro: 'modules/tables/avro',
  lance: 'modules/tables/lance',
  delta: 'modules/tables/delta/format',
  iceberg: 'modules/tables/iceberg/format',
  hudi: 'modules/tables/hudi/format',
  terrain: 'modules/raster/terrain',
  hdf5: 'modules/scientific/hdf5',
  grib2: 'modules/scientific/grib2',
  vtk: 'modules/scientific/vtk',
  tar: 'modules/archives/tar',
  dot: 'modules/graphs',
  graphml: 'modules/graphs',
  gexf: 'modules/graphs',
  splat: 'modules/splats/formats/splats',
  ksplat: 'modules/splats/formats/splats',
  spz: 'modules/splats/formats/splats',
  rad: 'modules/splats/formats/splats',
  image: 'modules/images',
  video: 'modules/images/video',
  gif: 'modules/images/video',
  arcgis: 'modules/arcgis',
  'ogc-api': 'modules/ogc/wms/services/ogc-api'
};

/** Finds format and service documentation under the module-oriented sidebar. */
export function getFormatDocPaths(): ReadonlyMap<string, string> {
  const paths = new Map<string, string>();
  function visit(items: readonly SidebarEntry[], formatSection = false): void {
    for (const item of items) {
      if (typeof item === 'string') {
        if (formatSection && !item.endsWith('/README') && !item.includes('/api-reference/')) {
          const slug = item.split('/').pop();
          if (slug && !paths.has(slug)) paths.set(slug, item);
        }
      } else if (item.type === 'category') {
        visit(item.items || [], item.label === 'Formats' || item.label === 'Services' || formatSection);
      }
    }
  }
  visit(sidebar);
  for (const [slug, path] of Object.entries(fallbackPaths)) {
    if (!paths.has(slug)) paths.set(slug, path);
  }
  return paths;
}

const formatPaths = getFormatDocPaths();

/** Resolves a format logo to its documentation page when one is available. */
export function getFormatDocPath(slug: string): string | undefined {
  const path = formatPaths.get(slug);
  return path ? `/docs/${path}` : undefined;
}
