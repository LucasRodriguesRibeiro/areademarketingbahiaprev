import React, { useState } from 'react';
import { Sparkles, Check, Wand2 } from 'lucide-react';
import { correctPtBrText, getPtBrSuggestions } from '../utils/spellChecker';

interface SpellCheckInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
  label?: string;
  showCorrectorBar?: boolean;
}

export const SpellCheckInput: React.FC<SpellCheckInputProps> = ({
  value,
  onChangeValue,
  label,
  showCorrectorBar = true,
  className = '',
  placeholder,
  required,
  type = 'text',
  ...props
}) => {
  const suggestions = getPtBrSuggestions(value);
  const [justFixed, setJustFixed] = useState(false);

  const handleAutoFix = () => {
    const fixed = correctPtBrText(value);
    onChangeValue(fixed);
    setJustFixed(true);
    setTimeout(() => setJustFixed(false), 2500);
  };

  const handleApplySingleSuggestion = (original: string, corrected: string) => {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    const updated = value.replace(regex, corrected);
    onChangeValue(updated);
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            {label}
          </label>
          {suggestions.length > 0 && showCorrectorBar && (
            <button
              type="button"
              onClick={handleAutoFix}
              className="text-[11px] font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Corrigir todos os erros ortográficos e acentuação em Português (PT-BR)"
            >
              <Wand2 className="h-3 w-3 text-amber-600" />
              <span>Corrigir Tudo (PT-BR)</span>
            </button>
          )}
        </div>
      )}

      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        spellCheck={true}
        lang="pt-BR"
        autoCorrect="on"
        autoCapitalize="sentences"
        className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
        {...props}
      />

      {/* Painel de Sugestões de Correção em Tempo Real */}
      {showCorrectorBar && suggestions.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2 text-[11px] space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-1 text-amber-900 font-bold">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Sugestões de Correção (PT-BR):</span>
            </span>
            <button
              type="button"
              onClick={handleAutoFix}
              className="text-[10px] font-black text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Corrigir Tudo ({suggestions.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {suggestions.slice(0, 6).map(({ original, corrected }) => (
              <button
                key={original}
                type="button"
                onClick={() => handleApplySingleSuggestion(original, corrected)}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-800 font-semibold rounded-lg border border-amber-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 text-xs group"
                title={`Clique para trocar "${original}" por "${corrected}"`}
              >
                <span className="line-through text-slate-400 font-normal group-hover:text-red-500">{original}</span>
                <span className="text-amber-600 font-bold">➔</span>
                <span className="text-amber-900 font-extrabold group-hover:scale-105 transition-transform">{corrected}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {justFixed && (
        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
          <Check className="h-3 w-3" /> Texto corrigido em Português!
        </p>
      )}
    </div>
  );
};

interface SpellCheckTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChangeValue: (val: string) => void;
  label?: string;
  showCorrectorBar?: boolean;
}

export const SpellCheckTextarea: React.FC<SpellCheckTextareaProps> = ({
  value,
  onChangeValue,
  label,
  showCorrectorBar = true,
  className = '',
  placeholder,
  rows = 3,
  ...props
}) => {
  const suggestions = getPtBrSuggestions(value);
  const [justFixed, setJustFixed] = useState(false);

  const handleAutoFix = () => {
    const fixed = correctPtBrText(value);
    onChangeValue(fixed);
    setJustFixed(true);
    setTimeout(() => setJustFixed(false), 2500);
  };

  const handleApplySingleSuggestion = (original: string, corrected: string) => {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    const updated = value.replace(regex, corrected);
    onChangeValue(updated);
  };

  return (
    <div className="space-y-1.5 w-full">
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-slate-700">
            {label}
          </label>
          {suggestions.length > 0 && showCorrectorBar && (
            <button
              type="button"
              onClick={handleAutoFix}
              className="text-[11px] font-extrabold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Corrigir ortografia e acentuação em Português (PT-BR)"
            >
              <Wand2 className="h-3 w-3 text-amber-600" />
              <span>Corrigir Ortografia (PT-BR)</span>
            </button>
          )}
        </div>
      )}

      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChangeValue(e.target.value)}
        placeholder={placeholder}
        spellCheck={true}
        lang="pt-BR"
        autoCorrect="on"
        autoCapitalize="sentences"
        className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
        {...props}
      />

      {/* Painel de Sugestões de Correção em Tempo Real */}
      {showCorrectorBar && suggestions.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl p-2 text-[11px] space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between gap-1 text-amber-900 font-bold">
            <span className="flex items-center gap-1">
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Sugestões de Correção (PT-BR):</span>
            </span>
            <button
              type="button"
              onClick={handleAutoFix}
              className="text-[10px] font-black text-amber-800 hover:text-amber-950 underline cursor-pointer"
            >
              Corrigir Tudo ({suggestions.length})
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            {suggestions.slice(0, 6).map(({ original, corrected }) => (
              <button
                key={original}
                type="button"
                onClick={() => handleApplySingleSuggestion(original, corrected)}
                className="px-2.5 py-1 bg-white hover:bg-amber-100 text-slate-800 font-semibold rounded-lg border border-amber-300 shadow-2xs transition-all cursor-pointer flex items-center gap-1.5 text-xs group"
                title={`Clique para trocar "${original}" por "${corrected}"`}
              >
                <span className="line-through text-slate-400 font-normal group-hover:text-red-500">{original}</span>
                <span className="text-amber-600 font-bold">➔</span>
                <span className="text-amber-900 font-extrabold group-hover:scale-105 transition-transform">{corrected}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {justFixed && (
        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
          <Check className="h-3 w-3" /> Ortografia e acentuação corrigidas!
        </p>
      )}
    </div>
  );
};
