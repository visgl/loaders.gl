import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {Flex} from './styles';

const SemanticValidatorContainer = styled.div`
  ${Flex}
  left: 25%;
  right: 25%;
  bottom: 10px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  background: #0e111a;
  z-index: 17;
  line-height: 135%;
  border-radius: 8px;
  min-height: 38px;
  max-height: 135px;
  overflow-y: auto;

  @media (max-width: 768px) {
    bottom: 60px;
    width: 100vw;
    left: 0;
    right: 0;
    border-radius: 0;
    max-height: 200px;
    line-height: 100%;
  }
`;

const Table = styled.table`
  width: 100%;
`;

const TableHeader = styled.th`
  position: sticky;
  top: 0;
  text-align: left;
  background: #0e111a;
  padding: 8px;
  height: 22px;
  border: none;
`;

const NoIssuesItem = styled.h4`
  margin: auto;
  color: white;
  font-weight: normal;
`;

const TR_STYLE = {
  color: 'rgba(255, 255, 255, .3)',
  margin: '8px 0',
  border: 'none'
};

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
      <tr style={{border: 'none'}} key={`${warning.title}-${index}`}>
        <td style={{padding: '0 8px 0 8px', textAlign: 'center', border: 'none'}}>{index + 1}</td>
        <td style={{padding: '0 8px 0 8px', border: 'none !important', border: 'none'}}>{WARNING_TYPES[warning.type]}</td>
        <td style={{color: 'rgba(249, 80, 80, .6)', padding: '0 8px 0 8px', border: 'none'}}>{warning.title}</td>
      </tr>
    ));
  }

  _clearButtonStyles() {
    return {
      display: 'flex',
      position: 'absolute',
      top: '0',
      right: '0',
      width: '90px',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'transparent',
      padding: '4px 16px',
      // margin: '0 10px',
      margin: '8px',
      color: 'rgba(255,255,255,.6)',
      fontWeight: '500px',
      borderRadius: '4px',
      cursor: 'pointer'
    };
  }

  renderWarnings(warnings) {
    const columns = this.renderColumns(warnings);
    const {clearWarnings} = this.props;

    return (
      <Table>
        <thead>
          <tr style={TR_STYLE}>
            <TableHeader>{COLUMN_NUMBER}</TableHeader>
            <TableHeader>{WARNING_TYPE}</TableHeader>
            <TableHeader>
              {WARNING}
              <button style={this._clearButtonStyles()} onClick={clearWarnings}>
                Clear All
              </button>
            </TableHeader>
          </tr>
        </thead>
        <tbody>{columns}</tbody>
      </Table>
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
