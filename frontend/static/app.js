(() => {
  const THEME_KEY = "heartcare-theme";

  const MODEL_META = {
    adaboost: {
      name: "RBM",
      accuracy: 0.85,
      bullets: [
        "Learns hidden patterns (latent features) from patient data",
        "Useful as feature-learning / pretraining before classification",
        "Can help when labeled data is limited",
      ],
      bestFor: "Unsupervised feature learning",
    },
    catboost: {
      name: "FNN",
      accuracy: 0.88,
      bullets: [
        "Feedforward (MLP) network for tabular risk prediction",
        "Learns non-linear relationships between clinical features",
        "Works well with scaling + regularization to reduce overfitting",
      ],
      bestFor: "Tabular classification",
    },
    xgboost: {
      name: "LSTM",
      accuracy: 0.90,
      bullets: [
        "Sequence model that captures time-based patterns",
        "Best when inputs are ordered (visits/vitals/labs over time)",
        "Not required for single-row tabular data",
      ],
      bestFor: "Sequential / time-series data",
    },
    combined_rbm: {
      name: "LSTM + RBM",
      accuracy: 0.8,
      bullets: [
        "Fuses RBM+RF probability (30%) with LSTM on scaled features reshaped as a sequence (70%)",
        "Reported validation accuracy: 80%",
        "Useful when you want both tree/stacked latent structure and recurrent signal in one score",
      ],
      bestFor: "Balanced hybrid screening",
    },
    combined_fnn: {
      name: "LSTM + FNN",
      accuracy: 0.78,
      bullets: [
        "Blends dense FNN output (60%) with LSTM probability (40%) on the same scaled row",
        "Reported validation accuracy: 78%",
        "Emphasizes feedforward non-linear fits while still using sequence-style LSTM context",
      ],
      bestFor: "Dense nets plus sequence head",
    },
    combined_xgb: {
      name: "LSTM + XGBoost",
      accuracy: 0.88,
      bullets: [
        "Weighted mix: XGBoost class probability (60%) + LSTM (40%) after scaling",
        "Reported validation accuracy: 88%",
        "Strong gradient-boosted splits paired with LSTM’s reshaped feature trajectory",
      ],
      bestFor: "High reported accuracy in this study",
    },
    combined_rbm_fnn: {
      name: "RBM + FNN",
      accuracy: 0.77,
      bullets: [
        "Combines RBM+RF score (20%) with FNN prediction (80%) on scaled tabular input",
        "Reported validation accuracy: 77%",
        "Favors the neural head while anchoring with the RBM+RF likelihood",
      ],
      bestFor: "Lightweight two-model stack",
    },
    combined_rbm_xgb_soft: {
      name: "RBM + XGBoost",
      accuracy: 0.86,
      bullets: [
        "Soft fusion: XGBoost (80%) + RBM+RF (20%) on standardized features",
        "Reported validation accuracy: 86%",
        "Boosted trees lead; RBM+RF nudges boundary cases",
      ],
      bestFor: "Tree-heavy with RBM regularization",
    },
    combined_fnn_xgb: {
      name: "FNN + XGBoost",
      accuracy: 0.85,
      bullets: [
        "Ensemble of XGBoost (70%) and FNN (30%) probabilities on scaled data",
        "Reported validation accuracy: 85%",
        "Merges gradient boosting with a complementary neural baseline",
      ],
      bestFor: "Boosting + neural blend",
    },
  };

  /** Order for Model Info chart and quick-compare cards (matches Predict page hybrids). */
  const HYBRID_MODEL_ORDER = [
    "combined_rbm",
    "combined_fnn",
    "combined_xgb",
    "combined_rbm_fnn",
    "combined_rbm_xgb_soft",
    "combined_fnn_xgb",
  ];

  const HYBRID_CHART_COLORS = {
    bg: [
      "rgba(56,189,248,.62)",
      "rgba(34,197,94,.58)",
      "rgba(251,113,133,.55)",
      "rgba(251,191,36,.58)",
      "rgba(167,139,250,.58)",
      "rgba(59,130,246,.55)",
    ],
    border: [
      "rgba(56,189,248,.95)",
      "rgba(34,197,94,.92)",
      "rgba(251,113,133,.88)",
      "rgba(251,191,36,.92)",
      "rgba(167,139,250,.90)",
      "rgba(59,130,246,.88)",
    ],
  };

  /** Demo validation counts (n=100 each); replace with real eval when available. */
  const CONFUSION_BY_HYBRID = {
    combined_rbm: { tn: 40, fp: 12, fn: 8, tp: 40 },
    combined_fnn: { tn: 39, fp: 15, fn: 7, tp: 39 },
    combined_xgb: { tn: 44, fp: 6, fn: 6, tp: 44 },
    combined_rbm_fnn: { tn: 38, fp: 15, fn: 8, tp: 39 },
    combined_rbm_xgb_soft: { tn: 43, fp: 7, fn: 7, tp: 43 },
    combined_fnn_xgb: { tn: 42, fp: 8, fn: 7, tp: 43 },
  };

  function el(id) {
    return document.getElementById(id);
  }

  function getChartThemeColors() {
    const root = document.documentElement;
    const s = getComputedStyle(root);
    const ink = (s.getPropertyValue("--chart-ink") || "").trim() || "rgba(11,15,26,.82)";
    const grid = (s.getPropertyValue("--chart-grid") || "").trim() || "rgba(11,15,26,.10)";
    return { ink, grid };
  }

  function applyTheme(theme) {
    const t = theme === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch (e) {}
  }

  function setupThemeToggle() {
    const btn = el("themeToggle");
    if (!btn) return;

    const syncLabel = () => {
      const dark = document.documentElement.getAttribute("data-theme") === "dark";
      btn.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
      btn.setAttribute("title", dark ? "Light mode" : "Dark mode");
    };
    syncLabel();

    btn.addEventListener("click", () => {
      const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(next);
      syncLabel();
    });
  }

  function setupMobileNav() {
    const menuBtn = el("navMenuBtn");
    const nav = el("primary-nav");
    if (!menuBtn || !nav) return;

    const setOpen = (open) => {
      nav.classList.toggle("is-open", open);
      menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      menuBtn.setAttribute("aria-label", open ? "Close navigation menu" : "Open navigation menu");
    };

    menuBtn.addEventListener("click", () => {
      setOpen(!nav.classList.contains("is-open"));
    });

    nav.querySelectorAll("a").forEach((a) => {
      a.addEventListener("click", () => setOpen(false));
    });

    window.addEventListener("resize", () => {
      if (window.matchMedia("(min-width: 769px)").matches) {
        setOpen(false);
      }
    });
  }

  function pct(n) {
    return `${Math.round(n * 100)}%`;
  }

  function renderModelInfo(modelKey) {
    const info = el("modelInfo");
    if (!info) return;
    const m = MODEL_META[modelKey] ?? MODEL_META.combined_rbm;
    info.innerHTML = `
      <div class="model-row">
        <div class="top">
          <div class="name">${m.name}</div>
          <span class="tag">Accuracy: ${pct(m.accuracy)}</span>
        </div>
        <div class="muted" style="margin-top:6px;font-weight:700;">Best for: ${m.bestFor}</div>
        <ul style="margin:10px 0 0;padding-left:18px;">
          ${m.bullets.map((b) => `<li style="margin:6px 0;">${b}</li>`).join("")}
        </ul>
      </div>
    `;
  }

  function renderModelCards() {
    const root = el("modelCards");
    if (!root) return;

    const order = HYBRID_MODEL_ORDER;
    root.innerHTML = order
      .map((k) => {
        const m = MODEL_META[k];
        return `
          <div class="model-card">
            <h3>${m.name}</h3>
            <div class="muted" style="font-weight:800;margin-bottom:10px;">Accuracy: ${pct(m.accuracy)}</div>
            <ul>
              ${m.bullets.map((b) => `<li>${b}</li>`).join("")}
            </ul>
          </div>
        `;
      })
      .join("");
  }

  function setupLoading() {
    const form = el("predictForm");
    const loading = el("loading");
    if (!form || !loading) return;

    const errBox = el("predictFormError");
    const clearFormError = () => {
      if (!errBox) return;
      errBox.textContent = "";
      errBox.hidden = true;
    };

    form.addEventListener("input", clearFormError);
    form.addEventListener("change", clearFormError);

    form.addEventListener("submit", (e) => {
      if (!form.checkValidity()) {
        e.preventDefault();
        form.reportValidity();
        if (errBox) {
          errBox.textContent = "Please fill in all details before predicting.";
          errBox.hidden = false;
        }
        return;
      }
      clearFormError();
      loading.classList.add("show");
      loading.setAttribute("aria-hidden", "false");
    });

    window.addEventListener("pageshow", () => {
      loading.classList.remove("show");
      loading.setAttribute("aria-hidden", "true");
    });
  }

  function scrollToResultsIfAny() {
    const res = el("results");
    if (!res) return;
    setTimeout(() => {
      res.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 250);
  }

  function setupConfidenceBars() {
    document.querySelectorAll(".progress-bar[data-confidence]").forEach((bar) => {
      const v = parseFloat(String(bar.getAttribute("data-confidence") || "").replace(/%/g, ""));
      if (!Number.isFinite(v)) return;
      bar.style.width = `${Math.min(100, Math.max(0, v))}%`;
    });
  }

  function renderConfusionPanel(modelKey) {
    const panel = el("cmPanel");
    if (!panel) return;

    const key = MODEL_META[modelKey] ? modelKey : "combined_rbm";
    const m = MODEL_META[key];
    const c = CONFUSION_BY_HYBRID[key] || CONFUSION_BY_HYBRID.combined_rbm;
    const { tn, fp, fn, tp } = c;
    const n = tn + fp + fn + tp;
    const acc = n ? ((tn + tp) / n) * 100 : 0;

    panel.innerHTML = `
      <div class="predict-cm-head">Confusion matrix</div>
      <p class="muted predict-cm-note">
        Representative validation counts (n = 100) for this hybrid. Replace with your real TN/FP/FN/TP when available.
      </p>
      <div class="cm-matrix-wrap">
        <table class="cm-matrix">
          <caption>Rows: actual · Columns: predicted</caption>
          <thead>
            <tr>
              <th class="cm-corner" scope="col"></th>
              <th class="cm-axis" scope="col">Pred 0</th>
              <th class="cm-axis" scope="col">Pred 1</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <th class="cm-axis" scope="row">Actual 0</th>
              <td class="cm-cell cm-tn">${tn}<span class="cm-cell-sub">TN</span></td>
              <td class="cm-cell cm-fp">${fp}<span class="cm-cell-sub">FP</span></td>
            </tr>
            <tr>
              <th class="cm-axis" scope="row">Actual 1</th>
              <td class="cm-cell cm-fn">${fn}<span class="cm-cell-sub">FN</span></td>
              <td class="cm-cell cm-tp">${tp}<span class="cm-cell-sub">TP</span></td>
            </tr>
          </tbody>
        </table>
      </div>
      <p class="muted predict-cm-foot">${m.name} · table accuracy ${acc.toFixed(1)}% · reported ${pct(m.accuracy)}</p>
    `;
  }

  function setupPredictConfusionPanel() {
    const btn = el("cmToggleBtn");
    const panel = el("cmPanel");
    if (!btn || !panel) return;

    let visible = false;

    const sync = () => {
      btn.textContent = visible ? "Hide confusion matrix" : "Show confusion matrix";
      btn.setAttribute("aria-expanded", visible ? "true" : "false");
      panel.classList.toggle("is-hidden", !visible);
      panel.setAttribute("aria-hidden", visible ? "false" : "true");
    };

    btn.addEventListener("click", () => {
      visible = !visible;
      if (visible) {
        renderConfusionPanel(el("modelSelect")?.value || "combined_rbm");
      }
      sync();
    });
  }

  /** Model Info: Quick Comparison total height matches Charts card; inner list scrolls if content is taller. */
  function setupModelInfoLayoutSync() {
    const layout = document.querySelector(".layout.models-layout");
    if (!layout) return;

    const chartsCard = layout.querySelector(":scope > .card");
    const qc = layout.querySelector(".quick-compare");
    const qcScroll = layout.querySelector(".quick-compare-scroll");
    if (!chartsCard || !qc || !qcScroll) return;

    const mq = window.matchMedia("(max-width: 980px)");

    const apply = () => {
      if (mq.matches) {
        qc.style.height = "";
        qc.style.overflow = "";
        qcScroll.style.flex = "";
        qcScroll.style.minHeight = "";
        return;
      }
      const h = Math.round(chartsCard.getBoundingClientRect().height);
      if (h < 100) return;
      qc.style.height = `${h}px`;
      qc.style.overflow = "hidden";
      qcScroll.style.flex = "1";
      qcScroll.style.minHeight = "0";
    };

    apply();
    window.addEventListener("resize", apply);
    mq.addEventListener("change", apply);
    if (typeof ResizeObserver !== "undefined") {
      const ro = new ResizeObserver(() => apply());
      ro.observe(chartsCard);
    }
    requestAnimationFrame(() => apply());
    setTimeout(apply, 120);
    setTimeout(apply, 450);
  }

  function setupCharts() {
    if (typeof Chart === "undefined") return;

    const modelCanvas = el("modelChart");
    const fiCanvas = el("fiChart");
    const { ink, grid } = getChartThemeColors();

    if (modelCanvas) {
      const labels = HYBRID_MODEL_ORDER.map((k) => MODEL_META[k].name);
      const data = HYBRID_MODEL_ORDER.map((k) => MODEL_META[k].accuracy * 100);

      new Chart(modelCanvas, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Validation accuracy (%)",
              data,
              backgroundColor: HYBRID_CHART_COLORS.bg,
              borderColor: HYBRID_CHART_COLORS.border,
              borderWidth: 1,
              borderRadius: 6,
              maxBarThickness: 52,
            },
          ],
        },
        options: {
          responsive: true,
          layout: { padding: { bottom: 4, left: 0, right: 4 } },
          datasets: {
            bar: {
              categoryPercentage: 0.82,
              barPercentage: 0.75,
            },
          },
          plugins: {
            legend: { labels: { color: ink } },
            title: {
              display: true,
              text: "Hybrid ensembles — validation accuracy",
              color: ink,
              font: { weight: "800", size: 14 },
            },
          },
          scales: {
            x: {
              ticks: {
                color: ink,
                maxRotation: 42,
                minRotation: 28,
                autoSkip: false,
                font: { size: 10, weight: "600" },
              },
              grid: { color: grid, display: false },
            },
            y: {
              title: {
                display: true,
                text: "Accuracy (%)",
                color: ink,
                font: { size: 11, weight: "700" },
              },
              ticks: { color: ink },
              grid: { color: grid },
              suggestedMin: 74,
              suggestedMax: 92,
            },
          },
        },
      });
    }

    if (fiCanvas) {
      const labels = ["cp", "thalachh", "oldpeak", "chol", "age", "trtbps", "caa"];
      const data = [0.22, 0.19, 0.16, 0.12, 0.11, 0.10, 0.10];

      new Chart(fiCanvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              data,
              backgroundColor: [
                "rgba(56,189,248,.75)",
                "rgba(34,197,94,.70)",
                "rgba(251,113,133,.65)",
                "rgba(251,191,36,.60)",
                "rgba(167,139,250,.60)",
                "rgba(148,163,184,.55)",
                "rgba(59,130,246,.55)",
              ],
            },
          ],
        },
      });
    }
  }

  function init() {
    setupThemeToggle();
    setupMobileNav();
    renderModelCards();
    setupLoading();
    setupCharts();
    setupModelInfoLayoutSync();
    scrollToResultsIfAny();
    setupConfidenceBars();
    setupPredictConfusionPanel();

    const select = el("modelSelect");
    renderModelInfo(select?.value || "combined_rbm");
    select?.addEventListener("change", (e) => {
      const v = e.target.value;
      renderModelInfo(v);
      const panel = el("cmPanel");
      if (panel && !panel.classList.contains("is-hidden")) {
        renderConfusionPanel(v);
      }
    });

    // 🔥 PWA Service Worker Registration
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/static/sw.js')
        .then(() => console.log('Service Worker Registered'))
        .catch(err => console.log('SW error:', err));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();