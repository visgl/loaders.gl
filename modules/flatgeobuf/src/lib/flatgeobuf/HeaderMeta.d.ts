import ColumnMeta from './ColumnMeta'
import { GeometryType } from './header_generated'

export default class HeaderMeta {
	public geometryType: GeometryType
	public columns: ColumnMeta[]
	public featuresCount: number
	constructor(geometryType: GeometryType, columns: ColumnMeta[], featuresCount: number);
}
