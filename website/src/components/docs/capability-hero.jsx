import React, {useEffect, useRef} from 'react';
import Link from '@docusaurus/Link';

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
 * @param {{capability: string, eyebrow?: string, title?: string, description?: string, links?: Array<{label: string, to: string}>, logos?: Array<{alt: string, href?: string, src: string}>}} props Component properties.
 * @returns {React.ReactElement} The documentation capability hero.
 */
export function CapabilityHero({
  capability,
  eyebrow,
  title,
  description,
  links = [],
  logos = []
}) {
  const feature = FEATURE_CARDS.find((candidate) => candidate.id === capability);
  const heroReference = useRef(null);

  useEffect(() => {
    const heroElement = heroReference.current;
    const markdownElement = heroElement?.closest('.theme-doc-markdown');
    const badgeTarget = heroElement?.querySelector('[data-capability-hero-badges]');

    if (!markdownElement || !badgeTarget) {
      return;
    }

    const badgeParagraphs = Array.from(markdownElement.children).filter(
      (element) => element instanceof HTMLElement && element.classList.contains('badges')
    );

    for (const badgeParagraph of badgeParagraphs) {
      badgeTarget.append(...Array.from(badgeParagraph.childNodes));
      badgeParagraph.remove();
    }
  }, []);

  if (!feature) {
    throw new Error(`Unknown capability hero: ${capability}`);
  }

  const colors = TONE_COLORS[feature.tone];

  return (
    <section
      className={styles.hero}
      style={{'--card-accent': colors.accent, '--card-glow': colors.glow}}
      aria-labelledby="capability-hero-title"
      ref={heroReference}
    >
      <div className={styles.body}>
        <div className={styles.topline}>
          <p className={styles.eyebrow}>
            {eyebrow || feature.eyebrow}
            {feature.badge && <span className={styles.badge}>{feature.badge}</span>}
          </p>
          <div className={styles.toplineActions}>
            {logos.length > 0 && (
              <div className={styles.logos} aria-label="Standards and ecosystem logos">
                {logos.map((logo) => {
                  const image = <img src={logo.src} alt={logo.alt} />;
                  return logo.href ? (
                    <a className={styles.logoLink} href={logo.href} key={logo.src}>
                      {image}
                    </a>
                  ) : (
                    <span className={styles.logoLink} key={logo.src}>
                      {image}
                    </span>
                  );
                })}
              </div>
            )}
            <div className={styles.statusBadges} data-capability-hero-badges aria-label="Page status" />
          </div>
        </div>
        <h1 className={styles.title} id="capability-hero-title">
          {title || feature.title}
        </h1>
        <p className={styles.description}>{description || feature.description}</p>
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
      {links.length > 0 && (
        <nav className={styles.links} aria-label="Related documentation">
          {links.map((link) => (
            <Link className={styles.link} key={link.to} to={link.to}>
              {link.label} <span aria-hidden="true">↗</span>
            </Link>
          ))}
        </nav>
      )}
    </section>
  );
}
