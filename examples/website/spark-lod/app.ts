// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import * as THREE from 'three';
import GUI from 'lil-gui';
import {load} from '@loaders.gl/core';
import {RADSourceLoader, type RADMetadata, type RADSource} from '@loaders.gl/splats';
import {SparkControls, SparkRenderer, SplatMesh, isMobile} from '@sparkjsdev/spark';

const INITIAL_WORLD_KEY = 'Coit Tower, SF';
const BASE_PIXEL_RATIO = 1;

type SparkLodWorld = {
  /** Prebuilt Spark `.rad` LoD tree URL. */
  url: string;
  /** Initial splat mesh quaternion. */
  quaternion?: [number, number, number, number];
  /** Initial splat mesh position. */
  position?: [number, number, number];
  /** Uniform scale applied to the splat mesh. */
  scale?: number;
  /** Background clear color. */
  background: string;
  /** Short scene attribution shown in the overlay. */
  description: string;
  /** Initial camera position. */
  cameraPosition?: [number, number, number];
  /** Initial camera quaternion. */
  cameraQuaternion?: [number, number, number, number];
  /** Spark global LoD detail multiplier. */
  lodSplatScale?: number;
  /** Whether to render at device pixel ratio for this scene. */
  highDpi?: boolean;
};

const WORLDS: Record<string, SparkLodWorld> = {
  Hobbiton: {
    url: 'https://storage.googleapis.com/forge-dev-public/asundqui/rad/260219/tijerin_w6_hobbiton-lod.rad',
    quaternion: [1, 0, 0, 0],
    background: '#cafefe',
    description: '24M splats created by Tijerin with World Labs Marble'
  },
  'Cozy Spaceship': {
    url: 'https://storage.googleapis.com/forge-dev-public/asundqui/rad/260217/cozy-spaceship_2-lod.rad',
    position: [0, -6.5, 0],
    background: '#000000',
    description: '6M splats created by Britt Casado with World Labs Marble'
  },
  'Coit Tower, SF': {
    url: 'https://storage.googleapis.com/forge-dev-public/asundqui/rad/260217/coit-40m-sh1-lod.rad',
    quaternion: [1, 0, 0, 0],
    scale: 10,
    cameraPosition: [-0.858, 2.203, -1.128],
    cameraQuaternion: [-0.043, -0.909, -0.097, 0.402],
    background: '#cafefe',
    lodSplatScale: 1.5,
    highDpi: !isMobile(),
    description: '40M splats scanned by Vincent Woo'
  },
  'Poland Coast': {
    url: 'https://storage.googleapis.com/forge-dev-public/asundqui/rad/260217/poland-lod.rad',
    quaternion: [1, 0, 0, 0],
    scale: 0.05,
    cameraPosition: [43.7, -3.5, -1.7],
    cameraQuaternion: [-0.23, 0.241, 0.006, 0.943],
    background: '#cafefe',
    highDpi: !isMobile(),
    description: '100M splats scanned by Andrii Shramko'
  }
};

const applicationElement = document.querySelector<HTMLDivElement>('#app');
if (!applicationElement) {
  throw new Error('Spark LoD example requires an #app element.');
}

const canvas = document.createElement('canvas');
canvas.tabIndex = 0;
applicationElement.appendChild(canvas);

const overlayElement = document.createElement('div');
overlayElement.style.position = 'fixed';
overlayElement.style.left = '12px';
overlayElement.style.bottom = '12px';
overlayElement.style.maxWidth = 'min(520px, calc(100vw - 24px))';
overlayElement.style.color = '#ffffff';
overlayElement.style.textShadow = '0 1px 8px rgba(0, 0, 0, 0.6)';
overlayElement.style.pointerEvents = 'none';
applicationElement.appendChild(overlayElement);

const titleElement = document.createElement('h1');
titleElement.style.margin = '0 0 6px';
titleElement.style.fontSize = '18px';
titleElement.style.lineHeight = '24px';
titleElement.style.fontWeight = '700';
overlayElement.appendChild(titleElement);

const statusElement = document.createElement('p');
statusElement.style.margin = '0';
statusElement.style.fontSize = '13px';
statusElement.style.lineHeight = '18px';
overlayElement.appendChild(statusElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color('#000000');

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.01, 1000);
const renderer = new THREE.WebGLRenderer({canvas, antialias: false});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(BASE_PIXEL_RATIO);

const sparkRenderer = new SparkRenderer({
  renderer,
  pagedExtSplats: true,
  coneFov0: 70,
  coneFov: 120,
  behindFoveate: 0.2,
  coneFoveate: 0.4
});
scene.add(sparkRenderer);

const settings = {
  worldKey: INITIAL_WORLD_KEY
};
let selectedWorld: SplatMesh | null = null;
let selectedWorldRequestIndex = 0;

/** Resize the Three.js camera and renderer to match the browser viewport. */
function resizeRenderer(): void {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/** Apply camera, renderer, and mesh settings for a selected streaming LoD world. */
function selectWorld(worldKey: string): void {
  const requestIndex = ++selectedWorldRequestIndex;
  const world = WORLDS[worldKey];
  if (!world) {
    throw new Error(`Unknown Spark LoD world: ${worldKey}`);
  }

  if (selectedWorld) {
    scene.remove(selectedWorld);
    selectedWorld.dispose();
  }

  selectedWorld = new SplatMesh({url: world.url, paged: true});
  selectedWorld.quaternion.set(...(world.quaternion ?? [0, 0, 0, 1])).normalize();
  selectedWorld.position.set(...(world.position ?? [0, 0, 0]));
  selectedWorld.scale.setScalar(world.scale ?? 1);
  scene.add(selectedWorld);

  scene.background = new THREE.Color(world.background);
  camera.position.set(...(world.cameraPosition ?? [0, 0, 0]));
  camera.quaternion.set(...(world.cameraQuaternion ?? [0, 0, 0, 1])).normalize();
  sparkRenderer.lodSplatScale = world.lodSplatScale ?? 1;
  renderer.setPixelRatio(world.highDpi ? window.devicePixelRatio : BASE_PIXEL_RATIO);
  titleElement.textContent = worldKey;
  statusElement.textContent = `${world.description}. Streaming LoD pages...`;
  resizeRenderer();
  renderer.domElement.focus();

  void preflightRADSource(world.url).then(
    metadata => {
      if (requestIndex === selectedWorldRequestIndex) {
        const splatCount = metadata.count.toLocaleString();
        const chunkCount = metadata.chunks.length.toLocaleString();
        statusElement.textContent = `${world.description}. ${splatCount} splats across ${chunkCount} LoD chunks. Streaming LoD pages...`;
      }
    },
    error => {
      if (requestIndex === selectedWorldRequestIndex) {
        const errorMessage = getErrorMessage(error);
        statusElement.textContent = `${world.description}. Streaming LoD pages... ${errorMessage}`;
      }
    }
  );

  selectedWorld.initialized
    .then(mesh => {
      if (mesh === selectedWorld && requestIndex === selectedWorldRequestIndex) {
        statusElement.textContent = `${world.description}. LoD stream ready.`;
      }
    })
    .catch((error: unknown) => {
      if (requestIndex === selectedWorldRequestIndex) {
        statusElement.textContent = getErrorMessage(error);
      }
    });
}

/** Loads RAD metadata through loaders.gl before Spark starts paging chunk data. */
async function preflightRADSource(url: string): Promise<RADMetadata> {
  const source = (await load(url, RADSourceLoader)) as RADSource;
  return await source.getMetadata();
}

/** Convert unknown errors into concise display text. */
function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

window.addEventListener('resize', resizeRenderer);
selectWorld(settings.worldKey);

const gui = new GUI({title: 'Spark LoD'});
gui.add(settings, 'worldKey', Object.keys(WORLDS)).name('World').onChange(selectWorld);
gui.add(sparkRenderer, 'lodSplatScale', 0.01, 2.5, 0.001).name('Level of Detail').listen();
gui.add(sparkRenderer, 'lodRenderScale', 0.25, 5, 0.01).name('LoD Render Scale').listen();
gui.add(sparkRenderer, 'behindFoveate', 0, 1, 0.01).name('Behind Foveate').listen();
gui.add(sparkRenderer, 'coneFoveate', 0, 1, 0.01).name('Cone Foveate').listen();

const controls = new SparkControls({canvas: renderer.domElement});

renderer.setAnimationLoop(() => {
  controls.update(camera);
  renderer.render(scene, camera);
});
