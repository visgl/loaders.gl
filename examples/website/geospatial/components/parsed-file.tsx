import React, {PureComponent} from 'react';
import styled from 'styled-components';
import PropTypes from 'prop-types';

const ErrorFormatHeader = styled.h1`
  color: red;
  font-size: 16px;
`;

type FileLoaderPropTypes = {
  file: File,
  onFileSelected: Function,
  onFileError?: Function
};

type FileLoaderState = {
  data: any;
  error: string | null;
};

export default class FileLoader extends PureComponent<FileLoaderPropTypes, FileLoaderState> {
  static defaultProps = {
    file: null
  };

  constructor(props) {
    super(props);

    this.state = {
      data: null,
      error: null
    };
  }

  async componentDidMount() {
    const data = await this.getFileDataUrl();
    this.setState({data});
  }

  async getFileDataUrl() {
    const {file, onFileSelected} = this.props;
    try {
      this.setState({error: null});
      await onFileSelected(file);
    } catch (error) {
      console.error(error);
      this.setState({error: error.message});
    }
  }

  render() {
    const {error} = this.state;
    return <ErrorFormatHeader style={{color: 'red'}}>{error}</ErrorFormatHeader>;
  }
}
