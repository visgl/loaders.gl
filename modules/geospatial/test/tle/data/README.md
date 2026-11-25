# TLE test data

- `stations.tle`: the CelesTrak `stations` group in the three-line TLE form
  (`https://celestrak.org/NORAD/elements/gp.php?GROUP=stations&FORMAT=tle`), downloaded on
  2026-11-24, at the same time as `../omm/data/stations.omm.json`. TLE output from CelesTrak
  does not include the three objects with catalog numbers above 99999.

The tests make other TLE lines (Alpha-5 catalog numbers, epoch years, malformed lines) from these
lines and compute their checksums.

CelesTrak (https://celestrak.org) publishes GP data for free use. See the CelesTrak
[usage policy](https://celestrak.org/usage-policy.php).
