import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleDoubleLeft, faAngleDoubleRight} from '@fortawesome/free-solid-svg-icons';
import DebugOptionGroup from './debug-option-group';

import {
  TILE_COLOR_MODES,
  OBB_COLOR_MODES,
  INITIAL_TILE_COLOR_MODE,
  INITIAL_OBB_COLOR_MODE
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
`;

const Expander = styled.div`
  top: calc(50% - 54px);
  width: 14px;
  padding: 10px 0px 10px 1px;
  background: #fff;
  z-index: 1;
  align-self: center;
  margin: 0 2px;
`;

const CheckboxOption = styled.div`
  display: flex;
  width: 100%;
`;

const InputCheckbox = styled.input`
  height: 18px;
`;

const ChildWrapper = styled.div`
  margin-top: 10px;
`;

const propTypes = {
  children: PropTypes.object,
  isClearButtonDisabled: PropTypes.bool,
  onOptionsChange: PropTypes.func,
  clearWarnings: PropTypes.func
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
      obb: false,
      tileColorMode: INITIAL_TILE_COLOR_MODE,
      obbColorMode: INITIAL_OBB_COLOR_MODE,
      pickable: false,
      loadTiles: true,
      semanticValidator: false,
      useUvChecker: false
    };

    this._onToggleDebugPanel = this._onToggleDebugPanel.bind(this);
    this._onToggleMinimap = this._onToggleMinimap.bind(this);
    this._onToggleMinimapViewport = this._onToggleMinimapViewport.bind(this);
    this._onToggleObb = this._onToggleObb.bind(this);
    this._onTogglePickable = this._onTogglePickable.bind(this);
    this._onToggleLoading = this._onToggleLoading.bind(this);
    this._onToggleSemanticValidator = this._onToggleSemanticValidator.bind(this);
    this._onToggleUvChecker = this._onToggleUvChecker.bind(this);

    this._onChangedTileColorMode = this._onChangedTileColorMode.bind(this);
    this._onChangedObbColorMode = this._onChangedObbColorMode.bind(this);
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

  _onToggleObb() {
    const {obb} = this.state;
    this.setState({obb: !obb}, () => {
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

  _onToggleUvChecker() {
    const {useUvChecker} = this.state;
    this.setState({useUvChecker: !useUvChecker}, () => {
      this._applyOptions();
    });
  }

  _onChangedTileColorMode({tileColorMode}) {
    this.setState({tileColorMode}, () => {
      this._applyOptions();
    });
  }

  _onChangedObbColorMode({obbColorMode}) {
    this.setState({obbColorMode}, () => {
      this._applyOptions();
    });
  }

  _applyOptions() {
    const {
      obb,
      tileColorMode,
      obbColorMode,
      pickable,
      minimap,
      loadTiles,
      minimapViewport,
      semanticValidator,
      useUvChecker
    } = this.state;
    const {onOptionsChange} = this.props;
    onOptionsChange({
      minimap,
      minimapViewport,
      obb,
      tileColorMode,
      obbColorMode,
      pickable,
      loadTiles,
      semanticValidator,
      useUvChecker
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

  _renderObbOptions() {
    const {obbColorMode, obb} = this.state;
    return (
      <DebugOptionGroup title="Bounding volumes">
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleObb}
            type="checkbox"
            id="obb"
            value={obb}
            checked={obb}
          />
          <label htmlFor="obb">Show</label>
        </CheckboxOption>
        <DropDown
          value={obbColorMode}
          onChange={evt => {
            const selected = evt.target.value;
            this._onChangedObbColorMode({obbColorMode: parseInt(selected, 10)});
          }}
        >
          {Object.keys(OBB_COLOR_MODES).map(key => {
            return (
              <option key={key} value={OBB_COLOR_MODES[key]}>
                {key}
              </option>
            );
          })}
        </DropDown>
      </DebugOptionGroup>
    );
  }

  _renderTileOptions() {
    const {tileColorMode, pickable, loadTiles, uvChecker} = this.state;
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
          <label htmlFor="pickable">Pickable</label>
        </CheckboxOption>
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleLoading}
            type="checkbox"
            id="loadTiles"
            value={loadTiles}
            checked={loadTiles}
          />
          <label htmlFor="loadTiles">Load tiles</label>
        </CheckboxOption>
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleUvChecker}
            type="checkbox"
            id="uvChecker"
            value={uvChecker}
            checked={uvChecker}
          />
          <label htmlFor="uvChecker">UV checker</label>
        </CheckboxOption>
        <DropDown
          value={tileColorMode}
          onChange={evt => {
            const selected = evt.target.value;
            this._onChangedTileColorMode({tileColorMode: parseInt(selected, 10)});
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
          <label htmlFor="showFrustumCullingMinimap">Show</label>
        </CheckboxOption>
        <CheckboxOption>
          <InputCheckbox
            onChange={this._onToggleMinimapViewport}
            type="checkbox"
            id="showFrustumCullingMinimapViewport"
            value={minimapViewport}
            checked={minimapViewport}
          />
          <label htmlFor="showFrustumCullingMinimapViewport">Use different viewports</label>
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
          <label htmlFor="showSemanticValidator">Show</label>
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
          {this._renderObbOptions()}
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
