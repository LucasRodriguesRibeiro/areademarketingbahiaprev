import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'full' | 'simple' | 'light';
}

export const BahiaPrevLogo: React.FC<LogoProps> = ({ className = "h-12", variant = 'full' }) => {
  if (variant === 'simple') {
    return (
      <div className="flex items-center gap-2.5">
        <img 
          src="/plano bahia prev logo.png" 
          alt="Plano Bahia Prev Logo" 
          className="h-10 w-auto shrink-0 object-contain drop-shadow-md"
          referrerPolicy="no-referrer"
        />
        <div>
          <span className="font-sans font-extrabold text-blue-400 tracking-tight block text-sm sm:text-base leading-none">
            PLANO BAHIA PREV
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
      src="/plano bahia prev logo.png" 
      alt="Plano Bahia Prev Logo" 
      className={`object-contain ${className} drop-shadow-md`}
      referrerPolicy="no-referrer"
    />
  );
};
