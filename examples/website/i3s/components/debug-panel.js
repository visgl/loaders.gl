import styled from 'styled-components';
import React, {PureComponent}from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faChevronLeft, faChevronRight} from '@fortawesome/free-solid-svg-icons';

import DebugOptionGroup from './debug-option-group';
import ToggleSwitch from './toggle-switch';
import Checkbox from './checkbox';
import {DropDown} from './control-panel';
import {Color, Font} from './styles';

import {TILE_COLOR_MODES, BOUNDING_VOLUME_COLOR_MODES, BOUNDING_VOLUME_TYPE} from '../constants';

const Container = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  overflow-x: hidden;
  z-index: 20;
  top: 120px;
  margin: 10px 15px 10px 0;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none; 
`;

const DebugOptions = styled.div`
  ${Color}
  ${Font}
  border-radius: 8px;
  width: 278px;
  min-width: 278px;
  padding:  10px 15px 0px 15px;
  height: 100%;
  margin: 0 0 15px 15px;
  overflow: auto;
  outline: none;
  box-sizing: border-box;
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

const Expander = styled.div`
  ${Color}
  display: flex;
  align-items: center;
  justify-content: center;
  top: calc(50% - 54px);
  width: 20px;
  height: 30px;
  border-radius: 4px;
  align-self: center;
  margin: 0px 10px;
  cursor: pointer;
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
`;

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
  constructor(props) {
    super(props);
    this.state = {
      expand: true
    };

    this._onToggleDebugPanel = this._onToggleDebugPanel.bind(this);
  }

  _onToggleDebugPanel() {
    const {expand} = this.state;
    this.setState({expand: !expand});
  }

  _getExpandStyles() {
    const {expand} = this.state;
    if (expand) {
      return {
        marginLeft: '15px',
        transition: 'all 0.5s'
      };
    }
    return {
      marginLeft: '-278px',
      transition: 'all 0.5s'
    };
  }

  _renderExpandIcon() {
    const {expand} = this.state;
    if (expand) {
      return <FontAwesomeIcon icon={faChevronLeft} />;
    }
    return <FontAwesomeIcon icon={faChevronRight} />;
  }

  _renderBoundingVolumeColor() {
    const {
      debugOptions: {boundingVolumeColorMode},
      onDebugOptionsChange
    } = this.props;
    return (
      <CheckboxOption style={{margin: '0'}}>
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
        <CheckboxOption style={{borderTop: 'rgba(255,255,255, .6)', padding: '0 0 16px 0'}}>
          <Label htmlFor="boundingVolume" style={{color: 'rgba(255,255,255,.6', fontWeight:'bold'}}>Bounding Volumes</Label>
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
      <DebugOptionGroup style={{cursor: 'pointer'}}>
      <Label htmlFor="showFrustumCullingMinimap" style={{color: 'rgba(255,255,255,.6)', fontWeight: 'bold', lineHeight: '185%'}}>Tiles</Label>
        <CheckboxOption>
          <label>
          <Checkbox
            id="loadTiles"
            value={loadTiles}
            checked={loadTiles}
            onChange={() => onDebugOptionsChange({loadTiles: !loadTiles})}
          />
          <span style={{ marginLeft: 5 }}>Load tiles</span>
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
            <span style={{ marginLeft: 5 }}>Picking</span>
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
            <span style={{ marginLeft: 5 }}>Texture UVs</span>
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
            <span style={{ marginLeft: 5 }}>Wireframe</span>
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
          <span style={{ marginLeft: 5 }}>Different viewports</span>
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
        <CheckboxOption>
          <Label htmlFor="showFrustumCullingMinimap" style={{color: 'rgba(255,255,255,.6', fontWeight:'bold'}}>Minimap</Label>
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

  _renderMemoryUsage() {
    const {
      debugOptions: {showMemory},
      onDebugOptionsChange
    } = this.props;

    return (
      <CheckboxOption style={{padding: '16px 0 16px 0'}}>
      <Label htmlFor="showMemory" style={{color: 'rgba(255,255,255,.6', fontWeight:'bold'}}>Memory usage</Label>
        <ToggleSwitch
          id="showMemory"
          value={showMemory}
          checked={showMemory}
          onChange={() => onDebugOptionsChange({showMemory: !showMemory})}
        />
      </CheckboxOption>
    )
  }

  _renderSemanticValidatorOption() {
    const {
      debugOptions: {semanticValidator},
      onDebugOptionsChange
    } = this.props;
    return (
      <DebugOptionGroup>
        <CheckboxOption style={{padding: '0 0 16px 0'}}>
          <Label htmlFor="showSemanticValidator" style={{color: 'rgba(255,255,255,.6', fontWeight:'bold'}}>Semantic Validator</Label>
          <ToggleSwitch
            id="showSemanticValidator"
            value={semanticValidator}
            checked={semanticValidator}
            onChange={() => onDebugOptionsChange({semanticValidator: !semanticValidator})}
          />
        </CheckboxOption>
      </DebugOptionGroup>
    );
  }

  render() {
    return (
      <Container className="debug-panel">
        <DebugOptions style={this._getExpandStyles()}>
          <Header>Debug Panel</Header>
          {this._renderFrustumCullingOption()}
          {this._renderTileOptions()}
          {this._renderBoundingVolume()}
          {this._renderSemanticValidatorOption()}
          {this._renderMemoryUsage()}
        </DebugOptions>
        <Expander onClick={this._onToggleDebugPanel}>{this._renderExpandIcon()}</Expander>
      </Container>
    );
  }
}

DebugPanel.propTypes = propTypes;
DebugPanel.defaultProps = defaultProps;
