// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import styled from 'styled-components';
import React, {useState, useEffect} from 'react';
import MonacoEditor from '@monaco-editor/react';

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

export type Example = {
  type: 'las' | 'draco' | 'pcd' | 'ply'  | 'obj';
  url: string;
  attributions?: string[];
  viewState?: Record<string, unknown>;
  tileSize?: number[];
};

export type ExamplePanelProps = React.PropsWithChildren<{
  /** list of examples to show */
  examples: Record<string, Record<string, Example>>;
  /** format of examples to show (filters out other formats if supplied) */
  format?: string;
  initialCategoryName?: string | null;
  initialExampleName?: string | null;
  onExampleChange: OnExampleChange;
}>;

type ExamplePanelState = {
  /** list of examples */
  examples: Record<string, Record<string, Example>>;

  // EXAMPLE STATE
  categoryName: string;
  exampleName: string;
  example: Example | null;

  /** TODO break out into separate component */
  schema?: string;

  /** CURRENT VIEW POINT / CAMERA POSITION */
  // viewState: Record<string, number>;
};

export type OnExampleChange = (args: {
  categoryName: string;
  exampleName: string;
  example: Example;
}) => void;

/**
 * Shows the example selection dropdown and some additional information
 */
export const ExamplePanel: React.FC<ExamplePanelProps> = (props: ExamplePanelProps) => {
  props = {
    examples: {},
    droppedFile: null,
    exampleName: null,
    categoryName: null,
    onExampleChange: () => {},
    ...props
  };

  const [state, setState] = useState<ExamplePanelState>({
    examples: [],
    categoryName: null,
    exampleName: null,
    example: null,

    // tileSource: null,
    error: null
  });

  // Initialize the examples (each demo might focus on a different "props.format")
  useEffect(() => {
    const examples = getExamplesForFormat(props.examples, props.format);
    console.log(examples);

    const categoryName = props.format || props.initialCategoryName;
    let exampleName = props.format
      ? Object.keys(examples[categoryName])[0]
      : props.initialExampleName;
    console.log(categoryName, exampleName);
    const example = examples[categoryName][exampleName];
    console.log(example);
    setState((state) => ({...state, examples, exampleName, categoryName, example}));
  }, [props.examples, props.format, props.initialCategoryName, props.initialExampleName]);

  useEffect(() => {
    if (!state.example) {
      return;
    }
    props.onExampleChange({
      categoryName: state.categoryName,
      exampleName: state.exampleName,
      example: state.example
    });
  }, [state.example]);

  return (
    <Container>
      <ExampleHeader {...state} />
      <ExampleDropDown
        examples={state.examples}
        categoryName={state.categoryName}
        exampleName={state.exampleName}
        onExampleChange={({categoryName, exampleName, example}) => {
          setState((state) => ({...state, categoryName, exampleName, example}));
        }}
      />
      {props.children}
    </Container>
  );
};

// METADATA VIEWER

export const MetadataViewer: React.FC = (props: {metadata?: string}) => (
  <MonacoEditor
    language="json"
    options={{readOnly: true}}
    theme="vs-dark"
    value={props.metadata || 'No metadata available'}
  />
);

// ATTRIBUTIONS

const COPYRIGHT_LICENSE_STYLE = {
  position: 'absolute',
  right: 0,
  bottom: 0,
  backgroundColor: 'hsla(0,0%,100%,.5)',
  padding: '0 5px',
  font: '12px/20px Helvetica Neue,Arial,Helvetica,sans-serif'
};

/** TODO - check that these are visible. For which datasets? */
export function Attributions(props: {attributions?: string[]}) {
  return (
    <div style={COPYRIGHT_LICENSE_STYLE}>
      {props.attributions?.map((attribution) => <div key={attribution}>{attribution}</div>)}
    </div>
  );
}

/**
 * Shows the selected example in bold font
 */
const ExampleHeader: React.FC = ({categoryName, exampleName}) => {
  if (!categoryName || !exampleName) {
    return null;
  }

  return (
    <div>
      <h3>
        {exampleName} <b>{categoryName}</b>{' '}
      </h3>
    </div>
  );
};

type ExampleDropDownProps = {
  examples: Record<string, Record<string, Example>>;
  categoryName: string;
  exampleName: string;
  onExampleChange: OnExampleChange;
};

/**
 * Dropdown that lets user select a new example
 */
const ExampleDropDown: React.FC<ExampleDropDownProps> = (props: ExampleDropDownProps) => {
  const {categoryName, exampleName} = props;
  if (!categoryName || !exampleName) {
    return false;
  }

  const selectedValue = `${categoryName}.${exampleName}`;

  return (
    <DropDown
      value={selectedValue}
      onChange={(evt) => {
        const exampleTitle = evt.target.value as string;
        const value = exampleTitle.split('.');
        const categoryName = value[0];
        const exampleName = value[1];
        const example = props.examples[categoryName][exampleName];
        props.onExampleChange({categoryName, exampleName, example});
      }}
    >
      {Object.keys(props.examples).map((categoryName, loaderIndex) => {
        const examplesInCategory = props.examples[categoryName];
        return (
          <optgroup key={loaderIndex} label={categoryName}>
            {Object.keys(examplesInCategory).map((exampleName, exampleIndex) => {
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
};

/** 
 * Add drag and drop functions for given canvas
 * TODO - not yet used
 */
export function addFileDropToCanvas(canvas, onDrop) {
  canvas.ondragover = (event) => {
    event.dataTransfer.dropEffect = 'link';
    event.preventDefault();
  };

  canvas.ondrop = (event) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length === 1) {
      onDrop(event.dataTransfer.files[0]);
    }
  };
}

/** Filter out examples that are not of the given format. */
function getExamplesForFormat(
  examples: Record<string, Record<string, Example>>,
  format: string
): Record<string, Record<string, Example>> {
  if (format) {
    // Keep only the preferred format examples
    return {[format]: examples[format]};
  }
  return {...examples};
}
