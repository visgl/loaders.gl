import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';
import {
  isTileGeometryInsideBoundingVolume,
  getGeometryVsTextureMetrics,
  isGeometryBoundingVolumeMoreSuitable
} from '../utils/tile-debug';
import {Checkbox} from './checkbox';

const TileValidatorContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1 0;
`;

const ValidateButton = styled.button`
  display: flex;
  padding: 4px 16px;
  background: #4f52cc;
  color: white;
  align-items: center;
  height: 20px;
  justify-content: center;
  width: 120px;
  border: none;
  font-weight: bold;
  cursor: pointer;
  margin-bottom: 5px;
  border-radius: 4px;
`;

const NormalsValidator = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 10px;
  flex-flow: column nowrap;
`;

const ValidatorInfoList = styled.div`
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
`;

const GapInput = styled.input`
  max-width: 50px;
  margin: 0 10px;
  background: #1d2335;
  color: white;
  font-weight: bold;
  text-align: center;
  border-radius: 4px;
  cursor: ${(props) => (props.disabled ? 'auto' : 'pointer')};
  border: none;
  padding: 5px;
`;

const NormalsControl = styled.div`
  width: 100%;
  display flex;
  align-items: center;
  margin: 10px 0 10px 0;
`;

const NoNormalsInfo = styled.span`
  display: flex;
  align-self: flex-start;
  margin: 5px;
  color: #ff0047;
`;

const VALIDATE_TILE = 'Validate Tile';
const WARNING_TYPE = 'warning';
const OK_TYPE = 'ok';

const propTypes = {
  tile: PropTypes.object,
  trianglesPercentage: PropTypes.number,
  normalsLength: PropTypes.number,
  showNormals: PropTypes.bool,
  handleShowNormals: PropTypes.func,
  handleChangeTrianglesPercentage: PropTypes.func,
  handleChangeNormalsLength: PropTypes.func
};

const defaultProps = {
  tile: null,
  showNormals: false,
  handleShowNormals: () => {},
  handleChangeTrianglesPercentage: () => {},
  handleChangeNormalsLength: () => {}
};

export default class TileValidator extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      tileId: props.tile.id,
      geometryInfo: null,
      triangleMessages: null,
      boundingVolumeInfo: null
    };
  }

  static getDerivedStateFromProps(props, state) {
    // New tile is being set, re-initialize state
    if (props.tile.id !== state.tileId) {
      return {
        tileId: props.tile.id,
        geometryInfo: null,
        triangleMessages: null,
        boundingVolumeInfo: null
      };
    }
    return null;
  }

  _onValidateTile(tile) {
    this._validateGeometryInsideBoundingVolume(tile);
    this._validateGeometryVsTexture(tile);
    this.compareGeometryBoundingVolumeVsTileBoundingVolume(tile);
  }

  _validateGeometryInsideBoundingVolume(tile) {
    try {
      const result = isTileGeometryInsideBoundingVolume(tile);

      if (!result) {
        const geometryError = `Geometry doesn't fit into BoundingVolume`;
        this.setState({geometryInfo: {type: WARNING_TYPE, title: geometryError}});
      } else {
        const title = `Geometry fits into BoundingVolume`;
        this.setState({geometryInfo: {type: OK_TYPE, title}});
      }
    } catch (error) {
      this.setState({geometryInfo: {type: WARNING_TYPE, title: error}});
    }
  }

  _validateGeometryVsTexture(tile) {
    const triangleMetrics = getGeometryVsTextureMetrics(tile);
    if (!triangleMetrics) {
      return;
    }
    const triangleMessages = [];
    triangleMessages.push({
      key: 'trianglesTotal',
      text: `Triangles total: ${triangleMetrics.triangles}`
    });
    if (triangleMetrics.geometryNullTriangleCount) {
      triangleMessages.push({
        key: 'geometryNullTriangleCount',
        type: WARNING_TYPE,
        text: `Geometry degenerate triangles: ${triangleMetrics.geometryNullTriangleCount}`
      });
    } else {
      triangleMessages.push({
        key: 'geometryNullTriangleCount',
        type: OK_TYPE,
        text: `Geometry degenerate triangles: ${triangleMetrics.geometryNullTriangleCount}`
      });
    }

    if (triangleMetrics.geometrySmallTriangleCount) {
      triangleMessages.push({
        key: 'geometrySmallTriangleCount',
        type: WARNING_TYPE,
        text: `Geometry small triangles (less than 1 squared mm): ${triangleMetrics.geometrySmallTriangleCount}`
      });
      triangleMessages.push({
        key: 'minGeometryArea',
        type: WARNING_TYPE,
        text: `Geometry smallest triangle: ${triangleMetrics.minGeometryArea} m^2`
      });
    } else {
      triangleMessages.push({
        key: 'geometrySmallTriangleCount',
        type: OK_TYPE,
        text: `Geometry small triangles (less than 1 squared mm): ${triangleMetrics.geometrySmallTriangleCount}`
      });
    }

    if (triangleMetrics.texCoordNullTriangleCount) {
      triangleMessages.push({
        key: 'texCoordNullTriangleCount',
        type: WARNING_TYPE,
        text: `UV0 degenerate triangles: ${triangleMetrics.texCoordNullTriangleCount}`
      });
    } else {
      triangleMessages.push({
        key: 'texCoordNullTriangleCount',
        type: OK_TYPE,
        text: `UV0 degenerate triangles: ${triangleMetrics.texCoordNullTriangleCount}`
      });
    }

    if (triangleMetrics.texCoordSmallTriangleCount) {
      triangleMessages.push({
        key: 'texCoordSmallTriangleCount',
        type: WARNING_TYPE,
        text: `UV0 small triangles (occupies less than 1 pixel): ${triangleMetrics.texCoordSmallTriangleCount}`
      });
      triangleMessages.push({
        key: 'minTexCoordArea',
        type: WARNING_TYPE,
        text: `UV0 smallest triangle: ${triangleMetrics.minTexCoordArea}`
      });
      triangleMessages.push({
        key: 'pixelArea',
        type: WARNING_TYPE,
        text: `UV0 pixel area: ${triangleMetrics.pixelArea}`
      });
    } else {
      triangleMessages.push({
        key: 'texCoordSmallTriangleCount',
        type: OK_TYPE,
        text: `UV0 small triangles (less than 1 squared mm): ${triangleMetrics.texCoordSmallTriangleCount}`
      });
    }
    this.setState({triangleMessages});
  }

  compareGeometryBoundingVolumeVsTileBoundingVolume(tile) {
    try {
      const result = isGeometryBoundingVolumeMoreSuitable(tile);

      if (!result) {
        const title = 'Tile bounding volume is suitable for geometry';
        this.setState({boundingVolumeInfo: {type: OK_TYPE, title}});
      } else {
        const geometryError = 'Geometry bounding volume is more suitable than tile bounding volume';
        this.setState({boundingVolumeInfo: {type: WARNING_TYPE, title: geometryError}});
      }
    } catch (error) {
      this.setState({boundingVolumeInfo: {type: WARNING_TYPE, title: error}});
    }
  }

  getInfoStyle(type) {
    return {
      color: type === WARNING_TYPE ? '#FF0047' : '#01DC69',
      marginTop: '5px'
    };
  }

  getCheckboxStyle(isTileHasNormals) {
    return {
      cursor: isTileHasNormals ? 'pointer' : 'auto'
    };
  }

  _renderTriangleMetrics() {
    const {triangleMessages} = this.state;
    if (!triangleMessages) {
      return null;
    }
    return triangleMessages.map((message) => (
      <span key={message.key} style={this.getInfoStyle(message.type)}>
        {message.text}
      </span>
    ));
  }

  _renderBoundingVolumesMetrics() {
    const {boundingVolumeInfo} = this.state;
    if (!boundingVolumeInfo) {
      return null;
    }
    return (
      <span style={this.getInfoStyle(boundingVolumeInfo.type)}>{boundingVolumeInfo.title}</span>
    );
  }
  _renderGeometryMetrics() {
    const {geometryInfo} = this.state;
    if (!geometryInfo) {
      return null;
    }
    return <span style={this.getInfoStyle(geometryInfo.type)}>{geometryInfo.title}</span>;
  }

  _renderNormalsValidationControl() {
    const {
      tile,
      handleShowNormals,
      showNormals,
      trianglesPercentage,
      normalsLength,
      handleChangeTrianglesPercentage,
      handleChangeNormalsLength
    } = this.props;
    const isTileHasNormals =
      tile && tile.content && tile.content.attributes && tile.content.attributes.normals;
    return (
      <NormalsValidator>
        {!isTileHasNormals && <NoNormalsInfo>{'Tile has no normals'}</NoNormalsInfo>}
        <NormalsControl>
          <label style={this.getCheckboxStyle(isTileHasNormals)} htmlFor="normals-checkbox">
            <Checkbox
              id="normals-checkbox"
              type="checkbox"
              disabled={!isTileHasNormals}
              checked={showNormals}
              onChange={() => handleShowNormals(tile)}
            ></Checkbox>
            Show Normals
          </label>
        </NormalsControl>
        <NormalsControl>
          <span>Percent</span>
          <GapInput
            type="number"
            min="1"
            max="100"
            value={trianglesPercentage}
            disabled={!isTileHasNormals}
            onChange={(event) => handleChangeTrianglesPercentage(tile, Number(event.target.value))}
          />
          <span>% triangles with normals</span>
        </NormalsControl>
        <NormalsControl>
          <span>Normals length</span>
          <GapInput
            type="number"
            min="1"
            value={normalsLength}
            disabled={!isTileHasNormals}
            onChange={(event) => handleChangeNormalsLength(tile, Number(event.target.value))}
          />
          <span>m</span>
        </NormalsControl>
      </NormalsValidator>
    );
  }

  render() {
    const {tile} = this.props;

    return (
      <TileValidatorContainer>
        {this._renderNormalsValidationControl()}
        <ValidateButton onClick={() => this._onValidateTile(tile)}>{VALIDATE_TILE}</ValidateButton>
        <ValidatorInfoList>
          {this._renderGeometryMetrics()}
          {this._renderBoundingVolumesMetrics()}
          {this._renderTriangleMetrics()}
        </ValidatorInfoList>
      </TileValidatorContainer>
    );
  }
}

TileValidator.propTypes = propTypes;
TileValidator.defaultProps = defaultProps;
