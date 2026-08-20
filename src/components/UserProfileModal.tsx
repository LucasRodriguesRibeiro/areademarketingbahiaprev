import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  X, 
  Upload, 
  Camera, 
  Check, 
  User, 
  AlertCircle, 
  Briefcase, 
  Lock, 
  Key, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  ShieldCheck 
} from 'lucide-react';
import { useAuth } from './AuthContext';
import { formatUserName } from '../utils/userNameFormatter';

interface UserProfileModalProps {
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ onClose }) => {
  const { profile, updateUserProfile, updatePassword } = useAuth();
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'password'>('profile');

  // Profile Tab State
  const [nameInput, setNameInput] = useState<string>(formatUserName(profile?.name, profile?.email) || '');
  const [roleInput, setRoleInput] = useState<string>(profile?.role || 'Colaborador');
  const [previewUrl, setPreviewUrl] = useState<string>(profile?.avatarUrl || '');
  const [saving, setSaving] = useState(false);
  const [compressingImage, setCompressingImage] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password Tab State
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordErrorMsg, setPasswordErrorMsg] = useState<string | null>(null);
  const [passwordSuccessMsg, setPasswordSuccessMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setNameInput(formatUserName(profile.name, profile.email) || '');
      setRoleInput(profile.role || 'Colaborador');
      setPreviewUrl(profile.avatarUrl || '');
    }
  }, [profile]);

  const canEditRole = true;

  // Compress & convert file to data URL
  const handleFile = (file: File) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase()) && !file.type.startsWith('image/')) {
      setErrorMsg('Por favor, envie um arquivo de imagem (JPG, PNG ou WEBP).');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setErrorMsg('A imagem deve ter no máximo 10MB.');
      return;
    }

    setErrorMsg(null);
    setCompressingImage(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 280;
        const MAX_HEIGHT = 280;
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

        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
          setPreviewUrl(dataUrl);
        } else {
          setPreviewUrl(e.target?.result as string);
        }
        setCompressingImage(false);
      };
      img.onerror = () => {
        setErrorMsg('Erro ao carregar a imagem. Tente outra imagem.');
        setCompressingImage(false);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = () => {
      setErrorMsg('Erro ao ler arquivo.');
      setCompressingImage(false);
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

  const handleSaveProfile = async () => {
    if (!nameInput.trim()) {
      setErrorMsg('O nome não pode ficar em branco.');
      return;
    }
    if (compressingImage) {
      setErrorMsg('Aguarde o processamento da imagem terminar...');
      return;
    }
    setSaving(true);
    setErrorMsg(null);
    try {
      const formattedName = formatUserName(nameInput, profile?.email);
      const payload: { name: string; role: string; avatarUrl?: string } = {
        name: formattedName,
        role: canEditRole ? roleInput.trim() : (profile?.role || 'Colaborador')
      };
      if (previewUrl) {
        payload.avatarUrl = previewUrl;
      }

      await updateUserProfile(payload);
      onClose();
    } catch (err: any) {
      console.error('Erro ao atualizar perfil:', err);
      setErrorMsg(err?.message || 'Não foi possível salvar as alterações. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordErrorMsg(null);
    setPasswordSuccessMsg(null);

    if (!newPassword.trim()) {
      setPasswordErrorMsg('Por favor, informe a nova senha.');
      return;
    }

    if (newPassword.trim().length < 6) {
      setPasswordErrorMsg('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordErrorMsg('A confirmação da senha não coincide com a nova senha digitada.');
      return;
    }

    setPasswordSaving(true);

    try {
      await updatePassword(newPassword.trim());
      setPasswordSuccessMsg('Sua senha foi alterada com sucesso! Utilize-a em seus próximos acessos.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      console.error('Erro ao alterar senha:', err);
      setPasswordErrorMsg(err?.message || 'Ocorreu um erro ao alterar sua senha. Tente novamente.');
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="bg-white rounded-3xl max-w-md w-full p-5 sm:p-7 shadow-2xl border border-slate-200/80 relative overflow-hidden space-y-5 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold mb-2">
              <ShieldCheck className="h-3.5 w-3.5 text-blue-600" />
              <span>MINHA CONTA & SEGURANÇA</span>
            </div>
            <h3 className="text-xl font-extrabold text-slate-900">
              {activeTab === 'profile' ? 'Editar Nome e Foto' : 'Alterar Minha Senha'}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {profile?.email} • {profile?.role}
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex bg-slate-100/80 p-1.5 rounded-2xl gap-1 border border-slate-200/60">
          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'profile'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <User className="h-3.5 w-3.5" />
            <span>Perfil & Foto</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('password')}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
              activeTab === 'password'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200/80'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Key className="h-3.5 w-3.5" />
            <span>Alterar Senha</span>
          </button>
        </div>

        {/* TAB 1: PROFILE TAB */}
        {activeTab === 'profile' && (
          <div className="space-y-5">
            {/* Error message */}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Name Input Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Seu Nome de Usuário:
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Digite seu nome completo"
                  className="w-full p-3 pl-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <User className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
            </div>

            {/* Role Input Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                <span>Cargo / Função:</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roleInput}
                  onChange={(e) => setRoleInput(e.target.value)}
                  disabled={!canEditRole}
                  placeholder="Ex: Gerente Geral, Financeiro, CPD..."
                  className="w-full p-3 pl-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 disabled:text-slate-500"
                />
                <Briefcase className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
              </div>

              {/* Official Company Roles Suggestions */}
              <div className="pt-1.5">
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Cargos da Empresa:</p>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
                  {[
                    'CPD',
                    'Gerente Funerário',
                    'Gerente Geral',
                    'Atendimento / Recepção',
                    'Vendedor(a)',
                    'Agente Funerário',
                    'Designer Gráfico',
                    'Analista de Marketing',
                    'Financeiro',
                    'Cobrador',
                    'Diretor / Presidente',
                    'Administrador'
                  ].map((role) => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setRoleInput(role)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        roleInput === role
                          ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Current / New Avatar Preview */}
            <div className="flex flex-col items-center justify-center space-y-3 py-1">
              <div className="relative group">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Pré-visualização"
                    className="h-24 w-24 rounded-full object-cover border-4 border-blue-500 shadow-xl"
                  />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-slate-900 text-white font-extrabold text-3xl flex items-center justify-center border-4 border-slate-300 shadow-lg">
                    {(nameInput || profile?.name || 'U').charAt(0).toUpperCase()}
                  </div>
                )}

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute bottom-0 right-0 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg border-2 border-white transition-all cursor-pointer hover:scale-110"
                  title="Upload de foto"
                >
                  <Camera className="h-3.5 w-3.5" />
                </button>
              </div>

              <p className="text-[11px] text-slate-500 font-medium text-center">
                Envie um arquivo PNG ou JPEG para atualizar sua foto de perfil
              </p>
            </div>

            {/* Upload Box */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-4 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1.5 ${
                dragActive 
                  ? 'border-blue-500 bg-blue-50/80 scale-[1.01]' 
                  : 'border-slate-200 hover:border-blue-400 bg-slate-50/70 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />
              <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Upload className="h-4 w-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-slate-800 block">
                  Clique para selecionar ou arraste sua foto aqui
                </span>
                <span className="text-[10px] text-slate-400">
                  Formatação permitida: JPEG, PNG ou WEBP (máx. 10MB)
                </span>
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
                onClick={handleSaveProfile}
                disabled={saving || !nameInput.trim()}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {saving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Salvando...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Salvar Alterações</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: PASSWORD TAB */}
        {activeTab === 'password' && (
          <form onSubmit={handleSavePassword} className="space-y-4">
            <div className="p-3 bg-blue-50/80 border border-blue-200/80 rounded-2xl flex items-start gap-2.5 text-blue-900 text-xs">
              <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-extrabold block">Segurança da Sua Conta</span>
                <span className="text-[11px] text-blue-700">
                  Defina uma nova senha para acessar o sistema Bahia Prev Hub com segurança.
                </span>
              </div>
            </div>

            {/* Feedback Alerts */}
            {passwordErrorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{passwordErrorMsg}</span>
              </div>
            )}

            {passwordSuccessMsg && (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{passwordSuccessMsg}</span>
              </div>
            )}

            {/* New Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Nova Senha:
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Digite sua nova senha (mínimo 6 caracteres)"
                  className="w-full p-3 pl-10 pr-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Key className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {newPassword.length > 0 && newPassword.length < 6 && (
                <p className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  Mínimo de 6 caracteres necessário
                </p>
              )}
            </div>

            {/* Confirm New Password Field */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                Confirmar Nova Senha:
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Redigite a nova senha"
                  className="w-full p-3 pl-10 pr-10 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                <Lock className="h-4 w-4 text-slate-400 absolute left-3 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {confirmPassword.length > 0 && newPassword !== confirmPassword && (
                <p className="text-[10px] font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  As senhas não coincidem
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                {passwordSuccessMsg ? 'Fechar' : 'Cancelar'}
              </button>

              <button
                type="submit"
                disabled={passwordSaving || !newPassword.trim() || newPassword.trim().length < 6 || newPassword !== confirmPassword}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {passwordSaving ? (
                  <>
                    <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Atualizando Senha...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Atualizar Senha</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
};
