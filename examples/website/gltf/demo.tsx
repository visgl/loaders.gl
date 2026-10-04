// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import React, {useCallback, useEffect, useId, useState} from 'react';
import DeckGL from '@deck.gl/react';
import {COORDINATE_SYSTEM, OrbitView} from '@deck.gl/core';
import {ScenegraphLayer} from '@deck.gl/mesh-layers';
import type {GLTFScenegraphs} from '@luma.gl/gltf';
import {load} from '@loaders.gl/core';
import {GLTFLoader, type GLTFWithBuffers} from '@loaders.gl/gltf';
import {GLTF1_MODELS} from './components/gltf1-models';
import {GLTF_BASE_URL, loadModelList} from './components/examples';

/** Bundled legacy models plus the existing glTF 2 gallery default. */
const MODELS = [
  ...GLTF1_MODELS,
  {
    name: 'Damaged Helmet (glTF 2)',
    url: 'https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Models/main/2.0/DamagedHelmet/glTF-Binary/DamagedHelmet.glb'
  }
];
/** Rotate around the glTF Y axis without requiring a map. */
const ORBIT_VIEW = new OrbitView({orbitAxis: 'Y'});

/** Render selectable glTF 1 and glTF 2 files through the current loader and scenegraph renderer. */
export default function GLTFDemo(): React.ReactElement {
  const [models, setModels] = useState(MODELS);
  const [modelUrl, setModelUrl] = useState(MODELS[0].url);
  const [model, setModel] = useState<GLTFWithBuffers | null>(null);
  const [status, setStatus] = useState('Loading model…');
  const [renderedModelUrl, setRenderedModelUrl] = useState<string | null>(null);
  const [hasLimitations, setHasLimitations] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const selectorId = useId();
  const [viewState, setViewState] = useState({
    target: [0, 0, 0] as [number, number, number],
    rotationX: 20,
    rotationOrbit: 30,
    zoom: 7
  });
  const getScene = useCallback(
    (scenegraphs: GLTFScenegraphs) => {
      const sceneIndex = typeof model?.json.scene === 'number' ? model.json.scene : 0;
      const bounds = scenegraphs.sceneBounds[sceneIndex] || scenegraphs.modelBounds;
      setViewState({
        target: bounds.center,
        rotationX: 20,
        rotationOrbit: 30,
        zoom: Math.log2(180 / Math.max(...bounds.size, 0.01))
      });
      return scenegraphs.scenes[sceneIndex];
    },
    [model]
  );

  useEffect(() => {
    let active = true;
    loadModelList()
      .then(catalog => {
        if (!active) return;
        const entries = catalog.map(({name, url, variants}) => {
          const variant = ['glTF-Draco', 'glTF-Binary', 'glTF-Embedded', 'glTF'].find(
            key => variants[key]
          );
          return {
            name: `${name}${variant ? ` (${variant})` : ''}`,
            url: url || `${GLTF_BASE_URL}${name}/${variant}/${variants[variant!]}`
          };
        });
        setModels([
          ...MODELS,
          ...entries.filter(entry => !MODELS.some(model => model.url === entry.url))
        ]);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setModel(null);
    setRenderedModelUrl(null);
    setHasLimitations(false);
    setRenderError(null);
    setStatus('Loading model…');
    const isLegacyModel = GLTF1_MODELS.some(sample => sample.url === modelUrl);
    load(modelUrl, GLTFLoader, {
      core: {
        log: {
          log: () => () => {},
          warn: (message: string) => () => {
            if (active && message.includes('does not support')) setHasLimitations(true);
          }
        }
      }
    })
      .then(result => {
        if (!active) return;
        setModel(result);
        setStatus(
          `${isLegacyModel ? 'Converted from glTF 1 to glTF 2' : 'Loaded glTF 2'}: ${models.find(sample => sample.url === modelUrl)!.name}.`
        );
      })
      .catch(error => {
        if (active)
          setStatus(
            `Unable to load model: ${error instanceof Error ? error.message : String(error)}`
          );
      });
    return () => {
      active = false;
    };
  }, [modelUrl]);

  const layers = model
    ? [
        new ScenegraphLayer({
          id: `gltf-${modelUrl}`,
          data: [{position: [0, 0, 0]}],
          scenegraph: model,
          getScene,
          coordinateSystem: COORDINATE_SYSTEM.CARTESIAN,
          getPosition: [0, 0, 0],
          onFirstDraw: () => setRenderedModelUrl(modelUrl),
          _lighting: 'pbr',
          _animations: {'*': {playing: true}}
        })
      ]
    : [];

  return (
    <section
      aria-label="glTF model viewer"
      aria-busy={!model || renderedModelUrl !== modelUrl}
      style={{height: '100%', display: 'flex', flexDirection: 'column'}}
    >
      <div style={{padding: 16}}>
        <label htmlFor={selectorId}>Model </label>
        <select
          id={selectorId}
          value={modelUrl}
          onChange={event => setModelUrl(event.target.value)}
        >
          {models.map(({name, url}) => (
            <option key={url} value={url}>
              {name}
            </option>
          ))}
        </select>
        <p role="status" aria-live="polite" style={{margin: '8px 0'}}>
          {renderError || status}
        </p>
        {hasLimitations && (
          <p style={{margin: '8px 0'}}>
            Legacy materials use an approximate appearance. Shader behavior is not converted.{' '}
            <a href="/docs/modules/gltf/formats/gltf#gltf-1-to-gltf-2-conversion">
              Conversion support
            </a>
          </p>
        )}
        <small>
          Drag to rotate; scroll to zoom. Original glTF 1 samples donated by Cesium for Khronos
          testing.
        </small>
      </div>
      <div style={{position: 'relative', flex: 1, minHeight: 240, background: '#202530'}}>
        <DeckGL
          views={ORBIT_VIEW}
          initialViewState={viewState}
          controller
          layers={layers}
          _animate
          onError={error => setRenderError(`Unable to render model: ${error.message}`)}
        />
      </div>
    </section>
  );
}
