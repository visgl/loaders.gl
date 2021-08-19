import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMap, faBug, faSdCard, faExclamationCircle, faInfo, faGlobe } from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
  position: absolute;
  background: #232323;
  display: flex;                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ;
  bottom: 0;
  width: 100%;
  height: 60px;
  z-index: 5;
  @media (min-width: 769px) {
    display: flex;
    position: absolute;
    top: 0;
    margin: 10px 0 0 10px;
    width: 277px;
    height: 40px;
    background: #0E111A;
    border-radius: 8px;
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
  min-width: 40px;
  flex: 1 0 1px;
  padding: 0;                
  @media (min-width: 768px) {
    font-size: 18px;
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
    const isActive = true;

    return (
      <ToolButton
        className={`button ${isActive ? 'active' : ''} ${this.props.className}`}
        onClick={() => onDebugOptionsChange({ showMemory: !showMemory })}
      >
        <FontAwesomeIcon icon={faSdCard} />
        <Title>Memory</Title>
      </ToolButton>
    );
  }

  _renderValidatorButton() {
    const {
      debugOptions: { semanticValidator },
      onDebugOptionsChange
    } = this.props;

    return (
      <ToolButton
        onClick={() => onDebugOptionsChange({ semanticValidator: !semanticValidator })}
      >
        <FontAwesomeIcon icon={faExclamationCircle} />
        <Title>Validator</Title>
      </ToolButton>
    );
  }

  _renderDebugButton() {
    const {
      debugOptions: { debugPanel },
      onDebugOptionsChange
    } = this.props;

    return (
      <ToolButton
        onClick={() => onDebugOptionsChange({ debugPanel: !debugPanel })}
      >
        <FontAwesomeIcon icon={faBug} />
        <Title>Debug</Title>
      </ToolButton>
    );
  }

  _renderMapButton() {
    const {
      debugOptions: { controlPanel },
      onDebugOptionsChange
    } = this.props;

    return (
      <ToolButton
        onClick={() => onDebugOptionsChange({ controlPanel: !controlPanel })}
      >
        <FontAwesomeIcon icon={faMap} />
        <Title>Map</Title>
      </ToolButton>
    );
  }

  _renderMapInfoButton() {
    const {
      debugOptions: { showFullInfo },
      onDebugOptionsChange
    } = this.props;

    return (
      <ToolButton
        onClick={() => onDebugOptionsChange({ showFullInfo: !showFullInfo })}
      >
        <FontAwesomeIcon icon={faInfo} />
        <Title>Info</Title>
      </ToolButton>
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
      <LinkButton as="a" target="_blank" rel="noopener noreferrer" href={url}>
        <FontAwesomeIcon icon={faGlobe} />
        <Title>ArcGIS</Title>
      </LinkButton>
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

