import React from 'react';
import useBaseUrl from '@docusaurus/useBaseUrl';
import styles from './supporter-logos.module.css';

/** Displays organizational supporters with consistent logo frames and optical sizing. */
export function SupporterLogos() {
  const imageBaseUrl = useBaseUrl('/images/supporters');
  return (
    <div className={styles.grid}>
      <a className={styles.card} href="https://studio.foursquare.com" aria-label="Foursquare">
        <img src={`${imageBaseUrl}/foursquare.svg`} alt="Foursquare" loading="lazy" />
      </a>
      <a className={styles.card} href="https://carto.com" aria-label="CARTO">
        <img src={`${imageBaseUrl}/carto.svg`} alt="CARTO" loading="lazy" />
      </a>
      <a className={`${styles.card} ${styles.actionEngine}`} href="https://actionengine.com" aria-label="Action Engine">
        <img src={`${imageBaseUrl}/action-engine.svg`} alt="Action Engine" loading="lazy" />
      </a>
      <a className={`${styles.card} ${styles.esri}`} href="https://esri.com" aria-label="Esri">
        <img src={`${imageBaseUrl}/esri.jpg`} alt="Esri" loading="lazy" />
      </a>
      <a className={`${styles.card} ${styles.actionEngine}`} href="https://uber.com" aria-label="Uber">
        <img src={`${imageBaseUrl}/uber.png`} alt="Uber" loading="lazy" />
      </a>
    </div>
  );
}
