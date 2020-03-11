import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {EXAMPLES} from '../examples';

const MAP_STYLES = {
  'Base Map: Satellite': 'mapbox://styles/mapbox/satellite-v9',
  'Base Map: Light': 'mapbox://styles/mapbox/light-v9',
  'Base Map: Dark': 'mapbox://styles/mapbox/dark-v9'
};

const INITIAL_MAP_STYLE = MAP_STYLES['Base Map: Dark'];

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  width: 200px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px 24px;
  margin: 20px;
  font-size: 13px;
  line-height: 2;
  outline: none;
  z-index: 100;
`;

const DropDown = styled.select`
  margin-bottom: 12px;
`;

const TilesetDropDown = styled.select`
  margin-bottom: 12px;
  font-weight: 800;
  font-size: 16px;
`;

const propTypes = {
  name: PropTypes.string.isRequired,
  tileset: PropTypes.object,
  mapStyles: PropTypes.object,
  onExampleChange: PropTypes.func,
  children: PropTypes.node
};

const defaultProps = {
  droppedFile: null,
  onChange: () => {}
};

export default class ControlPanel extends PureComponent {
  constructor(props) {
    super(props);
    this._renderMapStyles = this._renderMapStyles.bind(this);
    this.state = {
      selectedMapStyle: INITIAL_MAP_STYLE
    };
  }

  _renderExamples() {
    const {name, onExampleChange} = this.props;
    return (
      <TilesetDropDown
        value={name}
        onChange={evt => {
          const selected = evt.target.value;
          this.setState({selected});
          onExampleChange({
            name: selected,
            example: EXAMPLES[selected]
          });
        }}
      >
        {Object.keys(EXAMPLES).map(key => {
          const example = EXAMPLES[key];
          return (
            <option key={key} value={example.name}>
              {example.name}
            </option>
          );
        })}
      </TilesetDropDown>
    );
  }

  _renderMapStyles() {
    const {mapStyles = MAP_STYLES} = this.props;
    const {selectedMapStyle} = this.state;

    return (
      <DropDown
        value={selectedMapStyle}
        onChange={evt => {
          const selected = evt.target.value;
          this.setState({selectedMapStyle: selected});
        }}
      >
        {Object.keys(mapStyles).map(key => {
          return (
            <option key={key} value={mapStyles[key]}>
              {key}
            </option>
          );
        })}
      </DropDown>
    );
  }

  render() {
    return (
      <Container>
        {this._renderExamples()}
        {this._renderMapStyles()}
        {this.props.children}
      </Container>
    );
  }
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;
