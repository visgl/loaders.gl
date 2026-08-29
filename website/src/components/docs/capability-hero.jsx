import React from 'react';

import {FEATURE_CARDS, RenderFeatureVisual} from '../home/features';
import styles from './capability-hero.module.css';

const TONE_COLORS = {
  violet: {accent: '#9b8cff', glow: 'rgba(117, 95, 255, 0.35)'},
  orange: {accent: '#ffb36b', glow: 'rgba(255, 133, 74, 0.32)'},
  mint: {accent: '#75e0ba', glow: 'rgba(48, 198, 143, 0.25)'},
  blue: {accent: '#70c7ff', glow: 'rgba(37, 137, 255, 0.3)'},
  cyan: {accent: '#51e2f4', glow: 'rgba(0, 192, 230, 0.28)'},
  pink: {accent: '#f693c6', glow: 'rgba(236, 86, 161, 0.28)'},
  yellow: {accent: '#f0d877', glow: 'rgba(231, 177, 38, 0.28)'}
};

/**
 * Renders the welcoming capability card shared by a homepage tentpole and its documentation page.
 * @param {{capability: string}} props Component properties.
 * @returns {React.ReactElement} The documentation capability hero.
 */
export function CapabilityHero({capability}) {
  const feature = FEATURE_CARDS.find((candidate) => candidate.id === capability);

  if (!feature) {
    throw new Error(`Unknown capability hero: ${capability}`);
  }

  const colors = TONE_COLORS[feature.tone];

  return (
    <section
      className={styles.hero}
      style={{'--card-accent': colors.accent, '--card-glow': colors.glow}}
      aria-label={`${feature.eyebrow}: ${feature.title}`}
    >
      <div className={styles.body}>
        <p className={styles.eyebrow}>
          {feature.eyebrow}
          {feature.badge && <span className={styles.badge}>{feature.badge}</span>}
        </p>
        <h2 className={styles.title}>{feature.title}</h2>
        <p className={styles.description}>{feature.description}</p>
        <div className={styles.tags} aria-label="Capability highlights">
          {feature.tags.map((tag) => (
            <span className={styles.tag} key={tag}>
              {tag}
            </span>
          ))}
        </div>
      </div>
      <div className={styles.visual}>
        <RenderFeatureVisual type={feature.visual} wide />
      </div>
    </section>
  );
}
