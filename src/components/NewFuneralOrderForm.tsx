import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import {
  User,
  Calendar,
  Clock,
  MapPin,
  FileText,
  ShieldCheck,
  AlertTriangle,
  Phone,
  CheckCircle2,
  Building,
  Heart,
  Truck,
  Flower2,
  Volume2,
  Camera,
  Paperclip,
  Save,
  ArrowLeft,
  X,
  Mic,
  AlertCircle,
  HelpCircle,
  Car,
  Share2,
  FileCheck,
  Sparkles
} from 'lucide-react';
import { SpellCheckInput, SpellCheckTextarea } from './SpellCheckField';

export interface OpeningFormData {
  // 1. Falecido
  nomeFalecido: string;
  dataNascimento: string;
  idade: string;
  dataFalecimento: string;
  horarioFalecimento: string;
  localFalecimentoType: 'Hospital' | 'Residência' | 'IML' | 'Via pública' | 'Outro';
  nomeLocalFalecimento: string;
  cidadeFalecimento: string;
  causaFalecimento: 'Natural' | 'Acidente' | 'Violência' | 'Em investigação' | 'Outra';
  observacoesFalecido: string;

  // 2. Familiar
  nomeFamiliar: string;
  parentesco: string;
  telefoneFamiliar: string;
  whatsappFamiliar: string;
  responsavelDecisoes: 'Sim' | 'Não';
  observacoesFamiliar: string;

  // 3. Dados do Serviço
  tipoAtendimento: 'Plano Funerário' | 'Particular';
  numeroContrato: string;
  atendimentoAutorizado: 'Sim' | 'Não';
  quemAutorizou: string;

  // 4. Remoção
  enderecoRemocao: string;
  cidadeRemocao: string;
  corpoLiberado: 'Sim' | 'Não';
  necessitaAutorizacao: 'Sim' | 'Não';
  horarioPrevistoRemocao: string;
  observacoesRemocao: string;

  // 5. Velório
  haveraVelorio: 'Sim' | 'Não';
  localVelorio: string;
  cidadeVelorio: string;
  dataVelorio: string;
  horarioVelorio: string;
  cerimoniaReligiosa: 'Sim' | 'Não';
  religiao: string;

  // 6. Sepultamento / Cremação
  opcaoFinal: 'Sepultamento' | 'Cremação';
  localSepultamento: string;
  cidadeSepultamento: string;
  dataSepultamento: string;
  horarioSepultamento: string;

  // 7. Preparação do Corpo
  higienizacao: 'Sim' | 'Não';
  barba: 'Sim' | 'Não';
  maquiagem: 'Sim' | 'Não';
  tanatopraxia: 'Sim' | 'Não';
  roupaFamilia: 'Sim' | 'Não';
  descricaoRoupa: string;
  acessoriosFamilia: 'Sim' | 'Não';
  descricaoAcessorios: string;
  observacoesPreparacao: string;

  // 8. Urna
  urnaPlano: 'Sim' | 'Não';
  trocaUrna: 'Sim' | 'Não';
  modeloUrna: string;

  // 9. Ornamentação
  arranjosFlorais: 'Sim' | 'Não';
  qtdArranjos: string;
  floresTipo: 'Naturais' | 'Artificiais';
  coroaFlores: 'Sim' | 'Não';
  qtdCoroas: string;
  coroaTipo: 'Natural' | 'Artificial';
  mensagemFaixa: string;
  fornecedorOrnamentacao: string;

  // 10. Transporte
  necessitaTranslado: 'Sim' | 'Não';
  cidadeOrigemTranslado: string;
  cidadeDestinoTranslado: string;
  veiculoFamiliares: 'Sim' | 'Não';

  // 11. Documentação
  declaracaoObitoRecebida: 'Sim' | 'Não';
  documentoResponsavelRecebido: 'Sim' | 'Não';

  // 12. Divulgação
  notaFalecimento: 'Sim' | 'Não';
  carroSom: 'Sim' | 'Não';
  redesSociais: 'Sim' | 'Não';

  // 13. Observações Importantes
  observacoesImportantes: string;

  // 14. Identificação Atendente
  nomeAtendente: string;
  unidadeAtendimento: string;
  dataAtendimento: string;
  horaAtendimento: string;

  // Meta
  prioridade: 'Normal' | 'Urgente' | 'Emergencial';
}

export interface AttachmentPhoto {
  id: string;
  title: string;
  category: string;
  photoUrl: string;
  createdAt: string;
}

export interface AttachmentAudio {
  id: string;
  title: string;
  audioUrl: string;
  createdAt: string;
}

interface NewFuneralOrderFormProps {
  initialAgentName: string;
  onCancel: () => void;
  onSubmit: (formData: OpeningFormData, photos: AttachmentPhoto[], audioMemos: AttachmentAudio[]) => Promise<void>;
  isSubmitting: boolean;
}

export const NewFuneralOrderForm: React.FC<NewFuneralOrderFormProps> = ({
  initialAgentName,
  onCancel,
  onSubmit,
  isSubmitting
}) => {
  const now = new Date();
  const dateToday = now.toISOString().split('T')[0];
  const dateTodayBR = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const timeTodayBR = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

  // Form State
  const [formData, setFormData] = useState<OpeningFormData>({
    // 1
    nomeFalecido: '',
    dataNascimento: '',
    idade: '',
    dataFalecimento: '',
    horarioFalecimento: '',
    localFalecimentoType: 'Hospital',
    nomeLocalFalecimento: '',
    cidadeFalecimento: '',
    causaFalecimento: '',
    observacoesFalecido: '',

    // 2
    nomeFamiliar: '',
    parentesco: '',
    telefoneFamiliar: '',
    whatsappFamiliar: '',
    responsavelDecisoes: 'Sim',
    observacoesFamiliar: '',

    // 3
    tipoAtendimento: 'Plano Funerário',
    numeroContrato: '',
    atendimentoAutorizado: 'Sim',
    quemAutorizou: '',

    // 4
    enderecoRemocao: '',
    cidadeRemocao: '',
    corpoLiberado: 'Sim',
    necessitaAutorizacao: 'Não',
    horarioPrevistoRemocao: '',
    observacoesRemocao: '',

    // 5
    haveraVelorio: 'Sim',
    localVelorio: '',
    cidadeVelorio: '',
    dataVelorio: '',
    horarioVelorio: '',
    cerimoniaReligiosa: 'Sim',
    religiao: '',

    // 6
    opcaoFinal: 'Sepultamento',
    localSepultamento: '',
    cidadeSepultamento: '',
    dataSepultamento: '',
    horarioSepultamento: '',

    // 7
    higienizacao: 'Sim',
    barba: 'Não',
    maquiagem: 'Sim',
    tanatopraxia: 'Sim',
    roupaFamilia: 'Sim',
    descricaoRoupa: '',
    acessoriosFamilia: 'Não',
    descricaoAcessorios: '',
    observacoesPreparacao: '',

    // 8
    urnaPlano: 'Sim',
    trocaUrna: 'Não',
    modeloUrna: '',

    // 9
    arranjosFlorais: 'Sim',
    qtdArranjos: '1',
    floresTipo: 'Naturais',
    coroaFlores: 'Sim',
    qtdCoroas: '1',
    coroaTipo: 'Natural',
    mensagemFaixa: '',
    fornecedorOrnamentacao: '',

    // 10
    necessitaTranslado: 'Não',
    cidadeOrigemTranslado: '',
    cidadeDestinoTranslado: '',
    veiculoFamiliares: 'Não',

    // 11
    declaracaoObitoRecebida: 'Sim',
    documentoResponsavelRecebido: 'Sim',

    // 12
    notaFalecimento: 'Sim',
    carroSom: 'Não',
    redesSociais: 'Sim',

    // 13
    observacoesImportantes: '',

    // 14
    nomeAtendente: '',
    unidadeAtendimento: '',
    dataAtendimento: dateTodayBR,
    horaAtendimento: timeTodayBR,

    prioridade: 'Normal'
  });

  // Attachments State
  const [photos, setPhotos] = useState<AttachmentPhoto[]>([]);
  const [audioMemos, setAudioMemos] = useState<AttachmentAudio[]>([]);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoCategory, setPhotoCategory] = useState<string>('Declaração de Óbito');

  // Auto-calculate Age when DOB & DOD change
  useEffect(() => {
    if (formData.dataNascimento && formData.dataFalecimento) {
      const dob = new Date(formData.dataNascimento);
      const dod = new Date(formData.dataFalecimento);
      if (!isNaN(dob.getTime()) && !isNaN(dod.getTime())) {
        let age = dod.getFullYear() - dob.getFullYear();
        const m = dod.getMonth() - dob.getMonth();
        if (m < 0 || (m === 0 && dod.getDate() < dob.getDate())) {
          age--;
        }
        if (age >= 0) {
          setFormData((prev) => ({ ...prev, idade: `${age} anos` }));
        }
      }
    }
  }, [formData.dataNascimento, formData.dataFalecimento]);

  // Keep WhatsApp in sync with Telefone if typed
  const handlePhoneChange = (val: string) => {
    setFormData((prev) => ({
      ...prev,
      telefoneFamiliar: val,
      whatsappFamiliar: prev.whatsappFamiliar ? prev.whatsappFamiliar : val
    }));
  };

  const handleChange = <K extends keyof OpeningFormData>(key: K, value: OpeningFormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  // Compress image
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 800;
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width);
              width = maxDim;
            } else {
              width = Math.round((width * maxDim) / height);
              height = maxDim;
            }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.7));
          } else {
            resolve(e.target?.result as string);
          }
        };
        img.onerror = reject;
        img.src = e.target?.result as string;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsUploadingPhoto(true);

    try {
      const newPhotos: AttachmentPhoto[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const dataUrl = await compressImage(file);
        newPhotos.push({
          id: `photo-${Date.now()}-${i}`,
          title: file.name.split('.')[0] || photoCategory,
          category: photoCategory,
          photoUrl: dataUrl,
          createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        });
      }
      setPhotos((prev) => [...prev, ...newPhotos]);
    } catch (err) {
      console.error('Erro ao anexar foto:', err);
      alert('Não foi possível carregar a imagem. Tente novamente.');
    } finally {
      setIsUploadingPhoto(false);
      e.target.value = '';
    }
  };

  const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAudios: AttachmentAudio[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = (ev) => {
        const audioUrl = ev.target?.result as string;
        setAudioMemos((prev) => [
          ...prev,
          {
            id: `audio-${Date.now()}-${i}`,
            title: file.name || `Áudio da Família ${i + 1}`,
            audioUrl,
            createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = '';
  };

  const removePhoto = (id: string) => {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const removeAudio = (id: string) => {
    setAudioMemos((prev) => prev.filter((a) => a.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nomeFalecido.trim()) {
      alert('Por favor, informe o Nome Completo do falecido.');
      return;
    }
    if (!formData.nomeFamiliar.trim()) {
      alert('Por favor, informe o Nome do familiar responsável.');
      return;
    }
    onSubmit(formData, photos, audioMemos);
  };

  // Helper radio buttons component
  const RenderYesNoRadio = ({
    label,
    value,
    onChange
  }: {
    label: string;
    value: 'Sim' | 'Não';
    onChange: (val: 'Sim' | 'Não') => void;
  }) => (
    <div>
      <label className="block text-xs font-bold text-slate-700 mb-1.5">{label}</label>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange('Sim')}
          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            value === 'Sim'
              ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Sim
        </button>
        <button
          type="button"
          onClick={() => onChange('Não')}
          className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
            value === 'Não'
              ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
              : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
          }`}
        >
          Não
        </button>
      </div>
    </div>
  );

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-8 rounded-3xl border border-purple-800/50 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Formulário de Abertura de Atendimento</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Abertura de Atendimento Funerário
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Preencha os dados da ocorrência. Após o envio, o atendimento ficará em status{' '}
            <strong className="text-purple-300">Aberto (Aguardando Agente)</strong> até ser assumido pela equipe de campo.
          </p>
        </div>
      </div>

      {/* Prioridade Picker */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-slate-900 block flex items-center gap-1.5">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <span>Prioridade do Atendimento Funerário</span>
          </span>
          <p className="text-[11px] text-slate-500">
            Define o destaque de urgência na fila de atendimentos da equipe
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => handleChange('prioridade', 'Normal')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              formData.prioridade === 'Normal'
                ? 'bg-blue-50 text-blue-800 border-blue-300 ring-2 ring-blue-500/20'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🟢 Normal
          </button>
          <button
            type="button"
            onClick={() => handleChange('prioridade', 'Urgente')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              formData.prioridade === 'Urgente'
                ? 'bg-amber-50 text-amber-800 border-amber-300 ring-2 ring-amber-500/20'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🟡 Urgente
          </button>
          <button
            type="button"
            onClick={() => handleChange('prioridade', 'Emergencial')}
            className={`flex-1 sm:flex-none px-4 py-2 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
              formData.prioridade === 'Emergencial'
                ? 'bg-rose-100 text-rose-900 border-rose-300 ring-2 ring-rose-500/30 animate-pulse'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
            }`}
          >
            🔴 Emergencial
          </button>
        </div>
      </div>

      {/* SECTION 1: IDENTIFICAÇÃO DO FALECIDO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            1
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-purple-600" />
              <span>1. Identificação do Falecido</span>
            </h3>
            <p className="text-xs text-slate-500">Dados pessoais do falecido e informações do óbito</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome Completo <span className="text-rose-500">*</span>
            </label>
            <SpellCheckInput
              type="text"
              required
              placeholder="Ex: João Silva de Souza"
              value={formData.nomeFalecido}
              onChangeValue={(val) => handleChange('nomeFalecido', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Data de Nascimento</label>
            <input
              type="date"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.dataNascimento}
              onChange={(e) => handleChange('dataNascimento', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Idade</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: 78 anos"
              value={formData.idade}
              onChangeValue={(val) => handleChange('idade', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Data do Falecimento</label>
            <input
              type="date"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.dataFalecimento}
              onChange={(e) => handleChange('dataFalecimento', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Horário do Falecimento</label>
            <input
              type="text"
              placeholder="Ex: 14:30"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.horarioFalecimento}
              onChange={(e) => handleChange('horarioFalecimento', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Local do Falecimento</label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              value={formData.localFalecimentoType}
              onChange={(e) => handleChange('localFalecimentoType', e.target.value as any)}
            >
              <option value="Hospital">Hospital</option>
              <option value="Residência">Residência</option>
              <option value="IML">IML</option>
              <option value="Via pública">Via pública</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Local</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: Hospital Roberto Santos"
              value={formData.nomeLocalFalecimento}
              onChangeValue={(val) => handleChange('nomeLocalFalecimento', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: Salvador"
              value={formData.cidadeFalecimento}
              onChangeValue={(val) => handleChange('cidadeFalecimento', val)}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Causa do Falecimento</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {(['Natural', 'Acidente', 'Violência', 'Em investigação', 'Outra'] as const).map((causa) => (
                <button
                  key={causa}
                  type="button"
                  onClick={() => handleChange('causaFalecimento', causa)}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    formData.causaFalecimento === causa
                      ? 'bg-purple-600 text-white border-purple-600 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {causa}
                </button>
              ))}
            </div>
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Falecido</label>
            <SpellCheckTextarea
              rows={2}
              placeholder="Informações relevantes sobre a causa, quadro médico ou condições do falecido..."
              value={formData.observacoesFalecido}
              onChangeValue={(val) => handleChange('observacoesFalecido', val)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 2: FAMILIAR RESPONSÁVEL PELO FUNERAL */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shrink-0">
            2
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Phone className="h-4 w-4 text-indigo-600" />
              <span>2. Familiar Responsável pelo Funeral</span>
            </h3>
            <p className="text-xs text-slate-500">Contato principal para tomadas de decisão e alinhamentos</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome Completo do Responsável <span className="text-rose-500">*</span>
            </label>
            <SpellCheckInput
              type="text"
              required
              placeholder="Ex: Maria Santos Silva"
              value={formData.nomeFamiliar}
              onChangeValue={(val) => handleChange('nomeFamiliar', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Parentesco</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: Filha, Esposa, Irmão"
              value={formData.parentesco}
              onChangeValue={(val) => handleChange('parentesco', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Telefone Principal</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: (71) 98888-7777"
              value={formData.telefoneFamiliar}
              onChangeValue={handlePhoneChange}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: (71) 98888-7777"
              value={formData.whatsappFamiliar}
              onChangeValue={(val) => handleChange('whatsappFamiliar', val)}
            />
          </div>

          <div>
            <RenderYesNoRadio
              label="Responsável pelas Decisões?"
              value={formData.responsavelDecisoes}
              onChange={(val) => handleChange('responsavelDecisoes', val)}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Observações do Familiar</label>
            <SpellCheckTextarea
              rows={2}
              placeholder="Horários preferenciais de contato, segundo responsável ou observações de atendimento..."
              value={formData.observacoesFamiliar}
              onChangeValue={(val) => handleChange('observacoesFamiliar', val)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 3: DADOS DO SERVIÇO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            3
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600" />
              <span>3. Dados do Serviço</span>
            </h3>
            <p className="text-xs text-slate-500">Contrato, plano funerário e autorização</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Atendimento</label>
            <select
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
              value={formData.tipoAtendimento}
              onChange={(e) => handleChange('tipoAtendimento', e.target.value as any)}
            >
              <option value="Plano Funerário">Plano Funerário</option>
              <option value="Particular">Particular</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Número do Contrato</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: BP-109283"
              value={formData.numeroContrato}
              onChangeValue={(val) => handleChange('numeroContrato', val)}
            />
          </div>

          <div>
            <RenderYesNoRadio
              label="Atendimento Autorizado?"
              value={formData.atendimentoAutorizado}
              onChange={(val) => handleChange('atendimentoAutorizado', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Quem Autorizou?</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: Central Bahia Prev / Familiar"
              value={formData.quemAutorizou}
              onChangeValue={(val) => handleChange('quemAutorizou', val)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 4: REMOÇÃO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            4
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Truck className="h-4 w-4 text-amber-600" />
              <span>4. Remoção</span>
            </h3>
            <p className="text-xs text-slate-500">Endereço de recolhimento do corpo e liberação</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Endereço da Remoção</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: Ruas das Flores, 123 - Brotas, Salvador"
              value={formData.enderecoRemocao}
              onChangeValue={(val) => handleChange('enderecoRemocao', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cidade da Remoção</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: Salvador"
              value={formData.cidadeRemocao}
              onChangeValue={(val) => handleChange('cidadeRemocao', val)}
            />
          </div>

          <div>
            <RenderYesNoRadio
              label="Corpo Liberado?"
              value={formData.corpoLiberado}
              onChange={(val) => handleChange('corpoLiberado', val)}
            />
          </div>

          <div>
            <RenderYesNoRadio
              label="Necessita Autorização?"
              value={formData.necessitaAutorizacao}
              onChange={(val) => handleChange('necessitaAutorizacao', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Horário Previsto</label>
            <input
              type="text"
              placeholder="Ex: 16:00"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.horarioPrevistoRemocao}
              onChange={(e) => handleChange('horarioPrevistoRemocao', e.target.value)}
            />
          </div>

          <div className="sm:col-span-2 lg:col-span-3">
            <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Remoção</label>
            <SpellCheckTextarea
              rows={2}
              placeholder="Condições de acesso ao local, liberação de atestado ou requisitos de transporte..."
              value={formData.observacoesRemocao}
              onChangeValue={(val) => handleChange('observacoesRemocao', val)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 5: VELÓRIO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            5
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Building className="h-4 w-4 text-emerald-600" />
              <span>5. Velório</span>
            </h3>
            <p className="text-xs text-slate-500">Local, data, horário e cerimônia</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <RenderYesNoRadio
              label="Haverá Velório?"
              value={formData.haveraVelorio}
              onChange={(val) => handleChange('haveraVelorio', val)}
            />
          </div>

          {formData.haveraVelorio === 'Sim' && (
            <>
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Local do Velório</label>
                <SpellCheckInput
                  type="text"
                  placeholder="Ex: Capela 02 - Cemitério Jardim da Saudade"
                  value={formData.localVelorio}
                  onChangeValue={(val) => handleChange('localVelorio', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
                <SpellCheckInput
                  type="text"
                  placeholder="Ex: Salvador"
                  value={formData.cidadeVelorio}
                  onChangeValue={(val) => handleChange('cidadeVelorio', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Data do Velório</label>
                <input
                  type="date"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.dataVelorio}
                  onChange={(e) => handleChange('dataVelorio', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Horário do Velório</label>
                <input
                  type="text"
                  placeholder="Ex: 08:00 às 16:00"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.horarioVelorio}
                  onChange={(e) => handleChange('horarioVelorio', e.target.value)}
                />
              </div>

              <div>
                <RenderYesNoRadio
                  label="Cerimônia Religiosa?"
                  value={formData.cerimoniaReligiosa}
                  onChange={(val) => handleChange('cerimoniaReligiosa', val)}
                />
              </div>

              {formData.cerimoniaReligiosa === 'Sim' && (
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Religião / Rito</label>
                  <SpellCheckInput
                    type="text"
                    placeholder="Ex: Católica, Evangélica, Espírita, Candomblé..."
                    value={formData.religiao}
                    onChangeValue={(val) => handleChange('religiao', val)}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* SECTION 6: SEPULTAMENTO / CREMAÇÃO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
            6
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="h-4 w-4 text-teal-600" />
              <span>6. Sepultamento / Cremação</span>
            </h3>
            <p className="text-xs text-slate-500">Destino final, local e agendamento</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Opção Final</label>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleChange('opcaoFinal', 'Sepultamento')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  formData.opcaoFinal === 'Sepultamento'
                    ? 'bg-teal-700 text-white border-teal-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                ⚰️ Sepultamento
              </button>
              <button
                type="button"
                onClick={() => handleChange('opcaoFinal', 'Cremação')}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  formData.opcaoFinal === 'Cremação'
                    ? 'bg-amber-700 text-white border-amber-700 shadow-xs'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🔥 Cremação
              </button>
            </div>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Local / Cemitério / Crematório</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: Cemitério Campo Santo"
              value={formData.localSepultamento}
              onChangeValue={(val) => handleChange('localSepultamento', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Cidade</label>
            <SpellCheckInput
              type="text"
              placeholder="Ex: Salvador"
              value={formData.cidadeSepultamento}
              onChangeValue={(val) => handleChange('cidadeSepultamento', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
            <input
              type="date"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.dataSepultamento}
              onChange={(e) => handleChange('dataSepultamento', e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Horário Previsto</label>
            <input
              type="text"
              placeholder="Ex: 16:30"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              value={formData.horarioSepultamento}
              onChange={(e) => handleChange('horarioSepultamento', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 7: PREPARAÇÃO DO CORPO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold shrink-0">
            7
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Heart className="h-4 w-4 text-rose-600" />
              <span>7. Preparação do Corpo</span>
            </h3>
            <p className="text-xs text-slate-500">Procedimentos estéticos, vestimenta e adornos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <RenderYesNoRadio
            label="Higienização?"
            value={formData.higienizacao}
            onChange={(val) => handleChange('higienizacao', val)}
          />
          <RenderYesNoRadio
            label="Barba?"
            value={formData.barba}
            onChange={(val) => handleChange('barba', val)}
          />
          <RenderYesNoRadio
            label="Maquiagem?"
            value={formData.maquiagem}
            onChange={(val) => handleChange('maquiagem', val)}
          />
          <RenderYesNoRadio
            label="Tanatopraxia?"
            value={formData.tanatopraxia}
            onChange={(val) => handleChange('tanatopraxia', val)}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            <RenderYesNoRadio
              label="Roupa Fornecida pela Família?"
              value={formData.roupaFamilia}
              onChange={(val) => handleChange('roupaFamilia', val)}
            />
            {formData.roupaFamilia === 'Sim' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição da Roupa</label>
                <SpellCheckTextarea
                  rows={2}
                  placeholder="Ex: Terno escuro completo, camisa branca, gravata azul..."
                  value={formData.descricaoRoupa}
                  onChangeValue={(val) => handleChange('descricaoRoupa', val)}
                />
              </div>
            )}
          </div>

          <div className="space-y-3 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/70">
            <RenderYesNoRadio
              label="Acessórios Fornecidos?"
              value={formData.acessoriosFamilia}
              onChange={(val) => handleChange('acessoriosFamilia', val)}
            />
            {formData.acessoriosFamilia === 'Sim' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição dos Acessórios</label>
                <SpellCheckTextarea
                  rows={2}
                  placeholder="Ex: Aliança, terço de madeira, óculos..."
                  value={formData.descricaoAcessorios}
                  onChangeValue={(val) => handleChange('descricaoAcessorios', val)}
                />
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1">Observações da Preparação</label>
            <SpellCheckTextarea
              rows={2}
              placeholder="Recomendações técnicas para a sala de preparação do corpo..."
              value={formData.observacoesPreparacao}
              onChangeValue={(val) => handleChange('observacoesPreparacao', val)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 8: URNA */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
            8
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BoxIcon className="h-4 w-4 text-amber-600" />
              <span>8. Urna Mortuária</span>
            </h3>
            <p className="text-xs text-slate-500">Urna coberta pelo plano ou alteração de modelo</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <RenderYesNoRadio
            label="Urna Padrão do Plano?"
            value={formData.urnaPlano}
            onChange={(val) => handleChange('urnaPlano', val)}
          />

          <RenderYesNoRadio
            label="Troca de Urna (Upgrade)?"
            value={formData.trocaUrna}
            onChange={(val) => handleChange('trocaUrna', val)}
          />

          {formData.trocaUrna === 'Sim' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Modelo Escolhido</label>
              <SpellCheckInput
                type="text"
                placeholder="Ex: Modelo Luxo Mogno com Visor"
                value={formData.modeloUrna}
                onChangeValue={(val) => handleChange('modeloUrna', val)}
              />
            </div>
          )}
        </div>
      </div>

      {/* SECTION 9: ORNAMENTAÇÃO */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0">
            9
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Flower2 className="h-4 w-4 text-emerald-600" />
              <span>9. Ornamentação e Arranjos Florais</span>
            </h3>
            <p className="text-xs text-slate-500">Flores da urna, coroas e homenagens</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <RenderYesNoRadio
            label="Arranjos Florais na Urna?"
            value={formData.arranjosFlorais}
            onChange={(val) => handleChange('arranjosFlorais', val)}
          />

          {formData.arranjosFlorais === 'Sim' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade de Arranjos</label>
                <input
                  type="text"
                  placeholder="Ex: 2"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.qtdArranjos}
                  onChange={(e) => handleChange('qtdArranjos', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo das Flores</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  value={formData.floresTipo}
                  onChange={(e) => handleChange('floresTipo', e.target.value as any)}
                >
                  <option value="Naturais">Naturais</option>
                  <option value="Artificiais">Artificiais</option>
                </select>
              </div>
            </>
          )}

          <RenderYesNoRadio
            label="Coroa de Flores?"
            value={formData.coroaFlores}
            onChange={(val) => handleChange('coroaFlores', val)}
          />

          {formData.coroaFlores === 'Sim' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantidade de Coroas</label>
                <input
                  type="text"
                  placeholder="Ex: 1"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  value={formData.qtdCoroas}
                  onChange={(e) => handleChange('qtdCoroas', e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo da Coroa</label>
                <select
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-purple-500 cursor-pointer"
                  value={formData.coroaTipo}
                  onChange={(e) => handleChange('coroaTipo', e.target.value as any)}
                >
                  <option value="Natural">Natural</option>
                  <option value="Artificial">Artificial</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Mensagem da Faixa</label>
                <SpellCheckInput
                  type="text"
                  placeholder="Ex: Saudades eternas dos seus filhos e netos"
                  value={formData.mensagemFaixa}
                  onChangeValue={(val) => handleChange('mensagemFaixa', val)}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">Fornecedor da Ornamentação</label>
                <SpellCheckInput
                  type="text"
                  placeholder="Ex: Bahia Prev Floricultura / Floricultura Externa"
                  value={formData.fornecedorOrnamentacao}
                  onChangeValue={(val) => handleChange('fornecedorOrnamentacao', val)}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* SECTION 10: TRANSPORTE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shrink-0">
            10
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Car className="h-4 w-4 text-purple-600" />
              <span>10. Transporte e Translado</span>
            </h3>
            <p className="text-xs text-slate-500">Viagens intermunicipais e transporte de familiares</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <RenderYesNoRadio
            label="Necessita Translado Intermunicipal/Estadual?"
            value={formData.necessitaTranslado}
            onChange={(val) => handleChange('necessitaTranslado', val)}
          />

          {formData.necessitaTranslado === 'Sim' && (
            <>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cidade de Origem</label>
                <SpellCheckInput
                  type="text"
                  placeholder="Ex: Salvador"
                  value={formData.cidadeOrigemTranslado}
                  onChangeValue={(val) => handleChange('cidadeOrigemTranslado', val)}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cidade de Destino</label>
                <SpellCheckInput
                  type="text"
                  placeholder="Ex: Feira de Santana"
                  value={formData.cidadeDestinoTranslado}
                  onChangeValue={(val) => handleChange('cidadeDestinoTranslado', val)}
                />
              </div>
            </>
          )}

          <RenderYesNoRadio
            label="Veículo de Apoio para Familiares?"
            value={formData.veiculoFamiliares}
            onChange={(val) => handleChange('veiculoFamiliares', val)}
          />
        </div>
      </div>

      {/* SECTION 11 & 12: DOCUMENTAÇÃO E DIVULGAÇÃO */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 11 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="h-8 w-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
              11
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-blue-600" />
                <span>11. Documentação</span>
              </h3>
            </div>
          </div>

          <div className="space-y-3">
            <RenderYesNoRadio
              label="Declaração de Óbito Recebida?"
              value={formData.declaracaoObitoRecebida}
              onChange={(val) => handleChange('declaracaoObitoRecebida', val)}
            />
            <RenderYesNoRadio
              label="Documento do Responsável Recebido?"
              value={formData.documentoResponsavelRecebido}
              onChange={(val) => handleChange('documentoResponsavelRecebido', val)}
            />
          </div>
        </div>

        {/* 12 */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
            <div className="h-8 w-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0">
              12
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Share2 className="h-4 w-4 text-indigo-600" />
                <span>12. Divulgação Homenagem</span>
              </h3>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <RenderYesNoRadio
              label="Nota de Falecimento?"
              value={formData.notaFalecimento}
              onChange={(val) => handleChange('notaFalecimento', val)}
            />
            <RenderYesNoRadio
              label="Carro de Som?"
              value={formData.carroSom}
              onChange={(val) => handleChange('carroSom', val)}
            />
            <RenderYesNoRadio
              label="Redes Sociais?"
              value={formData.redesSociais}
              onChange={(val) => handleChange('redesSociais', val)}
            />
          </div>
        </div>
      </div>

      {/* SECTION 13: OBSERVAÇÕES IMPORTANTES AO AGENTE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold shrink-0">
            13
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>13. Observações Importantes ao Agente Funerário</span>
            </h3>
            <p className="text-xs text-slate-500">Instruções especiais de atendimento e particularidades</p>
          </div>
        </div>

        <SpellCheckTextarea
          rows={3}
          placeholder="Digite qualquer detalhe essencial que o agente funerário deve saber ao assumir o serviço..."
          value={formData.observacoesImportantes}
          onChangeValue={(val) => handleChange('observacoesImportantes', val)}
        />
      </div>



      {/* SECTION 14: IDENTIFICAÇÃO DO ATENDENTE */}
      <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-10 w-10 rounded-2xl bg-slate-100 text-slate-800 flex items-center justify-center font-bold shrink-0">
            14
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <User className="h-4 w-4 text-slate-700" />
              <span>14. Identificação do Atendente</span>
            </h3>
            <p className="text-xs text-slate-500">Responsável pela abertura deste formulário</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Atendente</label>
            <SpellCheckInput
              type="text"
              value={formData.nomeAtendente}
              onChangeValue={(val) => handleChange('nomeAtendente', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
            <SpellCheckInput
              type="text"
              value={formData.unidadeAtendimento}
              onChangeValue={(val) => handleChange('unidadeAtendimento', val)}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Data</label>
            <input
              type="text"
              readOnly
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
              value={formData.dataAtendimento}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Hora</label>
            <input
              type="text"
              readOnly
              className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 cursor-not-allowed"
              value={formData.horaAtendimento}
            />
          </div>
        </div>
      </div>

      {/* Action Submit Footer */}
      <div className="p-6 bg-white border border-slate-200/80 rounded-3xl shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 font-bold">
            ✓
          </div>
          <div>
            <span className="text-xs font-bold text-slate-900 block">Pronto para Abrir Atendimento?</span>
            <span className="text-[11px] text-slate-500">
              O formulário gerará uma Ordem de Serviço que ficará disponível para os agentes assumirem.
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 sm:flex-none px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-2xl transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 sm:flex-none px-8 py-3 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-xs rounded-2xl shadow-xl shadow-purple-600/25 border border-purple-400/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            <span>{isSubmitting ? 'Salvando...' : 'Salvar e Abrir Atendimento'}</span>
          </button>
        </div>
      </div>
    </form>
  );
};

// BoxIcon fallback
function BoxIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z" />
      <path d="m3.3 7 8.7 5 8.7-5" />
      <path d="M12 22V12" />
    </svg>
  );
}
