import styled from 'styled-components';
import React, {PureComponent} from 'react';
import MonacoEditor from '@monaco-editor/react';
import {INITIAL_CATEGORY_NAME, INITIAL_EXAMPLE_NAME} from '../examples';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  position: absolute;
  top: 0;
  right: 0;
  background: #fff;
  color: #121212;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px 24px 24px 24px;
  margin: 20px;
  font-size: 13px;
  line-height: 2;
  outline: none;
  z-index: 100;
  height: calc(100vh - 105px);
  width: 500px;

  h2 {
    margin: 0 0 0.5rem 0;
  }

  .loading-indicator {
    margin: 0;
    text-align: center;
    transition: opacity 300ms ease-out;
  }

  > .monaco-editor {
    height: calc(100vh - 200px) !important;
    width: 700px !important;
  }
`;

const DropDown = styled.select`
  margin: 0.5rem 0;
  font-size: 16px;
`;

type ControlPanelProps = {
  title?: string;
  metadata?: string;
  examples?: any;
  selectedCategory?: string;
  selectedExample?: string;
  onExampleChange?: Function;
  droppedFile?: any;
  onChange?: Function;
};

const defaultProps: ControlPanelProps = {
  examples: {},
  droppedFile: null,
  selectedCategory: undefined,
  selectedExample: undefined,
  onExampleChange: () => {}
};

export class ControlPanel extends PureComponent<ControlPanelProps> {
  static defaultProps = defaultProps;

  props: any;
  _autoSelected = false;

  constructor(props) {
    super(props);
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

  render() {
    const props = this.props;
    console.log('Control panel metadata', props.metadata);
    return (
      <Container>
        {this._renderDropDown()}
        {props.children}
        <pre className="loading-indicator" style={{opacity: props.loading ? 1 : 0}}>
          loading tile...
        </pre>
        <h2>{props.title}</h2>
        <MonacoEditor
          language="json"
          options={{readOnly: true}}
          theme="vs-dark"
          value={props.metadata}
        />
      </Container>
    );
  }
}
