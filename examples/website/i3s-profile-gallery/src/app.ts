// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import {ArcGISSceneServerSource} from '@loaders.gl/arcgis/bundled';
import type {I3SServiceMetadata} from '@loaders.gl/tiles-3d/i3s';
import './styles.css';

const DEFAULT_URL =
  'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0';

const PROFILE_PRESETS = [
  {
    label: '3D Object / mesh',
    url: DEFAULT_URL,
    description: 'A public 3D Object SceneServer layer.'
  }
];

const PROFILES = [
  ['3D Object', 'MeshPyramids geometry, textures, and feature attributes.'],
  ['Integrated Mesh', 'Large textured surfaces with traversal metadata.'],
  ['Building', 'Composite group, mesh, and Point sublayers.'],
  ['Point', 'Draco point geometry, symbols, and feature attributes.'],
  ['Point Cloud', 'LEPCC geometry and standard point attributes.']
] as const;

/** Mounts the I3S profile gallery into a host element and returns its cleanup function. */
export function renderToDOM(container: HTMLElement): () => void {
  const page = document.createElement('div');
  page.className = 'i3s-gallery-page';
  page.innerHTML = `
    <header class="i3s-gallery-header">
      <p class="i3s-gallery-eyebrow">loaders.gl · I3S</p>
      <h1>Profile gallery</h1>
      <p class="i3s-gallery-lead">
        Inspect the same normalized metadata contract used by mesh, Point, and Point Cloud
        SceneServer sources. Building roots remain composite and are loaded with the dedicated
        Building Scene Layer loader.
      </p>
    </header>
    <section class="i3s-gallery-card" aria-label="SceneServer layer inspector">
      <form class="i3s-gallery-form">
        <label for="i3s-url">SceneServer layer URL</label>
        <div class="i3s-gallery-url-row">
          <input id="i3s-url" name="url" spellcheck="false" required />
          <button class="i3s-gallery-submit" type="submit">Inspect</button>
        </div>
        <div class="i3s-gallery-presets"></div>
        <p class="i3s-gallery-error" role="alert" hidden></p>
      </form>
    </section>
    <div class="i3s-gallery-results" aria-live="polite"></div>
  `;

  const form = page.querySelector<HTMLFormElement>('.i3s-gallery-form')!;
  const urlInput = page.querySelector<HTMLInputElement>('#i3s-url')!;
  const submitButton = page.querySelector<HTMLButtonElement>('.i3s-gallery-submit')!;
  const presetsElement = page.querySelector<HTMLDivElement>('.i3s-gallery-presets')!;
  const errorElement = page.querySelector<HTMLParagraphElement>('.i3s-gallery-error')!;
  const resultsElement = page.querySelector<HTMLDivElement>('.i3s-gallery-results')!;
  urlInput.value = DEFAULT_URL;
  resultsElement.replaceChildren(createProfileCards());

  const listenerController = new AbortController();
  PROFILE_PRESETS.map(preset => {
    const button = document.createElement('button');
    button.className = 'i3s-gallery-preset';
    button.type = 'button';
    button.textContent = preset.label;
    button.title = preset.description;
    button.addEventListener('click', () => {
      urlInput.value = preset.url;
      urlInput.focus();
    }, {signal: listenerController.signal});
    presetsElement.append(button);
  });

  /** Loads and displays normalized metadata for the current URL. */
  async function inspectLayer(): Promise<void> {
    submitButton.disabled = true;
    submitButton.textContent = 'Inspecting…';
    errorElement.hidden = true;
    errorElement.textContent = '';

    try {
      const source = new ArcGISSceneServerSource(urlInput.value.trim());
      const metadata = await source.getMetadata();
      resultsElement.replaceChildren(createMetadataCard(metadata));
    } catch (loadError) {
      resultsElement.replaceChildren(createProfileCards());
      errorElement.textContent = loadError instanceof Error ? loadError.message : String(loadError);
      errorElement.hidden = false;
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = 'Inspect';
    }
  }

  form.addEventListener('submit', handleFormSubmit, {signal: listenerController.signal});
  container.replaceChildren(page);

  return () => {
    listenerController.abort();
    container.replaceChildren();
  };

  /** Prevents navigation and runs the async metadata inspection. */
  function handleFormSubmit(event: SubmitEvent): void {
    event.preventDefault();
    void inspectLayer();
  }
}

/** Builds the authored profile summary cards shown before a layer is inspected. */
function createProfileCards(): HTMLElement {
  const section = document.createElement('section');
  section.className = 'i3s-gallery-grid';
  section.setAttribute('aria-label', 'I3S profile support');

  for (const [name, description] of PROFILES) {
    const article = document.createElement('article');
    article.className = 'i3s-gallery-profile-card';
    const heading = document.createElement('h2');
    heading.textContent = name;
    const profileDescription = document.createElement('p');
    profileDescription.textContent = description;
    const badge = document.createElement('span');
    badge.className = 'i3s-gallery-badge';
    badge.textContent = 'Inspect a layer above';
    article.append(heading, profileDescription, badge);
    section.append(article);
  }

  return section;
}

/** Builds a metadata card using text nodes for all values returned by the remote service. */
function createMetadataCard(metadata: I3SServiceMetadata): HTMLElement {
  const section = document.createElement('section');
  section.className = 'i3s-gallery-card i3s-gallery-metadata';
  section.setAttribute('aria-label', 'Normalized I3S metadata');

  const header = document.createElement('div');
  header.className = 'i3s-gallery-metadata-header';
  const titleGroup = document.createElement('div');
  const type = document.createElement('p');
  type.className = 'i3s-gallery-eyebrow';
  type.textContent = metadata.layerType;
  const title = document.createElement('h2');
  title.textContent = metadata.name || 'Unnamed layer';
  titleGroup.append(type, title);
  const version = document.createElement('span');
  version.className = 'i3s-gallery-version';
  version.textContent = `I3S ${metadata.version}`;
  header.append(titleGroup, version);
  section.append(header);

  const definitionList = document.createElement('dl');
  definitionList.className = 'i3s-gallery-metadata-grid';
  appendDefinition(definitionList, 'Profile', metadata.profile);
  appendDefinition(
    definitionList,
    'CRS',
    metadata.spatialReference?.wkid ||
      metadata.spatialMetadata.sourceCrs?.toString() ||
      'Not advertised'
  );
  appendDefinition(definitionList, 'Capabilities', metadata.capabilities.join(', ') || 'None advertised');
  appendDefinition(definitionList, 'URL', metadata.url, 'i3s-gallery-url-value');
  section.append(definitionList);

  const featuresHeading = document.createElement('h3');
  featuresHeading.textContent = 'Feature support';
  const featureList = document.createElement('ul');
  featureList.className = 'i3s-gallery-support-list';
  for (const [feature, status] of Object.entries(metadata.supportReport.features)) {
    const featureStatus = String(status);
    const item = document.createElement('li');
    const name = createTextElement('span', feature);
    const value = createTextElement('span', featureStatus);
    value.className = 'i3s-gallery-status';
    value.dataset.status = featureStatus;
    item.append(name, value);
    featureList.append(item);
  }
  section.append(featuresHeading, featureList);

  if (metadata.supportReport.diagnostics.length) {
    const diagnosticsHeading = document.createElement('h3');
    diagnosticsHeading.textContent = 'Diagnostics';
    const diagnosticsList = document.createElement('ul');
    for (const diagnostic of metadata.supportReport.diagnostics) {
      const item = document.createElement('li');
      item.textContent = diagnostic.message;
      diagnosticsList.append(item);
    }
    section.append(diagnosticsHeading, diagnosticsList);
  }

  return section;
}

/** Appends one text-only metadata row to a definition list. */
function appendDefinition(
  definitionList: HTMLDListElement,
  label: string,
  value: string | number,
  valueClassName = ''
): void {
  const term = document.createElement('dt');
  term.textContent = label;
  const description = document.createElement('dd');
  description.textContent = String(value);
  description.className = valueClassName;
  definitionList.append(term, description);
}

/** Creates an element whose text content is set without parsing HTML. */
function createTextElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  text: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tagName);
  element.textContent = text;
  return element;
}
