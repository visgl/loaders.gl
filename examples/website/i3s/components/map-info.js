import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleUp, faAngleDown} from '@fortawesome/free-solid-svg-icons';
import { Color, Flex, Font } from './styles';


const FrameWrap = styled.div`
  ${Flex}
  bottom: 21%;
  right: 0;
  height: fit-content;
  overflow: hidden;
  z-index: 2;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none;
`;

const FrameControl = styled.div`
  ${Color}
  ${Font}
  padding: 8px 24px;
  margin: 10px;
  width: 290px;
  border-radius: 8px;
`;

const FrameButton = styled.button`
  ${Font}
  ${Color}
  color: rgba(255,255,255,.6);
  border: none;
  width: 145px;
  cursor: pointer;
`;

const LinkButton = styled.button`
  border: none;
  width: 145px;
  cursor: pointer;
`;

const propTypes = {
  showFullInfo: PropTypes.bool,
  name: PropTypes.string,
  tileset: PropTypes.object,
  metadata: PropTypes.object,
  token: PropTypes.string
};

const defaultProps = {
  showFullInfo: false
}

export default class MapInfoPanel extends PureComponent {
    constructor(props) {
        super(props);
        this.state = {
          showFullInfo: false
        };
      }
      
    render() {
      const {showFullInfo} = this.state;

        return (
          <FrameWrap>
            <FrameControl showFullInfo={showFullInfo}>
              <FrameButton onClick={() => this.setState({showFullInfo: !showFullInfo})}>
                {showFullInfo ? `Show more` : `Hide`}
                {showFullInfo ? <FontAwesomeIcon icon={faAngleUp} style={{marginLeft: '10px'}} /> : <FontAwesomeIcon icon={faAngleDown} style={{marginLeft: '10px'}} />}
              </FrameButton>
              <LinkButton as="a" target="_blank" rel="noopener noreferrer">
                Go to ArcGIS
              </LinkButton>
            </FrameControl>
          </FrameWrap>
        );
    }
}

MapInfoPanel.propTypes = propTypes;
MapInfoPanel.defaultProps = defaultProps;