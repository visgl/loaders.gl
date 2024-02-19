import React from 'react';
import styled from 'styled-components';

const BG_COLOR = '#232430';

const Container = styled.div`
  display: flex;
  padding: 5px;
  border-radius: 8px;
  flex-direction: column;
  background: ${BG_COLOR};
`;

const TooltipItem = styled.div`
  color: white;
`;

export function HistogramTooltip({active, payload, label, attributeName}) {
  if (active && payload && payload.length) {
    return (
      <Container>
        <TooltipItem>{`Count: ${payload[0].value}`}</TooltipItem>
        <TooltipItem>{`${attributeName}: ${label}`}</TooltipItem>
      </Container>
    );
  }

  return null;
}
