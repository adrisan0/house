/**
 * Housing affordability calculator logic.
 * Updates charts based on user input.
 * The required down payment percentage is user configurable.
 * A new metric shows how many years of salary are needed
 * to purchase the selected property.
 * Salary growth can switch to a new career path from a chosen year,
 * and a savings curve editor lets users tweak the saving rate per year.
 * Salary may be provided net per month or gross per year with IRPF and
 * pay periods. A new "Monthly savings" personal metric is available.
 * The equalizer automatically resizes when the years-until-purchase
 * slider changes and shows two-digit year labels. The bar container
 * scrolls horizontally when many years are displayed.
 * Any change in the interface recalculates the projection automatically
 * and persists the state via browser storage.
 * Users can choose dwelling type, number of rooms and extras such as
 * garden or terrace. These selections now modify the projected price
 * through predefined multipliers.
 * The constant savings slider has been removed; the curve alone controls
 * the rate. When "Usar gasto fijo" is enabled, a second curve adjusts the
 * monthly expense instead of a slider.
 * Moving a curve node propagates its value to all future years so
 * the trajectory remains smooth without abrupt jumps. Nodes now
 * follow the mouse vertically while dragging for precise control.
 * Dataset labels are now drawn next to the end of each line for
 * easier identification without relying solely on the legend.
 * Chart animations have been disabled so updates appear instantly.
*/
(() => {
  "use strict";
  // Disable global chart animations for instant updates
  if (window.Chart) {
    Chart.defaults.animation = false;
  }
  const LOCATIONS = {
    "La Latina": {
      price: 5100,
      inflLow: 0.03,
      inflMid: 0.07,
      inflHigh: 0.12,
    },
    "Lavapiés": {
      price: 4200,
      inflLow: 0.03,
      inflMid: 0.07,
      inflHigh: 0.12,
    },
    "Malasaña": {
      price: 4800,
      inflLow: 0.03,
      inflMid: 0.07,
      inflHigh: 0.12,
    },
    "San Isidro": {
      price: 3200,
      inflLow: 0.025,
      inflMid: 0.055,
      inflHigh: 0.09,
    },
    Embajadores: {
      price: 3500,
      inflLow: 0.025,
      inflMid: 0.055,
      inflHigh: 0.09,
    },
    Barajas: {
      price: 3700,
      inflLow: 0.025,
      inflMid: 0.055,
      inflHigh: 0.09,
    },
    Segovia: {
      price: 2200,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    Guadalajara: {
      price: 2100,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    Becerril: {
      price: 2600,
      inflLow: 0.02,
      inflMid: 0.04,
      inflHigh: 0.065,
    },
    Navacerrada: {
      price: 2500,
      inflLow: 0.02,
      inflMid: 0.04,
      inflHigh: 0.065,
    },
    "Costa Andaluza": {
      price: 2400,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    Lanzarote: {
      price: 2300,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    "La Palma": {
      price: 2000,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    Tenerife: {
      price: 2400,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    "Gran Canaria": {
      price: 2300,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    "Centro Almería": {
      price: 1800,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    Retamar: {
      price: 1900,
      inflLow: 0.02,
      inflMid: 0.045,
      inflHigh: 0.07,
    },
    Aguadulce: {
      price: 2000,
      inflLow: 0.022,
      inflMid: 0.05,
      inflHigh: 0.075,
    },
  "Roquetas de Mar": {
      price: 1750,
      inflLow: 0.018,
      inflMid: 0.04,
      inflHigh: 0.065,
    },
  };

  if (window.PROVINCE_DATA) {
    Object.assign(LOCATIONS, window.PROVINCE_DATA);
  }

  const GROUPS = {
    grupo_Centro: ["La Latina", "Lavapiés", "Malasaña"],
    grupo_PeriferiaMunicipal: ["San Isidro", "Embajadores", "Barajas"],
    grupo_PeriferiaProvincial: ["Segovia", "Guadalajara"],
    grupo_SierraMadrid: ["Becerril", "Navacerrada"],
    grupo_CostaAndaluza: ["Costa Andaluza"],
    grupo_Canarias: ["Lanzarote", "La Palma", "Tenerife", "Gran Canaria"],
    grupo_Almeria: [
      "Centro Almería",
      "Retamar",
      "Aguadulce",
      "Roquetas de Mar",
    ],
  };

  // Salary growth schedules. The "stay" path now models €2,000 raises every
  // 18 months starting from €21,000 up to a maximum of €30,000.
  const CAREERS = {
    stay: {
      growth: [0, 0.095238, 0.086957, 0, 0.08, 0.074074, 0, 0.034483, 0],
    },
    odoo: { growth: [0.1, 0.05, 0.03] },
    ai: { growth: [0.15, 0.08, 0.04] },
  };

  const DWELLING_FACTORS = { piso: 1, chalet: 1.25, atico: 1.15 };
  const ROOMS_BASE = 3;
  const ROOM_FACTOR = 0.05;
  const EXTRA_FACTORS = {
    garden: 0.07,
    terrace: 0.05,
    patio: 0.03,
    basement: 0.04,
  };

  /* refs */
  const locSel = document.getElementById("loc");
  const yrsInput = document.getElementById("yrs");
  const yrsLabel = document.getElementById("yrsLabel");
  const startYearInput = document.getElementById("startYear");
  const sizeInput = document.getElementById("size");
  const typeSel = document.getElementById("dwellingType");
  const roomsInput = document.getElementById("rooms");
  const gardenChk = document.getElementById("garden");
  const terraceChk = document.getElementById("terrace");
  const patioChk = document.getElementById("patio");
  const basementChk = document.getElementById("basement");
  const salaryTypeSel = document.getElementById("salaryType");
  const grossInput = document.getElementById("gross");
  const periodsInput = document.getElementById("periods");
  const irpfSelect = document.getElementById("irpf");
  const salaryInput = document.getElementById("salary");
  const curveContainer = document.getElementById("saveCurve");
  const expenseCurveContainer = document.getElementById("expenseCurve");
  const useExpenseChk = document.getElementById("useExpense");
  const retInput = document.getElementById("ret");
  const inflFloorInput = document.getElementById("inflFloor");
  const scenarioSel = document.getElementById("scenario");
  const careerSel = document.getElementById("career");
  const changeYearInput = document.getElementById("changeYear");
  const newCareerSel = document.getElementById("newCareer");
  const propMetricSel = document.getElementById("propMetric");
  const persMetricSel = document.getElementById("persMetric");

  /**
   * Convert user input to a number supporting comma decimals.
   * @param {string|number} value Raw value from an input element.
   * @returns {number} Parsed floating-point number or 0 on failure.
   */
  function toNum(value) {
    return parseFloat(String(value).replace(",", ".")) || 0;
  }


  // Sync personal metric with the chosen property metric.
  // Price/Down -> savings, Mortgage -> salary
  function autoCalc() {
    saveState();
    calc();
  }

  propMetricSel.addEventListener("change", () => {
    const val = propMetricSel.value;
    if (val === "price" || val === "down") {
      persMetricSel.value = "savings";
    } else if (val === "mortgage") {
      persMetricSel.value = "salary";
    }
    autoCalc();
  });
  const mortRateInput = document.getElementById("mortRate");
  const mortYearsInput = document.getElementById("mortYears");
  const downPctInput = document.getElementById("downPct");
  const initSavingsInput = document.getElementById("initSavings");
  const themeToggle = document.getElementById("themeToggle");
  const resetBtn = document.getElementById("reset");
  const csvBtn = document.getElementById("exportCsv");

  /**
   * Reflect current theme in the toggle button text.
   */
  function updateThemeLabel() {
    themeToggle.textContent =
      document.documentElement.dataset.theme === "light"
        ? "Dark theme"
        : "Light theme";
  }

  function updateSalaryFields() {
    const showGross = salaryTypeSel.value === "gross";
    document.getElementById("grossFields").style.display = showGross ? "block" : "none";
    document.getElementById("netField").style.display = showGross ? "none" : "block";
  }

  const defaults = {
    loc: [],
    yrs: yrsInput.value,
    startYear: startYearInput.value,
    size: sizeInput.value,
    type: typeSel.value,
    rooms: roomsInput.value,
    garden: gardenChk.checked,
    terrace: terraceChk.checked,
    patio: patioChk.checked,
    basement: basementChk.checked,
    salaryType: salaryTypeSel.value,
    salary: salaryInput.value,
    gross: grossInput.value,
    periods: periodsInput.value,
    irpf: irpfSelect.value,
    rate: 40,
    expense: 800,
    useExpense: useExpenseChk.checked,
    ret: retInput.value,
    inflFloor: inflFloorInput.value,
    downPct: downPctInput.value,
    scenario: scenarioSel.value,
    career: careerSel.value,
    changeYear: changeYearInput.value,
    newCareer: newCareerSel.value,
    propMetric: propMetricSel.value,
    persMetric: persMetricSel.value,
    mortRate: mortRateInput.value,
    mortYears: mortYearsInput.value,
    initSavings: initSavingsInput.value,
    theme: document.documentElement.dataset.theme || "dark",
    saveNodes: [],
    expenseNodes: [],
  };

  /**
   * Load saved user settings from localStorage, if any, including
   * the interface theme and starting year.
   */
  function loadState() {
    const raw = localStorage.getItem("calcState");
    if (!raw) return;
    try {
      const state = JSON.parse(raw);
      if (Array.isArray(state.loc)) {
        [...locSel.options].forEach((o) => {
          o.selected = state.loc.includes(o.value);
        });
      }
      if (state.theme) {
        document.documentElement.dataset.theme = state.theme;
      }
      updateThemeLabel();
      Object.keys(defaults).forEach((k) => {
        if (k === "loc" || k === "saveNodes" || k === "expenseNodes") return;
        const el = document.getElementById(k);
        if (el && state[k] !== undefined) {
          if (el.type === "checkbox") {
            el.checked = state[k];
          } else {
            el.value = state[k];
          }
        }
      });
      if (Array.isArray(state.saveNodes)) {
        saveNodes = state.saveNodes;
      }
      if (Array.isArray(state.expenseNodes)) {
        expenseNodes = state.expenseNodes;
      }
      updateSalaryFields();
      buildCurveUI();
      buildExpenseUI();

    } catch (_) {
      // ignore broken data
    }
  }

  /**
   * Save current settings, including theme selection and starting year,
   * to localStorage. This runs whenever an input changes so the
   * latest state survives page reloads.
   */
  function saveState() {
    const state = {};
    state.loc = [...locSel.selectedOptions].map((o) => o.value);
    Object.keys(defaults).forEach((k) => {
      if (k === "loc" || k === "saveNodes" || k === "expenseNodes") return;
      const el = document.getElementById(k);
      if (el) {
        state[k] = el.type === "checkbox" ? el.checked : el.value;
      }
    });
    state.saveNodes = saveNodes;
    state.expenseNodes = expenseNodes;
    state.theme = document.documentElement.dataset.theme || "dark";
    localStorage.setItem("calcState", JSON.stringify(state));
  }

function computeCurve(yrs) {
  savingsCurve = [];
  for (let y = 0; y <= yrs; y++) {
    const left = saveNodes.filter((n) => n.year <= y).slice(-1)[0];
    const right =
      saveNodes.find((n) => n.year >= y) ||
      left ||
      { year: y, rate: toNum(defaults.rate) };
    if (!left) {
      savingsCurve.push(toNum(right.rate));
      continue;
    }
    const l = toNum(left.rate);
    const r = toNum(right.rate);
    if (left.year === right.year) {
      savingsCurve.push(l);
    } else {
      const t = (y - left.year) / (right.year - left.year);
      savingsCurve.push(l + t * (r - l));
    }
  }
}

function computeExpenseCurve(yrs) {
  expenseCurve = [];
  for (let y = 0; y <= yrs; y++) {
    const left = expenseNodes.filter((n) => n.year <= y).slice(-1)[0];
    const right =
      expenseNodes.find((n) => n.year >= y) ||
      left ||
      { year: y, val: toNum(defaults.expense) };
    if (!left) {
      expenseCurve.push(toNum(right.val));
      continue;
    }
    const l = toNum(left.val);
    const r = toNum(right.val);
    if (left.year === right.year) {
      expenseCurve.push(l);
    } else {
      const t = (y - left.year) / (right.year - left.year);
      expenseCurve.push(l + t * (r - l));
    }
  }
}

function buildCurveUI() {
  const yrs = toNum(yrsInput.value);
  const base = toNum(saveNodes[0]?.rate ?? defaults.rate);
  if (useExpenseChk.checked) {
    curveContainer.classList.add("hidden");
    if (curveChart) {
      curveChart.destroy();
      curveChart = null;
    }
    savingsCurve = [];
    return;
  }
  curveContainer.classList.remove("hidden");
  if (
    !saveNodes.length ||
    saveNodes.at(-1).year !== yrs ||
    base !== buildCurveUI.base
  ) {
    saveNodes = [
      { year: 0, rate: base },
      { year: yrs, rate: base },
    ];
  }
  buildCurveUI.base = base;
  computeCurve(yrs);
  const labels = Array.from({ length: yrs + 1 }, (_, i) => i);
  if (curveChart) {
    curveChart.data.labels = labels;
    curveChart.data.datasets[0].data = savingsCurve;
    curveChart.options.scales.x.max = yrs;
    curveChart.update();
    return;
  }
  curveChart = new Chart(curveContainer, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Save %",
          data: savingsCurve,
          borderColor: "#22c55e",
          tension: 0.4,
          pointRadius: 4,
        },
      ],
    },
    options: {
      animation: false,
      interaction: { mode: "nearest", intersect: false },
      scales: { x: { min: 0, max: yrs }, y: { min: 0, max: 100 } },
    },
  });
  curveContainer.addEventListener("click", (evt) => {
    const x = curveChart.scales.x.getValueForPixel(evt.offsetX);
    const y = curveChart.scales.y.getValueForPixel(evt.offsetY);
    const yr = Math.round(Math.min(Math.max(x, 0), yrs));
    const rate = Math.round(Math.min(Math.max(y, 0), 100));
    let idx = saveNodes.findIndex((n) => n.year === yr);
    if (idx !== -1) {
      saveNodes[idx].rate = rate;
    } else {
      saveNodes.push({ year: yr, rate });
      saveNodes.sort((a, b) => a.year - b.year);
      idx = saveNodes.findIndex((n) => n.year === yr);
    }
    for (let i = idx + 1; i < saveNodes.length; i++) {
      saveNodes[i].rate = rate;
    }
    computeCurve(yrs);
    curveChart.data.datasets[0].data = savingsCurve;
    curveChart.update();
    autoCalc();
  });

  curveContainer.addEventListener("mousedown", (evt) => {
    const x = curveChart.scales.x.getValueForPixel(evt.offsetX);
    const yrs = toNum(yrsInput.value);
    const yr = Math.round(Math.min(Math.max(x, 0), yrs));
    const idx = saveNodes.findIndex((n) => n.year === yr);
    const pointX = curveChart.scales.x.getPixelForValue(yr);
    if (Math.abs(evt.offsetX - pointX) > 8 || idx === -1) {
      return;
    }
    draggingIdx = idx;
    const onMove = (moveEvt) => {
      if (draggingIdx === null) return;
      const rect = curveContainer.getBoundingClientRect();
      const y = moveEvt.clientY - rect.top;
      const val = curveChart.scales.y.getValueForPixel(y);
      const rate = Math.round(Math.min(Math.max(val, 0), 100));
      saveNodes[draggingIdx].rate = rate;
      for (let i = draggingIdx + 1; i < saveNodes.length; i++) {
        saveNodes[i].rate = rate;
      }
      computeCurve(toNum(yrsInput.value));
      curveChart.data.datasets[0].data = savingsCurve;
      curveChart.update();
      autoCalc();
    };
    const onUp = () => {
      draggingIdx = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

function buildExpenseUI() {
  const yrs = toNum(yrsInput.value);
  if (!useExpenseChk.checked) {
    expenseCurveContainer.classList.add("hidden");
    if (expenseChart) {
      expenseChart.destroy();
      expenseChart = null;
    }
    expenseCurve = [];
    return;
  }
  expenseCurveContainer.classList.remove("hidden");
  const base = toNum(expenseNodes[0]?.val ?? defaults.expense);
  if (
    !expenseNodes.length ||
    expenseNodes.at(-1).year !== yrs ||
    base !== buildExpenseUI.base
  ) {
    expenseNodes = [
      { year: 0, val: base },
      { year: yrs, val: base },
    ];
  }
  buildExpenseUI.base = base;
  computeExpenseCurve(yrs);
  const labels = Array.from({ length: yrs + 1 }, (_, i) => i);
  if (expenseChart) {
    expenseChart.data.labels = labels;
    expenseChart.data.datasets[0].data = expenseCurve;
    expenseChart.options.scales.x.max = yrs;
    expenseChart.update();
    return;
  }
  expenseChart = new Chart(expenseCurveContainer, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Gasto €",
          data: expenseCurve,
          borderColor: "#f87171",
          tension: 0.4,
          pointRadius: 4,
        },
      ],
    },
    options: {
      animation: false,
      interaction: { mode: "nearest", intersect: false },
      scales: { x: { min: 0, max: yrs }, y: { min: 0, max: 3000 } },
    },
  });
  expenseCurveContainer.addEventListener("click", (evt) => {
    const x = expenseChart.scales.x.getValueForPixel(evt.offsetX);
    const y = expenseChart.scales.y.getValueForPixel(evt.offsetY);
    const yr = Math.round(Math.min(Math.max(x, 0), yrs));
    const val = Math.round(Math.min(Math.max(y, 0), 3000));
    let idx = expenseNodes.findIndex((n) => n.year === yr);
    if (idx !== -1) {
      expenseNodes[idx].val = val;
    } else {
      expenseNodes.push({ year: yr, val });
      expenseNodes.sort((a, b) => a.year - b.year);
      idx = expenseNodes.findIndex((n) => n.year === yr);
    }
    for (let i = idx + 1; i < expenseNodes.length; i++) {
      expenseNodes[i].val = val;
    }
    computeExpenseCurve(yrs);
    expenseChart.data.datasets[0].data = expenseCurve;
    expenseChart.update();
    autoCalc();
  });

  expenseCurveContainer.addEventListener("mousedown", (evt) => {
    const x = expenseChart.scales.x.getValueForPixel(evt.offsetX);
    const yr = Math.round(Math.min(Math.max(x, 0), yrs));
    const idx = expenseNodes.findIndex((n) => n.year === yr);
    const pointX = expenseChart.scales.x.getPixelForValue(yr);
    if (Math.abs(evt.offsetX - pointX) > 8 || idx === -1) return;
    expenseDraggingIdx = idx;
    const onMove = (moveEvt) => {
      if (expenseDraggingIdx === null) return;
      const rect = expenseCurveContainer.getBoundingClientRect();
      const y = moveEvt.clientY - rect.top;
      const val = expenseChart.scales.y.getValueForPixel(y);
      const v = Math.round(Math.min(Math.max(val, 0), 3000));
      expenseNodes[expenseDraggingIdx].val = v;
      for (let i = expenseDraggingIdx + 1; i < expenseNodes.length; i++) {
        expenseNodes[i].val = v;
      }
      computeExpenseCurve(toNum(yrsInput.value));
      expenseChart.data.datasets[0].data = expenseCurve;
      expenseChart.update();
      autoCalc();
    };
    const onUp = () => {
      expenseDraggingIdx = null;
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

  [yrsInput, startYearInput, useExpenseChk].forEach((el) => {
    const handler = () => {
      yrsLabel.textContent = yrsInput.value;
      buildCurveUI();
      buildExpenseUI();
      autoCalc();
    };
    el.addEventListener("input", handler);
    el.addEventListener("change", handler);
  });

  const autoFields = [
    locSel,
    typeSel,
    roomsInput,
    gardenChk,
    terraceChk,
    patioChk,
    basementChk,
    sizeInput,
    salaryInput,
    salaryTypeSel,
    grossInput,
    periodsInput,
    irpfSelect,
    useExpenseChk,
    retInput,
    inflFloorInput,
    scenarioSel,
    careerSel,
    changeYearInput,
    newCareerSel,
    persMetricSel,
    initSavingsInput,
    mortRateInput,
    mortYearsInput,
    downPctInput,
  ];
  autoFields.forEach((el) => {
    el.addEventListener("input", autoCalc);
    el.addEventListener("change", autoCalc);
  });

  salaryTypeSel.addEventListener("change", () => {
    updateSalaryFields();
    autoCalc();
  });

  const palette = [
    "#f87171",
    "#fbbf24",
    "#34d399",
    "#60a5fa",
    "#c084fc",
    "#f472b6",
    "#facc15",
    "#38bdf8",
    "#818cf8",
    "#a3e635",
    "#f97316",
    "#ef4444",
  ];

  /**
   * Return a lighter variant of a hex color.
   * @param {string} hex Original color like "#ff0000".
   * @param {number} amount Blend ratio with white (0-1).
   */
  function lightenColor(hex, amount = 0.5) {
    const num = parseInt(hex.slice(1), 16);
    const r = Math.min(255, (num >> 16) + Math.round((255 - (num >> 16)) * amount));
    const g = Math.min(
      255,
      ((num >> 8) & 0xff) + Math.round((255 - ((num >> 8) & 0xff)) * amount),
    );
    const b = Math.min(255, (num & 0xff) + Math.round((255 - (num & 0xff)) * amount));
    return `rgb(${r}, ${g}, ${b})`;
  }

  const lineLabelPlugin = {
    id: "lineLabel",
    afterDatasetsDraw(chart) {
      const { ctx } = chart;
      ctx.save();
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `${Chart.defaults.font.size}px ${Chart.defaults.font.family}`;
      chart.getSortedVisibleDatasetMetas().forEach((meta) => {
        const ds = meta.dataset;
        const point = meta.data[meta.data.length - 1];
        if (point) {
          ctx.fillStyle = ds.borderColor || "#e5e5e5";
          ctx.fillText(ds.label, point.x + 6, point.y);
        }
      });
      ctx.restore();
    },
  };
  Chart.register(lineLabelPlugin);
  let chart;
  let lastCalc;
  let savingsCurve = [];
  let saveNodes = [];
  let curveChart;
  let draggingIdx = null;
  let expenseCurve = [];
  let expenseNodes = [];
  let expenseChart;
  let expenseDraggingIdx = null;

  function growth(y) {
    const change = toNum(changeYearInput.value) - toNum(startYearInput.value);
    const sched =
      y >= change ? CAREERS[newCareerSel.value].growth : CAREERS[careerSel.value].growth;
    if (y < 5) {
      return sched[0];
    } else if (y < 10) {
      return sched[1];
    }
    return sched[2];
  }

  /**
   * Return inflation for the given year.
   * Inflation gradually decreases after year 4 until reaching
   * the supplied floor value.
   */
  function inflationFor(year, base, floor) {
    if (year < 5) {
      return base;
    }
    const reduced = base - 0.005 * (year - 4);
    return Math.max(reduced, floor);
  }

  function mortPayment(principal, ratePct, years) {
    const r = ratePct / 100 / 12;
    const n = years * 12;
    if (r === 0) {
      return principal / n;
    }
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

  /**
   * Calculate projection data and update the chart.
   * The starting year is configurable via the "startYear" input.
   */
  function calc() {
    const raw = [...locSel.selectedOptions].map((o) => o.value);

    const groups = raw.filter((v) => GROUPS[v]);
    let indiv = raw.filter((v) => !GROUPS[v]);
    // si se elige grupo, ignorar sus hijos
    indiv = indiv.filter(
      (name) => !groups.some((g) => GROUPS[g].includes(name)),
    );

    if (!raw.length) {
      alert("Selecciona al menos uno");
      return;
    }

    const yrs = toNum(yrsInput.value);
    const m2 = toNum(sizeInput.value);
    const base =
      salaryTypeSel.value === "net"
        ? toNum(salaryInput.value)
        : (toNum(grossInput.value) / toNum(periodsInput.value)) *
          (1 - toNum(irpfSelect.value) / 100);
    const saveRates = savingsCurve.length
      ? savingsCurve.map((v) => v / 100)
      : Array.from({ length: yrs + 1 }, () => defaults.rate / 100);
    const useExpense = useExpenseChk.checked;
    const expenseRates = expenseCurve.length
      ? expenseCurve
      : Array.from({ length: yrs + 1 }, () => defaults.expense);
    const ret = toNum(retInput.value) / 100;
    const inflFloor = toNum(inflFloorInput.value) / 100;
    const downPct = toNum(downPctInput.value) / 100;
    const propMetric = propMetricSel.value;
    const persMetric = persMetricSel.value;
  const mortRate = toNum(mortRateInput.value);
  const mortYears = toNum(mortYearsInput.value);
  const dwType = typeSel.value;
  const rooms = toNum(roomsInput.value);
  const extras = {
    garden: gardenChk.checked,
    terrace: terraceChk.checked,
    patio: patioChk.checked,
    basement: basementChk.checked,
  };
  // Features modify the base price via predefined multipliers.

    const startYear = toNum(startYearInput.value);
    const labels = Array.from({ length: yrs + 1 }, (_, i) => startYear + i);

    // personal metrics
    let stash = toNum(initSavingsInput.value);
    let net = base;
    const savingsArr = [];
    const salaryArr = [];
    for (let y = 0; y <= yrs; y++) {
      if (y) {
        net *= 1 + growth(y - 1);
      }
      salaryArr.push(Math.round(net));
      stash *= 1 + ret;
      if (useExpense) {
        const exp = expenseRates[y] ?? expenseRates[expenseRates.length - 1];
        stash += Math.max((net - exp) * 12, 0);
      } else {
        const sr = saveRates[y] ?? saveRates[saveRates.length - 1];
        stash += net * sr * 12;
      }
      savingsArr.push(Math.round(stash));
    }

    const datasets = [];
    const downMap = {};
    // personal
    if (persMetric === "savings") {
      datasets.push({
        label: "Savings €",
        data: savingsArr,
        borderColor: "#22c55e",
        tension: 0.2,
        borderWidth: 2,
      });
    } else if (persMetric === "monthlySavings") {
      const monthly = salaryArr.map((s, i) => Math.round(s * saveRates[i]));
      datasets.push({
        label: "Monthly savings €",
        data: monthly,
        borderColor: "#a3e635",
        tension: 0.2,
        borderWidth: 2,
      });
    } else {
      datasets.push({
        label: "Net salary €/mo",
        data: salaryArr,
        borderColor: "#22d3ee",
        tension: 0.2,
        borderWidth: 2,
      });
    }

    let gapYear = null;

    // Helper to build a price array using inflation and feature adjustments
    function priceArrFor(name, infl, floor, size, type, rooms, extras) {
      const d = LOCATIONS[name];
      let base = d.price * (DWELLING_FACTORS[type] || 1);
      base *= 1 + (rooms - ROOMS_BASE) * ROOM_FACTOR;
      if (extras.garden) base *= 1 + EXTRA_FACTORS.garden;
      if (extras.terrace) base *= 1 + EXTRA_FACTORS.terrace;
      if (extras.patio) base *= 1 + EXTRA_FACTORS.patio;
      if (extras.basement) base *= 1 + EXTRA_FACTORS.basement;
      const arr = [base * size];
      let price = base;
      for (let y = 1; y <= yrs; y++) {
        price *= 1 + inflationFor(y, infl, floor);
        arr.push(price * size);
      }
      return arr;
    }

    const mode = scenarioSel.value;

    // procesar grupos
    groups.forEach((g, gi) => {
      const kids = GROUPS[g];
      // arrays de cada hijo
      const allKidsArr = kids.map((kid) => {
        const d = LOCATIONS[kid];
        const infl =
          mode === "optimistic"
            ? d.inflLow
            : mode === "pessimistic"
              ? d.inflHigh
              : d.inflMid;
        return priceArrFor(kid, infl, inflFloor, m2, dwType, rooms, extras);
      });
      // media elemento a elemento
      const avgPrice = allKidsArr[0].map((_, idx) => {
        const sum = allKidsArr.reduce((s, arr) => s + arr[idx], 0);
        return sum / kids.length;
      });
      let propArr, label;
      const downArr = avgPrice.map((v) => v * downPct);
      downMap[g.replace("grupo_", "")] = downArr;
      if (propMetric === "price") {
        propArr = avgPrice.map((v) => Math.round(v));
        label = `${g.replace("grupo_", "")} price €`;
      } else if (propMetric === "down") {
        propArr = avgPrice.map((v) => Math.round(v * downPct));
        label = `${g.replace("grupo_", "")} down ${downPct * 100}% €`;
      } else {
        propArr = avgPrice.map((v) =>
          Math.round(mortPayment(v * (1 - downPct), mortRate, mortYears)),
        );
        label = `${g.replace("grupo_", "")} mortgage €/mo`;
      }
      const color = palette[(indiv.length + gi) % palette.length];
      const ds = {
        label,
        data: propArr,
        borderColor: color,
        tension: 0.2,
        borderWidth: 2,
      };
      if (propMetric === "down" && persMetric === "savings") {
        ds.segment = {
          borderColor: (ctx) => {
            const idx = ctx.p0DataIndex;
            const val = ctx.dataset.data[idx];
            return savingsArr[idx] < val ? lightenColor(color, 0.6) : color;
          },
        };
      }
      datasets.push(ds);
    });

    // procesar individuales
    indiv.forEach((name, i) => {
      const d = LOCATIONS[name];
      const infl =
        mode === "optimistic"
          ? d.inflLow
          : mode === "pessimistic"
            ? d.inflHigh
            : d.inflMid;
      const priceArr = priceArrFor(name, infl, inflFloor, m2, dwType, rooms, extras);
      let propArr, label;
      const downArr = priceArr.map((v) => v * downPct);
      downMap[name] = downArr;
      if (propMetric === "price") {
        propArr = priceArr.map((v) => Math.round(v));
        label = `${name} price €`;
      } else if (propMetric === "down") {
        propArr = priceArr.map((v) => Math.round(v * downPct));
        label = `${name} down ${downPct * 100}% €`;
      } else {
        propArr = priceArr.map((v) =>
          Math.round(mortPayment(v * (1 - downPct), mortRate, mortYears)),
        );
        label = `${name} mortgage €/mo`;
      }
      const color2 = palette[i % palette.length];
      const ds2 = {
        label,
        data: propArr,
        borderColor: color2,
        tension: 0.2,
        borderWidth: 2,
      };
      if (propMetric === "down" && persMetric === "savings") {
        ds2.segment = {
          borderColor: (ctx) => {
            const idx = ctx.p0DataIndex;
            const val = ctx.dataset.data[idx];
            return savingsArr[idx] < val ? lightenColor(color2, 0.6) : color2;
          },
        };
      }
      datasets.push(ds2);
    });

    const propDataset = datasets[1];

    if (propMetric === "down" && persMetric === "savings" && propDataset) {
      const downData = propDataset.data;
      const gapData = downData.map((v, idx) => savingsArr[idx] - v);
      const reachIdx = gapData.findIndex((v) => v >= 0);
      if (reachIdx >= 0) {
        gapYear = labels[reachIdx];
      }
      // The gap curve has been removed. It now only informs the goal year.
    }

    if (persMetric === "ratio" && propDataset) {
      const priceData = propDataset.data;
      const ratioData = priceData.map((v, idx) =>
        Math.round(v / (salaryArr[idx] * 12)),
      );
      datasets.push({
        label: `${propDataset.label} / salary yrs`,
        data: ratioData,
        borderColor: "#facc15",
        tension: 0.2,
        borderWidth: 2,
      });
    }

    const matchesByYear = labels.map(() => []);
    Object.entries(downMap).forEach(([name, arr]) => {
      arr.forEach((val, idx) => {
        if (Math.abs(val - savingsArr[idx]) / val <= 0.08) {
          matchesByYear[idx].push(name);
        }
      });
    });

    lastCalc = {
      labels: [...labels],
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: [...ds.data],
      })),
    };

    // summary y render idéntico al anterior...
    const propVal = propDataset ? propDataset.data.at(-1) : 0;
    let personalVal;
    if (persMetric === "savings") {
      personalVal = savingsArr.at(-1);
    } else if (persMetric === "monthlySavings") {
      personalVal = Math.round(salaryArr.at(-1) * saveRates.at(-1));
    } else {
      personalVal = salaryArr.at(-1);
    }
    let summaryHTML = "";
    if (propMetric === "down") {
      const ok = personalVal >= propVal;
      summaryHTML =
        `Necesitas ${propVal.toLocaleString()}€ ` +
        `para la entrada (${downPct * 100}%).<br>` +
        `${
          persMetric === "savings"
            ? "Ahorros"
            : persMetric === "monthlySavings"
              ? "Ahorro mensual"
              : "Salario"
        } tras ${yrs} años: ` +
        `<span style="color:${
          ok ? "var(--good)" : "var(--bad)"
        }">${personalVal.toLocaleString()}€</span>`;
      if (gapYear) {
        summaryHTML += `<br>Entrada alcanzada en ${gapYear}`;
      }
    } else if (propMetric === "mortgage") {
      const ok = personalVal * 0.35 >= propVal;
      summaryHTML =
        `Cuota estimada: ${propVal.toLocaleString()}€ / mes.<br>` +
        `Salario final: ` +
        `<span style="color:${ok ? "var(--good)" : "var(--bad)"}">${salaryArr
          .at(-1)
          .toLocaleString()}€ / mes</span>`;
    } else {
      summaryHTML =
        `Precio estimado en ${yrs} años: ` + `${propVal.toLocaleString()}€`;
    }
    document.getElementById("summary").innerHTML = summaryHTML;

    if (chart) chart.destroy();
    chart = new Chart(document.getElementById("chart"), {
      type: "line",
      data: { labels, datasets },
      options: {
        animation: false,
        plugins: {
          legend: {
            labels: {
              color: "#e5e5e5",
            },
          },
        },
        scales: {
          x: {
            ticks: { color: "#e5e5e5" },
          },
          y: {
            ticks: { color: "#e5e5e5" },
          },
        },
      },
    });

    const matchesHTML =
      "<table><tr>" +
      labels.map((y) => `<th>${y}</th>`).join("") +
      "</tr><tr>" +
      matchesByYear
        .map((m) => `<td>${m.join(", ") || "&nbsp;"}</td>`)
        .join("") +
      "</tr></table>";
    document.getElementById("matches").innerHTML = matchesHTML;
  }

  /**
   * Download the last calculated dataset as a CSV file.
   */
  function exportCSV() {
    if (!lastCalc) return;
    const header = ["Year", ...lastCalc.datasets.map((d) => d.label)].join(",");
    const rows = lastCalc.labels.map((year, idx) => {
      const values = lastCalc.datasets.map((d) => d.data[idx]);
      return [year, ...values].join(",");
    });
    const csv = [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "projection.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }


  csvBtn.addEventListener("click", exportCSV);

  themeToggle.addEventListener("click", () => {
    const current = document.documentElement.dataset.theme;
    const next = current === "light" ? "dark" : "light";
    document.documentElement.dataset.theme = next;
    updateThemeLabel();
    saveState();
  });

  resetBtn.addEventListener("click", () => {
    localStorage.removeItem("calcState");
    Object.keys(defaults).forEach((k) => {
      if (k === "loc") {
        [...locSel.options].forEach((o) => (o.selected = false));
        return;
      }
      const el = document.getElementById(k);
      if (el) {
        if (el.type === "checkbox") {
          el.checked = defaults[k];
        } else {
          el.value = defaults[k];
        }
      }
    });
    document.documentElement.dataset.theme = defaults.theme;
    updateThemeLabel();
    updateSalaryFields();
    savingsCurve = [];
    saveNodes = [];
    expenseCurve = [];
    expenseNodes = [];
    buildCurveUI();
    buildExpenseUI();
    calc();
  });

  loadState();
  updateSalaryFields();
  updateThemeLabel();
  buildCurveUI();
  buildExpenseUI();
  calc();
})();
