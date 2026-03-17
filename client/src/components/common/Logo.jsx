const Logo = ({ size = 40, showText = true }) => {
  return (
    <div className="flex items-center gap-3 select-none">
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        aria-label="SoftHive logo"
      >
        <defs>
          <linearGradient id="g1" x1="10" y1="6" x2="56" y2="60" gradientUnits="userSpaceOnUse">
            <stop stopColor="#6366F1" />
            <stop offset="0.5" stopColor="#4F46E5" />
            <stop offset="1" stopColor="#1D4ED8" />
          </linearGradient>
          <linearGradient id="g2" x1="8" y1="10" x2="58" y2="54" gradientUnits="userSpaceOnUse">
            <stop stopColor="#A5B4FC" stopOpacity="0.9" />
            <stop offset="1" stopColor="#60A5FA" stopOpacity="0.9" />
          </linearGradient>
        </defs>

        <path
          d="M32 4L55 17V47L32 60L9 47V17L32 4Z"
          fill="url(#g1)"
        />
        <path
          d="M32 11L49 21V43L32 53L15 43V21L32 11Z"
          fill="url(#g2)"
          opacity="0.35"
        />

        <path
          d="M23 36c0 2 1.6 3.6 3.6 3.6H36c1.9 0 3.4-1.5 3.4-3.4 0-1.4-.9-2.6-2.1-3.1.1-.3.1-.7.1-1 0-2-1.6-3.6-3.6-3.6H28c-2.8 0-5 2.2-5 5 0 .4 0 .9.2 1.3-1.3.6-2.2 2-2.2 3.6Z"
          fill="white"
          opacity="0.92"
        />

        <path d="M20 20h8" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        <path d="M36 44h8" stroke="white" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
        <circle cx="20" cy="20" r="3" fill="white" opacity="0.9" />
        <circle cx="44" cy="44" r="3" fill="white" opacity="0.9" />
      </svg>

      {showText && (
        <div className="leading-tight">
          <p className="font-extrabold text-gray-900 dark:text-white tracking-tight">SoftHive</p>
          <p className="text-xs text-gray-400">Software House</p>
        </div>
      )}
    </div>
  );
};

export default Logo;