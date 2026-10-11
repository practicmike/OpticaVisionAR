interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  /** Use on dark/brand backgrounds. */
  inverted?: boolean;
  className?: string;
}

/** Centered section title + subtitle + short brand-blue bar (CardaniVision style). */
const SectionHeading = ({ title, subtitle, inverted = false, className = '' }: SectionHeadingProps) => (
  <div className={`text-center mb-12 md:mb-16 ${className}`}>
    <h2 className={`section-title ${inverted ? '!text-white' : ''}`}>{title}</h2>
    {subtitle && (
      <p className={`section-description ${inverted ? '!text-white/80' : ''}`}>{subtitle}</p>
    )}
    <div className="section-divider" aria-hidden="true" />
  </div>
);

export default SectionHeading;
