import styled from 'styled-components';
import React, {useState, useEffect} from 'react';
import MonacoEditor from '@monaco-editor/react';
import type {Example} from '../examples';

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
  height: calc(100vh - 105px);
  width: 500px;

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

/**
 * Shows the example selection dropdown and some additional information
 */
export const ControlPanel: React.FC<PropTypes> = (props: PropTypes) => {
  props = {
    examples: {},
    droppedFile: null,
    selectedExample: null,
    selectedLoader: null,
    onExampleChange: () => {},
    ...props
  };

  return (
    <Container>
      <ExampleHeader {...props} />
      <ExampleDropDown {...props} />
      {props.children}
      <h2>Table Schema</h2>
      <MonacoEditor
        language="json"
        options={{readOnly: true}}
        theme="vs-dark"
        value={props.schema || 'Table has no schema'}
      />
    </Container>
  );
};

/**
 * Shows the selected example in bold font
 */
const ExampleHeader: React.FC = ({selectedLoader, selectedExample}) => {
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
};

/**
 * Dropdown that lets user select a new example
 */
const ExampleDropDown: React.FC = ({
  examples = {},
  selectedLoader,
  selectedExample,
  onExampleChange
}) => {
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
};
