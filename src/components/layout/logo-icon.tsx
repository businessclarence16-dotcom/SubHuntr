// SubHuntr logo — bold S with subtle center target dot on dark background

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
      <path
        d="M326 168C310 140 278 120 240 120C188 120 148 152 148 196C148 236 176 256 224 270C264 282 280 294 280 316C280 344 258 360 228 360C196 360 168 344 152 320L120 352C144 384 184 404 232 404C292 404 336 370 336 320C336 276 306 258 256 244C220 234 204 222 204 200C204 176 224 160 252 160C278 160 300 172 314 192Z"
        fill="#1D9E75"
      />
      <circle cx="256" cy="260" r="11" fill="#34d399" />
    </svg>
  )
}
