import styled from 'styled-components';

export const StatsWidgetWrapper = styled.div`
  display: ${props => props.showMemory ? 'inherit' : 'none'};
`;

export const StatsWidgetContainer = styled.div`
  word-break: break-word;
  position: absolute;
  bottom: 28px;
  z-index: 1;
  padding: 10px;
  margin: 5px;
  width: 270px;
  color: #adb5bd;
  background: rgba(36, 39, 48, 0.95);
  z-index: 18;
  border: 2px solid #212529;
  border-bottom: none;
  @media screen and (max-width: 768px) {
   bottom: 48px;
  }
`;

export const MemoryButton = styled.button`
  position: absolute;
  width: 270px;
  bottom: 0;
  padding: 5px 10px;
  z-index: 1;
  margin: 5px;
  color: #adb5bd;
  background: rgba(0, 0, 0, .7);
  text-transform: uppercase;
  align-items: center;
  height: 28px;
  cursor: pointer;
  border: 2px solid #212529;
  border-top: none;
  @media screen and (max-width: 768px) {
   bottom: 20px;
  }
`;