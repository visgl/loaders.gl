export const dumpJsonSchema = {
  type: 'object',
  properties: {
    options: {
      type: 'object',
      properties: {
        inputUrl: {type: 'string'},
        outputPath: {type: 'string'},
        tilesetName: {type: 'string'},
        maxDepth: {type: 'number'},
        slpk: {type: 'boolean'},
        egmFilePath: {type: 'string'},
        token: {type: 'string'},
        draco: {type: 'boolean'},
        mergeMaterials: {type: 'boolean'},
        generateTextures: {type: 'boolean'},
        generateBoundingVolumes: {type: 'boolean'},
        metadataClass: {type: 'string'},
        analyze: {type: 'boolean'}
      },
      required: ['inputUrl', 'outputPath', 'tilesetName']
    },
    tilesConverted: {
      type: 'object',
      patternProperties: {
        '.*': {
          type: 'object',
          properties: {
            nodes: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  nodeId: {type: ['number', 'string']},
                  done: {type: 'boolean'},
                  progress: {type: 'object', patternProperties: {'.*': {type: 'boolean'}}},
                  dumpMetadata: {
                    type: 'object',
                    properties: {
                      boundingVolumes: {
                        type: ['object', 'null'],
                        properties: {
                          mbs: {
                            type: 'array',
                            minItems: 3,
                            maxItems: 3,
                            items: {type: 'number'}
                          },
                          obb: {
                            type: 'object',
                            properties: {
                              center: {
                                type: 'array',
                                minItems: 3,
                                maxItems: 3,
                                items: {type: 'number'}
                              },
                              halfSize: {
                                type: 'array',
                                minItems: 3,
                                maxItems: 3,
                                items: {type: 'number'}
                              },
                              quaternion: {
                                type: 'array',
                                minItems: 4,
                                maxItems: 4,
                                items: {type: 'number'}
                              }
                            },
                            required: ['center', 'halfSize', 'quaternion']
                          }
                        },
                        required: ['mbs', 'obb']
                      },
                      attributesCount: {type: 'number'},
                      featureCount: {type: 'number'},
                      geometry: {type: 'boolean'},
                      hasUvRegions: {type: 'boolean'},
                      materialId: {type: 'number'},
                      texelCountHint: {type: 'number'},
                      vertexCount: {type: 'number'}
                    },
                    required: [
                      'boundingVolumes',
                      'featureCount',
                      'geometry',
                      'hasUvRegions',
                      'materialId',
                      'vertexCount'
                    ]
                  }
                },
                required: ['nodeId', 'done']
              }
            }
          },
          required: ['nodes']
        }
      }
    },
    textureSetDefinitions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          formats: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: {type: 'string'},
                format: {enum: ['jpg', 'png', 'ktx-etc2', 'dds', 'ktx2']}
              },
              required: ['name', 'format']
            }
          },
          atlas: {type: 'boolean'}
        },
        required: ['formats']
      }
    },
    attributeMetadataInfo: {
      type: 'object',
      properties: {
        attributeStorageInfo: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: {type: 'string'},
              name: {type: 'string'},
              header: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {property: {type: 'string'}, valueType: {type: 'string'}},
                  required: ['property', 'valueType']
                }
              },
              ordering: {type: 'array', items: {type: 'string'}},
              attributeValues: {$ref: '#/$defs/AttributeValue'},
              attributeByteCounts: {$ref: '#/$defs/AttributeValue'},
              objectIds: {$ref: '#/$defs/AttributeValue'}
            },
            required: ['key', 'name', 'header']
          }
        },
        fields: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: {type: 'string'},
              type: {$ref: '#/$defs/ESRIField'},
              alias: {type: 'string'},
              domain: {$ref: '#/$defs/Domain'}
            },
            required: ['name', 'type']
          }
        },
        popupInfo: {
          type: 'object',
          properties: {
            title: {type: 'string'},
            description: {type: 'string'},
            expressionInfos: {type: 'array', items: {}},
            fieldInfos: {type: 'array', items: {$ref: '#/$defs/FieldInfo'}},
            mediaInfos: {type: 'array', items: {}},
            popupElements: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  text: {type: 'string'},
                  type: {type: 'string'},
                  fieldInfos: {type: 'array', items: {$ref: '#/$defs/FieldInfo'}}
                }
              }
            }
          }
        }
      },
      required: ['attributeStorageInfo', 'fields']
    },
    materialDefinitions: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          pbrMetallicRoughness: {
            type: 'object',
            properties: {
              baseColorFactor: {
                type: 'array',
                minItems: 4,
                maxItems: 4,
                items: {type: 'number'}
              },
              baseColorTexture: {$ref: '#/$defs/I3SMaterialTexture'},
              metallicFactor: {type: 'number'},
              roughnessFactor: {type: 'number'},
              metallicRoughnessTexture: {$ref: '#/$defs/I3SMaterialTexture'}
            },
            required: ['metallicFactor', 'roughnessFactor']
          },
          normalTexture: {$ref: '#/$defs/I3SMaterialTexture'},
          occlusionTexture: {$ref: '#/$defs/I3SMaterialTexture'},
          emissiveTexture: {$ref: '#/$defs/I3SMaterialTexture'},
          emissiveFactor: {type: 'array', minItems: 3, maxItems: 3, items: {type: 'number'}},
          alphaMode: {enum: ['opaque', 'mask', 'blend']},
          alphaCutoff: {type: 'number'},
          doubleSided: {type: 'boolean'},
          cullFace: {enum: ['none', 'front', 'back']}
        },
        required: ['pbrMetallicRoughness', 'alphaMode']
      }
    }
  },
  required: ['options', 'tilesConverted'],
  $defs: {
    AttributeValue: {
      type: 'object',
      properties: {
        valueType: {type: 'string'},
        encoding: {type: 'string'},
        valuesPerElement: {type: 'number'}
      },
      required: ['valueType']
    },
    ESRIField: {
      enum: [
        'esriFieldTypeDate',
        'esriFieldTypeSingle',
        'esriFieldTypeDouble',
        'esriFieldTypeGUID',
        'esriFieldTypeGlobalID',
        'esriFieldTypeInteger',
        'esriFieldTypeOID',
        'esriFieldTypeSmallInteger',
        'esriFieldTypeString'
      ]
    },
    Domain: {
      type: 'object',
      properties: {
        type: {type: 'string'},
        name: {type: 'string'},
        description: {type: 'string'},
        fieldType: {type: 'string'},
        range: {type: 'array', items: {type: 'number'}},
        codedValues: {
          type: 'array',
          items: {
            type: 'object',
            properties: {name: {type: 'string'}, code: {type: ['string', 'number']}},
            required: ['name', 'code']
          }
        },
        mergePolicy: {type: 'string'},
        splitPolicy: {type: 'string'}
      },
      required: ['type', 'name']
    },
    FieldInfo: {
      type: 'object',
      properties: {
        fieldName: {type: 'string'},
        visible: {type: 'boolean'},
        isEditable: {type: 'boolean'},
        label: {type: 'string'}
      },
      required: ['fieldName', 'visible', 'isEditable', 'label']
    },
    I3SMaterialTexture: {
      type: 'object',
      properties: {
        textureSetDefinitionId: {type: 'number'},
        texCoord: {type: 'number'},
        factor: {type: 'number'}
      },
      required: ['textureSetDefinitionId']
    }
  }
};
