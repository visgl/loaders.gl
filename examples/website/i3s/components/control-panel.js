import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {EXAMPLES} from '../examples';
import {MAP_STYLES} from '../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  padding: 5px;
  top: 0;
  right: 0;
  width: 270px;
  background: rgba( 36, 39, 48, 0.7);
  border: 2px solid #212529;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  margin: 5px;
  outline: none;
  z-index: 1;
  cursor: pointer;
  @media screen and (max-width: 768px) {
   margin: 0;
  };
`;

const DropDown = styled.select`
  padding: 5px;
  text-transform: uppercase;
  background: transparent;
  border: none;
  font-size: 10px;
  color: #adb5bd;
  background: rgba( 0, 0, 0, .3);
  padding-right: 30px;
  margin: 5px;
  cursor: pointer;
  &:hover {
    background: #212529;
  }
`;

const TilesetDropDown = styled.select`
  font-weight: 800;
  cursor: pointer;
  margin: 5px;
  font-size: 13px;
  text-transform: uppercase;
  color: #00ADE6;
  text-shadow: 1px 1px 1px #212529;
  background: rgba( 0, 0, 0, .3);
  background: transparent;
  border: none;
  z-index: 20px;
  &:hover {
    background: #212529;
  }
`;

const FrameWrap = styled.div`
  height: fit-content;
  overflow: hidden;
  transition: all 1s;
`;

const FrameControl = styled.div`
  display: flex;
  flex-direction: row;
  transition: all 1s;
  margin-top: ${props => (props.showFullInfo ? "15px" : "10px")};
  align-items: center;
  justify-content: space-between;
  width: 100%;
  z-index: 20;
`;

const FrameButton = styled.div`
  display: flex;
  transition: all 1s;
  width: 135px;
  color: #f2e9e4;
  font-size: 11px;
  margitn-top: 10px;
  line-height: 2;
  text-transform: uppercase;
  align-items: center;
  justify-content: center;
  border-right: 2px solid #212529;
  -webkit-transition: all 1s ease;
  -moz-transition: all 1s ease;
  -o-transition: all 1s ease;
  transition: all 1s ease;
  &:hover {
    color: rgb(36,39,48);
    background: #00ADE6;
  }
`;

const LinkButton = styled.button`
  display: flex;
  width: 135px;
  color: #f2e9e4;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  text-transform: uppercase;
  text-decoration: none;
  margint-top: 10px;
  line-height: 2;
  border-left: 2px solid #212529;
  -webkit-transition: all 1s ease;
  -moz-transition: all 1s ease;
  -o-transition: all 1s ease;
  transition: all 1s ease;
  &:hover {
    color: rgb(36,39,48);
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
        <iframe
          id="tileset-info"
          title="tileset-info"
          style={{                
            display: showFullInfo ? 'inherit' : 'none',
            height: '500px',                                                                                                                     
            width: '99%',
            border: '1px solid rgba(200, 200, 200, 100)'
          }}
          src={url}
        />
        <FrameControl showFullInfo={showFullInfo}>
          <FrameButton onClick={() => this.setState({showFullInfo: !showFullInfo})}>
            Show {showFullInfo ? `Less Info` : `More Info`}
          </FrameButton>
          <LinkButton as="a" target="_blank" rel="noopener noreferrer" href={url}>Go to ArcGIS</LinkButton>
        </FrameControl>
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
