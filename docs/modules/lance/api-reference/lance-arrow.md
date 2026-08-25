# Lance Arrow readers

<p class="badges">
  <img src="https://img.shields.io/badge/Status-Work--In--Progress-orange.svg?style=flat-square" alt="Status: Work-In-Progress" />
</p>

The Lance Arrow helpers perform bounded reads from a local or remote Lance data
file. `readLanceRemoteFileToArrow()` supports selected fixed-width primitive
columns. `readLanceRemoteCoordinatesToArrow()` supports two-dimensional
fixed-size float columns such as PushT's `observation_state`.

Both APIs are Work In Progress and currently require physical column indexes,
explicit names, and known Lance encodings.
