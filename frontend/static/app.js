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
    const { ink, grid } = getChartThemeColors();

    if (modelCanvas) {
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
    scrollToResultsIfAny();

    const select = el("modelSelect");
    renderModelInfo(select?.value || "adaboost");
    select?.addEventListener("change", (e) => renderModelInfo(e.target.value));

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