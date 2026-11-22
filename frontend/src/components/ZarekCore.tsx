import { useEffect, useMemo, useRef } from 'react';
import { useAppStore } from '../lib/store';
import { useAudioReactor, type ReactorMode } from '../lib/audio-reactor';

const STATE_LABEL: Record<ReactorMode, string> = {
  standby: 'SISTEMAS EN ESPERA',
  listening: 'ESCUCHANDO',
  thinking: 'PROCESANDO',
  speaking: 'TRANSMITIENDO',
  executing: 'EJECUTANDO',
  success: 'OPERACIÓN COMPLETADA',
  error: 'ATENCIÓN REQUERIDA',
};

interface Particle {
  angle: number;
  radius: number;
  speed: number;
  size: number;
  phase: number;
}

function createParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, index) => ({
    angle: (index / count) * Math.PI * 2,
    radius: 0.31 + ((index * 37) % 61) / 100,
    speed: 0.04 + ((index * 13) % 17) / 120,
    size: 0.7 + ((index * 7) % 11) / 8,
    phase: ((index * 29) % 100) / 100,
  }));
}

function stateEnergy(mode: ReactorMode): number {
  if (mode === 'speaking') return 0.58;
  if (mode === 'listening') return 0.44;
  if (mode === 'thinking' || mode === 'executing') return 0.5;
  if (mode === 'success') return 0.34;
  if (mode === 'error') return 0.4;
  return 0.14;
}

export function ZarekCore({ compact = false }: { compact?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sourceMode = useAudioReactor((state) => state.sourceMode);
  // Zustand 5 requires an externally stable snapshot. Selecting one object
  // literal here creates a new reference during every store read and can
  // trigger React's maximum-update-depth guard; scalar selectors stay stable.
  const level = useAudioReactor((state) => state.level);
  const bass = useAudioReactor((state) => state.bass);
  const mid = useAudioReactor((state) => state.mid);
  const treble = useAudioReactor((state) => state.treble);
  const bands = { level, bass, mid, treble };
  const streamState = useAppStore((state) => state.streamState);
  const particles = useMemo(() => createParticles(compact ? 34 : 72), [compact]);

  let mode: ReactorMode = sourceMode;
  if (sourceMode === 'standby' && streamState.isStreaming) {
    mode = streamState.activeToolCalls.some((call) => call.status === 'running')
      ? 'executing'
      : 'thinking';
  }

  const renderState = useRef<{ bands: typeof bands; mode: ReactorMode }>({ bands, mode });
  renderState.current = { bands, mode };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let frame = 0;
    let lastDraw = 0;

    const draw = (now: number) => {
      frame = requestAnimationFrame(draw);
      const minimumFrame = document.hidden ? 120 : reducedMotion ? 48 : 15;
      if (now - lastDraw < minimumFrame) return;
      lastDraw = now;
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.floor(bounds.width * dpr));
      const height = Math.max(1, Math.floor(bounds.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      context.clearRect(0, 0, bounds.width, bounds.height);

      const { bands: live, mode: liveMode } = renderState.current;
      const cx = bounds.width / 2;
      const cy = bounds.height / 2;
      const unit = Math.min(bounds.width, bounds.height) / 2;
      const time = reducedMotion ? 0 : now / 1000;
      const energy = stateEnergy(liveMode) + live.level * 0.75;
      const hue = liveMode === 'error' ? '255, 76, 118' : '0, 217, 255';

      context.save();
      context.globalCompositeOperation = 'lighter';
      const aura = context.createRadialGradient(cx, cy, unit * 0.08, cx, cy, unit * 0.96);
      aura.addColorStop(0, `rgba(${hue}, ${0.22 + energy * 0.2})`);
      aura.addColorStop(0.45, `rgba(0, 123, 255, ${0.08 + energy * 0.12})`);
      aura.addColorStop(1, 'rgba(0, 18, 38, 0)');
      context.fillStyle = aura;
      context.beginPath();
      context.arc(cx, cy, unit * (0.86 + live.bass * 0.09), 0, Math.PI * 2);
      context.fill();

      const ringData = [
        { radius: 0.78, band: live.treble, speed: 0.18, segments: 18, width: 1.1 },
        { radius: 0.63, band: live.mid, speed: -0.25, segments: 12, width: 1.8 },
        { radius: 0.49, band: live.bass, speed: 0.34, segments: 8, width: 2.2 },
      ];
      for (const ring of ringData) {
        const radius = unit * (ring.radius + ring.band * 0.055);
        const segment = (Math.PI * 2) / ring.segments;
        context.lineCap = 'round';
        context.lineWidth = ring.width + ring.band * 3.2;
        context.strokeStyle = `rgba(${hue}, ${0.28 + energy * 0.54})`;
        context.shadowColor = `rgba(${hue}, 0.9)`;
        context.shadowBlur = 7 + ring.band * 18;
        for (let index = 0; index < ring.segments; index += 1) {
          const start = index * segment + time * ring.speed;
          context.beginPath();
          context.arc(cx, cy, radius, start, start + segment * 0.57);
          context.stroke();
        }
      }

      // Electric arcs bridge the outer reactor rings. They are deterministic,
      // voice-reactive and deliberately irregular so the core feels alive.
      if (!reducedMotion) {
        const arcCount = 3 + Math.round(energy * 4);
        context.lineCap = 'round';
        for (let arc = 0; arc < arcCount; arc += 1) {
          const angle = time * (0.3 + arc * 0.025) + arc * 2.17;
          const inner = unit * (0.28 + (arc % 2) * 0.1);
          const outer = unit * (0.63 + live.treble * 0.12);
          context.beginPath();
          for (let point = 0; point <= 8; point += 1) {
            const ratio = point / 8;
            const jitter = Math.sin(time * 9 + arc * 17 + point * 4.7) * unit * 0.022;
            const radius = inner + (outer - inner) * ratio + jitter;
            const pointAngle = angle + ratio * (0.24 + live.mid * 0.3) + Math.sin(point * 5.2) * 0.025;
            const x = cx + Math.cos(pointAngle) * radius;
            const y = cy + Math.sin(pointAngle) * radius;
            if (point === 0) context.moveTo(x, y);
            else context.lineTo(x, y);
          }
          context.strokeStyle = `rgba(${hue}, ${0.18 + energy * 0.42})`;
          context.lineWidth = 0.65 + live.level * 1.4;
          context.shadowColor = `rgba(${hue}, 1)`;
          context.shadowBlur = 10 + live.level * 18;
          context.stroke();
        }
      }

      context.shadowBlur = 8 + live.level * 16;
      for (const particle of particles) {
        const angle = particle.angle + time * particle.speed * (1 + energy * 2.4);
        const pulse = Math.sin(time * 1.7 + particle.phase * Math.PI * 2) * 0.025;
        const radius = unit * (particle.radius + pulse + live.treble * 0.04);
        const x = cx + Math.cos(angle) * radius;
        const y = cy + Math.sin(angle) * radius;
        context.fillStyle = `rgba(${hue}, ${0.2 + energy * 0.62})`;
        context.beginPath();
        context.arc(x, y, particle.size * (0.7 + energy), 0, Math.PI * 2);
        context.fill();
      }

      const coreRadius = unit * (0.235 + live.level * 0.075);
      const core = context.createRadialGradient(cx, cy, 0, cx, cy, coreRadius);
      core.addColorStop(0, 'rgba(235, 253, 255, 0.98)');
      core.addColorStop(0.18, `rgba(${hue}, 0.9)`);
      core.addColorStop(0.58, 'rgba(0, 123, 255, 0.42)');
      core.addColorStop(1, 'rgba(0, 73, 130, 0)');
      context.fillStyle = core;
      context.beginPath();
      context.arc(cx, cy, coreRadius, 0, Math.PI * 2);
      context.fill();

      // Dark holographic crystal facets wrap the luminous center.
      context.save();
      context.translate(cx, cy);
      context.rotate(time * -0.08);
      for (let facet = 0; facet < 10; facet += 1) {
        const angle = (facet / 10) * Math.PI * 2;
        const next = angle + Math.PI / 5;
        const inner = coreRadius * 0.72;
        const outer = coreRadius * (1.48 + Math.sin(time * 1.3 + facet) * 0.08);
        context.beginPath();
        context.moveTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
        context.lineTo(Math.cos(angle + Math.PI / 10) * outer, Math.sin(angle + Math.PI / 10) * outer);
        context.lineTo(Math.cos(next) * inner, Math.sin(next) * inner);
        context.closePath();
        context.fillStyle = facet % 2
          ? `rgba(0, 28, 61, ${0.28 + energy * 0.12})`
          : `rgba(${hue}, ${0.08 + energy * 0.12})`;
        context.strokeStyle = `rgba(${hue}, ${0.22 + energy * 0.28})`;
        context.lineWidth = 0.7;
        context.fill();
        context.stroke();
      }
      context.restore();
      context.restore();
    };

    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [particles]);

  return (
    <section className={`zarek-core ${compact ? 'zarek-core--compact' : ''}`} aria-label={`JARVIS: ${STATE_LABEL[mode]}`}>
      <canvas ref={canvasRef} className="zarek-core__canvas" aria-hidden="true" />
      <img className="zarek-core__emblem" src="/zarek-emblem.png" alt="" aria-hidden="true" />
      <div className="zarek-core__reticle" aria-hidden="true" />
      <div className="zarek-core__status">
        <span className={`zarek-core__status-dot is-${mode}`} />
        <span>{STATE_LABEL[mode]}</span>
      </div>
    </section>
  );
}
