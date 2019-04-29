import styled from 'styled-components';
import React, {PureComponent} from 'react';

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
  color: #6b6b76;
  text-transform: uppercase;
  outline: none;
  z-index: 100;
`;

export default class ControlPanel extends PureComponent {
  _renderByCategories() {
    const {category, example, onChange, data} = this.props;
    const categories = Object.keys(data);

    return (
      <select
        defaultValue={`${category}.${example}`}
        onChange={evt => {
          const categoryExample = evt.target.value;
          const value = categoryExample.split('.');
          onChange({category: value[0], example: value[1]});
        }}
      >
        {categories.map((c, i) => {
          const categoryExamples = data[c].examples;
          return (
            <optgroup key={i} label={c}>
              {Object.keys(categoryExamples).map((e, j) => {
                return (
                  <option key={j} value={`${c}.${e}`}>
                    {e}
                  </option>
                );
              })}
            </optgroup>
          );
        })}
      </select>
    );
  }

  render() {
    return <Container>{this._renderByCategories()}</Container>;
  }
}
