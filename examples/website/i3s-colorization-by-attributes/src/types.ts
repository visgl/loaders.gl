export type FeatureAttributes = {
  [key: string]: string;
};

export type COLOR = [number, number, number, number];

export type ColorsByAttribute = {
  attributeName: string;
  minValue: number;
  maxValue: number;
  minColor: COLOR;
  maxColor: COLOR;
  mode: string;
};

export enum ArrowDirection {
  left = 'left',
  right = 'right'
}

export enum CollapseDirection {
  top,
  bottom,
  left,
  right
}

export enum ExpandState {
  expanded = 'expanded',
  collapsed = 'collapsed'
}
