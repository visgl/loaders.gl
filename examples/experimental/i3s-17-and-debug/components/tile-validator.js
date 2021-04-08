import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {isTileGeometryInsideBoundingVolume} from '../tile-debug';

const TileValidatorContainer = styled.div`
  display: flex;
  margin: 10px 0;
  flex-direction: column;
`;

const ValidateButton = styled.button`
  display: flex;
  padding: 6px 12px;
  color: white;
  background: green;
  align-items: center;
  height: 20px;
  width: 100px;
  cursor: pointer;
  margin-bottom: 5px;
`;

const ValidatorInfoList = styled.div`
  display: flex;
  flex-direction: column;
`;

const VALIDATE_TILE = 'Validate Tile';
const WARNING_TYPE = 'warning';
const OK_TYPE = 'ok';

const propTypes = {
  tile: PropTypes.object
};

const defaultProps = {
  tile: null
};

export default class TileValidator extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      geometryInfo: null
    };
  }

  componentDidUpdate(prevProps) {
    if (this.props.tile.id !== prevProps.tile.id) {
      this.setState({geometryInfo: null});
    }
  }

  handleValidateTile(tile) {
    const result = isTileGeometryInsideBoundingVolume(tile);

    if (result instanceof Error) {
      const geometryError = 'Geometry validation error';
      this.setState({geometryInfo: {type: WARNING_TYPE, title: geometryError}});
    }

    if (!result) {
      const geometryError = `Geometry doesn't fit into BoundingVolume`;
      this.setState({geometryInfo: {type: WARNING_TYPE, title: geometryError}});
    } else {
      const geometryError = `Geometry fits into BoundingVolume`;
      this.setState({geometryInfo: {type: OK_TYPE, title: geometryError}});
    }
  }

  getInfoStyle(type) {
    return {
      color: type === WARNING_TYPE ? 'red' : 'green',
      marginTop: '10px'
    };
  }

  render() {
    const {tile} = this.props;
    const {geometryInfo} = this.state;

    return (
      <TileValidatorContainer>
        <ValidateButton onClick={() => this.handleValidateTile(tile)}>
          {VALIDATE_TILE}
        </ValidateButton>
        <ValidatorInfoList>
          {geometryInfo && (
            <span style={this.getInfoStyle(geometryInfo.type)}>{geometryInfo.title}</span>
          )}
        </ValidatorInfoList>
      </TileValidatorContainer>
    );
  }
}

TileValidator.propTypes = propTypes;
TileValidator.defaultProps = defaultProps;
