import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleDoubleLeft, faAngleDoubleRight} from '@fortawesome/free-solid-svg-icons';
import DebugOptionGroup from './debug-option-group';

const Container = styled.div`
  position: absolute;
  display: flex;
  flex-direction: row;
  height: calc(100% - 20px);
  overflow-x: hidden;
  margin: 20px 0 0 0;
`;

const DebugOptions = styled.div`
  width: 300px;
  min-width: 300px;
  height: calc(100% - 20px);
  overflow: auto;
  background: #fff;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  padding: 12px 18px;
  margin: 0 0px 20px 20px;
  line-height: 2;
  outline: none;
  z-index: 100;
  box-sizing: border-box;
`;

const Header = styled.h3`
  margin: 0;
`;

const Expander = styled.div`
  top: calc(50% - 54px);
  width: 14px;
  padding: 10px 0px 10px 1px;
  background: #fff;
  z-index: 1;
  align-self: center;
  margin: 0 2px;
`;

const CheckboxOption = styled.div`
  display: flex;
  width: 100%;
`;

const InputCheckbox = styled.input`
  height: 18px;
`;

const ChildWrapper = styled.div`
  margin-top: 10px;
`;

const propTypes = {
  children: PropTypes.object,
  onOptionsChange: PropTypes.func
};

const defaultProps = {};

export default class DebugPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expand: true,
      minimap: true
    };

    this.toggleDebugPanel = this.toggleDebugPanel.bind(this);
    this.toggleMinimap = this.toggleMinimap.bind(this);
  }

  toggleDebugPanel() {
    const {expand} = this.state;
    this.setState({expand: !expand});
  }

  toggleMinimap() {
    const {minimap} = this.state;
    this.setState({minimap: !minimap}, () => {
      this.applyOptions();
    });
  }

  applyOptions() {
    const {minimap} = this.state;
    const {onOptionsChange} = this.props;
    onOptionsChange({minimap});
  }

  getExpandStyles() {
    const {expand} = this.state;
    if (expand) {
      return {
        marginLeft: '20px',
        transition: 'margin-left 800ms'
      };
    }
    return {
      marginLeft: '-300px',
      transition: 'margin-left 800ms'
    };
  }

  renderExpandIcon() {
    const {expand} = this.state;
    if (expand) {
      return <FontAwesomeIcon icon={faAngleDoubleLeft} />;
    }
    return <FontAwesomeIcon icon={faAngleDoubleRight} />;
  }

  render() {
    const {children} = this.props;
    const {minimap} = this.state;
    return (
      <Container className="debug-panel">
        <DebugOptions style={this.getExpandStyles()}>
          <Header>Debug Panel</Header>
          <DebugOptionGroup title="Frustum Culling">
            <CheckboxOption>
              <InputCheckbox
                onChange={this.toggleMinimap}
                type="checkbox"
                id="showFrustumCullingMinimap"
                value={minimap}
                checked={minimap}
              />
              <label htmlFor="showFrustumCullingMinimap">Show</label>
            </CheckboxOption>
          </DebugOptionGroup>
          <ChildWrapper>{children}</ChildWrapper>
        </DebugOptions>
        <Expander onClick={this.toggleDebugPanel}>{this.renderExpandIcon()}</Expander>
      </Container>
    );
  }
}

DebugPanel.propTypes = propTypes;
DebugPanel.defaultProps = defaultProps;
