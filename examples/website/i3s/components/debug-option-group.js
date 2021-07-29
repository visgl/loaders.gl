import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const OptionGroup = styled.div`
  margin-top: 15px;
  padding: 12px;
  border: 2px solid #212529;
  border-radius: 2px;
  background: rgba( 0, 0, 0, .5);
  color: #adb5bd;
`;

const TitleLabel = styled.div`
  margin-top: -20px;
  margin-left: 10px;
  float: left;
  background: #212529;
  border-radius: 2px;
  font-weight: bold;
  text-transform: none;
  padding: 2px 20px 2px 20px;
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
