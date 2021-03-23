/* eslint-disable camelcase */
import {GLTF_DEFAULT_MODEL, GLTF_BASE_URL} from './examples';

export function addModelsToDropdown(models, onChange) {
  const modelDropdown = document.getElementById('modelSelector');
  if (!modelDropdown) {
    return;
  }

  const VARIANTS = ['glTF-Draco', 'glTF-Binary', 'glTF-Embedded', 'glTF'];

  models.forEach(({name, variants}) => {
    const variant = VARIANTS.find(v => variants[v]);

    const option = document.createElement('option');
    option.text = `${name} (${variant})`;
    option.value = `${name}/${variant}/${variants[variant]}`;
    modelDropdown.appendChild(option);
  });

  modelDropdown.onchange = event => {
    const modelUrl = (modelDropdown && modelDropdown.value) || GLTF_DEFAULT_MODEL;
    onChange(`${GLTF_BASE_URL}/${modelUrl}`);
  };
}

export function getSelectedModel() {
  const modelSelector = document.getElementById('modelSelector');
  const modelUrl = (modelSelector && modelSelector.value) || GLTF_DEFAULT_MODEL;

  return `${GLTF_BASE_URL}/${modelUrl}`;
}

export function onSettingsChange(onChange) {
  const showSelector = document.getElementById('showSelector');
  if (showSelector) {
    showSelector.onchange = event => {
      const value = showSelector.value.split(' ').map(x => parseFloat(x));
      onChange({
        u_ScaleDiffBaseMR: value.slice(0, 4),
        u_ScaleFGDSpec: value.slice(4)
      });
    };
  }

  const lightSelector = document.getElementById('lightSelector');
  if (lightSelector) {
    lightSelector.onchange = event => {
      onChange({
        light: lightSelector.value
      });
    };
  }
}

export function onLightSettingsChange(onChange) {
  const iblSelector = document.getElementById('iblSelector');
  if (iblSelector) {
    iblSelector.onchange = event => {
      onChange(getLightSettings(iblSelector.value));
    };
  }
}

function getLightSettings(value) {
  switch (value) {
    case 'exclusive':
      return {
        imageBasedLightingEnvironment: true,
        lights: false
      };

    case 'addition':
      return {
        imageBasedLightingEnvironment: true,
        lights: true
      };

    case 'off':
      return {
        imageBasedLightingEnvironment: null,
        lights: true
      };

    default:
      return {};
  }
}

export const INFO_HTML = `
<p><b>glTF Loader</b>.</p>
<p>Rendered using luma.gl.</p>
<div>
  Model<br/>
  <select id="modelSelector" style="border: 1px solid gray; width: 200px;">
    <option value="${GLTF_DEFAULT_MODEL}">Default</option>
  </select>
  <br>
</div>
<div>
  Show<br/>
  <select id="showSelector" style="border: 1px solid gray; width: 200px;">
    <option value="0 0 0 0 0 0 0 0">Final Result</option>

    <option value="0 1 0 0 0 0 0 0">Base Color</option>
    <option value="0 0 1 0 0 0 0 0">Metallic</option>
    <option value="0 0 0 1 0 0 0 0">Roughness</option>
    <option value="1 0 0 0 0 0 0 0">Diffuse</option>

    <option value="0 0 0 0 1 0 0 0">Specular Reflection</option>
    <option value="0 0 0 0 0 1 0 0">Geometric Occlusion</option>
    <option value="0 0 0 0 0 0 1 0">Microfacet Distribution</option>
    <option value="0 0 0 0 0 0 0 1">Specular</option>
  </select>
  <br>
</div>
<div>
  Regular Lights<br/>
  <select id="lightSelector" style="border: 1px solid gray; width: 200px;">
    <option value="default">Default</option>
    <option value="ambient">Ambient Only</option>
    <option value="directional1">1x Directional (Red) + Ambient</option>
    <option value="directional3">3x Directional (RGB)</option>
    <option value="point1far">1x Point Light Far (Red) + Ambient</option>
    <option value="point1near">1x Point Light Near (Red) + Ambient</option>
  </select>
  <br>
</div>
<div>
  Image-Based Light<br/>
  <select id="iblSelector" style="border: 1px solid gray; width: 200px;">
    <option value="exclusive">On (Exclusive)</option>
    <option value="addition">On (Addition to Regular)</option>
    <option value="off">Off (Only Regular)</option>
  </select>
  <br/>
</div>
<p><img src="https://img.shields.io/badge/WebVR-Supported-orange.svg" /></p>
`;

export const LIGHT_SOURCES = {
  default: {
    directionalLights: [
      {
        color: [255, 255, 255],
        direction: [0.0, 0.5, 0.5],
        intensity: 1.0
      }
    ]
  },
  ambient: {
    ambientLight: {
      color: [255, 255, 255],
      intensity: 1.0
    }
  },
  directional1: {
    directionalLights: [
      {
        color: [255, 0, 0],
        direction: [1.0, 0.0, 0.0],
        intensity: 1.0
      }
    ],
    ambientLight: {
      color: [255, 255, 255],
      intensity: 1.0
    }
  },
  directional3: {
    directionalLights: [
      {
        color: [255, 0.0, 0.0],
        direction: [1.0, 0.0, 0.0],
        intensity: 1.0
      },
      {
        color: [0.0, 0.0, 255],
        direction: [0.0, 0.0, 1.0],
        intensity: 1.0
      },
      {
        color: [0.0, 255, 0.0],
        direction: [0.0, 1.0, 0.0],
        intensity: 1.0
      }
    ]
  },
  point1far: {
    pointLights: [
      {
        color: [255, 0, 0],
        position: [200.0, 0.0, 0.0],
        attenuation: [0, 0, 0.01],
        intensity: 1.0
      }
    ],
    ambientLight: {
      color: [255, 255, 255],
      intensity: 1.0
    }
  },
  point1near: {
    pointLights: [
      {
        color: [255, 0, 0],
        position: [10.0, 0.0, 0.0],
        attenuation: [0, 0, 0.01],
        intensity: 1.0
      }
    ],
    ambientLight: {
      color: [255, 255, 255],
      intensity: 1.0
    }
  }
};
