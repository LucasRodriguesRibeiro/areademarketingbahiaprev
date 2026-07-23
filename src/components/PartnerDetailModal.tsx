import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Partner, SupportMaterial } from '../types';
import { SUPPORT_MATERIALS } from '../data';
import { 
  X, Copy, Check, Phone, ArrowUpRight, 
  Sparkles, Download, Edit2, Sliders, 
  CheckCircle, Tag, AlertCircle, Instagram
} from 'lucide-react';

interface PartnerDetailModalProps {
  partner: Partner | null;
  onClose: () => void;
}

export const PartnerDetailModal: React.FC<PartnerDetailModalProps> = ({ partner, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState<SupportMaterial | null>(null);

  // Customizer State
  const [phone, setPhone] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [promoText, setPromoText] = useState('');
  const [benefitText, setBenefitText] = useState('');
  const [accentColor, setAccentColor] = useState('#2563eb'); // Default Blue
  const [bgColor, setBgColor] = useState('#0f172a'); // Default Slate-900

  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Sync state whenever the partner or material changes
  useEffect(() => {
    if (partner) {
      setPhone(partner.telephone);
      setPartnerName(partner.name);
      setCopied(false);
      setSelectedMaterial(null);
    }
  }, [partner]);

  if (!partner) return null;

  const handleCopyPhone = () => {
    const convenioNumber = `#${partner.id.toUpperCase().replace(/_/g, '')}`;
    const textToCopy = `Empresa: ${partner.name}\nLocalização: ${partner.city}\nNúmero para Contato: ${partner.telephone}\nNúmero do Convênio: ${convenioNumber}\nBenefício: ${partner.discount}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const colorsList = [
    { name: 'Azul Real', primary: '#2563eb', bg: '#0f172a' },
    { name: 'Vermelho Vibrante', primary: '#dc2626', bg: '#0f172a' },
    { name: 'Azul Escuro', primary: '#1e3a8a', bg: '#0b1329' },
    { name: 'Vermelho Rubi', primary: '#991b1b', bg: '#1c0a0a' },
    { name: 'Azul/Cinza Premium', primary: '#3b82f6', bg: '#1e293b' }
  ];

  const handleOpenCustomizer = (material: SupportMaterial) => {
    setSelectedMaterial(material);
    setDownloadSuccess(false);
    
    // Preset some values with partner details
    if (material.templateType === 'post_desconto') {
      setPromoText('Parceria de Desconto Ativa');
      setBenefitText(partner.discount);
    } else if (material.templateType === 'banner_convenio') {
      setPromoText('BENEFÍCIO CONFIRMADO');
      setBenefitText('Apresente seu documento e economize');
    } else if (material.templateType === 'post_informativo') {
      setPromoText(partner.name);
      setBenefitText('Aproveite as Vantagens do Convênio');
    }
  };

  const handleDownload = (format: 'png' | 'svg') => {
    if (!selectedMaterial) return;
    setDownloading(true);
    
    const svgId = `modal-svg-${selectedMaterial.id}`;
    const svgElement = document.getElementById(svgId);

    if (!svgElement) {
      setDownloading(false);
      return;
    }

    const filename = `${partner.id}_${selectedMaterial.id}_customizado`.toLowerCase();
    
    // Resolution sizes
    let targetWidth = 1080;
    let targetHeight = 1080;
    if (selectedMaterial.templateType === 'banner_convenio') {
      targetWidth = 1920;
      targetHeight = 1080;
    }

    const clonedSvg = svgElement.cloneNode(true) as SVGElement;
    clonedSvg.setAttribute('width', targetWidth.toString());
    clonedSvg.setAttribute('height', targetHeight.toString());
    
    const svgString = new XMLSerializer().serializeToString(clonedSvg);

    if (format === 'svg') {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${filename}.svg`;
      link.click();
      URL.revokeObjectURL(url);
      
      setDownloading(false);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } else {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
          try {
            const pngUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = pngUrl;
            link.download = `${filename}.png`;
            link.click();
          } catch (err) {
            console.error('Error drawing image on canvas', err);
          }
        }
        URL.revokeObjectURL(url);
        setDownloading(false);
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      };
      img.src = url;
    }
  };

  // Generate initials for brand placeholder logo
  const initials = partner.name
    .split(' ')
    .filter((word) => word.length > 2)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase() || partner.name.slice(0, 2).toUpperCase();

  // Filter materials matching this partner or display all general ones
  const materialsToDisplay = SUPPORT_MATERIALS;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Dark backdrop overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/70 backdrop-blur-md"
      />

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden z-10 border border-slate-100 flex flex-col max-h-[92vh] sm:max-h-[85vh]"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className={`h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-br ${partner.logoColor} flex items-center justify-center text-white font-mono font-bold text-xs sm:text-sm shadow-xs`}>
              {initials}
            </div>
            <div>
              <h2 className="text-base sm:text-xl font-bold text-slate-900 font-sans tracking-tight leading-none">
                {partner.name}
              </h2>
              <span className="text-[10px] sm:text-xs font-semibold text-slate-400 mt-1 block">
                Parceiro em {partner.city} • Benefícios do Parceiro
              </span>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="h-4 sm:h-5 w-4 sm:w-5" />
          </button>
        </div>

        {/* Modal Scrollable Content split into two columns: Details on Left, Materials on Right */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
            
            {/* Left Column: Details (Descontos e Telefone para Copiar) */}
            <div className="lg:col-span-5 space-y-6">
              
              {/* Card de Desconto Aplicado */}
              <div className="bg-blue-50/70 border border-blue-100 rounded-2xl p-4 sm:p-6">
                <div className="flex items-center gap-2 text-blue-800 font-semibold text-sm mb-3">
                  <Tag className="h-4 w-4 text-red-500" />
                  <span>Desconto Aplicado</span>
                </div>
                <p className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight leading-tight">
                  {partner.discount}
                </p>
                <p className="text-xs sm:text-sm text-slate-600 mt-3 leading-relaxed">
                  {partner.description}
                </p>
              </div>

              {/* Card de Telefone/Contato e Dados do Convênio de Fácil Cópia */}
              <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                    <Phone className="h-4 w-4 text-slate-500" />
                    <span>Dados do Convênio / Copiar</span>
                  </div>
                </div>

                {/* Main Action Number & Details Button */}
                <button
                  onClick={handleCopyPhone}
                  className={`w-full p-3 sm:p-4 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 transition-all cursor-pointer group text-left ${
                    copied 
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-base sm:text-lg font-bold tracking-wide">
                        {partner.telephone}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                        copied ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Convênio #{partner.id.toUpperCase().replace(/_/g, '')}
                      </span>
                    </div>
                    <p className={`text-xs truncate ${copied ? 'text-blue-100' : 'text-slate-500'}`}>
                      {partner.name} • {partner.city}
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase shrink-0 self-end sm:self-center bg-slate-100/80 group-hover:bg-slate-200/80 px-3 py-1.5 rounded-lg transition-colors">
                    {copied ? (
                      <>
                        <Check className="h-4 w-4 text-white" />
                        <span className="text-white">Copiado!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 text-slate-500 group-hover:text-slate-700 transition-colors" />
                        <span className="text-slate-700">Copiar Dados</span>
                      </>
                    )}
                  </div>
                </button>
                <p className="text-[10px] sm:text-[11px] text-slate-400 mt-2.5 text-center">
                  Clique acima para copiar instantaneamente o nome, localização, telefone e número do convênio.
                </p>

                {/* Beautiful Instagram access button requested by user */}
                {partner.website && (
                  <div className="mt-4 pt-4 border-t border-slate-200/50">
                    <a
                      href={partner.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full p-3 rounded-xl border border-pink-500/15 bg-gradient-to-r from-pink-500/5 to-purple-500/5 hover:from-pink-500/10 hover:to-purple-500/10 text-pink-600 hover:text-pink-700 flex items-center justify-center gap-2 font-bold text-xs sm:text-sm tracking-wide transition-all cursor-pointer group"
                    >
                      <Instagram className="h-4 w-4 shrink-0 text-pink-500 group-hover:scale-110 transition-transform" />
                      <span>Acessar Instagram</span>
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 text-slate-400" />
                    </a>
                  </div>
                )}
              </div>

              {/* Quick instructions banner */}
              <div className="flex items-start gap-2.5 p-4 rounded-xl bg-blue-50/50 border border-blue-100 text-xs text-slate-600 leading-relaxed">
                <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                <span>
                  <strong>Como funciona?</strong> Apresente este desconto na unidade ou use os canais oficiais fornecidos acima para ativar sua parceria imediatamente. Não é necessário login.
                </span>
              </div>
            </div>

            {/* Right Column: Materials to Download */}
            <div className="lg:col-span-7 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-red-500" />
                <span>Materiais de Apoio para Divulgação</span>
              </h3>

              <div className="bg-slate-50 border border-dashed border-slate-200 rounded-2xl p-6 sm:p-8 text-center flex flex-col items-center justify-center min-h-[250px] sm:min-h-[300px]">
                <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center mb-4">
                  <Sparkles className="h-6 w-6 text-blue-500" />
                </div>
                <h4 className="text-base font-bold text-slate-800 tracking-tight">
                  Materiais sendo adicionados
                </h4>
                <p className="mt-2 text-xs sm:text-sm text-slate-500 max-w-sm mx-auto leading-relaxed">
                  Os materiais oficiais de marketing e divulgação estão sendo adicionados para este parceiro. Em breve você poderá personalizar e baixar artes prontas por aqui!
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* CUSTOMIZER DRAWER PANEL (nested beautifully for flawless flow) */}
        <AnimatePresence>
          {selectedMaterial && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 30 }}
              className="absolute inset-0 bg-slate-900/95 z-30 flex flex-col md:flex-row overflow-y-auto md:overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setSelectedMaterial(null)}
                className="absolute right-4 top-4 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition z-40 cursor-pointer"
                title="Voltar"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Left Canvas Preview inside Customizer */}
              <div className="w-full md:flex-1 shrink-0 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 md:overflow-auto">
                <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase mb-4 font-bold">
                  Gerador Automático de Peças Digitais
                </span>
                
                {/* Embedded SVG Templates */}
                <div className="relative shadow-2xl rounded-xl sm:rounded-2xl overflow-hidden border border-white/15 w-full max-w-[280px] min-[370px]:max-w-[320px] sm:max-w-[360px] md:max-w-[380px] aspect-square flex items-center justify-center">
                  
                  {/* Template: Post Desconto */}
                  {selectedMaterial.templateType === 'post_desconto' && (
                    <svg
                      id={`modal-svg-${selectedMaterial.id}`}
                      viewBox="0 0 1080 1080"
                      className="w-full h-full"
                      style={{ background: bgColor }}
                    >
                      <defs>
                        <pattern id="modal-grid" width="60" height="60" patternUnits="userSpaceOnUse">
                          <path d="M 60 0 L 0 0 0 60" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                        </pattern>
                      </defs>
                      <rect width="1080" height="1080" fill="url(#modal-grid)" />
                      <circle cx="540" cy="0" r="400" fill={accentColor} opacity="0.16" filter="blur(60px)" />
                      <line x1="80" y1="120" x2="1000" y2="120" stroke={accentColor} strokeWidth="8" strokeLinecap="round" />

                      <rect x="80" y="190" width="450" height="60" rx="30" fill="rgba(255, 255, 255, 0.08)" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
                      <circle cx="110" cy="220" r="14" fill={accentColor} />
                      <text x="140" y="228" fill="#f8fafc" fontSize="22" fontFamily="Inter, sans-serif" fontWeight="bold" letterSpacing="1.5">BENEFÍCIO PARCEIRO</text>

                      <text x="80" y="380" fill="#ffffff" fontSize="58" fontFamily="Inter, sans-serif" fontWeight="900" letterSpacing="-1">
                        {promoText.toUpperCase()}
                      </text>

                      <rect x="80" y="440" width="920" height="230" rx="24" fill={accentColor} />
                      <text x="120" y="575" fill="#ffffff" fontSize="48" fontFamily="Inter, sans-serif" fontWeight="900" letterSpacing="-0.5">
                        {benefitText}
                      </text>

                      <text x="80" y="780" fill="#94a3b8" fontSize="26" fontFamily="Inter, sans-serif" fontWeight="500">
                        Apresente seu cupom ou CPF parceiro para usufruir da redução de valores.
                      </text>

                      <rect x="0" y="910" width="1080" height="170" fill="rgba(255, 255, 255, 0.03)" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
                      
                      <text x="80" y="985" fill="#f8fafc" fontSize="34" fontFamily="Inter, sans-serif" fontWeight="800">
                        {partnerName.toUpperCase()}
                      </text>
                      <text x="80" y="1025" fill="#64748b" fontSize="20" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="1.5">
                        PARCEIRO REGULAMENTADO E AUTORIZADO
                      </text>

                      <text x="1000" y="985" fill="#ffffff" fontSize="34" fontFamily="Inter, sans-serif" fontWeight="800" textAnchor="end">
                        {phone}
                      </text>
                      <text x="1000" y="1025" fill={accentColor} fontSize="20" fontFamily="Inter, sans-serif" fontWeight="700" letterSpacing="1" textAnchor="end">
                        CONTATO DE SUPORTE DIRETO
                      </text>
                    </svg>
                  )}

                  {/* Template: Banner Convenio */}
                  {selectedMaterial.templateType === 'banner_convenio' && (
                    <svg
                      id={`modal-svg-${selectedMaterial.id}`}
                      viewBox="0 0 1920 1080"
                      className="w-full h-full"
                      style={{ background: bgColor }}
                    >
                      <rect width="1920" height="1080" fill="url(#modal-grid)" />
                      <circle cx="0" cy="540" r="700" fill={accentColor} opacity="0.18" filter="blur(80px)" />

                      <rect x="100" y="100" width="8" height="180" fill={accentColor} rx="4" />
                      <text x="130" y="130" fill={accentColor} fontSize="26" fontFamily="Inter, sans-serif" fontWeight="bold" letterSpacing="2">CLUB DE BENEFÍCIOS</text>
                      
                      <text x="130" y="210" fill="#ffffff" fontSize="72" fontFamily="Inter, sans-serif" fontWeight="900" letterSpacing="-1">
                        {promoText.toUpperCase()}
                      </text>
                      <text x="130" y="275" fill="#e2e8f0" fontSize="36" fontFamily="Inter, sans-serif" fontWeight="400">
                        {benefitText}
                      </text>

                      <g transform="translate(130, 370)">
                        <rect x="0" y="0" width="300" height="110" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                        <circle cx="60" cy="55" r="22" fill={accentColor} />
                        <text x="105" y="65" fill="#ffffff" fontSize="28" fontFamily="Inter, sans-serif" fontWeight="bold">PARCEIRO</text>

                        <rect x="340" y="0" width="300" height="110" rx="16" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5" />
                        <circle cx="400" cy="55" r="22" fill="#ffffff" opacity="0.15" />
                        <text x="445" y="65" fill="#ffffff" fontSize="28" fontFamily="Inter, sans-serif" fontWeight="bold">OFICIAL</text>
                      </g>

                      <line x1="130" y1="570" x2="1790" y2="570" stroke="rgba(255,255,255,0.08)" strokeWidth="2" />
                      
                      <text x="130" y="670" fill="#94a3b8" fontSize="32" fontFamily="Inter, sans-serif" fontWeight="500">
                        Atendimento prioritário em toda a rede nacional com descontos exclusivos aplicados na hora.
                      </text>

                      <rect x="100" y="820" width="1720" height="180" rx="24" fill={accentColor} />
                      
                      <text x="160" y="910" fill="#ffffff" fontSize="38" fontFamily="Inter, sans-serif" fontWeight="800">
                        {partnerName.toUpperCase()}
                      </text>
                      <text x="160" y="955" fill="rgba(255,255,255,0.8)" fontSize="22" fontFamily="Inter, sans-serif" fontWeight="600" letterSpacing="1.5">
                        PARCEIRO PREFERENCIAL CREDENCIADO
                      </text>

                      <text x="1760" y="910" fill="#ffffff" fontSize="42" fontFamily="Inter, sans-serif" fontWeight="900" textAnchor="end">
                        {phone}
                      </text>
                      <text x="1760" y="955" fill="rgba(255,255,255,0.9)" fontSize="20" fontFamily="Inter, sans-serif" fontWeight="700" letterSpacing="1" textAnchor="end">
                        DÚVIDAS OU INFORMAÇÕES? LIGUE AGORA
                      </text>
                    </svg>
                  )}

                  {/* Template: Post Informativo */}
                  {selectedMaterial.templateType === 'post_informativo' && (
                    <svg
                      id={`modal-svg-${selectedMaterial.id}`}
                      viewBox="0 0 1080 1080"
                      className="w-full h-full"
                      style={{ background: bgColor }}
                    >
                      <rect width="1080" height="1080" fill="url(#modal-grid)" />
                      <circle cx="900" cy="200" r="300" fill={accentColor} opacity="0.15" filter="blur(70px)" />
                      <rect x="50" y="50" width="980" height="980" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" rx="16" />

                      <text x="100" y="140" fill={accentColor} fontSize="24" fontFamily="Inter, sans-serif" fontWeight="bold" letterSpacing="2">
                        COMUNICADO IMPORTANTE
                      </text>

                      <text x="100" y="250" fill="#ffffff" fontSize="56" fontFamily="Inter, sans-serif" fontWeight="900" letterSpacing="-1">
                        {promoText.toUpperCase()}
                      </text>

                      <text x="100" y="320" fill="#94a3b8" fontSize="28" fontFamily="Inter, sans-serif" fontWeight="500">
                        {benefitText}
                      </text>

                      <g transform="translate(100, 420)">
                        <rect x="0" y="0" width="880" height="320" rx="20" fill="rgba(255,255,255,0.03)" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" />
                        <rect x="60" y="70" width="120" height="120" rx="16" fill="none" stroke={accentColor} strokeWidth="6" />
                        <line x1="60" y1="120" x2="180" y2="120" stroke={accentColor} strokeWidth="6" />
                        <circle cx="120" cy="160" r="12" fill={accentColor} />
                        
                        <text x="220" y="110" fill="#ffffff" fontSize="30" fontFamily="Inter, sans-serif" fontWeight="bold">Descontos Reais e Imediatos</text>
                        <text x="220" y="160" fill="#94a3b8" fontSize="22" fontFamily="Inter, sans-serif" fontWeight="400">Sem burocracia, direto no ato do pagamento.</text>
                        
                        <text x="220" y="225" fill="#ffffff" fontSize="30" fontFamily="Inter, sans-serif" fontWeight="bold">Ampla Cobertura Certificada</text>
                        <text x="220" y="275" fill="#94a3b8" fontSize="22" fontFamily="Inter, sans-serif" fontWeight="400">Ativação nacional em lojas e unidades conveniadas.</text>
                      </g>

                      <rect x="100" y="800" width="880" height="150" rx="18" fill={accentColor} />
                      <text x="160" y="885" fill="#ffffff" fontSize="34" fontFamily="Inter, sans-serif" fontWeight="bold">
                        {partnerName}
                      </text>
                      
                      <text x="920" y="885" fill="#ffffff" fontSize="38" fontFamily="Inter, sans-serif" fontWeight="900" textAnchor="end">
                        {phone}
                      </text>
                    </svg>
                  )}

                </div>
              </div>

              {/* Right Customizer control panel */}
              <div className="w-full md:w-[380px] bg-slate-950 border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-between p-5 sm:p-6 md:overflow-y-auto shrink-0 md:min-h-0">
                <div className="space-y-6">
                  {/* Title of Customizer */}
                  <div>
                    <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider block mb-1">
                      Painel de Customização
                    </span>
                    <h3 className="text-white text-lg font-bold">
                      Ajuste os Textos da Peça
                    </h3>
                  </div>

                  {/* Form fields */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Nome do Parceiro
                      </label>
                      <input
                        type="text"
                        value={partnerName}
                        onChange={(e) => setPartnerName(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white"
                        maxLength={32}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Telefone / Contato
                      </label>
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white"
                        maxLength={20}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Título da Chamada
                      </label>
                      <input
                        type="text"
                        value={promoText}
                        onChange={(e) => setPromoText(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white"
                        maxLength={40}
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        Subtítulo / Benefício
                      </label>
                      <input
                        type="text"
                        value={benefitText}
                        onChange={(e) => setBenefitText(e.target.value)}
                        className="w-full px-3 py-2 text-sm bg-white/5 border border-white/10 rounded-xl focus:outline-none focus:border-blue-500 text-white"
                        maxLength={48}
                      />
                    </div>

                    {/* Colors Choice */}
                    <div>
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                        Esquema de Cores do Material
                      </label>
                      <div className="grid grid-cols-5 gap-2">
                        {colorsList.map((color) => (
                          <button
                            key={color.name}
                            onClick={() => {
                              setAccentColor(color.primary);
                              setBgColor(color.bg);
                            }}
                            className={`h-9 rounded-lg relative border cursor-pointer transition ${
                              accentColor === color.primary 
                                ? 'border-white ring-2 ring-white/25' 
                                : 'border-white/10 hover:border-white/30'
                            }`}
                            style={{ backgroundColor: color.primary }}
                            title={color.name}
                          >
                            <div
                                className="absolute bottom-0.5 right-0.5 h-3 w-3 rounded-full border border-white/40"
                                style={{ backgroundColor: color.bg }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Download Actions */}
                <div className="pt-6 border-t border-white/10 space-y-3 mt-6">
                  {downloadSuccess && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-blue-950/80 border border-blue-500/30 text-blue-400 p-3 rounded-xl text-center text-xs font-semibold flex items-center justify-center gap-2"
                    >
                      <CheckCircle className="h-4 w-4" />
                      <span>Peça salva no seu computador!</span>
                    </motion.div>
                  )}

                  <button
                    onClick={() => handleDownload('png')}
                    disabled={downloading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 py-3 text-xs font-bold text-white cursor-pointer transition disabled:opacity-50 shadow-sm"
                  >
                    <Download className="h-4 w-4" />
                    {downloading ? 'Gerando PNG...' : 'Baixar Imagem PNG'}
                  </button>

                  <button
                    onClick={() => handleDownload('svg')}
                    disabled={downloading}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 hover:bg-white/15 py-2.5 text-xs font-semibold text-white cursor-pointer border border-white/15 transition disabled:opacity-50"
                  >
                    <Sparkles className="h-4 w-4 text-red-500" />
                    Baixar Vetor SVG Editável
                  </button>

                  <button
                    onClick={() => setSelectedMaterial(null)}
                    className="w-full text-slate-400 hover:text-white transition text-xs text-center font-medium py-1 cursor-pointer"
                  >
                    Voltar para Detalhes do Parceiro
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </div>
  );
};
