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
    this.alpha = 1;
    this.isDead = false;
  }

  update() {
    // VARIABEL AIR RESISTANCE (Ubah nilai ini untuk mengatur gesekan udara)
    const friction = 0.992; 
    this.vx *= friction;
    this.vy *= friction;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    // Memudar perlahan saat benar-benar hampir berhenti
    if (speed < 0.15) {
      this.alpha -= 0.008; 
      if (this.alpha <= 0) {
        this.isDead = true;
      }
    }

    this.x += this.vx;
    this.y += this.vy;

    // Memantul dari tepi layar
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

    // Biru makin terang & bersinar saat makin cepat
    const lightness = Math.min(90, 50 + speed * 4); // Tingkat kecerahan biru
    const glowRadius = Math.min(25, 5 + speed * 2);  // Ukuran pendaran cahaya

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);

    // Efek Cahaya / Glow
    ctx.shadowBlur = glowRadius;
    ctx.shadowColor = `hsla(199, 89%, ${lightness}%, ${this.alpha})`;
    ctx.fillStyle = `hsla(199, 89%, ${lightness}%, ${this.alpha})`;
    ctx.fill();
    ctx.restore();
  }
}

let particles = [];
const maxDistance = 150;

let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let dragDistance = 0;

window.addEventListener('mousedown', (e) => {
  isDragging = true;
  startX = e.clientX;
  startY = e.clientY;
  currentX = e.clientX;
  currentY = e.clientY;
  dragDistance = 0;
});

window.addEventListener('mousemove', (e) => {
  if (isDragging) {
    currentX = e.clientX;
    currentY = e.clientY;
    const dx = currentX - startX;
    const dy = currentY - startY;
    dragDistance = Math.sqrt(dx * dx + dy * dy);
  }
});

window.addEventListener('mouseup', (e) => {
  if (isDragging) {
    // Jika hanya TAP biasa (geseran sangat kecil), beri kecepatan acak
    if (dragDistance < 5) {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomSpeed = 2 + Math.random() * 4; // Initial velocity acak
      const vx = Math.cos(randomAngle) * randomSpeed;
      const vy = Math.sin(randomAngle) * randomSpeed;

      particles.push(new Particle(startX, startY, vx, vy));
    } else {
      // Jika DITAHAN & DIGESER (Ketapel)
      const powerMultiplier = 0.15;
      const vx = (startX - e.clientX) * powerMultiplier;
      const vy = (startY - e.clientY) * powerMultiplier;

      particles.push(new Particle(startX, startY, vx, vy));
    }

    isDragging = false;
  }
});

function animate() {
  ctx.clearRect(0, 0, width, height);

  particles = particles.filter((p) => !p.isDead);

  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);

        const minAlpha = Math.min(particles[i].alpha, particles[j].alpha);
        const lineOpacity = (1 - distance / maxDistance) * minAlpha;

        ctx.strokeStyle = `rgba(56, 189, 248, ${lineOpacity})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }

  // Visualisasi Ketapel
  if (isDragging && dragDistance >= 5) {
    ctx.beginPath();
    ctx.arc(startX, startY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#38bdf8';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(currentX, currentY);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  requestAnimationFrame(animate);
}

animate();