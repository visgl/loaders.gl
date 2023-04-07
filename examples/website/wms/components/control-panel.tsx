import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME} from '../examples';

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

  h3 {
    margin: 0.5em 0;
  }
  
  .loading-indicator {
    margin: 0.5em 0;
    
    transition: opacity 300ms ease-out;
  }

  pre {
    overflow: auto;
    max-height: calc(100vh - 225px);
  }
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
  droppedFile: null,
  selectedCategory: null,
  selectedExample: null,
  onChange: () => {}
};

export default class ControlPanel extends PureComponent {
  constructor(props) {
    super(props);
    this._autoSelected = false;
  }

  componentDidMount() {
    const {examples = {}, onExampleChange} = this.props;

    let selectedCategory = this.props.selectedCategory;
    let selectedExample = this.props.selectedExample;

    if ((!selectedCategory || !selectedExample) && !this._autoSelected) {
      selectedCategory = INITIAL_CATEGORY_NAME;
      selectedExample = examples[selectedCategory][INITIAL_EXAMPLE_NAME];
      this._autoSelected = true;
    }

    if (selectedCategory && selectedExample) {
      const example = examples[selectedCategory][selectedExample];
      onExampleChange({selectedCategory, selectedExample, example});
    }
  }

  _renderDropDown() {
    const {examples = {}, selectedCategory, selectedExample, onExampleChange} = this.props;

    if (!selectedCategory || !selectedExample) {
      return false;
    }

    const selectedValue = `${selectedCategory}.${selectedExample}`;

    return (
      <DropDown
        value={selectedValue}
        onChange={(evt) => {
          const loaderExample = evt.target.value;
          const value = loaderExample.split('.');
          const loaderName = value[0];
          const exampleName = value[1];
          const example = examples[loaderName][exampleName];
          onExampleChange({selectedCategory: loaderName, selectedExample: exampleName, example});
        }}
      >
        {Object.keys(examples).map((loaderName, loaderIndex) => {
          const loaderExamples = examples[loaderName];
          return (
            <optgroup key={loaderIndex} label={loaderName}>
              {Object.keys(loaderExamples).map((exampleName, exampleIndex) => {
                const value = `${loaderName}.${exampleName}`;
                return (
                  <option key={exampleIndex} value={value}>
                    {`${exampleName} (${loaderName})`}
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
    const {selectedCategory, selectedExample} = this.props;
    if (!selectedCategory || !selectedExample) {
      return null;
    }

    return (
      <>
        <h3>
          {selectedExample} <b>{selectedCategory}</b>
        </h3>
        <p className='loading-indicator' style={{opacity: this.props.loading? 1 : 0}}>Loading image...</p> 
      </>
    );
  }

  
  
  render() {
    return (
      <Container>
        {this._renderHeader()}
        {this._renderDropDown()}
        {this.props.children}
        <h1>WMS Capabilities</h1>
        <pre>
          {this.props.metadata}
        </pre>
      </Container>
    );
  }
}

ControlPanel.propTypes = propTypes;
ControlPanel.defaultProps = defaultProps;
