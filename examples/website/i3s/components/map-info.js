import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleUp, faAngleDown} from '@fortawesome/free-solid-svg-icons';
import { Color, Font } from './styles';

const FrameWrap = styled.div`
  position: absolute;
  right: 15px;
  bottom: ${props => (props.isMinimapShown ? "22%" : "20px")};
  overflow: hidden;
  z-index: 19;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none;
`;

const FrameButton = styled.button`
  ${Font}
  ${Color}
  color: rgba(255,255,255,.6);
  border: none;
  width: 60%;
  padding: 8px 24px;
  cursor: pointer;
  border-radius: 8px 0 0 8px;
`;

const LinkButton = styled.button`
  ${Font}
  ${Color}
  text-align: center;
  color: #737373;
  border: none;
  width: 50%;
  padding: 9px 18px;
  cursor: pointer;
  cursor: pointer;
  text-decoration: none;
  border-radius: 0 8px 8px 0;;
`;

const IFRAME_STYLES = (showFullInfo) => ({
  display: showFullInfo ? 'block' : 'none',
  height: '480px', 
  transition: 'linear 0.5s',
  marginTop: showFullInfo ? '0' : '-540px',
  padding: '15px',
  background: 'black',
  borderRadius: '8px',
  overflowX: showFullInfo ? 'auto' : 'none',
  border: 'none'
});

const BUTTON_WRAPPER_STYLE = {
  width: '330px',
  marginTop: '10px'
};

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
      const {metadata, token, isMinimapShown} = this.props;
      const {showFullInfo} = this.state;
      const serviceItemId = metadata?.serviceItemId;

      if(!serviceItemId) {
        return null;
      }

      let url = `https://www.arcgis.com/home/item.html?id=${serviceItemId}`;
      if (token) {
        url = `${url}&token=${token}`;
      }

      return (
        <FrameWrap isMinimapShown={isMinimapShown}>
          <iframe
            id="tileset-info"
            title="tileset-info"
            style={IFRAME_STYLES(showFullInfo)}
            src={url}
          />
          <div style={BUTTON_WRAPPER_STYLE}>
            <FrameButton onClick={() => this.setState({showFullInfo: !showFullInfo})}>
              {showFullInfo ? `Hide` : `Show more`}
              <FontAwesomeIcon icon={showFullInfo ? faAngleDown : faAngleUp} style={{marginLeft: '10px'}} />
            </FrameButton>
            <LinkButton as="a" target="_blank" rel="noopener noreferrer" href={url}>
              Go to ArcGIS
            </LinkButton>
          </div>
        </FrameWrap>
      );
    }
}

MapInfoPanel.propTypes = propTypes;
MapInfoPanel.defaultProps = defaultProps;