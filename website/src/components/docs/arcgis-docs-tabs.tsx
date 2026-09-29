import React from 'react';
import Link from '@docusaurus/Link';

/** Navigation between an ArcGIS service, its example, and the complete support inventory. */
export function ArcGISDocsTabs({
  service
}: {
  /** Service documentation slug. */ service: string;
}): React.ReactElement {
  const example =
    service === 'arcgis-scene-server'
      ? '/examples/arcgis-scene-server'
      : '/examples/tiles/' + service;
  return (
    <nav
      aria-label="ArcGIS service resources"
      style={{display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem'}}
    >
      <Link to={'/docs/modules/arcgis/' + service}>Service guide</Link>
      <Link to={example}>Full example</Link>
      <Link to="/docs/modules/arcgis/services">Support and gaps</Link>
      <Link to="/examples/arcgis">All ArcGIS examples</Link>
    </nav>
  );
}
