import React from 'react';

export default function Logo({ size = "md", showText = true }) {
  // Define styles based on the size prop
  const sizeClasses = {
    sm: { iconContainer: "w-8 h-8 rounded-lg", icon: "w-4 h-4", text: "text-lg" },
    md: { iconContainer: "w-10 h-10 rounded-xl", icon: "w-5 h-5", text: "text-2xl" },
    lg: { iconContainer: "w-16 h-16 rounded-2xl", icon: "w-8 h-8", text: "text-4xl" },
  };

  const s = sizeClasses[size] || sizeClasses.md;

  return (
    <div className={`flex items-center ${size === 'lg' ? 'flex-col gap-5' : 'gap-3.5'}`}>
      <div 
        className={`${s.iconContainer} bg-gradient-to-tr from-violet-600 via-fuchsia-600 to-pink-500 flex items-center justify-center shadow-lg shadow-violet-900/40 relative overflow-hidden`}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 bg-white/20 blur-xl rounded-full" />
        
        {/* Four-point spark / star */}
        <svg 
          className={`${s.icon} text-zinc-900 dark:text-white relative z-10 drop-shadow-md`} 
          viewBox="0 0 24 24" 
          fill="currentColor"
        >
          <path d="M12 1L14.88 9.12L23 12L14.88 14.88L12 23L9.12 14.88L1 12L9.12 9.12L12 1Z" />
        </svg>
      </div>
      
      {showText && (
        <span className={`font-bold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400 ${s.text}`}>
          Lumi
        </span>
      )}
    </div>
  );
}
