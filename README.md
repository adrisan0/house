# house

This project contains a housing affordability calculator. You can simply open
`index.html` in your browser, although serving it with a local HTTP server is
still recommended. The page styles are now kept in `style.css`, which introduces
new fonts, colors and transitions for a cleaner look.

Launch a server from the project root with:

```bash
python3 -m http.server
```

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
The old "Update" button has been removed since changes recalc and save automatically.
All fields update the chart automatically as soon as you modify them. Your selections are
saved instantly so the state persists across sessions.
The required down payment percentage is now configurable. When viewing savings
against the chosen down payment, you see both curves to check if your savings
will cover the payment within the projection period. The summary indicates the
year this goal is reached. Down-payment curves appear faded until your savings
exceed the required amount so the intersection year is easier to spot.
You can also display the number of salary years needed to purchase a property
via the new "Años de salario" metric.
Net salary can now be calculated from gross annual income. Select the salary
type, pay periods and IRPF rate to derive monthly net pay.
The personal metric selector adds "Ahorro mensual" to visualize monthly
savings alongside the accumulated amount.

The interface now offers a dropdown to choose the dwelling type and
controls for rooms and optional extras (jardín, terraza, patio o sótano).
These selections now modify the projected price using predefined
multipliers for each feature.

Default multipliers:
- **Chalet** → +25 % sobre el precio base del piso.
- **Ático** → +15 %.
- Cada habitación por encima de 3 añade un 5 % (o resta si hay menos).
- Extras: jardín +7 %, terraza +5 %, patio +3 % y sótano +4 %.

The control panel groups related fields in expandable sections for a
Estas se muestran colapsadas por defecto para reducir el desorden.
cleaner look. The page still adapts to the window size but leaves wider
margins, and the chart has additional padding with a maximum width of
700&nbsp;px so it does not dominate the layout.

Any change to them is persisted automatically so the settings remain
after volver a cargar la página.


Job hopping can now be modeled by selecting a change year and future career
path. Salary growth switches to the new trajectory from that year onward.
The "Seguir en empresa actual" path assumes a starting gross salary of
21 000 € with raises of 2 000 € every 18 months up to a ceiling of
30 000 €.
The savings rate editor now uses an interactive curve. Click on a year to add
a node and drag it vertically to adjust the rate. The node follows the mouse
for smooth real-time feedback. When a node is moved, all later years inherit
its value to keep the curve consistent without sudden jumps. The
chart adapts automatically when the "Years until purchase" value changes.
The former savings rate slider has been removed as the curve performs that role.
You can still enable a fixed monthly expense via "Usar gasto fijo". The expense
amount is now set through a second curve instead of a slider.

## Professional Tools & Libraries

To build a robust housing affordability calculator, consider integrating the following tools:

- **React** or **Vue.js** for a scalable user interface.
- **TypeScript** to add static typing to the JavaScript codebase.
- **Chart.js** for visualizing projections (included locally).
- **Python** with **Pandas** for data analysis or importing external datasets.
- **Docker** to standardize development and deployment.

The main application logic now resides in `main.js`, which is loaded from `index.html`.
All Spanish provinces are available through `provinces.js`, allowing price projections for any province.
Province selection uses only a multi-select list for simplicity.
The application still supports offline use thanks to a service worker (sw.js) that caches key assets when the page loads.
Chart.js se carga desde el archivo `chart.umd.js`, de modo que la página funciona sin conexión.

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
- Las líneas del gráfico muestran su nombre de leyenda junto al
  punto final en el extremo derecho.
- Bajo la gráfica se muestra una tabla con las ubicaciones que se pueden
  costear cada año. Para aparecer en la tabla la entrada estimada debe
  estar dentro de un 8% arriba o abajo del ahorro acumulado de ese año.
- Las animaciones de las gráficas se han desactivado para que la
  actualización sea instantánea.
