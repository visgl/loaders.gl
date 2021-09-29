import React, {PureComponent} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTimes} from '@fortawesome/free-solid-svg-icons';
import {Flex} from './styles';

const Container = styled.div`
  ${Flex}
  color: rgba(255, 255, 255, .6);
  background: #0e111a;
  flex-flow: column;
  right: 0;
  margin: 15px;
  width: 320px;
  padding: 0 15px 10px 15px;
  height: auto;
  max-height: 75%;
  z-index: 16;
  overflow-y: auto;
  word-break: break-word;
  border-radius: 8px;

  @media (max-width: 768px) {
    margin: 0;
    top: ${(props) => (props.isControlPanelShown ? '95px' : '10px')};
    max-height: ${(props) => (props.isControlPanelShown ? 'calc(75% - 95px)' : 'calc(75% - 10px)')};
    border-radius: 0;
    width: 300px;
  }
`;

const AttributesTable = styled.table`
  width: 100%;
`;

const STYLED_TH = {
  width: '50%',
  textAlign: 'left',
  fontWeight: '500',
  borderRight: '3px solid rgba(0,0,0,.05)',
  padding: '5px 0'
};

const STYLED_TD = {
  width: '50%',
  fontWeight: '400',
  padding: '5px 0'
};

const CLOSE_BUTTON_STYLE = {
  height: '30px',
  border: 'none',
  cursor: 'pointer',
  background: '#0E111A',
  color: 'white',
  outline: 'none',
  fontSize: '19px',
  right: '15px',
  position: 'absolute'
};

const propTypes = {
  title: PropTypes.string,
  attributesObject: PropTypes.object,
  isControlPanelShown: PropTypes.bool,
  children: PropTypes.node,
  handleClosePanel: PropTypes.func
};

const defaultProps = {
  title: null,
  attributesObject: {},
  isControlPanelShown: false,
  children: null,
  handleClosePanel: () => {}
};

const HEADER_STYLE = {
  color: 'white'
};

const NO_DATA = 'No Data';
export default class AttributesPanel extends PureComponent {
  prepareTable() {
    const {attributesObject} = this.props;
    const tableColumns = [];

    for (const key in attributesObject) {
      const value = this.formatValue(attributesObject[key]);
      const column = this.createTableColumn(key, value);
      tableColumns.push(column);
    }

    return (
      <AttributesTable>
        <tbody>{tableColumns}</tbody>
      </AttributesTable>
    );
  }

  createTableColumn(key, value) {
    return (
      <tr key={key}>
        <th style={STYLED_TH}>{key}</th>
        <td style={STYLED_TD}>{value}</td>
      </tr>
    );
  }

  formatValue(value) {
    return (
      value
        .toString()
        .replace(/[{}']+/g, '')
        .trim() || NO_DATA
    );
  }

  getHeaderStyle(isTitleExists) {
    return {
      display: 'flex',
      flexFlow: 'row nowrap',
      justifyContent: isTitleExists ? 'space-between' : 'flex-end',
      alignItems: 'center',
      flexShrink: 0
    };
  }

  render() {
    const {title, attributesObject, handleClosePanel, isControlPanelShown, children} = this.props;

    return (
      <Container isControlPanelShown={isControlPanelShown}>
        <div style={this.getHeaderStyle(title)}>
          {title && <h3 style={HEADER_STYLE}>{title}</h3>}
          <button style={CLOSE_BUTTON_STYLE} onClick={handleClosePanel}>
            <FontAwesomeIcon icon={faTimes} />
          </button>
        </div>
        {attributesObject && this.prepareTable()}
        {children}
      </Container>
    );
  }
}

AttributesPanel.propTypes = propTypes;
AttributesPanel.defaultProps = defaultProps;
