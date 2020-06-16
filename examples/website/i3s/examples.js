const VIEW_STATE = {
  height: 600,
  width: 800,
  pitch: 45,
  maxPitch: 60,
  bearing: 0,
  minZoom: 2,
  maxZoom: 30,
  zoom: 14.5
};

export const INITIAL_EXAMPLE_NAME = 'San Francisco';

export const EXAMPLES = {
  'San Francisco': {
    name: 'San Francisco',
    url:
      'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/SanFrancisco_Bldgs/SceneServer/layers/0',
    viewport: {
      ...VIEW_STATE,
      longitude: -120,
      latitude: 34
    }
  },
  // use for debugging/testing purpose only
  // 'Lyon': {
  //  name: 'Lyon',
  //  url:
  //    'https://services2.arcgis.com/cFEFS0EWrhfDeVw9/arcgis/rest/services/STM____FR_Lyon__Textured_buildings/SceneServer/layers/0?f=pjson',
  //  viewport: {
  //    ...VIEW_STATE,
  //    latitude: 45.764,
  //    longitude: 4.8357
  //  }
  // },
  'New York': {
    name: 'New York',
    url:
      'https://tiles.arcgis.com/tiles/z2tnIkrLQ2BRzr6P/arcgis/rest/services/New_York_Mesh/SceneServer/layers/0?token=epNIXupS0DwQBgeJkldNLQF_vJ7t4fKjUvas6_1mluYo11ej7BIJnOM5mPK0AJpCK1AwhnYC0Kcn7ntDlyV5_fgO9kpfhlOrnP2jCRU0UP3pRBUMB8XBeWQkvGgmcRtyU61Vx-0ioTcj8ZJsjdjFEbc24TbsUhXtVNc1BLOsvGAZjfMA_PuaFm18Cl1oOgM10C7ieRg2PJNO0-JeUHIKIgasNODDOTD0_LPqsInL_GQt_NRmnGwBN8mqElWltdy-',
    viewport: {
      ...VIEW_STATE,
      longitude: -74,
      latitude: 40
    }
  }
};
