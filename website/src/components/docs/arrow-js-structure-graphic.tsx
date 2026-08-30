import React, {type ReactNode} from 'react';

import styles from './arrow-js-structure-graphic.module.css';

const TABLE_ROWS = ['RecordBatch', 'RecordBatch', 'RecordBatch'];
const TABLE_COLUMNS = ['Vector', 'Vector', 'Vector'];
const FIELD_DETAILS = ['name', 'Type', 'nullable', 'metadata'];
const DATA_DETAILS = ['type', 'length', 'nullCount', 'offset'];
const DATA_BUFFERS = ['validity', 'offsets', 'values'];
const DATA_TYPE_DETAILS = ['typeId', 'ArrayType', 'OffsetArrayType'];
const DATA_TYPE_PARAMETERS = ['bitWidth', 'precision', 'unit'];
const VECTOR_DETAILS = ['type', 'length', 'stride'];

/**
 * Renders compact diagrams for the core Arrow JS table and schema object structures.
 */
export function ArrowJsStructureGraphic(): ReactNode {
  return (
    <section className={styles.frame} aria-labelledby="arrow-js-structure-title">
      <header className={styles.header}>
        <p className={styles.eyebrow}>Inside an Arrow table</p>
        <h2 className={styles.title} id="arrow-js-structure-title">
          Tables are columns, batches, and buffers.
        </h2>
        <p className={styles.lead}>
          The JavaScript API exposes the same columnar structure that makes Arrow efficient: a
          schema describes fields, vectors hold typed values, and buffers carry the bytes.
        </p>
      </header>

      <div className={styles.diagramList}>
        <section className={styles.diagramSection}>
          <h3 className={styles.diagramTitle}>Schema</h3>
          <div className={styles.schemaDiagram} aria-label="Schema structure: a schema has metadata and fields, and each field has type, nullable, and metadata">
            <div className={styles.schemaColumn}>
              <div className={`${styles.nestedBlock} ${styles.connectedFieldsLabel}`}>fields</div>
              <div className={styles.nestedBlock}>metadata</div>
            </div>
            <div className={styles.fieldsGrid}>
              {[0, 1, 2].map(fieldIndex => (
                <div className={styles.fieldCard} key={fieldIndex}>
                  <Block variant="field">Field</Block>
                  <div className={styles.fieldDetails}>
                    {FIELD_DETAILS.map(detail => (
                      <div className={styles.fieldDetail} key={detail}>{detail}</div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.diagramSection}>
          <h3 className={styles.diagramTitle}>Table</h3>
          <div className={styles.tableDiagram} aria-label="Table structure: vectors contain data chunks across record batches">
            <div className={styles.gridSpacer} />
            {TABLE_COLUMNS.map((columnLabel, columnIndex) => (
              <div className={styles.vectorCell} key={`${columnLabel}-${columnIndex}`}>
                <Block variant="vector">{columnLabel}</Block>
                <div className={styles.verticalConnector} />
              </div>
            ))}
            {TABLE_ROWS.map((rowLabel, rowIndex) => (
              <React.Fragment key={`${rowLabel}-${rowIndex}`}>
                <Block variant="recordBatch">{rowLabel}</Block>
                {TABLE_COLUMNS.map((columnLabel, columnIndex) => (
                  <div className={styles.connectedDataCell} key={`${rowIndex}-${columnLabel}-${columnIndex}`}>
                    <Block variant="data">Data</Block>
                  </div>
                ))}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className={styles.diagramSection}>
          <h3 className={styles.diagramTitle}>Vector</h3>
          <div className={styles.dataDiagram} aria-label="Vector structure: a vector has type and length metadata plus data chunks">
            <Block variant="vector">Vector</Block>
            <div className={styles.vectorGroups}>
              <div className={styles.dataGroup}>
                {VECTOR_DETAILS.map(detail => (
                  <div className={styles.nestedBlock} key={detail}>{detail}</div>
                ))}
              </div>
              <div className={styles.dataBufferList}>
                <DataGroupTitle variant="data">data</DataGroupTitle>
                <div className={styles.fieldDetail}>Data</div>
                <div className={styles.fieldDetail}>Data</div>
                <div className={styles.fieldDetail}>Data</div>
                <div className={styles.fieldDetail}>...</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.diagramSection}>
          <h3 className={styles.diagramTitle}>Data buffers</h3>
          <div className={styles.dataDiagram} aria-label="Data structure: data has type and row metadata, buffers, and optional child data">
            <Block variant="data">Data</Block>
            <div className={styles.dataGroups}>
              <div className={styles.dataGroup}>
                {DATA_DETAILS.map(detail => (
                  <div className={styles.nestedBlock} key={detail}>{detail}</div>
                ))}
              </div>
              <div className={styles.dataBufferList}>
                <DataGroupTitle variant="buffer">buffers</DataGroupTitle>
                {DATA_BUFFERS.map(buffer => (
                  <div className={styles.fieldDetail} key={buffer}>{buffer}</div>
                ))}
              </div>
              <div className={styles.dataBufferList}>
                <DataGroupTitle variant="childData">childData</DataGroupTitle>
                <div className={styles.fieldDetail}>Data</div>
                <div className={styles.fieldDetail}>Data</div>
                <div className={styles.fieldDetail}>...</div>
              </div>
            </div>
          </div>
        </section>

        <section className={styles.diagramSection}>
          <h3 className={styles.diagramTitle}>Data type</h3>
          <div className={styles.dataDiagram} aria-label="Data type structure: a data type has identifiers, type-specific parameters, and optional child fields">
            <Block variant="dataType">DataType</Block>
            <div className={styles.dataGroups}>
              <div className={styles.dataGroup}>
                {DATA_TYPE_DETAILS.map(detail => (
                  <div className={styles.nestedBlock} key={detail}>{detail}</div>
                ))}
              </div>
              <div className={styles.dataBufferList}>
                <DataGroupTitle variant="parameter">params</DataGroupTitle>
                {DATA_TYPE_PARAMETERS.map(parameter => (
                  <div className={styles.fieldDetail} key={parameter}>{parameter}</div>
                ))}
                <div className={styles.fieldDetail}>...</div>
              </div>
              <div className={styles.dataBufferList}>
                <DataGroupTitle variant="field">children</DataGroupTitle>
                <div className={styles.fieldDetail}>Field</div>
                <div className={styles.fieldDetail}>Field</div>
                <div className={styles.fieldDetail}>Field</div>
                <div className={styles.fieldDetail}>...</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <p className={styles.caption}>
        The application can stay at the table boundary; these lower-level objects matter when
        inspecting schemas, building zero-copy views, or implementing an adapter.
      </p>
    </section>
  );
}

type BlockVariant = 'data' | 'dataType' | 'field' | 'recordBatch' | 'vector';

type BlockProps = {
  /** Color family used to distinguish this diagram block. */
  variant: BlockVariant;
  /** Label displayed in the block. */
  children: ReactNode;
};

/** Renders one color-coded block in the Arrow structure diagram. */
function Block({variant, children}: BlockProps): React.ReactElement {
  return (
    <div className={styles.block} data-variant={variant}>
      {children}
    </div>
  );
}

type DataGroupTitleProps = {
  /** Color family used to identify the nested data group. */
  variant: 'buffer' | 'childData' | 'data' | 'field' | 'parameter';
  /** Label displayed in the group heading. */
  children: ReactNode;
};

/** Renders a labeled nested group in the Arrow data diagram. */
function DataGroupTitle({variant, children}: DataGroupTitleProps): React.ReactElement {
  return (
    <div className={styles.dataGroupTitle} data-variant={variant}>
      {children}
    </div>
  );
}
