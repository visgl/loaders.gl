# OMM test data

- `stations.omm.json`: the 16 element sets of the CelesTrak `stations` group in OMM JSON
  (`https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=json`), downloaded on
  2026-11-24. Three objects (100057, 100712, 100882) have catalog numbers above 99999.
- `stations.omm`: two element sets of `stations.omm.json` (25544 and 100057), written by hand in
  the CCSDS OMM KVN form. The values are the same as in the JSON file.

CelesTrak (https://celestrak.org) publishes GP data for free use. See the CelesTrak
[usage policy](https://celestrak.org/usage-policy.php).
