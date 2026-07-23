import React, { useState, useEffect, useRef } from 'react';
import { playNotificationSound } from '../utils/sound';
import { useAuth } from './AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  deleteDoc, 
  serverTimestamp,
  getDocs
} from 'firebase/firestore';
import { 
  MessageSquare, 
  Heart, 
  Share2, 
  Send, 
  Megaphone, 
  Sparkles, 
  Image as ImageIcon, 
  Tag, 
  Trash2, 
  Clock, 
  User as UserIcon,
  CheckCircle2,
  TrendingUp,
  Pin,
  Lightbulb,
  PartyPopper,
  Handshake,
  Filter,
  Paperclip,
  FileText,
  X,
  Download,
  ExternalLink,
  File,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface Post {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: string;
  content: string;
  category: string;
  imageUrl?: string;
  attachmentUrl?: string;
  attachmentType?: 'image' | 'pdf' | 'doc' | 'file';
  attachmentName?: string;
  likesCount: number;
  likedBy: string[];
  commentsCount: number;
  isAnnouncement?: boolean;
  createdAt: any;
}

export interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: any;
}

const CATEGORIES = [
  { id: 'Todos', label: 'Todos os Posts', icon: Filter },
  { id: 'Comunicado', label: '📢 Comunicados', color: 'bg-red-50 text-red-700 border-red-200' },
];

export const FeedSection: React.FC = () => {
  const { user, profile } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [usersMap, setUsersMap] = useState<Record<string, { name?: string; avatarUrl?: string; role?: string }>>({});
  const knownPostIdsRef = useRef<Set<string> | null>(null);

  // Subscribe to real-time users collection for live profile updates
  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const map: Record<string, { name?: string; avatarUrl?: string; role?: string }> = {};
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        map[docSnap.id] = {
          name: data.name,
          avatarUrl: data.avatarUrl,
          role: data.role
        };
      });
      setUsersMap(map);
    }, (err) => {
      console.warn('Error fetching users map:', err);
    });
    return () => unsubUsers();
  }, []);

  const isCauan = profile?.email?.toLowerCase().includes('cauan') || profile?.name?.toLowerCase().includes('cauan');

  // Permission check: explicit canPostFeed property if defined in user profile, otherwise role-based fallback
  const canPublish = profile?.canPostFeed !== undefined
    ? Boolean(profile.canPostFeed)
    : (!isCauan && (
        profile?.role === 'Administrador' || 
        profile?.role === 'Diretor' || 
        profile?.role === 'Analista de Marketing' || 
        profile?.email === 'marketing@bahiaprev.com.br' || 
        profile?.email === 'lucasrodrigues@bahiaprev.com.br' || 
        profile?.email === 'jairoqueiroz@bahiaprev.com.br'
      ));

  // New post form state
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState('Geral');
  const [newImageUrl, setNewImageUrl] = useState('');
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{
    url: string;
    type: 'image' | 'pdf' | 'doc' | 'file';
    name: string;
    size?: string;
  } | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert("O arquivo selecionado excede 15MB. Por favor, escolha um arquivo menor.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawResult = event.target?.result as string;

      if (file.type.startsWith('image/')) {
        // Compress image using Canvas for fast load & Firestore compatibility
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 1200;

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
            const compressedUrl = canvas.toDataURL('image/jpeg', 0.82);
            const sizeKB = Math.round(compressedUrl.length / 1024);

            setSelectedAttachment({
              url: compressedUrl,
              type: 'image',
              name: file.name,
              size: sizeKB > 1024 ? `${(sizeKB / 1024).toFixed(1)} MB` : `${sizeKB} KB`
            });
          } else {
            setSelectedAttachment({
              url: rawResult,
              type: 'image',
              name: file.name,
              size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
            });
          }
          setShowUrlInput(false);
          setNewImageUrl('');
        };
        img.onerror = () => {
          setSelectedAttachment({
            url: rawResult,
            type: 'image',
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
          });
          setShowUrlInput(false);
          setNewImageUrl('');
        };
        img.src = rawResult;
      } else {
        let type: 'image' | 'pdf' | 'doc' | 'file' = 'file';
        if (file.type.includes('pdf') || file.name.toLowerCase().endsWith('.pdf')) {
          type = 'pdf';
        } else if (
          file.type.includes('word') || 
          file.name.toLowerCase().endsWith('.doc') || 
          file.name.toLowerCase().endsWith('.docx')
        ) {
          type = 'doc';
        }

        const sizeFormatted = (file.size / (1024 * 1024)).toFixed(1) + ' MB';

        setSelectedAttachment({
          url: rawResult,
          type,
          name: file.name,
          size: sizeFormatted
        });
        setShowUrlInput(false);
        setNewImageUrl('');
      }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Active comments toggles
  const [activeCommentsPostId, setActiveCommentsPostId] = useState<string | null>(null);
  const [commentsMap, setCommentsMap] = useState<Record<string, Comment[]>>({});
  const [commentInputMap, setCommentInputMap] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState(false);

  // Fetch real-time posts from Firestore
  useEffect(() => {
    const postsRef = collection(db, 'posts');
    const q = query(postsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(postsRef, async (snapshot) => {
      const fetchedPosts: Post[] = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Post[];

      // Clean up any old seed posts or requested test posts if present in Firestore
      for (const p of fetchedPosts) {
        if (
          p.authorUid?.startsWith('admin-seed-') || 
          p.content?.trim() === 'Teste' || 
          p.content?.trim() === 'Aviso importante'
        ) {
          deleteDoc(doc(db, 'posts', p.id)).catch(() => {});
        }
      }

      const realPosts = fetchedPosts.filter(p => 
        !p.authorUid?.startsWith('admin-seed-') && 
        p.content?.trim() !== 'Teste' && 
        p.content?.trim() !== 'Aviso importante'
      );

      // Real-time sound notification trigger for new posts or announcements
      if (knownPostIdsRef.current === null) {
        knownPostIdsRef.current = new Set(realPosts.map(p => p.id));
      } else {
        const newPosts = realPosts.filter(p => !knownPostIdsRef.current!.has(p.id));
        if (newPosts.length > 0) {
          const hasAnnouncement = newPosts.some(p => p.isAnnouncement || p.category === 'Comunicado');
          if (hasAnnouncement) {
            playNotificationSound('announcement');
          } else {
            playNotificationSound('post');
          }
        }
        knownPostIdsRef.current = new Set(realPosts.map(p => p.id));
      }

      setPosts(realPosts);
      setLoading(false);
    }, (error) => {
      console.error("Error loading feed posts:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Handle create post
  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canPublish) {
      alert("Seu perfil não possui permissão para publicar novas postagens no feed.");
      return;
    }
    if ((!newContent.trim() && !selectedAttachment && !newImageUrl.trim()) || !user || !profile) return;

    setPublishing(true);
    try {
      let finalImageUrl: string | null = null;
      let finalAttachmentUrl: string | null = null;
      let finalAttachmentType: 'image' | 'pdf' | 'doc' | 'file' | null = null;
      let finalAttachmentName: string | null = null;

      if (selectedAttachment) {
        if (selectedAttachment.type === 'image') {
          finalImageUrl = selectedAttachment.url;
        } else {
          finalAttachmentUrl = selectedAttachment.url;
          finalAttachmentType = selectedAttachment.type;
          finalAttachmentName = selectedAttachment.name;
        }
      } else if (newImageUrl.trim()) {
        const urlLower = newImageUrl.trim().toLowerCase();
        if (urlLower.endsWith('.pdf') || urlLower.startsWith('data:application/pdf')) {
          finalAttachmentUrl = newImageUrl.trim();
          finalAttachmentType = 'pdf';
          finalAttachmentName = 'Documento.pdf';
        } else {
          finalImageUrl = newImageUrl.trim();
        }
      }

      await addDoc(collection(db, 'posts'), {
        authorUid: user.uid,
        authorEmail: user.email || null,
        authorName: profile.name || 'Colaborador',
        authorRole: profile.role || 'Bahia Prev',
        content: newContent.trim(),
        category: newCategory,
        imageUrl: finalImageUrl,
        attachmentUrl: finalAttachmentUrl,
        attachmentType: finalAttachmentType,
        attachmentName: finalAttachmentName,
        likesCount: 0,
        likedBy: [],
        commentsCount: 0,
        isAnnouncement: newCategory === 'Comunicado',
        createdAt: serverTimestamp()
      });

      if (newCategory === 'Comunicado') {
        playNotificationSound('announcement');
      } else {
        playNotificationSound('post');
      }

      setNewContent('');
      setNewImageUrl('');
      setSelectedAttachment(null);
      setShowUrlInput(false);
      setNewCategory('Geral');
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setPublishing(false);
    }
  };

  // Handle Like/Unlike
  const handleToggleLike = async (post: Post) => {
    if (!user) return;
    const postRef = doc(db, 'posts', post.id);
    const hasLiked = post.likedBy?.includes(user.uid);

    try {
      if (hasLiked) {
        await updateDoc(postRef, {
          likedBy: arrayRemove(user.uid),
          likesCount: Math.max(0, (post.likesCount || 1) - 1)
        });
      } else {
        await updateDoc(postRef, {
          likedBy: arrayUnion(user.uid),
          likesCount: (post.likesCount || 0) + 1
        });
      }
    } catch (err) {
      console.error("Error toggling like:", err);
    }
  };

  // Handle Delete Post
  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
  };

  const confirmDeletePost = async () => {
    if (!postToDelete) return;
    setDeletingPostId(postToDelete);
    try {
      await deleteDoc(doc(db, 'posts', postToDelete));
      setPostToDelete(null);
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Erro ao excluir publicação. Tente novamente.");
    } finally {
      setDeletingPostId(null);
    }
  };

  // Toggle comments and fetch them
  const handleToggleComments = (postId: string) => {
    if (activeCommentsPostId === postId) {
      setActiveCommentsPostId(null);
      return;
    }

    setActiveCommentsPostId(postId);

    // Subscribe to comments subcollection
    const commentsRef = collection(db, 'posts', postId, 'comments');
    const q = query(commentsRef, orderBy('createdAt', 'asc'));

    onSnapshot(q, (snapshot) => {
      const fetchedComments = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      })) as Comment[];

      setCommentsMap(prev => ({ ...prev, [postId]: fetchedComments }));
    });
  };

  // Handle submit comment
  const handleAddComment = async (postId: string) => {
    const text = commentInputMap[postId]?.trim();
    if (!text || !user || !profile) return;

    setSubmittingComment(true);
    try {
      const commentsRef = collection(db, 'posts', postId, 'comments');
      await addDoc(commentsRef, {
        authorUid: user.uid,
        authorName: profile.name,
        authorRole: profile.role,
        content: text,
        createdAt: serverTimestamp()
      });

      // Update comments count on post
      const postRef = doc(db, 'posts', postId);
      const currentPost = posts.find(p => p.id === postId);
      await updateDoc(postRef, {
        commentsCount: (currentPost?.commentsCount || 0) + 1
      });

      setCommentInputMap(prev => ({ ...prev, [postId]: '' }));
    } catch (err) {
      console.error("Error adding comment:", err);
    } finally {
      setSubmittingComment(false);
    }
  };

  // Filter posts
  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'Todos') return true;
    return post.category === selectedCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left / Main Feed Column */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Create Post Card (Visible only to Publishers/Admins/Directors) */}
          {canPublish && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200/80 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                {profile?.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-10 w-10 rounded-full object-cover border-2 border-blue-500 shadow-sm shrink-0"
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-blue-600 to-red-500 text-white font-bold flex items-center justify-center text-sm shadow-sm shrink-0">
                    {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {profile?.name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {profile?.role} • Bahia Prev
                  </p>
                </div>
              </div>

              <form onSubmit={handleCreatePost} className="space-y-3">
                <textarea
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder={`No que você está pensando, ${profile?.name?.split(' ')[0]}? Compartilhe com a equipe...`}
                  rows={3}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                />

                {/* Hidden File Input for documents and images */}
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelected}
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
                  className="hidden"
                />

                {/* Selected File / Attachment Preview */}
                {selectedAttachment && (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                    <div className="flex items-center gap-3 min-w-0">
                      {selectedAttachment.type === 'image' ? (
                        <div className="h-12 w-12 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-200">
                          <img src={selectedAttachment.url} alt="Prévia" className="h-full w-full object-cover" />
                        </div>
                      ) : (
                        <div className={`p-2.5 rounded-lg shrink-0 ${
                          selectedAttachment.type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
                        }`}>
                          <FileText className="h-6 w-6" />
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{selectedAttachment.name}</p>
                        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                          ANEXO: {selectedAttachment.type.toUpperCase()} {selectedAttachment.size ? `• ${selectedAttachment.size}` : ''}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedAttachment(null)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                      title="Remover anexo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}

                {/* Optional Web URL Link Input */}
                {showUrlInput && !selectedAttachment && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={newImageUrl}
                        onChange={(e) => setNewImageUrl(e.target.value)}
                        placeholder="Cole a URL da imagem ou documento (ex: https://exemplo.com/arquivo.pdf)"
                        className="w-full p-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      {newImageUrl && (
                        <button
                          type="button"
                          onClick={() => setNewImageUrl('')}
                          className="p-2 text-slate-400 hover:text-red-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    {/* Category Selector */}
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded-lg border-0 focus:ring-2 focus:ring-blue-500/20 cursor-pointer"
                    >
                      <option value="Geral">📌 Geral</option>
                      <option value="Comunicado">📢 Comunicado</option>
                    </select>

                    {/* Button to attach file directly from PC */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200/60 shadow-sm"
                    >
                      <Paperclip className="h-4 w-4 text-blue-600" />
                      <span>Anexar documento</span>
                    </button>

                    {/* Secondary URL option */}
                    <button
                      type="button"
                      onClick={() => setShowUrlInput(!showUrlInput)}
                      className="text-[11px] font-semibold text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors flex items-center gap-1 cursor-pointer"
                      title="Cole um link direto"
                    >
                      <Upload className="h-3.5 w-3.5" />
                      <span>{showUrlInput ? 'Ocultar URL' : 'Colar Link'}</span>
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={publishing || (!newContent.trim() && !selectedAttachment && !newImageUrl.trim())}
                    className="px-5 py-2 rounded-xl font-bold text-xs text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                  >
                    {publishing ? (
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="h-3.5 w-3.5" />
                        <span>Publicar no Bahia Prev Hub</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}



          {/* Posts Feed Stream */}
          {loading ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/60">
              <div className="h-8 w-8 border-3 border-slate-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-slate-500 font-medium">Carregando feed do Bahia Prev Hub...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 text-center border border-slate-200/60">
              <Sparkles className="h-8 w-8 text-slate-300 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Nenhuma publicação nesta categoria</h4>
              <p className="text-xs text-slate-500 mt-1">Seja o primeiro a publicar usando a caixa acima!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post) => {
                const isLikedByMe = user ? post.likedBy?.includes(user.uid) : false;
                const canDelete = user && (
                  user.uid === post.authorUid || 
                  (post.authorEmail && user.email && post.authorEmail.toLowerCase() === user.email.toLowerCase()) ||
                  (post.authorName && profile?.name && post.authorName.toLowerCase().trim() === profile.name.toLowerCase().trim()) ||
                  user.email === 'marketing@bahiaprev.com.br' ||
                  user.email === 'lucasrodrigues@bahiaprev.com.br' ||
                  user.email === 'jairoqueiroz@bahiaprev.com.br' ||
                  profile?.role === 'Administrador' ||
                  profile?.role === 'Diretor' ||
                  profile?.role === 'Analista de Marketing'
                );
                
                const userProfile = usersMap[post.authorUid];
                const displayAuthorName = userProfile?.name || post.authorName || 'Colaborador';
                const displayAuthorRole = userProfile?.role || post.authorRole || 'Bahia Prev';
                const displayAuthorAvatar = userProfile?.avatarUrl;

                return (
                  <motion.div
                    key={post.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all ${
                      post.isAnnouncement 
                        ? 'border-red-200/80 bg-gradient-to-b from-red-50/20 to-white shadow-sm' 
                        : 'border-slate-200/80 shadow-sm hover:border-slate-300'
                    }`}
                  >
                    {/* Header line */}
                    <div className="flex items-start justify-between gap-3 mb-3.5">
                      <div className="flex items-center gap-3">
                        {displayAuthorAvatar ? (
                          <img 
                            src={displayAuthorAvatar} 
                            alt={displayAuthorName}
                            className="h-10 w-10 rounded-full object-cover border-2 border-slate-200 shrink-0 shadow-sm"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-slate-900 text-white font-bold flex items-center justify-center text-sm shrink-0 shadow-sm">
                            {displayAuthorName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 text-sm">{displayAuthorName}</span>
                            {post.isAnnouncement && (
                              <span className="inline-flex items-center gap-1 bg-red-100 text-red-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                                <Pin className="h-2.5 w-2.5" /> Oficial
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 flex items-center gap-1.5">
                            <span>{displayAuthorRole}</span>
                            <span>•</span>
                            <span className="text-slate-400">
                              {post.createdAt?.toDate ? post.createdAt.toDate().toLocaleDateString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Recente'}
                            </span>
                          </p>
                        </div>
                      </div>

                      {/* Category Tag & Actions */}
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200/50">
                          {post.category || 'Geral'}
                        </span>
                        {canDelete && (
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            title="Excluir publicação"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Text Content */}
                    <p className="text-slate-800 text-sm leading-relaxed whitespace-pre-wrap mb-4 font-normal">
                      {post.content}
                    </p>

                    {/* Attached Image or PDF/Document */}
                    {(() => {
                      const img = post.imageUrl || (post.attachmentType === 'image' ? post.attachmentUrl : null);
                      const isPdfOrDoc = (post.attachmentType && post.attachmentType !== 'image') || (
                        post.imageUrl && (post.imageUrl.toLowerCase().includes('.pdf') || post.imageUrl.startsWith('data:application/pdf'))
                      );
                      const docUrl = isPdfOrDoc ? (post.attachmentUrl || post.imageUrl) : null;
                      const docName = post.attachmentName || (
                        docUrl?.startsWith('data:application/pdf') ? 'Documento_Anexo.pdf' : 'Documento Anexo'
                      );

                      if (img && !isPdfOrDoc) {
                        return (
                          <div className="mb-4 rounded-2xl overflow-hidden border border-slate-200/80 bg-slate-900/95 flex items-center justify-center max-h-[480px] w-full shadow-inner">
                            <img 
                              src={img} 
                              alt="Anexo da publicação" 
                              className="max-h-[480px] w-auto max-w-full object-contain mx-auto transition-transform duration-200"
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          </div>
                        );
                      }

                      if (docUrl) {
                        return (
                          <div className="mb-4 p-3.5 rounded-xl border border-slate-200/90 bg-slate-50 flex items-center justify-between gap-3 hover:bg-slate-100/80 transition-colors shadow-sm">
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="p-3 rounded-lg bg-red-100 text-red-600 shrink-0 shadow-sm">
                                <FileText className="h-6 w-6" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-800 truncate">{docName}</p>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">
                                  DOCUMENTO ANEXO ({post.attachmentType?.toUpperCase() || 'PDF'})
                                </p>
                              </div>
                            </div>
                            <a
                              href={docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              download={docName}
                              className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
                            >
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Visualizar / Baixar</span>
                              <span className="sm:hidden">Baixar</span>
                            </a>
                          </div>
                        );
                      }

                      return null;
                    })()}

                    {/* Footer Actions (Like, Comment, Share) */}
                    <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs text-slate-600">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleToggleLike(post)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors cursor-pointer font-semibold ${
                            isLikedByMe 
                              ? 'text-red-600 bg-red-50' 
                              : 'text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          <Heart className={`h-4 w-4 ${isLikedByMe ? 'fill-red-600 text-red-600' : ''}`} />
                          <span>{post.likesCount || 0}</span>
                        </button>

                        <button
                          onClick={() => handleToggleComments(post.id)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer font-semibold"
                        >
                          <MessageSquare className="h-4 w-4 text-slate-500" />
                          <span>{post.commentsCount || 0} Comentários</span>
                        </button>
                      </div>

                      <span className="text-[11px] text-slate-400 hidden sm:inline">
                        Bahia Prev Internal Network
                      </span>
                    </div>

                    {/* Comments Expandable Section */}
                    <AnimatePresence>
                      {activeCommentsPostId === post.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-4 pt-4 border-t border-slate-100 space-y-3"
                        >
                          {/* List of comments */}
                          <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
                            {(!commentsMap[post.id] || commentsMap[post.id].length === 0) ? (
                              <p className="text-xs text-slate-400 italic py-1">Nenhum comentário ainda. Seja o primeiro a comentar!</p>
                            ) : (
                              commentsMap[post.id].map((c) => {
                                const cUser = usersMap[c.authorUid];
                                const cName = cUser?.name || c.authorName || 'Colaborador';
                                const cAvatar = cUser?.avatarUrl;
                                return (
                                  <div key={c.id} className="bg-slate-50 rounded-xl p-3 text-xs border border-slate-200/60 flex items-start gap-2.5">
                                    {cAvatar ? (
                                      <img src={cAvatar} alt={cName} className="h-7 w-7 rounded-full object-cover shrink-0 mt-0.5 border border-slate-200" />
                                    ) : (
                                      <div className="h-7 w-7 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                                        {cName.charAt(0).toUpperCase()}
                                      </div>
                                    )}
                                    <div className="flex-1">
                                      <div className="flex items-center justify-between mb-0.5">
                                        <span className="font-bold text-slate-900">{cName}</span>
                                        <span className="text-[10px] text-slate-400">{cUser?.role || c.authorRole}</span>
                                      </div>
                                      <p className="text-slate-700 leading-relaxed">{c.content}</p>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>

                          {/* Add comment input */}
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="text"
                              value={commentInputMap[post.id] || ''}
                              onChange={(e) => setCommentInputMap(prev => ({ ...prev, [post.id]: e.target.value }))}
                              onKeyDown={(e) => { if (e.key === 'Enter') handleAddComment(post.id); }}
                              placeholder="Escreva um comentário..."
                              className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              disabled={submittingComment || !commentInputMap[post.id]?.trim()}
                              className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-40 cursor-pointer"
                            >
                              <Send className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>

                  </motion.div>
                );
              })}
            </div>
          )}

        </div>

        {/* Right Sidebar Widgets */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* User Profile Card Widget */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm text-center">
            {profile?.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-16 w-16 rounded-full object-cover border-2 border-blue-500 shadow-md mx-auto mb-3"
              />
            ) : (
              <div className="h-16 w-16 rounded-full bg-slate-900 text-white font-black text-xl flex items-center justify-center mx-auto mb-3 shadow-md">
                {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
              </div>
            )}
            <h3 className="font-bold text-slate-900 text-base">{profile?.name}</h3>
            <p className="text-xs font-semibold text-blue-600 mb-3">{profile?.role}</p>
            <div className="pt-3 border-t border-slate-100 flex items-center justify-center gap-2 text-xs text-slate-500">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              <span>Sua conta está ativa no Bahia Prev Hub</span>
            </div>
          </div>

        </div>

      </div>

      {/* Modal de Confirmação de Exclusão de Post */}
      <AnimatePresence>
        {postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="flex items-center gap-3 text-red-600">
                <div className="p-3 bg-red-100 rounded-xl">
                  <Trash2 className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Excluir Publicação</h3>
                  <p className="text-xs text-slate-500">Esta ação não poderá ser desfeita</p>
                </div>
              </div>

              <p className="text-sm text-slate-600 leading-relaxed">
                Tem certeza de que deseja remover esta publicação do feed? Ela e seus anexos serão excluídos para todos os colaboradores.
              </p>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setPostToDelete(null)}
                  disabled={!!deletingPostId}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={confirmDeletePost}
                  disabled={!!deletingPostId}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {deletingPostId ? (
                    <>
                      <div className="h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Excluir Definitivamente</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
