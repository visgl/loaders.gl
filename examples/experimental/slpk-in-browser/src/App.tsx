import React, { useEffect, useState } from 'react';
import DeckGL from '@deck.gl/react/typed';

import {TerrainLayer} from '@deck.gl/geo-layers/typed';
import {TerrainLoader} from '@loaders.gl/terrain';
import {parseSLPKArchive} from '@loaders.gl/i3s';
import {BrowserFile} from './browser-file';


const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line

const INITIAL_VIEW_STATE = {
  latitude: 46.24,
  longitude: -122.18,
  zoom: 11.5,
  bearing: 140,
  pitch: 60,
  maxPitch: 89
};

const TERRAIN_IMAGE = `https://api.mapbox.com/v4/mapbox.terrain-rgb/{z}/{x}/{y}.png?access_token=${MAPBOX_TOKEN}`;
const SURFACE_IMAGE = `https://api.mapbox.com/v4/mapbox.satellite/{z}/{x}/{y}@2x.png?access_token=${MAPBOX_TOKEN}`;

// https://docs.mapbox.com/help/troubleshooting/access-elevation-data/#mapbox-terrain-rgb
// Note - the elevation rendered by this example is greatly exagerated!
const ELEVATION_DECODER = {
  rScaler: 6553.6,
  gScaler: 25.6,
  bScaler: 0.1,
  offset: -10000
};

function App({
  texture = SURFACE_IMAGE,
  wireframe = false,
  initialViewState = INITIAL_VIEW_STATE
}) {
  const [fileList, setFileList] = useState<FileList | null>(null)
  const [fetchObject, setFetchObject] = useState<({fetch: (path: string) => Promise<ArrayBuffer>}) | undefined>(undefined)
  
  useEffect(() => {
    if (!fileList) {
      return
    }
    const provider = new BrowserFile(fileList[0])
    const setFetchAsync = async () => {
      const slpkFile = await parseSLPKArchive(provider)
      const fetch = async (path: string) => {
        return await slpkFile.getFile(path, "http")
      }

      //simple test, should show root json in console
      console.log(new TextDecoder().decode(await fetch('')))

      setFetchObject({fetch})
    }

    setFetchAsync().catch(console.error);
    
  }, [fileList])

  const layer = new TerrainLayer({
    id: 'layer',
    minZoom: 0,
    maxZoom: 23,
    strategy: 'no-overlap',
    elevationDecoder: ELEVATION_DECODER,
    elevationData: TERRAIN_IMAGE,
    texture,
    wireframe,
    color: [255, 255, 255],
    loadOptions: {
      terrain: {
        skirtHeight: 50
      }
    },
    loaders: [TerrainLoader]
  });

  if (fileList) {
    if (fetchObject) {
      return <DeckGL initialViewState={initialViewState} controller={true} layers={[layer]} />
    } else {
      return <div>Loading...</div>
    }
  } else {
    return <input type="file" onChange={(ev) => setFileList(ev.target.files)}/>
  }
}

export default App;
