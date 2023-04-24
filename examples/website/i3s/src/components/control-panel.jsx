import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {EXAMPLES} from '../examples';
import {MAP_STYLES} from '../constants';
import {DropDownStyle, Font, Color, Flex} from './styles';
import BuildingExplorer from './building-explorer';
import ToggleSwitch from './toggle-switch';

const Container = styled.div`
  ${Flex}
  ${Color}
  gap: 10px;
  padding: 16px;
  width: 277px;
  height: 132px;
  margin: 10px;
  line-height: 28px;
  background: #0e111a;
  border-radius: 8px;
  z-index: 15;
  top: ${(props) => (props.debugMode ? '50px' : '0')};
  @media (max-width: 768px) {
    width: 100vw;
    margin: 0;
    top: 0;
    border-radius: 0;
    flex-direction: row;
    align-items: center;
    height: 80px;
  }
`;

const TilesetDropDown = styled.select`
  ${Color}
  ${Font}
  ${DropDownStyle}
  width: 245px;
  @media (max-width: 768px) {
    width: auto;
  }
`;

const MapContainer = styled.div`
  display: flex;
  flex-direction: row;
  align-items: center;
  width: 245px;
`;

const MapName = styled.div`
  ${Color}
  font-weight: normal;
  width: 70px;
  @media (max-width: 768px) {
    display: none;
  }
`;

const ItemName = styled.div`
  ${Color}
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
    width: auto;
  }
`;

const propTypes = {
  name: PropTypes.string,
  selectedMapStyle: PropTypes.string,
  mapStyles: PropTypes.object,
  debugMode: PropTypes.bool,
  useTerrainLayer: PropTypes.bool,
  sublayers: PropTypes.array,
  isBuildingExplorerShown: PropTypes.bool,
  onExampleChange: PropTypes.func,
  onMapStyleChange: PropTypes.func,
  onToggleBuildingExplorer: PropTypes.func,
  setMemoryVisibility: PropTypes.func,
  toggleTerrain: PropTypes.func
};

const defaultProps = {
  name: '',
  debugMode: false,
  isBuildingExplorerShown: false,
  sublayers: [],
  useTerrainLayer: false,
  toggleTerrain: () => {}
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
          onChange={(evt) => onMapStyleChange({selectedMapStyle: evt.target.value})}
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


  _renderTerrainControl() {
    const {useTerrainLayer, toggleTerrain} = this.props;

    return (
      <MapContainer>
        <ItemName>Terrain</ItemName>
        <ToggleSwitch
          value={useTerrainLayer}
          checked={useTerrainLayer}
          onChange={() => {
            toggleTerrain({useTerrainLayer: !useTerrainLayer});
          }}
        />
      </MapContainer>
    );
  }

  render() {
    const {
      debugMode,
      sublayers,
      onToggleBuildingExplorer,
      onUpdateSublayerVisibility,
      isBuildingExplorerShown
    } = this.props;
    return (
      <Container debugMode={debugMode}>
        {this._renderExamples()}
        {this._renderMapStyles()}
        {this._renderTerrainControl()}
        {sublayers?.length ? (
          <BuildingExplorer
            sublayers={sublayers}
            onToggleBuildingExplorer={onToggleBuildingExplorer}
            onUpdateSublayerVisibility={onUpdateSublayerVisibility}
            isShown={isBuildingExplorerShown}
          ></BuildingExplorer>
        ) : null}
      </Container>
    );
  }
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;
