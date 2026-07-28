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
    const regex = new RegExp(`\\b${original}\\b`, 'g');
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
              title="Corrigir erros ortográficos e acentuação em Português (PT-BR)"
            >
              <Wand2 className="h-3 w-3 text-amber-600" />
              <span>Corrigir PT-BR</span>
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

      {/* Barra estilo Teclado de Celular com Sugestões de Correção Ortográfica */}
      {showCorrectorBar && suggestions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px]">
          <span className="text-slate-400 font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Sugestões:</span>
          </span>
          {suggestions.slice(0, 4).map(({ original, corrected }) => (
            <button
              key={original}
              type="button"
              onClick={() => handleApplySingleSuggestion(original, corrected)}
              className="px-2 py-0.5 bg-amber-100/80 hover:bg-amber-200 text-amber-900 font-bold rounded-md border border-amber-300/80 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="line-through text-slate-500 font-normal">{original}</span>
              <span className="text-amber-800">➔</span>
              <span>{corrected}</span>
            </button>
          ))}
        </div>
      )}

      {justFixed && (
        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
          <Check className="h-3 w-3" /> Texto corrigido em Português Brasil!
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
    const regex = new RegExp(`\\b${original}\\b`, 'g');
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

      {/* Barra de Correção e Sugestões do Teclado */}
      {showCorrectorBar && suggestions.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap pt-0.5 text-[11px]">
          <span className="text-slate-500 font-semibold flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-amber-500" />
            <span>Sugestões de Correção (PT-BR):</span>
          </span>
          {suggestions.slice(0, 5).map(({ original, corrected }) => (
            <button
              key={original}
              type="button"
              onClick={() => handleApplySingleSuggestion(original, corrected)}
              className="px-2 py-0.5 bg-amber-100/90 hover:bg-amber-200 text-amber-900 font-bold rounded-md border border-amber-300 transition-colors cursor-pointer flex items-center gap-1"
            >
              <span className="line-through text-slate-500 font-normal">{original}</span>
              <span className="text-amber-800">➔</span>
              <span>{corrected}</span>
            </button>
          ))}
        </div>
      )}

      {justFixed && (
        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1">
          <Check className="h-3 w-3" /> Ortografia e pontuação corrigidas!
        </p>
      )}
    </div>
  );
};
