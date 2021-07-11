import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const SemanticValidatorContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translate(-50%);
  bottom: 20px;
  display: flex;
  flex-flow: column nowrap;
  min-width: 35%;
  min-height: 100px;
  max-height: 150px;
  overflow-y: auto;
  background-color: white;
  z-index: 1000;
`;

const TableHeader = styled.th`
  position: sticky;
  top: 0;
  background-color: brown;
  text-align: left;
  padding: 3px;
  color: white;
`;

const NoIssuesItem = styled.h1`
  margin: auto;
  color: green;
`;

const NO_ISSUES = 'No Issues';

const WARNING_TYPES = {
  lod: 'LOD metric',
  parentLod: 'LOD metric',
  boundingVolume: 'Bounding Volume',
  geometryVsTextures: 'Geometry vs Textures'
};

const WARNING_TYPE = 'Type';
const WARNING = 'Warning';
const COLUMN_NUMBER = '№';

const propTypes = {
  warnings: PropTypes.arrayOf(PropTypes.object)
};

const defaultProps = {
  warnings: []
};

export default class SemanticValidator extends PureComponent {
  renderColumns(warnings) {
    return warnings.map((warning, index) => (
      <tr key={`${warning.title}-${index}`}>
        <td style={{padding: '3px'}}>{index + 1}</td>
        <td style={{padding: '3px'}}>{WARNING_TYPES[warning.type]}</td>
        <td style={{color: 'red', padding: '3px'}}>{warning.title}</td>
      </tr>
    ));
  }

  renderWarnings(warnings) {
    const columns = this.renderColumns(warnings);

    return (
      <table>
        <thead>
          <tr>
            <TableHeader>{COLUMN_NUMBER}</TableHeader>
            <TableHeader>{WARNING_TYPE}</TableHeader>
            <TableHeader>{WARNING}</TableHeader>
          </tr>
        </thead>
        <tbody>{columns}</tbody>
      </table>
    );
  }

  render() {
    const {warnings} = this.props;

    return (
      <SemanticValidatorContainer>
        {warnings && Boolean(warnings.length) ? (
          this.renderWarnings(warnings)
        ) : (
          <NoIssuesItem>{NO_ISSUES}</NoIssuesItem>
        )}
      </SemanticValidatorContainer>
    );
  }
}

SemanticValidator.propTypes = propTypes;
SemanticValidator.defaultProps = defaultProps;
