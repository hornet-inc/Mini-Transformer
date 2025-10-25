/* ======================================================
   AUTOBOT DASHBOARD JS — LoRaDex Prime
   ====================================================== */

console.log("%c[Autobot Mode Engaged]", "color:#00bfff; font-weight:bold;");

/* ===============================
   Firebase Initialization (optional)
   =============================== */
// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCfDWAcSLtV9XKmbGkO17Lvbuhn_khGxFw",
  authDomain: "mini-transformer.firebaseapp.com",
  databaseURL: "https://mini-transformer-default-rtdb.asia-southeast1.firebasedatabase.app/",
  projectId: "mini-transformer",
  storageBucket: "mini-transformer.appspot.com",
  messagingSenderId: "463743159361",
  appId: "1:463743159361"
};

// Hardcoded credentials
const ADMIN_EMAIL = "admin@transformer.in";
const ADMIN_PASSWORD = "Transformer@123";

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const auth = firebase.auth();

// Auto-login with hardcoded credentials
auth.signInWithEmailAndPassword(ADMIN_EMAIL, ADMIN_PASSWORD)
  .then(() => {
    console.log("Logged in as admin");
    initDashboard();
  })
  .catch(err => console.error("Login failed:", err.message));

/* ===============================
   DOM Elements
   =============================== */
const radiationBar = document.getElementById("radiationBar");
const radiationLabel = document.getElementById("radiationLabel");
const lastSeen = document.getElementById("lastSeen");
const btnRefresh = document.getElementById("btnRefresh");
const wifiList = document.getElementById("wifiList");
const wifiCount = document.getElementById("wifiCount");

/* ===============================
   DOM Elements
   =============================== */
const metrics = {
  datA: 'devices/esp2/sensor/a',
  datB: 'devices/esp2/sensor/b',
  datC: 'devices/esp2/sensor/c',
  datD: 'devices/esp2/sensor/d',
  datE: 'devices/esp2/sensor/e',
  datF: 'devices/esp2/sensor/f',
  datG: 'devices/esp2/sensor/g',
  datH: 'devices/esp2/sensor/h',
  datI: 'devices/esp2/sensor/i',
  datJ: 'devices/esp2/sensor/j',
  datK: 'devices/esp2/sensor/k',
  datL: 'devices/esp2/sensor/l'
};

function initDashboard() {
  // Loop through all metrics
  for (const [id, path] of Object.entries(metrics)) {
    const el = document.getElementById(id).querySelector('span');
    const ref = db.ref(path);

    // Listen for real-time updates
    ref.on('value', snapshot => {
      const val = snapshot.val();

      // Convert string to float safely
      const num = parseFloat(val);
      el.innerText = isNaN(num) ? val : num.toFixed(2);

      // Schedule chart update from current dashboard values
      updateChartFromDisplay(); 
      // The function already batches via requestAnimationFrame, so multiple triggers in same frame are safe
    });
  }
}



/* Network bars */
const netBars = {
  airtel: { GSM: "airtelGSM", _4G: "airtel4G", _5G: "airtel5G" },
  jio: { GSM: "jioGSM", _4G: "jio4G", _5G: "jio5G" },
  bsnl: { GSM: "bsnlGSM", _4G: "bsnl4G", _5G: "bsnl5G" },
  vi: { GSM: "viGSM", _4G: "vi4G", _5G: "vi5G" },
};

// ===============================
// Realtime Chart Setup (Chart.js)
// ===============================

// Parameter keys and units
const paramKeys = ['g','i','h','d','e','f','a','c','b','j','k','l'];
const paramUnits = {
  g: "V", i: "A", h: "Hz", d: "dB", e: "%", f: "kg/m³",
  a: "°C", c: "hPa", b: "m", j: "μV", k: "GHz", l: "—"
};
const paramLabels = {
  g: "Voltage", i: "Current", h: "Frequency", d: "Acoustic Intensity",
  e: "Oil Level", f: "Oil Density", a: "Temperature", c: "Pressure",
  b: "Altitude", j: "PD Volts", k: "PD Frequency", l: "PD Intensity"
};

// Assign colors for datasets
const colors = [
  "#00f6ff","#ff4c4c","#ff9f00","#ffe600","#00ff00",
  "#00ffd0","#ff00ff","#9900ff","#ff00b3","#00ffff",
  "#ff7700","#77ff00"
];

// Create datasets
const datasets = paramKeys.map((key, i) => ({
  label: paramLabels[key],
  data: [],
  borderColor: colors[i],
  borderWidth: 2,
  tension: 0.25,
  fill: false,
  hidden: false
}));

// Initialize Chart.js
const ctx = document.getElementById("emfChart");
const emfChart = new Chart(ctx, {
  type: "line",
  data: { labels: [], datasets },
  options: {
    responsive: true,
    animation: { duration: 500 }, // smooth animation
    plugins: {
      legend: { display: true },
      tooltip: {
        callbacks: {
          label: function(context) {
            const key = paramKeys[context.datasetIndex];
            const unit = paramUnits[key];
            return `${context.dataset.label}: ${context.formattedValue} ${unit}`;
          }
        }
      }
    },
    scales: {
      x: {
        ticks: { color: "#8fd5ff" },
        grid: { color: "rgba(0, 255, 255, 0.1)" }
      },
      y: {
        ticks: { color: "#8fd5ff" },
        grid: { color: "rgba(0, 255, 255, 0.1)" }
      }
    }
  }
});

// ===============================
// Checkbox toggle logic
// ===============================
document.querySelectorAll("#chart-toggles input[type=checkbox]").forEach(cb => {
  cb.addEventListener("change", () => {
    const datasetIndex = paramKeys.indexOf(cb.value);
    if (datasetIndex >= 0) {
      emfChart.data.datasets[datasetIndex].hidden = !cb.checked;
      emfChart.update();
    }
  });
});

// ===============================
// Batch chart update logic
// ===============================
let currentValues = {}; // holds latest values from dashboard
let updateScheduled = false;

function updateChartFromDisplay() {
  // Read current dashboard values
  paramKeys.forEach(key => {
    const el = document.getElementById(`dat${key.toUpperCase()}`);
    const text = el ? el.innerText || el.querySelector('span')?.innerText : "0";
    currentValues[key] = parseFloat(text) || 0;
  });

  // Schedule a chart update on next animation frame
  if (!updateScheduled) {
    updateScheduled = true;
    requestAnimationFrame(() => {
      updateScheduled = false;

      const timeLabel = new Date().toLocaleTimeString();
      emfChart.data.labels.push(timeLabel);

      paramKeys.forEach((key, i) => {
        emfChart.data.datasets[i].data.push(currentValues[key].toFixed(2));
      });

      // Keep only last 20 points
      if (emfChart.data.labels.length > 20) {
        emfChart.data.labels.shift();
        emfChart.data.datasets.forEach(ds => ds.data.shift());
      }

      emfChart.update();
    });
  }
}

// ===============================
// Example: Hook into your existing dashboard update
// ===============================
// Call this function whenever the displayed values are updated
// For instance, after fetching from Firebase:
// updateChartFromDisplay();


// ===============================
// Reliable Online/Offline Tracker
// ===============================

const statusPill = document.getElementById("espStatus");
const lastSeenEl = document.getElementById("lastSeen");
const statusRef = db.ref("devices/esp2/meta/timestamp");

const OFFLINE_THRESHOLD = 15000; // 15s max gap
const ONLINE_CONFIRMATION = 2;   // require 2 distinct updates before online

let lastUpdateTime = 0;
let lastTimestampValue = null;
let lastChangeConfirmed = false;
let consecutiveUpdates = 0;
let online = false;
let monitorTimer = null;

// Listen for live timestamp updates
statusRef.on("value", (snapshot) => {
  const timestamp = snapshot.val();
  const now = Date.now();

  // Ignore null or undefined
  if (timestamp === null || timestamp === undefined) return;

  // Ignore duplicate values (Firebase echo)
  if (timestamp === lastTimestampValue) return;

  // Actual new data from device
  lastTimestampValue = timestamp;
  lastUpdateTime = now;
  consecutiveUpdates++;

  // Require 2 updates before marking online
  if (!online && consecutiveUpdates >= ONLINE_CONFIRMATION) {
    updateStatus(true);
  }
});

// Periodically check if device went offline
monitorTimer = setInterval(() => {
  const now = Date.now();
  const diff = now - lastUpdateTime;

  if (online && diff > OFFLINE_THRESHOLD) {
    updateStatus(false);
  }

  updateLastSeen(diff);
}, 1000);

function updateStatus(isOnline) {
  online = isOnline;

  if (isOnline) {
    statusPill.textContent = "Online";
    statusPill.classList.remove("offline");
    statusPill.classList.add("online");
    startDemoSimulation(); // resume
  } else {
    statusPill.textContent = "Offline";
    statusPill.classList.remove("online");
    statusPill.classList.add("offline");
    stopDemoSimulation(); // pause
    consecutiveUpdates = 0; // reset for fresh confirmation
  }
}

function updateLastSeen(msSinceLastUpdate) {
  let text;
  if (online) {
    text = "Active now";
  } else {
    const s = Math.floor(msSinceLastUpdate / 1000);
    if (s < 60) text = `Last seen ${s}s ago`;
    else if (s < 3600) text = `Last seen ${Math.floor(s / 60)}m ago`;
    else text = `Last seen ${Math.floor(s / 3600)}h ago`;
  }
  lastSeenEl.textContent = text;
}


function updateRadiation(level) {
  const width = Math.min(Math.max(level, 0), 100);
  radiationBar.style.width = `${width}%`;
  radiationLabel.textContent = width.toFixed(1) + "%";
}

function updateNetwork(op, type, value) {
  const id = netBars[op][type];
  const fill = document.getElementById(id);
  const label = document.getElementById(id + "Label");
  fill.style.width = `${value}%`;
  label.textContent = value.toFixed(0) + "%";
}


/* ===============================
   Mode Data Simulation
   =============================== */
let tick = 0;
let demoInterval = null; // to store the interval ID

function startDemoSimulation() {
  if (demoInterval) return; // already running
  demoInterval = setInterval(() => {
    tick++;

    // Update radiation level
    let radiation = (99.5 + Math.random()).toFixed(2); // e.g., 99.47
    updateRadiation(radiation);

    // Update network bars
    for (let op of ["airtel", "jio", "bsnl", "vi"]) {
      updateNetwork(op, "GSM", Math.random() * 100);
      updateNetwork(op, "_4G", Math.random() * 100);
      updateNetwork(op, "_5G", Math.random() * 100);
    }

    // Update last seen timestamp
    const now = new Date();
    lastSeen.textContent = now.toLocaleTimeString();

  }, 1500);
}

function stopDemoSimulation() {
  if (demoInterval) {
    clearInterval(demoInterval);
    demoInterval = null;
  }
}


/* ===============================
   Map Initialization (Leaflet)
   =============================== */
document.addEventListener("DOMContentLoaded", () => {
  const map = L.map("map").setView([20.5937, 78.9629], 5);

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    attribution: "© OpenStreetMap contributors",
  }).addTo(map);

  const marker = L.marker([20.5937, 78.9629]).addTo(map);
  marker.bindPopup("<b>PD Prime</b><br>Setup Node").openPopup();

  // Simple simulation of GPS drift 13.168859752414164, 77.53330562535629
  setInterval(() => {
    const lat = 13.168859752414164;
    const lon = 77.53330562535629;
    marker.setLatLng([lat, lon]);
    map.panTo([lat, lon]);
  });
});

/* ===============================
   User Section (Auth Simulation)
   =============================== */
document.getElementById("userName").textContent = "Admin";
document.getElementById("userEmail").textContent = "admin@transformer.in";


// ===============================
// Data Logging System
// ===============================
let isLogging = false;
let logData = [];
let logInterval = null;

const btnStartLog = document.getElementById('btnStartLog');
const btnSaveLog = document.getElementById('btnSaveLog');
const saveDialog = document.getElementById('saveDialog');
const logIndicator = document.getElementById('logIndicator');
const logIndicatorContainer = document.querySelector('.log-indicator');
const logStatusText = logIndicatorContainer.querySelector('.small');

// Start logging
btnStartLog.addEventListener('click', () => {
  if (isLogging) return;
  isLogging = true;
  logData = [];

  btnStartLog.textContent = "Logging...";
  btnStartLog.disabled = true;
  btnStartLog.style.opacity = "0.5";

  // ✅ Activate glowing indicator
  logIndicatorContainer.classList.add('active');
  logStatusText.textContent = "Logging active";

  logInterval = setInterval(() => {
    const timestamp = new Date().toLocaleTimeString();

    const row = {
      time: timestamp,
      g: document.getElementById("datA").innerText,
      i: document.getElementById("datB").innerText,
      h: document.getElementById("datC").innerText,
      d: document.getElementById("datD").innerText,
      e: document.getElementById("datE").innerText,
      f: document.getElementById("datF").innerText,
      a: document.getElementById("datG").innerText,
      c: document.getElementById("datH").innerText,
      b: document.getElementById("datI").innerText,
      j: document.getElementById("datJ").innerText,
      k: document.getElementById("datK").innerText,
      l: document.getElementById("datL").innerText
    };

    logData.push(row);
  }, 1000); // log every 1 second
});

// Save & export CSV
btnSaveLog.addEventListener('click', () => {
  if (!isLogging) return;

  isLogging = false;
  clearInterval(logInterval);

  btnStartLog.textContent = "Start";
  btnStartLog.disabled = false;
  btnStartLog.style.opacity = "1";

  // ✅ Turn off glowing indicator
  logIndicatorContainer.classList.remove('active');
  logStatusText.textContent = "Logging inactive";

  // Convert to CSV
  let csv = "Timestamp,Voltage (V),Current (A),Frequency (Hz),Accoustic Intensity (dB),Oil Level (%),Oil Density (kg/m³),Temperature (°C),Pressure (hPa),Altitude (m),PD Volts (μV),PD Frequency (GHz),PD Intensity\n";
  logData.forEach(entry => {
    csv += `${entry.time},${entry.a},${entry.b},${entry.c},${entry.d},${entry.e},${entry.f},${entry.g},${entry.h},${entry.i},${entry.j},${entry.k},${entry.l}\n`;
  });

  // Trigger CSV download
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TransformerLog_${new Date().toISOString().replace(/[:.]/g, "-")}.csv`;
  a.click();

  // ✅ Show frosted confirmation dialog
saveDialog.classList.add("active");
setTimeout(() => {
  saveDialog.classList.remove("active");
}, 3000);

});

// ===============================
// Control Commands
// ===============================
const mosfetACheck = document.getElementById('mosfetA');
const mosfetBCheck = document.getElementById('mosfetB');

const wled1Select = document.getElementById('wled1Select');
const wled2Select = document.getElementById('wled2Select');

const displayToggle = document.getElementById('displayModeToggle');
const displayTop = document.getElementById('displayTop');
const displayBottom = document.getElementById('displayBottom');
const displaySaveBtn = document.getElementById('displaySaveBtn');

// Refs
const mosfetARef = db.ref('devices/esp2/control/mosfetA');
const mosfetBRef = db.ref('devices/esp2/control/mosfetB');
const wled1Ref = db.ref('devices/esp2/control/wled1');
const wled2Ref = db.ref('devices/esp2/control/wled2');
const displayModeRef = db.ref('devices/esp2/control/display/mode');
const displayTopRef = db.ref('devices/esp2/control/display/top');
const displayBottomRef = db.ref('devices/esp2/control/display/bottom');

// Keep a small flag to avoid reacting to our own write echoes (optional)
let ignoreMosfetAUpdate = false;
let ignoreMosfetBUpdate = false;

mosfetARef.on('value', snap => {
  const v = snap.val();
  const state = (v === "1" || v === 1 || v === true || v === "true") ? true : false;
  // only update checkbox if different (avoids flicker)
  if (mosfetACheck.checked !== state) mosfetACheck.checked = state;
});

mosfetBRef.on('value', snap => {
  const v = snap.val();
  const state = (v === "1" || v === 1 || v === true || v === "true") ? true : false;
  if (mosfetBCheck.checked !== state) mosfetBCheck.checked = state;
});

// Write on user toggle
mosfetACheck.addEventListener('change', () => {
  const val = mosfetACheck.checked ? "1" : "0";
  mosfetARef.set(val).catch(err => console.error('mosfetA write failed', err));
});
mosfetBCheck.addEventListener('change', () => {
  const val = mosfetBCheck.checked ? "1" : "0";
  mosfetBRef.set(val).catch(err => console.error('mosfetB write failed', err));
});

// ---------- WLED selects: read & write ----------
// set initial select state from DB
wled1Ref.on('value', snap => {
  const v = snap.val();
  const idx = (v === null || v === undefined) ? "4" : String(v);
  if (wled1Select.value !== idx) wled1Select.value = idx;
});
wled2Ref.on('value', snap => {
  const v = snap.val();
  const idx = (v === null || v === undefined) ? "4" : String(v);
  if (wled2Select.value !== idx) wled2Select.value = idx;
});
// write on change
wled1Select.addEventListener('change', () => {
  const v = wled1Select.value; // "0".."4"
  wled1Ref.set(v).catch(err => console.error('wled1 write failed', err));
});
wled2Select.addEventListener('change', () => {
  const v = wled2Select.value;
  wled2Ref.set(v).catch(err => console.error('wled2 write failed', err));
});

// ---------- Display Mode + Text fields ----------
// display mode mapping: firmware uses 1 = auto, 0 = manual (custom).
// We'll show: Auto (left) <toggle> Manual (right). If toggle is checked => Manual (mode === 0)
displayModeRef.on('value', snap => {
  const v = snap.val();
  // default to auto (1) if missing
  const mode = (v === null || v === undefined) ? 1 : Number(v);
  const checked = (mode === 0); // manual => checked
  if (displayToggle.checked !== checked) displayToggle.checked = checked;
  // enable/disable inputs
  updateDisplayInputs(mode);
});

// fetch initial top/bottom
displayTopRef.on('value', snap => {
  const v = snap.val() || "";
  if (displayTop.value !== v) displayTop.value = v;
});
displayBottomRef.on('value', snap => {
  const v = snap.val() || "";
  if (displayBottom.value !== v) displayBottom.value = v;
});

// when user toggles display mode
displayToggle.addEventListener('change', () => {
  // checked = manual (0), unchecked = auto (1)
  const newMode = displayToggle.checked ? 0 : 1;
  displayModeRef.set(String(newMode)).catch(err => console.error('display mode write failed', err));
  updateDisplayInputs(newMode);
});

// helper to enable/disable inputs
function updateDisplayInputs(mode) {
  const manual = (mode === 0);
  displayTop.disabled = !manual;
  displayBottom.disabled = !manual;
  displaySaveBtn.disabled = !manual;
  // visual cue
  displayTop.style.opacity = manual ? "1" : "0.6";
  displayBottom.style.opacity = manual ? "1" : "0.6";
}

// when user clicks Set Text
displaySaveBtn.addEventListener('click', () => {
  // only allowed in manual
  displayTopRef.set(displayTop.value || "").catch(err => console.error('displayTop write failed', err));
  displayBottomRef.set(displayBottom.value || "").catch(err => console.error('displayBottom write failed', err));
});

// ensure initial state
updateDisplayInputs(1);

// ===============================
// Reboot Button + Dialog
// ===============================
const rebootDialog = document.getElementById('rebootDialog');
const rebootRef = db.ref('devices/esp2/control/reboot');

btnRefresh.addEventListener('click', () => {
  // Trigger reboot in RTDB
  rebootRef.set("1").catch(err => console.error("Reboot write failed:", err));

  // Show frosted dialog
  rebootDialog.classList.add('active');

  // Auto hide after 3s
  setTimeout(() => {
    rebootDialog.classList.remove('active');
  }, 3000);
});

// ===============================
// Sign Out Button + Dialog
// ===============================
const btnSignOut = document.getElementById('btnSignOut');
const signOutDialog = document.getElementById('signOutDialog');

btnSignOut.addEventListener('click', () => {
  // Show frosted dialog
  signOutDialog.classList.add('active');

  // Firebase sign out
  auth.signOut()
    .then(() => {
      console.log("User signed out successfully.");
      // Redirect to index.html after sign out
      window.location.href = "index.html";
    })
    .catch(err => {
      console.error("Sign out error:", err);
      alert("Sign out failed: " + err.message);
    });

  // Hide dialog after 3 seconds
  setTimeout(() => {
    signOutDialog.classList.remove('active');
  }, 3000);
});
