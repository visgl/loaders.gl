import styled from 'styled-components';
import React, {PureComponent}from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleDoubleLeft, faAngleDoubleRight} from '@fortawesome/free-solid-svg-icons';
import DebugOptionGroup from './debug-option-group';
import ToggleSwitch from './toggle-switch';

import {TILE_COLOR_MODES, BOUNDING_VOLUME_COLOR_MODES, BOUNDING_VOLUME_TYPE} from '../constants';

const Container = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  overflow-x: hidden;
  z-index: 1;
  @media screen and (max-width: 768px) {
   top: 120px;
  }
`;

const DebugOptions = styled.div`
  width: 270px;
  min-width: 270px;
  margin: 5px;
  padding: 10px;
  text-transform: uppercase;
  font-size: 11px;
  min-width: 270px;
  height: 100%;
  overflow: auto;
  background: rgba(36, 39, 48, 0.7);
  line-height: 1;
  outline: none;
  z-index: 1;
  box-sizing: border-box;
  @media screen and (max-width: 768px) {
   margin: 0;
  };
`;

const Header = styled.h3`
  margin: 0;
  padding: 5px;
  color: #00ADE6;
  text-shadow: 1px 1px 1px #212529;
  text-align: center;
  top: 0px;
  position: relative;
  border-radius: 2px;
  text-transform: uppercase;
  @media screen and (max-width: 768px) {
    padding: 3px;
  }
`;

const DropDown = styled.select`
  padding: 5px;
  display: flex;
  width: 96%;
  margin: 5px;
  cursor: pointer;
  background: rgba(36, 39, 48, 0.7);
  border: none;
  color: #ced4da;
  font-size: 11px;
  jusify-content: center;
`;

const Expander = styled.div`
  top: calc(50% - 54px);
  width: 14px;
  padding: 10px 0px 10px 1px;
  background: rgba( 36, 39, 48, 0.7);
  color: #00ADE6;
  z-index: 1;
  align-self: center;
  margin: 0px 2px;
  cursor: pointer;
`;

const CheckboxOption = styled.div`
  display: flex;
  line-height: 2;
  &:hover {
    transition: all 1s;
    color: white;
  }
`;

const ChildWrapper = styled.div`
  margin-top: 10px;
`;

const Label = styled.label`
  cursor: pointer;
`;

const DebugTextureContainer = styled.div`
  padding: 2px;
  width: 50%;
  margin-left: 60px;
`;

const propTypes = {
  children: PropTypes.object,
  isClearButtonDisabled: PropTypes.bool,
  onDebugOptionsChange: PropTypes.func,
  clearWarnings: PropTypes.func,
  debugTextureImage: PropTypes.string,
  debugOptions: PropTypes.object
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
        marginLeft: '5px',
        transition: 'margin-left 800ms'
      };
    }
    return {
      marginLeft: '-270px',
      transition: 'margin-left 800ms'
    };
  }

  _clearButtonStyles(isClearButtonDisabled) {
    return {
      display: 'flex',
      background: isClearButtonDisabled ? '#212529' : '#00ADE6',
      color: isClearButtonDisabled ? '#f2e9e4' : 'rgb(36,39,48)',
      alignItems: 'center',
      height: '20px',
      marginLeft: '150px',
      width: '70px',
      fontSize: '10px',
      borderRadius: '2px',
      textTransform: 'uppercase',
      cursor: isClearButtonDisabled ? 'auto' : 'pointer'
    };
  }

  _renderExpandIcon() {
    const {expand} = this.state;
    if (expand) {
      return <FontAwesomeIcon icon={faAngleDoubleLeft} />;
    }
    return <FontAwesomeIcon icon={faAngleDoubleRight} />;
  }

  _renderBoundingVolumeOptions() {
    const {
      debugOptions: {boundingVolumeColorMode, boundingVolume},
      onDebugOptionsChange
    } = this.props;
    return (
      <DebugOptionGroup title="Bounding volumes">
        <CheckboxOption>
          <Label htmlFor="boundingVolume">Show</Label>
          <ToggleSwitch
            id="boundingVolume"
            value={boundingVolume}
            checked={boundingVolume}
            onChange={() => onDebugOptionsChange({boundingVolume: !boundingVolume})}
          />
          {boundingVolume ? this._renderBoundingTypes() : null}
        </CheckboxOption>
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
      </DebugOptionGroup>
    );
  }

  _renderBoundingTypes() {
    const {
      debugOptions: {boundingVolumeType},
      onDebugOptionsChange
    } = this.props;

    return (
      <DropDown
        style={{width: '60px', padding: '0', margin: '0 0 0 50px'}}
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
    );
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
          <Label htmlFor="pickable">Pickable</Label>
          <ToggleSwitch
            id="pickable"
            value={pickable}
            checked={pickable}
            onChange={() => onDebugOptionsChange({pickable: !pickable})}
          />
        </CheckboxOption>
        <CheckboxOption>
          <Label htmlFor="loadTiles">Load tiles</Label>
          <ToggleSwitch
            id="loadTiles"
            value={loadTiles}
            checked={loadTiles}
            onChange={() => onDebugOptionsChange({loadTiles: !loadTiles})}
          />
        </CheckboxOption>
        <CheckboxOption>
          <Label htmlFor="uvDebugTexture">UV debug texture</Label>
          <ToggleSwitch
            id="uvDebugTexture"
            value={showUVDebugTexture}
            checked={showUVDebugTexture}
            onChange={() => onDebugOptionsChange({showUVDebugTexture: !showUVDebugTexture})}
          />
        </CheckboxOption>
        {showUVDebugTexture ? this._renderDebugTextureImage() : null}
        <CheckboxOption>
          <Label htmlFor="wireframe">Wireframe mode</Label>
          <ToggleSwitch
            id="wireframe"
            value={wireframe}
            checked={wireframe}
            onChange={() => onDebugOptionsChange({wireframe: !wireframe})}
          />
        </CheckboxOption>
        <DropDown
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
      </DebugOptionGroup>
    );
  }

  _renderFrustumCullingOption() {
    const {
      debugOptions: {minimap, minimapViewport},
      onDebugOptionsChange
    } = this.props;
    return (
      <DebugOptionGroup title="Frustum Culling">
        <CheckboxOption>
          <Label htmlFor="showFrustumCullingMinimap">Show</Label>
          <ToggleSwitch
            id="showFrustumCullingMinimap"
            value={minimap}
            checked={minimap}
            onChange={() => onDebugOptionsChange({minimap: !minimap})}
          />
        </CheckboxOption>
        <CheckboxOption>
          <Label htmlFor="showFrustumCullingMinimapViewport">Use different viewports</Label>
          <ToggleSwitch
            id="showFrustumCullingMinimapViewport"
            value={minimapViewport}
            checked={minimapViewport}
            onChange={() => onDebugOptionsChange({minimapViewport: !minimapViewport})}
          />
        </CheckboxOption>
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
      <DebugOptionGroup title="Semantic Validator">
        <CheckboxOption>
          <Label htmlFor="showSemanticValidator">Show</Label>
          <ToggleSwitch
            id="showSemanticValidator"
            value={semanticValidator}
            checked={semanticValidator}
            onChange={() => onDebugOptionsChange({semanticValidator: !semanticValidator})}
          />
        </CheckboxOption>
        <button
            style={this._clearButtonStyles(isClearButtonDisabled)}
            disabled={isClearButtonDisabled}
            onClick={clearWarnings}
          >
            Clear All
          </button>
      </DebugOptionGroup>
    );
  }

  render() {
    const {children} = this.props;
    return (
      <Container className="debug-panel">
        <DebugOptions style={this._getExpandStyles()}>
          <Header>Debug Panel</Header>
          {this._renderFrustumCullingOption()}
          {this._renderTileOptions()}
          {this._renderBoundingVolumeOptions()}
          {this._renderSemanticValidatorOption()}
          <ChildWrapper>{children}</ChildWrapper>
        </DebugOptions>
        <Expander onClick={this._onToggleDebugPanel}>{this._renderExpandIcon()}</Expander>
      </Container>
    );
  }
}

DebugPanel.propTypes = propTypes;
DebugPanel.defaultProps = defaultProps;
