import peacockMark from '../assets/peacock-logo.jpg';

// The peacock mark is a gold illustration on a plain white background (no alpha channel).
// mix-blend-mode: multiply drops the white to whatever surface it sits on (our beige tones)
// so it reads as if it were transparent, without needing to re-export the asset.
export default function Logo({ size = 'md' }) {
  return (
    <span className={`logo logo-${size}`}>
      <img src={peacockMark} alt="" className="logo-mark-image" />
      <span className="logo-text">Catalogue</span>
    </span>
  );
}
