import type {Histogram} from '@loaders.gl/i3s';

import React, {useMemo} from 'react';
import styled from 'styled-components';
import {AreaChart, Area, CartesianGrid, Tooltip, ResponsiveContainer, XAxis, YAxis} from 'recharts';
import {HistogramTooltip} from './histogram-tooltip';

const ChartContainer = styled.div`
  height: 176px;

  svg {
    border-radius: 20px;
  }
`;

type HistrogramProps = {
  attributeName: string;
  histogramData: Histogram;
};

export function HistogramChart({histogramData, attributeName}: HistrogramProps) {
  const prepareChartData = (): {count: number}[] => {
    const data: {xAxisData: number; count: number}[] = [];
    let min = histogramData.minimum;
    const binSize = (histogramData.maximum - histogramData.minimum) / histogramData.counts.length;
    for (const count of histogramData.counts) {
      data.push({
        xAxisData: Math.floor(min),
        count
      });

      min += binSize;
    }

    return data;
  };

  const data = useMemo(() => prepareChartData(), [histogramData]);

  return (
    <ChartContainer>
      <ResponsiveContainer>
        <AreaChart data={data}>
          <CartesianGrid vertical={false} fill={'#232430'} strokeDasharray="2" stroke={'#9EA2AE'} />
          <XAxis dataKey={'xAxisData'} hide />
          <YAxis hide />
          <Tooltip
            content={(props) => <HistogramTooltip attributeName={attributeName} {...props} />}
          />
          <Area
            type="monotone"
            dataKey="count"
            stroke={'#60C2A4'}
            fill={'#60C2A4'}
            fillOpacity="1"
          />
        </AreaChart>
      </ResponsiveContainer>
    </ChartContainer>
  );
}
