const MODEL_URL = "./model/model.json";
const METADATA_URL = "./model/metadata.json";

let model, webcam, maxPredictions, loop = false;
const statusEl = document.getElementById("status");
const resultEl = document.getElementById("result");
const previewEl = document.getElementById("preview");

async function loadModel() {
  try {
    model = await tmImage.load(MODEL_URL, METADATA_URL);
    maxPredictions = model.getTotalClasses();
    statusEl.textContent = "Model siap. Silakan buka kamera atau upload gambar.";
  } catch (e) {
    statusEl.textContent = "Gagal memuat model. Jalankan lewat server lokal (bukan klik dua kali file).";
    console.error(e);
  }
}

function showResult(prediction) {
  resultEl.innerHTML = "";
  prediction.sort((a, b) => b.probability - a.probability);
  prediction.forEach(p => {
    const pct = (p.probability * 100).toFixed(1);
    resultEl.innerHTML += `
      <div class="bar-row">${p.className}
        <div class="bar"><div style="width:${pct}%">${pct}%</div></div>
      </div>`;
  });
}

async function predictCam() {
  if (!loop) return;
  webcam.update();
  showResult(await model.predict(webcam.canvas));
  requestAnimationFrame(predictCam);
}

document.getElementById("btnCamera").addEventListener("click", async () => {
  if (!model) return;
  if (webcam) { loop = false; webcam.stop(); webcam = null; previewEl.innerHTML = ""; return; }
  statusEl.textContent = "Membuka kamera...";
  webcam = new tmImage.Webcam(300, 300, true);
  try {
    await webcam.setup();
    await webcam.play();
  } catch (e) {
    statusEl.textContent = "Kamera tidak bisa dibuka.";
    webcam = null;
    return;
  }
  previewEl.innerHTML = "";
  previewEl.appendChild(webcam.canvas);
  statusEl.textContent = "Kamera aktif (klik lagi untuk menutup).";
  loop = true;
  requestAnimationFrame(predictCam);
});

document.getElementById("fileInput").addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file || !model) return;
  if (webcam) { loop = false; webcam.stop(); webcam = null; }
  const img = new Image();
  img.onload = async () => {
    previewEl.innerHTML = "";
    previewEl.appendChild(img);
    showResult(await model.predict(img));
    statusEl.textContent = "Selesai.";
  };
  img.src = URL.createObjectURL(file);
});

loadModel();
