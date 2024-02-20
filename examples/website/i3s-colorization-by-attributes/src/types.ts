export type COLOR = [number, number, number, number];

export type ColorsByAttribute = {
  attributeName: string;
  minValue: number;
  maxValue: number;
  minColor: COLOR;
  maxColor: COLOR;
  mode: string;
};

export type AttributeData = {
  name?: string;
  min: number;
  max: number;
};
