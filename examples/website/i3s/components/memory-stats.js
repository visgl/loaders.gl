import styled from 'styled-components';

export const StatsWidgetWrapper = styled.div`
  display: ${props => props.showMemory ? 'inherit' : 'none'};
`;

export const StatsWidgetContainer = styled.div`
  position: relative;
  width: 290px;
  word-break: break-word;
  margin-top: 5px;
  padding: 10px;
  color: #adb5bd;
  background: #242730;
`;

export const MemoryButton = styled.button`
  grid-area: memory;
  margin-top: 10px;
  background: rgba(0, 0, 0, 0.5);
  height: 30px;
  width: 100px;
  color: #f2e9e4;
  font-size: 9px;
  border: none;
  text-transform: uppercase;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  border-radius: 2px;
  transition: all 1s;
  &:hover {
    color: #242730;
    background: #00ADE6;
  }
`;
