const PARTICLES = Array.from({ length: 34 }, (_, index) => ({
  left: `${(index * 37) % 101}%`,
  top: `${(index * 61) % 103}%`,
  delay: `${-(index % 12) * 0.7}s`,
  duration: `${8 + (index % 9)}s`,
  size: `${1 + (index % 3)}px`,
}));

export function AmbientStage() {
  return (
    <div className="zarek-ambient-stage" aria-hidden="true">
      <div className="zarek-aurora is-left" />
      <div className="zarek-aurora is-right" />
      <div className="zarek-lightning is-one"><span /><i /><b /></div>
      <div className="zarek-lightning is-two"><span /><i /><b /></div>
      <div className="zarek-crystal-field" />
      <div className="zarek-particle-field">
        {PARTICLES.map((particle, index) => (
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
