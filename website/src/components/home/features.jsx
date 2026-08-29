import React from 'react';
import Link from '@docusaurus/Link';
import styled from 'styled-components';

/** Homepage capability metadata shared with the corresponding documentation heroes. */
export const FEATURE_CARDS = [
  {
    id: 'scan',
    eyebrow: 'Query architecture',
    title: 'Read less. Query sooner.',
    description:
      'Cloud-native scanning supports range reads, bounding-box filtering, projection, and predicates across most data formats, directly in the browser.',
    href: '/docs/developer-guide/common-scan-architecture',
    linkLabel: 'Explore scan architecture',
    badge: 'New in v5.0',
    tags: ['projection', 'predicates', 'range reads'],
    visual: 'scan',
    wide: true,
    tone: 'violet'
  },
  {
    id: 'loaders',
    eyebrow: 'Format coverage',
    title: 'Optimized, feature-rich parsers',
    description:
      'TypeScript-native, feature-complete, and optimized loaders for complex formats like LAZ and Parquet, with broad support across GIS, meshes, imagery, scenes, tiles, point clouds, and beyond.',
    href: '/docs/developer-guide/using-loaders',
    linkLabel: 'Choose a loader',
    tags: ['tables', 'GIS', '3D', 'point clouds'],
    visual: 'loaders',
    wide: true,
    tone: 'pink'
  },
  {
    id: '3d',
    eyebrow: '3D data formats',
    title: 'From scene files to streamed worlds.',
    description:
      'Load scene graphs, tiled worlds, point clouds, and their compressed payloads through TypeScript implementations with detailed format coverage.',
    href: '/docs/developer-guide/3d-data-formats',
    linkLabel: 'Explore 3D data formats',
    tags: ['glTF', '3D Tiles', 'I3S', 'COPC'],
    visual: '3d',
    wide: true,
    tone: 'blue'
  },
  {
    id: 'streaming',
    eyebrow: 'Progressive data',
    title: 'No waiting. Process data as it arrives.',
    description:
      'Process large files incrementally with async iterators, batched loaders, transforms, and backpressure-friendly flows.',
    href: '/docs/developer-guide/using-streaming-loaders',
    linkLabel: 'Build streaming pipelines',
    tags: ['batches', 'transforms', 'async iterators'],
    visual: 'streaming',
    tone: 'mint'
  },
  {
    id: 'workers',
    eyebrow: 'Runtime performance',
    title: 'Keep the UI responsive.',
    description:
      'Move parsing and decompression off the main thread with reusable workers and transferable binary data.',
    href: '/docs/developer-guide/using-worker-loaders',
    linkLabel: 'Use worker loaders',
    tags: ['workers', 'parallel', 'transferable'],
    visual: 'workers',
    tone: 'blue'
  },
  {
    id: 'arrow',
    eyebrow: 'Common data plane',
    title: 'Many data formats. One table shape.',
    description:
      'Use Apache Arrow as a fast, typed in-memory representation between loaders, applications, workers, and writers.',
    href: '/docs/developer-guide/apache-arrow',
    linkLabel: 'Meet the Arrow data plane',
    tags: ['typed columns', 'zero-copy', 'Arrow IPC'],
    visual: 'arrow',
    tone: 'cyan'
  },
  {
    id: 'categories',
    eyebrow: 'Composable APIs',
    title: 'Design apps around your data, not data formats.',
    description:
      'Loader categories normalize related formats into shared structures, so your application code can stay focused on the data.',
    href: '/docs/developer-guide/loader-categories',
    linkLabel: 'See loader categories',
    tags: ['mesh', 'table', 'GIS', 'scenegraph'],
    visual: 'categories',
    tone: 'yellow'
  },
  {
    id: 'crs',
    eyebrow: 'Geospatial foundations',
    title: 'Coordinates with context.',
    description:
      'Preserve CRS metadata across GeoParquet, GeoArrow, WKT, and more—so location data stays meaningful from file to map.',
    href: '/docs/developer-guide/coordinate-reference-systems',
    linkLabel: 'Understand CRS support',
    badge: 'New in v5.0',
    tags: ['GeoParquet', 'GeoArrow', 'WKT'],
    visual: 'crs',
    tone: 'orange'
  }
];

/** The small set of capability entry points that belongs on the homepage. */
export const HOME_FEATURE_IDS = ['scan', 'loaders', '3d', 'streaming'];

const FeatureSection = styled.section`
  background: #0d1521;
  color: #f4f8fb;
  overflow: hidden;
  padding: ${(props) => (props.$compact ? '72px 64px 80px' : '112px 64px 120px')};
  position: relative;

  &::before {
    background:
      radial-gradient(circle at 9% 15%, rgba(0, 173, 230, 0.18), transparent 23rem),
      radial-gradient(circle at 87% 65%, rgba(124, 92, 255, 0.15), transparent 28rem);
    content: '';
    inset: 0;
    pointer-events: none;
    position: absolute;
  }

  @media screen and (max-width: 996px) {
    padding: ${(props) => (props.$compact ? '60px 32px 68px' : '88px 32px 96px')};
  }

  @media screen and (max-width: 640px) {
    padding: ${(props) => (props.$compact ? '48px 20px 56px' : '68px 20px 76px')};
  }
`;

const FeatureContent = styled.div`
  margin: 0 auto;
  max-width: 1240px;
  position: relative;
`;

const FeatureIntro = styled.div`
  align-items: end;
  display: grid;
  gap: 48px;
  grid-template-columns: minmax(0, 1.15fr) minmax(260px, 0.85fr);
  margin-bottom: 52px;

  @media screen and (max-width: 820px) {
    gap: 22px;
    grid-template-columns: 1fr;
  }
`;

const FeatureEyebrow = styled.p`
  color: #78d8f5;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.15em;
  line-height: 1.4;
  margin: 0 0 16px;
  text-transform: uppercase;
`;

const FeatureTitle = styled.h2`
  color: #ffffff;
  font-size: clamp(2.8rem, 6vw, 5.8rem);
  font-weight: 800;
  letter-spacing: -0.065em;
  line-height: 0.95;
  margin: 0;
  max-width: 780px;
`;

const FeatureLead = styled.p`
  color: rgba(229, 240, 247, 0.72);
  font-size: 17px;
  line-height: 1.65;
  margin: 0 0 4px;
  max-width: 390px;
`;

const FeatureGrid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: repeat(2, minmax(0, 1fr));

  @media screen and (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const toneColors = {
  violet: {accent: '#9b8cff', glow: 'rgba(117, 95, 255, 0.35)'},
  orange: {accent: '#ffb36b', glow: 'rgba(255, 133, 74, 0.32)'},
  mint: {accent: '#75e0ba', glow: 'rgba(48, 198, 143, 0.25)'},
  blue: {accent: '#70c7ff', glow: 'rgba(37, 137, 255, 0.3)'},
  cyan: {accent: '#51e2f4', glow: 'rgba(0, 192, 230, 0.28)'},
  pink: {accent: '#f693c6', glow: 'rgba(236, 86, 161, 0.28)'},
  yellow: {accent: '#f0d877', glow: 'rgba(231, 177, 38, 0.28)'}
};

const FeatureCard = styled(Link)`
  --card-accent: ${(props) => toneColors[props.$tone].accent};
  --card-glow: ${(props) => toneColors[props.$tone].glow};
  background: linear-gradient(145deg, rgba(26, 39, 56, 0.98), rgba(17, 27, 41, 0.96));
  border: 1px solid rgba(172, 198, 217, 0.2);
  border-radius: 24px;
  box-shadow: 0 24px 70px rgba(0, 0, 0, 0.18);
  display: flex;
  flex-direction: column;
  grid-column: ${(props) => (props.$wide ? 'span 2' : 'span 1')};
  min-height: 348px;
  overflow: hidden;
  padding: 30px;
  position: relative;
  text-decoration: none;
  transition:
    border-color 180ms ease,
    box-shadow 180ms ease,
    transform 180ms ease;

  &::before {
    background: radial-gradient(circle, var(--card-glow) 0%, transparent 68%);
    content: '';
    height: 430px;
    pointer-events: none;
    position: absolute;
    right: -145px;
    top: -175px;
    width: 430px;
  }

  &:hover {
    border-color: color-mix(in srgb, var(--card-accent) 58%, transparent);
    box-shadow: 0 30px 80px rgba(0, 0, 0, 0.3);
    text-decoration: none;
    transform: translateY(-4px);
  }

  &:focus-visible {
    border-color: var(--card-accent);
    box-shadow:
      0 30px 80px rgba(0, 0, 0, 0.3),
      0 0 0 3px color-mix(in srgb, var(--card-accent) 45%, transparent);
    outline: none;
  }

  @media screen and (max-width: 760px) {
    grid-column: span 1;
    min-height: 320px;
    padding: 24px;
  }
`;

const CompactFeatureCard = styled(FeatureCard)`
  grid-column: span 1;
  min-height: 218px;
  padding: 24px;

  @media screen and (max-width: 760px) {
    min-height: 204px;
    padding: 22px;
  }
`;

const CardBody = styled.div`
  max-width: ${(props) => (props.$wide ? '470px' : '420px')};
  position: relative;
  z-index: 1;
`;

const CardEyebrow = styled.p`
  align-items: center;
  color: var(--card-accent);
  display: flex;
  flex-wrap: wrap;
  font-size: 11px;
  font-weight: 800;
  gap: 9px;
  letter-spacing: 0.13em;
  line-height: 1.3;
  margin: 0 0 14px;
  text-transform: uppercase;
`;

const CardBadge = styled.span`
  background: color-mix(in srgb, var(--card-accent) 14%, transparent);
  border: 1px solid color-mix(in srgb, var(--card-accent) 54%, transparent);
  border-radius: 999px;
  color: #ffffff;
  font-size: 8px;
  letter-spacing: 0.08em;
  line-height: 1;
  padding: 4px 6px;
`;

const CardTitle = styled.h3`
  color: #ffffff;
  font-size: clamp(1.8rem, 3vw, 2.5rem);
  font-weight: 800;
  letter-spacing: -0.045em;
  line-height: 0.98;
  margin: 0 0 14px;
  max-width: 410px;
`;

const CardDescription = styled.p`
  color: rgba(229, 240, 247, 0.68);
  font-size: 14px;
  line-height: 1.6;
  margin: 0;
  max-width: 430px;
`;

const CardFooter = styled.div`
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  justify-content: space-between;
  margin-top: auto;
  max-width: ${(props) => (props.$wide ? '58%' : '56%')};
  padding-top: 34px;
  position: relative;
  z-index: 1;

  @media screen and (max-width: 560px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 12px;
    max-width: 100%;
  }
`;

const CompactCardFooter = styled(CardFooter)`
  max-width: 100%;
  padding-top: 22px;
`;

const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
`;

const Tag = styled.span`
  border: 1px solid rgba(206, 228, 240, 0.2);
  border-radius: 999px;
  color: rgba(229, 240, 247, 0.62);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 7px 9px;
`;

const CardLink = styled.span`
  align-items: center;
  color: var(--card-accent);
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 12px;
  font-weight: 800;
  gap: 8px;
  line-height: 1.35;
  text-decoration: none;
  white-space: normal;

  &::after {
    content: '↗';
    font-size: 14px;
  }
`;

const CardVisual = styled.div`
  bottom: 20px;
  opacity: 0.92;
  pointer-events: none;
  position: absolute;
  right: 28px;
  width: ${(props) => (props.$wide ? '45%' : '43%')};

  @media screen and (max-width: 560px) {
    opacity: 0.55;
    right: -8px;
    width: 55%;
  }
`;

const ScanVisual = styled(CardVisual)`
  bottom: 14px;
  height: 150px;
  width: 48%;

  svg {
    height: 100%;
    overflow: visible;
    width: 100%;
  }

  .scan-cloud {
    fill: rgba(155, 140, 255, 0.12);
    stroke: rgba(181, 170, 255, 0.72);
    stroke-width: 1.5;
  }

  .scan-data {
    fill: rgba(181, 170, 255, 0.3);
  }

  .scan-path {
    fill: none;
    stroke: rgba(155, 140, 255, 0.24);
    stroke-linecap: round;
    stroke-width: 1.5;
  }

  .scan-selected-path {
    fill: none;
    stroke: var(--card-accent);
    stroke-linecap: round;
    stroke-width: 2;
  }

  .scan-lens-glow {
    fill: rgba(117, 95, 255, 0.1);
    stroke: rgba(155, 140, 255, 0.15);
    stroke-width: 12;
  }

  .scan-lens {
    fill: rgba(13, 21, 33, 0.38);
    stroke: var(--card-accent);
    stroke-width: 2;
  }

  .scan-handle {
    stroke: var(--card-accent);
    stroke-linecap: round;
    stroke-width: 7;
  }

  .scan-selected {
    fill: var(--card-accent);
  }

  .scan-rejected {
    fill: rgba(155, 140, 255, 0.18);
  }
`;

const CrsVisual = styled(CardVisual)`
  height: 142px;
  width: 42%;

  &::before {
    background:
      linear-gradient(35deg, transparent 48%, rgba(255, 179, 107, 0.55) 49%, transparent 51%),
      linear-gradient(145deg, transparent 48%, rgba(255, 179, 107, 0.42) 49%, transparent 51%);
    border: 1px solid rgba(255, 179, 107, 0.5);
    border-radius: 50%;
    content: '';
    inset: 12px 14px;
    position: absolute;
  }

  &::after {
    border: 1px dashed rgba(255, 179, 107, 0.8);
    border-radius: 50%;
    content: '';
    height: 72px;
    position: absolute;
    right: 30px;
    top: 26px;
    width: 72px;
  }
`;

const CrsCode = styled.span`
  background: rgba(255, 179, 107, 0.16);
  border: 1px solid rgba(255, 179, 107, 0.55);
  border-radius: 8px;
  bottom: 12px;
  color: var(--card-accent);
  font-family: monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 6px 8px;
  position: absolute;
  right: 0;
`;

const StreamingVisual = styled(CardVisual)`
  display: grid;
  gap: 8px;
`;

const StreamLine = styled.div`
  align-items: center;
  display: flex;
  gap: 5px;
`;

const StreamBlock = styled.span`
  background: ${(props) => (props.$active ? 'var(--card-accent)' : 'rgba(117, 224, 186, 0.23)')};
  border-radius: 4px;
  height: ${(props) => (props.$tall ? '27px' : '17px')};
  width: ${(props) => props.$width || '20px'};
`;

const StreamArrow = styled.span`
  color: var(--card-accent);
  font-size: 15px;
  margin: 0 3px;
`;

const WorkersVisual = styled(CardVisual)`
  align-items: center;
  display: flex;
  gap: 10px;
  justify-content: end;
`;

const WorkerBox = styled.div`
  border: 1px solid ${(props) => (props.$active ? 'var(--card-accent)' : 'rgba(112, 199, 255, 0.35)')};
  border-radius: 10px;
  color: ${(props) => (props.$active ? 'var(--card-accent)' : 'rgba(229, 240, 247, 0.5)')};
  font-family: monospace;
  font-size: 10px;
  padding: 14px 10px;
  text-align: center;
  width: 72px;
`;

const WorkerArrow = styled.span`
  color: var(--card-accent);
  font-size: 18px;
`;

const ArrowVisual = styled(CardVisual)`
  align-items: end;
  display: flex;
  gap: 7px;
  height: 134px;
  justify-content: end;
`;

const ArrowColumn = styled.div`
  display: grid;
  gap: 5px;
  width: ${(props) => props.$width || '30px'};
`;

const ArrowCell = styled.span`
  background: ${(props) => (props.$header ? 'var(--card-accent)' : 'rgba(81, 226, 244, 0.22)')};
  border-radius: 3px;
  display: block;
  height: ${(props) => (props.$header ? '10px' : '18px')};
`;

const LoaderVisual = styled(CardVisual)`
  display: grid;
  gap: 7px;
  transform: rotate(-5deg);
`;

const LoaderChip = styled.div`
  align-items: center;
  background: rgba(246, 147, 198, 0.13);
  border: 1px solid rgba(246, 147, 198, 0.48);
  border-radius: 8px;
  color: ${(props) => (props.$active ? 'var(--card-accent)' : 'rgba(229, 240, 247, 0.58)')};
  display: flex;
  font-family: monospace;
  font-size: 10px;
  justify-content: space-between;
  padding: 8px 10px;

  &::after {
    color: var(--card-accent);
    content: '↗';
  }
`;

const ThreeDVisual = styled(CardVisual)`
  align-content: center;
  display: grid;
  gap: 8px;
  height: 168px;
  width: 48%;
`;

const ThreeDRow = styled.div`
  align-items: center;
  display: flex;
  gap: 7px;
  min-width: 0;
`;

const ThreeDRowLabel = styled.span`
  color: rgba(229, 240, 247, 0.46);
  flex: 0 0 52px;
  font-family: monospace;
  font-size: 9px;
  text-transform: uppercase;
`;

const ThreeDChip = styled.span`
  background: rgba(112, 199, 255, 0.13);
  border: 1px solid rgba(112, 199, 255, 0.48);
  border-radius: 7px;
  color: ${(props) => (props.$active ? 'var(--card-accent)' : 'rgba(229, 240, 247, 0.72)')};
  flex: 0 1 auto;
  font-family: monospace;
  font-size: 10px;
  min-width: 0;
  padding: 7px 8px;
  white-space: nowrap;
`;

const CategoriesVisual = styled(CardVisual)`
  height: 150px;
`;

const CategoryCircle = styled.div`
  align-items: center;
  background: rgba(240, 216, 119, 0.15);
  border: 1px solid var(--card-accent);
  border-radius: 50%;
  color: var(--card-accent);
  display: flex;
  font-family: monospace;
  font-size: 11px;
  height: 84px;
  justify-content: center;
  left: 50%;
  position: absolute;
  top: 32px;
  transform: translateX(-50%);
  width: 84px;
`;

const CategoryNode = styled.span`
  background: rgba(240, 216, 119, 0.12);
  border: 1px solid rgba(240, 216, 119, 0.42);
  border-radius: 5px;
  color: rgba(240, 216, 119, 0.88);
  font-family: monospace;
  font-size: 8px;
  padding: 5px 6px;
  position: absolute;
  right: ${(props) => props.$right};
  top: ${(props) => props.$top};
`;

/**
 * Renders the decorative visualization selected for a feature card.
 * @param {{type: string, wide?: boolean}} props Component properties.
 * @returns {React.ReactElement} The selected feature visualization.
 */
export function RenderFeatureVisual({type, wide}) {
  if (type === 'scan') {
    return (
      <ScanVisual $wide={wide} aria-hidden="true">
        <svg viewBox="0 0 280 150">
          <path
            className="scan-cloud"
            d="M17 65c-8 0-14-6-14-14s6-14 14-14h2c2-14 14-25 29-25 13 0 24 8 28 20 10 0 18 7 18 17s-8 16-18 16H17z"
          />

          <path className="scan-path" d="M71 48 C95 48 104 50 121 54" />
          <path className="scan-path" d="M76 58 C97 58 108 60 119 62" />
          <path className="scan-path" d="M76 69 C98 69 108 69 117 69" />
          <path className="scan-path" d="M74 80 C98 80 108 78 119 76" />
          <path className="scan-path" d="M66 90 C94 90 105 86 121 83" />

          <g className="scan-data">
            <rect x="72" y="44" width="12" height="7" rx="3" />
            <rect x="88" y="44" width="8" height="7" rx="3" />
            <rect x="78" y="55" width="7" height="7" rx="3" />
            <rect x="89" y="55" width="14" height="7" rx="3" />
            <rect x="78" y="66" width="11" height="7" rx="3" />
            <rect x="93" y="66" width="7" height="7" rx="3" />
            <rect x="76" y="77" width="9" height="7" rx="3" />
            <rect x="89" y="77" width="13" height="7" rx="3" />
            <rect x="68" y="87" width="13" height="7" rx="3" />
            <rect x="85" y="87" width="8" height="7" rx="3" />
          </g>

          <circle className="scan-lens-glow" cx="151" cy="69" r="42" />
          <circle className="scan-lens" cx="151" cy="69" r="42" />
          <line className="scan-handle" x1="181" y1="99" x2="211" y2="129" />

          <path className="scan-selected-path" d="M124 57 C145 57 161 46 184 43 C207 40 226 40 254 40" />
          <path className="scan-selected-path" d="M124 76 C147 76 161 86 184 92 C207 98 226 99 258 99" />
          <path className="scan-path" d="M123 66 C148 66 166 67 191 68 C212 69 227 65 248 60" />
          <path className="scan-path" d="M126 84 C147 88 158 101 174 111 C190 121 207 126 229 130" />

          <g className="scan-selected">
            <rect x="207" y="35" width="13" height="9" rx="4" />
            <rect x="225" y="35" width="8" height="9" rx="4" />
            <rect x="238" y="35" width="16" height="9" rx="4" />
            <rect x="209" y="94" width="9" height="9" rx="4" />
            <rect x="223" y="94" width="15" height="9" rx="4" />
            <rect x="243" y="94" width="10" height="9" rx="4" />
          </g>
          <g className="scan-rejected">
            <rect x="205" y="64" width="10" height="7" rx="3" />
            <rect x="220" y="60" width="7" height="7" rx="3" />
            <rect x="189" y="116" width="9" height="7" rx="3" />
            <rect x="203" y="122" width="13" height="7" rx="3" />
          </g>
        </svg>
      </ScanVisual>
    );
  }

  if (type === 'crs') {
    return (
      <CrsVisual $wide={wide} aria-hidden="true">
        <CrsCode>EPSG:4326</CrsCode>
      </CrsVisual>
    );
  }

  if (type === 'streaming') {
    return (
      <StreamingVisual $wide={wide} aria-hidden="true">
        {[false, true, false].map((active, index) => (
          <StreamLine key={index}>
            <StreamBlock $active={active} $width="18px" />
            <StreamBlock $active={active} $tall $width="30px" />
            <StreamBlock $active={active} $width="22px" />
            <StreamArrow>→</StreamArrow>
            <StreamBlock $active={active} $width="36px" />
          </StreamLine>
        ))}
      </StreamingVisual>
    );
  }

  if (type === 'workers') {
    return (
      <WorkersVisual $wide={wide} aria-hidden="true">
        <WorkerBox $active>main thread</WorkerBox>
        <WorkerArrow>→</WorkerArrow>
        <WorkerBox $active>worker 01</WorkerBox>
        <WorkerBox>worker 02</WorkerBox>
      </WorkersVisual>
    );
  }

  if (type === 'arrow') {
    return (
      <ArrowVisual $wide={wide} aria-hidden="true">
        {[['40px', 4], ['28px', 5], ['34px', 4], ['23px', 5]].map(([width, rows], index) => (
          <ArrowColumn key={index} $width={width}>
            <ArrowCell $header />
            {Array.from({length: rows}, (_, rowIndex) => (
              <ArrowCell key={rowIndex} />
            ))}
          </ArrowColumn>
        ))}
      </ArrowVisual>
    );
  }

  if (type === 'loaders') {
    return (
      <LoaderVisual $wide={wide} aria-hidden="true">
        <LoaderChip $active>ParquetLoader</LoaderChip>
        <LoaderChip>GeoJSONLoader</LoaderChip>
        <LoaderChip $active>GLTFLoader</LoaderChip>
        <LoaderChip>LASLoader</LoaderChip>
      </LoaderVisual>
    );
  }

  if (type === '3d') {
    return (
      <ThreeDVisual $wide={wide} aria-hidden="true">
        <ThreeDRow>
          <ThreeDRowLabel>scene</ThreeDRowLabel>
          <ThreeDChip $active>glTF</ThreeDChip>
          <ThreeDChip>GLB</ThreeDChip>
          <ThreeDChip>USD</ThreeDChip>
        </ThreeDRow>
        <ThreeDRow>
          <ThreeDRowLabel>world</ThreeDRowLabel>
          <ThreeDChip $active>3D Tiles</ThreeDChip>
          <ThreeDChip>I3S</ThreeDChip>
        </ThreeDRow>
        <ThreeDRow>
          <ThreeDRowLabel>points</ThreeDRowLabel>
          <ThreeDChip $active>COPC</ThreeDChip>
          <ThreeDChip>Potree</ThreeDChip>
          <ThreeDChip>LAS</ThreeDChip>
        </ThreeDRow>
        <ThreeDRow>
          <ThreeDRowLabel>payload</ThreeDRowLabel>
          <ThreeDChip>Draco</ThreeDChip>
          <ThreeDChip>meshopt</ThreeDChip>
          <ThreeDChip $active>KTX2</ThreeDChip>
        </ThreeDRow>
      </ThreeDVisual>
    );
  }

  return (
    <CategoriesVisual $wide={wide} aria-hidden="true">
      <CategoryCircle>category</CategoryCircle>
      <CategoryNode $right="0" $top="6px">table</CategoryNode>
      <CategoryNode $right="0" $top="115px">mesh</CategoryNode>
      <CategoryNode $right="calc(50% + 55px)" $top="6px">GIS</CategoryNode>
      <CategoryNode $right="calc(50% + 55px)" $top="115px">scenegraph</CategoryNode>
    </CategoriesVisual>
  );
}

/**
 * Renders feature cards for the loaders.gl tentpole capabilities.
 * @param {{showVisuals?: boolean, featureIds?: string[]}} props Component properties.
 */
export default function Features({showVisuals = true, featureIds}) {
  const CardComponent = showVisuals ? FeatureCard : CompactFeatureCard;
  const FooterComponent = showVisuals ? CardFooter : CompactCardFooter;
  const cards = featureIds
    ? featureIds
        .map((featureId) => FEATURE_CARDS.find((feature) => feature.id === featureId))
        .filter(Boolean)
    : FEATURE_CARDS;

  return (
    <FeatureSection $compact={!showVisuals}>
      <FeatureContent>
        <FeatureIntro>
          <div>
            <FeatureEyebrow>The loaders.gl data plane</FeatureEyebrow>
            <FeatureTitle>Data in. Insight out.</FeatureTitle>
          </div>
          <FeatureLead>
            A standards-first toolkit for loading, scanning, transforming, and visualizing the
            formats that power modern geospatial and 3D applications.
          </FeatureLead>
        </FeatureIntro>

        <FeatureGrid>
          {cards.map((feature) => (
            <CardComponent
              key={feature.id}
              to={feature.href}
              aria-label={`${feature.title} — ${feature.linkLabel}`}
              $tone={feature.tone}
              $wide={feature.wide}
            >
              <CardBody $wide={feature.wide}>
                <CardEyebrow>
                  {feature.eyebrow}
                  {feature.badge && <CardBadge>{feature.badge}</CardBadge>}
                </CardEyebrow>
                <CardTitle>{feature.title}</CardTitle>
                <CardDescription>{feature.description}</CardDescription>
              </CardBody>
              {showVisuals && <RenderFeatureVisual type={feature.visual} wide={feature.wide} />}
              <FooterComponent $wide={feature.wide}>
                <TagList>
                  {feature.tags.map((tag) => (
                    <Tag key={tag}>{tag}</Tag>
                  ))}
                </TagList>
                <CardLink>{feature.linkLabel}</CardLink>
              </FooterComponent>
            </CardComponent>
          ))}
        </FeatureGrid>
      </FeatureContent>
    </FeatureSection>
  );
}
