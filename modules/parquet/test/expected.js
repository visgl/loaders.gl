/* eslint-disable camelcase */

export const ALL_TYPES_DICTIONARY_EXPECTED = [
  {
    bigint_col: '0',
    bool_col: true,
    date_string_col: '01/01/09',
    double_col: '0',
    float_col: '0',
    id: '0',
    int_col: '0',
    smallint_col: '0',
    string_col: '0',
    timestamp_col: '0',
    tinyint_col: '0'
  },
  {
    bigint_col: '10',
    bool_col: false,
    date_string_col: '01/01/09',
    double_col: '10.1',
    float_col: '1.100000023841858',
    id: '1',
    int_col: '1',
    smallint_col: '1',
    string_col: '1',
    timestamp_col: '60000000000',
    tinyint_col: '1'
  }
];

export const ALL_TYPES_PLAIN_EXPECTED = [
  {
    bigint_col: '0',
    bool_col: true,
    date_string_col: '03/01/09',
    double_col: '0',
    float_col: '0',
    id: '4',
    int_col: '0',
    smallint_col: '0',
    string_col: '0',
    timestamp_col: '0',
    tinyint_col: '0'
  },
  {
    bigint_col: '10',
    bool_col: false,
    date_string_col: '03/01/09',
    double_col: '10.1',
    float_col: '1.100000023841858',
    id: '5',
    int_col: '1',
    smallint_col: '1',
    string_col: '1',
    timestamp_col: '60000000000',
    tinyint_col: '1'
  },
  {
    bigint_col: '0',
    bool_col: true,
    date_string_col: '04/01/09',
    double_col: '0',
    float_col: '0',
    id: '6',
    int_col: '0',
    smallint_col: '0',
    string_col: '0',
    timestamp_col: '0',
    tinyint_col: '0'
  },
  {
    bigint_col: '10',
    bool_col: false,
    date_string_col: '04/01/09',
    double_col: '10.1',
    float_col: '1.100000023841858',
    id: '7',
    int_col: '1',
    smallint_col: '1',
    string_col: '1',
    timestamp_col: '60000000000',
    tinyint_col: '1'
  },
  {
    bigint_col: '0',
    bool_col: true,
    date_string_col: '02/01/09',
    double_col: '0',
    float_col: '0',
    id: '2',
    int_col: '0',
    smallint_col: '0',
    string_col: '0',
    timestamp_col: '0',
    tinyint_col: '0'
  },
  {
    bigint_col: '10',
    bool_col: false,
    date_string_col: '02/01/09',
    double_col: '10.1',
    float_col: '1.100000023841858',
    id: '3',
    int_col: '1',
    smallint_col: '1',
    string_col: '1',
    timestamp_col: '60000000000',
    tinyint_col: '1'
  },
  {
    bigint_col: '0',
    bool_col: true,
    date_string_col: '01/01/09',
    double_col: '0',
    float_col: '0',
    id: '0',
    int_col: '0',
    smallint_col: '0',
    string_col: '0',
    timestamp_col: '0',
    tinyint_col: '0'
  },
  {
    bigint_col: '10',
    bool_col: false,
    date_string_col: '01/01/09',
    double_col: '10.1',
    float_col: '1.100000023841858',
    id: '1',
    int_col: '1',
    smallint_col: '1',
    string_col: '1',
    timestamp_col: '60000000000',
    tinyint_col: '1'
  }
];

export const ALL_TYPES_PLAIN_SNAPPY_EXPECTED = [
  {
    bigint_col: '0',
    bool_col: true,
    date_string_col: '04/01/09',
    double_col: '0',
    float_col: '0',
    id: '6',
    int_col: '0',
    smallint_col: '0',
    string_col: '0',
    timestamp_col: '0',
    tinyint_col: '0'
  },
  {
    bigint_col: '10',
    bool_col: false,
    date_string_col: '04/01/09',
    double_col: '10.1',
    float_col: '1.100000023841858',
    id: '7',
    int_col: '1',
    smallint_col: '1',
    string_col: '1',
    timestamp_col: '60000000000',
    tinyint_col: '1'
  }
];

export const BINARY_EXPECTED = () => {
  const result = [];

  for (let index = 0; index < 12; index++) {
    result.push({ foo: Buffer.from([index]) });
  }

  return result;
};

export const DICT_EXPECTED = () => {
  const result = [];

  for (let index = 0; index < 39; index++) {
    result.push({ l_partkey: 1552 });
  }

  return result;
};

export const LIST_COLUMNS_EXPECTED = [
  {
    int64_list: { list: [{ item: '1' }, { item: '2' }, { item: '3' }] },
    utf8_list: { list: [{ item: 'abc' }, { item: 'efg' }, { item: 'hij' }] }
  },
  {
    int64_list: { list: [{}, { item: '1' }] }
  },
  {
    int64_list: { list: [{ item: '4' }] },
    utf8_list: { list: [{ item: 'efg' }, {}, { item: 'hij' }, { item: 'xyz' }] }
  }
];

export const NESTED_LIST_EXPECTED = [
  {
    a: {
      list: [
        {
          element: {
            list:
              [{
                element: {
                  list: [{ element: "a" },
                  { element: "b" }]
                }
              },
              {
                element: { list: [{ element: "c" }] }
              }]
          }
        },
        {
          element: {
            list: [{}, { element: { list: [{ element: "d" }] } }]
          }
        }
      ]
    },
    b: "1"
  },
  {
    a:
    {
      list:
        [{
          element:
          {
            list: [{
              element:
                { list: [{ element: "a" }, { element: "b" }] }
            },
            {
              element: { list: [{ element: "c" }, { element: "d" }] }
            }]
          }
        },
        {
          element: { list: [{}, { element: { list: [{ element: "e" }] } }] }
        }]
    },
    b: "1"
  },
  {
    a:
    {
      list:
        [{
          element:
          {
            list: [
              { element: { list: [{ element: "a" }, { element: "b" }] } },
              { element: { list: [{ element: "c" }, { element: "d" }] } },
              { element: { list: [{ element: "e" }] } }
            ]
          }
        },
        {
          element: { list: [{}, { element: { list: [{ element: "f" }] } }] }
        }]
    },
    b: "1"
  }
];

export const NESTED_MAPS_EXPECTED = [
  {
    a:
    {
      key_value: [
        {
          key: Buffer.from([97]),
          value: {
            key_value: [
              { key: "1", value: true },
              { key: "2", value: false }
            ]
          }
        }
      ]
    },
    b: "1",
    c: "1"
  },
  {
    a:
    {
      key_value: [
        {
          key: Buffer.from([98]),
          value: {
            key_value: [
              { key: "1", value: true }
            ]
          }
        }
      ]
    },
    b: "1",
    c: "1"
  },
  {
    a: {
      key_value: [
        { key: Buffer.from([99]) }
      ]
    },
    b: "1",
    c: "1"
  },
  {
    a: {
      key_value: [
        {
          key: Buffer.from([100]), value: {}
        }
      ]
    },
    b: "1",
    c: "1"
  },
  {
    a:
    {
      key_value: [
        {
          key: Buffer.from([101]),
          value: {
            key_value: [
              { key: "1", value: true }
            ]
          }
        }
      ]
    },
    b: "1",
    c: "1"
  },
  {
    a: {
      key_value: [
        {
          key: Buffer.from([102]),
          value: {
            key_value: [
              { key: "3", value: true },
              { key: "4", value: false },
              { key: "5", value: true }
            ]
          }
        }
      ]
    },
    b: "1",
    c: "1"
  }
];

export const NO_NULLABLE_EXPECTED = [
  {
    ID: 8,
    Int_Array: { list: [{ element: -1 }] },
    int_array_array: { list: [{ element: { list: [{ element: -1 }, { element: -2 }] } }, { element: {} }] },
    Int_Map: { map: [{ key: Buffer.from([107, 49]), value: -1 }] },
    int_map_array: {
      list: [
        { element: {} },
        { element: { map: [{ key: Buffer.from([107, 49]), value: 1 }] } },
        { element: {} },
        { element: {} }
      ]
    },
    nested_Struct: {
      a: -1,
      B: { list: [{ element: -1 }] },
      c: {
        D: {
          list: [
            {
              element: {
                list: [
                  {
                    element: { e: -1, f: Buffer.from([110, 111, 110, 110, 117, 108, 108, 97, 98, 108, 101]) }
                  }]
              }
            }]
        }
      },
      G: {}
    }
  }
];

export const NULLABLE_EXPECTED = [
  {
    id: 1,
    int_array: {
      list: [
        { element: "1" },
        { element: "2" },
        { element: "3" }
      ]
    },
    int_array_Array: {
      list: [
        { element: { list: [{ element: "1" }, { element: "2" }] } },
        { element: { list: [{ element: "3" }, { element: "4" }] } }
      ]
    },
    int_map: {
      map: [
        { key: "k1", value: 1 },
        { key: "k2", value: 100 }
      ]
    },
    int_Map_Array: {
      list: [
        { element: { map: [{ key: "k1", value: "1" }] } }
      ]
    },
    nested_struct: {
      A: 1,
      b: { list: [{ element: 1 }] },
      C: {
        d: {
          list: [
            { element: { list: [{ element: { E: "10", F: "aaa" } }, { element: { E: "-10", F: "bbb" } }] } },
            { element: { list: [{ element: { E: "11", F: "c" } }] } }
          ]
        }
      },
      g: {
        map: [
          { key: "foo", value: { H: { "i": { list: [{ element: "1.1" }] } } } }
        ]
      }
    }
  },
  {
    id: 2,
    int_array: {
      list: [
        {},
        { element: "1" },
        { element: "2" },
        {}, { element: "3" },
        {}
      ]
    },
    int_array_Array: {
      list: [
        { element: { list: [{}, { element: "1" }, { element: "2" }, {}] } },
        { element: { list: [{ element: "3" }, {}, { element: "4" }] } },
        { element: {} },
        {}
      ]
    },
    int_map: { map: [{ key: "k1", value: 2 }, { key: "k2" }] },
    int_Map_Array: {
      list: [
        { element: { map: [{ key: "k3" }, { key: "k1", value: "1" }] } },
        {},
        { element: {} }
      ]
    },
    nested_struct: {
      b: { list: [{}] },
      C: {
        d: {
          list: [
            {
              element: {
                list: [{ element: {} },
                { element: { E: "10", F: "aaa" } },
                { element: {} }, { element: { E: "-10", F: "bbb" } }, { element: {} }]
              }
            },
            {
              element: {
                list: [
                  { element: { E: "11", F: "c" } }, {}]
              }
            },
            { element: {} },
            {}
          ]
        }
      },
      g: {
        map: [
          { key: "g1", value: { H: { "i": { list: [{ element: "2.2" }, {}] } } } },
          { key: "g2", value: { H: { "i": {} } } },
          { key: "g3" },
          { key: "g4", value: { H: {} } },
          { key: "g5", value: {} }
        ]
      }
    }
  },
  {
    id: 3,
    int_array: {},
    int_array_Array: { list: [{}] },
    int_map: {},
    int_Map_Array: { list: [{}, {}] },
    nested_struct: { C: { d: {} }, g: {} }
  },
  {
    id: 4,
    int_array_Array: {},
    int_map: {},
    int_Map_Array: {},
    nested_struct: { C: {} }
  },
  {
    id: 5,
    int_map: {},
    nested_struct: {
      g: {
        map: [
          { key: "foo", value: { H: { i: { list: [{ element: "2.2" }, { element: "3.3" }] } } } }
        ]
      }
    }
  },
  {
    id: 6
  },
  {
    id: 7,
    int_array_Array: { list: [{}, { element: { list: [{ element: "5" }, { element: "6" }] } }] },
    int_map: { map: [{ key: "k1" }, { key: "k3" }] },
    nested_struct: {
      A: 7,
      b: { list: [{ element: 2 }, { element: 3 }, {}] },
      C: {
        d: { list: [{ element: {} }, { element: { list: [{}] } }, {}] }
      }
    }
  }
];

export const NULLS_EXPECTED = [
  { b_struct: {} },
  { b_struct: {} },
  { b_struct: {} },
  { b_struct: {} },
  { b_struct: {} },
  { b_struct: {} },
  { b_struct: {} },
  { b_struct: {} }
];

export const REPEATED_NO_ANNOTATION_EXPECTED = [
  { id: "1" },
  { id: "2" },
  { id: "3", phoneNumbers: {} },
  { id: "4", phoneNumbers: { phone: [{ number: "5555555555" }] } },
  { id: "5", phoneNumbers: { phone: [{ number: "1111111111", kind: "home" }] } },
  { id: "6", phoneNumbers: { phone: [{ number: "1111111111", kind: "home" }, { number: "2222222222" }, { number: "3333333333", kind: "mobile" }] } }
];

export const DECIMAL_EXPECTED = [
 {value: 1},
 {value: 2},
 {value: 3},
 {value: 4},
 {value: 5},
 {value: 6},
 {value: 7},
 {value: 8},
 {value: 9},
 {value: 10},
 {value: 11},
 {value: 12},
 {value: 13},
 {value: 14},
 {value: 15},
 {value: 16},
 {value: 17},
 {value: 18},
 {value: 19},
 {value: 20},
 {value: 21},
 {value: 22},
 {value: 23},
 {value: 24}
];

export const LZ4_RAW_COMPRESSED_LARGER_FIRST_EXPECTED = {
  a: Buffer.from([
    99, 55, 99, 101, 54, 98, 101, 102, 45, 100, 53, 98, 48, 45, 52, 56, 54, 51,
    45, 98, 49, 57, 57, 45, 56, 101, 97, 56, 99, 55, 102, 98, 49, 49, 55, 98
  ])
};

export const LZ4_RAW_COMPRESSED_LARGER_LAST_EXPECTED = {
  a: Buffer.from([
    56, 53, 52, 52, 48, 55, 55, 56, 45, 52, 54, 48, 97, 45, 52, 49, 97, 99,
    45, 97, 97, 50, 101, 45, 97, 99, 51, 101, 101, 52, 49, 54, 57, 54, 98, 102
  ])
};

export const LZ4_RAW_COMPRESSED_EXPECTED = [
  {
    c0: 1593604800,
    c1: Buffer.from([97, 98, 99]),
    v11: 42
  },
  {
    c0: 1593604800,
    c1: Buffer.from([100, 101, 102]),
    v11: 7.7
  },
  {
    c0: 1593604801,
    c1: Buffer.from([97, 98, 99]),
    v11: 42.125
  },
  {
    c0: 1593604801,
    c1: Buffer.from([100, 101, 102]),
    v11: 7.7
  }
];

export const NON_HADOOP_LZ4_COMPRESSED_EXPECTED = [
  {
    c0: '1593604800',
    c1: 'abc',
    v11: '42'
  },
  {
    c0: '1593604800',
    c1: 'def',
    v11: '7.7'
  },
  {
    c0: '1593604801',
    c1: 'abc',
    v11: '42.125'
  },
  {
    c0: '1593604801',
    c1: 'def',
    v11: '7.7'
  }
];
