import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const SemanticValidatorContainer = styled.div`
  position: absolute;
  left: 50%;
  transform: translate(-50%);
  bottom: 0;
  margin: 5px;
  display: flex;
  flex-flow: column nowrap;
  min-width: 35%;
  min-height: 100px;
  max-height: 150px;
  overflow-y: auto;
  background: rgba(36, 39, 48, 0.8);
  z-index: 17;
  font-size: 12px;
  line-height: 1;
  border-bottom: none;
  @media screen and (max-width: 768px) {
    bottom: 50px;
    border: none;
    background: #242730;
  }
`;

const TableHeader = styled.th`
  position: sticky;
  top: 0;
  background-color: rgba(0,0,0,.5);
  text-align: left;
  padding: 3px;
  color: #f2e9e4;
`;

const NoIssuesItem = styled.h2`
  margin: auto;
  text-transform: uppercase;
  color: #2a9d8f;
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
        <td style={{padding: '3px', color: '#00ade6'}}>{index + 1}</td>
        <td style={{padding: '3px', color: '#f2e9e4'}}>{WARNING_TYPES[warning.type]}</td>
        <td style={{color: '#e76f51', padding: '3px'}}>{warning.title}</td>
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
