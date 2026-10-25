import { Link } from 'react-router-dom';

export default function Logo({ height = 38 }: { height?: number }) {
  return (
    <Link to="/" aria-label="Press Play home" className="shrink-0">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 44" height={height} style={{ display: 'block' }}>
        <defs>
          <linearGradient id="ppg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#2bdc70" />
            <stop offset="100%" stopColor="#7fff5f" />
          </linearGradient>
        </defs>
        <polygon points="6,22 14,8 30,8 38,22 30,36 14,36" fill="none" stroke="url(#ppg)" strokeWidth="1.5" />
        <polygon points="16,15 16,29 30,22" fill="url(#ppg)" />
        <text x="48" y="20" fontFamily="Orbitron,sans-serif" fontWeight="900" fontSize="13" letterSpacing="2" fill="#f0eee8">
          PRESS <tspan fill="url(#ppg)">PLAY</tspan>
        </text>
        <text x="48" y="35" fontFamily="Orbitron,sans-serif" fontWeight="400" fontSize="7.5" letterSpacing="3.5" fill="#b8b6c8">
          INTERNATIONAL MEDIA
        </text>
        <line x1="48" y1="38.5" x2="100" y2="38.5" stroke="#2bdc70" strokeWidth="0.8" opacity="0.4" />
      </svg>
    </Link>
  );
}
