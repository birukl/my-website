const INVEST = 1000;

const coins = [
 { id:"bitcoin", cap:"bitcoin", tv:"BTCUSD", sym:"BTC", entry:88169.06, entryDate:"2025-12-20" },
 { id:"ethereum", cap:"ethereum", tv:"ETHUSD", sym:"ETH", entry:2930.85, entryDate:"2025-12-24" },
 { id:"solana", cap:"solana", tv:"SOLUSD", sym:"SOL", entry:122.08, entryDate:"2025-12-24" },
 { id:"ripple", cap:"xrp", tv:"XRPUSD", sym:"XRP", entry:1.8687, entryDate:"2025-12-24" },
 { id:"avalanche-2", cap:"avalanche", tv:"AVAXUSD", sym:"AVAX", entry:12.11, entryDate:"2025-12-24" }
];

const tbody = document.getElementById("table");
const charts = document.getElementById("charts");
const bars = document.getElementById("bars");

/* INIT TABLE */
coins.forEach(c=>{
  c.alert = +(c.entry * 1.05).toFixed(2);
  c.maxProfit = 0;

  tbody.innerHTML += `
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
  </tr>`;

  const div=document.createElement("div");
  div.className="chart"; div.id="chart-"+c.sym;
  charts.appendChild(div);
  new TradingView.widget({
    autosize:true, symbol:c.tv, interval:"60",
    theme:"light", container_id:div.id
  });
});

/* FETCH PRICES */
async function fetchPrices(){
  try{
    const ids=coins.map(c=>c.id).join(",");
    const r=await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`);
    const d=await r.json();
    update(c=>d[c.id].usd);
  }catch{
    const prices={};
    for(const c of coins){
      const r=await fetch(`https://api.coinbase.com/v2/prices/${c.sym}-USD/spot`);
      const d=await r.json();
      prices[c.sym]=+d.data.amount;
    }
    update(c=>prices[c.sym]);
  }
}

/* UPDATE UI */
function update(get){
  let totalEq=0, totalUsd=0;
  bars.innerHTML="";

  coins.forEach(c=>{
    const p=get(c); if(!p) return;

    const units=INVEST/c.entry;
    const usd=(p-c.entry)*units;
    const pct=((p-c.entry)/c.entry)*100;
    const eq=INVEST+usd;

    // Update maxProfit (currently in memory)
    if (usd > c.maxProfit) c.maxProfit = usd;

    totalEq+=eq;
    totalUsd+=usd;

    document.getElementById(c.sym+"-price").textContent=p.toFixed(2);
    document.getElementById(c.sym+"-pct").textContent=pct.toFixed(2)+"%";
    document.getElementById(c.sym+"-usd").textContent=(usd>=0?"+":"")+usd.toFixed(2);
    document.getElementById(c.sym+"-eq").textContent=eq.toFixed(2);
    document.getElementById(c.sym+"-max").textContent=(c.maxProfit>0?"+":"")+c.maxProfit.toFixed(2);

    document.getElementById(c.sym+"-pct").className=pct>=0?"gain":"loss";
    document.getElementById(c.sym+"-usd").className=usd>=0?"gain":"loss";
    document.getElementById(c.sym+"-eq").className=eq>=INVEST?"gain":"loss";
    document.getElementById(c.sym+"-max").className=c.maxProfit>0?"gain":"loss";

    const bar=document.createElement("div");
    bar.innerHTML=`${c.sym} $${eq.toFixed(0)}`;
    const fill=document.createElement("div");
    fill.className="bar";
    fill.style.width=(eq/5000*100)+"%";
    bar.appendChild(fill);
    bars.appendChild(bar);

    if(p>=c.alert){
      alert(`${c.sym} hit alert: $${p.toFixed(2)}`);
      c.alert=Infinity;
    }
  });

  document.getElementById("totalUsd").textContent=(totalUsd>=0?"+":"")+totalUsd.toFixed(2);
  document.getElementById("totalEquity").textContent=totalEq.toFixed(2);
  document.getElementById("totalPct").textContent=(((totalEq-5000)/5000)*100).toFixed(2)+"%";
}

fetchPrices();
setInterval(fetchPrices,10000);