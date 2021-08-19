import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const FrameWrap = styled.div`
  position: absolute;
  right: 1%;
  bottom: ${props => (props.isMinimapShown ? "22%" : "20px")};
  overflow: hidden;
  z-index: 3;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none;
  @media (max-width: 768px) {
    bottom: 60px;
  }
`;

const IFRAME_STYLES = (showFullInfo) => ({
  display: showFullInfo ? 'block' : 'none',
  height: '470px', 
  transition: 'linear 0.5s',
  marginTop: showFullInfo ? '0' : '-540px',
  padding: '8px',
  background: 'black',
  borderRadius: '8px',
  overflowX: showFullInfo ? 'auto' : 'none',
  border: 'none'
});

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
      const {showFullInfo} = this.props;
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
        </FrameWrap>
      );
    }
}

MapInfoPanel.propTypes = propTypes;
MapInfoPanel.defaultProps = defaultProps;