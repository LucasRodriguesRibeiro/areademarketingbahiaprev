import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PARTNERS } from '../data';
import { Partner } from '../types';
import { Tag, ShieldCheck, MapPin, Ticket } from 'lucide-react';

interface PartnerSectionProps {
  onSelectPartner: (partner: Partner) => void;
}

export const PartnerSection: React.FC<PartnerSectionProps> = ({ onSelectPartner }) => {
  const [selectedCity, setSelectedCity] = useState<string>('Todas');

  const citiesList = [
    'Todas',
    ...Array.from(new Set(PARTNERS.map((p) => p.city))).sort((a, b) => a.localeCompare(b, 'pt'))
  ];

  const getPartnerCountForCity = (city: string) => {
    if (city === 'Todas') return PARTNERS.length;
    return PARTNERS.filter((p) => p.city === city).length;
  };

  const filteredPartners = PARTNERS.filter((partner) => {
    return selectedCity === 'Todas' || partner.city === selectedCity;
  }).sort((a, b) => a.name.localeCompare(b.name, 'pt'));

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .filter((word) => word.length > 2)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || name.slice(0, 2).toUpperCase();
  };

  return (
    <section id="parceiros" className="py-12 bg-slate-50 border-b border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* City Filter Buttons Section */}
        <div className="mb-8 max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
            <MapPin className="h-5 w-5 text-red-500 animate-pulse" />
            <h3 className="font-sans text-base font-bold text-slate-800 tracking-tight">
              Filtrar Parceiros por Cidade:
            </h3>
          </div>
          
          <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2.5">
            {citiesList.map((city) => {
              const isSelected = selectedCity === city;
              const count = getPartnerCountForCity(city);
              return (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`group px-3 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-brand-blue text-white border-brand-blue shadow-sm shadow-brand-blue/10 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                  }`}
                >
                  <span className="truncate">{city}</span>
                  <span className={`text-[9px] px-1.5 py-0.5 rounded-full shrink-0 ${
                    isSelected
                      ? 'bg-white/20 text-white font-bold'
                      : 'bg-slate-100 text-slate-500 group-hover:bg-brand-red/5 group-hover:text-brand-red'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* List of Partners */}
        {filteredPartners.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredPartners.map((partner, index) => (
                <motion.div
                  key={partner.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3, delay: index * 0.02 }}
                  onClick={() => onSelectPartner(partner)}
                  className="bg-white rounded-2xl p-5 border border-slate-100 shadow-xs hover:shadow-md hover:border-brand-blue/20 transition-all flex flex-col justify-between group cursor-pointer"
                >
                  <div>
                    {/* Visual Brand Header - Dynamic Partner Logo */}
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${partner.logoColor} flex items-center justify-center text-white font-mono font-bold tracking-tight text-sm shadow-xs group-hover:scale-105 transition-transform`}>
                        {getInitials(partner.name)}
                      </div>
                      <div>
                        <h3 className="font-sans text-sm font-semibold text-slate-900 group-hover:text-blue-700 transition-colors">
                          {partner.name}
                        </h3>
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className="text-[10px] font-medium text-slate-500 bg-slate-50 border border-slate-100 rounded-md px-1.5 py-0.5 inline-block">
                            {partner.category}
                          </span>
                          <span className="text-[9px] font-semibold text-red-600 bg-red-50 border border-red-100/50 rounded-md px-1.5 py-0.5 inline-block flex items-center gap-0.5">
                            <MapPin className="h-2.5 w-2.5 text-red-500" />
                            {partner.city}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Benefit Highlight Box */}
                    <div className="bg-blue-50/60 border border-blue-100/50 rounded-xl p-3 mb-4 flex items-start gap-2">
                      <Ticket className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-xs font-bold text-blue-900 block">
                          {partner.discount}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-xs text-slate-500 leading-relaxed mb-4 line-clamp-3">
                      {partner.description}
                    </p>
                  </div>

                  {/* Actions Area */}
                  <div className="pt-3 border-t border-slate-50 flex items-center justify-between mt-auto text-xs">
                    <span className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full">
                      <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                      Ativo
                    </span>

                    <span className="text-blue-600 group-hover:text-red-500 font-bold group-hover:translate-x-1 transition-all inline-flex items-center gap-1">
                      Ver página →
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12 bg-white rounded-2xl border border-slate-100 max-w-md mx-auto"
          >
            <div className="inline-flex p-3 rounded-full bg-slate-50 text-slate-400 mb-3 shadow-xs">
              <Tag className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-semibold text-slate-900">Nenhum parceiro encontrado</h4>
            <p className="text-xs text-slate-500 mt-1 px-4">
              Selecione outra cidade acima para ver os parceiros credenciados.
            </p>
          </motion.div>
        )}
      </div>
    </section>
  );
};
