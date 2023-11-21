import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Example, INITIAL_EXAMPLE_NAME, INITIAL_LOADER_NAME} from '../examples';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  max-width: 320px;
  background: #fff;
  color: #121212;
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

type PropTypes = React.PropsWithChildren<{
  examples: Record<string, Record<string, Example>>;
  droppedFile: File | null;
  selectedExample: Example | null;
  selectedLoader: string | null;
  onExampleChange: (args: {
    selectedLoader: string;
    selectedExample: string;
    example: Example;
  }) => void;
}>;

export class ControlPanel extends PureComponent<PropTypes> {
  static defaultProps: PropTypes = {
    examples: {},
    droppedFile: null,
    selectedExample: null,
    selectedLoader: null,
    onExampleChange: () => {}
  };

  firstSelection: boolean;

  constructor(props) {
    super(props);
    this.firstSelection = false;
  }

  componentDidUpdate() {
    const {examples = {}, selectedLoader, selectedExample, onExampleChange} = this.props;

    // Fire of a change event on initialization
    if (selectedLoader && selectedExample && !this.firstSelection) {
      this.firstSelection = true;
      const example = examples[selectedLoader][selectedExample];
      onExampleChange({selectedLoader, selectedExample, example});
    }
  }

  _renderDropDown() {
    const {examples = {}, selectedLoader, selectedExample, onExampleChange} = this.props;

    if (!selectedLoader || !selectedExample) {
      return false;
    }

    const selectedValue = `${selectedLoader}.${selectedExample}`;

    return (
      <DropDown
        value={selectedValue}
        onChange={(evt) => {
          const loaderExample = evt.target.value as string;
          const value = loaderExample.split('.');
          const loaderName = value[0];
          const exampleName = value[1];
          const example = examples[loaderName][exampleName];
          onExampleChange({selectedLoader: loaderName, selectedExample: exampleName, example});
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
    const {selectedLoader, selectedExample} = this.props;
    if (!selectedLoader || !selectedExample) {
      return null;
    }

    return (
      <div>
        <h3>
          {selectedExample} <b>{selectedLoader}</b>{' '}
        </h3>
      </div>
    );
  }

  render() {
    return (
      <Container>
        {this._renderHeader()}
        {this._renderDropDown()}
        {this.props.children}
      </Container>
    );
  }
}
