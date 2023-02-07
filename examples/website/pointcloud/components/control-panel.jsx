import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  max-width: 320px;
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
  margin-bottom: 6px;
`;

const propTypes = {
  examples: PropTypes.object,
  selectedCategory: PropTypes.string,
  selectedExample: PropTypes.string,
  onExampleChange: PropTypes.func
};

const defaultProps = {
  examples: {},
  selectedCategory: null,
  selectedExample: null,
  onExampleChange: () => {}
};

export default class ControlPanel extends PureComponent {
  componentDidMount() {
    const {examples = {}, onExampleChange} = this.props;

    let selectedCategory = this.props.selectedCategory;
    let selectedExample = this.props.selectedExample;
    // CONVENIENCE: Auto select first example if app didn't provide
    if ((!selectedCategory || !selectedExample) && !this._autoSelected) {
      selectedCategory = Object.keys(examples)[0];
      selectedExample = Object.keys(examples[selectedCategory])[0];
      this._autoSelected = true;
    }

    if (selectedCategory && selectedExample) {
      const example = examples[selectedCategory][selectedExample];
      onExampleChange({selectedCategory, selectedExample, example});
    }
  }

  _renderDropDown() {
    // eslint-disable-next-line react/prop-types
    const {examples = {}, selectedCategory, selectedExample, onExampleChange} = this.props;

    if (!selectedCategory || !selectedExample) {
      return false;
    }

    const selectedValue = `${selectedCategory}.${selectedExample}`;

    return (
      <DropDown
        value={selectedValue}
        onChange={(evt) => {
          const categoryExample = evt.target.value;
          const value = categoryExample.split('.');
          const categoryName = value[0];
          const exampleName = value[1];
          const example = examples[categoryName][exampleName];
          onExampleChange({selectedCategory: categoryName, selectedExample: exampleName, example});
        }}
      >
        {Object.keys(examples).map((categoryName, categoryIndex) => {
          const categoryExamples = examples[categoryName];
          return (
            <optgroup key={categoryIndex} label={categoryName}>
              {Object.keys(categoryExamples).map((exampleName, exampleIndex) => {
                const value = `${categoryName}.${exampleName}`;
                return (
                  <option key={exampleIndex} value={value}>
                    {`${exampleName} (${categoryName})`}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </DropDown>
    );
  }

  _renderHeader() {
    // eslint-disable-next-line react/prop-types
    const {selectedCategory, selectedExample} = this.props;
    if (!selectedCategory || !selectedExample) {
      return null;
    }

    return (
      <div>
        <h3>
          {selectedExample} <b>{selectedCategory}</b>{' '}
        </h3>
      </div>
    );
  }

  _renderDropped() {
    // eslint-disable-next-line react/prop-types
    const {droppedFile} = this.props;
    // eslint-disable-next-line react/prop-types
    return droppedFile ? <div>Dropped file: {JSON.stringify(droppedFile.name)}</div> : null;
  }

  _renderStats() {
    // eslint-disable-next-line react/prop-types
    const {vertexCount, loadTimeMs} = this.props;
    let message;
    if (vertexCount >= 1e7) {
      message = `${(vertexCount / 1e6).toFixed(0)}M`;
    } else if (vertexCount >= 1e6) {
      message = `${(vertexCount / 1e6).toFixed(1)}M`;
    } else if (vertexCount >= 1e4) {
      message = `${(vertexCount / 1e3).toFixed(0)}K`;
    } else if (vertexCount >= 1e3) {
      message = `${(vertexCount / 1e3).toFixed(1)}K`;
    } else {
      message = `${vertexCount}`;
    }
    return (
      <div>
        <div>{Number.isFinite(vertexCount) ? `Points: ${message}` : null}</div>
        <div>
          {Number.isFinite(loadTimeMs) ? `Load time: ${(loadTimeMs / 1000).toFixed(1)}s` : null}
        </div>
      </div>
    );
  }

  render() {
    return (
      <Container>
        {this._renderHeader()}
        {this._renderDropDown()}
        {this._renderDropped()}
        {this._renderStats()}
      </Container>
    );
  }
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;
