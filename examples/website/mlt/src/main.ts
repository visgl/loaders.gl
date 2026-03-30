// loaders.gl
// SPDX-License-Identifier: MIT
// Copyright (c) vis.gl contributors

import maplibregl from 'maplibre-gl'
import {load} from '@loaders.gl/core'
import {MLTLoader} from '../../../../modules/mlt/src'
import type {Feature, FeatureCollection} from 'geojson'

const MLT_TILES_BASE = 'https://demotiles.maplibre.org/tiles-mlt/plain'
const EXTRUSION_HEIGHT = 80_000

const CONTINENT_MATCH_EXPR: maplibregl.ExpressionSpecification = [
  'match',
  ['get', 'CONTINENT'],
  'Africa', '#e07b54',
  'Antarctica', '#c8e6fa',
  'Asia', '#e8c56d',
  'Europe', '#7dbf8e',
  'North America', '#6baed6',
  'Oceania', '#9e88c4',
  'South America', '#e8915a',
  '#aaaaaa'
]

const DEFAULT_STATUS_TEXT = 'Loading…'

type MLTExampleController = {
  remove: () => void
}

const DEFAULT_MAP_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  sources: {},
  layers: [{id: 'background', type: 'background', paint: {'background-color': '#0d1b2a'}}]
}

function createStatusElement(mapContainer: HTMLElement): HTMLElement {
  const statusContainer = document.createElement('div')
  statusContainer.id = 'info'
  statusContainer.style.position = 'absolute'
  statusContainer.style.top = '12px'
  statusContainer.style.left = '12px'
  statusContainer.style.background = 'rgba(0,0,0,0.65)'
  statusContainer.style.backdropFilter = 'blur(6px)'
  statusContainer.style.padding = '12px 16px'
  statusContainer.style.borderRadius = '8px'
  statusContainer.style.fontSize = '12px'
  statusContainer.style.maxWidth = '260px'
  statusContainer.style.lineHeight = '1.7'
  statusContainer.style.zIndex = '10'
  statusContainer.style.color = '#ddd'
  statusContainer.style.border = '1px solid rgba(255,255,255,0.08)'

  const statusElement = document.createElement('div')
  statusElement.id = 'status'
  statusElement.textContent = DEFAULT_STATUS_TEXT
  statusElement.style.color = '#86efac'
  statusElement.style.marginTop = '8px'
  statusElement.style.fontSize = '11px'
  statusElement.style.minHeight = '1em'

  const heading = document.createElement('h3')
  heading.textContent = '@loaders.gl/mlt · 3D Globe'
  heading.style.fontSize = '13px'
  heading.style.color = '#7dd3fc'
  heading.style.marginBottom = '8px'
  heading.style.letterSpacing = '0.5px'
  heading.style.fontWeight = '500'

  const description = document.createElement('div')
  description.innerHTML = 'Countries extruded at 400 km via <code>fill-extrusion</code>.<br/>'
  statusContainer.append(heading, description)

  const legend = document.createElement('div')
  const items = [
    ['#e07b54', 'Africa'],
    ['#e8c56d', 'Asia'],
    ['#7dbf8e', 'Europe'],
    ['#6baed6', 'North America'],
    ['#e8915a', 'South America'],
    ['#9e88c4', 'Oceania'],
    ['#c8e6fa', 'Antarctica']
  ]

  legend.style.display = 'flex'
  legend.style.flexDirection = 'column'
  legend.style.gap = '3px'

  for (const [color, label] of items) {
    const item = document.createElement('div')
    item.style.display = 'flex'
    item.style.alignItems = 'center'
    item.style.gap = '7px'
    item.style.fontSize = '11px'

    const swatch = document.createElement('div')
    swatch.style.width = '10px'
    swatch.style.height = '10px'
    swatch.style.borderRadius = '2px'
    swatch.style.background = color

    const itemText = document.createElement('span')
    itemText.textContent = label

    item.append(swatch, itemText)
    legend.appendChild(item)
  }

  const sourceLink = document.createElement('a')
  sourceLink.href = 'https://github.com/maplibre/demotiles'
  sourceLink.textContent = 'maplibre/demotiles'
  sourceLink.target = '_blank'
  sourceLink.style.color = '#7dd3fc'
  sourceLink.style.textDecoration = 'none'

  const footer = document.createElement('div')
  footer.style.marginTop = '8px'
  footer.style.fontSize = '11px'
  footer.append('Tiles from ', sourceLink)

  mapContainer.style.position = 'relative'
  mapContainer.append(statusContainer)
  statusContainer.append(legend, footer, statusElement)
  return statusElement
}

export function renderToDOM(
  mapContainer: HTMLElement,
  statusElement?: HTMLElement | null
): MLTExampleController {
  if (!mapContainer) {
    throw new Error('MLT Example: map container required')
  }

  mapContainer.style.position = 'absolute'
  mapContainer.style.inset = '0'
  mapContainer.style.width = '100%'
  mapContainer.style.height = '100%'

  const statusTextElement =
    statusElement ?? createStatusElement(mapContainer.parentElement || mapContainer)
  const statusText = statusElement || statusTextElement
  const statusRoot = statusElement ? null : statusTextElement.parentElement

  const map = new maplibregl.Map({
    container: mapContainer,
    style: DEFAULT_MAP_STYLE,
    center: [15, 25],
    zoom: 1.8,
    pitch: 50,
    bearing: -15,
    maxPitch: 85
  })

  let loading = false

  map.addControl(new maplibregl.NavigationControl({}))

  map.on('load', () => {
    map.addSource('mlt-polygons', {type: 'geojson', data: emptyFC()})
    map.addSource('mlt-labels', {type: 'geojson', data: emptyFC()})

    map.addLayer({
      id: 'countries-extrusion',
      type: 'fill-extrusion',
      source: 'mlt-polygons',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {
        'fill-extrusion-color': CONTINENT_MATCH_EXPR,
        'fill-extrusion-height': EXTRUSION_HEIGHT,
        'fill-extrusion-base': 0,
        'fill-extrusion-opacity': 0.9,
        'fill-extrusion-vertical-gradient': true
      }
    })

    map.addLayer({
      id: 'countries-outline',
      type: 'line',
      source: 'mlt-polygons',
      filter: ['==', ['geometry-type'], 'Polygon'],
      paint: {'line-color': 'rgba(0,0,0,0.4)', 'line-width': 0.5}
    })

    map.addLayer({
      id: 'geolines',
      type: 'line',
      source: 'mlt-polygons',
      filter: ['==', ['geometry-type'], 'LineString'],
      paint: {
        'line-color': '#ffffff',
        'line-width': 0.8,
        'line-opacity': 0.3,
        'line-dasharray': [4, 4]
      }
    })

    map.addLayer({
      id: 'country-labels',
      type: 'symbol',
      source: 'mlt-labels',
      layout: {
        'text-field': ['get', 'ABBREV'],
        'text-font': ['Open Sans Bold'],
        'text-size': 11,
        'text-allow-overlap': false
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': 'rgba(0,0,0,0.7)',
        'text-halo-width': 1.5
      }
    })

    loadTiles()
  })

  map.on('moveend', loadTiles)

  async function loadTiles() {
    if (loading) {
      return
    }

    const polygonSource = map.getSource('mlt-polygons') as maplibregl.GeoJSONSource | undefined
    const labelSource = map.getSource('mlt-labels') as maplibregl.GeoJSONSource | undefined
    if (!polygonSource || !labelSource) {
      return
    }

    loading = true
    statusText.textContent = 'Fetching tiles…'

    const zoom = Math.min(Math.floor(map.getZoom()), 6)
    const tiles = getTilesInBounds(map.getBounds(), zoom)

    try {
      const polygonFeatures: Feature[] = []
      const labelFeatures: Feature[] = []

      await Promise.all(
        tiles.map(async ({x, y, z}) => {
          const url = `${MLT_TILES_BASE}/${z}/${x}/${y}.mlt`
          try {
            const features = (await load(url, MLTLoader, {
              mlt: {
                shape: 'geojson',
                coordinates: 'wgs84',
                tileIndex: {x, y, z},
                layerProperty: 'layerName'
              }
            })) as Feature[]

            for (const feature of features ?? []) {
              ;(feature.geometry?.type === 'Point' ? labelFeatures : polygonFeatures).push(feature)
            }
          } catch (error) {
            console.warn(`Tile ${z}/${x}/${y} failed:`, error)
          }
        })
      )

      polygonSource.setData(fc(polygonFeatures))
      labelSource.setData(fc(labelFeatures))

      statusText.textContent = `z${zoom} · ${polygonFeatures.length.toLocaleString()} polygons · ${labelFeatures.length} labels · ${tiles.length} tile(s)`
    } finally {
      loading = false
    }
  }

  return {
    remove: () => {
      map.remove()
      if (statusRoot) {
        statusRoot.remove()
      } else if (!statusElement) {
        statusTextElement.remove()
      }
    }
  }
}

function emptyFC(): FeatureCollection {
  return {type: 'FeatureCollection', features: []}
}

function fc(features: Feature[]): FeatureCollection {
  return {type: 'FeatureCollection', features}
}

function lon2tile(lon: number, z: number) {
  return Math.floor(((lon + 180) / 360) * 2 ** z)
}

function lat2tile(lat: number, z: number) {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      2 ** z
  )
}

function getTilesInBounds(bounds: maplibregl.LngLatBounds, z: number) {
  const n = 2 ** z
  const tiles: {x: number; y: number; z: number}[] = []
  for (
    let x = Math.max(0, lon2tile(bounds.getWest(), z));
    x <= Math.min(n - 1, lon2tile(bounds.getEast(), z));
    x++
  ) {
    for (
      let y = Math.max(0, lat2tile(bounds.getNorth(), z));
      y <= Math.min(n - 1, lat2tile(bounds.getSouth(), z));
      y++
    ) {
      tiles.push({x, y, z})
    }
  }

  return tiles.slice(0, 25)
}

if (typeof window !== 'undefined') {
  const mapElement = document.getElementById('map')
  const statusElement = document.getElementById('status')
  if (mapElement) {
    renderToDOM(mapElement, statusElement)
  }
}
