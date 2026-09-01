// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import marked from 'marked';

import {MAP_STYLES} from '../constants';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  width: min(310px, calc(100vw - 40px));
  max-height: calc(100vh - 40px);
  overflow: auto;
  background: linear-gradient(145deg, rgba(9, 17, 31, 0.94), rgba(15, 28, 50, 0.86));
  backdrop-filter: blur(18px);
  border: 1px solid rgba(138, 199, 255, 0.24);
  border-radius: 18px;
  box-shadow: 0 24px 80px rgba(0, 0, 0, 0.48);
  padding: 18px;
  margin: 20px;
  font-size: 13px;
  line-height: 2;
  outline: none;
  z-index: 100;
  color: rgba(255, 255, 255, 0.78);
`;

const DropDown = styled.select`
  margin-bottom: 12px;
  padding: 7px 9px;
  border: 1px solid rgba(138, 199, 255, 0.25);
  border-radius: 8px;
  background: #111f35;
  color: #fff;
`;

const TilesetDropDown = styled.select`
  margin-bottom: 12px;
  padding: 9px 10px;
  border: 1px solid rgba(138, 199, 255, 0.32);
  border-radius: 10px;
  background: #111f35;
  color: #fff;
  font-weight: 800;
  font-size: 16px;
`;

const InfoContainer = styled.div`
  margin-top: 12px;
  text-align: center;
  padding-top: 8px;
  border-top: 1px solid rgba(138, 199, 255, 0.22);
`;

const Description = styled.div`
  margin-top: 6px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.58);
  line-height: 1.4em;
`;

const propTypes = {
  category: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  data: PropTypes.object.isRequired,
  tileset: PropTypes.object,
  mapStyles: PropTypes.object,
  selectedMapStyle: PropTypes.string,
  onExampleChange: PropTypes.func,
  onMapStyleChange: PropTypes.func,
  header: PropTypes.node,
  children: PropTypes.node
};

const defaultProps = {
  droppedFile: null,
  onChange: () => {}
};

export default class ControlPanel extends PureComponent {
  _renderByCategories() {
    const {category, name, onExampleChange, data} = this.props;
    const categories = Object.keys(data);
    const selectedValue = `${category}.${name}`;

    return (
      <TilesetDropDown
        value={selectedValue}
        onChange={(evt) => {
          const selected = evt.target.value;
          const [newCategory, newName] = selected.split('.');
          const categoryExamples = data[newCategory].examples;
          this.setState({
            category: newCategory,
            name: newName,
            example: categoryExamples[newName]
          });
          onExampleChange({
            category: newCategory,
            name: newName,
            example: categoryExamples[newName]
          });
        }}
      >
        {categories.map((c, i) => {
          const categoryExamples = data[c].examples;
          return (
            <optgroup key={i} label={data[c].name}>
              {Object.keys(categoryExamples).map((e, j) => {
                const value = `${c}.${e}`;
                return (
                  <option key={j} value={value}>
                    {e}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </TilesetDropDown>
    );
  }

  _renderMapStyles() {
    const {onMapStyleChange, mapStyles = MAP_STYLES, selectedMapStyle} = this.props;

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
    if (!this.props.tileset) {
      return null;
    }

    const {
      description,
      credits: {attributions}
    } = this.props.tileset || {};
    if (!attributions || attributions.length === 0 || !description) {
      return null;
    }

    return (
      <InfoContainer>
        {Boolean(attributions && attributions.length) && <b>Tileset Credentials</b>}
        {Boolean(attributions && attributions.length) &&
          attributions.map((attribution) => (
            // eslint-disable-next-line react/no-danger
            <div key={attribution.html} dangerouslySetInnerHTML={{__html: attribution.html}} />
          ))}
        {description && <Description dangerouslySetInnerHTML={{__html: marked(description)}} />}
      </InfoContainer>
    );
  }

  render() {
    return (
      <Container>
        {this.props.header}
        {this._renderByCategories()}
        {this._renderMapStyles()}
        {this.props.children}
        {this._renderInfo()}
      </Container>
    );
  }
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;
