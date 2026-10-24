// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {BoxPanelContainer, CustomPanel, PanelManager, TabbedPanel} from '@deck.gl-community/panels';

/** A section of HTML supplied by an example. Only pass trusted, authored HTML. */
export type ExampleInfoSection = {
  id: string;
  title: string;
  html: string;
};

export type ExampleInfoBoxOptions = {
  id: string;
  title: string;
  sections: ExampleInfoSection[];
  widthPx?: number;
  defaultOpen?: boolean;
};

/** Reusable tabbed information panel for loaders.gl examples.
 *
 * The supplied HTML must be trusted, static application content, not dataset
 * metadata or user input. Untrusted text must be escaped before interpolation.
 */
export function createExampleInfoBox(options: ExampleInfoBoxOptions): BoxPanelContainer {
  if (!options.sections.length) {
    throw new Error('An example information box needs at least one section');
  }
  const panels = options.sections.map(section =>
    new CustomPanel({
      id: `${options.id}-${section.id}`,
      title: section.title,
      onRenderHTML: root => {
        root.classList.add('loaders-example-info-content');
        root.innerHTML = section.html;
        return () => root.replaceChildren();
      }
    })
  );
  return new BoxPanelContainer({
    id: options.id,
    title: options.title,
    placement: 'top-left',
    widthPx: options.widthPx ?? 340,
    collapsible: true,
    defaultOpen: options.defaultOpen ?? false,
    panel: new TabbedPanel({
      id: `${options.id}-tabs`,
      title: '',
      panels
    })
  });
}

/** Mount a standalone example info box. For React deck.gl examples, pass
 * createExampleInfoBox() directly to the existing panel/widget composition.
 */
export function mountExampleInfoBox(host: HTMLElement, options: ExampleInfoBoxOptions): () => void {
  const manager = new PanelManager({parentElement: host});
  manager.setProps({components: [createExampleInfoBox(options)]});
  manager.onRedraw({viewports: [], layers: []});
  return () => manager.finalize();
}
