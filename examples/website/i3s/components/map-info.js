import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import { Color, Flex, Font } from './styles';
import Vector from './Vector.png'

const FrameWrap = styled.div`
  ${Flex}
  bottom: 21%;
  right: 0;
  height: fit-content;
  overflow: hidden;
  z-index: 2;
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

const VectorImg = styled.img`
  width: 12px;
  height: 7px;
  margin: 0 0 2px 10px;
  transform: ${props => (props.showFullInfo ? 'none' : 'rotate(0.5turn)')};
`

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
                {showFullInfo ? `Show less` : `Show more`}
                <VectorImg src={Vector} showFullInfo={showFullInfo}/>
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