import React from 'react';
import styled, {css} from 'styled-components';
import {CollapseDirection, ExpandState} from '../../types';
import {SyntheticEvent} from 'react';
import ChevronIcon from '../../icons/chevron.svg?react';

const IconButton = styled.div<{
  expandState: ExpandState;
  collapseDirection: CollapseDirection;
  fillExpanded?: string;
  fillCollapsed?: string;
}>`
  transform: rotate(
    ${({expandState, collapseDirection}) => {
      if (collapseDirection === CollapseDirection.bottom) {
        return `${expandState === ExpandState.expanded ? '-' : ''}90deg`;
      }
      return `${expandState === ExpandState.expanded ? '' : '-'}90deg`;
    }}
  );
  width: 24px;
  height: 24px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  ${({expandState, fillExpanded, fillCollapsed}) => {
    if (expandState === ExpandState.expanded) {
      if (fillExpanded) {
        return css`
          fill: ${fillExpanded};
        `;
      }
    } else {
      if (fillCollapsed) {
        return css`
          fill: ${fillCollapsed};
        `;
      }
    }
    return css`
      fill: white;
    `;
  }}

  &:hover {
    opacity: 0.8;
  }
`;

type ExpandIconProps = {
  /** expanded/collapsed */
  expandState: ExpandState;
  /** direction expander collapse to */
  collapseDirection?: CollapseDirection;
  /** icon color for expanded state */
  fillExpanded?: string;
  /** icon color for collapsed state */
  fillCollapsed?: string;
  /** click event handler */
  onClick: (e: SyntheticEvent) => void;
};
export function ExpandIcon({
  expandState,
  onClick,
  fillExpanded,
  fillCollapsed,
  collapseDirection = CollapseDirection.top
}: ExpandIconProps) {
  return (
    <IconButton
      expandState={expandState}
      collapseDirection={collapseDirection}
      fillExpanded={fillExpanded}
      fillCollapsed={fillCollapsed}
      onClick={onClick}
    >
      <ChevronIcon />
    </IconButton>
  );
}
