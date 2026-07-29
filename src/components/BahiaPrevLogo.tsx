import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'simple' | 'light';
}

export const BahiaPrevLogo: React.FC<LogoProps> = ({ className = "h-12", variant = 'full' }) => {
  const logoSrc = "/logobahiaprev.png";

  if (variant === 'simple') {
    return (
      <div className="flex items-center gap-2.5">
        <img 
          src={logoSrc} 
          alt="Bahia Prev HUB Logo" 
          className="h-10 w-auto shrink-0 object-contain drop-shadow-md"
          onError={(e) => {
            (e.target as HTMLImageElement).src = '/logobahiaprev.png';
          }}
          referrerPolicy="no-referrer"
        />
        <div>
          <span className="font-sans font-extrabold text-blue-400 tracking-tight block text-sm sm:text-base leading-none">
            BAHIA PREV HUB
          </span>
          <span className="text-[10px] text-slate-400 font-bold tracking-wider block mt-1 uppercase">
            Parceiros &amp; Benefícios
          </span>
        </div>
      </div>
    );
  }

  return (
    <img 
      src={logoSrc} 
      alt="Bahia Prev HUB Logo" 
      className={`object-contain ${className} drop-shadow-md`}
      onError={(e) => {
        (e.target as HTMLImageElement).src = '/logobahiaprev.png';
      }}
      referrerPolicy="no-referrer"
    />
  );
};
