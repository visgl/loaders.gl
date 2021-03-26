import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const OptionGroup = styled.div`
  margin-top: 12px;
  padding-top: 12px;
  border: solid 1px black;
`;

const TitleLabel = styled.div`
  margin-top: -24px;
  margin-left: 10px;
  background: #fff;
  float: left;
`;

const propTypes = {
  children: PropTypes.any,
  title: PropTypes.string
};

const defaultProps = {};

export default class DebugOptionGroup extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }
  render() {
    const {children, title} = this.props;
    return (
      <OptionGroup>
        <TitleLabel>{title}</TitleLabel>
        {children}
      </OptionGroup>
    );
  }
}

DebugOptionGroup.propTypes = propTypes;
DebugOptionGroup.defaultProps = defaultProps;
