import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {Color, Font} from './styles';

const OptionGroup = styled.div`
  ${Color}
  ${Font}
  line-height: 19px;
  marign-top: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.2);
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
    return <OptionGroup>{children}</OptionGroup>;
  }
}

DebugOptionGroup.propTypes = propTypes;
DebugOptionGroup.defaultProps = defaultProps;
