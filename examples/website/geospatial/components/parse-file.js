import React, {PureComponent} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

import {GeoPackageLoader} from '@loaders.gl/geopackage';
import {FlatGeobufLoader} from '@loaders.gl/flatgeobuf';
import {load, registerLoaders, selectLoader} from '@loaders.gl/core';

const ErrorFormatHeader = styled.h1`
  color: red;
  font-size: 16px;
`;

registerLoaders([GeoPackageLoader, FlatGeobufLoader]);

const propTypes = {
  file: PropTypes.object,
  onFileUploaded: PropTypes.func
};

const defaultProps = {
  file: null
};

export default class ParsedFile extends PureComponent {
  constructor(props) {
    super(props);

    this.state = {
      fileError: null,
      data: null
    };
  }

  async componentDidMount() {
    const data = await this.getFileDataUrl();
    this.setState({data});
  }

  async getFileDataUrl() {
    const {file, onFileUploaded} = this.props;
      try {
        const {arrayBuffer, src} = await this.getLoadedData(file);
        const loader = await selectLoader(src, [GeoPackageLoader, FlatGeobufLoader]);
        const result = loader && (await load(arrayBuffer, loader));
        switch (loader && loader.id) {
          case 'geopackage':
          case 'flatgeobuf':
            onFileUploaded(result, loader, file);
            break;
          default:
            throw new Error('Unknown geospatial loader');
        }
      } catch (error) {
        console.error(error);
        this.setState({fileError: error.message});
      }
  }

  async getLoadedData(file) {
    let arrayBuffer = null;
    let src = '';

    if (file instanceof File) {
      arrayBuffer = await file.arrayBuffer();
      src = file.name;
      return {arrayBuffer, src};
    }
  }

  render() {
    const {fileError} = this.state;
    return <ErrorFormatHeader style={{color: 'red'}}>{fileError}</ErrorFormatHeader>;
  }
}

ParsedFile.propTypes = propTypes;
ParsedFile.defaultProps = defaultProps;
