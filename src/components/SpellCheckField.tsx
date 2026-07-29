import React, { useState, useMemo, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import { getPtBrSuggestions, correctPtBrText, checkPtBrWithLanguageTool } from '../utils/spellChecker';

interface WordCorrection {
  original: string;
  corrected: string;
}

interface SpellCheckInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  value: string;
  onChangeValue: (val: string) => void;
  label?: string;
}

/**
 * Localiza a sugestão ortográfica referente SOMENTE à palavra que o usuário está digitando
 * ou editando no momento (na posição do cursor). Se o usuário já avançou e digitou outras palavras,
 * o erro da palavra anterior é ignorado e não permanece sendo exibido.
 */
function findTargetSuggestion(
  value: string,
  cursorPos: number | null,
  suggestions: WordCorrection[],
  ignoredWords: Set<string>
): WordCorrection | null {
  if (!value || suggestions.length === 0) return null;

  const pos = cursorPos !== null && cursorPos >= 0 ? cursorPos : value.length;
  const regex = /\b[a-zA-ZáàâãéèêíïóôõöúçÑñÁÀÂÃÉÈÊÍÏÓÔÕÖÚÇ]+\b/g;
  let match: RegExpExecArray | null;

  let currentToken: { word: string; start: number; end: number } | null = null;
  let prevToken: { word: string; start: number; end: number } | null = null;

  while ((match = regex.exec(value)) !== null) {
    const start = match.index;
    const end = match.index + match[0].length;

    if (pos >= start && pos <= end) {
      currentToken = { word: match[0], start, end };
      break;
    }

    if (start <= pos) {
      prevToken = { word: match[0], start, end };
    }
  }

  let targetWord: string | null = null;
  if (currentToken) {
    targetWord = currentToken.word;
  } else if (prevToken && pos <= prevToken.end + 1) {
    targetWord = prevToken.word;
  }

  if (!targetWord) return null;

  const lower = targetWord.toLowerCase();
  if (ignoredWords.has(lower)) return null;

  const sug = suggestions.find((s) => s.original.toLowerCase() === lower);
  return sug || null;
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
  onFocus,
  onClick,
  onKeyUp,
  onSelect,
  ...props
}) => {
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set());
  const [justApplied, setJustApplied] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<WordCorrection[]>([]);
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  // Consulta assíncrona da API do LanguageTool (PT-BR) com debounce
  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setApiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await checkPtBrWithLanguageTool(value);
      setApiSuggestions(results);
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

  // Combina sugestões do motor local + LanguageTool
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

  // Exibe APENAS a correção referente à palavra mais recente/atual no cursor do usuário
  const currentSuggestion = useMemo(() => {
    return findTargetSuggestion(value, cursorPos, suggestions, ignoredWords);
  }, [value, cursorPos, suggestions, ignoredWords]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCursorPos(e.target.selectionStart);
    onChangeValue(e.target.value);
  };

  const handleUpdateCursor = (e: React.SyntheticEvent<HTMLInputElement>) => {
    setCursorPos((e.target as HTMLInputElement).selectionStart);
  };

  const handleApplyCorrection = (original: string, corrected: string) => {
    const pos = cursorPos !== null ? cursorPos : value.length;
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match: RegExpExecArray | null;
    let bestMatch: { start: number; end: number } | null = null;

    while ((match = regex.exec(value)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (pos >= start && pos <= end + 2) {
        bestMatch = { start, end };
        break;
      }
      bestMatch = { start, end };
    }

    if (bestMatch) {
      const updated = value.slice(0, bestMatch.start) + corrected + value.slice(bestMatch.end);
      onChangeValue(updated);
      setCursorPos(bestMatch.start + corrected.length);
    } else {
      const updated = value.replace(new RegExp(`\\b${original}\\b`, 'i'), corrected);
      onChangeValue(updated);
    }

    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const handleIgnoreWord = (original: string) => {
    setIgnoredWords((prev) => new Set(prev).add(original.toLowerCase()));
  };

  return (
    <div className="space-y-1.5 w-full relative">
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      <div className="relative w-full">
        {/* Popover flutuante com a sugestão referente APENAS à palavra atual/mais recente */}
        {currentSuggestion && (
          <div className="absolute -top-10 left-2 z-30 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700 shadow-xl rounded-xl px-2.5 py-1 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150 text-xs">
            <span className="text-[10px] text-slate-400 font-medium shrink-0">Sugestão:</span>
            
            <button
              type="button"
              onClick={() => handleApplyCorrection(currentSuggestion.original, currentSuggestion.corrected)}
              className="font-extrabold text-emerald-300 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/50 px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs"
              title={`Alterar "${currentSuggestion.original}" por "${currentSuggestion.corrected}"`}
            >
              <Check className="h-3 w-3 text-emerald-400" />
              <span>{currentSuggestion.corrected}</span>
            </button>

            <span className="w-[1px] h-3.5 bg-slate-700" />

            <button
              type="button"
              onClick={() => handleIgnoreWord(currentSuggestion.original)}
              className="p-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Ignorar sugestão e manter como digitei"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <input
          type={type}
          required={required}
          value={value}
          onChange={handleChange}
          onFocus={(e) => {
            handleUpdateCursor(e);
            if (onFocus) onFocus(e);
          }}
          onClick={(e) => {
            handleUpdateCursor(e);
            if (onClick) onClick(e);
          }}
          onKeyUp={(e) => {
            handleUpdateCursor(e);
            if (onKeyUp) onKeyUp(e);
          }}
          onSelect={(e) => {
            handleUpdateCursor(e);
            if (onSelect) onSelect(e);
          }}
          onBlur={onBlur}
          placeholder={placeholder}
          spellCheck={true}
          lang="pt-BR"
          autoCorrect="off"
          autoCapitalize="sentences"
          className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
          {...props}
        />
      </div>

      {justApplied && (
        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
          <Check className="h-3 w-3 text-emerald-600" /> Palavra corrigida!
        </p>
      )}
    </div>
  );
};

interface SpellCheckTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  value: string;
  onChangeValue: (val: string) => void;
  label?: string;
}

export const SpellCheckTextarea: React.FC<SpellCheckTextareaProps> = ({
  value,
  onChangeValue,
  label,
  className = '',
  placeholder,
  rows = 3,
  onBlur,
  onFocus,
  onClick,
  onKeyUp,
  onSelect,
  ...props
}) => {
  const [ignoredWords, setIgnoredWords] = useState<Set<string>>(new Set());
  const [justApplied, setJustApplied] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<WordCorrection[]>([]);
  const [cursorPos, setCursorPos] = useState<number | null>(null);

  useEffect(() => {
    if (!value || value.trim().length < 2) {
      setApiSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await checkPtBrWithLanguageTool(value);
      setApiSuggestions(results);
    }, 400);

    return () => clearTimeout(timer);
  }, [value]);

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

  // Exibe APENAS a sugestão da palavra mais recente/atual no cursor do usuário
  const currentSuggestion = useMemo(() => {
    return findTargetSuggestion(value, cursorPos, suggestions, ignoredWords);
  }, [value, cursorPos, suggestions, ignoredWords]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCursorPos(e.target.selectionStart);
    onChangeValue(e.target.value);
  };

  const handleUpdateCursor = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    setCursorPos((e.target as HTMLTextAreaElement).selectionStart);
  };

  const handleApplyCorrection = (original: string, corrected: string) => {
    const pos = cursorPos !== null ? cursorPos : value.length;
    const regex = new RegExp(`\\b${original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match: RegExpExecArray | null;
    let bestMatch: { start: number; end: number } | null = null;

    while ((match = regex.exec(value)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      if (pos >= start && pos <= end + 2) {
        bestMatch = { start, end };
        break;
      }
      bestMatch = { start, end };
    }

    if (bestMatch) {
      const updated = value.slice(0, bestMatch.start) + corrected + value.slice(bestMatch.end);
      onChangeValue(updated);
      setCursorPos(bestMatch.start + corrected.length);
    } else {
      const updated = value.replace(new RegExp(`\\b${original}\\b`, 'i'), corrected);
      onChangeValue(updated);
    }

    setJustApplied(true);
    setTimeout(() => setJustApplied(false), 2000);
  };

  const handleIgnoreWord = (original: string) => {
    setIgnoredWords((prev) => new Set(prev).add(original.toLowerCase()));
  };

  return (
    <div className="space-y-1.5 w-full relative">
      {label && (
        <label className="block text-xs font-bold text-slate-700">
          {label}
        </label>
      )}

      <div className="relative w-full">
        {/* Popover flutuante com a sugestão referente APENAS à palavra atual/mais recente */}
        {currentSuggestion && (
          <div className="absolute -top-10 left-2 z-30 bg-slate-900/95 text-white backdrop-blur-md border border-slate-700 shadow-xl rounded-xl px-2.5 py-1 flex items-center gap-2 animate-in fade-in slide-in-from-bottom-1 duration-150 text-xs">
            <span className="text-[10px] text-slate-400 font-medium shrink-0">Sugestão:</span>
            
            <button
              type="button"
              onClick={() => handleApplyCorrection(currentSuggestion.original, currentSuggestion.corrected)}
              className="font-extrabold text-emerald-300 hover:text-white bg-emerald-600/30 hover:bg-emerald-600/50 px-2 py-0.5 rounded-lg transition-all cursor-pointer flex items-center gap-1 text-xs"
              title={`Alterar "${currentSuggestion.original}" por "${currentSuggestion.corrected}"`}
            >
              <Check className="h-3 w-3 text-emerald-400" />
              <span>{currentSuggestion.corrected}</span>
            </button>

            <span className="w-[1px] h-3.5 bg-slate-700" />

            <button
              type="button"
              onClick={() => handleIgnoreWord(currentSuggestion.original)}
              className="p-0.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Ignorar sugestão e manter como digitei"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        )}

        <textarea
          rows={rows}
          value={value}
          onChange={handleChange}
          onFocus={(e) => {
            handleUpdateCursor(e);
            if (onFocus) onFocus(e);
          }}
          onClick={(e) => {
            handleUpdateCursor(e);
            if (onClick) onClick(e);
          }}
          onKeyUp={(e) => {
            handleUpdateCursor(e);
            if (onKeyUp) onKeyUp(e);
          }}
          onSelect={(e) => {
            handleUpdateCursor(e);
            if (onSelect) onSelect(e);
          }}
          onBlur={onBlur}
          placeholder={placeholder}
          spellCheck={true}
          lang="pt-BR"
          autoCorrect="off"
          autoCapitalize="sentences"
          className={`w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${className}`}
          {...props}
        />
      </div>

      {justApplied && (
        <p className="text-[10px] font-bold text-emerald-600 flex items-center gap-1 animate-in fade-in duration-200">
          <Check className="h-3 w-3 text-emerald-600" /> Palavra corrigida!
        </p>
      )}
    </div>
  );
};
