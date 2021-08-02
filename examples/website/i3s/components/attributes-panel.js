import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faWindowClose} from '@fortawesome/free-solid-svg-icons';

const CONTAINER_STYLE = {
  display: 'flex',
  position: 'absolute',
  backgroundColor: 'rgba(36, 39, 48, 0.9)',
  color: '#adb5bd',
  flexFlow: 'column',
  lineHeight: '1',
  right: 0,
  margin: '5px',
  width: '350px',
  padding: '10px',
  maxHeight: '90%',
  marginBottom: '20px',
  zIndex: 1000,
  overflowY: 'auto',
  wordBreak: 'break-word'
};

const STYLED_TH = {
  width: '50%',
  textAlign: 'left',
  fontSize: '11px',
  textTransform: 'uppercase',
  borderRight: '3px solid rgba(0,0,0,.05)',
  padding: '.5em .7em'
};

const STYLED_TD = {
  width: '50%',
  padding: '.5em .7em'
};

const CLOSE_BUTTON_STYLE = {
  height: '30px',
  border: 'none',
  backgroundColor: 'transparent',
  cursor: 'pointer',
  color: 'white',
  outline: 'none',
  fontSize: '19px'
};

const propTypes = {
  title: PropTypes.string,
  attributesObject: PropTypes.object,
  children: PropTypes.node,
  handleClosePanel: PropTypes.func
};

const defaultProps = {
  title: null,
  attributesObject: {},
  children: null,
  handleClosePanel: () => {}
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
      <div>
        <table>
          <tbody>{tableColumns}</tbody>
        </table>
      </div>
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
      alignItems: 'center'
    };
  }

  render() {
    const {title, attributesObject, handleClosePanel, children} = this.props;

    return (
      <div style={CONTAINER_STYLE}>
        <div style={this.getHeaderStyle(title)}>
          {title && <h2 style={{marginLeft: '30px'}}>{title}</h2>}
          <button style={CLOSE_BUTTON_STYLE} onClick={handleClosePanel}>
            <FontAwesomeIcon icon={faWindowClose} />
          </button>
        </div>
        {attributesObject && this.prepareTable()}
        {children}
      </div>
    );
  }
}

AttributesPanel.propTypes = propTypes;
AttributesPanel.defaultProps = defaultProps;
