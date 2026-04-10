import Color from '@deck.gl/core';

export type ColorsByAttribute = {
  attributeName: string;
  minValue: number;
  maxValue: number;
  minColor: Color;
  maxColor: Color;
  mode: string;
};

export type AttributeData = {
  name?: string;
  min: number;
  max: number;
};
