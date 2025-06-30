/**
 * Housing affordability calculator logic.
 * Updates charts based on user input.
 */
(() => {
  "use strict";
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

  const CAREERS = {
    stay: { growth: [0.05, 0.03, 0.02] },
    odoo: { growth: [0.1, 0.05, 0.03] },
    ai: { growth: [0.15, 0.08, 0.04] },
  };

  /* refs */
  const locSel = document.getElementById("loc");
  const yrsInput = document.getElementById("yrs");
  const yrsLabel = document.getElementById("yrsLabel");
  const sizeInput = document.getElementById("size");
  const salaryInput = document.getElementById("salary");
  const rateInput = document.getElementById("rate");
  const rateLabel = document.getElementById("rateLabel");
  const retInput = document.getElementById("ret");
  const scenarioSel = document.getElementById("scenario");
  const careerSel = document.getElementById("career");
  const propMetricSel = document.getElementById("propMetric");
  const persMetricSel = document.getElementById("persMetric");
  const mortRateInput = document.getElementById("mortRate");
  const mortYearsInput = document.getElementById("mortYears");

  [yrsInput, rateInput].forEach((el) => {
    el.addEventListener("input", () => {
      yrsLabel.textContent = yrsInput.value;
      rateLabel.textContent = rateInput.value;
    });
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
  let chart;

  function growth(y) {
    const g = CAREERS[careerSel.value].growth;
    if (y < 5) {
      return g[0];
    } else if (y < 10) {
      return g[1];
    }
    return g[2];
  }

  // Return a yearly inflation adjusting long-term expectations.
  function inflationFor(year, base) {
    if (year < 5) {
      return base;
    }
    const reduced = base - 0.005 * (year - 4);
    return Math.max(reduced, 0.02);
  }

  function mortPayment(principal, ratePct, years) {
    const r = ratePct / 100 / 12;
    const n = years * 12;
    if (r === 0) {
      return principal / n;
    }
    return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
  }

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

    const yrs = +yrsInput.value;
    const m2 = +sizeInput.value;
    const base = +salaryInput.value;
    const saveRate = +rateInput.value / 100;
    const ret = +retInput.value / 100;
    const propMetric = propMetricSel.value;
    const persMetric = persMetricSel.value;
    const mortRate = +mortRateInput.value;
    const mortYears = +mortYearsInput.value;

    const labels = Array.from({ length: yrs + 1 }, (_, i) => 2025 + i);

    // métricas personales
    let stash = 3000;
    let net = base;
    const savingsArr = [];
    const salaryArr = [];
    for (let y = 0; y <= yrs; y++) {
      if (y) {
        net *= 1 + growth(y - 1);
      }
      salaryArr.push(Math.round(net));
      stash *= 1 + ret;
      stash += net * saveRate * 12;
      savingsArr.push(Math.round(stash));
    }

    const datasets = [];
    // personal
    if (persMetric === "savings") {
      datasets.push({
        label: "Savings €",
        data: savingsArr,
        borderColor: "#22c55e",
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

    // función auxiliar para array de precio según infl
    function priceArrFor(name, infl) {
      const d = LOCATIONS[name];
      const arr = [d.price * m2];
      let price = d.price;
      for (let y = 1; y <= yrs; y++) {
        price *= 1 + inflationFor(y, infl);
        arr.push(price * m2);
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
        return priceArrFor(kid, infl);
      });
      // media elemento a elemento
      const avgPrice = allKidsArr[0].map((_, idx) => {
        const sum = allKidsArr.reduce((s, arr) => s + arr[idx], 0);
        return sum / kids.length;
      });
      let propArr, label;
      if (propMetric === "price") {
        propArr = avgPrice.map((v) => Math.round(v));
        label = `${g.replace("grupo_", "")} price €`;
      } else if (propMetric === "down") {
        propArr = avgPrice.map((v) => Math.round(v * 0.2));
        label = `${g.replace("grupo_", "")} down 20% €`;
      } else {
        propArr = avgPrice.map((v) =>
          Math.round(mortPayment(v * 0.8, mortRate, mortYears)),
        );
        label = `${g.replace("grupo_", "")} mortgage €/mo`;
      }
      datasets.push({
        label,
        data: propArr,
        borderColor: palette[(indiv.length + gi) % palette.length],
        tension: 0.2,
        borderWidth: 2,
      });
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
      const priceArr = priceArrFor(name, infl);
      let propArr, label;
      if (propMetric === "price") {
        propArr = priceArr.map((v) => Math.round(v));
        label = `${name} price €`;
      } else if (propMetric === "down") {
        propArr = priceArr.map((v) => Math.round(v * 0.2));
        label = `${name} down 20% €`;
      } else {
        propArr = priceArr.map((v) =>
          Math.round(mortPayment(v * 0.8, mortRate, mortYears)),
        );
        label = `${name} mortgage €/mo`;
      }
      datasets.push({
        label,
        data: propArr,
        borderColor: palette[i % palette.length],
        tension: 0.2,
        borderWidth: 2,
      });
    });

    // summary y render idéntico al anterior...
    const propVal = datasets[1].data.at(-1);
    const personalVal =
      persMetric === "savings" ? savingsArr.at(-1) : salaryArr.at(-1);
    let summaryHTML = "";
    if (propMetric === "down") {
      const ok = personalVal >= propVal;
      summaryHTML =
        `Necesitas ${propVal.toLocaleString()}€ ` +
        `para la entrada.<br>` +
        `${
          persMetric === "savings" ? "Ahorros" : "Salario"
        } tras ${yrs} años: ` +
        `<span style="color:${
          ok ? "var(--good)" : "var(--bad)"
        }">${personalVal.toLocaleString()}€</span>`;
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
  }

  document.getElementById("update").addEventListener("click", calc);
  calc();
})();
