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
  onOptionsChange: PropTypes.func
};

const defaultProps = {};

export default class DebugPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expand: true,
      minimap: true,
      obb: false,
      tileColorMode: INITIAL_TILE_COLOR_MODE,
      obbColorMode: INITIAL_OBB_COLOR_MODE,
      pickable: false,
      semanticValidator: false
    };

    this.toggleDebugPanel = this.toggleDebugPanel.bind(this);
    this.toggleMinimap = this.toggleMinimap.bind(this);
    this.toggleObb = this.toggleObb.bind(this);
    this.togglePickable = this.togglePickable.bind(this);
    this.toggleSemanticValidator = this.toggleSemanticValidator.bind(this);

    this.changedTileColorMode = this.changedTileColorMode.bind(this);
    this.changedObbColorMode = this.changedObbColorMode.bind(this);
  }

  toggleDebugPanel() {
    const {expand} = this.state;
    this.setState({expand: !expand});
  }

  toggleMinimap() {
    const {minimap} = this.state;
    this.setState({minimap: !minimap}, () => {
      this.applyOptions();
    });
  }

  toggleObb() {
    const {obb} = this.state;
    this.setState({obb: !obb}, () => {
      this.applyOptions();
    });
  }

  togglePickable() {
    const {pickable} = this.state;
    this.setState({pickable: !pickable}, () => {
      this.applyOptions();
    });
  }

  toggleSemanticValidator() {
    const {semanticValidator} = this.state;
    this.setState({semanticValidator: !semanticValidator}, () => {
      this.applyOptions();
    });
  }

  changedTileColorMode({tileColorMode}) {
    this.setState({tileColorMode}, () => {
      this.applyOptions();
    });
  }

  changedObbColorMode({obbColorMode}) {
    this.setState({obbColorMode}, () => {
      this.applyOptions();
    });
  }

  applyOptions() {
    const {obb, tileColorMode, obbColorMode, pickable, minimap, semanticValidator} = this.state;
    const {onOptionsChange} = this.props;
    onOptionsChange({
      minimap,
      obb,
      tileColorMode,
      obbColorMode,
      pickable,
      semanticValidator
    });
  }

  getExpandStyles() {
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

  renderExpandIcon() {
    const {expand} = this.state;
    if (expand) {
      return <FontAwesomeIcon icon={faAngleDoubleLeft} />;
    }
    return <FontAwesomeIcon icon={faAngleDoubleRight} />;
  }

  renderObbOptions() {
    const {obbColorMode, obb} = this.state;
    return (
      <DebugOptionGroup title="Bounding volumes">
        <CheckboxOption>
          <InputCheckbox
            onChange={this.toggleObb}
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
            this.changedObbColorMode({obbColorMode: parseInt(selected, 10)});
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

  renderTileOptions() {
    const {tileColorMode, pickable} = this.state;
    return (
      <DebugOptionGroup title="Tiles">
        <CheckboxOption>
          <InputCheckbox
            onChange={this.togglePickable}
            type="checkbox"
            id="pickable"
            value={pickable}
            checked={pickable}
          />
          <label htmlFor="pickable">Pickable</label>
        </CheckboxOption>
        <DropDown
          value={tileColorMode}
          onChange={evt => {
            const selected = evt.target.value;
            this.changedTileColorMode({tileColorMode: parseInt(selected, 10)});
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

  renderFrustumCullingOption() {
    const {minimap} = this.state;
    return (
      <DebugOptionGroup title="Frustum Culling">
        <CheckboxOption>
          <InputCheckbox
            onChange={this.toggleMinimap}
            type="checkbox"
            id="showFrustumCullingMinimap"
            value={minimap}
            checked={minimap}
          />
          <label htmlFor="showFrustumCullingMinimap">Show</label>
        </CheckboxOption>
      </DebugOptionGroup>
    );
  }

  renderSemanticValidatorOption() {
    const {semanticValidator} = this.state;
    return (
      <DebugOptionGroup title="Semantic Validator">
        <CheckboxOption>
          <InputCheckbox
            onChange={this.toggleSemanticValidator}
            type="checkbox"
            id="showSemanticValidator"
            value={semanticValidator}
            checked={semanticValidator}
          />
          <label htmlFor="showSemanticValidator">Show</label>
        </CheckboxOption>
      </DebugOptionGroup>
    );
  }

  render() {
    const {children} = this.props;

    return (
      <Container className="debug-panel">
        <DebugOptions style={this.getExpandStyles()}>
          <Header>Debug Panel</Header>
          {this.renderFrustumCullingOption()}
          {this.renderTileOptions()}
          {this.renderObbOptions()}
          {this.renderSemanticValidatorOption()}
          <ChildWrapper>{children}</ChildWrapper>
        </DebugOptions>
        <Expander onClick={this.toggleDebugPanel}>{this.renderExpandIcon()}</Expander>
      </Container>
    );
  }
}

DebugPanel.propTypes = propTypes;
DebugPanel.defaultProps = defaultProps;
