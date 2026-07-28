import React, { useState, useMemo, useEffect } from 'react';
import { X, MoreVertical, MessageSquare, Wand2, Check, Globe } from 'lucide-react';
import { getPtBrSuggestions, correctPtBrText, checkPtBrWithLanguageTool } from '../utils/spellChecker';

interface WordCorrection {
  original: string;
  corrected: string;
}

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
  className = '',
  placeholder,
  required,
  type = 'text',
  onBlur,
  ...props
}) => {
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set());
  const [activeWord, setActiveWord] = useState<WordCorrection | null>(null);
  const [justApplied, setJustApplied] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<WordCorrection[]>([]);

  // Consulta assíncrona da API pública do LanguageTool (PT-BR) com debounce
  useEffect(() => {
    if (!value || value.trim().length < 3) {
      setApiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await checkPtBrWithLanguageTool(value);
      setApiSuggestions(results);
    }, 450);

    return () => clearTimeout(timer);
  }, [value]);

  // Combina sugestões do motor de regras local + dicionário do LanguageTool PT-BR
  const suggestions = useMemo(() => {
    const local = getPtBrSuggestions(value);
    const combinedMap = new Map<string, WordCorrection>();

    local.forEach((s) => combinedMap.set(s.original.toLowerCase(), s));
    apiSuggestions.forEach((s) => {
      if (!combinedMap.has(s.original.toLowerCase())) {
        combinedMap.set(s.original.toLowerCase(), s);
      }
    });

    return Array.from(combinedMap.values()).filter(
      (s) => !ignoredWords.has(s.original.toLowerCase())
    );
  }, [value, apiSuggestions, ignoredWords]);

  // Palavra ativa para exibir a sugestão de correção
  const currentSuggestion = useMemo(() => {
    if (activeWord && suggestions.some((s) => s.original.toLowerCase() === activeWord.original.toLowerCase())) {
      return activeWord;
    }
    return suggestions.length > 0 ? suggestions[0] : null;
  }, [suggestions, activeWord]);

  // Digitação normal: não altera a palavra automaticamente, permite que o usuário digite livremente
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChangeValue(e.target.value);
  };

  // Saída do campo: mantém o texto exatamente como o usuário digitou
  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  // Corrige SOMENTE quando o usuário clica expressamente na sugestão
  const handleApplyCorrection = (original: string, corrected: string) => {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    const updated = value.replace(regex, corrected);
    onChangeValue(updated);
    setActiveWord(null);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  // Aplica todas as sugestões somente se o usuário clicar no botão "Corrigir todas"
  const handleFixAllSuggestions = () => {
    const corrected = correctPtBrText(value, ignoredWords);
    onChangeValue(corrected);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  const handleIgnoreWord = (original: string) => {
    setIgnoredWords((prev) => new Set(prev).add(original.toLowerCase()));
    setActiveWord(null);
  };

  const handleIgnoreAllSuggestions = () => {
    setIgnoredWords((prev) => {
      const next = new Set(prev);
      suggestions.forEach((s) => next.add(s.original.toLowerCase()));
      return next;
    });
    setActiveWord(null);
  };

  // Separa o texto em tokens para destacar as palavras com sugestão disponível
  const tokens = useMemo(() => {
    if (!value) return [];
    return value.split(/(\b[a-zA-ZáàâãéèêíïóôõöúçÑñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+\b)/g);
  }, [value]);

  return (
    <div className="space-y-1.5 w-full relative">
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label className="block text-xs font-bold text-slate-700">
            {label}
          </label>
        )}

        {suggestions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFixAllSuggestions}
              className="text-[10px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Clique para aceitar e aplicar as sugestões de correção"
            >
              <Wand2 className="h-3 w-3 text-blue-600 animate-spin-slow" />
              <span>Corrigir sugestões ({suggestions.length})</span>
            </button>

            <button
              type="button"
              onClick={handleIgnoreAllSuggestions}
              className="text-[10px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer"
              title="Ignorar sugestões e manter texto exatamente como foi digitado"
            >
              Manter como digitei
            </button>
          </div>
        )}
      </div>

      <div className="relative w-full">
        {/* Floating Popover de Sugestão - O usuário clica na palavra sugerida para corrigir */}
        {currentSuggestion && (
          <div className="absolute -top-11 left-2 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl px-3 py-1 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold shrink-0">Sugestão:</span>
            <button
              type="button"
              onClick={() => handleApplyCorrection(currentSuggestion.original, currentSuggestion.corrected)}
              className="font-extrabold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title={`Clique para alterar "${currentSuggestion.original}" por "${currentSuggestion.corrected}"`}
            >
              <span className="text-blue-600 font-black text-xs">✓</span>
              <span className="text-xs">{currentSuggestion.corrected}</span>
            </button>

            <span className="w-[1px] h-3.5 bg-slate-200" />

            <button
              type="button"
              onClick={() => handleIgnoreWord(currentSuggestion.original)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center gap-1"
              title={`Manter "${currentSuggestion.original}" exatamente como está`}
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="p-1 text-slate-300 hidden sm:block">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>

            <div className="p-1 text-slate-300 hidden sm:block">
              <MoreVertical className="h-3.5 w-3.5" />
            </div>
          </div>
        )}

        <input
          type={type}
          required={required}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          spellCheck={true}
          lang="pt-BR"
          autoCorrect="off"
          autoCapitalize="sentences"
          className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
          {...props}
        />
      </div>

      {/* Exibição de Sugestões de Correção para Clique Direto */}
      {suggestions.length > 0 && (
        <div className="p-2 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xs leading-relaxed text-slate-800 flex items-center flex-wrap justify-between gap-1">
          <div className="flex items-center flex-wrap gap-1">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Sugestões (clique para aplicar):
            </span>
            {tokens.map((token, idx) => {
              const lower = token.toLowerCase();
              const sug = suggestions.find((s) => s.original.toLowerCase() === lower);
              if (sug) {
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleApplyCorrection(sug.original, sug.corrected)}
                    className="underline decoration-wavy decoration-blue-500 decoration-2 underline-offset-4 font-semibold text-blue-900 bg-blue-100/80 hover:bg-blue-200 px-1.5 py-0.5 rounded cursor-pointer transition-all inline-flex items-center gap-1"
                    title={`Clique para aplicar a correção "${sug.corrected}"`}
                  >
                    <span>{token}</span>
                    <span className="text-[10px] text-blue-600 font-bold">→ {sug.corrected}</span>
                  </button>
                );
              }
              return <span key={idx}>{token}</span>;
            })}
          </div>

          <button
            type="button"
            onClick={handleIgnoreAllSuggestions}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-medium shrink-0 cursor-pointer ml-auto"
            title="Manter texto como está e fechar sugestões"
          >
            <X className="h-3.5 w-3.5" />
            <span>Manter texto como está</span>
          </button>
        </div>
      )}

      {justApplied && (
        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
          <Check className="h-3 w-3 text-emerald-600" /> Correção aplicada com sucesso!
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
  className = '',
  placeholder,
  rows = 3,
  onBlur,
  ...props
}) => {
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set());
  const [activeWord, setActiveWord] = useState<WordCorrection | null>(null);
  const [justApplied, setJustApplied] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<WordCorrection[]>([]);

  // Consulta assíncrona da API pública do LanguageTool (PT-BR) com debounce
  useEffect(() => {
    if (!value || value.trim().length < 3) {
      setApiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await checkPtBrWithLanguageTool(value);
      setApiSuggestions(results);
    }, 450);

    return () => clearTimeout(timer);
  }, [value]);

  // Combina sugestões do motor de regras local + dicionário do LanguageTool PT-BR
  const suggestions = useMemo(() => {
    const local = getPtBrSuggestions(value);
    const combinedMap = new Map<string, WordCorrection>();

    local.forEach((s) => combinedMap.set(s.original.toLowerCase(), s));
    apiSuggestions.forEach((s) => {
      if (!combinedMap.has(s.original.toLowerCase())) {
        combinedMap.set(s.original.toLowerCase(), s);
      }
    });

    return Array.from(combinedMap.values()).filter(
      (s) => !ignoredWords.has(s.original.toLowerCase())
    );
  }, [value, apiSuggestions, ignoredWords]);

  // Palavra ativa para exibir a sugestão de correção
  const currentSuggestion = useMemo(() => {
    if (activeWord && suggestions.some((s) => s.original.toLowerCase() === activeWord.original.toLowerCase())) {
      return activeWord;
    }
    return suggestions.length > 0 ? suggestions[0] : null;
  }, [suggestions, activeWord]);

  // Digitação normal: não altera a palavra automaticamente, permite que o usuário digite livremente
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChangeValue(e.target.value);
  };

  // Saída do campo: mantém o texto exatamente como o usuário digitou
  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    if (onBlur) {
      onBlur(e);
    }
  };

  // Corrige SOMENTE quando o usuário clica expressamente na sugestão
  const handleApplyCorrection = (original: string, corrected: string) => {
    const escaped = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escaped}\\b`, 'g');
    const updated = value.replace(regex, corrected);
    onChangeValue(updated);
    setActiveWord(null);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  // Aplica todas as sugestões somente se o usuário clicar no botão "Corrigir todas"
  const handleFixAllSuggestions = () => {
    const corrected = correctPtBrText(value, ignoredWords);
    onChangeValue(corrected);
    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2500);
  };

  const handleIgnoreWord = (original: string) => {
    setIgnoredWords((prev) => new Set(prev).add(original.toLowerCase()));
    setActiveWord(null);
  };

  const handleIgnoreAllSuggestions = () => {
    setIgnoredWords((prev) => {
      const next = new Set(prev);
      suggestions.forEach((s) => next.add(s.original.toLowerCase()));
      return next;
    });
    setActiveWord(null);
  };

  // Separa o texto em tokens para destacar as palavras com sugestão disponível
  const tokens = useMemo(() => {
    if (!value) return [];
    return value.split(/(\b[a-zA-ZáàâãéèêíïóôõöúçÑñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+\b)/g);
  }, [value]);

  return (
    <div className="space-y-1.5 w-full relative">
      <div className="flex items-center justify-between gap-2">
        {label && (
          <label className="block text-xs font-bold text-slate-700">
            {label}
          </label>
        )}

        {suggestions.length > 0 && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleFixAllSuggestions}
              className="text-[10px] font-extrabold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
              title="Clique para aceitar e aplicar as sugestões de correção"
            >
              <Wand2 className="h-3 w-3 text-blue-600 animate-spin-slow" />
              <span>Corrigir sugestões ({suggestions.length})</span>
            </button>

            <button
              type="button"
              onClick={handleIgnoreAllSuggestions}
              className="text-[10px] font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 px-1.5 py-0.5 rounded-lg transition-colors cursor-pointer"
              title="Ignorar sugestões e manter texto exatamente como foi digitado"
            >
              Manter como digitei
            </button>
          </div>
        )}
      </div>

      <div className="relative w-full">
        {/* Floating Popover de Sugestão - O usuário clica na palavra sugerida para corrigir */}
        {currentSuggestion && (
          <div className="absolute -top-11 left-2 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl px-3 py-1 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150 text-xs">
            <span className="text-[10px] text-slate-400 font-semibold shrink-0">Sugestão:</span>
            <button
              type="button"
              onClick={() => handleApplyCorrection(currentSuggestion.original, currentSuggestion.corrected)}
              className="font-extrabold text-blue-700 hover:text-blue-900 bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-xl transition-all cursor-pointer flex items-center gap-1.5"
              title={`Clique para alterar "${currentSuggestion.original}" por "${currentSuggestion.corrected}"`}
            >
              <span className="text-blue-600 font-black text-xs">✓</span>
              <span className="text-xs">{currentSuggestion.corrected}</span>
            </button>

            <span className="w-[1px] h-3.5 bg-slate-200" />

            <button
              type="button"
              onClick={() => handleIgnoreWord(currentSuggestion.original)}
              className="p-1 text-slate-400 hover:text-red-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={`Manter "${currentSuggestion.original}" exatamente como está`}
            >
              <X className="h-3.5 w-3.5" />
            </button>

            <div className="p-1 text-slate-300 hidden sm:block">
              <MessageSquare className="h-3.5 w-3.5" />
            </div>

            <div className="p-1 text-slate-300 hidden sm:block">
              <MoreVertical className="h-3.5 w-3.5" />
            </div>
          </div>
        )}

        <textarea
          rows={rows}
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          spellCheck={true}
          lang="pt-BR"
          autoCorrect="off"
          autoCapitalize="sentences"
          className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
          {...props}
        />
      </div>

      {/* Exibição de Sugestões de Correção para Clique Direto */}
      {suggestions.length > 0 && (
        <div className="p-2 bg-slate-50/90 border border-slate-200/80 rounded-xl text-xs leading-relaxed text-slate-800 flex items-center flex-wrap justify-between gap-1">
          <div className="flex items-center flex-wrap gap-1">
            <span className="text-[10px] font-extrabold text-blue-700 uppercase tracking-wider flex items-center gap-1 shrink-0 mr-1">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              Sugestões (clique para aplicar):
            </span>
            {tokens.map((token, idx) => {
              const lower = token.toLowerCase();
              const sug = suggestions.find((s) => s.original.toLowerCase() === lower);
              if (sug) {
                return (
                  <button
                    type="button"
                    key={idx}
                    onClick={() => handleApplyCorrection(sug.original, sug.corrected)}
                    className="underline decoration-wavy decoration-blue-500 decoration-2 underline-offset-4 font-semibold text-blue-900 bg-blue-100/80 hover:bg-blue-200 px-1.5 py-0.5 rounded cursor-pointer transition-all inline-flex items-center gap-1"
                    title={`Clique para aplicar a correção "${sug.corrected}"`}
                  >
                    <span>{token}</span>
                    <span className="text-[10px] text-blue-600 font-bold">→ {sug.corrected}</span>
                  </button>
                );
              }
              return <span key={idx}>{token}</span>;
            })}
          </div>

          <button
            type="button"
            onClick={handleIgnoreAllSuggestions}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-lg transition-colors flex items-center gap-1 text-[10px] font-medium shrink-0 cursor-pointer ml-auto"
            title="Manter texto como está e fechar sugestões"
          >
            <X className="h-3.5 w-3.5" />
            <span>Manter texto como está</span>
          </button>
        </div>
      )}

      {justApplied && (
        <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
          <Check className="h-3 w-3 text-emerald-600" /> Correção aplicada com sucesso!
        </p>
      )}
    </div>
  );
};
