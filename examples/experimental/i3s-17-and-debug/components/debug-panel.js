import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleDoubleLeft, faAngleDoubleRight} from '@fortawesome/free-solid-svg-icons';
import DebugOptionGroup from './debug-option-group';

import {
  TILE_COLOR_MODES,
  BOUNDING_VOLUME_COLOR_MODES,
  INITIAL_TILE_COLOR_MODE,
  INITIAL_BOUNDING_VOLUME_COLOR_MODE,
  BOUNDING_VOLUME_TYPE,
  BOUNDING_SPHERE
} from '../constants';

const Container = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  height: calc(100% - 20px);
  overflow-x: hidden;
  margin: 20px 0 0 0;
`;

const DebugOptions = styled.div`
  width: 300px;
  min-width: 300px;
  height: calc(100% - 20px);
  overflow: auto;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px 18px;
  margin: 0 0px 20px 20px;
  line-height: 2;
  outline: none;
  z-index: 100;
  box-sizing: border-box;
`;

const Header = styled.h3`
  margin: 0;
`;

const DropDown = styled.select`
  margin-bottom: 10px;
  margin-left: 3px;
  display: flex;
  width: 80%;
  cursor: pointer;
`;

const Expander = styled.div`
  top: calc(50% - 54px);
  width: 14px;
  padding: 10px 0px 10px 1px;
  background: #fff;
  z-index: 1;
  align-self: center;
  margin: 0 2px;
  cursor: pointer;
`;

const CheckboxOption = styled.div`
  display: flex;
  width: 100%;
  align-items: center;
`;

const InputCheckbox = styled.input`
  height: 18px;
  cursor: pointer;
`;

const Shapes = styled.select`
  position: relative;
  margin: 5px;
  width: 50px;
  margin-left: 40px;
  background-color: white;
`;

const ChildWrapper = styled.div`
  margin-top: 10px;
`;

const Label = styled.label`
  cursor: pointer;
`;

const DebugTextureContainer = styled.div`
  padding: 2px;
`;

const propTypes = {
  children: PropTypes.object,
  isClearButtonDisabled: PropTypes.bool,
  onOptionsChange: PropTypes.func,
  clearWarnings: PropTypes.func,
  debugTextureImage: PropTypes.string
};

const defaultProps = {
  clearWarnings: () => {},
  isClearButtonDisabled: true
};

export default class DebugPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expand: true,
      minimap: true,
      minimapViewport: false,
      boundingVolume: false,
      boundingVolumeType: BOUNDING_SPHERE,
      tileColorMode: INITIAL_TILE_COLOR_MODE,
      boundingVolumeColorMode: INITIAL_BOUNDING_VOLUME_COLOR_MODE,
      pickable: false,
      loadTiles: true,
      semanticValidator: false,
      showUVDebugTexture: false,
      wireframe: false
    };

    this._onToggleDebugPanel = this._onToggleDebugPanel.bind(this);
    this._onToggleMinimap = this._onToggleMinimap.bind(this);
    this._onToggleMinimapViewport = this._onToggleMinimapViewport.bind(this);
    this._onToggleBoundingVolume = this._onToggleBoundingVolume.bind(this);
    this._onChangeBoundingVolumeType = this._onChangeBoundingVolumeType.bind(this);
    this._onTogglePickable = this._onTogglePickable.bind(this);
    this._onToggleLoading = this._onToggleLoading.bind(this);
    this._onToggleSemanticValidator = this._onToggleSemanticValidator.bind(this);
    this._onToggleUvDebugTexture = this._onToggleUvDebugTexture.bind(this);
    this._onChangedTileColorMode = this._onChangedTileColorMode.bind(this);
    this._onChangedBoundingVolumeColorMode = this._onChangedBoundingVolumeColorMode.bind(this);
    this._onChangeWireframeMode = this._onChangeWireframeMode.bind(this);
  }

  _onToggleDebugPanel() {
    const {expand} = this.state;
    this.setState({expand: !expand});
  }

  _onToggleMinimap() {
    const {minimap} = this.state;
    this.setState({minimap: !minimap}, () => {
      this._applyOptions();
    });
  }

  _onToggleMinimapViewport() {
    const {minimapViewport} = this.state;
    this.setState({minimapViewport: !minimapViewport}, () => {
      this._applyOptions();
    });
  }

  _onToggleBoundingVolume() {
    const {boundingVolume} = this.state;
    this.setState({boundingVolume: !boundingVolume}, () => {
      this._applyOptions();
    });
  }

  _onTogglePickable() {
    const {pickable} = this.state;
    this.setState({pickable: !pickable}, () => {
      this._applyOptions();
    });
  }

  _onToggleLoading() {
    const {loadTiles} = this.state;
    this.setState({loadTiles: !loadTiles}, () => {
      this._applyOptions();
    });
  }

  _onToggleSemanticValidator() {
    const {semanticValidator} = this.state;
    this.setState({semanticValidator: !semanticValidator}, () => {
      this._applyOptions();
    });
  }

  _onToggleUvDebugTexture() {
    const {showUVDebugTexture} = this.state;
    this.setState({showUVDebugTexture: !showUVDebugTexture}, () => {
      this._applyOptions();
    });
  }

  _onChangedTileColorMode({tileColorMode}) {
    this.setState({tileColorMode}, () => {
      this._applyOptions();
    });
  }

  _onChangedBoundingVolumeColorMode({boundingVolumeColorMode}) {
    this.setState({boundingVolumeColorMode}, () => {
      this._applyOptions();
    });
  }

  _onChangeBoundingVolumeType({boundingVolumeType}) {
    this.setState({boundingVolumeType}, () => {
      this._applyOptions();
    });
  }

  _onChangeWireframeMode() {
    const {wireframe} = this.state;
    this.setState({wireframe: !wireframe}, () => {
      this._applyOptions();
    });
  }

  _applyOptions() {
    const {
      boundingVolume,
      tileColorMode,
      boundingVolumeColorMode,
      boundingVolumeType,
      pickable,
      minimap,
      loadTiles,
      minimapViewport,
      semanticValidator,
      showUVDebugTexture,
      wireframe
    } = this.state;
    const {onOptionsChange} = this.props;
    onOptionsChange({
      minimap,
      minimapViewport,
      boundingVolume,
      tileColorMode,
      boundingVolumeColorMode,
      boundingVolumeType,
      pickable,
      loadTiles,
      semanticValidator,
      showUVDebugTexture,
      wireframe
    });
  }

  _getExpandStyles() {
    const {expand} = this.state;
    if (expand) {
      return {
        marginLeft: '20px',
        transition: 'margin-left 800ms'
      };
    }
    return {
      marginLeft: '-300px',
      transition: 'margin-left 800ms'
    };
  }

  _clearButtonStyles(isClearButtonDisabled) {
    return {
      display: 'flex',
      color: 'white',
      background: isClearButtonDisabled ? 'gray' : 'red',
      alignItems: 'center',
      height: '20px',
      marginLeft: '50%',
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
    const {boundingVolumeColorMode, boundingVolume} = this.state;
    return (
      <DebugOptionGroup title="Bounding volumes">
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleBoundingVolume}
            type="checkbox"
            id="boundingVolume"
            value={boundingVolume}
            checked={boundingVolume}
          />
          <Label htmlFor="boundingVolume">Show</Label>
          {boundingVolume ? this._renderBoundingTypes() : null}
        </CheckboxOption>
        <DropDown
          value={boundingVolumeColorMode}
          onChange={evt => {
            this._onChangedBoundingVolumeColorMode({
              boundingVolumeColorMode: parseInt(evt.target.value, 10)
            });
          }}
        >
          {Object.keys(BOUNDING_VOLUME_COLOR_MODES).map(key => {
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
    const {boundingVolumeType} = this.state;

    return (
      <Shapes
        value={boundingVolumeType}
        onChange={evt => {
          this._onChangeBoundingVolumeType({
            boundingVolumeType: evt.target.value
          });
        }}
      >
        {Object.keys(BOUNDING_VOLUME_TYPE).map(key => {
          const shape = BOUNDING_VOLUME_TYPE[key];
          return (
            <option key={key} value={shape}>
              {key}
            </option>
          );
        })}
      </Shapes>
    );
  }

  _renderDebugTextureImage() {
    return (
      <DebugTextureContainer>
        <img src={this.props.debugTextureImage} alt="Debug Texture Image" width="100%" />
      </DebugTextureContainer>
    );
  }

  _renderTileOptions() {
    const {tileColorMode, pickable, loadTiles, showUVDebugTexture, wireframe} = this.state;
    return (
      <DebugOptionGroup title="Tiles">
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onTogglePickable}
            type="checkbox"
            id="pickable"
            value={pickable}
            checked={pickable}
          />
          <Label htmlFor="pickable">Pickable</Label>
        </CheckboxOption>
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleLoading}
            type="checkbox"
            id="loadTiles"
            value={loadTiles}
            checked={loadTiles}
          />
          <Label htmlFor="loadTiles">Load tiles</Label>
        </CheckboxOption>
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleUvDebugTexture}
            type="checkbox"
            id="uvDebugTexture"
            value={showUVDebugTexture}
            checked={showUVDebugTexture}
          />
          <Label htmlFor="uvDebugTexture">UV debug texture</Label>
        </CheckboxOption>
        {showUVDebugTexture ? this._renderDebugTextureImage() : null}
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onChangeWireframeMode}
            type="checkbox"
            id="wireframe"
            value={wireframe}
            checked={wireframe}
          />
          <Label htmlFor="wireframe">Wireframe mode</Label>
        </CheckboxOption>
        <DropDown
          value={tileColorMode}
          onChange={evt => {
            this._onChangedTileColorMode({tileColorMode: parseInt(evt.target.value, 10)});
          }}
        >
          {Object.keys(TILE_COLOR_MODES).map(key => {
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
    const {minimap, minimapViewport} = this.state;
    return (
      <DebugOptionGroup title="Frustum Culling">
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleMinimap}
            type="checkbox"
            id="showFrustumCullingMinimap"
            value={minimap}
            checked={minimap}
          />
          <Label htmlFor="showFrustumCullingMinimap">Show</Label>
        </CheckboxOption>
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleMinimapViewport}
            type="checkbox"
            id="showFrustumCullingMinimapViewport"
            value={minimapViewport}
            checked={minimapViewport}
          />
          <Label htmlFor="showFrustumCullingMinimapViewport">Use different viewports</Label>
        </CheckboxOption>
      </DebugOptionGroup>
    );
  }

  _renderSemanticValidatorOption() {
    const {clearWarnings, isClearButtonDisabled} = this.props;
    const {semanticValidator} = this.state;
    return (
      <DebugOptionGroup title="Semantic Validator">
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleSemanticValidator}
            type="checkbox"
            id="showSemanticValidator"
            value={semanticValidator}
            checked={semanticValidator}
          />
          <Label htmlFor="showSemanticValidator">Show</Label>
          <button
            style={this._clearButtonStyles(isClearButtonDisabled)}
            disabled={isClearButtonDisabled}
            onClick={clearWarnings}
          >
            Clear All
          </button>
        </CheckboxOption>
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
