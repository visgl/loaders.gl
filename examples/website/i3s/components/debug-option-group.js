import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Color, Flex, Font} from './styles';

const OptionGroup = styled.div`
  ${Color}
  ${Font}
  line-height: 19px;
  border-bottom: 1px solid rgba(255, 255, 255, .2);
`;

const TitleLabel = styled.div`
  font-weight: bold;
  color: rgba(250, 250, 250, 0.6);
  padding-top: 15px;
`;

const propTypes = {
  children: PropTypes.node,
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
