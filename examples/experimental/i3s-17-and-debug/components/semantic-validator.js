import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

const SemanticValidatorContainer = styled.div`
  display: flex;
  flex-flow: column nowrap;
  width: 100%;
`;
const ValidatorItem = styled.div`
  display: flex;
  flex-flow: column nowrap;
  margin-left: 3px;
`;

const ValidatorTitle = styled.h4`
  margin: 0;
`;

const ValidatorList = styled.div`
  max-height: 50px;
  overflow-y: auto;
  display: flex;
  flex-flow: column nowrap;
`;

const WarningItem = styled.div`
  margin-left: 5px;
  color: red;
`;
const NoIssuesItem = styled.div`
  margin-left: 5px;
  color: green;
`;

const propTypes = {
  boundingVolumeWarnings: PropTypes.array,
  maxScreenTresholdsWarnings: PropTypes.array,
  geometricAndTexturesWarnings: PropTypes.array
};

const defaultProps = {
  boundingVolumeWarnings: [],
  maxScreenTresholdsWarnings: [],
  geometricAndTexturesWarnings: []
};

const NO_ISSUES = 'No Issues';
const BOUNDING_VOLUMES_WARNINGS = 'Bounding Volumes';
const MAX_SCREEN_TRESHOLDS_WARNINGS = 'Max Screen Tresholds';
const GEOMETRIC_TEXTURES_WARNINGS = 'Geometric and Textures';

export default class SemanticValidator extends PureComponent {
  renderWarningItem(warnings) {
    const warnList = warnings
      ? warnings.map(warning => <WarningItem key={warning}>{warning}</WarningItem>)
      : [];

    return (
      <ValidatorList>
        {warnList.length ? warnList : <NoIssuesItem>{NO_ISSUES}</NoIssuesItem>}
      </ValidatorList>
    );
  }

  render() {
    const {
      boundingVolumeWarnings,
      maxScreenTresholdsWarnings,
      geometricAndTexturesWarnings
    } = this.props;

    return (
      <SemanticValidatorContainer>
        <ValidatorItem>
          <ValidatorTitle>{BOUNDING_VOLUMES_WARNINGS}</ValidatorTitle>
          {this.renderWarningItem(boundingVolumeWarnings)}
        </ValidatorItem>
        <ValidatorItem>
          <ValidatorTitle>{MAX_SCREEN_TRESHOLDS_WARNINGS}</ValidatorTitle>
          {this.renderWarningItem(maxScreenTresholdsWarnings)}
        </ValidatorItem>
        <ValidatorItem>
          <ValidatorTitle>{GEOMETRIC_TEXTURES_WARNINGS}</ValidatorTitle>
          {this.renderWarningItem(geometricAndTexturesWarnings)}
        </ValidatorItem>
      </SemanticValidatorContainer>
    );
  }
}

SemanticValidator.propTypes = propTypes;
SemanticValidator.defaultProps = defaultProps;
