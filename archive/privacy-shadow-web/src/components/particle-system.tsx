'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  data: string;
  alpha: number;
}

interface ParticleSystemProps {
  dataCategories: {
    location: number;
    identity: number;
    contacts: number;
    browsing: number;
    media: number;
  };
}

export function ParticleSystem({ dataCategories }: ParticleSystemProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const mouseRef = useRef({ x: -1000, y: -1000 }); // Start off-screen

  // Color mapping for data types
  const colors = {
    location: '#EF4444',    // Red
    identity: '#8B5CF6',    // Purple
    contacts: '#EC4899',    // Pink
    browsing: '#F59E0B',    // Orange
    media: '#10B981',       // Green
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Track mouse position
    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('mouseleave', handleMouseLeave);

    // Initialize particles based on data categories
    const initializeParticles = () => {
      const particles: Particle[] = [];
      const particleCount = Math.max(
        50,
        Math.floor((dataCategories.location + dataCategories.identity + dataCategories.contacts + dataCategories.browsing + dataCategories.media) / 2)
      );

      // Add particles for each data type
      const addParticlesForType = (type: keyof typeof colors, count: number) => {
        for (let i = 0; i < count; i++) {
          particles.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 1.5,
            vy: (Math.random() - 0.5) * 1.5,
            size: Math.random() * 4 + 2,
            color: colors[type],
            data: type,
            alpha: Math.random() * 0.5 + 0.5,
          });
        }
      };

      addParticlesForType('location', Math.floor(dataCategories.location / 10));
      addParticlesForType('identity', Math.floor(dataCategories.identity / 10));
      addParticlesForType('contacts', Math.floor(dataCategories.contacts / 10));
      addParticlesForType('browsing', Math.floor(dataCategories.browsing / 10));
      addParticlesForType('media', Math.floor(dataCategories.media / 10));

      return particles;
    };

    particlesRef.current = initializeParticles();

    // Animation loop
    let animationFrameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const particles = particlesRef.current;

      // Update and draw particles
      particles.forEach((particle, i) => {
        // Mouse interaction - particles are repelled by mouse
        const mouse = mouseRef.current;
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 120;

        if (distance < maxDistance) {
          const force = (maxDistance - distance) / maxDistance;
          const angle = Math.atan2(dy, dx);
          particle.vx += Math.cos(angle) * force * 0.5;
          particle.vy += Math.sin(angle) * force * 0.5;
        }

        // Apply friction to prevent infinite acceleration
        particle.vx *= 0.99;
        particle.vy *= 0.99;

        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width;
        if (particle.x > canvas.width) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.height;
        if (particle.y > canvas.height) particle.y = 0;

        // Draw particle with glow
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.shadowBlur = 15;
        ctx.shadowColor = particle.color;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      // Draw connections between nearby particles
      ctx.save();
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach(p2 => {
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);
          if (dist < 80) {
            // Convert hex color to rgba — colors are stored as '#RRGGBB'
            const hexToRgba = (hex: string, alpha: number) => {
              const r = parseInt(hex.slice(1, 3), 16);
              const g = parseInt(hex.slice(3, 5), 16);
              const b = parseInt(hex.slice(5, 7), 16);
              return `rgba(${r},${g},${b},${alpha})`;
            };

            const gradient = ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
            gradient.addColorStop(0, hexToRgba(p1.color, 0.2));
            gradient.addColorStop(1, hexToRgba(p2.color, 0.2));

            ctx.strokeStyle = gradient;
            ctx.lineWidth = 0.5;
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.stroke();
          }
        });
      });
      ctx.restore();

      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [dataCategories]);

  return (
    <div className="relative w-full h-full min-h-[400px] bg-slate-900/50 rounded-xl overflow-hidden border border-slate-700">
      <canvas
        ref={canvasRef}
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Legend */}
      <div className="absolute bottom-4 left-4 flex flex-wrap gap-3 bg-slate-800/90 backdrop-blur-sm p-3 rounded-lg border border-slate-700">
        <LegendItem color={colors.location} label="Location" />
        <LegendItem color={colors.identity} label="Identity" />
        <LegendItem color={colors.contacts} label="Contacts" />
        <LegendItem color={colors.browsing} label="Browsing" />
        <LegendItem color={colors.media} label="Media" />
      </div>

      {/* Particle count badge */}
      <div className="absolute top-4 right-4 bg-slate-800/90 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-700 text-sm">
        <span className="text-purple-400 font-semibold">
          {Math.floor((dataCategories.location + dataCategories.identity + dataCategories.contacts + dataCategories.browsing + dataCategories.media) / 10)} particles
        </span>
      </div>
    </div>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <div
        className="w-3 h-3 rounded-full"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
      />
      <span className="text-slate-300">{label}</span>
    </div>
  );
}
