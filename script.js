const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

window.addEventListener('resize', () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

class Particle {
  constructor(x, y, vx, vy, isAmbient = false) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.radius = 5;
    this.alpha = isAmbient ? 0 : 1;
    this.targetAlpha = 1;
    this.isFadingIn = isAmbient;
    this.isDead = false;
    this.history = [];
  }

  update() {
    const friction = 0.997;
    this.vx *= friction;
    this.vy *= friction;

    const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);

    if (this.isFadingIn) {
      this.alpha += 0.02;
      if (this.alpha >= this.targetAlpha) {
        this.alpha = this.targetAlpha;
        this.isFadingIn = false;
      }
    } else if (speed < 0.15) {
      this.alpha -= 0.008;
      if (this.alpha <= 0) {
        this.isDead = true;
      }
    }

    this.history.push({ x: this.x, y: this.y });
    const maxTrailLength = Math.min(25, Math.floor(5 + speed * 2));
    if (this.history.length > maxTrailLength) {
      this.history.shift();
    }

    this.x += this.vx;
    this.y += this.vy;

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

    // Trail
    if (this.history.length > 1) {
      ctx.save();
      for (let i = 0; i < this.history.length - 1; i++) {
        const p1 = this.history[i];
        const p2 = this.history[i + 1];
        const ratio = i / this.history.length;

        ctx.beginPath();
        ctx.moveTo(p1.x, p1.y);
        ctx.lineTo(p2.x, p2.y);

        let trailColor;
        if (speed > 8) {
          trailColor = `rgba(255, 255, 255, ${ratio * this.alpha})`;
          ctx.lineWidth = ratio * (this.radius * 1.8);
          ctx.shadowBlur = 15;
          ctx.shadowColor = '#38bdf8';
        } else {
          trailColor = `rgba(56, 189, 248, ${ratio * 0.6 * this.alpha})`;
          ctx.lineWidth = ratio * (this.radius * 1.2);
          ctx.shadowBlur = 5;
          ctx.shadowColor = '#0284c7';
        }

        ctx.strokeStyle = trailColor;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
      ctx.restore();
    }

    // Partikel Core
    const dynamicRadius = this.radius + Math.min(8, speed * 0.6);
    const lightness = Math.min(95, 60 + speed * 4);
    const glowRadius = Math.min(45, 12 + speed * 3.5);

    ctx.save();
    ctx.beginPath();
    ctx.arc(this.x, this.y, dynamicRadius, 0, Math.PI * 2);
    ctx.shadowBlur = glowRadius;
    ctx.shadowColor = `hsla(190, 100%, 70%, ${this.alpha})`;
    ctx.fillStyle = `hsla(190, 100%, ${lightness}%, ${this.alpha})`;
    ctx.fill();

    if (speed > 2) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, dynamicRadius * 0.5, 0, Math.PI * 2);
      ctx.shadowBlur = glowRadius * 0.5;
      ctx.shadowColor = `rgba(255, 255, 255, ${this.alpha})`;
      ctx.fillStyle = `rgba(255, 255, 255, ${Math.min(1, this.alpha * (speed / 5))})`;
      ctx.fill();
    }
    ctx.restore();
  }
}

let particles = [];
const maxParticles = 25; // Jumlah partikel yang pas agar jaringannya padat
let lastSpawnTime = 0;

function spawnAmbientParticle() {
  const x = Math.random() * (width - 100) + 50;
  const y = Math.random() * (height - 100) + 50;

  const randomAngle = Math.random() * Math.PI * 2;
  const randomSpeed = 0.5 + Math.random() * 1.5;
  const vx = Math.cos(randomAngle) * randomSpeed;
  const vy = Math.sin(randomAngle) * randomSpeed;

  particles.push(new Particle(x, y, vx, vy, true));
}

let isDragging = false;
let startX = 0;
let startY = 0;
let currentX = 0;
let currentY = 0;
let dragDistance = 0;
let timeTicks = 0;

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
    if (dragDistance < 5) {
      const randomAngle = Math.random() * Math.PI * 2;
      const randomSpeed = 2 + Math.random() * 5;
      const vx = Math.cos(randomAngle) * randomSpeed;
      const vy = Math.sin(randomAngle) * randomSpeed;

      particles.push(new Particle(startX, startY, vx, vy));
    } else {
      const powerMultiplier = 0.15;
      const vx = (startX - e.clientX) * powerMultiplier;
      const vy = (startY - e.clientY) * powerMultiplier;

      particles.push(new Particle(startX, startY, vx, vy));
    }

    isDragging = false;
  }
});

function animate(timestamp) {
  timeTicks += 0.1;
  ctx.clearRect(0, 0, width, height);

  if (timestamp - lastSpawnTime > 600 && particles.length < maxParticles) {
    spawnAmbientParticle();
    lastSpawnTime = timestamp;
  }

  particles = particles.filter((p) => !p.isDead);

  // Render & Logic
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();

    // GAMBAR GARIS GRAF SUPER BRIGHT & THICK
    const maxDistance = 250;

    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);

        const minAlpha = Math.min(particles[i].alpha, particles[j].alpha);
        const lineOpacity = (1 - distance / maxDistance) * minAlpha;

        ctx.shadowBlur = 8;
        ctx.shadowColor = '#38bdf8';
        ctx.strokeStyle = `rgba(56, 189, 248, ${lineOpacity})`;
        ctx.lineWidth = 2.5;
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // Ketapel
  if (isDragging && dragDistance >= 5) {
    ctx.save();

    const tension = Math.min(100, dragDistance);
    const wobble = Math.sin(timeTicks * 3) * (tension * 0.05);

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      (startX + currentX) / 2 + wobble,
      (startY + currentY) / 2 + wobble,
      currentX,
      currentY
    );
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.lineWidth = 8 + tension * 0.05;
    ctx.shadowBlur = 20;
    ctx.shadowColor = '#38bdf8';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(
      (startX + currentX) / 2 + wobble,
      (startY + currentY) / 2 + wobble,
      currentX,
      currentY
    );
    ctx.strokeStyle = `rgba(255, 255, 255, 0.9)`;
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(startX, startY, 8 + Math.sin(timeTicks * 5) * 2, 0, Math.PI * 2);
    ctx.fillStyle = '#facc15';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#facc15';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(currentX, currentY, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ffffff';
    ctx.fill();

    ctx.restore();
  }

  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);