import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faBug, faSdCard, faExclamationCircle, faInfo } from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
  display: flex;
  justify-content: space-around;
  align-items: center;  
  position: absolute;
  top: 0;
  margin: 10px 10px;
  width: 277px;
  height: 40px;
  background: #0E111A;
  border-radius: 8px;
  z-index: 100;
  background: #232323;

  @media (max-width: 769px) {
    top: auto;
    margin: 0;
    bottom: 0;
    width: 100%;
    height: 60px;
    border-radius: 0;
  }                   
`;

const ToolButton = styled.button`
  display: flex;
  flex-flow: column nowrap;
  justify-content: center;
  align-items: center;
  padding: 0;
  font-size: 18px;
  height: 36px;
  border: none;
  border-radius: 5px;
  width: 100%;
  background: ${props => props.active ? '#4F52CC' : 'transparent'};
  color: ${props => props.active ? 'white' : 'rgba(255, 255 , 255, .8)'};
  cursor: pointer;

  &:hover {
    color: white;
  }  

  @media (max-width: 769px) {
    font-size: 22px;
    height: 56px;
    border-radius: 0;
  }
`;

const Title = styled.h3`
  font-size: 14px;
  font-weight: 500;
  text-align: center;
  padding: 0;
  margin: 0;
  @media (min-width: 769px) {
    display: none;
  }
`

const TooltipBox = styled.div`
  position: absolute;
  top: calc(100% + 5px);
  left: -37px;
  font-weight: 500;
  font-size: 16px;
  visibility: hidden;
  color: transparent;
  background-color: transparent;
  text-align: center;
  width: 110px;
  line-height: 22px;
  border-radius: 4px;
  transition: visibility 0.1s, color 0.1s, background-color 0.1s all;
  &:before {
    content: "";
    width: 0;
    height: 0;
    left: 55px;
    top: -6px;
    position: absolute;
    border: 6px solid transparent;
    transform: rotate(135deg);
    transition: border 0.1s all;
  }
  @media (any-hover: none) {
    display: none;
  }
`;

const TooltipCard = styled.div`
  position: relative;
  min-width: 51px;

  & ${ToolButton}:hover + ${TooltipBox} {
    visibility: visible;
    color: #0E111A;
    justify-content: center;
    align-items: center;
    background-color: white;
    width: 120px;
    border-radius: 4px;

    &:before {
      border-color: transparent transparent white white;
    }

    @media (any-hover: none) {
      display: none;
      
    }
  }

  @media (max-width: 769px) {
    flex: 1 0 1px;

    &:not(:first-child) {
      margin-left: 1px;
    }
    
  }   
`;

const LeftTooltip = styled(TooltipBox)`
  left: 0;
  &:before {
    left: 18px;
  }
`

const propTypes = {
  onDebugOptionsChange: PropTypes.func,
  debugOptions: PropTypes.object,
};

const defaultProps = {
  onDebugOptionsChange: () => { }
};

export default class ToolBar extends PureComponent {

  _renderMemoryButton() {
    const {
      debugOptions: { showMemory },
      onDebugOptionsChange
    } = this.props;

    return (
      <TooltipCard>
        <ToolButton
            active={showMemory}
            onClick={() => onDebugOptionsChange({ showMemory: !showMemory })}
          >
          <FontAwesomeIcon icon={faSdCard} />
          <Title>Memory</Title>
        </ToolButton>
        <TooltipBox>
          Memory usage
        </TooltipBox>
      </TooltipCard>
    );
  }

  _renderValidatorButton() {
    const {
      debugOptions: { semanticValidator },
      onDebugOptionsChange
    } = this.props;

    return (
      <TooltipCard>
        <ToolButton
            active={semanticValidator}
            onClick={() => onDebugOptionsChange({ semanticValidator: !semanticValidator })}
          >
          <FontAwesomeIcon icon={faExclamationCircle} />
          <Title>Vaidator</Title>
        </ToolButton>
        <TooltipBox>
          Validator
        </TooltipBox>
      </TooltipCard>
    );
  }

  _renderDebugButton() {
    const {
      debugOptions: { debugPanel },
      onDebugOptionsChange
    } = this.props;

    return (
      <TooltipCard>
        <ToolButton
          active={debugPanel}
          onClick={() => onDebugOptionsChange({ debugPanel: !debugPanel })}
        >
          <FontAwesomeIcon icon={faBug} />
          <Title>Debug</Title>
        </ToolButton>
        <TooltipBox>
          Debug panel
        </TooltipBox>
      </TooltipCard>
    );
  }

  _renderMapButton() {
    const {
      debugOptions: { controlPanel },
      onDebugOptionsChange
    } = this.props;

    return (
      <TooltipCard>
        <ToolButton
          active={controlPanel}
          onClick={() => onDebugOptionsChange({ controlPanel: !controlPanel })}
        >
          <FontAwesomeIcon icon={faMap} />
          <Title>Map</Title>
        </ToolButton>
        <LeftTooltip>
          Select map
        </LeftTooltip>
      </TooltipCard>
    );
  }

  _renderMapInfoButton() {
    const {
      debugOptions: { showFullInfo },
      onDebugOptionsChange
    } = this.props;

    return (
      <TooltipCard>
        <ToolButton
          active={showFullInfo}
          onClick={() => onDebugOptionsChange({ showFullInfo: !showFullInfo })}
        >
          <FontAwesomeIcon icon={faInfo} />
          <Title>Info</Title>
        </ToolButton>
        <TooltipBox>
          Map info
        </TooltipBox>
      </TooltipCard>
    );
  }

  render() {
    return (
      <Container>
        {this._renderMapButton()}
        {this._renderMapInfoButton()}
        {this._renderMemoryButton()}
        {this._renderValidatorButton()}
        {this._renderDebugButton()}
      </Container>
    );
  }
}

ToolBar.propTypes = propTypes;
ToolBar.defaultProps = defaultProps;

