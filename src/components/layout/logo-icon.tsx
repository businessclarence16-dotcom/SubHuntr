// SubHuntr logo — crosshair reticle on dark background

interface LogoIconProps {
  size?: number
  className?: string
}

export function LogoIcon({ size = 24, className }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="80" fill="#111113" />
      <circle cx="256" cy="256" r="95" fill="none" stroke="#1D9E75" strokeWidth="30" />
      <circle cx="256" cy="256" r="22" fill="#1D9E75" />
      <line x1="256" y1="131" x2="256" y2="56" stroke="#1D9E75" strokeWidth="30" strokeLinecap="round" />
      <line x1="256" y1="381" x2="256" y2="456" stroke="#1D9E75" strokeWidth="30" strokeLinecap="round" />
      <line x1="131" y1="256" x2="56" y2="256" stroke="#1D9E75" strokeWidth="30" strokeLinecap="round" />
      <line x1="381" y1="256" x2="456" y2="256" stroke="#1D9E75" strokeWidth="30" strokeLinecap="round" />
    </svg>
  )
}
