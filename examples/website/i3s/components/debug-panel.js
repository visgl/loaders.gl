import styled from 'styled-components';
import React, {PureComponent}from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleDoubleLeft, faAngleDoubleRight} from '@fortawesome/free-solid-svg-icons';

import DebugOptionGroup from './debug-option-group';
import ToggleSwitch from './toggle-switch';
import Checkbox from './checkbox';
import {DropDown} from './control-panel';
import {Color, Flex, Font} from './styles';

import {TILE_COLOR_MODES, BOUNDING_VOLUME_COLOR_MODES, BOUNDING_VOLUME_TYPE} from '../constants';

const Container = styled.div`
  ${Flex}
  flex-direction: row;
  z-index: 1;
  top: 120px;
  margin: 15px;
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
  padding: 15px;
  height: 100%;
  margin: 0 0 15px 0;
  overflow: auto;
  outline: none;
  z-index: 1;
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
  top: calc(50% - 54px);
  width: 14px;
  padding: 10px 0 10px 0;
  border-radius: 3px;
  background: #0E111A;
  color: #4F52CC;
  z-index: 1;
  align-self: center;
  margin: 0px 10px;
  cursor: pointer;
  flex-direction: row;
`;

const CheckboxOption = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 246px;
`;

const Label = styled.label`
  cursor: pointer;
  margin: 8px 0 8px 0;
`;

const Option = styled.h3`
  ${Color}
  ${Font}
  font-weight: 500;
  width: 70px;
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
  isClearButtonDisabled: PropTypes.bool,
  onDebugOptionsChange: PropTypes.func,
  clearWarnings: PropTypes.func,
  debugTextureImage: PropTypes.string,
  debugOptions: PropTypes.object,
};

const defaultProps = {
  clearWarnings: () => {},
  onDebugOptionsChange: () => {},
  isClearButtonDisabled: true
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
        marginLeft: '0',
        transition: 'margin-left 800ms'
      };
    }
    return {
      marginLeft: '-293px',
      transition: 'margin-left 800ms'
    };
  }

  _renderExpandIcon() {
    const {expand} = this.state;
    if (expand) {
      return <FontAwesomeIcon icon={faAngleDoubleLeft} />;
    }
    return <FontAwesomeIcon icon={faAngleDoubleRight} />;
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
        <CheckboxOption style={{borderTop: 'rgba(255,255,255, .6)'}}>
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
      <DebugOptionGroup title="Tiles">
        <CheckboxOption>
          <Checkbox
            id="loadTiles"
            value={loadTiles}
            checked={loadTiles}
            onChange={() => onDebugOptionsChange({loadTiles: !loadTiles})}
          /> 
          <Label htmlFor="loadTiles">Load tiles</Label>
        </CheckboxOption>
        <CheckboxOption>
          <Checkbox
            id="pickable"
            value={pickable}
            checked={pickable}
            onChange={() => onDebugOptionsChange({pickable: !pickable})}
          />
          <Label htmlFor="pickable">Picking</Label>
        </CheckboxOption>
        <CheckboxOption>
          <Checkbox
            id="uvDebugTexture"
            value={showUVDebugTexture}
            checked={showUVDebugTexture}
            onChange={() => onDebugOptionsChange({showUVDebugTexture: !showUVDebugTexture})}
          />
          <Label htmlFor="uvDebugTexture">Texture UVs</Label>
        </CheckboxOption>
        {showUVDebugTexture ? this._renderDebugTextureImage() : null}
        <CheckboxOption>
          <Checkbox
            id="wireframe"
            value={wireframe}
            checked={wireframe}
            onChange={() => onDebugOptionsChange({wireframe: !wireframe})}
          />
          <Label htmlFor="wireframe">Wireframe</Label>
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
        <Checkbox
          id="showFrustumCullingMinimapViewport"
          value={minimapViewport}
          checked={minimapViewport}
          onChange={() => onDebugOptionsChange({minimapViewport: !minimapViewport})}
        />
        <Label htmlFor="showFrustumCullingMinimapViewport">Different viewports</Label>
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
          <Label htmlFor="showFrustumCullingMinimap" style={{color: 'rgba(255,255,255,.6', fontWeight:'bold'}}>Frustum Culling</Label>
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

  _renderSemanticValidatorOption() {
    const {
      clearWarnings,
      isClearButtonDisabled,
      debugOptions: {semanticValidator},
      onDebugOptionsChange
    } = this.props;
    return (
      <DebugOptionGroup>
        <CheckboxOption>
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
        </DebugOptions>
        <Expander onClick={this._onToggleDebugPanel}>{this._renderExpandIcon()}</Expander>
      </Container>
    );
  }
}

DebugPanel.propTypes = propTypes;
DebugPanel.defaultProps = defaultProps;
