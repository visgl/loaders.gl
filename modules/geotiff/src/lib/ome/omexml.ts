import parser from 'fast-xml-parser';
import {ensureArray, intToRgba} from '../utils/tiff-utils';

// WARNING: Changes to the parser options _will_ effect the types in types/omexml.d.ts.
const PARSER_OPTIONS = {
  // Nests attributes withtout prefix under 'attr' key for each node
  attributeNamePrefix: '',
  attrNodeName: 'attr',

  // Parses numbers for both attributes and nodes
  parseNodeValue: true,
  parseAttributeValue: true,

  // Forces attributes to be parsed
  ignoreAttributes: false
};

const parse = (str: string): Root => parser.parse(str, PARSER_OPTIONS);

export function fromString(str: string) {
  const res = parse(str);
  if (!res.OME) {
    throw Error('Failed to parse OME-XML metadata.');
  }
  return ensureArray(res.OME.Image).map((img) => {
    const Channels = ensureArray(img.Pixels.Channel).map((c) => {
      if ('Color' in c.attr) {
        return {...c.attr, Color: intToRgba(c.attr.Color)};
      }
      return {...c.attr};
    });
    const {AquisitionDate = '', Description = ''} = img;
    const image = {
      ...img.attr,
      AquisitionDate,
      Description,
      Pixels: {
        ...img.Pixels.attr,
        Channels
      }
    };
    return {
      ...image,
      format() {
        const {Pixels} = image;

        const sizes = (['X', 'Y', 'Z'] as const)
          .map((name) => {
            const size = Pixels[`PhysicalSize${name}` as const];
            const unit = Pixels[`PhysicalSize${name}Unit` as const];
            return size && unit ? `${size} ${unit}` : '-';
          })
          .join(' x ');

        return {
          'Acquisition Date': image.AquisitionDate,
          'Dimensions (XY)': `${Pixels.SizeX} x ${Pixels.SizeY}`,
          'Pixels Type': Pixels.Type,
          'Pixels Size (XYZ)': sizes,
          'Z-sections/Timepoints': `${Pixels.SizeZ} x ${Pixels.SizeT}`,
          Channels: Pixels.SizeC
        };
      }
    };
  });
}

export type OMEXML = ReturnType<typeof fromString>;
export type DimensionOrder = 'XYZCT' | 'XYZTC' | 'XYCTZ' | 'XYCZT' | 'XYTCZ' | 'XYTZC';

// Structure of node is determined by the PARSER_OPTIONS.
type Node<T, A> = T & {attr: A};
type Attrs<Fields extends string, T = string> = {[K in Fields]: T};

type OMEAttrs = Attrs<'xmlns' | 'xmlns:xsi' | 'xsi:schemaLocation'>;
type OME = Node<{Insturment: Insturment; Image: Image | Image[]}, OMEAttrs>;

type Insturment = Node<
  {Objective: Node<{}, Attrs<'ID' | 'Model' | 'NominalMagnification'>>},
  Attrs<'ID'>
>;

interface ImageNodes {
  AquisitionDate?: string;
  Description?: string;
  Pixels: Pixels;
  InstrumentRef: Node<{}, {ID: string}>;
  ObjectiveSettings: Node<{}, {ID: string}>;
}
type Image = Node<ImageNodes, Attrs<'ID' | 'Name'>>;

type PixelType =
  | 'int8'
  | 'int16'
  | 'int32'
  | 'uint8'
  | 'uint16'
  | 'uint32'
  | 'float'
  | 'bit'
  | 'double'
  | 'complex'
  | 'double-complex';

export type UnitsLength =
  | 'Ym'
  | 'Zm'
  | 'Em'
  | 'Pm'
  | 'Tm'
  | 'Gm'
  | 'Mm'
  | 'km'
  | 'hm'
  | 'dam'
  | 'm'
  | 'dm'
  | 'cm'
  | 'mm'
  | 'µm'
  | 'nm'
  | 'pm'
  | 'fm'
  | 'am'
  | 'zm'
  | 'ym'
  | 'Å'
  | 'thou'
  | 'li'
  | 'in'
  | 'ft'
  | 'yd'
  | 'mi'
  | 'ua'
  | 'ly'
  | 'pc'
  | 'pt'
  | 'pixel'
  | 'reference frame';

type PhysicalSize<Name extends string> = `PhysicalSize${Name}`;
type PhysicalSizeUnit<Name extends string> = `PhysicalSize${Name}Unit`;
type Size<Names extends string> = `Size${Names}`;

type PixelAttrs = Attrs<
  PhysicalSize<'X' | 'Y' | 'Z'> | 'SignificantBits' | Size<'T' | 'C' | 'Z' | 'Y' | 'X'>,
  number
> &
  Attrs<PhysicalSizeUnit<'X' | 'Y' | 'Z'>, UnitsLength> &
  Attrs<'BigEndian' | 'Interleaved', boolean> & {
    ID: string;
    DimensionOrder: DimensionOrder;
    Type: PixelType;
  };

type Pixels = Node<
  {
    Channel: Channel | Channel[];
    TiffData: Node<{}, Attrs<'IFD' | 'PlaneCount'>>;
  },
  PixelAttrs
>;

type ChannelAttrs =
  | {
      ID: string;
      SamplesPerPixel: number;
      Name?: string;
    }
  | {
      ID: string;
      SamplesPerPixel: number;
      Name?: string;
      Color: number;
    };

type Channel = Node<{}, ChannelAttrs>;

type Root = {OME: OME};
