import React from 'react';
import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTimes} from '@fortawesome/free-solid-svg-icons';
import {Flex} from './styles';
import {IconProp} from '@fortawesome/fontawesome-svg-core';

const Container = styled.div`
  ${Flex}
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
  background: #0e111a;
  flex-flow: column;
  right: 0;
  top: 15px;
  right: 15px;
  width: 320px;
  height: auto;
  max-height: 75%;
  z-index: 16;
  word-break: break-word;
  border-radius: 8px;

  @media (max-width: 600px) {
    margin: 0;
    top: ${(props) => (props.isControlPanelShown ? '95px' : '10px')};
    max-height: ${(props) => (props.isControlPanelShown ? 'calc(75% - 95px)' : 'calc(75% - 10px)')};
    border-radius: 0;
    width: 300px;
  }
`;

const ContentWrapper = styled.div`
  overflow-y: auto;
  width: 95%;
  padding: 0 15px;
  margin-bottom: 15px;
`;

const AttributesTable = styled.table`
  width: 100%;
`;

const STYLED_TH = {
  width: '50%',
  textAlign: 'left',
  fontWeight: '500',
  borderRight: '3px solid rgba(0,0,0,.05)',
  padding: '5px 0',
  border: 'none'
};

const STYLED_TD = {
  width: '50%',
  fontWeight: '400',
  padding: '5px 0',
  border: 'none'
};

const CLOSE_BUTTON_STYLE = {
  height: '30px',
  border: 'none',
  cursor: 'pointer',
  background: 'transparent',
  color: 'white',
  outline: 'none',
  fontSize: '19px',
  marginRight: '5px'
};

const HEADER_STYLE = {
  margin: '0',
  marginLeft: '15px',
  color: 'white'
};

const NO_DATA = 'No Data';

type AttributesPanelProps = {
  title?: string;
  attributesObject: Record<string, string> | null; //{[key: string]: string} | null;
  handleClosePanel: () => void;
  isControlPanelShown: boolean;
};

export default function AttributesPanel({
  title,
  attributesObject,
  handleClosePanel,
  isControlPanelShown
}: AttributesPanelProps) {
  function prepareTable() {
    const tableRows: any[] = [];

    for (const key in attributesObject) {
      const value = formatValue(attributesObject[key]);
      const row = createTableRow(key, value);
      tableRows.push(row);
    }

    return (
      <AttributesTable>
        <tbody>{tableRows}</tbody>
      </AttributesTable>
    );
  }

  function createTableRow(key, value) {
    return (
      <tr style={{border: 'none'}} key={key}>
        <th style={STYLED_TH}>{key}</th>
        <td style={STYLED_TD}>{value}</td>
      </tr>
    );
  }

  function formatValue(value) {
    return (
      String(value)
        .replace(/[{}']+/g, '')
        .trim() || NO_DATA
    );
  }

  function getHeaderStyle(title) {
    return {
      display: 'flex',
      flexFlow: 'row nowrap',
      justifyContent: title ? 'space-between' : 'flex-end',
      alignItems: 'center',
      minHeight: '40px',
      width: '100%'
    };
  }

  function renderHeader(title, handleClosePanel) {
    return (
      <div style={getHeaderStyle(title)}>
        {title && <h3 style={HEADER_STYLE}>{title}</h3>}
        <button style={CLOSE_BUTTON_STYLE} onClick={handleClosePanel}>
          <FontAwesomeIcon icon={faTimes as IconProp} />
        </button>
      </div>
    );
  }

  return (
    <Container isControlPanelShown={isControlPanelShown}>
      {renderHeader(title, handleClosePanel)}
      <ContentWrapper>{attributesObject && prepareTable()}</ContentWrapper>
    </Container>
  );
}
