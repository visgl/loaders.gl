import React from 'react';
import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faTimes} from '@fortawesome/free-solid-svg-icons';
import {FLEX} from './styles';
import {IconProp} from '@fortawesome/fontawesome-svg-core';

const Container = styled.div`
  ${FLEX}
  align-items: center;
  color: rgba(255, 255, 255, 0.6);
  background: #0e111a;
  top: 10px;
  right: 10px;
  width: 320px;
  height: auto;
  max-height: 75%;
  padding: 0 15px;
  word-break: break-word;
  border-radius: 8px;

  @media (max-width: 600px) {
    margin: 0;
    top: 95px;
    max-height: calc(90% - 95px);
    border-radius: 8px;
    width: 300px;
  }
`;

const ContentWrapper = styled.div`
  overflow-y: auto;
  width: 100%;
  margin-bottom: 15px;
`;

const AttributesTable = styled.table`
  width: 100%;
`;

const StyledTBody = styled.tbody`
  display: table;
  width: 100%;
`;

const StyledTR = styled.tr`
  border: none;
`;

const StyledTH = styled.th`
  width: 50%;
  text-align: left;
  font-weight: 500;
  border-right: 3px solid rgba(0, 0, 0, 0.05);
  padding: 5px 0;
  border: none;
`;

const StyledTD = styled.td`
  width: 50%;
  font-weight: 400;
  padding: 5px 0;
  border: none;
`;

const Button = styled.button`
  height: 30px;
  border: none;
  cursor: pointer;
  background: transparent;
  color: white;
  outline: none;
  fontsize: 19px;
`;

const Header = styled.div`
  display: flex;
  flex-flow: row nowrap;
  justify-content: ${(props) => (props.title ? 'space-between' : 'flex-end')};
  align-items: center;
  min-height: 40px;
  width: 100%;
`;

const Title = styled.h3`
  margin: 0;
  height: 100%;
  color: white;
`;

const NO_DATA = 'No Data';

function formatValue(value) {
  return (
    String(value)
      .replace(/[{}']+/g, '')
      .trim() || NO_DATA
  );
}

type AttributesPanelProps = {
  title?: string;
  attributesObject: Record<string, string> | null;
  handleClosePanel: () => void;
};

export default function AttributesPanel({
  title,
  attributesObject,
  handleClosePanel
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
        <StyledTBody>{tableRows}</StyledTBody>
      </AttributesTable>
    );
  }

  function createTableRow(key, value) {
    return (
      <StyledTR key={key}>
        <StyledTH>{key}</StyledTH>
        <StyledTD>{value}</StyledTD>
      </StyledTR>
    );
  }

  function renderHeader(title, handleClosePanel) {
    return (
      <Header title={title}>
        {title && <Title>{title}</Title>}
        <Button onClick={handleClosePanel}>
          <FontAwesomeIcon icon={faTimes as IconProp} />
        </Button>
      </Header>
    );
  }

  return (
    <Container>
      {renderHeader(title, handleClosePanel)}
      <ContentWrapper>{attributesObject && prepareTable()}</ContentWrapper>
    </Container>
  );
}
