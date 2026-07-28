import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Cross, 
  Plus, 
  CheckSquare, 
  Square, 
  Clock, 
  User, 
  Calendar, 
  ArrowLeft, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  Activity,
  Play,
  ShieldCheck,
  ChevronRight,
  Filter,
  RefreshCw,
  Trash2,
  Eye,
  Users,
  Lock,
  MapPin,
  ExternalLink,
  Search,
  Compass,
  Camera,
  MessageSquare,
  X,
  Image as ImageIcon
} from 'lucide-react';

function cleanFirestoreObject<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(cleanFirestoreObject) as unknown as T;
  } else if (obj !== null && typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanFirestoreObject(val);
      }
    }
    return cleaned as T;
  }
  return obj;
}
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  doc, 
  onSnapshot, 
  query, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { SpellCheckInput, SpellCheckTextarea } from './SpellCheckField';

const GOOGLE_MAPS_API_KEY =
  process.env.GOOGLE_MAPS_PLATFORM_KEY ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidMapsKey = Boolean(GOOGLE_MAPS_API_KEY) && GOOGLE_MAPS_API_KEY !== 'YOUR_API_KEY';

export const CHECKLIST_ITEMS = [
  'Ocorrência recebida',
  'Saída da base',
  'Chegada ao local do óbito',
  'Corpo removido',
  'Chegada à sala de preparação',
  'Preparação concluída',
  'Ornamentação concluída',
  'Saída para o local do velório',
  'Chegada ao local do velório',
  'Velório montado',
  'Nota de falecimento realizada',
  'Saída para o cortejo',
  'Sepultamento realizado',
  'Materiais recolhidos',
  'Retorno à base',
  'Serviço encerrado',
];

export interface ChecklistItemData {
  id: string;
  label: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  completedLocation?: string;
  completedLat?: number;
  completedLng?: number;
  observations?: string;
  photoUrl?: string;
}

export interface FunerariaOS {
  id: string;
  osNumber: string;
  seqNumber: number;
  status: 'Em Andamento' | 'Finalizada' | 'Serviço Encerrado';
  responsavelName: string;
  responsavelEmail: string;
  responsavelUid: string;
  createdAtISO: string;
  dateFormatted: string;
  timeFormatted: string;
  checklist: ChecklistItemData[];
  updatedAtISO?: string;
  updatedDateFormatted?: string;
  updatedTimeFormatted?: string;
  serviceAddress?: string;
  serviceLocationName?: string;
  serviceLat?: number;
  serviceLng?: number;
}

const fetchAddressFromCoordinates = async (lat: number, lng: number): Promise<string | null> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
      {
        signal: controller.signal,
        headers: {
          'Accept-Language': 'pt-BR,pt;q=0.9'
        }
      }
    );
    clearTimeout(timeoutId);
    if (!response.ok) return null;
    const data = await response.json();
    if (data && data.address) {
      const addr = data.address;
      const road = addr.road || addr.pedestrian || addr.street || addr.avenue || addr.square || addr.suburb || addr.neighbourhood;
      const houseNumber = addr.house_number ? `, ${addr.house_number}` : '';
      const city = addr.city || addr.town || addr.municipality || addr.village;
      if (road) {
        return city ? `${road}${houseNumber} - ${city}` : `${road}${houseNumber}`;
      }
      if (data.display_name) {
        const parts = data.display_name.split(',').map((s: string) => s.trim());
        return parts.slice(0, 2).join(', ');
      }
    }
  } catch (err) {
    console.warn("Reverse geocode error:", err);
  }
  return null;
};

const compressImageToDataUrl = (file: File): Promise<string> => {
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

const getLocationText = (item: ChecklistItemData, os?: FunerariaOS): string => {
  if (item.completedLocation && !item.completedLocation.startsWith('http')) {
    return item.completedLocation;
  }
  if (os?.serviceLocationName) {
    return os.serviceLocationName;
  }
  if (os?.serviceAddress && !os.serviceAddress.startsWith('http')) {
    return os.serviceAddress;
  }
  if (typeof item.completedLat === 'number' && typeof item.completedLng === 'number') {
    return `Localização GPS (${item.completedLat.toFixed(3)}, ${item.completedLng.toFixed(3)})`;
  }
  if (typeof os?.serviceLat === 'number' && typeof os?.serviceLng === 'number') {
    return `Localização GPS (${os.serviceLat.toFixed(3)}, ${os.serviceLng.toFixed(3)})`;
  }
  return 'Google Maps';
};

const getLocationHref = (item: ChecklistItemData, os?: FunerariaOS): string => {
  if (typeof item.completedLat === 'number' && typeof item.completedLng === 'number') {
    return `https://www.google.com/maps?q=${item.completedLat},${item.completedLng}`;
  }
  if (typeof os?.serviceLat === 'number' && typeof os?.serviceLng === 'number') {
    return `https://www.google.com/maps?q=${os.serviceLat},${os.serviceLng}`;
  }
  if (item.completedLocation && item.completedLocation.startsWith('http')) {
    return item.completedLocation;
  }
  const query = os?.serviceLocationName || os?.serviceAddress || item.completedLocation || '';
  if (query) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
  return 'https://maps.google.com';
};

export const FunerariaSection: React.FC = () => {
  const { user, profile } = useAuth();

  // Navigation state: 'list' | 'new' | 'detail' | 'track'
  const [view, setView] = useState<'list' | 'new' | 'detail' | 'track'>('list');
  const [selectedOsId, setSelectedOsId] = useState<string | null>(null);

  // Sub-tab filter in list view: 'em_andamento' | 'todas' | 'finalizadas'
  const [listTab, setListTab] = useState<'em_andamento' | 'todas' | 'finalizadas'>('em_andamento');

  // Firestore sync state
  const [orders, setOrders] = useState<FunerariaOS[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // New OS form state
  const [isCreating, setIsCreating] = useState(false);
  const [currentRealTimeDate, setCurrentRealTimeDate] = useState<string>('');
  const [currentRealTimeClock, setCurrentRealTimeClock] = useState<string>('');

  // Toast / Feedback message
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  // Delete modal state
  const [osToDelete, setOsToDelete] = useState<{ id: string; osNumber: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // GPS permission / modal trigger state
  const [gpsModalInfo, setGpsModalInfo] = useState<{
    isOpen: boolean;
    osId: string;
    itemId: string;
    itemLabel: string;
  } | null>(null);
  const [isCapturingModalGps, setIsCapturingModalGps] = useState(false);

  // Checklist Item completion / observation modal state
  const [checkitemModal, setCheckitemModal] = useState<{
    isOpen: boolean;
    osId: string;
    itemId: string;
    itemLabel: string;
    isCompleted: boolean;
    observations: string;
    photoUrl: string;
    isSaving: boolean;
    isReadOnly?: boolean;
    completedBy?: string;
    completedAt?: string;
  } | null>(null);

  const [previewPhotoModal, setPreviewPhotoModal] = useState<string | null>(null);

  // Live timer for "Nova Ordem de Serviço" screen
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentRealTimeDate(now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }));
      setCurrentRealTimeClock(now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync OS list from Firestore
  useEffect(() => {
    setLoadingOrders(true);
    const osRef = collection(db, 'funeraria_os');
    const q = query(osRef, orderBy('createdAtISO', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: FunerariaOS[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            osNumber: data.osNumber || 'OS-000000',
            seqNumber: data.seqNumber || 0,
            status: data.status || 'Em Andamento',
            responsavelName: data.responsavelName || 'Agente Funerário',
            responsavelEmail: data.responsavelEmail || '',
            responsavelUid: data.responsavelUid || '',
            createdAtISO: data.createdAtISO || new Date().toISOString(),
            dateFormatted: data.dateFormatted || '',
            timeFormatted: data.timeFormatted || '',
            checklist: Array.isArray(data.checklist) 
              ? data.checklist.map((c: any) => ({
                  id: c.id || '',
                  label: c.label || '',
                  completed: Boolean(c.completed),
                  completedAt: c.completedAt || '',
                  completedBy: c.completedBy || '',
                  completedLocation: c.completedLocation || '',
                  completedLat: typeof c.completedLat === 'number' ? c.completedLat : undefined,
                  completedLng: typeof c.completedLng === 'number' ? c.completedLng : undefined,
                  observations: c.observations || undefined,
                  photoUrl: c.photoUrl || undefined,
                })) 
              : [],
            updatedAtISO: data.updatedAtISO,
            updatedDateFormatted: data.updatedDateFormatted || data.dateFormatted || '',
            updatedTimeFormatted: data.updatedTimeFormatted || data.timeFormatted || '',
            serviceAddress: data.serviceAddress || '',
            serviceLocationName: data.serviceLocationName || '',
            serviceLat: typeof data.serviceLat === 'number' ? data.serviceLat : undefined,
            serviceLng: typeof data.serviceLng === 'number' ? data.serviceLng : undefined
          };
        });
        setOrders(list);
        setLoadingOrders(false);
      },
      (error) => {
        console.error("Erro ao carregar ordens de serviço:", error);
        setLoadingOrders(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const showToast = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 3000);
  };

  // Logged in agent display name
  const loggedInAgentName = (
    profile?.name || 
    user?.displayName || 
    (user?.email ? user.email.split('@')[0] : 'Agente Funerário')
  ).trim();

  // Handle "Iniciar Ordem de Serviço" creation
  const handleStartNewOS = async () => {
    if (isCreating) return;
    setIsCreating(true);

    try {
      // 1. Compute next sequential OS number (e.g. OS-000001)
      const osRef = collection(db, 'funeraria_os');
      const snapshot = await getDocs(osRef);
      let maxSeq = 0;
      snapshot.docs.forEach((d) => {
        const val = d.data()?.seqNumber;
        if (typeof val === 'number' && val > maxSeq) {
          maxSeq = val;
        }
      });

      const nextSeq = maxSeq + 1;
      const osNumber = `OS-${String(nextSeq).padStart(6, '0')}`;

      const now = new Date();
      const dateFormatted = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeFormatted = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      // Build initial checklist items (16 items)
      const initialChecklist: ChecklistItemData[] = CHECKLIST_ITEMS.map((label, index) => ({
        id: `item-${index + 1}`,
        label,
        completed: false,
        completedAt: '',
        completedBy: ''
      }));

      const newOsData = {
        osNumber,
        seqNumber: nextSeq,
        status: 'Em Andamento' as const,
        responsavelName: loggedInAgentName,
        responsavelEmail: profile?.email || user?.email || '',
        responsavelUid: profile?.uid || user?.uid || 'guest',
        createdAtISO: now.toISOString(),
        dateFormatted,
        timeFormatted,
        checklist: initialChecklist,
        updatedAtISO: now.toISOString(),
        updatedDateFormatted: dateFormatted,
        updatedTimeFormatted: timeFormatted
      };

      const docRef = await addDoc(osRef, newOsData);

      showToast(`Ordem de Serviço ${osNumber} iniciada com sucesso!`);
      setSelectedOsId(docRef.id);
      setView('detail');
    } catch (err) {
      console.error("Erro ao criar Ordem de Serviço:", err);
      alert("Ocorreu um erro ao criar a Ordem de Serviço. Por favor, tente novamente.");
    } finally {
      setIsCreating(false);
    }
  };

  // Open observation / completion modal for a checklist item
  const openCheckitemModal = (osId: string, itemId: string, isReadOnly: boolean = false) => {
    const currentOS = orders.find((o) => o.id === osId);
    if (!currentOS) return;
    const item = currentOS.checklist.find((i) => i.id === itemId);
    if (!item) return;

    setCheckitemModal({
      isOpen: true,
      osId,
      itemId,
      itemLabel: item.label,
      isCompleted: !!item.completed,
      observations: item.observations || '',
      photoUrl: item.photoUrl || '',
      isSaving: false,
      isReadOnly,
      completedBy: item.completedBy || currentOS.responsavelName || 'Agente Funerário',
      completedAt: item.completedAt || currentOS.timeFormatted
    });
  };

  const handleSaveItemObservationsOnly = async () => {
    if (!checkitemModal) return;
    const { osId, itemId, observations, photoUrl } = checkitemModal;
    const currentOS = orders.find((o) => o.id === osId);
    if (!currentOS) return;

    setCheckitemModal((prev) => (prev ? { ...prev, isSaving: true } : null));

    const updatedChecklist = currentOS.checklist.map((item) => {
      if (item.id === itemId) {
        const newItem: any = { ...item };
        if (observations.trim()) {
          newItem.observations = observations.trim();
        } else {
          delete newItem.observations;
        }
        if (photoUrl) {
          newItem.photoUrl = photoUrl;
        } else {
          delete newItem.photoUrl;
        }
        return newItem;
      }
      return item;
    });

    try {
      const osDocRef = doc(db, 'funeraria_os', osId);
      await updateDoc(osDocRef, cleanFirestoreObject({ checklist: updatedChecklist }));
      showToast("Observações atualizadas com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar observações:", err);
      showToast("Erro ao salvar observações.");
    } finally {
      setCheckitemModal(null);
    }
  };

  // Toggle checklist item status and save automatically to Firestore (with GPS & Google Maps location recording)
  const handleToggleCheckitem = async (osId: string, itemId: string, customObs?: string, customPhoto?: string) => {
    const currentOS = orders.find((o) => o.id === osId);
    if (!currentOS) return;

    const targetItem = currentOS.checklist.find((i) => i.id === itemId);
    const wasCompleted = targetItem?.completed || false;

    const now = new Date();
    const timeShortStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

    // Attempt automatic GPS capture when marking item as completed
    let gpsSuccess = false;
    let gpsCoords: { lat?: number; lng?: number; mapsUrl?: string } = {};
    if (!wasCompleted) {
      try {
        gpsCoords = await new Promise((resolve) => {
          if (!navigator.geolocation) {
            resolve({});
            return;
          }
          const timer = setTimeout(() => resolve({}), 1800);
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              clearTimeout(timer);
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              gpsSuccess = true;
              resolve({
                lat,
                lng,
                mapsUrl: `https://www.google.com/maps?q=${lat},${lng}`
              });
            },
            (err) => {
              clearTimeout(timer);
              console.warn("Aviso na captura do GPS:", err);
              resolve({});
            },
            { timeout: 1800, enableHighAccuracy: true }
          );
        });
      } catch (e) {
        console.warn("Exceção no GPS:", e);
      }
    }

    const finalLat = gpsCoords.lat ?? currentOS.serviceLat;
    const finalLng = gpsCoords.lng ?? currentOS.serviceLng;

    let reverseGeoStreet: string | null = null;
    if (typeof finalLat === 'number' && typeof finalLng === 'number') {
      reverseGeoStreet = await fetchAddressFromCoordinates(finalLat, finalLng);
    }

    const readableLocationStr = 
      currentOS.serviceLocationName 
      || (currentOS.serviceAddress && !currentOS.serviceAddress.startsWith('http') ? currentOS.serviceAddress : '')
      || reverseGeoStreet
      || (finalLat && finalLng ? `Localização GPS (${finalLat.toFixed(3)}, ${finalLng.toFixed(3)})` : gpsCoords.mapsUrl || '');

    const updatedChecklist = currentOS.checklist.map((item) => {
      if (item.id === itemId) {
        const newCompleted = !item.completed;
        const newItem: any = {
          ...item,
          completed: newCompleted,
          completedAt: newCompleted ? timeShortStr : '',
          completedBy: newCompleted ? (loggedInAgentName || 'Agente') : '',
          completedLocation: newCompleted ? (readableLocationStr || '') : ''
        };

        if (newCompleted) {
          if (customObs && customObs.trim()) {
            newItem.observations = customObs.trim();
          } else if (item.observations) {
            newItem.observations = item.observations;
          }
          if (customPhoto) {
            newItem.photoUrl = customPhoto;
          } else if (item.photoUrl) {
            newItem.photoUrl = item.photoUrl;
          }
        } else {
          delete newItem.observations;
          delete newItem.photoUrl;
        }

        if (newCompleted && typeof finalLat === 'number' && !isNaN(finalLat)) {
          newItem.completedLat = finalLat;
        } else {
          delete newItem.completedLat;
        }

        if (newCompleted && typeof finalLng === 'number' && !isNaN(finalLng)) {
          newItem.completedLng = finalLng;
        } else {
          delete newItem.completedLng;
        }

        return newItem;
      }
      return item;
    });

    const sanitizedChecklist = cleanFirestoreObject(updatedChecklist);

    // Determine status: If the item "Serviço encerrado" is marked completed -> "Finalizada"
    const isServiceFinishedChecked = sanitizedChecklist.find((i: any) => i.label === 'Serviço encerrado')?.completed || false;
    const newStatus: 'Em Andamento' | 'Finalizada' = isServiceFinishedChecked ? 'Finalizada' : 'Em Andamento';

    try {
      const osDocRef = doc(db, 'funeraria_os', osId);
      const updateDataRaw: any = {
        checklist: sanitizedChecklist,
        status: newStatus,
        responsavelName: loggedInAgentName || 'Agente',
        responsavelEmail: profile?.email || user?.email || '',
        responsavelUid: profile?.uid || user?.uid || 'guest',
        updatedAtISO: now.toISOString(),
        updatedDateFormatted: dateStr,
        updatedTimeFormatted: timeShortStr
      };

      // Auto-set service coordinates if not already present
      if (typeof gpsCoords.lat === 'number' && typeof gpsCoords.lng === 'number' && !currentOS.serviceLat) {
        updateDataRaw.serviceLat = gpsCoords.lat;
        updateDataRaw.serviceLng = gpsCoords.lng;
        if (!currentOS.serviceAddress && gpsCoords.mapsUrl) {
          updateDataRaw.serviceAddress = gpsCoords.mapsUrl;
        }
      }

      const updateData = cleanFirestoreObject(updateDataRaw);

      await updateDoc(osDocRef, updateData);

      if (wasCompleted) {
        if ((currentOS.status === 'Finalizada' || currentOS.status === 'Serviço Encerrado') && newStatus === 'Em Andamento') {
          showToast("Etapa desmarcada! Ordem de Serviço reaberta como Em Andamento.");
        } else {
          showToast(`Etapa "${targetItem?.label}" desmarcada!`);
        }
      } else {
        if (isServiceFinishedChecked) {
          showToast("Serviço Encerrado! Ordem de Serviço alterada para Finalizada.");
        } else {
          if (gpsSuccess) {
            showToast(`Etapa "${targetItem?.label}" concluída com GPS registrado!`);
          } else {
            showToast(`Etapa "${targetItem?.label}" concluída!`);
            // Prompt popup for GPS permission/loading if not captured automatically
            setGpsModalInfo({
              isOpen: true,
              osId,
              itemId,
              itemLabel: targetItem?.label || 'Etapa'
            });
          }
        }
      }
    } catch (err) {
      console.error("Erro ao atualizar checklist:", err);
      showToast("Erro ao salvar etapa. Tente novamente.");
    }
  };

  const handleModalLoadGps = async () => {
    if (!gpsModalInfo) return;
    if (!navigator.geolocation) {
      showToast("Seu dispositivo ou navegador não suporta GPS.");
      setGpsModalInfo(null);
      return;
    }
    setIsCapturingModalGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;

        const currentOS = orders.find((o) => o.id === gpsModalInfo.osId);
        const reverseGeoStreet = await fetchAddressFromCoordinates(lat, lng);

        const readableLocationStr = 
          reverseGeoStreet
          || currentOS?.serviceLocationName 
          || (currentOS?.serviceAddress && !currentOS.serviceAddress.startsWith('http') ? currentOS.serviceAddress : '')
          || `Localização GPS (${lat.toFixed(3)}, ${lng.toFixed(3)})`;

        setIsCapturingModalGps(false);
        if (currentOS) {
          const updatedChecklist = currentOS.checklist.map((item) => {
            if (item.id === gpsModalInfo.itemId) {
              return {
                ...item,
                completedLocation: readableLocationStr,
                completedLat: lat,
                completedLng: lng
              };
            }
            return item;
          });
          const sanitizedChecklist = cleanFirestoreObject(updatedChecklist);
          try {
            const osDocRef = doc(db, 'funeraria_os', gpsModalInfo.osId);
            await updateDoc(osDocRef, cleanFirestoreObject({
              checklist: sanitizedChecklist,
              serviceLat: currentOS.serviceLat || lat,
              serviceLng: currentOS.serviceLng || lng,
              serviceAddress: currentOS.serviceAddress || reverseGeoStreet || `https://www.google.com/maps?q=${lat},${lng}`
            }));
            showToast(`Localização registrada: ${readableLocationStr}`);
          } catch (e) {
            console.error("Erro ao vincular GPS:", e);
            showToast("Não foi possível atualizar o GPS na etapa.");
          }
        }
        setGpsModalInfo(null);
      },
      (err) => {
        setIsCapturingModalGps(false);
        console.error("Erro ao capturar GPS:", err);
        showToast("Não foi possível acessar o GPS. Verifique se o acesso à localização está permitido no seu navegador.");
      },
      { enableHighAccuracy: true, timeout: 6000 }
    );
  };

  // Save address for OS in Google Maps
  const handleSaveOsAddress = async (
    osId: string,
    address: string,
    locationName?: string,
    lat?: number,
    lng?: number
  ) => {
    try {
      const now = new Date();
      const timeShortStr = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      const dateStr = now.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' });

      const osDocRef = doc(db, 'funeraria_os', osId);
      const updatePayload: any = {
        serviceAddress: address,
        serviceLocationName: locationName || '',
        updatedAtISO: now.toISOString(),
        updatedDateFormatted: dateStr,
        updatedTimeFormatted: timeShortStr
      };
      if (typeof lat === 'number') updatePayload.serviceLat = lat;
      if (typeof lng === 'number') updatePayload.serviceLng = lng;

      await updateDoc(osDocRef, updatePayload);
      showToast("Endereço do atendimento salvo no Google Maps!");
    } catch (err) {
      console.error("Erro ao salvar endereço:", err);
      showToast("Erro ao salvar endereço do atendimento.");
    }
  };

  // Request delete (opens confirmation popup modal)
  const handleDeleteOS = (osId: string, osNumber: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setOsToDelete({ id: osId, osNumber });
  };

  // Execute delete after confirmation
  const executeDeleteOS = async () => {
    if (!osToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDoc(doc(db, 'funeraria_os', osToDelete.id));
      if (selectedOsId === osToDelete.id) {
        setSelectedOsId(null);
        setView('list');
      }
      showToast(`Ordem de Serviço ${osToDelete.osNumber} excluída com sucesso!`);
      setOsToDelete(null);
    } catch (err) {
      console.error("Erro ao excluir Ordem de Serviço:", err);
      showToast("Erro ao excluir a Ordem de Serviço. Tente novamente.");
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedOS = orders.find((o) => o.id === selectedOsId);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {feedbackMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-4 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl border border-purple-500/40 flex items-center gap-3 text-xs font-semibold"
          >
            <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />
            <span>{feedbackMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Popup Modal */}
      <AnimatePresence>
        {osToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-100 text-center relative overflow-hidden"
            >
              <div className="h-14 w-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
                <AlertCircle className="h-7 w-7" />
              </div>

              <h3 className="text-xl font-black text-slate-900 mb-2">
                Tem certeza que deseja excluir?
              </h3>

              <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
                Você está prestes a excluir permanentemente a <strong className="text-slate-900 font-bold">Ordem de Serviço {osToDelete.osNumber}</strong>. Se você clicar em <strong>"Não"</strong>, voltará sem alterar nada.
              </p>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setOsToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-2xl border border-slate-200 font-bold text-xs text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  Não, voltar
                </button>

                <button
                  onClick={executeDeleteOS}
                  disabled={isDeleting}
                  className="flex-1 py-3 px-4 rounded-2xl font-bold text-xs text-white bg-rose-600 hover:bg-rose-700 shadow-md shadow-rose-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-4 w-4" />
                      <span>Sim, excluir</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Main Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-slate-900 to-slate-900 rounded-3xl p-6 sm:p-10 text-white border border-slate-800 shadow-2xl mb-8">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold uppercase tracking-wider">
              <span className="text-base">⚰️</span>
              <span>Módulo Operacional</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <span>Gestão Funerária</span>
            </h1>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
              Gerencie ordens de serviço, acompanhe atendimentos, registre etapas operacionais e monitore as ocorrências funerárias da equipe.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400">
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <ShieldCheck className="h-3.5 w-3.5 text-purple-400" />
                Bahia Prev Operations
              </span>
              <span className="flex items-center gap-1 bg-slate-800/80 px-2.5 py-1 rounded-lg border border-slate-700/60">
                <User className="h-3.5 w-3.5 text-blue-400" />
                Agente: <strong className="text-white ml-0.5">{loggedInAgentName}</strong>
              </span>
            </div>
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row md:flex-col items-stretch sm:items-center gap-3 w-full md:w-auto">
            {view === 'list' && (
              <button
                onClick={() => setView('new')}
                className="px-6 py-3.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-sm rounded-2xl shadow-lg shadow-purple-600/25 border border-purple-400/30 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="h-5 w-5" />
                <span>Nova Ordem de Serviço</span>
              </button>
            )}

            {view !== 'list' && (
              <button
                onClick={() => setView('list')}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para Lista de OS</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* VIEW 1: NEW ORDER FORM ("Nova Ordem de Serviço") */}
      {view === 'new' && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-10 shadow-sm max-w-3xl mx-auto"
        >
          <div className="flex items-center gap-3 pb-6 border-b border-slate-100 mb-6">
            <button
              onClick={() => setView('list')}
              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors cursor-pointer"
              title="Voltar"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 text-[11px] font-bold border border-purple-100 mb-1">
                <FileText className="h-3 w-3" />
                <span>Nova Ocorrência</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Nova Ordem de Serviço
              </h2>
            </div>
          </div>

          <div className="space-y-5">
            {/* Responsavel Field */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Responsável Atual
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {loggedInAgentName}
                  </span>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold rounded-lg shrink-0">
                Preenchido Automático
              </span>
            </div>

            {/* Date and Time Fields Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Data de Abertura
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {currentRealTimeDate || 'Carregando data...'}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Hora de Abertura
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {currentRealTimeClock || 'Carregando hora...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Info Callout */}
            <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-100 text-xs text-purple-900 flex items-start gap-3">
              <AlertCircle className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                Ao iniciar, o sistema gerará automaticamente o número sequencial da Ordem de Serviço (ex: <strong>OS-000001</strong>), salvará no banco de dados com status <strong>"Em Andamento"</strong> e abrirá o checklist operacional.
              </p>
            </div>

            {/* CTA Button "Iniciar Ordem de Serviço" */}
            <div className="pt-4">
              <button
                onClick={handleStartNewOS}
                disabled={isCreating}
                className="w-full py-4 px-6 bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-700 hover:from-purple-500 hover:to-indigo-600 text-white font-bold text-base rounded-2xl shadow-xl shadow-purple-600/20 border border-purple-400/30 flex items-center justify-center gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] cursor-pointer disabled:opacity-50"
              >
                {isCreating ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Iniciando Ordem de Serviço...</span>
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 fill-current" />
                    <span>Iniciar Ordem de Serviço</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW 2: OS DETAIL & CHECKLIST ("Página da Ordem de Serviço") */}
      {view === 'detail' && selectedOS && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 max-w-4xl mx-auto"
        >
          {/* Top Bar Navigation */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <button
              onClick={() => setView('list')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Lista de Ordens</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('track')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                title="Acompanhar Atendimento (Painel do Gerente Funerário)"
              >
                <Eye className="h-4 w-4" />
                <span>Acompanhar Ordem</span>
              </button>

              <button
                onClick={(e) => handleDeleteOS(selectedOS.id, selectedOS.osNumber, e)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                title="Excluir esta Ordem de Serviço"
              >
                <Trash2 className="h-4 w-4 text-rose-600" />
                <span>Excluir Ordem</span>
              </button>
            </div>
          </div>

          {/* OS Main Info Card */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold text-purple-600 bg-purple-50 border border-purple-200 px-2.5 py-0.5 rounded-full">
                    Ordem de Serviço Registrada
                  </span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {selectedOS.osNumber}
                </h2>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                {selectedOS.status === 'Serviço Encerrado' ? (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-sm">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                    Serviço Encerrado
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs shadow-sm">
                    <Activity className="h-4 w-4 text-amber-600 animate-pulse" />
                    Em Andamento
                  </span>
                )}
              </div>
            </div>

            {/* Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                  <User className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Responsável Atual
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedOS.responsavelName}
                  </span>
                </div>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                    Data e Hora de Criação
                  </span>
                  <span className="text-sm font-bold text-slate-900">
                    {selectedOS.dateFormatted} às {selectedOS.timeFormatted}
                  </span>
                </div>
              </div>
            </div>

            {/* Checklist Completion Progress Bar */}
            {(() => {
              const total = selectedOS.checklist.length;
              const completedCount = selectedOS.checklist.filter(i => i.completed).length;
              const pct = total > 0 ? Math.round((completedCount / total) * 100) : 0;

              return (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span className="flex items-center gap-1.5">
                      <CheckSquare className="h-4 w-4 text-purple-600" />
                      Progresso das Etapas
                    </span>
                    <span className="text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-200">
                      {completedCount} de {total} concluídos ({pct}%)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden border border-slate-200/80">
                    <div 
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 h-full transition-all duration-500 rounded-full"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })()}
          </div>

          {/* CHECKLIST OPERACIONAL SECTION */}
          <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm">
            <div className="mb-6">
              <h3 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-purple-600" />
                <span>Checklist Operacional</span>
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Marque ou desmarque cada etapa conforme o andamento do atendimento. Se houver alguma marcação incorreta, basta clicar novamente na etapa para desmarcá-la. As alterações e localizações GPS são salvas automaticamente no banco de dados.
              </p>
            </div>

            {/* 16 Checklist Items Grid */}
            <div className="divide-y divide-slate-100 border border-slate-200/80 rounded-2xl overflow-hidden bg-white">
              {selectedOS.checklist.map((item, idx) => {
                const isLastItem = item.label === 'Serviço encerrado';
                return (
                  <div
                    key={item.id}
                    onClick={() => openCheckitemModal(selectedOS.id, item.id)}
                    title={item.completed ? "Clique para ver ou editar observações desta etapa" : "Clique para registrar observações e concluir esta etapa"}
                    className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors cursor-pointer select-none ${
                      item.completed 
                        ? 'bg-purple-50/40 hover:bg-purple-100/60' 
                        : 'hover:bg-slate-50/80 bg-white'
                    } ${isLastItem ? 'bg-amber-50/30' : ''}`}
                  >
                    <div className="flex items-start gap-3.5 min-w-0 flex-1">
                      <div className="shrink-0 mt-0.5">
                        {item.completed ? (
                          <div className="h-6 w-6 rounded-lg bg-purple-600 text-white flex items-center justify-center shadow-sm">
                            <CheckSquare className="h-4 w-4" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-lg border-2 border-slate-300 text-slate-300 hover:border-purple-400 flex items-center justify-center">
                            <Square className="h-4 w-4 opacity-0" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <span className={`text-sm font-bold block ${
                          item.completed ? 'text-slate-900 line-through text-slate-500' : 'text-slate-800'
                        } ${isLastItem ? 'text-purple-950 font-black' : ''}`}>
                          <span className="text-slate-400 font-semibold mr-2">{idx + 1}.</span>
                          {item.label}
                        </span>

                        {/* Display Observations & Photo if present */}
                        {item.completed && (item.observations || item.photoUrl) && (
                          <div className="mt-2 p-2.5 bg-purple-50/80 border border-purple-100 rounded-xl space-y-1.5 text-xs text-slate-700">
                            {item.observations && (
                              <div className="flex items-start gap-1.5">
                                <MessageSquare className="h-3.5 w-3.5 text-purple-600 shrink-0 mt-0.5" />
                                <p className="whitespace-pre-wrap leading-relaxed text-slate-800 font-medium">{item.observations}</p>
                              </div>
                            )}
                            {item.photoUrl && (
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setPreviewPhotoModal(item.photoUrl!);
                                  }}
                                  className="group relative rounded-lg overflow-hidden border border-purple-200 shadow-xs hover:ring-2 hover:ring-purple-400 transition-all cursor-pointer"
                                >
                                  <img src={item.photoUrl} alt="Foto da etapa" className="h-12 w-16 object-cover" />
                                  <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                    <Eye className="h-3.5 w-3.5" />
                                  </div>
                                </button>
                                <span className="text-[11px] font-semibold text-purple-800 flex items-center gap-1">
                                  <Camera className="h-3 w-3" />
                                  Foto anexada
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                      {item.completed && (item.completedLocation || (item.completedLat && item.completedLng) || selectedOS.serviceAddress) && (
                        <a
                          href={getLocationHref(item, selectedOS)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md transition-colors cursor-pointer max-w-[180px] sm:max-w-[260px]"
                          title="Abrir no Google Maps a localização onde esta etapa foi concluída"
                        >
                          <MapPin className="h-3 w-3 text-indigo-600 shrink-0" />
                          <span className="truncate">{getLocationText(item, selectedOS)}</span>
                          <ExternalLink className="h-2.5 w-2.5 opacity-70 shrink-0" />
                        </a>
                      )}
                      {item.completed && item.completedAt && (
                        <span className="text-[10px] font-bold text-purple-700 bg-purple-100/80 px-2 py-0.5 rounded-md border border-purple-200">
                          {item.completedAt}
                        </span>
                      )}
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-xl border ${
                        item.completed
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}>
                        {item.completed ? 'Concluído' : 'Pendente'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-6 p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-500 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                Sincronização em tempo real via Firestore ativada.
              </span>
              <span className="font-bold text-slate-700">Bahia Prev Hub</span>
            </div>
          </div>
        </motion.div>
      )}

      {/* VIEW 3: ACOMPANHAR OS (PAINEL DO GERENTE FUNERÁRIO) */}
      {view === 'track' && selectedOS && (() => {
        const totalSteps = selectedOS.checklist.length;
        const completedItems = selectedOS.checklist.filter(i => i.completed);
        const completedCount = completedItems.length;
        const pct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0;
        const isFinished = selectedOS.status === 'Finalizada' || selectedOS.status === 'Serviço Encerrado';

        // Extract list of all agents who worked on this OS
        const agentsMap = new Map<string, { count: number; lastTime?: string }>();
        
        // Initial opening agent
        if (selectedOS.responsavelName) {
          agentsMap.set(selectedOS.responsavelName, { count: 0, lastTime: selectedOS.timeFormatted });
        }

        selectedOS.checklist.forEach(item => {
          if (item.completed) {
            const agentName = item.completedBy || selectedOS.responsavelName || 'Agente Registrado';
            const current = agentsMap.get(agentName) || { count: 0, lastTime: item.completedAt };
            agentsMap.set(agentName, {
              count: current.count + 1,
              lastTime: item.completedAt || current.lastTime
            });
          }
        });

        const involvedAgentsList = Array.from(agentsMap.entries()).map(([name, data]) => ({
          name,
          stepsCount: data.count,
          lastTime: data.lastTime
        }));

        // Current stage logic
        const nextPendingIndex = selectedOS.checklist.findIndex(i => !i.completed);
        const lastCompletedItem = completedItems.length > 0 ? completedItems[completedItems.length - 1] : null;
        const currentActiveStep = nextPendingIndex !== -1 ? selectedOS.checklist[nextPendingIndex] : null;

        return (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6 max-w-4xl mx-auto"
          >
            {/* Top Bar Navigation */}
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <button
                onClick={() => setView('list')}
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar para Lista</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setView('detail')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Checklist Operacional</span>
                </button>

                <button
                  onClick={(e) => handleDeleteOS(selectedOS.id, selectedOS.osNumber, e)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl shadow-sm transition-colors cursor-pointer"
                  title="Excluir esta Ordem de Serviço"
                >
                  <Trash2 className="h-4 w-4 text-rose-600" />
                  <span>Excluir</span>
                </button>
              </div>
            </div>

            {/* Manager Tracking Header Banner */}
            <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-purple-950 rounded-3xl p-6 sm:p-8 text-white border border-indigo-800/60 shadow-xl relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-indigo-800/60 pb-6">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 text-xs font-bold mb-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-indigo-400" />
                    <span>Acompanhamento Gerencial (Apenas Leitura)</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                    {selectedOS.osNumber}
                  </h2>
                </div>

                <div>
                  {isFinished ? (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 font-bold text-xs">
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      Atendimento Finalizado
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-400/40 font-bold text-xs">
                      <Activity className="h-4 w-4 text-amber-400 animate-pulse" />
                      Em Andamento
                    </span>
                  )}
                </div>
              </div>

              {/* Etapa Atual Highlight Card */}
              <div className="mt-6 p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/15 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <span className="text-xs font-bold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-amber-400" />
                    Etapa Atual em Execução
                  </span>
                  <span className="text-xs font-mono text-indigo-200 bg-indigo-900/60 border border-indigo-500/30 px-2.5 py-0.5 rounded-full">
                    {currentActiveStep ? `Etapa ${nextPendingIndex + 1} de ${totalSteps}` : 'Todas Etapas Concluídas'}
                  </span>
                </div>

                <div className="text-base sm:text-lg font-black text-white">
                  {currentActiveStep ? currentActiveStep.label : 'Serviço Concluído na Íntegra 🎉'}
                </div>

                {lastCompletedItem && (
                  <p className="text-xs text-indigo-200 border-t border-white/10 pt-2.5 mt-1 flex items-center gap-1.5 flex-wrap">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>Última etapa concluída: <strong>{lastCompletedItem.label}</strong></span>
                    {lastCompletedItem.completedAt && (
                      <span className="text-indigo-300 font-mono">({lastCompletedItem.completedAt})</span>
                    )}
                    {lastCompletedItem.completedBy && (
                      <span className="text-emerald-300 font-semibold">— por {lastCompletedItem.completedBy}</span>
                    )}
                  </p>
                )}
              </div>

              {/* Progress Summary inside Banner */}
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-bold mb-2">
                  <span className="text-indigo-200 flex items-center gap-1.5">
                    <Activity className="h-4 w-4 text-indigo-400" />
                    Progresso Geral do Checklist Operacional
                  </span>
                  <span className="text-white font-mono text-sm">{completedCount} de {totalSteps} ({pct}%)</span>
                </div>
                <div className="w-full h-3 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/60 p-0.5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      isFinished 
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400' 
                        : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-400'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Grid 1: Agentes & Continuidade do Atendimento */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Users className="h-5 w-5 text-indigo-600" />
                    <span>Equipe de Agentes e Continuidade</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Relação dos agentes funerários que iniciaram e deram andamento a este atendimento.
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold text-xs rounded-full">
                  {involvedAgentsList.length} {involvedAgentsList.length === 1 ? 'Agente' : 'Agentes'} Envolvidos
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {involvedAgentsList.map((ag, idx) => {
                  const isOpener = ag.name === selectedOS.responsavelName;
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 font-bold">
                          <User className="h-5 w-5" />
                        </div>
                        <div className="min-w-0">
                          <span className="text-xs font-bold text-slate-900 block truncate" title={ag.name}>
                            {ag.name}
                          </span>
                          <span className="text-[10px] text-slate-500 block">
                            {ag.stepsCount > 0 ? `${ag.stepsCount} ${ag.stepsCount === 1 ? 'etapa marcada' : 'etapas marcadas'}` : 'Iniciou a OS'}
                          </span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                        <span className="text-slate-400 font-semibold uppercase text-[9px]">Função / Status:</span>
                        <span className="font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
                          {isOpener ? 'Responsável Atual' : 'Colaborador'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 flex items-center gap-3">
                  <Calendar className="h-5 w-5 text-purple-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-purple-400 block">
                      Abertura da OS
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {selectedOS.dateFormatted} às {selectedOS.timeFormatted}
                    </span>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 flex items-center gap-3">
                  <Clock className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 block">
                      Última Modificação Registrada
                    </span>
                    <span className="text-xs font-bold text-slate-900">
                      {selectedOS.updatedDateFormatted || selectedOS.dateFormatted} às {selectedOS.updatedTimeFormatted || selectedOS.timeFormatted}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Grid 2: Linha do Tempo e Checklist Detalhado com Horários e Agentes */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-indigo-600" />
                  <span>Auditoria e Linha do Tempo do Checklist</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-wider bg-indigo-100 text-indigo-800 border border-indigo-300 px-2.5 py-0.5 rounded-full ml-auto sm:ml-2">
                    Apenas Leitura
                  </span>
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Painel de acompanhamento: apenas visualização do progresso, ocorrências registradas pelos agentes, horários e localizações GPS.
                </p>
              </div>

              {/* Destaque para Ocorrências Registradas pelos Agentes */}
              {(() => {
                const itemsWithOccurrences = selectedOS.checklist.filter(i => i.observations && i.observations.trim() !== '');
                if (itemsWithOccurrences.length === 0) return null;

                return (
                  <div className="bg-amber-50/90 border border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 w-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-extrabold text-amber-950">
                          Ocorrências Registradas pelos Agentes ({itemsWithOccurrences.length})
                        </h4>
                        <p className="text-[11px] text-amber-800">
                          Resumo de todas as observações e apontamentos inseridos durante as etapas do checklist
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2.5 pt-1">
                      {itemsWithOccurrences.map((item) => (
                        <div 
                          key={item.id} 
                          onClick={() => openCheckitemModal(selectedOS.id, item.id, true)}
                          className="bg-white border border-amber-200/90 rounded-xl p-3 text-xs shadow-2xs hover:border-amber-400 hover:shadow-xs cursor-pointer transition-all"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-bold text-slate-900 flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-full bg-amber-500 inline-block shrink-0" />
                              <span>{item.label}</span>
                            </span>
                            <span className="text-[10px] font-extrabold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md shrink-0">
                              {item.completedAt || selectedOS.timeFormatted}
                            </span>
                          </div>
                          <p className="text-slate-800 font-medium whitespace-pre-wrap pl-3 border-l-2 border-amber-500 text-xs leading-relaxed">
                            {item.observations}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}

              <div className="space-y-3">
                {selectedOS.checklist.map((item, index) => {
                  const agentWhoCompleted = item.completedBy || selectedOS.responsavelName || 'Agente Funerário';
                  const isLastItem = index === selectedOS.checklist.length - 1;

                  return (
                    <div
                      key={item.id}
                      onClick={() => openCheckitemModal(selectedOS.id, item.id, true)}
                      title="Clique para visualizar detalhes e ocorrências desta etapa"
                      className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-indigo-300 hover:shadow-xs ${
                        item.completed 
                          ? 'bg-purple-50/40 border-purple-200/80 hover:bg-purple-100/50' 
                          : 'bg-slate-50/60 border-slate-200/70 hover:bg-slate-100/80'
                      } ${isLastItem && item.completed ? 'bg-amber-50/50 border-amber-200' : ''}`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <div className="shrink-0 mt-0.5">
                          {item.completed ? (
                            <div className="h-8 w-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-sm">
                              <CheckCircle2 className="h-5 w-5" />
                            </div>
                          ) : (
                            <div className="h-8 w-8 rounded-xl bg-white border border-slate-300 text-slate-400 flex items-center justify-center">
                              <Square className="h-5 w-5" />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1 space-y-1">
                          <span className={`text-xs sm:text-sm font-bold block ${
                            item.completed ? 'text-slate-900' : 'text-slate-600'
                          }`}>
                            {index + 1}. {item.label}
                          </span>
                          
                          {item.completed && (
                            <span className="text-[11px] text-purple-700 font-semibold flex items-center gap-1.5 flex-wrap">
                              <User className="h-3 w-3" />
                              <span>Concluído por: <strong>{agentWhoCompleted}</strong></span>
                              {(item.completedLocation || (item.completedLat && item.completedLng) || selectedOS.serviceAddress) && (
                                <a
                                  href={getLocationHref(item, selectedOS)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 px-2 py-0.5 rounded-md ml-1 transition-colors cursor-pointer max-w-[200px] sm:max-w-[320px]"
                                  title="Abrir localização no Google Maps"
                                >
                                  <MapPin className="h-3 w-3 text-indigo-600 shrink-0" />
                                  <span className="truncate">{getLocationText(item, selectedOS)}</span>
                                  <ExternalLink className="h-2.5 w-2.5 opacity-70 shrink-0" />
                                </a>
                              )}
                            </span>
                          )}

                          {!item.completed && !item.observations && (
                            <span className="text-[10px] text-slate-400 font-medium block mt-0.5">
                              Etapa pendente na sequência de atendimento
                            </span>
                          )}

                          {/* Observations & Photos in Timeline */}
                          {(item.observations || item.photoUrl) && (
                            <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-200/80 rounded-xl space-y-1.5 text-xs text-slate-700 shadow-2xs">
                              <div className="flex items-center gap-1.5 text-[11px] font-extrabold text-amber-900">
                                <MessageSquare className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                                <span>Ocorrência Registrada pelo Agente:</span>
                              </div>
                              {item.observations && (
                                <p className="whitespace-pre-wrap leading-relaxed text-slate-800 font-medium pl-5">{item.observations}</p>
                              )}
                              {item.photoUrl && (
                                <div className="flex items-center gap-2 pt-1 pl-5">
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setPreviewPhotoModal(item.photoUrl!);
                                    }}
                                    className="group relative rounded-lg overflow-hidden border border-amber-300 shadow-xs hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer"
                                  >
                                    <img src={item.photoUrl} alt="Foto da etapa" className="h-12 w-16 object-cover" />
                                    <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                                      <Eye className="h-3.5 w-3.5" />
                                    </div>
                                  </button>
                                  <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1">
                                    <Camera className="h-3 w-3" />
                                    Foto anexada (clique para expandir)
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2 self-end sm:self-center">
                        {item.completed ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-xs shadow-xs" title="Etapa concluída">
                            <Clock className="h-3.5 w-3.5 text-emerald-600" />
                            <span>{item.completedAt || selectedOS.timeFormatted}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-slate-200/70 text-slate-600 font-semibold text-[11px]">
                            Pendente
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        );
      })()}

      {/* VIEW 4: ORDERS LIST / OVERVIEW ("Ordens em Andamento" & Filter tabs) */}
      {view === 'list' && (
        <div className="space-y-6">
          {/* Bar with Sub-Tabs for Filtering */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Activity className="h-5 w-5 text-purple-600" />
                <span>Gestão de Ordens de Serviço</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Acompanhamento em tempo real das ocorrências da equipe funerária
              </p>
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200/80 self-start sm:self-auto overflow-x-auto max-w-full">
              <button
                onClick={() => setListTab('em_andamento')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  listTab === 'em_andamento'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <Activity className="h-3.5 w-3.5" />
                <span>Ordens em Andamento</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  listTab === 'em_andamento' ? 'bg-purple-700 text-purple-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {orders.filter(o => o.status === 'Em Andamento').length}
                </span>
              </button>

              <button
                onClick={() => setListTab('finalizadas')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  listTab === 'finalizadas'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Finalizadas</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  listTab === 'finalizadas' ? 'bg-emerald-700 text-emerald-100' : 'bg-slate-200 text-slate-700'
                }`}>
                  {orders.filter(o => o.status === 'Finalizada' || o.status === 'Serviço Encerrado').length}
                </span>
              </button>

              <button
                onClick={() => setListTab('todas')}
                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-2 transition-all cursor-pointer whitespace-nowrap ${
                  listTab === 'todas'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Todas</span>
                <span className={`px-1.5 py-0.2 rounded-md text-[10px] ${
                  listTab === 'todas' ? 'bg-slate-900 text-slate-200' : 'bg-slate-200 text-slate-700'
                }`}>
                  {orders.length}
                </span>
              </button>
            </div>
          </div>

          {/* Loading state */}
          {loadingOrders ? (
            <div className="bg-white border border-slate-200/80 rounded-3xl p-12 text-center">
              <RefreshCw className="h-8 w-8 text-purple-600 animate-spin mx-auto mb-3" />
              <p className="text-sm font-bold text-slate-700">Carregando ordens de serviço...</p>
            </div>
          ) : (() => {
            const filteredOrders = orders.filter(os => {
              if (listTab === 'em_andamento') return os.status === 'Em Andamento';
              if (listTab === 'finalizadas') return os.status === 'Finalizada' || os.status === 'Serviço Encerrado';
              return true;
            });

            if (filteredOrders.length === 0) {
              return (
                /* Empty State */
                <div className="bg-white border border-slate-200/80 rounded-3xl p-10 sm:p-14 text-center max-w-xl mx-auto shadow-sm">
                  <div className="h-16 w-16 rounded-3xl bg-purple-100 text-purple-600 flex items-center justify-center mx-auto mb-4">
                    <Cross className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {listTab === 'em_andamento' && 'Nenhuma Ordem em Andamento'}
                    {listTab === 'finalizadas' && 'Nenhuma Ordem Finalizada'}
                    {listTab === 'todas' && 'Nenhuma Ordem de Serviço registrada'}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
                    {listTab === 'em_andamento' 
                      ? 'No momento não existem ordens de serviço com atendimento ativo. Clique em "Nova Ordem de Serviço" para iniciar um novo atendimento.'
                      : 'Utilize o botão "Nova Ordem de Serviço" no topo da página para iniciar a primeira ocorrência.'}
                  </p>
                </div>
              );
            }

            return (
              /* Grid of Service Orders */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredOrders.map((os) => {
                  const totalChecklist = os.checklist.length;
                  const completedItems = os.checklist.filter(i => i.completed);
                  const completedCount = completedItems.length;
                  const pct = totalChecklist > 0 ? Math.round((completedCount / totalChecklist) * 100) : 0;
                  const isFinished = os.status === 'Finalizada' || os.status === 'Serviço Encerrado';

                  // Last completed step label & next pending active step
                  const lastCompletedStepLabel = completedCount > 0 
                    ? completedItems[completedCount - 1].label 
                    : 'Nenhuma etapa concluída ainda';

                  const nextPendingStep = os.checklist.find(i => !i.completed);
                  const activeStageLabel = isFinished 
                    ? 'Finalizado' 
                    : nextPendingStep 
                      ? nextPendingStep.label 
                      : 'Todas concluídas';

                  const lastUpdateDate = os.updatedDateFormatted || os.dateFormatted;
                  const lastUpdateTime = os.updatedTimeFormatted || os.timeFormatted;

                  return (
                    <motion.div
                      key={os.id}
                      whileHover={{ y: -2 }}
                      className="bg-white border border-slate-200/80 hover:border-purple-300 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
                    >
                      <div>
                        {/* OS Top Header */}
                        <div className="flex items-center justify-between gap-2 mb-3">
                          <span className="text-lg font-black text-slate-900 group-hover:text-purple-600 transition-colors">
                            {os.osNumber}
                          </span>

                          {isFinished ? (
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-bold text-[11px] inline-flex items-center gap-1">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              Finalizada
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold text-[11px] inline-flex items-center gap-1">
                              <Activity className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
                              Em Andamento
                            </span>
                          )}
                        </div>

                        {/* Info lines */}
                        <div className="space-y-2.5 text-xs text-slate-600 mb-4 bg-slate-50/80 p-3.5 rounded-2xl border border-slate-100">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Responsável Atual:</span>
                            <span className="font-bold text-slate-900 truncate">
                              {os.responsavelName}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2 border-t border-slate-200/60 pt-2">
                            <span className="text-amber-700 font-bold uppercase text-[10px] shrink-0">Etapa Atual:</span>
                            <span className="font-extrabold text-amber-800 text-right truncate max-w-[170px]" title={activeStageLabel}>
                              {activeStageLabel}
                            </span>
                          </div>

                          <div className="flex items-center justify-between gap-2 border-t border-slate-200/60 pt-2">
                            <span className="text-slate-400 font-bold uppercase text-[10px]">Última Atualização:</span>
                            <span className="font-bold text-slate-800">
                              {lastUpdateDate} às {lastUpdateTime}
                            </span>
                          </div>

                          <div className="flex items-start justify-between gap-2 border-t border-slate-200/60 pt-2">
                            <span className="text-slate-400 font-bold uppercase text-[10px] shrink-0">Última Concluída:</span>
                            <span className="font-medium text-slate-700 text-right truncate max-w-[170px]" title={lastCompletedStepLabel}>
                              {lastCompletedStepLabel}
                            </span>
                          </div>
                        </div>

                        {/* Progress bar */}
                        <div className="pt-2">
                          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1.5">
                            <span>Etapas Concluídas</span>
                            <span className="text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 text-[11px]">
                              {completedCount} de {totalChecklist} ({pct}%)
                            </span>
                          </div>
                          <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200/80">
                            <div 
                              className={`h-full transition-all duration-300 rounded-full ${
                                isFinished ? 'bg-emerald-600' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {/* CTA Buttons: Preencher/Continuar, Acompanhar, Excluir */}
                      <div className="mt-6 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedOsId(os.id);
                            setView('detail');
                          }}
                          className={`flex-1 py-2.5 px-3 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm ${
                            isFinished
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200'
                              : 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-600/20 hover:shadow-md'
                          }`}
                        >
                          <span>Checklist Operacional</span>
                          <ChevronRight className="h-4 w-4" />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedOsId(os.id);
                            setView('track');
                          }}
                          className="flex-1 py-2.5 px-3 font-bold text-xs rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          title="Acompanhar Atendimento (Painel Gerencial)"
                        >
                          <Eye className="h-4 w-4 text-indigo-600 shrink-0" />
                          <span>Acompanhar</span>
                        </button>

                        <button
                          onClick={(e) => handleDeleteOS(os.id, os.osNumber, e)}
                          className="p-2.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200/80 hover:border-rose-200 rounded-xl transition-all cursor-pointer shrink-0 flex items-center justify-center"
                          title="Excluir esta Ordem de Serviço"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            );
          })()}
        </div>
      )}

      {/* MODAL PERMISSÃO / REGISTRO GPS */}
      {gpsModalInfo?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-slate-100 text-center space-y-5">
            <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Compass className={`h-7 w-7 ${isCapturingModalGps ? 'animate-spin' : ''}`} />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-bold text-slate-900">
                Permissão de Localização GPS
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A etapa <strong className="text-indigo-600">"{gpsModalInfo.itemLabel}"</strong> foi salva com sucesso, mas a sua localização GPS atual não pôde ser obtida automaticamente.
              </p>
              <p className="text-[11px] text-slate-500">
                Deseja permitir a localização no seu navegador para vincular o mapa exato a esta etapa?
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleModalLoadGps}
                disabled={isCapturingModalGps}
                className="w-full sm:w-auto flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <MapPin className="h-4 w-4" />
                <span>{isCapturingModalGps ? 'Obtendo GPS...' : 'Carregar Localização GPS'}</span>
              </button>

              <button
                type="button"
                onClick={() => setGpsModalInfo(null)}
                disabled={isCapturingModalGps}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Manter Apenas Horário
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONCLUIR / EDITAR OBSERVAÇÕES DA ETAPA DO CHECKLIST */}
      {checkitemModal?.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                  checkitemModal.isReadOnly 
                    ? 'bg-indigo-100 text-indigo-700'
                    : (checkitemModal.isCompleted ? 'bg-purple-100 text-purple-700' : 'bg-indigo-100 text-indigo-700')
                }`}>
                  <CheckSquare className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>
                      {checkitemModal.isReadOnly 
                        ? 'Detalhes & Ocorrências da Etapa' 
                        : (checkitemModal.isCompleted ? 'Observações da Etapa' : 'Concluir Etapa')}
                    </span>
                    {checkitemModal.isReadOnly && (
                      <span className="text-[10px] uppercase font-extrabold bg-indigo-100 text-indigo-800 border border-indigo-200 px-2 py-0.5 rounded-md">
                        Apenas Leitura
                      </span>
                    )}
                  </h3>
                  <p className="text-xs font-semibold text-purple-800">
                    {checkitemModal.itemLabel}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setCheckitemModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {checkitemModal.isReadOnly ? (
              /* MODO APENAS LEITURA (ACOMPANHAMENTO DO GERENTE) */
              <div className="space-y-4">
                {/* Status bar */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-500 block font-semibold">Status do item:</span>
                    <span className={`font-bold ${checkitemModal.isCompleted ? 'text-emerald-700' : 'text-slate-600'}`}>
                      {checkitemModal.isCompleted ? '✓ Etapa Concluída' : '⏳ Etapa Pendente'}
                    </span>
                  </div>
                  {checkitemModal.isCompleted && (
                    <div className="text-right">
                      <span className="text-slate-500 block font-semibold">Agente responsável:</span>
                      <span className="font-bold text-slate-900">{checkitemModal.completedBy}</span>
                    </div>
                  )}
                </div>

                {/* Seção Ocorrências & Observações Registradas pelo Agente */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <MessageSquare className="h-4 w-4 text-amber-600" />
                    <span>Ocorrência / Observação Registrada pelo Agente:</span>
                  </label>

                  {checkitemModal.observations ? (
                    <div className="p-4 bg-amber-50/90 border border-amber-300 rounded-2xl space-y-1">
                      <p className="text-xs text-slate-900 font-medium leading-relaxed whitespace-pre-wrap">
                        {checkitemModal.observations}
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500 italic">
                      Nenhuma ocorrência ou observação foi registrada pelo agente nesta etapa.
                    </div>
                  )}
                </div>

                {/* Seção Fotos (se existir foto antiga) */}
                {checkitemModal.photoUrl && (
                  <div className="space-y-1.5">
                    <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="h-4 w-4 text-purple-600" />
                      <span>Foto Anexada:</span>
                    </label>

                    <div className="p-3 bg-purple-50/60 border border-purple-200 rounded-2xl flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img src={checkitemModal.photoUrl} alt="Foto da etapa" className="h-16 w-20 object-cover rounded-xl border border-purple-300 shadow-xs" />
                        <span className="text-xs font-bold text-purple-900">Foto registrada no atendimento</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPreviewPhotoModal(checkitemModal.photoUrl)}
                        className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Expandir</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Action buttons */}
                <div className="pt-3 border-t border-slate-100 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setCheckitemModal(null)}
                    className="w-full sm:w-auto px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Fechar Visualização
                  </button>
                </div>
              </div>
            ) : (
              /* MODO EDIÇÃO (PARA AGENTES) */
              <>
                {/* Observações (campo opcional) */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-800">
                    Observações (campo opcional)
                  </label>

                  {/* Badges com opções de preenchimento */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-200/70">
                    <span className="flex items-center gap-1 font-medium">📌 Ocorrências</span>
                    <span className="flex items-center gap-1 font-medium">⏳ Pendências</span>
                    <span className="flex items-center gap-1 font-medium">📝 Observações</span>
                  </div>

                  <SpellCheckTextarea
                    rows={4}
                    value={checkitemModal.observations}
                    onChangeValue={(val) => setCheckitemModal((prev) => prev ? { ...prev, observations: val } : null)}
                    placeholder="Digite ocorrências durante o atendimento, pendências, observações relevantes..."
                  />
                </div>

                {/* Modal Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setCheckitemModal(null)}
                    className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>

                  {checkitemModal.isCompleted ? (
                    <>
                      <button
                        type="button"
                        onClick={async () => {
                          const { osId, itemId } = checkitemModal;
                          setCheckitemModal(null);
                          await handleToggleCheckitem(osId, itemId);
                        }}
                        className="w-full sm:w-auto px-4 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                      >
                        Desmarcar Etapa
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveItemObservationsOnly}
                        disabled={checkitemModal.isSaving}
                        className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {checkitemModal.isSaving ? 'Salvando...' : 'Salvar Alterações'}
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={async () => {
                        const { osId, itemId, observations, photoUrl } = checkitemModal;
                        setCheckitemModal(null);
                        await handleToggleCheckitem(osId, itemId, observations, photoUrl);
                      }}
                      className="w-full sm:w-auto px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                      Confirmar e Concluir Etapa
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL FULLSCREEN PREVIEW DE FOTO */}
      {previewPhotoModal && (
        <div 
          onClick={() => setPreviewPhotoModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[90vh] p-2 bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => setPreviewPhotoModal(null)}
              className="absolute -top-3 -right-3 bg-rose-600 text-white p-1.5 rounded-full shadow-lg hover:bg-rose-700 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
            <img src={previewPhotoModal} alt="Foto expandida" className="max-h-[80vh] w-auto max-w-full rounded-xl object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
