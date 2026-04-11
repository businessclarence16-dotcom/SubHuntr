// SubHuntr logo icon — geometric S in a rounded green square

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
      <rect width="512" height="512" rx="80" fill="#1D9E75" />
      <path
        d="M310 156c-14-12-38-20-66-20c-50 0-84 28-84 68c0 36 24 52 68 64c40 10 56 22 56 44c0 26-22 42-54 42c-30 0-56-12-72-30l-28 32c22 24 58 40 98 40c56 0 92-30 92-76c0-40-26-56-72-68c-38-10-52-20-52-40c0-22 18-36 46-36c24 0 44 8 58 20l28-32z"
        fill="#fafafa"
      />
    </svg>
  )
}
