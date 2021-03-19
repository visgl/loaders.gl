#!/usr/bin/env python3

"""Simple script to fetch MVT tiles for testing"""
import requests
import os

TABLE = 'cartodb-gcp-backend-data-team.alasarr'

DATASETS = {
    'blockgroup': f'{TABLE}.usa_blockgroup_population',
    'blockgroup_numprop': f'{TABLE}.usa_blockgroup_tileset_numprop',
    'census_numprop': f'{TABLE}.usa_censustract_2015_tileset_numprop',
    'zipcodes': f'{TABLE}.usa_zcta_2015_tileset',
    'zipcodes_numprop': f'{TABLE}.usa_zcta_2015_tileset_numprop',
    'counties_numprop': f'{TABLE}.usa_county_2015_tileset_numprop',
}


SERVER = 'https://maps-api-v2.us.carto.com/user/aasuero/bigquery'

TILES = [
    {'z': 4, 'x': 4, 'y': 6},
    {'z': 4, 'x': 3, 'y': 6},
    {'z': 5, 'x': 8, 'y': 12},
    {'z': 6, 'x': 18, 'y': 24},
    {'z': 7, 'x': 35, 'y': 50},
    {'z': 8, 'x': 75, 'y': 96}
]
for name, dataset in DATASETS.items():
    # Get url pattern for tiles
    params = {
        'source': dataset,
        'format': 'tilejson'
    }
    url = f'{SERVER}/tileset'
    r = requests.get(url, params)
    parsed = r.json()
    tileformat = parsed['tiles'][0]

    for tile in TILES:
        tileurl = tileformat.format(**tile)
        zxy = '{z}_{x}_{y}'.format(**tile)
        tilename = f'{name}_{zxy}'
        filename = f'{tilename}.mvt'
        print(f'{tilename}: \'{filename}\',')

        if not os.path.isfile(filename):
            r = requests.get(tileurl)
            with open(filename, 'wb') as f:
                f.write(r.content)
