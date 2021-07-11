import React, {PureComponent} from 'react';
import PropTypes from 'prop-types';

const TH_STYLE = {
  textAlign: 'left'
};

const TOOLTIP_STYLE = {
  color: '#fff'
};
const NO_DATA = 'No Data';

const propTypes = {
  data: PropTypes.object
};

const defaultProps = {
  data: {}
};

export default class AttributesTooltip extends PureComponent {
  prepareRows() {
    const {data} = this.props;
    const rows = [];

    for (const key in data) {
      const row = (
        <tr key={key}>
          <th style={TH_STYLE}>{key}</th>
          <td>{this.formatTooltipValue(data[key])}</td>
        </tr>
      );

      rows.push(row);
    }
    return rows;
  }

  formatTooltipValue(value) {
    return (
      value
        .toString()
        .replace(/[{}']+/g, '')
        .trim() || NO_DATA
    );
  }

  render() {
    const rows = this.prepareRows();

    return rows.length ? (
      <div style={TOOLTIP_STYLE}>
        <table>
          <tbody>{rows}</tbody>
        </table>
      </div>
    ) : null;
  }
}

AttributesTooltip.propTypes = propTypes;
AttributesTooltip.defaultProps = defaultProps;
