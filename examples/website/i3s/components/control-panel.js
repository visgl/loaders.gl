import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {EXAMPLES} from '../examples';
import {MAP_STYLES} from '../constants';

const Container = styled.div`
  display: grid;
  grid-template-columns: 100px 100px 100px;
  grid-template-rows: 30px 25px 35px;
  grid-template-areas: 
    "tileset tileset tileset" 
    "mapstyle mapstyle mapstyle"
    "frame frame memory";
  position: absolute;
  padding: 5px;
  top: 0;
  right: 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  z-index: 1;
  cursor: pointer;
`;

const TilesetDropDown = styled.select`
  grid-area: tileset;
  background: rgba(36,39,48,0.7);
  padding: 5px;
  font-weight: 800;
  cursor: pointer;
  font-size: 13px;
  text-transform: uppercase;
  color: #00ADE6;
  text-shadow: 1px 1px 1px #212529;
  border: none;
  &:hover {
    background: #212529;
  }
`;

const DropDown = styled.select`
  grid-area: mapstyle;
  background: rgba(0, 0, 0, 0.7);
  padding: 5px;
  text-transform: uppercase;
  border: none;
  font-size: 11px;
  color: #adb5bd;
  cursor: pointer;
  padding-left: 15px;
  &:hover {
    background: #212529;
  }
`;

const FrameWrap = styled.div`
  grid-area: frame;
  height: fit-content;
  overflow: hidden;
`;

const FrameControl = styled.div`
  width: 100%;
  z-index: 20;
  margin-top: 10px;
`;

const FrameButton = styled.button`
  border: none;
  background: rgba(0, 0, 0, 0.5);
  color: #f2e9e4;
  font-size: 9px;
  height: 30px;
  width: 100px;
  text-transform: uppercase;
  align-items: center;
  justify-content: center;
  transition: all 1s;
  border-radius: 2px;
  cursor: pointer;
  &:hover {
    color: #242730;
    background: #00ADE6;
  }
`;

const LinkButton = styled.button`
  grid-area: link;
  background: rgba(0, 0, 0, 0.5);
  color: #f2e9e4;
  align-items: center;
  margin-left: 10px;
  font-size: 9px;
  height: 30px;
  width: 100px;
  padding: 10px;
  text-transform: uppercase;
  text-decoration: none;
  transition: all 1s;
  border-radius: 2px;
  cursor: pointer;
  &:hover {
    color: #242730;
    background: #00ADE6;
  }
`;

const propTypes = {
  name: PropTypes.string,
  tileset: PropTypes.object,
  mapStyles: PropTypes.object,
  metadata: PropTypes.object,
  token: PropTypes.string,
  onExampleChange: PropTypes.func,
  children: PropTypes.node,
  selectedMapStyle: PropTypes.string,
  onMapStyleChange: PropTypes.func
};

const defaultProps = {
  droppedFile: null,
  onChange: () => {}
};
const CUSTOM_EXAMPLE = 'Custom example';

export default class ControlPanel extends PureComponent {
  constructor(props) {
    super(props);
    this._renderMapStyles = this._renderMapStyles.bind(this);
    this.state = {
      showFullInfo: false
    };
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
    );
  }

  _renderInfo() {
    const {metadata, token} = this.props;
    const {showFullInfo} = this.state;
    if (!metadata) {
      return null;
    }

    let url = `https://www.arcgis.com/home/item.html?id=${metadata.serviceItemId}`;
    if (token) {
      url = `${url}&token=${token}`;
    }

    return (
      <FrameWrap>
        <FrameControl showFullInfo={showFullInfo}>
          <FrameButton onClick={() => this.setState({showFullInfo: !showFullInfo})}>
            {showFullInfo ? `Less Info` : `More Info`}
          </FrameButton>
          <LinkButton as="a" target="_blank" rel="noopener noreferrer" href={url}>
            Go to ArcGIS
          </LinkButton>
        </FrameControl>
        <iframe
          id="tileset-info"
          title="tileset-info"
          style={{display: showFullInfo ? 'inherit' : 'none', height: '400px', width: '99%', border: '1px solid rgba(200, 200, 200, 100)'}}
          src={url}
        />
      </FrameWrap>
    );
  }

  render() {
    return (
      <Container>
        {this._renderExamples()}
        {this._renderMapStyles()}
        {this._renderInfo()}
        {this.props.children}
      </Container>
    );
  }
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;
