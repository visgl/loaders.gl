import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faMap, faBug, faSdCard, faExclamationCircle, faInfo, faGlobe} from '@fortawesome/free-solid-svg-icons';

const Container = styled.div`
    position: absolute;
    background: #232323;
    display: flex;
    flex-wrap: wrap;
    bottom: 0;
    width: 100%;
    height: 60px;
    z-index: 5;
    @media (min-width: 768px) {
        top: 15px;
        left: 15px;
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
    @media (min-width: 768px) {
        font-size: 18px;
    }
`;

const Title = styled.h3`
    font-size: 14px;
    font-weight: 500;
    text-align: center;
    padding: 0;
    margin: 0;
    @media (min-width: 768px) {
        display: none;
    }
`

const ToolContainer = styled.div`
    display: inline-block;
    flex-grow: 1;
    width: calc(100% * (1/6) - 10px - 1px);
    align-items: center;
    justify-content: center;
    text-align: center;
`;

const propTypes = {
    onDebugOptionsChange: PropTypes.func,
    debugOptions: PropTypes.object,
};
  
const defaultProps = {
    onDebugOptionsChange: () => {}
};

export default class ToolBar extends PureComponent {

    _renderMemoryButton() {
        const {
            debugOptions: {showMemory},
            onDebugOptionsChange
          } = this.props;
        const isActive = true;

        return (
            <ToolContainer>
                <ToolButton
                    className={`button ${isActive ? 'active': ''} ${this.props.className}`}
                    onClick={() => onDebugOptionsChange({showMemory: !showMemory})}
                >
                    <FontAwesomeIcon icon={faSdCard}/>
                    <Title>Memory</Title>
                </ToolButton>
            </ToolContainer>
        );
    }

    _renderValidatorButton() {
        const {
            debugOptions: {semanticValidator},
            onDebugOptionsChange
          } = this.props;

        return (
            <ToolContainer>
                <ToolButton
                    onClick={() => onDebugOptionsChange({semanticValidator: !semanticValidator})}
                >
                    <FontAwesomeIcon icon={faExclamationCircle}/>
                    <Title>Validator</Title>
                </ToolButton>
            </ToolContainer>
        );
    }

    _renderDebugButton() {
        const {
            debugOptions: {debugPanel},
            onDebugOptionsChange
          } = this.props;

        return (
            <ToolContainer>
                <ToolButton
                    onClick={() => onDebugOptionsChange({debugPanel: !debugPanel})}
                >
                    <FontAwesomeIcon icon={faBug}/>
                    <Title>Debug</Title>
                </ToolButton>
            </ToolContainer>
        );
    }

    _renderMapButton() {
        const {
            debugOptions: {controlPanel},
            onDebugOptionsChange
          } = this.props;

        return (
            <ToolContainer>
                <ToolButton
                    onClick={() => onDebugOptionsChange({controlPanel: !controlPanel})}
                >
                    <FontAwesomeIcon icon={faMap}/>
                    <Title>Map</Title>
                </ToolButton>
            </ToolContainer>
        );
    }

    _renderMapInfoButton() {
        const {
            debugOptions: {showFullInfo},
            onDebugOptionsChange
          } = this.props;

        return (
            <ToolContainer>
                <ToolButton
                    onClick={() => onDebugOptionsChange({showFullInfo: !showFullInfo})}
                >
                    <FontAwesomeIcon icon={faInfo}/>
                    <Title>Info</Title>
                </ToolButton>
            </ToolContainer>
        );
    }

    _renderLinkButton() {
        const {metadata, token} = this.props;
        const serviceItemId = metadata?.serviceItemId;

        if(!serviceItemId) {
            return null;
        }

        let url = `https://www.arcgis.com/home/item.html?id=${serviceItemId}`;
        if (token) {
            url = `${url}&token=${token}`;
        }

        return (
            <ToolContainer>
                <ToolButton as="a" target="_blank" rel="noopener noreferrer" href={url}>
                    <FontAwesomeIcon icon={faGlobe} style={{marginTop: '10px'}}/>
                    <Title>ArcGIS</Title>
                </ToolButton>
            </ToolContainer>
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

