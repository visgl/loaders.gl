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
  /** Use a naturally sized, directly interactive frame for form-based examples. */
  variant?: 'map' | 'panel';
};

/**
 * Frames a visual example without letting map or scene controls capture page scrolling.
 * Interaction is enabled when the reader opens the frame fullscreen.
 */
export function DocLiveExample({
  label,
  children,
  height = '420px',
  variant = 'map'
}: DocLiveExampleProps): ReactNode {
  const frameReference = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const isOpen = isFullscreen || isExpanded;

  useEffect(() => {
    const handleFullscreenChange = (): void => {
      setIsFullscreen(document.fullscreenElement === frameReference.current);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (!isExpanded) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === 'Escape') setIsExpanded(false);
      if (event.key !== 'Tab') return;
      const controls = Array.from(frameReference.current?.querySelectorAll<HTMLElement>(
        'button, a[href], input, select, textarea, [tabindex="0"]'
      ) ?? []).filter(element => element.getClientRects().length > 0);
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    frameReference.current?.querySelector<HTMLButtonElement>('button')?.focus();
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      frameReference.current?.querySelector<HTMLButtonElement>('button')?.focus();
    };
  }, [isExpanded]);

  const toggleFullscreen = async (): Promise<void> => {
    if (isExpanded) {
      setIsExpanded(false);
      return;
    }
    if (document.fullscreenElement === frameReference.current) {
      await document.exitFullscreen();
    } else {
      try {
        if (frameReference.current?.requestFullscreen) {
          await frameReference.current.requestFullscreen();
          return;
        }
      } catch {
        // Embedded browsers may expose the API while denying fullscreen requests.
      }
      setIsExpanded(true);
    }
  };

  return (
    <div
      aria-label={label}
      className={styles.frame}
      data-fullscreen={isOpen || undefined}
      data-expanded={isExpanded || undefined}
      role={isExpanded ? 'dialog' : undefined}
      aria-modal={isExpanded || undefined}
      data-variant={variant}
      ref={frameReference}
      style={{'--doc-live-example-height': height} as React.CSSProperties}
    >
      <div className={styles.toolbar}>
        <span className={styles.label}>{label}</span>
      <button
        aria-label={isOpen ? `Exit fullscreen ${label}` : `Open ${label} fullscreen`}
        className={styles.fullscreenButton}
        onClick={toggleFullscreen}
        type="button"
      >
        <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          {isOpen ? (
            <path d="M4 9h5V4M20 9h-5V4M4 15h5v5M20 15h-5v5" />
          ) : (
            <path d="M9 4H4v5M15 4h5v5M9 20H4v-5M15 20h5v-5" />
          )}
        </svg>
        <span className={styles.tooltip} aria-hidden="true">
          {isOpen ? 'Exit fullscreen' : 'Enter fullscreen'}
        </span>
      </button>
      </div>
      <div className={styles.content}>{children}</div>
      {variant === 'map' && !isOpen && (
        <button className={styles.interactionGate} onClick={toggleFullscreen} type="button">
          <span>
            <span aria-hidden="true">⛶</span> Explore fullscreen
          </span>
        </button>
      )}
    </div>
  );
}
