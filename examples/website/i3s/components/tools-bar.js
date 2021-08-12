import React, {PureComponent} from 'react';
import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMap, faBug, faSdCard, faExclamationCircle} from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
    position: absolute;
    background: #232323;
    flex-wrap: wrap;
    bottom: 0;
    width: 100%;
    height: 60px;
    display: none;
    z-index: 5;
    @media (max-width: 768px) {
        display: flex;
    }
`;

const ToolButton = styled.button`
    background: transparent;
    color: white;
    width: 100%;
    height: 100%;
    cursor: pointer;
    border: none;
    font-size: 22px;
`;

const Title = styled.h3`
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    padding: 0;
    margin: 0;
`

const ToolContainer = styled.div`
    display: inline-block;
    flex-grow: 1;
    width: calc(100% * (1/4) - 10px - 1px);
    align-items: center;
    justify-content: center;
`;

export default class ToolsBar extends PureComponent {

  render() {
    return (
      <Container>
        <ToolContainer>
            <ToolButton>
                <FontAwesomeIcon icon={faMap}/>
                <Title>Map</Title>
            </ToolButton>
        </ToolContainer>
        <ToolContainer>
            <ToolButton>
                <FontAwesomeIcon icon={faBug}/>
                <Title>Debug</Title>
            </ToolButton>
        </ToolContainer>
        <ToolContainer>
            <ToolButton>
                <FontAwesomeIcon icon={faExclamationCircle}/>
                <Title>Validator</Title>
            </ToolButton>
        </ToolContainer>
        <ToolContainer>
        <ToolButton>
                <FontAwesomeIcon icon={faSdCard}/>
                <Title>Memory</Title>
            </ToolButton>
        </ToolContainer>
      </Container>
    );
  }
}
