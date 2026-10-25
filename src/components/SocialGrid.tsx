import { SOCIALS } from '../lib/socials';

const CastingCallIcon = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="#2bdc70" style={{ filter: 'drop-shadow(0 0 4px rgba(43,220,112,0.4))' }}>
    <path d="M12 1a4 4 0 0 1 4 4v6a4 4 0 0 1-8 0V5a4 4 0 0 1 4-4zm0 2a2 2 0 0 0-2 2v6a2 2 0 0 0 4 0V5a2 2 0 0 0-2-2zm7 7a1 1 0 0 1 1 1 8 8 0 0 1-7 7.93V21h2a1 1 0 0 1 0 2H9a1 1 0 0 1 0-2h2v-2.07A8 8 0 0 1 4 11a1 1 0 0 1 2 0 6 6 0 0 0 12 0 1 1 0 0 1 1-1z" />
  </svg>
);

export default function SocialGrid() {
  return (
    <div className="text-center">
      <div className="eyebrow justify-center mb-3">Find Us Everywhere</div>
      <h2 className="font-display text-4xl sm:text-5xl mb-8">Follow the Journey</h2>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
        {SOCIALS.map((s) => (
          <a
            key={s.name}
            href={s.href}
            target="_blank"
            rel="noopener noreferrer"
            className="neon-card flex flex-col items-center justify-center gap-2 py-4 px-2 hover:-translate-y-0.5"
          >
            <div className="h-12 w-12 rounded-lg border border-border bg-background/60 flex items-center justify-center">
              {s.icon ? (
                <img
                  src={`https://cdn.simpleicons.org/${s.icon}/2bdc70`}
                  width={28}
                  height={28}
                  alt={s.name}
                  style={{ display: 'block', filter: 'drop-shadow(0 0 4px rgba(43,220,112,0.4))' }}
                />
              ) : (
                <CastingCallIcon />
              )}
            </div>
            <div className="font-tech text-[0.6rem] uppercase tracking-widest text-muted-foreground leading-tight">{s.label}</div>
          </a>
        ))}
      </div>
    </div>
  );
}
