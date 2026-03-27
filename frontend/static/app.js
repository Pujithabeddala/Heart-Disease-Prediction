(() => {
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
  };

  function el(id) {
    return document.getElementById(id);
  }

  function pct(n) {
    return `${Math.round(n * 100)}%`;
  }

  function renderModelInfo(modelKey) {
    const info = el("modelInfo");
    if (!info) return;
    const m = MODEL_META[modelKey] ?? MODEL_META.adaboost;
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

    const order = ["adaboost", "catboost", "xgboost"];
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

    form.addEventListener("submit", () => {
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

  function setupCharts() {
    if (typeof Chart === "undefined") return;

    const modelCanvas = el("modelChart");
    const fiCanvas = el("fiChart");
    const ink = "rgba(11,15,26,.82)";
    const grid = "rgba(11,15,26,.10)";

    if (modelCanvas) {
      // Simple comparison chart (demo values; aligns with model info panel)
      const labels = ["RBM", "FNN", "LSTM"];
      const data = [
        MODEL_META.adaboost.accuracy * 100,
        MODEL_META.catboost.accuracy * 100,
        MODEL_META.xgboost.accuracy * 100,
      ];

      new Chart(modelCanvas, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Accuracy (%)",
              data,
              backgroundColor: ["rgba(56,189,248,.65)", "rgba(34,197,94,.60)", "rgba(251,113,133,.55)"],
              borderColor: ["rgba(56,189,248,.95)", "rgba(34,197,94,.90)", "rgba(251,113,133,.85)"],
              borderWidth: 1,
              borderRadius: 10,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { labels: { color: ink } },
            title: {
              display: true,
              text: "Model Comparison",
              color: ink,
              font: { weight: "800" },
            },
            tooltip: { enabled: true },
          },
          scales: {
            x: { ticks: { color: ink }, grid: { color: grid } },
            y: {
              ticks: { color: ink },
              grid: { color: grid },
              suggestedMin: 70,
              suggestedMax: 100,
            },
          },
        },
      });
    }

    if (fiCanvas) {
      // Feature importance (demo; replace with real importances later if available)
      const labels = ["cp", "thalachh", "oldpeak", "chol", "age", "trtbps", "caa"];
      const data = [0.22, 0.19, 0.16, 0.12, 0.11, 0.10, 0.10];

      new Chart(fiCanvas, {
        type: "doughnut",
        data: {
          labels,
          datasets: [
            {
              label: "Importance",
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
              borderColor: "rgba(11,15,26,.10)",
              borderWidth: 1,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { position: "bottom", labels: { color: ink } },
            title: {
              display: true,
              text: "Feature Importance (Demo)",
              color: ink,
              font: { weight: "800" },
            },
          },
          cutout: "62%",
        },
      });
    }
  }

  function init() {
    renderModelCards();
    setupLoading();
    setupCharts();
    scrollToResultsIfAny();

    const select = el("modelSelect");
    renderModelInfo(select?.value || "adaboost");
    select?.addEventListener("change", (e) => renderModelInfo(e.target.value));
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();

