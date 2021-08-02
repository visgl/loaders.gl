import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const OptionGroup = styled.div`
  background: rgba(36, 39, 48, 0.5);
  margin-top: 5px;
  padding: 12px;
  border-radius: 2px;
  color: #adb5bd;
`;

const TitleLabel = styled.div`
  margin-bottom: 5px;
  width: 80%;
  left: 0;
  text-align: left;
  font-weight: bold;
  text-transform: none;
  color: #f2e9e4;
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
