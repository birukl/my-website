const INVEST = 1000;
const TOTAL = 5000;

const coins = [
 { id:"bitcoin", tv:"BINANCE:BTCUSDT", sym:"BTC", entry:88169.06, entryDate:"2025-12-20" },
 { id:"ethereum", tv:"BINANCE:ETHUSDT", sym:"ETH", entry:2930.85, entryDate:"2025-12-24" },
 { id:"solana", tv:"BINANCE:SOLUSDT", sym:"SOL", entry:122.08, entryDate:"2025-12-24" },
 { id:"ripple", tv:"BINANCE:XRPUSDT", sym:"XRP", entry:1.8687, entryDate:"2025-12-24" },
 { id:"avalanche-2", tv:"BINANCE:AVAXUSDT", sym:"AVAX", entry:12.11, entryDate:"2025-12-24" }
];

document.addEventListener("DOMContentLoaded", () => {

  const tbody = document.getElementById("table");
  const charts = document.getElementById("charts");
  const bars = document.getElementById("bars");

  /* INIT TABLE */
  coins.forEach(c => {
    c.alert = +(c.entry * 1.05).toFixed(2);
    c.maxProfit = 0;
    c.alerted = false;

    tbody.innerHTML += 
      <tr>
        <td>${c.sym}</td>
        <td>${c.entryDate}</td>
        <td>$${c.entry}</td>
        <td id="${c.sym}-price">--</td>
        <td>$${c.alert}</td>
        <td>$1,000</td>
        <td id="${c.sym}-pct">--</td>
        <td id="${c.sym}-usd">--</td>
        <td id="${c.sym}-eq">--</td>
        <td id="${c.sym}-max">--</td>
      </tr>;
  });

  /* WAIT FOR TRADINGVIEW */
  function initCharts(){
    if (!window.TradingView) {
      setTimeout(initCharts, 300);
      return;
    }

    coins.forEach(c => {
      const div = document.createElement("div");
      div.className = "chart";
      div.id = "chart-" + c.sym;
      charts.appendChild(div);

      new TradingView.widget({
        autosize: true,
        symbol: c.tv,
        interval: "60",
        theme: "light",
        container_id: div.id
      });
    });
  }
  initCharts();

  /* FETCH PRICES */
  async function fetchPrices(){
    try {
      const ids = coins.map(c => c.id).join(",");
      const r = await fetch(
        https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd
      );

      if (!r.ok) throw new Error("CoinGecko blocked");

      const d = await r.json();
      update(c => d[c.id]?.usd);

    } catch {
      for (const c of coins) {
        try {
          const r = await fetch(https://api.coinbase.com/v2/prices/${c.sym}-USD/spot);
          const d = await r.json();
          updateSingle(c, +d.data.amount);
        } catch {}
      }
    }
  }

  function update(get){
    coins.forEach(c => updateSingle(c, get(c)));
  }

  function updateSingle(c, p){
    if (!p) return;

    const units = INVEST / c.entry;
    const usd = (p - c.entry) * units;
    const pct = ((p - c.entry) / c.entry) * 100;
    const eq = INVEST + usd;

    if (usd > c.maxProfit) c.maxProfit = usd;

    document.getElementById(c.sym+"-price").textContent = p.toFixed(2);
    document.getElementById(c.sym+"-pct").textContent = pct.toFixed(2)+"%";
    document.getElementById(c.sym+"-usd").textContent = usd.toFixed(2);
    document.getElementById(c.sym+"-eq").textContent = eq.toFixed(2);
    document.getElementById(c.sym+"-max").textContent = c.maxProfit.toFixed(2);

    if (p >= c.alert && !c.alerted) {
      console.log(${c.sym} hit alert);
      c.alerted = true;
    }

    renderTotals();
  }

  function renderTotals(){
    let totalEq = 0;
    let totalUsd = 0;
    bars.innerHTML = "";

    coins.forEach(c => {
      const eq = Number(document.getElementById(c.sym+"-eq").textContent);
      if (!eq) return;

      totalEq += eq;
      totalUsd += eq - INVEST;

      const bar = document.createElement("div");
      const fill = document.createElement("div");
      fill.className = "bar";
      fill.style.width = (eq / TOTAL * 100) + "%";
      bar.innerHTML = ${c.sym} $${eq.toFixed(0)};
      bar.appendChild(fill);
      bars.appendChild(bar);
    });

    document.getElementById("totalUsd").textContent = totalUsd.toFixed(2);
    document.getElementById("totalEquity").textContent = totalEq.toFixed(2);
    document.getElementById("totalPct").textContent =
      (((totalEq - TOTAL) / TOTAL) * 100).toFixed(2) + "%";
  }
fetchPrices();
  setInterval(fetchPrices, 15000);
});
