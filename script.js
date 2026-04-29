const screenEl = document.getElementById("screen");
const canvas = document.getElementById("networkCanvas");
const ctx = canvas.getContext("2d");
const clockTime = document.getElementById("clockTime");
const clockDate = document.getElementById("clockDate");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const refreshBtn = document.getElementById("refreshBtn");
const actionGrid = document.querySelector(".action-grid");
const alertsList = document.getElementById("alertsList");
const alertCount = document.getElementById("alertCount");
const laneTable = document.getElementById("laneTable");
const agingList = document.getElementById("agingList");
const feedText = document.getElementById("feedText");
const stageTitle = document.getElementById("stageTitle");
const detailStatus = document.getElementById("detailStatus");
const detailLabel = document.getElementById("detailLabel");
const detailTitle = document.getElementById("detailTitle");
const detailDesc = document.getElementById("detailDesc");
const detailMetrics = document.getElementById("detailMetrics");
const kpiComplete = document.getElementById("kpiComplete");
const kpiJobs = document.getElementById("kpiJobs");
const kpiFail = document.getElementById("kpiFail");
const kpiWarehouse = document.getElementById("kpiWarehouse");
const globePanel = document.getElementById("globePanel");
const globeFocus = document.getElementById("globeFocus");

let width = 0;
let height = 0;
let particles = [];
let globeChart;
let charts = {};
let feedIndex = 0;
let feedTimer;

const feedTemplates = [
  { time: "18:42", type: "AIR IMPORT", text: "SQ101 ETA drift · <em>28 shipments</em> under SLA watch · reserve receiving slot at Jurong DC." },
  { time: "18:44", type: "AIR EXPORT", text: "Outbound tender queue rising · <em>20 POD risk</em> · AI suggests earlier handover to Changi." },
  { time: "18:46", type: "OCEAN IMPORT", text: "PSA clearance stable · <em>2 containers</em> near demurrage threshold · pre-clear before 18:00." },
  { time: "18:48", type: "WAREHOUSE", text: "ITR Import aging queue · <em>15 pallets</em> above four days · priority batch C-144." },
  { time: "18:50", type: "LAST MILE", text: "SP-005 completion rate at <em>81%</em> · pickup window 09:00-11:00 recommended." }
];

const logisticsNodes = {
  air: { label: "Changi Air Hub", lat: 1.3644, lon: 103.9915, color: 0xff9545, offset: [150, -112] },
  port: { label: "PSA Port", lat: 1.2644, lon: 103.8178, color: 0x78ff9b, offset: [-250, 78] },
  warehouse: { label: "Jurong DC", lat: 1.3329, lon: 103.7436, color: 0xffcc00, offset: [-228, -120] },
  cbd: { label: "CBD Delivery", lat: 1.2834, lon: 103.8519, color: 0xff9545, offset: [150, 78] },
  dubai: { label: "Dubai Hub", lat: 25.2532, lon: 55.3657, color: 0x65f0db },
  frankfurt: { label: "Frankfurt Hub", lat: 50.0379, lon: 8.5622, color: 0x65f0db },
  shanghai: { label: "Shanghai Hub", lat: 31.1443, lon: 121.8083, color: 0x65f0db },
  sydney: { label: "Sydney Gateway", lat: -33.9399, lon: 151.1753, color: 0x65f0db }
};

const globePoints = [
  { key: "airImport", name: "Changi Air Import", lat: 1.3644, lng: 103.9915, status: "watch", jobs: 28, color: "#ff9545" },
  { key: "airExport", name: "Changi Air Export", lat: 1.418, lng: 104.035, status: "watch", jobs: 20, color: "#ffcc00" },
  { key: "oceanImport", name: "PSA Ocean Import", lat: 1.2644, lng: 103.8178, status: "normal", jobs: 200, color: "#78ff9b" },
  { key: "oceanExport", name: "PSA Ocean Export", lat: 1.218, lng: 103.79, status: "normal", jobs: 242, color: "#65f0db" },
  { key: "warehouse", name: "Jurong DC", lat: 1.3329, lng: 103.7436, status: "watch", jobs: 3920, color: "#ffcc00" },
  { key: "cbd", name: "CBD Delivery", lat: 1.2834, lng: 103.8519, status: "critical", jobs: 37, color: "#ff9545" },
  { key: "dubai", name: "Dubai Hub", lat: 25.2532, lng: 55.3657, status: "normal", jobs: 186, color: "#65f0db" },
  { key: "frankfurt", name: "Frankfurt Hub", lat: 50.0379, lng: 8.5622, status: "normal", jobs: 164, color: "#65f0db" },
  { key: "shanghai", name: "Shanghai Hub", lat: 31.1443, lng: 121.8083, status: "watch", jobs: 116, color: "#ffcc00" },
  { key: "sydney", name: "Sydney Gateway", lat: -33.9399, lng: 151.1753, status: "normal", jobs: 92, color: "#65f0db" }
];

const globeArcs = [
  { name: "SIN Import <- DXB", from: "Dubai Hub", to: "Changi Air Import", startLat: 25.2532, startLng: 55.3657, endLat: 1.3644, endLng: 103.9915, color: ["#65f0db", "#ff9545"], focus: "airImport" },
  { name: "SIN Export -> FRA", from: "Changi Air Export", to: "Frankfurt Hub", startLat: 1.418, startLng: 104.035, endLat: 50.0379, endLng: 8.5622, color: ["#ffcc00", "#65f0db"], focus: "airExport" },
  { name: "SIN Export -> PVG", from: "Changi Air Export", to: "Shanghai Hub", startLat: 1.418, startLng: 104.035, endLat: 31.1443, endLng: 121.8083, color: ["#ffcc00", "#ff9545"], focus: "airExport" },
  { name: "Ocean Import PVG -> PSA", from: "Shanghai Hub", to: "PSA Ocean Import", startLat: 31.1443, startLng: 121.8083, endLat: 1.2644, endLng: 103.8178, color: ["#65f0db", "#78ff9b"], focus: "oceanImport" },
  { name: "Ocean Export PSA -> SYD", from: "PSA Ocean Export", to: "Sydney Gateway", startLat: 1.218, startLng: 103.79, endLat: -33.9399, endLng: 151.1753, color: ["#65f0db", "#65f0db"], focus: "oceanExport" }
];

const nodeDetails = {
  airImport: {
    status: "Air Import",
    label: "Current Bottleneck",
    title: "SQ101 ETA changed",
    desc: "28 shipments will miss the original handover window unless the warehouse receiving plan is adjusted.",
    recommendation: "Reserve one extra receiving slot at Jurong DC from 16:45-18:30 and notify affected customers.",
    metrics: [
      ["Impacted Jobs", "28"],
      ["SLA Risk", "High"],
      ["Delay ETA", "+145m"],
      ["AI Confidence", "91%"]
    ]
  },
  airExport: {
    status: "Air Export",
    label: "Outbound Monitor",
    title: "Tender queue rising",
    desc: "20 export shipments are waiting for provider confirmation. Cut-off risk increases after 19:00.",
    recommendation: "AI suggests moving 12 priority exports to the earlier Changi handover wave and reallocating SP-002 capacity.",
    metrics: [
      ["Export Jobs", "280"],
      ["POD Risk", "20"],
      ["Cut-off Risk", "Med"],
      ["AI Confidence", "87%"]
    ]
  },
  oceanImport: {
    status: "Ocean Import",
    label: "Port Flow",
    title: "PSA clearance stable",
    desc: "Ocean inbound is within planned throughput, but two containers are approaching the demurrage threshold.",
    recommendation: "Keep ocean import staffing stable and pre-clear the two demurrage-risk containers before 18:00.",
    metrics: [
      ["Containers", "242"],
      ["Hold Risk", "2"],
      ["Clearance", "96%"],
      ["AI Confidence", "88%"]
    ]
  },
  oceanExport: {
    status: "Ocean Export",
    label: "Container Gate-out",
    title: "CY closing window watch",
    desc: "Ocean export bookings are stable, but 14 containers need earlier gate-out to protect vessel cut-off.",
    recommendation: "AI recommends batching OceanLink pickups before 15:30 and holding 2 low-priority containers for the next wave.",
    metrics: [
      ["Export Jobs", "242"],
      ["POD Risk", "14"],
      ["Cut-off Risk", "Low"],
      ["AI Confidence", "86%"]
    ]
  },
  warehouse: {
    status: "Warehouse",
    label: "Capacity Watch",
    title: "Jurong DC at 78%",
    desc: "Warehouse utilization is safe, but aging pallets above four days increased by 15% versus last week.",
    recommendation: "Prioritize ITR Import aging batch C-144 and release 46 pallet positions before tomorrow morning.",
    metrics: [
      ["Capacity", "78%"],
      ["Aging >4d", "15"],
      ["Pallets", "3,920"],
      ["AI Confidence", "94%"]
    ]
  },
  cbd: {
    status: "Last Mile",
    label: "Route Delay",
    title: "CBD route slowed",
    desc: "Traffic on the downtown delivery corridor is causing last-mile ETA drift for priority accounts.",
    recommendation: "Merge three nearby delivery drops and shift SP-005 pickup to 09:00-11:00 for better success rate.",
    metrics: [
      ["Impacted Stops", "37"],
      ["ETA Drift", "+25m"],
      ["Provider", "SP-005"],
      ["AI Confidence", "89%"]
    ]
  }
};

const scenarioAlerts = {
  flight: {
    type: "warn",
    title: "Flight ETA Changed",
    desc: "SQ101 ETA changed from 14:20 to 16:45, impacting 28 air import shipments.",
    focus: "airImport"
  },
  weather: {
    type: "info",
    title: "Weather Warning",
    desc: "Singapore heavy rain expected after 16:00. AI suggests moving outbound loading forward.",
    focus: "cbd"
  },
  provider: {
    type: "success",
    title: "AI Provider Optimization",
    desc: "SP-005 completion rate dropped to 79%. AI recommends switching pickup to 09:00-11:00.",
    focus: "cbd"
  },
  warehouse: {
    type: "danger",
    title: "Warehouse Aging Risk",
    desc: "ITR Import aging over four days increased by 15%. AI re-ranked the priority queue.",
    focus: "warehouse"
  }
};

let alerts = [
  { type: "danger", title: "DG Cargo Alert", desc: "3 dangerous goods shipments require specialist handling.", time: "2 min ago", focus: "airImport" },
  { type: "warn", title: "Flight ETA Changed", desc: "SQ101 ETA changed, impacting 28 air import shipments.", time: "8 min ago", focus: "airImport" },
  { type: "info", title: "Weather Warning", desc: "Heavy rain expected after 16:00. Review outbound plan.", time: "15 min ago", focus: "cbd" },
  { type: "success", title: "AI Recommendation", desc: "Move SP-005 pickup window to 09:00-11:00. Success rate +18%.", time: "just now", focus: "cbd" }
];

const lanes = [
  ["Air Import", "240 jobs", "60 POD risk"],
  ["Air Export", "280 jobs", "20 POD risk"],
  ["Ocean Import", "200 jobs", "12 POD risk"],
  ["ITR Export", "170 jobs", "10 POD risk"]
];

const aging = [
  ["ITR Import", "Batch C-144", "5d"],
  ["Air Import", "ULD A-092", "4d"],
  ["Ocean Export", "CNTR 21A", "3d"],
  ["Last Mile", "SP-005", "2d"]
];

const worldLite = [
  {
    type: "Feature",
    properties: { name: "North America" },
    geometry: { type: "Polygon", coordinates: [[[-168, 12], [-145, 55], [-100, 72], [-58, 50], [-74, 20], [-120, 8], [-168, 12]]] }
  },
  {
    type: "Feature",
    properties: { name: "South America" },
    geometry: { type: "Polygon", coordinates: [[[-82, 12], [-46, 8], [-36, -20], [-56, -56], [-78, -34], [-82, 12]]] }
  },
  {
    type: "Feature",
    properties: { name: "Europe" },
    geometry: { type: "Polygon", coordinates: [[[-12, 35], [8, 58], [38, 58], [46, 42], [18, 34], [-12, 35]]] }
  },
  {
    type: "Feature",
    properties: { name: "Africa" },
    geometry: { type: "Polygon", coordinates: [[[-18, 34], [36, 32], [50, 2], [30, -36], [-6, -35], [-18, 2], [-18, 34]]] }
  },
  {
    type: "Feature",
    properties: { name: "Asia" },
    geometry: { type: "Polygon", coordinates: [[[38, 8], [58, 55], [112, 62], [148, 42], [132, 8], [104, -8], [72, 6], [38, 8]]] }
  },
  {
    type: "Feature",
    properties: { name: "Australia" },
    geometry: { type: "Polygon", coordinates: [[[112, -12], [154, -18], [152, -42], [116, -42], [112, -12]]] }
  }
];

function initCharts() {
  if (!window.echarts) return;
  charts.throughput = echarts.init(document.getElementById("throughputChart"));
  charts.risk = echarts.init(document.getElementById("riskChart"));
  charts.provider = echarts.init(document.getElementById("providerChart"));

  const hours = Array.from({ length: 24 }, (_, index) => `${index}:00`);
  const throughput = hours.map((_, index) => Math.floor(68 + Math.sin(index / 2.5) * 22 + Math.random() * 18));

  charts.throughput.setOption({
    tooltip: {
      trigger: "axis",
      backgroundColor: "rgba(0,0,0,0.82)",
      borderColor: "#65f0db",
      textStyle: { color: "#fff" }
    },
    grid: { left: 34, right: 12, top: 18, bottom: 24 },
    xAxis: {
      type: "category",
      boundaryGap: false,
      data: hours,
      axisLine: { lineStyle: { color: "#65f0db" } },
      axisLabel: { color: "#91aaa8", fontSize: 9, interval: 3 }
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisLabel: { color: "#91aaa8", fontSize: 9 },
      splitLine: { lineStyle: { color: "rgba(101,240,219,0.14)" } }
    },
    series: [{
      name: "Jobs",
      type: "line",
      smooth: true,
      symbol: "circle",
      symbolSize: 4,
      lineStyle: { color: "#65f0db", width: 2 },
      itemStyle: { color: "#ffcc00" },
      areaStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            { offset: 0, color: "rgba(101,240,219,0.42)" },
            { offset: 1, color: "rgba(101,240,219,0.03)" }
          ]
        }
      },
      data: throughput
    }]
  });

  charts.risk.setOption({
    tooltip: {
      trigger: "item",
      backgroundColor: "rgba(0,0,0,0.82)",
      borderColor: "#65f0db",
      textStyle: { color: "#fff" }
    },
    legend: {
      bottom: 0,
      itemWidth: 8,
      itemHeight: 8,
      textStyle: { color: "#91aaa8", fontSize: 10 }
    },
    series: [{
      type: "pie",
      radius: ["44%", "70%"],
      center: ["50%", "42%"],
      label: { show: false },
      itemStyle: { borderColor: "#08141a", borderWidth: 2 },
      data: [
        { value: 28, name: "SLA", itemStyle: { color: "#d40511" } },
        { value: 19, name: "Weather", itemStyle: { color: "#ff9545" } },
        { value: 15, name: "Aging", itemStyle: { color: "#ffcc00" } },
        { value: 38, name: "Normal", itemStyle: { color: "#65f0db" } }
      ]
    }]
  });

  charts.provider.setOption({
    grid: { left: 58, right: 10, top: 8, bottom: 8 },
    xAxis: {
      type: "value",
      max: 100,
      splitLine: { show: false },
      axisLabel: { show: false },
      axisLine: { show: false },
      axisTick: { show: false }
    },
    yAxis: {
      type: "category",
      data: ["SP-005", "OceanLink"],
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#91aaa8", fontSize: 10 }
    },
    series: [{
      type: "bar",
      barWidth: 10,
      data: [79, 91],
      itemStyle: {
        color: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            { offset: 0, color: "#65f0db" },
            { offset: 1, color: "#ffcc00" }
          ]
        },
        shadowColor: "rgba(101,240,219,0.45)",
        shadowBlur: 8
      },
      label: {
        show: true,
        position: "right",
        color: "#eefcf9",
        fontSize: 10,
        formatter: "{c}%"
      }
    }]
  });
}

function updateCharts() {
  if (!charts.throughput) return;
  const current = charts.throughput.getOption().series[0].data;
  charts.throughput.setOption({
    series: [{
      data: current.map((value) => Math.max(42, Math.round(value + Math.random() * 18 - 8)))
    }]
  });

  charts.risk.setOption({
    series: [{
      data: [
        { value: 24 + Math.floor(Math.random() * 10), name: "SLA", itemStyle: { color: "#d40511" } },
        { value: 14 + Math.floor(Math.random() * 10), name: "Weather", itemStyle: { color: "#ff9545" } },
        { value: 12 + Math.floor(Math.random() * 8), name: "Aging", itemStyle: { color: "#ffcc00" } },
        { value: 34 + Math.floor(Math.random() * 10), name: "Normal", itemStyle: { color: "#65f0db" } }
      ]
    }]
  });

  charts.provider.setOption({
    series: [{
      data: [76 + Math.floor(Math.random() * 8), 88 + Math.floor(Math.random() * 7)]
    }]
  });
}

function resizeCanvas() {
  const ratio = window.devicePixelRatio || 1;
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);

  particles = Array.from({ length: 62 }, () => ({
    x: Math.random() * width,
    y: Math.random() * height,
    vx: (Math.random() - 0.5) * 0.24,
    vy: (Math.random() - 0.5) * 0.24,
    r: 1 + Math.random() * 1.7
  }));
}

function drawNetwork() {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "rgba(101, 240, 219, 0.52)";
  ctx.strokeStyle = "rgba(101, 240, 219, 0.1)";
  ctx.lineWidth = 1;

  particles.forEach((particle, index) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0 || particle.x > width) particle.vx *= -1;
    if (particle.y < 0 || particle.y > height) particle.vy *= -1;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fill();

    for (let j = index + 1; j < particles.length; j += 1) {
      const other = particles[j];
      const dx = particle.x - other.x;
      const dy = particle.y - other.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < 120) {
        ctx.globalAlpha = 1 - distance / 120;
        ctx.beginPath();
        ctx.moveTo(particle.x, particle.y);
        ctx.lineTo(other.x, other.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    }
  });

  requestAnimationFrame(drawNetwork);
}

function initGlobe() {
  globeChart = Globe()(globePanel)
    .width(globePanel.clientWidth)
    .height(globePanel.clientHeight)
    .backgroundColor("rgba(0,0,0,0)")
    .globeImageUrl("https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg")
    .bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png")
    .showAtmosphere(true)
    .atmosphereColor("#65f0db")
    .atmosphereAltitude(0.18)
    .pointsData(globePoints)
    .pointLat("lat")
    .pointLng("lng")
    .pointColor("color")
    .pointAltitude((point) => point.status === "critical" ? 0.14 : 0.08)
    .pointRadius((point) => point.status === "critical" ? 0.72 : 0.45)
    .pointResolution(18)
    .pointLabel((point) => `<b>${point.name}</b><br>${point.jobs} active jobs<br>${point.status.toUpperCase()}`)
    .onPointClick((point) => point.key && nodeDetails[point.key] && setDetail(point.key))
    .arcsData(globeArcs)
    .arcStartLat("startLat")
    .arcStartLng("startLng")
    .arcEndLat("endLat")
    .arcEndLng("endLng")
    .arcColor("color")
    .arcAltitudeAutoScale(0.42)
    .arcStroke(0.55)
    .arcDashLength(0.42)
    .arcDashGap(1.25)
    .arcDashInitialGap(() => Math.random())
    .arcDashAnimateTime(2600)
    .arcLabel((arc) => `<b>${arc.name}</b><br>${arc.from} to ${arc.to}`)
    .onArcClick((arc) => setDetail(arc.focus))
    .ringsData(globePoints.filter((point) => point.status !== "normal"))
    .ringLat("lat")
    .ringLng("lng")
    .ringColor((point) => point.color)
    .ringMaxRadius((point) => point.status === "critical" ? 5 : 3)
    .ringPropagationSpeed(1.4)
    .ringRepeatPeriod(900)
    .labelsData(globePoints)
    .labelLat("lat")
    .labelLng("lng")
    .labelText("name")
    .labelColor((point) => point.color)
    .labelSize(0.9)
    .labelAltitude(0.02)
    .labelDotRadius(0.25)
    .labelIncludeDot(true);

  globeChart.controls().autoRotate = true;
  globeChart.controls().autoRotateSpeed = 0.18;
  globeChart.controls().enableDamping = true;
  globeChart.pointOfView({ lat: 8, lng: 103, altitude: 1.85 }, 1200);
  updateGlobeMarkers();
}

function resizeGlobe() {
  if (globeChart) {
    globeChart.width(globePanel.clientWidth).height(globePanel.clientHeight);
  }
  updateGlobeMarkers();
}

function updateGlobeMarkers() {
  const rect = globePanel.getBoundingClientRect();
  const positions = {
    air: [rect.width * 0.72, rect.height * 0.27],
    port: [rect.width * 0.23, rect.height * 0.63],
    warehouse: [rect.width * 0.31, rect.height * 0.30],
    cbd: [rect.width * 0.72, rect.height * 0.66]
  };

  document.querySelectorAll(".globe-marker").forEach((marker) => {
    const [x, y] = positions[marker.dataset.node];
    marker.style.left = `${x}px`;
    marker.style.top = `${y}px`;
    marker.classList.remove("is-hidden");
  });
}

function animateGlobe() {
  updateGlobeMarkers();
}

function updateClock() {
  const now = new Date();
  clockTime.textContent = now.toLocaleTimeString("zh-TW", { hour12: false });
  clockDate.textContent = now.toLocaleDateString("zh-TW", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  });
}

function pulse(element) {
  element.classList.remove("is-changing");
  void element.offsetWidth;
  element.classList.add("is-changing");
}

function renderFeedItem(item) {
  if (typeof item === "string") {
    return `<span class="feed-item"><span class="feed-type">LIVE</span><span class="feed-sep">/</span><span>${item}</span></span>`;
  }
  return `<span class="feed-item"><b>${item.time}</b><span class="feed-sep">/</span><span class="feed-type">${item.type}</span><span class="feed-sep">/</span><span>${item.text}</span></span>`;
}

function playFeed(item) {
  feedText.innerHTML = `<span class="ticker-message">${renderFeedItem(item)}</span>`;
  const message = feedText.querySelector(".ticker-message");
  const containerWidth = feedText.clientWidth;
  const messageWidth = message.offsetWidth;
  const holdX = 0;
  const exitX = -messageWidth - 24;

  message.animate(
    [
      { transform: `translateX(${containerWidth}px)` },
      { transform: `translateX(${holdX}px)`, offset: 0.42 },
      { transform: `translateX(${holdX}px)`, offset: 0.72 },
      { transform: `translateX(${exitX}px)` }
    ],
    { duration: 18000, easing: "linear", fill: "forwards" }
  );
}

function setFeed(message) {
  clearInterval(feedTimer);
  playFeed(message);
  feedTimer = setInterval(() => {
    feedIndex = (feedIndex + 1) % feedTemplates.length;
    playFeed(feedTemplates[feedIndex]);
  }, 19000);
}

function randomFeed() {
  return feedTemplates[Math.floor(Math.random() * feedTemplates.length)];
}

function renderAlerts() {
  alertsList.innerHTML = alerts.map((alert, index) => `
    <article class="alert-card ${alert.type}" data-index="${index}">
      <header>
        <b>${alert.title}</b>
        <time>${alert.time}</time>
      </header>
      <p>${alert.desc}</p>
    </article>
  `).join("");
  alertCount.textContent = `${alerts.length} Active`;
}

function renderLaneTable() {
  laneTable.innerHTML = lanes.map(([name, jobs, risk]) => `
    <article class="lane-card">
      <span>${name}</span>
      <strong>${jobs}</strong>
      <b>${risk}</b>
    </article>
  `).join("");
}

function renderAging() {
  agingList.innerHTML = aging.map(([line, batch, days]) => `
    <article class="aging-row">
      <div>
        <strong>${line}</strong>
        <span>${batch}</span>
      </div>
      <b>${days}</b>
    </article>
  `).join("");
}

function focusGlobeNode(key) {
  updateGlobeMarkers();
}

function setDetail(key) {
  const detail = nodeDetails[key];
  stageTitle.textContent = `${detail.status} Focus`;
  detailStatus.textContent = detail.status;
  globeFocus.textContent = detail.status;
  detailLabel.textContent = detail.label;
  detailTitle.textContent = detail.title;
  detailDesc.textContent = detail.desc;
  detailMetrics.innerHTML = detail.metrics.map(([label, value]) => `
    <article>
      <span>${label}</span>
      <strong>${value}</strong>
    </article>
  `).join("");

  document.querySelectorAll(".globe-marker").forEach((marker) => {
    marker.classList.toggle("active", marker.dataset.node === key);
  });

  focusGlobeNode(key);
  setFeed(`<b>${detail.status}</b> · ${detail.recommendation}`);
  pulse(document.querySelector(".map-stage"));
  pulse(document.querySelector(".right-panel"));
}

function addScenario(key) {
  const scenario = scenarioAlerts[key];
  alerts.unshift({
    type: scenario.type,
    title: scenario.title,
    desc: scenario.desc,
    time: "just now",
    focus: scenario.focus
  });
  alerts = alerts.slice(0, 7);
  renderAlerts();
  setDetail(scenario.focus);
  setFeed(`<b>${scenario.title}</b> · ${scenario.desc}`);
  updateCharts();
}

function refreshData() {
  const complete = (93 + Math.random() * 3).toFixed(1);
  const jobs = 1270 + Math.floor(Math.random() * 48);
  const fail = 68 + Math.floor(Math.random() * 18);
  const warehouse = 75 + Math.floor(Math.random() * 9);

  kpiComplete.textContent = `${complete}%`;
  kpiJobs.textContent = jobs.toLocaleString("en-US");
  kpiFail.textContent = String(fail);
  kpiWarehouse.textContent = `${warehouse}%`;

  [kpiComplete, kpiJobs, kpiFail, kpiWarehouse].forEach(pulse);
  setFeed(randomFeed());
  updateCharts();
}

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    screenEl.requestFullscreen?.();
  } else {
    document.exitFullscreen?.();
  }
}

document.addEventListener("fullscreenchange", () => {
  fullscreenBtn.textContent = document.fullscreenElement ? "Exit Full" : "Full Screen";
});

document.querySelectorAll(".globe-marker").forEach((node) => {
  node.addEventListener("click", () => setDetail(node.dataset.node));
});

alertsList.addEventListener("click", (event) => {
  const card = event.target.closest(".alert-card");
  if (!card) return;
  setDetail(alerts[Number(card.dataset.index)].focus);
});

actionGrid.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-scenario]");
  if (!button) return;
  addScenario(button.dataset.scenario);
});

fullscreenBtn.addEventListener("click", toggleFullscreen);
refreshBtn.addEventListener("click", refreshData);
window.addEventListener("resize", () => {
  resizeCanvas();
  resizeGlobe();
  Object.values(charts).forEach((chart) => chart?.resize?.());
});

resizeCanvas();
drawNetwork();
initGlobe();
updateClock();
renderAlerts();
renderLaneTable();
renderAging();
initCharts();
setDetail("airImport");
setFeed(feedTemplates[0]);
setInterval(updateClock, 1000);
setInterval(refreshData, 6500);
