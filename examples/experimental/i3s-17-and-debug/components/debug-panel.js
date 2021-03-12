import styled from 'styled-components';
import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import {faAngleDoubleLeft, faAngleDoubleRight} from '@fortawesome/free-solid-svg-icons';
import DebugOptionGroup from './debug-option-group';
import './debug-panel.css';

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

const propTypes = {
  children: PropTypes.object,
  onOptionsChange: PropTypes.func
};

const defaultProps = {};

export default class DebugPanel extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      expandClass: '',
      showStatistics: true,
      showFrustumCullingMinimap: true
    };

    this.toggleDebugPanel = this.toggleDebugPanel.bind(this);
    this.toggleStatistics = this.toggleStatistics.bind(this);
    this.toggleFrustumCullingMinimap = this.toggleFrustumCullingMinimap.bind(this);
  }

  toggleDebugPanel() {
    const {expandClass} = this.state;
    if (expandClass === 'collapse') {
      this.setState({expandClass: 'expand'});
    } else {
      this.setState({expandClass: 'collapse'});
    }
  }

  toggleStatistics() {
    const {showStatistics} = this.state;
    this.setState({showStatistics: !showStatistics}, () => {
      this.applyOptions();
    });
  }

  toggleFrustumCullingMinimap() {
    const {showFrustumCullingMinimap} = this.state;
    this.setState({showFrustumCullingMinimap: !showFrustumCullingMinimap}, () => {
      this.applyOptions();
    });
  }

  applyOptions() {
    const {showStatistics, showFrustumCullingMinimap} = this.state;
    const {onOptionsChange} = this.props;
    onOptionsChange({showStatistics, showFrustumCullingMinimap});
  }

  renderExpandIcon() {
    const {expandClass} = this.state;
    if (expandClass === 'collapse') {
      return <FontAwesomeIcon icon={faAngleDoubleRight} />;
    }
    return <FontAwesomeIcon icon={faAngleDoubleLeft} />;
  }

  render() {
    const {children} = this.props;
    const {expandClass, showStatistics, showFrustumCullingMinimap} = this.state;
    return (
      <Container className="debug-panel">
        <DebugOptions className={expandClass}>
          <Header>Debug Options</Header>
          <DebugOptionGroup title="Statistics">
            <CheckboxOption>
              <InputCheckbox
                onChange={this.toggleStatistics}
                type="checkbox"
                id="showStatistics"
                value={showStatistics}
                checked={showStatistics}
              />
              <label htmlFor="showStatistics">Show</label>
            </CheckboxOption>
          </DebugOptionGroup>
          <DebugOptionGroup title="Frustum Culling">
            <CheckboxOption>
              <InputCheckbox
                onChange={this.toggleFrustumCullingMinimap}
                type="checkbox"
                id="showFrustumCullingMinimap"
                value={showFrustumCullingMinimap}
                checked={showFrustumCullingMinimap}
              />
              <label htmlFor="showFrustumCullingMinimap">Show</label>
            </CheckboxOption>
          </DebugOptionGroup>
        </DebugOptions>
        <Expander onClick={this.toggleDebugPanel}>{this.renderExpandIcon()}</Expander>
        {children}
      </Container>
    );
  }
}

DebugPanel.propTypes = propTypes;
DebugPanel.defaultProps = defaultProps;
