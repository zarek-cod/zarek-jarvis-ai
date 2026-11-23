import { useEffect, useRef } from 'react';
import { useAppStore } from '../lib/store';

const PARTICLES = Array.from({ length: 34 }, (_, index) => ({
  left: `${(index * 37) % 101}%`,
  top: `${(index * 61) % 103}%`,
  delay: `${-(index % 12) * 0.7}s`,
  duration: `${8 + (index % 9)}s`,
  size: `${1 + (index % 3)}px`,
}));

export function AmbientStage() {
  const stageRef = useRef<HTMLDivElement>(null);
  const quality = useAppStore((state) => state.settings.graphicsQuality);
  const particleCount = quality === 'low' ? 12 : quality === 'ultra' ? 34 : 23;

  useEffect(() => {
    if (quality === 'low' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const move = (event: PointerEvent) => {
      const x = (event.clientX / innerWidth - .5) * 14;
      const y = (event.clientY / innerHeight - .5) * 14;
      stageRef.current?.style.setProperty('--parallax-x', `${x}px`);
      stageRef.current?.style.setProperty('--parallax-y', `${y}px`);
      stageRef.current?.style.setProperty('--parallax-inverse-x', `${x * -.7}px`);
      stageRef.current?.style.setProperty('--parallax-inverse-y', `${y * -.7}px`);
      stageRef.current?.style.setProperty('--parallax-far-x', `${x * .22}px`);
      stageRef.current?.style.setProperty('--parallax-far-y', `${y * .22}px`);
    };
    addEventListener('pointermove', move, { passive: true });
    return () => removeEventListener('pointermove', move);
  }, [quality]);

  return (
    <div ref={stageRef} className="zarek-ambient-stage" data-quality={quality} aria-hidden="true">
      <div className="zarek-galaxy is-violet" />
      <div className="zarek-galaxy is-blue" />
      <div className="zarek-star-depth" />
      <div className="zarek-volumetric-beam" />
      <div className="zarek-gravity-wave is-one" />
      <div className="zarek-gravity-wave is-two" />
      <div className="zarek-energy-collision"><span /><i /></div>
      <div className="zarek-aurora is-left" />
      <div className="zarek-aurora is-right" />
      <div className="zarek-lightning is-one"><span /><i /><b /></div>
      <div className="zarek-lightning is-two"><span /><i /><b /></div>
      <div className="zarek-crystal-field" />
      <div className="zarek-particle-field">
        {PARTICLES.slice(0, particleCount).map((particle, index) => (
          <span key={index} style={{
            left: particle.left,
            top: particle.top,
            animationDelay: particle.delay,
            animationDuration: particle.duration,
            width: particle.size,
            height: particle.size,
          }} />
        ))}
      </div>
    </div>
  );
}
