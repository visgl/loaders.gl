import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {EXAMPLES} from '../examples';
import {MAP_STYLES} from '../constants';
import {DropDownStyle, Font, Color, Flex} from './styles';

const Container = styled.div`
  ${Flex}
  width: 277px;
  height: 105px;
  margin: 10px;
  line-height: 28px;
  background: #0E111A;
  border-radius: 8px;
  z-index: 15;
  top: ${props => (props.styleDebug ? "50px" : "0")};
  @media (max-width: 768px) {
    width: 100vw;
    margin: 0;
    top: 0;
    border-radius: 0;
    flex-direction: row;
    height: 80px;
  }
`;

const TilesetDropDown = styled.select`
  ${Color}
  ${Font}
  ${DropDownStyle}
  width: 245px;
  margin: 16px 16px 0 16px;
  @media (max-width: 768px) {
    margin: 25px 0 25px 15px;
    width: 100%;
  }
`;

const MapContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  padding: 0px;
  margin: 0 16px 8px 16px;
  width: 245px;
`;

const MapName = styled.h3`
  ${Color}
  font-weight: normal;
  width: 70px;
  @media (max-width: 768px) {
    display: none;
  }
`;

const DropDown = styled.select`
  ${Color}
  ${Font}
  ${DropDownStyle}
  width: 167px;
  margin-left: 8px;
  left: 86px;
  @media (max-width: 768px) {
    width: 100%;
    margin: 25px 0 25px 5px;
  }
`;

const propTypes = {
  name: PropTypes.string,
  tileset: PropTypes.object,
  mapStyles: PropTypes.object,
  metadata: PropTypes.object,
  token: PropTypes.string,
  onExampleChange: PropTypes.func,
  selectedMapStyle: PropTypes.string,
  onMapStyleChange: PropTypes.func
};

const defaultProps = {
  droppedFile: null,
  onChange: () => {},
  style: {}
};
const CUSTOM_EXAMPLE = 'Custom example';

export default class ControlPanel extends PureComponent {
  constructor(props) {
    super(props);
    this._renderMapStyles = this._renderMapStyles.bind(this);
  }

  _renderExamples() {
    const {name, onExampleChange} = this.props;
    const value = name || CUSTOM_EXAMPLE;

    return (
      <TilesetDropDown
        value={value}
        onChange={(evt) => {
          const selected = evt.target.value;
          this.setState({selected});
          onExampleChange(EXAMPLES[selected]);
        }}
      >
        {!name && (
          <option key={'custom-example'} value={'custom-example'}>
            {CUSTOM_EXAMPLE}
          </option>
        )}
        {Object.keys(EXAMPLES).map((key) => {
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
    const {mapStyles = MAP_STYLES, selectedMapStyle, onMapStyleChange} = this.props;
    return (
      <MapContainer>
        <MapName>Base map</MapName>
        <DropDown
        value={selectedMapStyle}
        onChange={(evt) => {
          const selected = evt.target.value;
          onMapStyleChange({selectedMapStyle: selected});
        }}
        >
          {Object.keys(mapStyles).map((key) => {
            return (
              <option key={key} value={mapStyles[key]}>
                {key}
              </option>
            );
          })}
        </DropDown>
      </MapContainer>
    );
  }

  render() {
    const {styleDebug} = this.props;
    return (
      <Container styleDebug={styleDebug}>
        {this._renderExamples()}
        {this._renderMapStyles()}
      </Container>
    );
  }
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;
