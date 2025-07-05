# house

This project contains a housing affordability calculator. Open `index.html` in a
browser to use it.

The estimator now applies a dynamic inflation model when projecting property
prices. Inflation starts at the chosen scenario rate and gradually decreases
after five years toward a long‑term floor. The floor can now be customized via
an "Inflation floor" input in the interface. Projections can begin from any
starting year thanks to the new "Start year" field.
Users can also set their initial savings amount through a new "Initial savings"
input field. The calculator now remembers your selections using browser
storage, with a "Reset" button to clear them. A "Toggle theme" control lets
you switch between dark and light modes, and your preference is saved.
You can now export the latest projection to a CSV file using the "Download CSV" button.
All fields update the chart automatically as soon as you modify them. Your selections are
saved instantly so the state persists across sessions.
The required down payment percentage is now configurable. When viewing savings
against the chosen down payment, the chart displays a "gap" line. The summary
indicates the year your savings cover the payment if it occurs within the
projection period.
You can also display the number of salary years needed to purchase a property
via the new "Años de salario" metric.

The interface now offers a dropdown to choose the dwelling type and
controls for rooms and optional extras (jardín, terraza, patio o sótano).
These selections are stored but no price adjustments are applied yet.

The control panel groups related fields in expandable sections for a
cleaner look. The page still adapts to the window size but leaves wider
margins, and the chart has additional padding with a maximum width of
700&nbsp;px so it does not dominate the layout.

Any change to them is persisted automatically so the settings remain
after volver a cargar la página.


Job hopping can now be modeled by selecting a change year and future career
path. Salary growth switches to the new trajectory from that year onward.
The savings rate editor now uses an interactive curve. Click on a year to add
a node and drag it to adjust the rate, allowing smooth changes over time. The
chart adapts automatically when the "Years until purchase" value changes.

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

A new command-line script `housing_calc.py` replicates the calculator logic for
batch projections. Run `python housing_calc.py --help` to see available options
and output CSV-style tables.

## Historical data

The repository now includes `data/historical_summary.csv` with a short
retrospective of real figures for Spain (property price, rent and net salary
from 2007 to 2025). These numbers come from public sources summarized in
`informe.txt` and can be used for additional context or analysis.

## Interface tweaks

When selecting the property metric, the personal metric adjusts automatically:

- **Precio vivienda** → "Ahorros acumulados"
- **Entrada** → "Ahorros acumulados"
- **Cuota hipoteca** → "Salario neto mensual"
