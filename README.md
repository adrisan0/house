# house

This project contains a housing affordability calculator. Open `index.html` in a
browser to use it.

The estimator now applies a dynamic inflation model when projecting property
prices. Inflation starts at the chosen scenario rate and gradually decreases
after five years toward a long‑term floor of 2%.

Locations missing price data are ignored when selected as part of a group to
prevent runtime errors.
