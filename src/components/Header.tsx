import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { BahiaPrevLogo } from './BahiaPrevLogo';

export const Header: React.FC = () => {
  return (
    <header className="relative overflow-hidden bg-gradient-to-b from-slate-50 to-white py-14 sm:py-20 border-b border-slate-100">
      {/* Background grid elements */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-60" />
      
      {/* Interactive orbits subtle floating details in background to match logo's red orbits */}
      <div className="absolute top-1/4 left-10 w-72 h-32 border-2 border-brand-red/5 rounded-full -rotate-12 -z-10 pointer-events-none hidden md:block" />
      <div className="absolute bottom-1/4 right-10 w-96 h-40 border-2 border-brand-blue/5 rounded-full rotate-12 -z-10 pointer-events-none hidden md:block" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center flex flex-col items-center">
        {/* Animated full high-fidelity logo */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7 }}
          className="mb-8"
        >
          <BahiaPrevLogo className="h-28 sm:h-36 drop-shadow-xl hover:scale-105 transition-transform duration-300 cursor-pointer" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 rounded-full bg-brand-blue px-4 py-2 text-xs font-bold text-white border border-brand-blue shadow-lg shadow-brand-blue/10 mb-6"
        >
          <span className="flex h-2 w-2 rounded-full bg-brand-red animate-pulse" />
          <span className="tracking-wider uppercase text-[10px]">PLANO BAHIA PREV</span>
          <span className="text-white/40">|</span>
          <span className="text-white/90 font-medium">Área de Marketing</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-sans text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-brand-blue max-w-4xl mx-auto leading-[1.15]"
        >
          Portal de Benefícios <br className="hidden sm:block" />
          <span className="relative inline-block mt-2 text-brand-blue">
            & Apoio ao Parceiro
            <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-brand-red rounded-full"></span>
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal"
        >
          Seja bem-vindo ao nosso espaço oficial de suporte ao credenciado. Clique em um parceiro abaixo para conferir seus detalhes de convênio, copiar contatos de atendimento e baixar os materiais.
        </motion.p>
      </div>
    </header>
  );
};


