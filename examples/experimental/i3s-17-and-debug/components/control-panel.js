import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {EXAMPLES} from '../examples';
import {MAP_STYLES} from '../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  width: 300px;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px 18px;
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

const FrameWrap = styled.div`
  height: fit-content;
  padding: 0;
  overflow: hidden;
`;

const FrameControl = styled.div`
  margin: ${(props) => (props.showFullInfo ? '12px 0' : 0)};
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

const FrameButton = styled.div`
  display: flex;
  padding: 6px 12px;
  color: white;
  background: rgb(52, 152, 219);
  align-items: center;
  height: 20px;
  &:hover {
    background: rgb(0, 152, 219);
    cursor: pointer;
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
            height: 500,
            width: '99%',
            border: '1px solid rgba(200, 200, 200, 100)'
          }}
          src={url}
        />
        <FrameControl showFullInfo={showFullInfo}>
          <FrameButton onClick={() => this.setState({showFullInfo: !showFullInfo})}>
            Show {showFullInfo ? `Less` : `More`}
          </FrameButton>
          <a target="_blank" rel="noopener noreferrer" href={url}>
            Go to ArcGIS
          </a>
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
