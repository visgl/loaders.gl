// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {useEffect, useMemo, useRef, useState, type ReactNode} from 'react';

const MAX_SAVED_URLS = 12;
const SAVED_URLS_KEY = 'loaders.gl.example-url-input.urls.v1';

/** Stored URL entry persisted in local storage. */
type StoredUrlEntry = {
  /** URL option display label when known. */
  label?: string;
  /** Last selected or submitted URL. */
  url: string;
  /** Last update time in milliseconds since epoch. */
  updatedAt: number;
};

/** URL option shown in the shared example URL dropdown. */
export type UrlOption<ExampleT = unknown> = {
  /** Example format this URL belongs to. */
  format: string;
  /** Built-in example source definition. */
  example?: ExampleT;
  /** URL option display label. */
  label: string;
  /** Parsed point count when known. */
  pointCount?: number;
  /** URL option value. */
  url: string;
  /** URL option group. */
  group: 'Examples' | 'Saved URLs';
};

/** Props for {@link ExampleUrlInputCard}. */
export type ExampleUrlInputCardProps<ExampleT = unknown> = {
  /** Current source format. */
  format: string;
  /** Optional local storage key; defaults to the current source format. */
  storageKey?: string;
  /** Current source URL. */
  selectedUrl: string;
  /** Selectable URL options. */
  urlOptions: UrlOption<ExampleT>[];
  /** Callback when the user selects a built-in example or saved URL. */
  onExampleSelect: (urlOption: UrlOption<ExampleT>) => void;
  /** Callback when the user submits a URL. */
  onUrlChange: (url: string) => void;
};

/** Shared URL input and example dropdown used by point cloud-style examples. */
export function ExampleUrlInputCard<ExampleT = unknown>({
  format,
  storageKey,
  selectedUrl,
  urlOptions,
  onExampleSelect,
  onUrlChange
}: ExampleUrlInputCardProps<ExampleT>): ReactNode {
  const urlCardRef = useRef<HTMLFormElement | null>(null);
  const hasRestoredUrlRef = useRef(false);
  const activeStorageKey = storageKey || format;
  const [url, setUrl] = useState(selectedUrl);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [savedUrls, setSavedUrls] = useState<StoredUrlEntry[]>(() =>
    readStoredUrlEntries(activeStorageKey)
  );
  const allUrlOptions = useMemo(
    () => [
      ...urlOptions.filter((urlOption) => isMatchingFormat(urlOption.format, format)),
      ...savedUrls.map((savedUrlEntry) => ({
        format,
        group: 'Saved URLs' as const,
        label: savedUrlEntry.label || getFileNameFromUrl(savedUrlEntry.url),
        url: savedUrlEntry.url
      }))
    ],
    [savedUrls, urlOptions, format]
  );

  useEffect(() => {
    setUrl(selectedUrl);
  }, [selectedUrl]);

  useEffect(() => {
    hasRestoredUrlRef.current = false;
    setSavedUrls(readStoredUrlEntries(activeStorageKey));
  }, [activeStorageKey]);

  useEffect(() => {
    if (hasRestoredUrlRef.current) {
      return;
    }
    hasRestoredUrlRef.current = true;
    const lastUrlEntry = readStoredUrlEntries(activeStorageKey)[0];
    if (!lastUrlEntry || lastUrlEntry.url === selectedUrl) {
      return;
    }

    const restoredUrlOption =
      urlOptions.find(
        (urlOption) =>
          isMatchingFormat(urlOption.format, format) && urlOption.url === lastUrlEntry.url
      ) ||
      ({
        format,
        group: 'Saved URLs',
        label: lastUrlEntry.label || getFileNameFromUrl(lastUrlEntry.url),
        url: lastUrlEntry.url
      } as UrlOption<ExampleT>);

    setUrl(restoredUrlOption.url);
    if (restoredUrlOption.example) {
      onExampleSelect(restoredUrlOption);
    } else {
      onUrlChange(restoredUrlOption.url);
    }
  }, [activeStorageKey, format, onExampleSelect, onUrlChange, selectedUrl, urlOptions]);

  useEffect(() => {
    if (isMenuOpen) {
      setSavedUrls(readStoredUrlEntries(activeStorageKey));
    }
  }, [activeStorageKey, isMenuOpen]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }

    function closeMenuOnOutsideClick(event: MouseEvent): void {
      const target = event.target;
      if (target instanceof Node && !urlCardRef.current?.contains(target)) {
        setIsMenuOpen(false);
      }
    }

    function closeMenuOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', closeMenuOnOutsideClick);
    document.addEventListener('keydown', closeMenuOnEscape);
    return () => {
      document.removeEventListener('mousedown', closeMenuOnOutsideClick);
      document.removeEventListener('keydown', closeMenuOnEscape);
    };
  }, [isMenuOpen]);

  function submitUrl(nextUrl: string, shouldSaveUrl = true): void {
    const trimmedUrl = nextUrl.trim();
    if (!trimmedUrl) {
      return;
    }
    if (shouldSaveUrl) {
      const nextSavedUrls = saveUrlEntry(activeStorageKey, {url: trimmedUrl});
      setSavedUrls(nextSavedUrls);
    }
    onUrlChange(trimmedUrl);
  }

  return (
    <form
      ref={urlCardRef}
      onSubmit={(event) => {
        event.preventDefault();
        submitUrl(url);
      }}
      style={styles.urlCard}
    >
      <div style={styles.urlMenuShell}>
        <div style={styles.urlInputGroup}>
          <input
            aria-label={`${format} source URL`}
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            style={styles.urlInput}
          />
          <button
            aria-label={`Show ${format} URL options`}
            aria-expanded={isMenuOpen}
            type="button"
            onClick={() => setIsMenuOpen((currentValue) => !currentValue)}
            style={styles.urlMenuButton}
          >
            ▾
          </button>
        </div>
        {isMenuOpen && (
          <div style={styles.urlMenu}>
            {renderUrlOptionGroup('Examples', format, allUrlOptions, (selectedUrlOption) => {
              setSavedUrls(
                saveUrlEntry(activeStorageKey, {
                  label: selectedUrlOption.label,
                  url: selectedUrlOption.url
                })
              );
              setUrl(selectedUrlOption.url);
              setIsMenuOpen(false);
              onExampleSelect(selectedUrlOption as UrlOption<ExampleT>);
            })}
            {renderUrlOptionGroup('Saved URLs', format, allUrlOptions, (selectedUrlOption) => {
              setSavedUrls(
                saveUrlEntry(activeStorageKey, {
                  label: selectedUrlOption.label,
                  url: selectedUrlOption.url
                })
              );
              setUrl(selectedUrlOption.url);
              setIsMenuOpen(false);
              onExampleSelect(selectedUrlOption as UrlOption<ExampleT>);
            })}
          </div>
        )}
      </div>
      <button type="submit" style={styles.urlButton}>
        Load URL
      </button>
    </form>
  );
}

function renderUrlOptionGroup<ExampleT>(
  group: UrlOption<ExampleT>['group'],
  format: string,
  options: UrlOption<ExampleT>[],
  onSelectUrlOption: (urlOption: UrlOption<ExampleT>) => void
): ReactNode {
  const groupOptions = options.filter(
    (option) => option.group === group && isMatchingFormat(option.format, format)
  );
  if (!groupOptions.length) {
    return null;
  }

  return (
    <>
      <div style={styles.urlMenuGroup}>{group}</div>
      {groupOptions.map((option) => (
        <button
          key={`${group}.${option.label}.${option.url}`}
          type="button"
          onClick={() => onSelectUrlOption(option)}
          style={styles.urlMenuOption}
        >
          <span style={styles.urlMenuOptionLabel}>{option.label}</span>
          {option.pointCount !== undefined && (
            <span style={styles.urlMenuOptionCount}>{formatPointCount(option.pointCount)}</span>
          )}
          <span style={styles.urlMenuOptionUrl}>{option.url}</span>
        </button>
      ))}
    </>
  );
}

function isMatchingFormat(optionFormat: string, activeFormat: string): boolean {
  return optionFormat.toLowerCase() === activeFormat.toLowerCase();
}

function readStoredUrlEntries(storageKey: string): StoredUrlEntry[] {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const savedUrls = JSON.parse(window.localStorage.getItem(getSavedUrlsKey(storageKey)) || '[]');
    if (!Array.isArray(savedUrls)) {
      return [];
    }
    return savedUrls
      .map(normalizeStoredUrlEntry)
      .filter((savedUrl): savedUrl is StoredUrlEntry => Boolean(savedUrl))
      .slice(0, MAX_SAVED_URLS);
  } catch {
    return [];
  }
}

function saveUrlEntry(
  storageKey: string,
  urlEntry: Pick<StoredUrlEntry, 'url'> & Partial<StoredUrlEntry>
): StoredUrlEntry[] {
  const trimmedUrl = urlEntry.url.trim();
  const nextUrlEntry: StoredUrlEntry = {
    label: urlEntry.label,
    url: trimmedUrl,
    updatedAt: Date.now()
  };
  if (typeof window === 'undefined') {
    return [nextUrlEntry];
  }

  const savedUrls = [
    nextUrlEntry,
    ...readStoredUrlEntries(storageKey).filter((savedUrl) => savedUrl.url !== trimmedUrl)
  ].slice(0, MAX_SAVED_URLS);
  window.localStorage.setItem(getSavedUrlsKey(storageKey), JSON.stringify(savedUrls));
  return savedUrls;
}

function normalizeStoredUrlEntry(value: unknown): StoredUrlEntry | null {
  if (typeof value === 'string') {
    return {url: value, updatedAt: 0};
  }
  if (!value || typeof value !== 'object') {
    return null;
  }
  const urlEntry = value as Partial<StoredUrlEntry>;
  if (typeof urlEntry.url !== 'string') {
    return null;
  }
  return {
    label: typeof urlEntry.label === 'string' ? urlEntry.label : undefined,
    url: urlEntry.url,
    updatedAt: typeof urlEntry.updatedAt === 'number' ? urlEntry.updatedAt : 0
  };
}

function getSavedUrlsKey(storageKey: string): string {
  return `${SAVED_URLS_KEY}.${storageKey.toLowerCase()}`;
}

function getFileNameFromUrl(url: string): string {
  try {
    const pathname = new URL(url).pathname;
    return pathname.slice(pathname.lastIndexOf('/') + 1) || 'Custom URL';
  } catch {
    return 'Custom URL';
  }
}

function formatPointCount(pointCount: number): string {
  return `${pointCount.toLocaleString()} pts`;
}

const styles = {
  urlCard: {
    position: 'relative',
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: 8,
    alignItems: 'stretch',
    width: '100%',
    marginTop: 12,
    padding: 12,
    border: '1px solid #cbd5e1',
    borderRadius: 8,
    background: '#ffffff',
    boxSizing: 'border-box'
  },
  urlMenuShell: {
    position: 'relative',
    minWidth: 0
  },
  urlInputGroup: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) 42px',
    minWidth: 0
  },
  urlInput: {
    minWidth: 0,
    padding: '8px 10px',
    border: '1px solid #cbd5e1',
    borderRight: 0,
    borderRadius: '6px 0 0 6px',
    color: '#0f172a',
    background: '#ffffff',
    fontSize: 13,
    lineHeight: '18px'
  },
  urlMenuButton: {
    border: '1px solid #cbd5e1',
    borderRadius: '0 6px 6px 0',
    color: '#334155',
    background: '#f8fafc',
    fontSize: 14,
    cursor: 'pointer'
  },
  urlMenu: {
    position: 'absolute',
    zIndex: 20,
    top: 'calc(100% + 4px)',
    left: 0,
    right: 0,
    maxHeight: 360,
    overflow: 'auto',
    border: '1px solid #cbd5e1',
    borderRadius: 6,
    background: '#ffffff',
    boxShadow: '0 18px 40px rgba(15, 23, 42, 0.18)'
  },
  urlMenuGroup: {
    padding: '8px 10px 4px',
    color: '#64748b',
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  urlMenuOption: {
    display: 'grid',
    gridTemplateColumns: 'minmax(0, 1fr) auto',
    gap: '2px 8px',
    width: '100%',
    padding: '7px 10px',
    border: 0,
    borderTop: '1px solid #f1f5f9',
    color: '#0f172a',
    background: '#ffffff',
    textAlign: 'left',
    cursor: 'pointer'
  },
  urlMenuOptionLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 13,
    fontWeight: 600
  },
  urlMenuOptionCount: {
    color: '#64748b',
    fontSize: 12
  },
  urlMenuOptionUrl: {
    gridColumn: '1 / -1',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#64748b',
    fontFamily: 'Menlo, Consolas, monospace',
    fontSize: 11
  },
  urlButton: {
    padding: '0 13px',
    border: '1px solid #2563eb',
    borderRadius: 6,
    color: '#ffffff',
    background: '#2563eb',
    fontSize: 13,
    fontWeight: 600,
    cursor: 'pointer'
  }
} as const;
