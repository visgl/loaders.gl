import test from 'tape-promise/tape';
import {AttributeMetadataInfo} from '../../../src/i3s-converter/helpers/attribute-metadata-info';

test('tile-converter(i3s)#createPopupInfo - Should create popup info', async (t) => {
  const attributeNames = ['OBJECTID', 'color', 'name', 'opt_uint8'];

  const popupInfoExpected = {
    title: '{OBJECTID}',
    mediaInfos: [],
    popupElements: [
      {
        fieldInfos: [
          {
            fieldName: 'OBJECTID',
            visible: true,
            isEditable: false,
            label: 'OBJECTID'
          },
          {
            fieldName: 'color',
            visible: true,
            isEditable: false,
            label: 'color'
          },
          {
            fieldName: 'name',
            visible: true,
            isEditable: false,
            label: 'name'
          },
          {
            fieldName: 'opt_uint8',
            visible: true,
            isEditable: false,
            label: 'opt_uint8'
          }
        ],
        type: 'fields'
      }
    ],
    fieldInfos: [
      {
        fieldName: 'OBJECTID',
        visible: true,
        isEditable: false,
        label: 'OBJECTID'
      },
      {
        fieldName: 'color',
        visible: true,
        isEditable: false,
        label: 'color'
      },
      {
        fieldName: 'name',
        visible: true,
        isEditable: false,
        label: 'name'
      },
      {
        fieldName: 'opt_uint8',
        visible: true,
        isEditable: false,
        label: 'opt_uint8'
      }
    ],
    expressionInfos: []
  };

  const attributeMetadataInfo: AttributeMetadataInfo = new AttributeMetadataInfo();
  // @ts-expect-error
  // Calling a private method
  const popupInfo = attributeMetadataInfo.createPopupInfo(attributeNames);
  t.deepEqual(popupInfo, popupInfoExpected, 'popupInfo');
});

test('tile-converter(i3s)#createStorageAttributes - Should create Attribute storage info', async (t) => {
  /* eslint-disable camelcase */
  const attributeTypesMap1 = {
    color: 'string',
    name: 'string',
    opt_uint8: 'Int32'
  };

  const attributeTypesMap2 = {
    // The same attributes as in #1
    color: 'string',
    name: 'string',
    opt_uint8: 'Int32',
    // New attributes
    opt_uint64: 'string',
    opt_float32: 'double',
    opt_enum: 'string'
  };
  /* eslint-enable camelcase */

  const attributeTypesMap3 = {};

  const attributeStorageInfoExpected1 = [
    {
      key: 'f_0',
      name: 'OBJECTID',
      ordering: ['attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'Oid32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_1',
      name: 'color',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_2',
      name: 'name',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_3',
      name: 'opt_uint8',
      ordering: ['attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'Int32',
        valuesPerElement: 1
      }
    }
  ];

  const fieldsExpected1 = [
    {
      name: 'OBJECTID',
      type: 'esriFieldTypeOID',
      alias: 'OBJECTID'
    },
    {
      name: 'color',
      type: 'esriFieldTypeString',
      alias: 'color'
    },
    {
      name: 'name',
      type: 'esriFieldTypeString',
      alias: 'name'
    },
    {
      name: 'opt_uint8',
      type: 'esriFieldTypeInteger',
      alias: 'opt_uint8'
    }
  ];

  const popupInfoExpected1 = {
    title: '{OBJECTID}',
    mediaInfos: [],
    popupElements: [
      {
        fieldInfos: [
          {
            fieldName: 'OBJECTID',
            visible: true,
            isEditable: false,
            label: 'OBJECTID'
          },
          {
            fieldName: 'color',
            visible: true,
            isEditable: false,
            label: 'color'
          },
          {
            fieldName: 'name',
            visible: true,
            isEditable: false,
            label: 'name'
          },
          {
            fieldName: 'opt_uint8',
            visible: true,
            isEditable: false,
            label: 'opt_uint8'
          }
        ],
        type: 'fields'
      }
    ],
    fieldInfos: [
      {
        fieldName: 'OBJECTID',
        visible: true,
        isEditable: false,
        label: 'OBJECTID'
      },
      {
        fieldName: 'color',
        visible: true,
        isEditable: false,
        label: 'color'
      },
      {
        fieldName: 'name',
        visible: true,
        isEditable: false,
        label: 'name'
      },
      {
        fieldName: 'opt_uint8',
        visible: true,
        isEditable: false,
        label: 'opt_uint8'
      }
    ],
    expressionInfos: []
  };
  // ////////////////////////
  const attributeStorageInfoExpected2 = [
    {
      key: 'f_0',
      name: 'OBJECTID',
      ordering: ['attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'Oid32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_1',
      name: 'color',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_2',
      name: 'name',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_3',
      name: 'opt_uint8',
      ordering: ['attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'Int32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_4',
      name: 'opt_uint64',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_5',
      name: 'opt_float32',
      ordering: ['attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'Float64',
        valuesPerElement: 1
      }
    },
    {
      key: 'f_6',
      name: 'opt_enum',
      ordering: ['attributeByteCounts', 'attributeValues'],
      header: [
        {
          property: 'count',
          valueType: 'UInt32'
        },
        {
          property: 'attributeValuesByteCount',
          valueType: 'UInt32'
        }
      ],
      attributeValues: {
        valueType: 'String',
        encoding: 'UTF-8',
        valuesPerElement: 1
      },
      attributeByteCounts: {
        valueType: 'UInt32',
        valuesPerElement: 1
      }
    }
  ];

  const fieldsExpected2 = [
    {
      name: 'OBJECTID',
      type: 'esriFieldTypeOID',
      alias: 'OBJECTID'
    },
    {
      name: 'color',
      type: 'esriFieldTypeString',
      alias: 'color'
    },
    {
      name: 'name',
      type: 'esriFieldTypeString',
      alias: 'name'
    },
    {
      name: 'opt_uint8',
      type: 'esriFieldTypeInteger',
      alias: 'opt_uint8'
    },
    {
      name: 'opt_uint64',
      type: 'esriFieldTypeString',
      alias: 'opt_uint64'
    },
    {
      name: 'opt_float32',
      type: 'esriFieldTypeDouble',
      alias: 'opt_float32'
    },
    {
      name: 'opt_enum',
      type: 'esriFieldTypeString',
      alias: 'opt_enum'
    }
  ];

  const popupInfoExpected2 = {
    title: '{OBJECTID}',
    mediaInfos: [],
    popupElements: [
      {
        fieldInfos: [
          {
            fieldName: 'OBJECTID',
            visible: true,
            isEditable: false,
            label: 'OBJECTID'
          },
          {
            fieldName: 'color',
            visible: true,
            isEditable: false,
            label: 'color'
          },
          {
            fieldName: 'name',
            visible: true,
            isEditable: false,
            label: 'name'
          },
          {
            fieldName: 'opt_uint8',
            visible: true,
            isEditable: false,
            label: 'opt_uint8'
          },
          {
            fieldName: 'opt_uint64',
            visible: true,
            isEditable: false,
            label: 'opt_uint64'
          },
          {
            fieldName: 'opt_float32',
            visible: true,
            isEditable: false,
            label: 'opt_float32'
          },
          {
            fieldName: 'opt_enum',
            visible: true,
            isEditable: false,
            label: 'opt_enum'
          }
        ],
        type: 'fields'
      }
    ],
    fieldInfos: [
      {
        fieldName: 'OBJECTID',
        visible: true,
        isEditable: false,
        label: 'OBJECTID'
      },
      {
        fieldName: 'color',
        visible: true,
        isEditable: false,
        label: 'color'
      },
      {
        fieldName: 'name',
        visible: true,
        isEditable: false,
        label: 'name'
      },
      {
        fieldName: 'opt_uint8',
        visible: true,
        isEditable: false,
        label: 'opt_uint8'
      },
      {
        fieldName: 'opt_uint64',
        visible: true,
        isEditable: false,
        label: 'opt_uint64'
      },
      {
        fieldName: 'opt_float32',
        visible: true,
        isEditable: false,
        label: 'opt_float32'
      },
      {
        fieldName: 'opt_enum',
        visible: true,
        isEditable: false,
        label: 'opt_enum'
      }
    ],
    expressionInfos: []
  };

  const attributeMetadataInfo: AttributeMetadataInfo = new AttributeMetadataInfo();
  attributeMetadataInfo.addMetadataInfo(attributeTypesMap1);

  t.deepEqual(
    attributeMetadataInfo.attributeStorageInfo,
    attributeStorageInfoExpected1,
    'attributeStorageInfo #1'
  );
  t.deepEqual(attributeMetadataInfo.fields, fieldsExpected1, 'fields #1');
  t.deepEqual(attributeMetadataInfo.popupInfo, popupInfoExpected1, 'popupInfo #1');

  attributeMetadataInfo.addMetadataInfo(attributeTypesMap2);

  t.deepEqual(
    attributeMetadataInfo.attributeStorageInfo,
    attributeStorageInfoExpected2,
    'attributeStorageInfo #2'
  );
  t.deepEqual(attributeMetadataInfo.fields, fieldsExpected2, 'fields #2');
  t.deepEqual(attributeMetadataInfo.popupInfo, popupInfoExpected2, 'popupInfo #2');

  attributeMetadataInfo.addMetadataInfo(attributeTypesMap3);
  // The result should be the same as for #2
  t.deepEqual(
    attributeMetadataInfo.attributeStorageInfo,
    attributeStorageInfoExpected2,
    'attributeStorageInfo #3'
  );
  t.deepEqual(attributeMetadataInfo.fields, fieldsExpected2, 'fields #3');
  t.deepEqual(attributeMetadataInfo.popupInfo, popupInfoExpected2, 'popupInfo #3');
});
