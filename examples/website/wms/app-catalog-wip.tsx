// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

// import {_getArcGISServices, CSWService} from '@loaders.gl/wms';

// export async function loadCSWCatalog(url: string = 'https://gamone.whoi.edu/csw') {
//   const catalogService = new CSWService({url}); // https://deims.org/pycsw/catalogue'});
//   const services = await catalogService.getServiceDirectory();
//   console.log(JSON.stringify(services, null, 2));

//   const examples = EXAMPLES['gamone'] = {};
//   let i = 0;
//   for (const service of services) {
//     examples[`${service.name.replace('-', '')}`] = {
//       service: service.url,
//       serviceType: 'wms',
//       layers: ['THREDDS'],
//       viewState: {
//         longitude: -122.4,
//         latitude: 37.74,
//         zoom: 9,
//         minZoom: 1,
//         maxZoom: 20,
//         pitch: 0,
//         bearing: 0
//       }
//     }
//   }
// }

// loadCSWCatalog();

// export async function loadArcGISCatalog(url: string = 'https://gamone.whoi.edu/csw') {
//   // const services = await _getArcGISServices('https://sampleserver6.arcgisonline.com/arcgis/rest/services'); // /Water_Network_Base_Map/MapServer
//   // console.log(JSON.stringify(services, null, 2));
// }
