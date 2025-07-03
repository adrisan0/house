# house

This project contains a housing affordability calculator. Open `index.html` in a
browser to use it.

The estimator now applies a dynamic inflation model when projecting property
prices. Inflation starts at the chosen scenario rate and gradually decreases
after five years toward a long‑term floor. The floor can now be customized via
an "Inflation floor" input in the interface.
Users can also set their initial savings amount through a new "Initial savings"
input field. The calculator now remembers your selections using browser
storage, with a "Reset" button to clear them.

## Professional Tools & Libraries

To build a robust housing affordability calculator, consider integrating the following tools:

- **React** or **Vue.js** for a scalable user interface.
- **TypeScript** to add static typing to the JavaScript codebase.
- **Chart.js** for visualizing projections (already used).
- **Python** with **Pandas** for data analysis or importing external datasets.
- **Docker** to standardize development and deployment.

The main application logic now resides in `main.js`, which is loaded from `index.html`.
All Spanish provinces are available through `provinces.js`, allowing price projections for any province.
The application now supports offline use thanks to a service worker (sw.js) that caches key assets when the page loads.
