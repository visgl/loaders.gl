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
  ExampleTitle
} from './styled';

const DEFAULT_EXAMPLE_THUMBNAIL = '/images/maps.jpg';

function renderItem(item, getThumbnail, defaultThumbnail) {
  const imageUrl = useBaseUrl(getThumbnail(item));
  const fallbackImageUrl = useBaseUrl(defaultThumbnail);
  const {label, href} = item;

  return (
    <ExampleCard key={label} href={href}>
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
      <ExampleTitle>
        <span>{label}</span>
      </ExampleTitle>
    </ExampleCard>
  );
}

function renderCategory({label, items}, getThumbnail, defaultThumbnail) {
  return [
    <ExampleHeader key={`${label}-header`}>{label}</ExampleHeader>,
    <ExamplesGroup key={label}>
      {items.map(item => renderItem(item, getThumbnail, defaultThumbnail))}
    </ExamplesGroup>
  ];
}

export default function ExamplesIndex({
  getThumbnail,
  defaultThumbnail = DEFAULT_EXAMPLE_THUMBNAIL
}) {
  const mainSidebar = useDocsSidebar();
  const sidebar = mainSidebar.items[0];
  return <MainExamples>
    {sidebar.items.map(item => {
      if (item.type === 'category' && item.items && item.label) {
        return renderCategory(item, getThumbnail, defaultThumbnail);
      }
      return null;
    })}
  </MainExamples>;
}
