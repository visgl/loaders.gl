import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleDoubleLeft, faAngleDoubleRight} from '@fortawesome/free-solid-svg-icons';
import DebugOptionGroup from './debug-option-group';

import {
  TILE_COLORING_MODES,
  OBB_COLORING_MODES,
  INITIAL_TILE_COLORING_MODE,
  INITIAL_OBB_COLORING_MODE
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
      statistics: true,
      minimap: true,
      showObb: false,
      tileColoringMode: INITIAL_TILE_COLORING_MODE,
      obbColoringMode: INITIAL_OBB_COLORING_MODE,
      pickable: false
    };

    this.toggleDebugPanel = this.toggleDebugPanel.bind(this);
    this.toggleStatistics = this.toggleStatistics.bind(this);
    this.toggleMinimap = this.toggleMinimap.bind(this);
    this.toggleObb = this.toggleObb.bind(this);
    this.togglePickable = this.togglePickable.bind(this);

    this.changedTileColoringMode = this.changedTileColoringMode.bind(this);
    this.changedObbColoringMode = this.changedObbColoringMode.bind(this);
  }

  toggleDebugPanel() {
    const {expand} = this.state;
    this.setState({expand: !expand});
  }

  toggleStatistics() {
    const {statistics} = this.state;
    this.setState({statistics: !statistics}, () => {
      this.applyOptions();
    });
  }

  toggleMinimap() {
    const {minimap} = this.state;
    this.setState({minimap: !minimap}, () => {
      this.applyOptions();
    });
  }

  toggleObb() {
    const {showObb} = this.state;
    this.setState({showObb: !showObb}, () => {
      this.applyOptions();
    });
  }

  togglePickable() {
    const {pickable} = this.state;
    this.setState({pickable: !pickable}, () => {
      this.applyOptions();
    });
  }

  changedTileColoringMode({tileColoringMode}) {
    this.setState({tileColoringMode}, () => {
      this.applyOptions();
    });
  }

  changedObbColoringMode({obbColoringMode}) {
    this.setState({obbColoringMode}, () => {
      this.applyOptions();
    });
  }

  applyOptions() {
    const {showObb, tileColoringMode, obbColoringMode, pickable, statistics, minimap} = this.state;
    const {onOptionsChange} = this.props;
    onOptionsChange({
      statistics,
      minimap,
      showObb,
      tileColoringMode,
      obbColoringMode,
      pickable
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
    const {obbColoringMode, showObb} = this.state;
    return (
      <DebugOptionGroup title="Oriented bounding box">
        <CheckboxOption>
          <InputCheckbox
            onChange={this.toggleObb}
            type="checkbox"
            id="showObb"
            value={showObb}
            checked={showObb}
          />
          <label htmlFor="showObb">Show</label>
        </CheckboxOption>
        <DropDown
          value={obbColoringMode}
          onChange={evt => {
            const selected = evt.target.value;
            this.changedObbColoringMode({obbColoringMode: parseInt(selected, 10)});
          }}
        >
          {Object.keys(OBB_COLORING_MODES).map(key => {
            return (
              <option key={key} value={OBB_COLORING_MODES[key]}>
                {key}
              </option>
            );
          })}
        </DropDown>
      </DebugOptionGroup>
    );
  }

  renderTileOptions() {
    const {tileColoringMode, pickable} = this.state;
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
          value={tileColoringMode}
          onChange={evt => {
            const selected = evt.target.value;
            this.changedTileColoringMode({tileColoringMode: parseInt(selected, 10)});
          }}
        >
          {Object.keys(TILE_COLORING_MODES).map(key => {
            return (
              <option key={key} value={TILE_COLORING_MODES[key]}>
                {key}
              </option>
            );
          })}
        </DropDown>
      </DebugOptionGroup>
    );
  }

  render() {
    const {children} = this.props;
    const {statistics, minimap} = this.state;
    return (
      <Container className="debug-panel">
        <DebugOptions style={this.getExpandStyles()}>
          <Header>Debug Options</Header>
          <DebugOptionGroup title="Statistics">
            <CheckboxOption>
              <InputCheckbox
                onChange={this.toggleStatistics}
                type="checkbox"
                id="showStatistics"
                value={statistics}
                checked={statistics}
              />
              <label htmlFor="showStatistics">Show</label>
            </CheckboxOption>
          </DebugOptionGroup>
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
          {this.renderTileOptions()}
          {this.renderObbOptions()}
        </DebugOptions>
        <Expander onClick={this.toggleDebugPanel}>{this.renderExpandIcon()}</Expander>
        {children}
      </Container>
    );
  }
}

DebugPanel.propTypes = propTypes;
DebugPanel.defaultProps = defaultProps;
