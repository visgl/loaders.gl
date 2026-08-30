import React, {type ReactNode, useEffect, useRef, useState} from 'react';

import styles from './doc-live-example.module.css';

/** Properties for the reusable documentation demo frame. */
export type DocLiveExampleProps = {
  /** Accessible name for the embedded example. */
  label: string;
  /** Example application rendered inside the frame. */
  children: ReactNode;
  /** Reserved height of the embedded, non-fullscreen example. */
  height?: string;
};

/**
 * Frames a visual example without letting map or scene controls capture page scrolling.
 * Interaction is enabled when the reader opens the frame fullscreen.
 */
export function DocLiveExample({
  label,
  children,
  height = '420px'
}: DocLiveExampleProps): ReactNode {
  const frameReference = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(document.fullscreenElement === frameReference.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async (): Promise<void> => {
    if (document.fullscreenElement === frameReference.current) {
      await document.exitFullscreen();
    } else {
      await frameReference.current?.requestFullscreen();
    }
  };

  return (
    <div
      aria-label={label}
      className={styles.frame}
      data-fullscreen={isFullscreen || undefined}
      ref={frameReference}
      style={{'--doc-live-example-height': height} as React.CSSProperties}
    >
      <div className={styles.content}>{children}</div>
      <button
        aria-label={isFullscreen ? `Exit fullscreen ${label}` : `Open ${label} fullscreen`}
        className={styles.fullscreenButton}
        onClick={toggleFullscreen}
        title={isFullscreen ? 'Exit fullscreen' : 'Open fullscreen'}
        type="button"
      >
        <span aria-hidden="true">{isFullscreen ? '×' : '⛶'}</span>
      </button>
      {!isFullscreen && (
        <button className={styles.interactionGate} onClick={toggleFullscreen} type="button">
          <span>
            <span aria-hidden="true">⛶</span> Explore fullscreen
          </span>
        </button>
      )}
    </div>
  );
}
