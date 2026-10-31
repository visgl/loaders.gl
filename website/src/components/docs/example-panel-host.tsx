import React, {useEffect, useId, useMemo, useRef, useState} from 'react';
import {createPortal} from 'react-dom';
import {
  CustomPanel,
  PanelManager,
  SidebarPanelContainer,
  type Panel
} from '@deck.gl-community/panels';
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

/** Attaches a native panels-module sidebar to the right edge of an example workspace. */
export function ReactExampleSidebar({
  open,
  onClose,
  children
}: {
  /** Whether the inspector is expanded. */
  open: boolean;
  /** Closes the selected entry when native sidebar controls request it. */
  onClose: () => void;
  /** React-owned inspector content. */
  children: React.ReactNode;
}): React.JSX.Element {
  const panelId = useId();
  const host = useRef<HTMLDivElement>(null);
  const sidebar = useRef<SidebarPanelContainer | undefined>(undefined);
  const onCloseReference = useRef(onClose);
  onCloseReference.current = onClose;
  const [contentElement, setContentElement] = useState<HTMLElement>();
  useEffect(() => {
    const parentElement = host.current;
    if (!parentElement) return;
    let mounted = true;
    const panel = new CustomPanel({
      id: `${panelId}-content`,
      title: 'Catalog inspector',
      onRenderHTML: element => {
        element.style.height = '100%';
        element.style.minHeight = '0';
        // The sidebar provides an outer scroll container. Give each panel wrapper a
        // definite height so the inspector itself owns scrolling and sticky tabs.
        queueMicrotask(() => {
          if (!mounted) return;
          let wrapper = element.parentElement;
          while (wrapper && wrapper !== parentElement) {
            wrapper.style.minHeight = '0';
            wrapper.style.height = '100%';
            if (wrapper.hasAttribute('data-sidebar-content')) {
              wrapper.style.overflow = 'hidden';
              wrapper.style.boxSizing = 'border-box';
              break;
            }
            wrapper = wrapper.parentElement;
          }
        });
        if (mounted) setContentElement(element);
        return () => {
          if (mounted) setContentElement(undefined);
        };
      }
    });
    const container = new SidebarPanelContainer({
      id: `${panelId}-sidebar`,
      panel,
      side: 'right',
      title: 'Catalog inspector',
      open: false,
      hideTrigger: true,
      showTitleBar: false,
      viewportMarginPx: 0,
      widthPx: Math.min(parentElement.clientWidth * 0.65, 700),
      onOpenChange: nextOpen => {
        if (!nextOpen) onCloseReference.current();
      }
    });
    sidebar.current = container;
    const manager = new PanelManager({parentElement});
    manager.setProps({components: [container]});
    const observer = new ResizeObserver(() =>
      container.setProps({widthPx: Math.min(parentElement.clientWidth * 0.65, 700)})
    );
    observer.observe(parentElement);
    return () => {
      mounted = false;
      observer.disconnect();
      sidebar.current = undefined;
      manager.finalize();
    };
  }, [panelId]);
  useEffect(() => {
    sidebar.current?.setProps({open});
  }, [open]);
  return (
    <>
      <div
        ref={host}
        style={
          {
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            zIndex: 2,
            '--widget-margin': '0px'
          } as React.CSSProperties
        }
      />
      {open && contentElement ? createPortal(children, contentElement) : null}
    </>
  );
}
