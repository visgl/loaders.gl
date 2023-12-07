import React, {PureComponent} from 'react';
import styled from 'styled-components';
import {ParsedFile} from './parsed-file';

const Container = styled.div`
  display: flex;
  flex-flow: column nowrap;
`;

const FileFrame = styled.div`
  display: flex;
  width: 256px;
  height: 20px;
  align-items: center;
  justify-content: center;
  border: 1px dashed black;
`;

const FileContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  align-items: center;
  width: 270px;
`;

type FileUploaderProps = {
  onFileRemoved: Function,
  onFileSelected: Function
};

type FileUploaderState = {
  uploadedFile: File | null;
}

export class FileUploader extends PureComponent<FileUploaderProps, FileUploaderState> {
  constructor(props) {
    super(props);

    this.state = {
      uploadedFile: null
    };

    this.handleLoadFile = this.handleLoadFile.bind(this);
    this.handleCleanFile = this.handleCleanFile.bind(this);
  }

  handleLoadFile(event) {
    const file = event.dataTransfer.files[0];
    this.setState({uploadedFile: file});
    event.preventDefault();
  }

  handleCleanFile() {
    const {onFileRemoved} = this.props;
    onFileRemoved();
    this.setState({uploadedFile: null});
  }

  render() {
    const {onFileSelected} = this.props;
    const {uploadedFile} = this.state;

    return (
      <div>
        {!uploadedFile && (
          <Container>
            <FileFrame onDrop={this.handleLoadFile} onDragOver={(event) => event.preventDefault()}>
              Drag&Drop file
            </FileFrame>
          </Container>
        )}
        <FileContainer>
          {uploadedFile && <ParsedFile file={uploadedFile} onFileSelected={onFileSelected} />}
          {uploadedFile && <button onClick={this.handleCleanFile}>Clean</button>}
        </FileContainer>
      </div>
    );
  }
}
