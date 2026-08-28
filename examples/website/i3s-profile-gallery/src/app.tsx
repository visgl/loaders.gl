import React, {useState} from 'react';
import {createRoot} from 'react-dom/client';
import {ArcGISSceneServerSource} from '@loaders.gl/services';
import type {I3SServiceMetadata} from '@loaders.gl/i3s';

const DEFAULT_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';

const PROFILE_PRESETS = [
  {
    label: '3D Object / mesh',
    url: DEFAULT_URL,
    description: 'A public 3D Object SceneServer layer.'
  }
];

/** Metadata-first I3S profile gallery and SceneServer inspector. */
export default function App(): React.ReactElement {
  const [url, setURL] = useState(DEFAULT_URL);
  const [metadata, setMetadata] = useState<I3SServiceMetadata | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function inspectLayer(): Promise<void> {
    setIsLoading(true);
    setError(null);
    try {
      const source = new ArcGISSceneServerSource(url);
      setMetadata(await source.getMetadata());
    } catch (loadError) {
      setMetadata(null);
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <header>
        <p style={styles.eyebrow}>loaders.gl · I3S</p>
        <h1 style={styles.heading}>Profile gallery</h1>
        <p style={styles.lead}>
          Inspect the same normalized metadata contract used by mesh, Point, and Point Cloud
          SceneServer sources. Building roots remain composite and are loaded with the dedicated
          Building Scene Layer loader.
        </p>
      </header>

      <section style={styles.card} aria-label="SceneServer layer inspector">
        <label htmlFor="i3s-url" style={styles.label}>
          SceneServer layer URL
        </label>
        <div style={styles.urlRow}>
          <input
            id="i3s-url"
            value={url}
            onChange={event => setURL(event.target.value)}
            style={styles.input}
            spellCheck={false}
          />
          <button type="button" onClick={inspectLayer} disabled={isLoading} style={styles.button}>
            {isLoading ? 'Inspecting…' : 'Inspect'}
          </button>
        </div>
        <div style={styles.presetRow}>
          {PROFILE_PRESETS.map(preset => (
            <button
              type="button"
              key={preset.label}
              onClick={() => setURL(preset.url)}
              style={styles.preset}
              title={preset.description}
            >
              {preset.label}
            </button>
          ))}
        </div>
        {error ? <p style={styles.error}>{error}</p> : null}
      </section>

      {metadata ? <MetadataCard metadata={metadata} /> : <ProfileCards />}
    </main>
  );
}

function ProfileCards(): React.ReactElement {
  const profiles = [
    ['3D Object', 'MeshPyramids geometry, textures, and feature attributes.'],
    ['Integrated Mesh', 'Large textured surfaces with traversal metadata.'],
    ['Building', 'Composite group, mesh, and Point sublayers.'],
    ['Point', 'Draco point geometry, symbols, and feature attributes.'],
    ['Point Cloud', 'LEPCC geometry and standard point attributes.']
  ];
  return (
    <section style={styles.grid} aria-label="I3S profile support">
      {profiles.map(([name, description]) => (
        <article key={name} style={styles.profileCard}>
          <h2 style={styles.profileHeading}>{name}</h2>
          <p style={styles.profileDescription}>{description}</p>
          <span style={styles.badge}>Inspect a layer above</span>
        </article>
      ))}
    </section>
  );
}

function MetadataCard({metadata}: {metadata: I3SServiceMetadata}): React.ReactElement {
  return (
    <section style={styles.card} aria-label="Normalized I3S metadata">
      <div style={styles.metadataHeader}>
        <div>
          <p style={styles.eyebrow}>{metadata.layerType}</p>
          <h2 style={styles.metadataTitle}>{metadata.name || 'Unnamed layer'}</h2>
        </div>
        <span style={styles.versionBadge}>I3S {metadata.version}</span>
      </div>
      <dl style={styles.metadataGrid}>
        <dt>Profile</dt>
        <dd>{metadata.profile}</dd>
        <dt>CRS</dt>
        <dd>
          {metadata.spatialReference?.wkid || metadata.spatialMetadata.sourceCrs?.toString() || 'Not advertised'}
        </dd>
        <dt>Capabilities</dt>
        <dd>{metadata.capabilities.join(', ') || 'None advertised'}</dd>
        <dt>URL</dt>
        <dd style={styles.urlValue}>{metadata.url}</dd>
      </dl>
      <h3 style={styles.sectionHeading}>Feature support</h3>
      <ul style={styles.supportList}>
        {(Object.entries(metadata.supportReport.features) as Array<[string, string]>).map(
          ([feature, status]) => (
          <li key={feature}>
            <span>{feature}</span>
            <strong data-status={status} style={styles.status}>
              {status}
            </strong>
          </li>
          )
        )}
      </ul>
      {metadata.supportReport.diagnostics.length ? (
        <>
          <h3 style={styles.sectionHeading}>Diagnostics</h3>
          <ul>
            {metadata.supportReport.diagnostics.map((diagnostic, index) => (
              <li key={`${diagnostic.code}-${index}`}>{diagnostic.message}</li>
            ))}
          </ul>
        </>
      ) : null}
    </section>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    boxSizing: 'border-box',
    padding: '48px max(24px, calc((100vw - 1100px) / 2))',
    background: '#10151c',
    color: '#e8edf3',
    fontFamily: 'Inter, ui-sans-serif, system-ui, sans-serif'
  },
  eyebrow: {margin: 0, color: '#66d9ef', fontSize: 12, letterSpacing: 1.5, textTransform: 'uppercase'},
  heading: {margin: '8px 0', fontSize: 42},
  lead: {maxWidth: 680, color: '#a9b5c2', fontSize: 18, lineHeight: 1.5},
  card: {marginTop: 28, padding: 24, border: '1px solid #2c3743', borderRadius: 12, background: '#171e27'},
  label: {display: 'block', marginBottom: 8, fontWeight: 600},
  urlRow: {display: 'flex', gap: 10},
  input: {flex: 1, minWidth: 0, padding: '12px 14px', border: '1px solid #465463', borderRadius: 6, background: '#0f141a', color: '#e8edf3', fontSize: 14},
  button: {padding: '12px 18px', border: 0, borderRadius: 6, background: '#66d9ef', color: '#091016', fontWeight: 700, cursor: 'pointer'},
  presetRow: {display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12},
  preset: {padding: '7px 10px', border: '1px solid #465463', borderRadius: 5, background: 'transparent', color: '#b9c6d3', cursor: 'pointer'},
  error: {color: '#ff8b8b', whiteSpace: 'pre-wrap'},
  grid: {display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 14, marginTop: 28},
  profileCard: {padding: 20, border: '1px solid #2c3743', borderRadius: 10, background: '#171e27'},
  profileHeading: {margin: '0 0 8px', fontSize: 20},
  profileDescription: {minHeight: 48, color: '#a9b5c2', lineHeight: 1.4},
  badge: {display: 'inline-block', padding: '4px 8px', borderRadius: 4, background: '#263543', color: '#9eabba', fontSize: 12},
  metadataHeader: {display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'start'},
  metadataTitle: {margin: '6px 0 0', fontSize: 28},
  versionBadge: {padding: '6px 10px', borderRadius: 5, background: '#234453', color: '#8ee8f5', whiteSpace: 'nowrap'},
  metadataGrid: {display: 'grid', gridTemplateColumns: '130px 1fr', gap: '10px 16px', marginTop: 24},
  urlValue: {overflowWrap: 'anywhere'},
  sectionHeading: {margin: '26px 0 10px', fontSize: 16},
  supportList: {listStyle: 'none', padding: 0, margin: 0},
  status: {float: 'right', color: '#8ee8f5'},
};

export function renderToDOM(container: HTMLElement): void {
  createRoot(container).render(<App />);
}
