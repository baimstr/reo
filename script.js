const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

class Particle {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.alpha = 1; // Tingkat transparansi (1 = terlihat penuh, 0 = hilang)
    this.isDead = false;
  }

  update() {
    // 1. Air Resistance (Hambatan Udara) - memperlambat kecepatan secara bertahap
    const friction = 0.985;
    this.vx *= friction;
    this.vy *= friction;

    // Hitung total kecepatan saat ini
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    // 2. Jika partikel hampir berhenti (kecepatan sangat rendah), kurangi transparansi (fading out)
    if (speed < 0.2) {
      this.alpha -= 0.015;
      if (this.alpha <= 0) {
        this.isDead = true; // Tandai untuk dihapus dari memori
      }
    }

    // Update posisi berdasarkan kecepatan
    this.x += this.vx;
    this.y += this.vy;

    // Memantul dari pinggir layar & kehilangan sedikit energi saat memantul
    if (this.x < 0 || this.x > width) {
      this.vx *= -0.8;
      this.x = Math.max(0, Math.min(width, this.x));
    }
    if (this.y < 0 || this.y > height) {
      this.vy *= -0.8;
      this.y = Math.max(0, Math.min(height, this.y));
    }
  }

  draw() {
    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    // 3. Skala Warna Dinamis Berdasarkan Kecepatan
    // Pelan = Biru (#38bdf8), Sedang = Kuning (#facc15), Kencang = Merah/Oranye (#ef4444)
    let color;
    if (speed > 8) {
      color = `rgba(239, 68, 68, ${this.alpha})`; // Merah kencang
    } else if (speed > 3) {
      color = `rgba(250, 204, 21, ${this.alpha})`; // Kuning sedang
    } else {
      color = `rgba(56, 189, 248, ${this.alpha})`; // Biru santai
    }

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }
}

let particles = [];
const maxDistance = 150;

// Variabel untuk Mekanisme Ketapel (Sling)
let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;

// Event Handler: Mulai menahan kursor (Klik & Tahan)
window.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  currentX = e.clientX;
  currentY = e.clientY;
});

// Event Handler: Menggeser kursor selama ditahan
window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    currentX = e.clientX;
    currentY = e.clientY;
  }
});

// Event Handler: Melepas klik (Lepaskan ketapel!)
window.addEventListener('mouseup', (e) => {
  if (isDragging) {
    // Kecepatan dihitung dari jarak pergeseran kursor
    const powerMultiplier = 0.15; // Pengali kekuatan lemparan
    const vx = (startX - e.clientX) * powerMultiplier;
    const vy = (startY - e.clientY) * powerMultiplier;

    // Buat partikel baru dari posisi tembak
    particles.push(new Particle(startX, startY, vx, vy));

    isDragging = false;
  }
});

function animate() {
  ctx.clearRect(0, 0, width, height);

  // Filter partikel yang sudah mati (hilang sepenuhnya)
  particles = particles.filter((p) => !p.isDead);

  // Update & gambar semua partikel
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    // Gambar garis antar titik jika berdekatan
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);

        // Opasitas garis juga dipengaruhi oleh transparansi terendah antar 2 partikel
        const minAlpha = Math.min(particles[i].alpha, particles[j].alpha);
        const lineOpacity = (1 - distance / maxDistance) * minAlpha;

        ctx.strokeStyle = `rgba(148, 163, 184, ${lineOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Visualisasi Garis Ketapel & Titik Awal saat Menahan Mouse
  if (isDragging) {
    // Titik Awal
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ef4444';
    ctx.fill();

    // Garis Tarikan Ketapel
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); // Garis putus-putus
    ctx.stroke();
    ctx.setLineDash([]); // Reset garis biasa
  }

  requestAnimationFrame(animate);
}

animate();