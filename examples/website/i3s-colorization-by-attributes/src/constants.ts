import {MapController} from '@deck.gl/core';
import {COLOR} from './types';

export const EXAMPLES = {
  'New York': {
    name: 'New York',
    url: 'https://tiles.arcgis.com/tiles/P3ePLMYs2RVChkJx/arcgis/rest/services/Buildings_NewYork_17/SceneServer/layers/0'
  }
};

export const TRANSITION_DURAITON = 4000;

export const MAP_CONTROLLER = {
  type: MapController,
  maxPitch: 60,
  inertia: true,
  scrollZoom: {speed: 0.01, smooth: true},
  touchRotate: true,
  dragMode: false
};

export const INITIAL_VIEW_STATE = {
  longitude: -120,
  latitude: 34,
  pitch: 45,
  maxPitch: 90,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

export const COLORIZE_MODES = ['replace', 'multiply', 'none'];

export const COLORS_BY_ATTRIBUTE: {
  min: {
    hex: string;
    rgba: COLOR;
  };
  max: {
    hex: string;
    rgba: COLOR;
  };
} = {
  min: {
    hex: '#9292FC',
    rgba: [146, 146, 252, 255]
  },
  max: {
    hex: '#2C2CAF',
    rgba: [44, 44, 175, 255]
  }
};
