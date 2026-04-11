// SubHuntr logo icon — stylized S in a rounded green square
// Use size prop to control dimensions (default 24px)
// Set full=true for the crosshair detail (landing/large contexts only)

interface LogoIconProps {
  size?: number
  full?: boolean
  className?: string
}

export function LogoIcon({ size = 24, full = false, className }: LogoIconProps) {
  return (
    <svg
      viewBox="0 0 512 512"
      width={size}
      height={size}
      className={className}
      aria-hidden="true"
    >
      <rect width="512" height="512" rx="96" fill="#1D9E75" />
      <path
        d="M310 148c0 0-40-18-82-8s-72 48-72 90c0 38 28 58 56 66s56 18 56 48c0 28-24 44-56 44s-64-14-80-32"
        fill="none"
        stroke="#fafafa"
        strokeWidth="48"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {full && (
        <>
          <circle cx="340" cy="164" r="18" fill="none" stroke="#fafafa" strokeWidth="4" opacity="0.35" />
          <circle cx="340" cy="164" r="4" fill="#fafafa" opacity="0.5" />
        </>
      )}
    </svg>
  )
}
