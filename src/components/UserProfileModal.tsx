import React, { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { X, Upload, Camera, Check, Image as ImageIcon, Sparkles, User, AlertCircle } from 'lucide-react';
import { useAuth } from './AuthContext';

interface UserProfileModalProps {
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const { profile, updateAvatarUrl } = useAuth();
  const [previewUrl, setPreviewUrl] = useState<string>(profile?.avatarUrl || '');
  const [customUrlInput, setCustomUrlInput] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Compress & convert file to data URL
  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('Por favor, selecione um arquivo de imagem válido (.jpg, .png, .webp).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 5MB.');
      return;
    }

    setErrorMsg(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Resize canvas if needed to optimize Firestore storage size
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setPreviewUrl(dataUrl);
        } else {
          setPreviewUrl(e.target?.result as string);
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    if (!previewUrl) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      await updateAvatarUrl(previewUrl);
      onClose();
    } catch (err) {
      console.error('Erro ao atualizar foto de perfil:', err);
      setErrorMsg('Não foi possível salvar a imagem. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-200/80 relative overflow-hidden space-y-6"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <Camera className="h-3.5 w-3.5 text-blue-600" />
              <span>FOTO DE PERFIL</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              Atualizar Sua Foto
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {profile?.name} • {profile?.role}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Current / New Avatar Preview */}
        <div className="flex flex-col items-center justify-center space-y-3 py-2">
          <div className="relative group">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Pré-visualização"
                className="h-28 w-28 rounded-full object-cover border-4 border-blue-500 shadow-xl"
              />
            ) : (
              <div className="h-28 w-28 rounded-full bg-slate-900 text-white font-extrabold text-3xl flex items-center justify-center border-4 border-slate-300 shadow-lg">
                {profile?.name?.charAt(0).toUpperCase() || 'U'}
              </div>
            )}

            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white transition-all cursor-pointer hover:scale-110"
              title="Upload de foto"
            >
              <Camera className="h-4 w-4" />
            </button>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            Sua foto será exibida no Feed, Comunicados e na área de Equipe
          </p>
        </div>

        {/* Upload Box (Drag & Drop or Click) */}
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
            dragActive 
              ? 'border-blue-500 bg-blue-50/80 scale-[1.01]' 
              : 'border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
          />
          <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Upload className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">
              Clique para selecionar ou arraste sua foto aqui
            </span>
            <span className="text-[11px] text-slate-400">
              Suporta PNG, JPG ou WEBP (máx. 5MB)
            </span>
          </div>
        </div>

        {/* Option to paste image URL */}
        <div className="space-y-1.5">
          <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Ou informe a URL da Imagem:
          </label>
          <div className="flex items-center gap-2">
            <input
              type="url"
              value={customUrlInput}
              onChange={(e) => setCustomUrlInput(e.target.value)}
              placeholder="https://exemplo.com/minha-foto.jpg"
              className="flex-1 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
            <button
              type="button"
              onClick={() => {
                if (customUrlInput.trim()) {
                  setPreviewUrl(customUrlInput.trim());
                  setCustomUrlInput('');
                }
              }}
              className="px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !previewUrl}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <Check className="h-4 w-4" />
                <span>Salvar Foto de Perfil</span>
              </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
