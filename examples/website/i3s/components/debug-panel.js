import styled from 'styled-components';
import React, {PureComponent}from 'react';
import PropTypes from 'prop-types';

import DebugOptionGroup from './debug-option-group';
import ToggleSwitch from './toggle-switch';
import Checkbox from './checkbox';
import {Color, DropDownStyle, Font} from './styles';

import {TILE_COLOR_MODES, BOUNDING_VOLUME_COLOR_MODES, BOUNDING_VOLUME_TYPE} from '../constants';

const Container = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  overflow-x: hidden;
  z-index: 20;
  top: 175px;
  margin: 10px 15px 10px 0;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none; 
  @media (max-width: 768px) {
      bottom: 60px;
      margin: 0;
      top: 85px;
    }
`;

const DebugOptions = styled.div`
  ${Color}
  ${Font}
  border-radius: 8px;
  width: 278px;
  min-width: 278px;
  padding:  10px 15px 5px 15px;
  height: 100%;
  margin: 0 0 15px 15px;
  overflow: auto;
  outline: none;
  box-sizing: border-box;
  @media (max-width: 768px) {
      margin: 0;
      border-radius: 0;
      height: 550px;
`;

const Header = styled.h6`
  padding: 0;
  margin: 0 0 8px 0;
  font-weight: 500;
  line-height: 15px;
  text-transform: uppercase;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.6);
`;

const DropDown = styled.select`
  ${Color}
  ${Font}
  ${DropDownStyle}
  width: 167px;
  left: 86px;
  margin: 10px;
  @media (max-width: 768px) {
      width: 100%;
    }
`;


const CheckboxOption = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 246px;
  padding-bottom: 8px;
`

const Label = styled.label`
  cursor: pointer;
  color: rgba(255,255,255,.6);
  font-weight: bold;
`;

const Option = styled.h3`
  ${Color}
  ${Font}
  font-weight: 500;
  width: 70px;
  margin: 8px 15px 8px 0;
`;

const DebugTextureContainer = styled.div`
  padding: 5px;
  margin-left: 5px;
  width: 30%;
  &:hover {
    transition: all 1s;
    width: 85%;
  }
  @media (max-width: 768px) {
      display: none;
    }
`;

const SPAN_STYLE = { 
  marginLeft: 5, 
  cursor: 'pointer' 
}

const CHECKBOX_STYLE = {
  padding: '15px 0'
}

const propTypes = {
  onDebugOptionsChange: PropTypes.func,
  clearWarnings: PropTypes.func,
  debugTextureImage: PropTypes.string,
  debugOptions: PropTypes.object,
};

const defaultProps = {
  clearWarnings: () => {},
  onDebugOptionsChange: () => {}
};

export default class DebugPanel extends PureComponent {
  _onToggleDebugPanel() {
    const {expand} = this.state;
    this.setState({expand: !expand});
  }

  _renderBoundingVolumeColor() {
    const {
      debugOptions: {boundingVolumeColorMode},
      onDebugOptionsChange
    } = this.props;
    return (
      <CheckboxOption>
        <Option>Color</Option>
        <DropDown
          value={boundingVolumeColorMode}
          onChange={(evt) =>
            onDebugOptionsChange({boundingVolumeColorMode: parseInt(evt.target.value, 10)})
          }
        >
        
          {Object.keys(BOUNDING_VOLUME_COLOR_MODES).map((key) => {
            return (
              <option key={key} value={BOUNDING_VOLUME_COLOR_MODES[key]}>
                {key}
              </option>
            );
          })}
        </DropDown>
      </CheckboxOption>
    );
  }

  _renderBoundingVolumeTypes() {
    const {
      debugOptions: {boundingVolumeType},
      onDebugOptionsChange
    } = this.props;

    return (
      <CheckboxOption>
        <Option>Type</Option>
        <DropDown
          value={boundingVolumeType}
          onChange={(evt) => onDebugOptionsChange({boundingVolumeType: evt.target.value})}
        >
          {Object.keys(BOUNDING_VOLUME_TYPE).map((key) => {
            const shape = BOUNDING_VOLUME_TYPE[key];
            return (
              <option key={key} value={shape}>
                {key}
              </option>
            );
          })}
        </DropDown>
      </CheckboxOption>
    );
  }

  _renderBoundingVolume() {
    const {
      debugOptions: {boundingVolume}, onDebugOptionsChange} = this.props;
    return (
      <DebugOptionGroup>
        <CheckboxOption style={CHECKBOX_STYLE}>
          <Label htmlFor="boundingVolume">Bounding Volumes</Label>
          <ToggleSwitch
            id="boundingVolume"
            value={boundingVolume}
            checked={boundingVolume}
            onChange={() => onDebugOptionsChange({boundingVolume: !boundingVolume})}
          />
        </CheckboxOption>
        {boundingVolume ? this._renderBoundingVolumeTypes() : null}
        {boundingVolume ? this._renderBoundingVolumeColor() : null}
      </DebugOptionGroup>
    )
  }

  _renderDebugTextureImage() {
    return (
      <DebugTextureContainer>
        <img 
        src={this.props.debugTextureImage} 
        alt="Debug Texture Image" 
        width="100%" />
      </DebugTextureContainer>
    );
  }

  _renderTileOptions() {
    const {
      debugOptions: {tileColorMode, pickable, loadTiles, showUVDebugTexture, wireframe},
      onDebugOptionsChange
    } = this.props;
    return (
      <DebugOptionGroup>
        <CheckboxOption style={CHECKBOX_STYLE}>
          <Label>Tiles</Label>
        </CheckboxOption>
        <CheckboxOption>
          <label>
          <Checkbox
            id="loadTiles"
            value={loadTiles}
            checked={loadTiles}
            onChange={() => onDebugOptionsChange({loadTiles: !loadTiles})}
          />
          <span style={SPAN_STYLE}>Load tiles</span>
          </label>
        </CheckboxOption>
        <CheckboxOption>
          <label>
            <Checkbox
              id="pickable"
              value={pickable}
              checked={pickable}
              onChange={() => onDebugOptionsChange({pickable: !pickable})}>
            </Checkbox>
            <span style={SPAN_STYLE}>Picking</span>
          </label>
        </CheckboxOption>
        <CheckboxOption>
          <label>
            <Checkbox
              id="uvDebugTexture"
              value={showUVDebugTexture}
              checked={showUVDebugTexture}
              onChange={() => onDebugOptionsChange({showUVDebugTexture: !showUVDebugTexture})}
            />
            <span style={SPAN_STYLE}>Texture UVs</span>
          </label>
        </CheckboxOption>
        {showUVDebugTexture ? this._renderDebugTextureImage() : null}
        <CheckboxOption>
          <label>
            <Checkbox
              id="wireframe"
              value={wireframe}
              checked={wireframe}
              onChange={() => onDebugOptionsChange({wireframe: !wireframe})}
            />
            <span style={SPAN_STYLE}>Wireframe</span>
          </label>
        </CheckboxOption>
        <CheckboxOption>
          <Option>Color</Option>
          <DropDown
            id="color"
            value={tileColorMode}
            onChange={(evt) => onDebugOptionsChange({tileColorMode: parseInt(evt.target.value, 10)})}
          >
            {Object.keys(TILE_COLOR_MODES).map((key) => {
              return (
                <option key={key} value={TILE_COLOR_MODES[key]}>
                  {key}
                </option>
              );
            })}
          </DropDown>
        </CheckboxOption>
      </DebugOptionGroup>
    );
  }

  _renderMiniMap() {
    const {debugOptions: {minimapViewport}, onDebugOptionsChange} = this.props;
    return (
      <CheckboxOption>
        <label>
          <Checkbox
            id="showFrustumCullingMinimapViewport"
            value={minimapViewport}
            checked={minimapViewport}
            onChange={() => onDebugOptionsChange({minimapViewport: !minimapViewport})}
          />
          <span style={SPAN_STYLE}>Different viewports</span>
        </label>
      </CheckboxOption>
    )
  }

  _renderFrustumCullingOption() {
    const {
      debugOptions: {minimap},
      onDebugOptionsChange
    } = this.props;
    return (
      <DebugOptionGroup>
        <CheckboxOption style={CHECKBOX_STYLE}>
          <Label htmlFor="showFrustumCullingMinimap">Minimap</Label>
          <ToggleSwitch
            id="showFrustumCullingMinimap"
            value={minimap}
            checked={minimap}
            onChange={() => onDebugOptionsChange({minimap: !minimap})}
          />
        </CheckboxOption>
        {minimap ? this._renderMiniMap() : null}
      </DebugOptionGroup>
    );
  }

  render() {
    return (
      <Container className="debug-panel">
        <DebugOptions>
          <Header>Debug Panel</Header>
          {this._renderFrustumCullingOption()}
          {this._renderTileOptions()}
          {this._renderBoundingVolume()}
        </DebugOptions>
      </Container>
    );
  }
}

DebugPanel.propTypes = propTypes;
DebugPanel.defaultProps = defaultProps;
