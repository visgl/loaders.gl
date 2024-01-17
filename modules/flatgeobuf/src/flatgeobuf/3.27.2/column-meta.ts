import {ColumnType} from './flat-geobuf/column-type';

export default interface ColumnMeta {
  name: string;
  type: ColumnType;
  title: string | null;
  description: string | null;
  width: number;
  precision: number;
  scale: number;
  nullable: boolean;
  unique: boolean;
  primary_key: boolean;
}
