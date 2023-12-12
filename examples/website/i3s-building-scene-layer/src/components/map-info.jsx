import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const FrameWrap = styled.div`
  position: absolute;
  right: 1%;
  height: calc(75% - 85px);
  max-height: 500px;
  bottom: 22%;
  z-index: 3;
  -moz-user-select: none;
  -khtml-user-select: none;
  user-select: none;
  background: white;
  border: 8px solid black;
  border-radius: 8px;
  overflow-y: auto;
  overflow-x: hidden;

  iframe {
    overflow-x: hidden;
    height: 90% !important;
    width: 310px;
  }

  @media (max-width: 768px) {
    right: 0;
  }
`;

const ArcGISContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  margin-top: 10px;
`;

const IFRAME_STYLES = (showFullInfo) => ({
  display: showFullInfo ? 'block' : 'none',
  transition: 'linear 0.5s',
  marginTop: showFullInfo ? '0' : '-540px',
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
};

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

    if (!serviceItemId) {
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
        ></iframe>
        <ArcGISContainer>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href={`https://www.arcgis.com/home/item.html?id=${serviceItemId}`}
          >
            Go to ArcGiS
          </a>
        </ArcGISContainer>
      </FrameWrap>
    );
  }
}

MapInfoPanel.propTypes = propTypes;
MapInfoPanel.defaultProps = defaultProps;
