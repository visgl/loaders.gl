import ColumnType from './ColumnType'

export default class ColumnMeta {
  public name: string
  public type: ColumnType
  constructor(name: string, type: ColumnType);
}
