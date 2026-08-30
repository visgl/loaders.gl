import React from 'react';
import {ClientExample, Home} from '../components';
import Layout from '@theme/Layout';
import Features, {HOME_FEATURE_IDS} from '../components/home/features';

/** Renders the homepage example behind the shared client-only loading boundary. */
function HeroExample() {
  return <ClientExample kind="home" />;
}

export default function IndexPage() {
  return (
    <Layout
      title="Home"
      description="A standards-obsessed toolkit for loading, scanning, transforming, and visualizing the data formats that power modern cloud compute and web visualization."
    >
      <Home HeroExample={HeroExample}>
        <Features showVisuals={false} featureIds={HOME_FEATURE_IDS} />
      </Home>
    </Layout>
  );
}
