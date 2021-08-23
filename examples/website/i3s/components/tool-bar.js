import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faBug, faSdCard, faExclamationCircle, faInfo, faGlobe } from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
  position: absolute;
  background: #232323;
  display: flex;
  justify-content: space-around;
  align-items: center;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       ;
  bottom: 0;
  width: 100vw;
  height: 60px;
  z-index: 100;
  @media (min-width: 769px) {
    position: absolute;
    top: 0;
    margin: 10px 0 0 10px;
    width: auto;
    height: 40px;
    background: #0E111A;
    border-radius: 8px;
  }                   
`;

const ToolButton = styled.button`
  background: ${props => props.active ? '#4F52CC' : 'transparent'};
  color: ${props => props.active ? 'white' : 'rgba(255, 255 , 255, .8)'};
  cursor: pointer;
  border: none;
  font-size: 22px;
  flex: 1 1 0px;
  margin: 2px 0 2px 1px;
  height: 56px;
  width: 16.5vw;
  &:hover {
    color: white;
  }               
  @media (min-width: 769px) {
    font-size: 18px;
    width: 45px;
    height: 36px;
    border-radius: 5px;
  }
`;

const LinkButton = styled(ToolButton)`
  display: flex;
  justify-content: center;
  align-items: center;
  flex-flow: column nowrap;
  text-decoration: none;
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
`;

const DebugTooltip = styled(TooltipBox)`
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
        <DebugTooltip>
          Debug panel
        </DebugTooltip>
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
        <TooltipBox>
          Select map
        </TooltipBox>
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

  _renderLinkButton() {
    const { metadata, token } = this.props;
    const serviceItemId = metadata?.serviceItemId;

    if (!serviceItemId) {
      return null;
    }

    let url = `https://www.arcgis.com/home/item.html?id=${serviceItemId}`;
    if (token) {
      url = `${url}&token=${token}`;
    }

    return (
      <TooltipCard>
        <LinkButton as="a" target="_blank" rel="noopener noreferrer" href={url}>
          <FontAwesomeIcon icon={faGlobe} />
          <Title style={{marginTop: '3px'}}>ArcGIS</Title>
        </LinkButton>
        <TooltipBox>
          Go to ArcGIS
        </TooltipBox>
      </TooltipCard>
    );
  }

  render() {
    return (
      <Container>
        {this._renderDebugButton()}
        {this._renderValidatorButton()}
        {this._renderMapButton()}
        {this._renderMemoryButton()}
        {this._renderMapInfoButton()}
        {this._renderLinkButton()}
      </Container>
    );
  }
}

ToolBar.propTypes = propTypes;
ToolBar.defaultProps = defaultProps;

