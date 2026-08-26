import React from 'react';
// Note: this is internal API and may change in a future release
// https://github.com/facebook/docusaurus/discussions/7457
import useBaseUrl from '@docusaurus/useBaseUrl';
import {useDocsSidebar} from '@docusaurus/plugin-content-docs/client';
import {
  MainExamples,
  ExamplesGroup,
  ExampleCard,
  ExampleHeader,
  ExampleLogo,
  ExampleTitle
} from './styled';
import {CURATED_EXAMPLES} from '../../../../examples/website/shared/example-catalog';

const DEFAULT_EXAMPLE_THUMBNAIL = '/images/maps.jpg';

function renderItem(item, getThumbnail, getLogo, defaultThumbnail) {
  const imageUrl = useBaseUrl(getThumbnail(item));
  const logoPath = getLogo?.(item);
  const logoUrl = useBaseUrl(logoPath || '');
  const fallbackImageUrl = useBaseUrl(defaultThumbnail);
  const {label, href} = item;

  return (
    <ExampleCard key={label} href={href}>
      {logoPath ? (
        <ExampleLogo>
          <img src={logoUrl} alt={`${label} logo`} />
        </ExampleLogo>
      ) : (
        <img
          width="100%"
          src={imageUrl}
          alt={label}
          onError={(event) => {
            const image = event.currentTarget;
            image.onerror = null;
            image.src = fallbackImageUrl;
          }}
        />
      )}
      <ExampleTitle>
        <span>{label}</span>
      </ExampleTitle>
    </ExampleCard>
  );
}

function renderCategory({label, items}, getThumbnail, getLogo, defaultThumbnail) {
  return [
    <ExampleHeader key={`${label}-header`}>{label}</ExampleHeader>,
    <ExamplesGroup key={label}>
      {items.map(item => renderItem(item, getThumbnail, getLogo, defaultThumbnail))}
    </ExamplesGroup>
  ];
}

export default function ExamplesIndex({
  getThumbnail,
  getLogo,
  defaultThumbnail = DEFAULT_EXAMPLE_THUMBNAIL
}) {
  const mainSidebar = useDocsSidebar();
  const sidebarItems = mainSidebar?.items?.[0]?.items || mainSidebar?.items || [];
  const featuredImageUrl = useBaseUrl('/images/maps.jpg');

  return (
    <MainExamples>
      <ExampleHeader>Featured datasets</ExampleHeader>
      <ExamplesGroup>
        {CURATED_EXAMPLES.map(example => (
          <ExampleCard key={example.id} href={getExampleHref(example.surface, example.format)}>
            <img width="100%" src={featuredImageUrl} alt="" />
            <ExampleTitle>
              <span>{example.label}</span>
              <small>{example.description}</small>
            </ExampleTitle>
          </ExampleCard>
        ))}
      </ExamplesGroup>
      {sidebarItems.map(item => {
        if (item.type === 'category' && item.items && item.label) {
          return renderCategory(item, getThumbnail, getLogo, defaultThumbnail);
        }
        return null;
      })}
    </MainExamples>
  );
}

function getExampleHref(surface: string, format: string): string {
  if (surface === 'tiles') {
    return format.toLowerCase() === 'pmtiles' ? '/examples/tiles/pmtiles' : '/examples/tiles/mvt';
  }
  if (surface === 'pointcloud') {
    return `/examples/pointclouds/${format.toLowerCase()}`;
  }
  return `/examples/geospatial/${format.toLowerCase()}`;
}
