import React, {useEffect, useId, useMemo, useState} from 'react';
import {createPortal} from 'react-dom';
import {CustomPanel, type Panel} from '@deck.gl-community/panels';
import {Panel as PanelHost} from '@deck.gl-community/react';

/** Renders a panels-module definition through its official React adapter. */
export function ExamplePanelHost({
  panel
}: {
  /** Panel definition rendered in the React example. */
  panel: Panel;
}): React.JSX.Element {
  const [themeMode, setThemeMode] = useState<'light' | 'dark'>('light');
  useEffect(() => {
    const updateTheme = () =>
      setThemeMode(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    updateTheme();
    const observer = new MutationObserver(updateTheme);
    observer.observe(document.documentElement, {attributes: true, attributeFilter: ['data-theme']});
    return () => observer.disconnect();
  }, []);
  return <PanelHost panel={panel} themeMode={themeMode} style={{margin: '14px 0'}} />;
}

/** Bridges React-owned application controls into a panels-module CustomPanel. */
export function ReactExamplePanel({
  title,
  children
}: {
  /** Heading displayed by the standard panel container. */
  title: string;
  /** Application-specific controls, preserving their React context. */
  children: React.ReactNode;
}): React.JSX.Element {
  const panelId = useId();
  const [contentElement, setContentElement] = useState<HTMLElement>();
  const panel = useMemo(
    () =>
      new CustomPanel({
        id: panelId,
        title,
        onRenderHTML: rootElement => {
          setContentElement(rootElement);
          return () => setContentElement(undefined);
        }
      }),
    [panelId, title]
  );
  return (
    <>
      <ExamplePanelHost panel={panel} />
      {contentElement ? createPortal(children, contentElement) : null}
    </>
  );
}
