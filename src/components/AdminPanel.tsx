import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, EyeOff, LogOut, Save, X, Image as ImageIcon, Calendar, MapPin, Tag, MessageSquare, Bookmark, Palette, User, FileText } from 'lucide-react';
import {
  authService,
  apiService,
  LifeFragment,
  GuestbookNote,
  Work,
  Skill,
  Growth,
  Learning,
  LearningNode,
  SiteContent,
  DEFAULT_SITE_CONTENT
} from '../services/api';
import ThemePath from './ThemePath';

const PROJECT_TYPE_OPTIONS = [
  { value: 'app', label: 'APP 设计' },
  { value: 'business', label: '业务实践' },
  { value: 'exploration', label: '探索项目' },
  { value: 'process', label: '流程优化' },
];

interface AdminPanelProps {
  onLogout: () => void;
}

interface LearningFormData {
  title: string;
  description: string;
  color: string;
  status: string;
  nodes: LearningNode[];
  sortOrder: number;
}

const createEmptyLearningNode = (): LearningNode => ({
  id: `learning-node-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  title: '',
  tool: '',
  description: '',
  tags: [],
  link: '',
});

interface ContentFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
  rows?: number;
  type?: string;
  placeholder?: string;
}

function ContentField({
  label,
  value,
  onChange,
  multiline = false,
  rows = 3,
  type = 'text',
  placeholder = ''
}: ContentFieldProps) {
  const className = 'w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]';
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">{label}</span>
      {multiline ? (
        <textarea
          value={value}
          onChange={(event) => onChange(event.target.value)}
          rows={rows}
          placeholder={placeholder}
          className={`${className} resize-y`}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className={className}
        />
      )}
    </label>
  );
}

interface ContentImageFieldProps {
  label: string;
  value: string;
  alt: string;
  uploading: boolean;
  onChange: (value: string) => void;
  onUpload: (file?: File) => void;
}

function ContentImageField({
  label,
  value,
  alt,
  uploading,
  onChange,
  onUpload
}: ContentImageFieldProps) {
  return (
    <div className="space-y-2">
      <span className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">{label}</span>
      <div className="grid grid-cols-[96px_minmax(0,1fr)] gap-3 items-center">
        <div className="w-24 h-24 overflow-hidden rounded-xl border-2 border-[#4A3E26] bg-white">
          {value ? <img src={value} alt={alt} className="w-full h-full object-cover" /> : null}
        </div>
        <div className="space-y-2">
          <input
            type="text"
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder="图片网址"
            className="w-full bg-white border-2 border-[#4A3E26] px-3 py-2 rounded-xl text-xs font-bold text-[#4A3E26]"
          />
          <label className="inline-flex cursor-pointer items-center gap-2 bg-[#D4F0FC] border-2 border-[#4A3E26] px-3 py-2 rounded-xl text-xs font-black shadow-[2px_2px_0_0_#4A3E26]">
            <ImageIcon className="w-4 h-4" />
            {uploading ? '上传中...' : '上传新图片'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              disabled={uploading}
              onChange={(event) => onUpload(event.target.files?.[0])}
              className="hidden"
            />
          </label>
        </div>
      </div>
    </div>
  );
}

interface WeightSelectProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
}

function WeightSelect({ label, value, onChange }: WeightSelectProps) {
  const options = [
    { value: 300, label: '300 · 较细' },
    { value: 400, label: '400 · 普通' },
    { value: 500, label: '500 · 适中' },
    { value: 600, label: '600 · 半粗' },
    { value: 700, label: '700 · 粗体' },
    { value: 800, label: '800 · 很粗' },
    { value: 900, label: '900 · 最粗' },
  ];
  return (
    <label className="block space-y-1.5">
      <span className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}

export default function AdminPanel({ onLogout }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState<'content' | 'fragments' | 'guestbook' | 'works' | 'about'>(() => {
    const saved = localStorage.getItem('adminActiveTab');
    if (saved === 'content' || saved === 'fragments' || saved === 'guestbook' || saved === 'works' || saved === 'about') {
      return saved;
    }
    return 'content';
  });
  const [fragments, setFragments] = useState<LifeFragment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingFragment, setEditingFragment] = useState<LifeFragment | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [siteContent, setSiteContent] = useState<SiteContent>(() => JSON.parse(JSON.stringify(DEFAULT_SITE_CONTENT)));
  const [isLoadingContent, setIsLoadingContent] = useState(false);
  const [uploadingContentField, setUploadingContentField] = useState('');

  const [works, setWorks] = useState<Work[]>([]);
  const [isLoadingWorks, setIsLoadingWorks] = useState(false);
  const [showWorkForm, setShowWorkForm] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | null>(null);
  const [workFormData, setWorkFormData] = useState({
    number: '',
    title: '',
    englishTitle: '',
    category: '',
    projectType: 'app',
    projectBadge: '',
    defaultDesc: '',
    hoverDesc: '',
    valueDesc: '',
    problemDesc: '',
    myRole: '',
    skills: '' as string | string[],
    previewImage: '',
    concept: '',
    story: '',
    hasPrototype: false,
    prototypeUrl: '',
    hasLiveProduct: false,
    liveUrl: '',
    hasCaseStudy: false,
    yearLabel: '',
    bottomLabel: '',
    isPublic: true,
    sortOrder: 0,
    details: {
      dimensions: '',
      medium: '',
      year: '',
    },
  });
  const [translating, setTranslating] = useState(false);
  const [translateTimeout, setTranslateTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);
  const [showWorkPreview, setShowWorkPreview] = useState(false);
  const [previewWork, setPreviewWork] = useState<Work | null>(null);

  const [guestbookNotes, setGuestbookNotes] = useState<GuestbookNote[]>([]);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [editingNote, setEditingNote] = useState<GuestbookNote | null>(null);
  const [showNoteForm, setShowNoteForm] = useState(false);
  const [noteFormData, setNoteFormData] = useState({
    nickname: '',
    content: '',
    color: '#FFF9BB',
    emoji: '✨'
  });

  const [skills, setSkills] = useState<Skill[]>([]);
  const [isLoadingSkills, setIsLoadingSkills] = useState(false);
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillFormData, setSkillFormData] = useState({
    icon: '📊',
    iconBgColor: '#3BB4FE',
    label: '',
    title: '',
    description: '',
    sortOrder: 0
  });

  const [growthItems, setGrowthItems] = useState<Growth[]>([]);
  const [isLoadingGrowth, setIsLoadingGrowth] = useState(false);
  const [showGrowthForm, setShowGrowthForm] = useState(false);
  const [editingGrowth, setEditingGrowth] = useState<Growth | null>(null);
  const [growthFormData, setGrowthFormData] = useState({
    period: '',
    periodBgColor: '#F3C556',
    title: '',
    subtitle: '',
    description: '',
    sortOrder: 0
  });

  const [learningItems, setLearningItems] = useState<Learning[]>([]);
  const [isLoadingLearning, setIsLoadingLearning] = useState(false);
  const [showLearningForm, setShowLearningForm] = useState(false);
  const [editingLearning, setEditingLearning] = useState<Learning | null>(null);
  const [learningFormData, setLearningFormData] = useState<LearningFormData>({
    title: '',
    description: '',
    color: '#48AEEF',
    status: '持续探索中',
    nodes: [createEmptyLearningNode()],
    sortOrder: 0
  });

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    date: '',
    category: 'diary' as 'photo' | 'diary' | 'moment',
    location: '',
    mood: '',
    weather: '',
    tags: '',
    images: [] as string[],
    isPublic: true
  });

  const loadFragments = async () => {
    setIsLoading(true);
    try {
      const data = await apiService.getAllFragments();
      setFragments(data);
    } catch (err: any) {
      showMessage('error', err.message || '加载失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFragments();
  }, []);

  useEffect(() => {
    localStorage.setItem('adminActiveTab', activeTab);
    if (activeTab === 'content') {
      loadSiteContent();
    }
    if (activeTab === 'guestbook') {
      loadGuestbookNotes();
    }
    if (activeTab === 'works') {
      loadWorks();
    }
    if (activeTab === 'about') {
      loadSkills();
      loadGrowth();
      loadLearning();
    }
  }, [activeTab]);

  const loadSiteContent = async () => {
    setIsLoadingContent(true);
    try {
      setSiteContent(await apiService.getAdminSiteContent());
    } catch (err: any) {
      showMessage('error', err.message || '加载页面内容失败');
    } finally {
      setIsLoadingContent(false);
    }
  };

  const updateContentField = <
    Section extends keyof SiteContent,
    Field extends keyof SiteContent[Section]
  >(section: Section, field: Field, value: SiteContent[Section][Field]) => {
    setSiteContent(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleContentImageUpload = async (
    section: 'home' | 'about' | 'life',
    field: string,
    file?: File
  ) => {
    if (!file) return;
    const uploadKey = `${section}.${field}`;
    setUploadingContentField(uploadKey);
    try {
      const result = await apiService.uploadImage(file);
      updateContentField(section, field as never, result.url as never);
      showMessage('success', '图片上传成功，保存后前端生效');
    } catch (err: any) {
      showMessage('error', err.message || '图片上传失败');
    } finally {
      setUploadingContentField('');
    }
  };

  const handleSiteContentSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSaving(true);
    try {
      const saved = await apiService.updateSiteContent(siteContent);
      setSiteContent(saved);
      showMessage('success', '页面内容已保存，刷新前端即可看到变化');
    } catch (err: any) {
      showMessage('error', err.message || '页面内容保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      date: new Date().toISOString().split('T')[0].replace(/-/g, '.'),
      category: 'diary',
      location: '',
      mood: '',
      weather: '',
      tags: '',
      images: [],
      isPublic: true
    });
    setEditingFragment(null);
    setShowForm(false);
  };

  const openCreateForm = () => {
    resetForm();
    setShowForm(true);
  };

  const openEditForm = (fragment: LifeFragment) => {
    setFormData({
      title: fragment.title,
      content: fragment.content,
      date: fragment.date,
      category: fragment.category || 'diary',
      location: fragment.location || '',
      mood: fragment.mood || '',
      weather: fragment.weather || '',
      tags: fragment.tags.join(', '),
      images: [...fragment.images],
      isPublic: fragment.isPublic
    });
    setEditingFragment(fragment);
    setShowForm(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const uploadedUrls: string[] = [];
      for (let i = 0; i < files.length; i++) {
        const result = await apiService.uploadImage(files[i]);
        uploadedUrls.push(result.url);
      }
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...uploadedUrls]
      }));
      showMessage('success', '图片上传成功');
    } catch (err: any) {
      showMessage('error', err.message || '上传失败');
    } finally {
      setUploadingImage(false);
    }
    e.target.value = '';
  };

  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const fragmentData = {
        title: formData.title,
        content: formData.content,
        date: formData.date,
        category: formData.category,
        location: formData.location,
        mood: formData.mood,
        weather: formData.weather,
        tags: formData.tags.split(',').map(t => t.trim()).filter(t => t),
        images: formData.images,
        isPublic: formData.isPublic
      };

      if (editingFragment) {
        await apiService.updateFragment(editingFragment.id, fragmentData);
        showMessage('success', '更新成功');
      } else {
        await apiService.createFragment(fragmentData);
        showMessage('success', '创建成功');
      }

      await loadFragments();
      resetForm();
    } catch (err: any) {
      showMessage('error', err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条记录吗？此操作不可撤销。')) return;

    const fragmentToDelete = fragments.find(f => f.id === id);
    const prevFragments = [...fragments];

    setFragments(prev => prev.filter(f => f.id !== id));

    try {
      await apiService.deleteFragment(id);
      showMessage('success', '删除成功');
    } catch (err: any) {
      setFragments(prevFragments);
      showMessage('error', err.message || '删除失败');
    }
  };

  const togglePublic = async (fragment: LifeFragment) => {
    const prevFragments = [...fragments];

    setFragments(prev => prev.map(f =>
      f.id === fragment.id ? { ...f, isPublic: !f.isPublic } : f
    ));

    try {
      await apiService.updateFragment(fragment.id, { isPublic: !fragment.isPublic });
      showMessage('success', fragment.isPublic ? '已设为私密' : '已设为公开');
    } catch (err: any) {
      setFragments(prevFragments);
      showMessage('error', err.message || '操作失败');
    }
  };

  const loadGuestbookNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const data = await apiService.getAllGuestbookNotes();
      setGuestbookNotes(data);
    } catch (err: any) {
      showMessage('error', err.message || '加载留言失败');
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const openNoteEditForm = (note: GuestbookNote) => {
    setNoteFormData({
      nickname: note.nickname,
      content: note.content,
      color: note.color,
      emoji: note.emoji
    });
    setEditingNote(note);
    setShowNoteForm(true);
  };

  const resetNoteForm = () => {
    setNoteFormData({
      nickname: '',
      content: '',
      color: '#FFF9BB',
      emoji: '✨'
    });
    setEditingNote(null);
    setShowNoteForm(false);
  };

  const handleNoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteFormData.nickname.trim() || !noteFormData.content.trim()) return;

    setIsSaving(true);
    try {
      if (editingNote) {
        await apiService.updateGuestbookNote(editingNote.id, noteFormData);
        showMessage('success', '留言更新成功');
      }
      await loadGuestbookNotes();
      resetNoteForm();
    } catch (err: any) {
      showMessage('error', err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteNote = async (id: string) => {
    if (!confirm('确定要删除这条留言吗？此操作不可撤销。')) return;

    const noteToDelete = guestbookNotes.find(n => n.id === id);
    const prevNotes = [...guestbookNotes];

    setGuestbookNotes(prev => prev.filter(n => n.id !== id));

    try {
      await apiService.deleteGuestbookNote(id);
      showMessage('success', '删除成功');
    } catch (err: any) {
      setGuestbookNotes(prevNotes);
      showMessage('error', err.message || '删除失败');
    }
  };

  const loadWorks = async () => {
    setIsLoadingWorks(true);
    try {
      const data = await apiService.getAllWorks();
      setWorks(data);
    } catch (err: any) {
      showMessage('error', err.message || '加载作品失败');
    } finally {
      setIsLoadingWorks(false);
    }
  };

  const resetWorkForm = () => {
    setWorkFormData({
      number: '',
      title: '',
      englishTitle: '',
      category: '',
      projectType: 'app',
      projectBadge: '',
      defaultDesc: '',
      hoverDesc: '',
      valueDesc: '',
      problemDesc: '',
      myRole: '',
      skills: '',
      previewImage: '',
      concept: '',
      story: '',
      hasPrototype: false,
      prototypeUrl: '',
      hasLiveProduct: false,
      liveUrl: '',
      hasCaseStudy: true,
      yearLabel: '',
      bottomLabel: '',
      isPublic: true,
      sortOrder: works.length + 1,
      details: {
        dimensions: '',
        medium: '',
        year: ''
      }
    });
    setEditingWork(null);
    setShowWorkForm(false);
  };

  const handleTitleChange = async (value: string) => {
    setWorkFormData(prev => ({ ...prev, title: value }));
    
    if (translateTimeout) {
      clearTimeout(translateTimeout);
    }
    
    if (value.trim() && !workFormData.englishTitle) {
      const timeout = setTimeout(async () => {
        try {
          setTranslating(true);
          const translation = await apiService.translate(value.trim(), 'en');
          setWorkFormData(prev => ({ ...prev, englishTitle: translation }));
        } catch (err) {
          console.error('Translation failed:', err);
        } finally {
          setTranslating(false);
        }
      }, 800);
      setTranslateTimeout(timeout);
    }
  };

  const openCreateWorkForm = () => {
    resetWorkForm();
    setWorkFormData(prev => ({ ...prev, sortOrder: works.length + 1 }));
    setShowWorkForm(true);
  };

  const openEditWorkForm = (work: Work) => {
    setWorkFormData({
      number: work.number,
      title: work.title,
      englishTitle: work.englishTitle,
      category: work.category,
      projectType: work.projectType,
      projectBadge: work.projectBadge,
      defaultDesc: work.defaultDesc,
      hoverDesc: work.hoverDesc,
      valueDesc: work.valueDesc,
      problemDesc: work.problemDesc,
      myRole: work.myRole,
      skills: Array.isArray(work.skills) ? work.skills.join(', ') : work.skills,
      previewImage: work.previewImage,
      concept: work.concept,
      story: work.story,
      hasPrototype: work.hasPrototype,
      prototypeUrl: work.prototypeUrl || '',
      hasLiveProduct: work.hasLiveProduct,
      liveUrl: work.liveUrl || '',
      hasCaseStudy: work.hasCaseStudy,
      yearLabel: work.yearLabel,
      bottomLabel: work.bottomLabel,
      isPublic: work.isPublic,
      sortOrder: work.sortOrder,
      details: { ...work.details }
    });
    setEditingWork(work);
    setShowWorkForm(true);
  };

  const openWorkPreview = (work: Work) => {
    setPreviewWork(work);
    setShowWorkPreview(true);
  };

  const closeWorkPreview = () => {
    setPreviewWork(null);
    setShowWorkPreview(false);
  };

  const handleWorkImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploadingImage(true);
    try {
      const result = await apiService.uploadImage(files[0]);
      setWorkFormData(prev => ({ ...prev, previewImage: result.url }));
      showMessage('success', '图片上传成功');
    } catch (err: any) {
      showMessage('error', err.message || '上传失败');
    } finally {
      setUploadingImage(false);
    }
    e.target.value = '';
  };

  const handleWorkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const submitData = {
        ...workFormData,
        skills: typeof workFormData.skills === 'string' 
          ? workFormData.skills.split(',').map(s => s.trim()).filter(Boolean)
          : workFormData.skills
      };

      if (editingWork) {
        await apiService.updateWork(editingWork.id, submitData);
        showMessage('success', '更新成功');
      } else {
        await apiService.createWork(submitData);
        showMessage('success', '创建成功');
      }
      await loadWorks();
      resetWorkForm();
    } catch (err: any) {
      showMessage('error', err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteWork = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!confirm('确定要删除这个作品吗？此操作不可撤销。')) return;

    const workToDelete = works.find(w => w.id === id);
    const prevWorks = [...works];

    setWorks(prev => prev.filter(w => w.id !== id));

    if (previewWork && previewWork.id === id) {
      closeWorkPreview();
    }

    try {
      await apiService.deleteWork(id);
      showMessage('success', '删除成功');
    } catch (err: any) {
      setWorks(prevWorks);
      if (workToDelete) {
        setPreviewWork(workToDelete);
        setShowWorkPreview(true);
      }
      showMessage('error', err.message || '删除失败');
    }
  };

  const toggleWorkPublic = async (work: Work) => {
    const prevWorks = [...works];

    setWorks(prev => prev.map(w =>
      w.id === work.id ? { ...w, isPublic: !w.isPublic } : w
    ));

    if (previewWork && previewWork.id === work.id) {
      setPreviewWork(prev => prev ? { ...prev, isPublic: !prev.isPublic } : null);
    }

    try {
      await apiService.updateWork(work.id, { isPublic: !work.isPublic });
      showMessage('success', work.isPublic ? '已设为私密' : '已设为公开');
    } catch (err: any) {
      setWorks(prevWorks);
      if (previewWork && previewWork.id === work.id) {
        setPreviewWork(work);
      }
      showMessage('error', err.message || '操作失败');
    }
  };

  const loadSkills = async () => {
    setIsLoadingSkills(true);
    try {
      const data = await apiService.getAllSkills();
      setSkills(data);
    } catch (err: any) {
      showMessage('error', err.message || '加载技能失败');
    } finally {
      setIsLoadingSkills(false);
    }
  };

  const resetSkillForm = () => {
    setSkillFormData({
      icon: '📊',
      iconBgColor: '#3BB4FE',
      label: '',
      title: '',
      description: '',
      sortOrder: skills.length + 1
    });
    setEditingSkill(null);
    setShowSkillForm(false);
  };

  const openCreateSkillForm = () => {
    resetSkillForm();
    setShowSkillForm(true);
  };

  const openEditSkillForm = (skill: Skill) => {
    setSkillFormData({
      icon: skill.icon,
      iconBgColor: skill.iconBgColor,
      label: skill.label,
      title: skill.title,
      description: skill.description,
      sortOrder: skill.sortOrder
    });
    setEditingSkill(skill);
    setShowSkillForm(true);
  };

  const handleSkillSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillFormData.title.trim()) return;

    setIsSaving(true);
    try {
      if (editingSkill) {
        await apiService.updateSkill(editingSkill.id, skillFormData);
        showMessage('success', '技能更新成功');
      } else {
        await apiService.createSkill(skillFormData);
        showMessage('success', '技能创建成功');
      }
      await loadSkills();
      resetSkillForm();
    } catch (err: any) {
      showMessage('error', err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    if (!confirm('确定要删除这个技能吗？此操作不可撤销。')) return;

    const prevSkills = [...skills];
    setSkills(prev => prev.filter(s => s.id !== id));

    try {
      await apiService.deleteSkill(id);
      showMessage('success', '删除成功');
    } catch (err: any) {
      setSkills(prevSkills);
      showMessage('error', err.message || '删除失败');
    }
  };

  const loadGrowth = async () => {
    setIsLoadingGrowth(true);
    try {
      const data = await apiService.getAllGrowth();
      setGrowthItems(data);
    } catch (err: any) {
      showMessage('error', err.message || '加载成长经历失败');
    } finally {
      setIsLoadingGrowth(false);
    }
  };

  const resetGrowthForm = () => {
    setGrowthFormData({
      period: '',
      periodBgColor: '#F3C556',
      title: '',
      subtitle: '',
      description: '',
      sortOrder: growthItems.length + 1
    });
    setEditingGrowth(null);
    setShowGrowthForm(false);
  };

  const openCreateGrowthForm = () => {
    resetGrowthForm();
    setShowGrowthForm(true);
  };

  const openEditGrowthForm = (growth: Growth) => {
    setGrowthFormData({
      period: growth.period,
      periodBgColor: growth.periodBgColor,
      title: growth.title,
      subtitle: growth.subtitle,
      description: growth.description,
      sortOrder: growth.sortOrder
    });
    setEditingGrowth(growth);
    setShowGrowthForm(true);
  };

  const handleGrowthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!growthFormData.title.trim()) return;

    setIsSaving(true);
    try {
      if (editingGrowth) {
        await apiService.updateGrowth(editingGrowth.id, growthFormData);
        showMessage('success', '成长经历更新成功');
      } else {
        await apiService.createGrowth(growthFormData);
        showMessage('success', '成长经历创建成功');
      }
      await loadGrowth();
      resetGrowthForm();
    } catch (err: any) {
      showMessage('error', err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteGrowth = async (id: string) => {
    if (!confirm('确定要删除这个成长经历吗？此操作不可撤销。')) return;

    const prevGrowth = [...growthItems];
    setGrowthItems(prev => prev.filter(g => g.id !== id));

    try {
      await apiService.deleteGrowth(id);
      showMessage('success', '删除成功');
    } catch (err: any) {
      setGrowthItems(prevGrowth);
      showMessage('error', err.message || '删除失败');
    }
  };

  const loadLearning = async () => {
    setIsLoadingLearning(true);
    try {
      const data = await apiService.getAllLearning();
      setLearningItems(data);
    } catch (err: any) {
      showMessage('error', err.message || '加载学习计划失败');
    } finally {
      setIsLoadingLearning(false);
    }
  };

  const resetLearningForm = () => {
    setLearningFormData({
      title: '',
      description: '',
      color: '#48AEEF',
      status: '持续探索中',
      nodes: [createEmptyLearningNode()],
      sortOrder: learningItems.length + 1
    });
    setEditingLearning(null);
    setShowLearningForm(false);
  };

  const openCreateLearningForm = () => {
    resetLearningForm();
    setShowLearningForm(true);
  };

  const openEditLearningForm = (learning: Learning) => {
    setLearningFormData({
      title: learning.title,
      description: learning.description,
      color: learning.color,
      status: learning.status,
      nodes: learning.nodes.map(node => ({
        ...node,
        tags: [...node.tags],
        link: node.link || '',
      })),
      sortOrder: learning.sortOrder
    });
    setEditingLearning(learning);
    setShowLearningForm(true);
  };

  const handleLearningSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!learningFormData.title.trim()) return;

    const payload: LearningFormData = {
      ...learningFormData,
      title: learningFormData.title.trim(),
      description: learningFormData.description.trim(),
      status: learningFormData.status.trim() || '持续探索中',
      nodes: learningFormData.nodes
        .filter(node => node.title.trim())
        .map(node => ({
          ...node,
          title: node.title.trim(),
          tool: node.tool.trim(),
          description: node.description.trim(),
          tags: node.tags.map(tag => tag.trim()).filter(Boolean),
          link: node.link?.trim() || undefined,
        })),
    };

    setIsSaving(true);
    try {
      if (editingLearning) {
        await apiService.updateLearning(editingLearning.id, payload);
        showMessage('success', '学习计划更新成功');
      } else {
        await apiService.createLearning(payload);
        showMessage('success', '学习计划创建成功');
      }
      await loadLearning();
      resetLearningForm();
    } catch (err: any) {
      showMessage('error', err.message || '保存失败');
    } finally {
      setIsSaving(false);
    }
  };

  const updateLearningNode = (index: number, updates: Partial<LearningNode>) => {
    setLearningFormData(prev => ({
      ...prev,
      nodes: prev.nodes.map((node, nodeIndex) =>
        nodeIndex === index ? { ...node, ...updates } : node
      ),
    }));
  };

  const addLearningNode = () => {
    setLearningFormData(prev => ({
      ...prev,
      nodes: [...prev.nodes, createEmptyLearningNode()],
    }));
  };

  const removeLearningNode = (index: number) => {
    setLearningFormData(prev => ({
      ...prev,
      nodes: prev.nodes.filter((_, nodeIndex) => nodeIndex !== index),
    }));
  };

  const moveLearningNode = (index: number, direction: -1 | 1) => {
    setLearningFormData(prev => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= prev.nodes.length) return prev;
      const nodes = [...prev.nodes];
      [nodes[index], nodes[targetIndex]] = [nodes[targetIndex], nodes[index]];
      return { ...prev, nodes };
    });
  };

  const handleDeleteLearning = async (id: string) => {
    if (!confirm('确定要删除这个学习计划吗？此操作不可撤销。')) return;

    const prevLearning = [...learningItems];
    setLearningItems(prev => prev.filter(l => l.id !== id));

    try {
      await apiService.deleteLearning(id);
      showMessage('success', '删除成功');
    } catch (err: any) {
      setLearningItems(prevLearning);
      showMessage('error', err.message || '删除失败');
    }
  };

  const handleLogout = () => {
    authService.logout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-[#FCF9EE]">
      <header className="bg-[#F3C556] border-b-4 border-[#4A3E26] px-4 py-4 sticky top-0 z-50 shadow-[0_4px_0_0_#4A3E26]">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-[#4A3E26]">🎛️ 管理后台</h1>
            <span className="text-xs bg-[#FFFDE5] border-2 border-[#4A3E26] px-2 py-0.5 rounded-full font-bold text-[#4A3E26]">
              {authService.getUser() || 'admin'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLogout}
              className="bg-[#FF6B4A] hover:bg-[#e45131] border-2 border-[#4A3E26] px-3 py-2 rounded-xl text-xs font-bold text-white shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5 transition-all flex items-center gap-1"
            >
              <LogOut className="w-4 h-4" />
              退出
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveTab('content')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm border-4 transition-all ${
              activeTab === 'content'
                ? 'bg-[#9B7FD1] text-white border-[#4A3E26] shadow-[4px_4px_0_0_#4A3E26]'
                : 'bg-white text-[#4A3E26] border-[#4A3E26]/30 hover:border-[#4A3E26]'
            }`}
          >
            <FileText className="w-4 h-4" />
            页面内容
          </button>
          <button
            onClick={() => setActiveTab('fragments')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm border-4 transition-all ${
              activeTab === 'fragments'
                ? 'bg-[#3BB4FE] text-white border-[#4A3E26] shadow-[4px_4px_0_0_#4A3E26]'
                : 'bg-white text-[#4A3E26] border-[#4A3E26]/30 hover:border-[#4A3E26]'
            }`}
          >
            <Bookmark className="w-4 h-4" />
            生活碎片
          </button>
          <button
            onClick={() => setActiveTab('guestbook')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm border-4 transition-all ${
              activeTab === 'guestbook'
                ? 'bg-[#F3C556] text-[#4A3E26] border-[#4A3E26] shadow-[4px_4px_0_0_#4A3E26]'
                : 'bg-white text-[#4A3E26] border-[#4A3E26]/30 hover:border-[#4A3E26]'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            留言板
          </button>
          <button
            onClick={() => setActiveTab('works')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm border-4 transition-all ${
              activeTab === 'works'
                ? 'bg-[#FF6B4A] text-white border-[#4A3E26] shadow-[4px_4px_0_0_#4A3E26]'
                : 'bg-white text-[#4A3E26] border-[#4A3E26]/30 hover:border-[#4A3E26]'
            }`}
          >
            <Palette className="w-4 h-4" />
            我的作品
          </button>
          <button
            onClick={() => setActiveTab('about')}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-sm border-4 transition-all ${
              activeTab === 'about'
                ? 'bg-[#3BEA72] text-[#4A3E26] border-[#4A3E26] shadow-[4px_4px_0_0_#4A3E26]'
                : 'bg-white text-[#4A3E26] border-[#4A3E26]/30 hover:border-[#4A3E26]'
            }`}
          >
            <User className="w-4 h-4" />
            关于我
          </button>
        </div>

        {message && (
          <div className={`mb-6 p-4 rounded-xl border-2 font-bold text-sm text-center ${
            message.type === 'success'
              ? 'bg-green-100 border-green-500 text-green-700'
              : 'bg-red-100 border-red-500 text-red-700'
          }`}>
            {message.text}
          </div>
        )}

        {activeTab === 'content' && (
          <form onSubmit={handleSiteContentSubmit} className="space-y-8">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h2 className="text-3xl font-black text-[#4A3E26]">📝 页面内容管理</h2>
                <p className="text-sm text-[#8E6D3B] font-bold mt-1">
                  按前端出现顺序编辑首页、关于我、作品页、生活页和页脚。列表内容请到对应栏目管理。
                </p>
              </div>
              <button
                type="submit"
                disabled={isSaving || isLoadingContent}
                className="bg-[#9B7FD1] hover:bg-[#876bc0] disabled:bg-gray-400 border-4 border-[#4A3E26] text-white font-black px-5 py-2.5 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all flex items-center gap-2 text-sm"
              >
                <Save className="w-5 h-5" />
                {isSaving ? '保存中...' : '保存全部页面内容'}
              </button>
            </div>

            {isLoadingContent ? (
              <div className="py-20 text-center font-black text-[#8E6D3B]">正在读取页面内容...</div>
            ) : (
              <>
                <section className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-5 md:p-7 shadow-[5px_5px_0_0_#4A3E26] space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-[#3BB4FE]">01 · 首页</h3>
                    <p className="text-xs font-bold text-[#8E6D3B] mt-1">对应 Hey,buddy! 首页的照片、名字和介绍。</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ContentField label="首页大标题" value={siteContent.home.heroTitle} onChange={value => updateContentField('home', 'heroTitle', value)} />
                    <ContentField label="创作者小标签" value={siteContent.home.creatorLabel} onChange={value => updateContentField('home', 'creatorLabel', value)} />
                    <ContentField label="名字上方标题" value={siteContent.home.creatorTitle} onChange={value => updateContentField('home', 'creatorTitle', value)} />
                    <ContentField label="显示名字" value={siteContent.home.creatorName} onChange={value => updateContentField('home', 'creatorName', value)} />
                    <ContentField label="左照片说明" value={siteContent.home.leftCaption} onChange={value => updateContentField('home', 'leftCaption', value)} />
                    <ContentField label="右照片说明" value={siteContent.home.rightCaption} onChange={value => updateContentField('home', 'rightCaption', value)} />
                    <ContentField label="底部英文介绍" value={siteContent.home.introEnglish} onChange={value => updateContentField('home', 'introEnglish', value)} />
                    <ContentField label="底部中文介绍" value={siteContent.home.introChinese} onChange={value => updateContentField('home', 'introChinese', value)} />
                    <ContentField label="引导按钮文字" value={siteContent.home.tourButton} onChange={value => updateContentField('home', 'tourButton', value)} />
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-2">
                    <ContentImageField
                      label="首页左侧照片"
                      value={siteContent.home.leftImage}
                      alt={siteContent.home.leftImageAlt}
                      uploading={uploadingContentField === 'home.leftImage'}
                      onChange={value => updateContentField('home', 'leftImage', value)}
                      onUpload={file => handleContentImageUpload('home', 'leftImage', file)}
                    />
                    <ContentImageField
                      label="首页右侧照片"
                      value={siteContent.home.rightImage}
                      alt={siteContent.home.rightImageAlt}
                      uploading={uploadingContentField === 'home.rightImage'}
                      onChange={value => updateContentField('home', 'rightImage', value)}
                      onUpload={file => handleContentImageUpload('home', 'rightImage', file)}
                    />
                  </div>
                  <details className="bg-white/60 border-2 border-dashed border-[#4A3E26]/30 rounded-2xl p-4">
                    <summary className="cursor-pointer font-black text-sm text-[#4A3E26]">首页电脑屏幕按钮文字</summary>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      <ContentField label="关于我标题" value={siteContent.home.screenAboutTitle} onChange={value => updateContentField('home', 'screenAboutTitle', value)} />
                      <ContentField label="关于我按钮" value={siteContent.home.screenAboutButton} onChange={value => updateContentField('home', 'screenAboutButton', value)} />
                      <ContentField label="生活碎片标题" value={siteContent.home.screenLifeTitle} onChange={value => updateContentField('home', 'screenLifeTitle', value)} />
                      <ContentField label="生活碎片按钮" value={siteContent.home.screenLifeButton} onChange={value => updateContentField('home', 'screenLifeButton', value)} />
                      <ContentField label="我的作品标题" value={siteContent.home.screenWorksTitle} onChange={value => updateContentField('home', 'screenWorksTitle', value)} />
                      <ContentField label="我的作品按钮" value={siteContent.home.screenWorksButton} onChange={value => updateContentField('home', 'screenWorksButton', value)} />
                    </div>
                  </details>
                </section>

                <section className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-5 md:p-7 shadow-[5px_5px_0_0_#4A3E26] space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-[#3BB4FE]">02 · 关于我</h3>
                    <p className="text-xs font-bold text-[#8E6D3B] mt-1">个人介绍和各个动态卡片区的栏目标题。</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ContentField label="主标题" value={siteContent.about.heading} onChange={value => updateContentField('about', 'heading', value)} />
                    <ContentField label="开场问候" value={siteContent.about.greeting} onChange={value => updateContentField('about', 'greeting', value)} />
                  </div>
                  <ContentField
                    label="个人介绍段落（每行一段）"
                    value={siteContent.about.paragraphs.join('\n')}
                    onChange={value => updateContentField('about', 'paragraphs', value.split('\n'))}
                    multiline
                    rows={9}
                  />
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <ContentImageField
                      label="关于我肖像"
                      value={siteContent.about.portraitImage}
                      alt={siteContent.about.portraitAlt}
                      uploading={uploadingContentField === 'about.portraitImage'}
                      onChange={value => updateContentField('about', 'portraitImage', value)}
                      onUpload={file => handleContentImageUpload('about', 'portraitImage', file)}
                    />
                    <ContentField label="肖像下方说明" value={siteContent.about.portraitCaption} onChange={value => updateContentField('about', 'portraitCaption', value)} multiline rows={3} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                    <ContentField label="能力区主标题" value={siteContent.about.skillsHeading} onChange={value => updateContentField('about', 'skillsHeading', value)} />
                    <ContentField label="能力区副标题" value={siteContent.about.skillsSubtitle} onChange={value => updateContentField('about', 'skillsSubtitle', value)} />
                    <ContentField label="能力区手写标题" value={siteContent.about.skillsScript} onChange={value => updateContentField('about', 'skillsScript', value)} />
                    <ContentField label="学习区主标题" value={siteContent.about.learningHeading} onChange={value => updateContentField('about', 'learningHeading', value)} />
                    <ContentField label="学习区副标题" value={siteContent.about.learningSubtitle} onChange={value => updateContentField('about', 'learningSubtitle', value)} />
                    <ContentField label="学习区手写标题" value={siteContent.about.learningScript} onChange={value => updateContentField('about', 'learningScript', value)} />
                    <ContentField label="成长区主标题" value={siteContent.about.growthHeading} onChange={value => updateContentField('about', 'growthHeading', value)} />
                    <ContentField label="成长区副标题" value={siteContent.about.growthSubtitle} onChange={value => updateContentField('about', 'growthSubtitle', value)} />
                    <ContentField label="成长区手写标题" value={siteContent.about.growthScript} onChange={value => updateContentField('about', 'growthScript', value)} />
                  </div>
                  <ContentField label="学习区介绍" value={siteContent.about.learningDescription} onChange={value => updateContentField('about', 'learningDescription', value)} multiline />
                </section>

                <section className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-5 md:p-7 shadow-[5px_5px_0_0_#4A3E26] space-y-5">
                  <h3 className="text-2xl font-black text-[#3BB4FE]">03 · 作品页</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ContentField label="作品页主标题" value={siteContent.works.heading} onChange={value => updateContentField('works', 'heading', value)} />
                    <ContentField label="右侧手写标题" value={siteContent.works.script} onChange={value => updateContentField('works', 'script', value)} />
                  </div>
                  <ContentField label="作品页介绍" value={siteContent.works.description} onChange={value => updateContentField('works', 'description', value)} multiline />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ContentField label="作品页结尾大标题" value={siteContent.works.closingHeading} onChange={value => updateContentField('works', 'closingHeading', value)} />
                    <ContentField
                      label="作品页结尾文字（每行一段）"
                      value={siteContent.works.closingParagraphs.join('\n')}
                      onChange={value => updateContentField('works', 'closingParagraphs', value.split('\n'))}
                      multiline
                      rows={6}
                    />
                  </div>
                </section>

                <section className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-5 md:p-7 shadow-[5px_5px_0_0_#4A3E26] space-y-6">
                  <div>
                    <h3 className="text-2xl font-black text-[#3BB4FE]">04 · 生活碎片与留言板</h3>
                    <p className="text-xs font-bold text-[#8E6D3B] mt-1">这里只改页面说明；每篇生活记录请到“生活碎片”栏目编辑。</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ContentField label="生活页大标题" value={siteContent.life.heading} onChange={value => updateContentField('life', 'heading', value)} />
                    <ContentField label="生活页英文副标题" value={siteContent.life.subtitle} onChange={value => updateContentField('life', 'subtitle', value)} />
                    <ContentField label="角落介绍标题" value={siteContent.life.aboutTitle} onChange={value => updateContentField('life', 'aboutTitle', value)} />
                    <ContentField label="角落底部引语" value={siteContent.life.quote} onChange={value => updateContentField('life', 'quote', value)} />
                    <ContentField label="镜头日记标题" value={siteContent.life.photoTitle} onChange={value => updateContentField('life', 'photoTitle', value)} />
                    <ContentField label="镜头日记说明" value={siteContent.life.photoDescription} onChange={value => updateContentField('life', 'photoDescription', value)} multiline />
                    <ContentField label="日常随笔标题" value={siteContent.life.diaryTitle} onChange={value => updateContentField('life', 'diaryTitle', value)} />
                    <ContentField label="日常随笔说明" value={siteContent.life.diaryDescription} onChange={value => updateContentField('life', 'diaryDescription', value)} multiline />
                    <ContentField label="闪光时刻标题" value={siteContent.life.momentTitle} onChange={value => updateContentField('life', 'momentTitle', value)} />
                    <ContentField label="闪光时刻说明" value={siteContent.life.momentDescription} onChange={value => updateContentField('life', 'momentDescription', value)} multiline />
                    <ContentField label="生活图鉴标题" value={siteContent.life.galleryHeading} onChange={value => updateContentField('life', 'galleryHeading', value)} />
                    <ContentField label="生活图鉴副标题" value={siteContent.life.gallerySubtitle} onChange={value => updateContentField('life', 'gallerySubtitle', value)} />
                    <ContentField label="留言板标题" value={siteContent.life.guestbookHeading} onChange={value => updateContentField('life', 'guestbookHeading', value)} />
                    <ContentField label="留言板副标题" value={siteContent.life.guestbookSubtitle} onChange={value => updateContentField('life', 'guestbookSubtitle', value)} />
                    <ContentField label="留言纸条底部标签" value={siteContent.life.guestbookTag} onChange={value => updateContentField('life', 'guestbookTag', value)} />
                  </div>
                  <details className="bg-white/60 border-2 border-dashed border-[#4A3E26]/30 rounded-2xl p-4">
                    <summary className="cursor-pointer font-black text-sm text-[#4A3E26]">没有生活照片时显示的备用回忆</summary>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-4">
                      <ContentImageField
                        label="备用回忆图片"
                        value={siteContent.life.fallbackMemoryImage}
                        alt="备用回忆"
                        uploading={uploadingContentField === 'life.fallbackMemoryImage'}
                        onChange={value => updateContentField('life', 'fallbackMemoryImage', value)}
                        onUpload={file => handleContentImageUpload('life', 'fallbackMemoryImage', file)}
                      />
                      <div className="space-y-4">
                        <ContentField label="备用日期" value={siteContent.life.fallbackMemoryDate} onChange={value => updateContentField('life', 'fallbackMemoryDate', value)} />
                        <ContentField label="备用回忆文字" value={siteContent.life.fallbackMemoryQuote} onChange={value => updateContentField('life', 'fallbackMemoryQuote', value)} multiline />
                      </div>
                    </div>
                  </details>
                </section>

                <section className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-5 md:p-7 shadow-[5px_5px_0_0_#4A3E26] space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                      <h3 className="text-2xl font-black text-[#3BB4FE]">05 · 全局文字样式</h3>
                      <p className="text-xs font-bold text-[#8E6D3B] mt-1">一次调整全站字重；数字越大，文字越粗。</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSiteContent(prev => ({
                          ...prev,
                          typography: { ...DEFAULT_SITE_CONTENT.typography },
                        }));
                      }}
                      className="bg-white border-2 border-[#4A3E26] px-3 py-2 rounded-xl text-xs font-black shadow-[2px_2px_0_0_#4A3E26]"
                    >
                      恢复推荐值
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <WeightSelect label="大标题粗细" value={siteContent.typography.displayWeight} onChange={value => updateContentField('typography', 'displayWeight', value)} />
                    <WeightSelect label="普通标题 / 卡片标题粗细" value={siteContent.typography.headingWeight} onChange={value => updateContentField('typography', 'headingWeight', value)} />
                    <WeightSelect label="正文粗细" value={siteContent.typography.bodyWeight} onChange={value => updateContentField('typography', 'bodyWeight', value)} />
                    <WeightSelect label="副标题 / 辅助文字粗细" value={siteContent.typography.helperWeight} onChange={value => updateContentField('typography', 'helperWeight', value)} />
                  </div>
                  <label className="flex items-center justify-between gap-4 bg-white border-2 border-[#4A3E26] rounded-2xl px-4 py-3 cursor-pointer">
                    <div>
                      <p className="font-black text-sm text-[#4A3E26]">手机端自动减轻一级</p>
                      <p className="text-xs font-bold text-[#8E6D3B] mt-0.5">小屏幕自动减去 100 字重，让文字不拥挤。</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={siteContent.typography.mobileAutoLighten}
                      onChange={event => updateContentField('typography', 'mobileAutoLighten', event.target.checked)}
                      className="w-5 h-5 accent-[#3BB4FE]"
                    />
                  </label>
                  <div className="bg-white border-2 border-dashed border-[#4A3E26]/40 rounded-2xl p-5 space-y-3">
                    <p className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">当前效果预览</p>
                    <p className="text-4xl text-[#3BB4FE]" style={{ fontWeight: siteContent.typography.displayWeight }}>这是大标题 Display</p>
                    <p className="text-xl text-[#4A3E26]" style={{ fontWeight: siteContent.typography.headingWeight }}>这是普通标题和卡片标题</p>
                    <p className="text-sm text-[#4A3E26]" style={{ fontWeight: siteContent.typography.bodyWeight }}>这是正文内容，用来阅读较长的个人介绍和项目说明。</p>
                    <p className="text-xs text-[#8E6D3B]" style={{ fontWeight: siteContent.typography.helperWeight }}>这是副标题、标签和辅助说明文字。</p>
                  </div>
                </section>

                <section className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-5 md:p-7 shadow-[5px_5px_0_0_#4A3E26] space-y-5">
                  <h3 className="text-2xl font-black text-[#3BB4FE]">06 · 页脚与链接</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <ContentField label="页脚大标题（换行直接回车）" value={siteContent.footer.heading} onChange={value => updateContentField('footer', 'heading', value)} multiline />
                    <ContentField label="页脚中文标语" value={siteContent.footer.slogan} onChange={value => updateContentField('footer', 'slogan', value)} />
                    <ContentField label="版权文字" value={siteContent.footer.copyright} onChange={value => updateContentField('footer', 'copyright', value)} />
                    <div />
                    <ContentField label="隐私政策文字" value={siteContent.footer.privacyLabel} onChange={value => updateContentField('footer', 'privacyLabel', value)} />
                    <ContentField label="隐私政策链接（可留空）" type="url" value={siteContent.footer.privacyUrl} onChange={value => updateContentField('footer', 'privacyUrl', value)} />
                    <ContentField label="服务条款文字" value={siteContent.footer.termsLabel} onChange={value => updateContentField('footer', 'termsLabel', value)} />
                    <ContentField label="服务条款链接（可留空）" type="url" value={siteContent.footer.termsUrl} onChange={value => updateContentField('footer', 'termsUrl', value)} />
                  </div>
                </section>

                <div className="sticky bottom-4 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-[#9B7FD1] hover:bg-[#876bc0] disabled:bg-gray-400 border-4 border-[#4A3E26] text-white font-black px-6 py-3 rounded-2xl shadow-[5px_5px_0_0_#4A3E26] transition-all flex items-center gap-2"
                  >
                    <Save className="w-5 h-5" />
                    {isSaving ? '保存中...' : '保存全部并同步前端'}
                  </button>
                </div>
              </>
            )}
          </form>
        )}

        {activeTab === 'fragments' && (
          <>
            {!showForm && (
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-black text-[#4A3E26]">生活碎片管理</h2>
              <p className="text-sm text-[#8E6D3B] font-bold mt-1">
                共 {fragments.length} 条记录 · 公开 {fragments.filter(f => f.isPublic).length} 条
              </p>
            </div>
            <button
              onClick={openCreateForm}
              className="bg-[#3BB4FE] hover:bg-[#1fa1ef] active:translate-y-0.5 border-4 border-[#4A3E26] text-white font-black px-5 py-2.5 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all flex items-center gap-2 text-sm"
            >
              <Plus className="w-5 h-5" />
              新增记录
            </button>
          </div>
        )}

        {showForm && (
          <div className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[6px_6px_0_0_#4A3E26] mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-black text-[#4A3E26]">
                {editingFragment ? '✏️ 编辑记录' : '✨ 新增生活记录'}
              </h3>
              <button
                onClick={resetForm}
                className="p-2 hover:bg-red-100 rounded-xl transition-colors"
              >
                <X className="w-5 h-5 text-[#4A3E26]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                    标题 *
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="给今天起个名字..."
                    className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="w-4 h-4" /> 日期 *
                  </label>
                  <input
                    type="text"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    placeholder="2025.07.15"
                    className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                  分类 *
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { value: 'photo', label: '📷 镜头日记', color: '#3BB4FE' },
                    { value: 'diary', label: '📝 日常随笔', color: '#FF6B4A' },
                    { value: 'moment', label: '✨ 闪光时刻', color: '#3BEA72' },
                  ].map(({ value, label, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, category: value as any }))}
                      className={`p-3 rounded-xl border-2 font-bold text-sm transition-all ${
                        formData.category === value
                          ? 'border-[#4A3E26] text-white shadow-[2px_2px_0_0_#4A3E26] scale-105'
                          : 'bg-white border-[#4A3E26]/30 text-[#4A3E26] hover:border-[#4A3E26]'
                      }`}
                      style={formData.category === value ? { backgroundColor: color } : {}}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                  内容 *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="今天发生了什么呢..."
                  rows={4}
                  className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE] resize-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> 地点
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="在哪里？"
                    className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                    心情
                  </label>
                  <input
                    type="text"
                    value={formData.mood}
                    onChange={(e) => setFormData(prev => ({ ...prev, mood: e.target.value }))}
                    placeholder="😊 或 ☕"
                    className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { emoji: '😄', label: '大笑' },
                      { emoji: '🤩', label: '星星眼' },
                      { emoji: '😭', label: '大哭' },
                      { emoji: '😔', label: '失落' },
                      { emoji: '😡', label: '怒火中烧' },
                      { emoji: '😤', label: '气鼓鼓' },
                      { emoji: '🤔', label: '思考' },
                      { emoji: '😱', label: '惊恐' },
                      { emoji: '🥱', label: '打哈欠' },
                      { emoji: '🤭', label: '捂嘴偷笑' },
                    ].map(({ emoji, label }) => (
                      <button
                        key={emoji}
                        type="button"
                        title={label}
                        onClick={() => setFormData(prev => ({ ...prev, mood: prev.mood === emoji ? '' : emoji }))}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 text-base transition-all ${
                          formData.mood === emoji 
                            ? 'bg-[#F3C556] border-[#4A3E26] scale-110' 
                            : 'bg-[#FCF9EE] border-[#4A3E26]/30 hover:border-[#4A3E26] hover:scale-105'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                    天气
                  </label>
                  <input
                    type="text"
                    value={formData.weather}
                    onChange={(e) => setFormData(prev => ({ ...prev, weather: e.target.value }))}
                    placeholder="☀️ 或 🌧️"
                    className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                  />
                  <div className="flex gap-1.5 flex-wrap">
                    {[
                      { emoji: '☀️', label: '晴天' },
                      { emoji: '⛅', label: '多云' },
                      { emoji: '🌧️', label: '下雨' },
                      { emoji: '⛈️', label: '雷暴雨' },
                      { emoji: '🌥️', label: '阴天多云' },
                      { emoji: '🌩️', label: '打雷闪电' },
                      { emoji: '❄️', label: '雪花' },
                      { emoji: '☁️', label: '乌云' },
                      { emoji: '🌈', label: '彩虹' },
                      { emoji: '🌬️', label: '刮风' },
                    ].map(({ emoji, label }) => (
                      <button
                        key={emoji}
                        type="button"
                        title={label}
                        onClick={() => setFormData(prev => ({ ...prev, weather: prev.weather === emoji ? '' : emoji }))}
                        className={`w-8 h-8 flex items-center justify-center rounded-lg border-2 text-base transition-all ${
                          formData.weather === emoji 
                            ? 'bg-[#3BB4FE] border-[#4A3E26] scale-110' 
                            : 'bg-[#FCF9EE] border-[#4A3E26]/30 hover:border-[#4A3E26] hover:scale-105'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1">
                  <Tag className="w-4 h-4" /> 标签（用逗号分隔）
                </label>
                <input
                  type="text"
                  value={formData.tags}
                  onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
                  placeholder="日常, 美食, 旅行"
                  className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1">
                  <ImageIcon className="w-4 h-4" /> 图片
                </label>
                <div className="bg-white border-2 border-dashed border-[#4A3E26] rounded-xl p-4">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="hidden"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center cursor-pointer py-4 hover:bg-[#FCF9EE] rounded-xl transition-colors"
                  >
                    {uploadingImage ? (
                      <span className="text-sm font-bold text-[#8E6D3B] animate-pulse">上传中...</span>
                    ) : (
                      <>
                        <ImageIcon className="w-8 h-8 text-[#8E6D3B]/50 mb-2" />
                        <span className="text-sm font-bold text-[#8E6D3B]">点击上传图片</span>
                        <span className="text-xs text-[#8E6D3B]/60 mt-1">支持 jpg, png, gif, webp</span>
                      </>
                    )}
                  </label>

                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-4 gap-2 mt-4">
                      {formData.images.map((img, index) => (
                        <div key={index} className="relative aspect-square">
                          <img
                            src={img}
                            alt={`upload-${index}`}
                            className="w-full h-full object-cover rounded-lg border border-[#4A3E26]"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full border-2 border-[#4A3E26] flex items-center justify-center text-xs font-bold hover:bg-red-600 transition-colors"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isPublic}
                    onChange={(e) => setFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3BEA72] border-2 border-[#4A3E26]"></div>
                </label>
                <span className="text-sm font-bold text-[#4A3E26]">
                  {formData.isPublic ? '🌍 公开可见' : '🔒 仅自己可见'}
                </span>
              </div>

              <div className="flex gap-3 pt-4 border-t-2 border-dashed border-[#4A3E26]/20">
                <button
                  type="button"
                  onClick={resetForm}
                  className="flex-1 bg-[#FFFDE5] hover:bg-white border-2 border-[#4A3E26] text-[#4A3E26] font-black py-3 rounded-xl shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5 transition-all text-sm"
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-[#3BEA72] hover:bg-[#2dd35f] disabled:opacity-50 border-2 border-[#4A3E26] text-[#4A3E26] font-black py-3 rounded-xl shadow-[2px_2px_0_0#4A3E26] active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? '保存中...' : (editingFragment ? '更新记录' : '发布记录')}
                </button>
              </div>
            </form>
          </div>
        )}

        {isLoading ? (
          <div className="text-center py-16">
            <div className="animate-spin w-10 h-10 border-4 border-[#3BB4FE] border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-sm font-bold text-[#8E6D3B]">加载中...</p>
          </div>
        ) : fragments.length === 0 ? (
          <div className="text-center py-16 bg-[#FFFDE5] border-4 border-dashed border-[#4A3E26]/30 rounded-[2rem]">
            <p className="text-4xl mb-4">📝</p>
            <p className="text-lg font-black text-[#4A3E26] mb-2">还没有任何记录</p>
            <p className="text-sm text-[#8E6D3B] font-bold mb-6">点击上方按钮，写下你的第一篇生活记录吧</p>
          </div>
        ) : (
          <div className="space-y-4">
            {fragments.map((fragment) => (
              <div
                key={fragment.id}
                className={`bg-white border-4 border-[#4A3E26] rounded-[1.5rem] p-5 shadow-[4px_4px_0_0_#4A3E26] ${
                  !fragment.isPublic ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-lg font-black text-[#4A3E26] truncate">{fragment.title}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold text-white border border-[#4A3E26] whitespace-nowrap`}
                        style={{
                          backgroundColor: fragment.category === 'photo' ? '#3BB4FE' :
                                          fragment.category === 'diary' ? '#FF6B4A' : '#3BEA72'
                        }}
                      >
                        {fragment.category === 'photo' ? '📷 镜头日记' :
                         fragment.category === 'diary' ? '📝 日常随笔' : '✨ 闪光时刻'}
                      </span>
                      {!fragment.isPublic && (
                        <span className="text-xs bg-gray-200 border border-gray-400 px-2 py-0.5 rounded-full font-bold text-gray-600 whitespace-nowrap">
                          🔒 私密
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#8E6D3B] font-bold flex-wrap">
                      <span>📅 {fragment.date}</span>
                      {fragment.location && <span>📍 {fragment.location}</span>}
                      {(fragment.weather || fragment.mood) && (
                        <span>{fragment.weather || fragment.mood}</span>
                      )}
                      <span>🖼️ {fragment.images.length}张图</span>
                    </div>
                    {fragment.tags.length > 0 && (
                      <div className="flex gap-1.5 flex-wrap mt-3">
                        {fragment.tags.map((tag, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-[#FFF9BB] border border-[#4A3E26] px-2 py-0.5 rounded-full font-bold text-[#4A3E26]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => togglePublic(fragment)}
                      className="p-2 hover:bg-[#FFF9BB] rounded-xl transition-colors"
                      title={fragment.isPublic ? '设为私密' : '设为公开'}
                    >
                      {fragment.isPublic ? (
                        <Eye className="w-5 h-5 text-[#4A3E26]" />
                      ) : (
                        <EyeOff className="w-5 h-5 text-[#8E6D3B]" />
                      )}
                    </button>
                    <button
                      onClick={() => openEditForm(fragment)}
                      className="p-2 hover:bg-[#D4F0FC] rounded-xl transition-colors"
                      title="编辑"
                    >
                      <Edit2 className="w-5 h-5 text-[#3BB4FE]" />
                    </button>
                    <button
                      onClick={() => handleDelete(fragment.id)}
                      className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-5 h-5 text-[#FF6B4A]" />
                    </button>
                  </div>
                </div>

                {fragment.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-1.5 mt-4 pt-4 border-t border-dashed border-[#4A3E26]/20">
                    {fragment.images.slice(0, 4).map((img, i) => (
                      <div key={i} className="aspect-square">
                        <img
                          src={img}
                          alt=""
                          className="w-full h-full object-cover rounded-lg border border-[#4A3E26]/20"
                        />
                      </div>
                    ))}
                    {fragment.images.length > 4 && (
                      <div className="aspect-square bg-[#FCF9EE] rounded-lg border border-[#4A3E26]/20 flex items-center justify-center">
                        <span className="text-sm font-black text-[#8E6D3B]">
                          +{fragment.images.length - 4}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
          </>
        )}

        {activeTab === 'guestbook' && (
          <>
            {showNoteForm && (
              <div className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[6px_6px_0_0_#4A3E26] mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[#4A3E26]">
                    ✏️ 编辑留言
                  </h3>
                  <button
                    onClick={resetNoteForm}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[#4A3E26]" />
                  </button>
                </div>

                <form onSubmit={handleNoteSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        昵称 *
                      </label>
                      <input
                        type="text"
                        value={noteFormData.nickname}
                        onChange={(e) => setNoteFormData(prev => ({ ...prev, nickname: e.target.value }))}
                        placeholder="访客昵称"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#F3C556]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        表情
                      </label>
                      <div className="flex gap-2 flex-wrap">
                        {['✨', '🌸', '☕', '🐱', '🚀', '🎨', '🔥', '💡', '🌟', '🍀'].map(emoji => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setNoteFormData(prev => ({ ...prev, emoji }))}
                            className={`w-10 h-10 rounded-xl border-2 text-lg transition-all ${
                              noteFormData.emoji === emoji
                                ? 'bg-[#F3C556] border-[#4A3E26] scale-110'
                                : 'bg-white border-[#4A3E26]/30 hover:border-[#4A3E26]'
                            }`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                      内容 *
                    </label>
                    <textarea
                      value={noteFormData.content}
                      onChange={(e) => setNoteFormData(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="留言内容..."
                      rows={4}
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#F3C556] resize-none"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                      纸条颜色
                    </label>
                    <div className="flex gap-3">
                      {[
                        { name: '温暖黄', value: '#FFF9BB' },
                        { name: '樱花粉', value: '#FFD1DC' },
                        { name: '薄荷绿', value: '#D6F6D5' },
                        { name: '晴空蓝', value: '#D4F0FC' },
                        { name: '香芋紫', value: '#E8DFF5' }
                      ].map(({ name, value }) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setNoteFormData(prev => ({ ...prev, color: value }))}
                          className={`w-10 h-10 rounded-full border-2 transition-all ${
                            noteFormData.color === value
                              ? 'border-[#4A3E26] scale-110 ring-2 ring-offset-2 ring-[#4A3E26]'
                              : 'border-[#4A3E26]/30 hover:border-[#4A3E26]'
                          }`}
                          style={{ backgroundColor: value }}
                          title={name}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t-2 border-dashed border-[#4A3E26]/20">
                    <button
                      type="button"
                      onClick={resetNoteForm}
                      className="flex-1 bg-[#FFFDE5] hover:bg-white border-2 border-[#4A3E26] text-[#4A3E26] font-black py-3 rounded-xl shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5 transition-all text-sm"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-[#F3C556] hover:bg-[#e5b43a] disabled:opacity-50 border-2 border-[#4A3E26] text-[#4A3E26] font-black py-3 rounded-xl shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? '保存中...' : '更新留言'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showNoteForm && (
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-black text-[#4A3E26]">留言板管理</h2>
                  <p className="text-sm text-[#8E6D3B] font-bold mt-1">
                    共 {guestbookNotes.length} 条留言
                  </p>
                </div>
              </div>
            )}

            {isLoadingNotes ? (
              <div className="text-center py-16">
                <div className="animate-spin w-10 h-10 border-4 border-[#F3C556] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm font-bold text-[#8E6D3B]">加载中...</p>
              </div>
            ) : guestbookNotes.length === 0 ? (
              <div className="text-center py-16 bg-[#FFFDE5] border-4 border-dashed border-[#4A3E26]/30 rounded-[2rem]">
                <p className="text-4xl mb-4">📝</p>
                <p className="text-lg font-black text-[#4A3E26] mb-2">还没有任何留言</p>
                <p className="text-sm text-[#8E6D3B] font-bold mb-6">访客可以在前台的留香阁提交留言</p>
              </div>
            ) : (
              <div className="space-y-4">
                {guestbookNotes.map((note) => (
                  <div
                    key={note.id}
                    className="bg-white border-4 border-[#4A3E26] rounded-[1.5rem] p-5 shadow-[4px_4px_0_0_#4A3E26]"
                    style={{ borderLeftWidth: '6px', borderLeftColor: note.color }}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{note.emoji}</span>
                          <h3 className="text-lg font-black text-[#4A3E26]">{note.nickname}</h3>
                          <span className="text-xs text-[#8E6D3B] font-bold">
                            {new Date(note.createdAt).toLocaleDateString('zh-CN', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </span>
                        </div>
                        <p className="text-sm text-[#4A3E26] leading-relaxed whitespace-pre-wrap">
                          {note.content}
                        </p>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => openNoteEditForm(note)}
                          className="p-2 hover:bg-[#D4F0FC] rounded-xl transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-5 h-5 text-[#3BB4FE]" />
                        </button>
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-5 h-5 text-[#FF6B4A]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'works' && (
          <>
            {showWorkForm && (
              <div className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[6px_6px_0_0_#4A3E26] mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[#4A3E26]">
                    {editingWork ? '✏️ 编辑作品' : '✨ 新增作品'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetWorkForm}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[#4A3E26]" />
                  </button>
                </div>

                <form onSubmit={handleWorkSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        作品标题 *
                      </label>
                      <input
                        type="text"
                        value={workFormData.title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        placeholder="作品名称"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        英文标题 {translating && <span className="text-[#3BB4FE]">翻译中...</span>}
                      </label>
                      <input
                        type="text"
                        value={workFormData.englishTitle}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, englishTitle: e.target.value }))}
                        placeholder="English Title"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {editingWork && (
                      <div className="space-y-2">
                        <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                          编号 <span className="text-[#8E6D3B]/60 font-normal normal-case">（自动生成，不建议修改）</span>
                        </label>
                        <input
                          type="text"
                          value={workFormData.number}
                          onChange={(e) => setWorkFormData(prev => ({ ...prev, number: e.target.value }))}
                          placeholder="例如：001"
                          className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                        />
                      </div>
                    )}
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        项目类型
                      </label>
                      <select
                        value={PROJECT_TYPE_OPTIONS.some(o => o.value === workFormData.projectType) ? workFormData.projectType : 'other'}
                        onChange={(e) => {
                          const val = e.target.value;
                          if (val === 'other') {
                            setWorkFormData(prev => ({ ...prev, projectType: '' }));
                          } else {
                            setWorkFormData(prev => ({ ...prev, projectType: val }));
                          }
                        }}
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      >
                        {PROJECT_TYPE_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                        <option value="other">其他（自定义）</option>
                      </select>
                      {!PROJECT_TYPE_OPTIONS.some(o => o.value === workFormData.projectType) && (
                        <input
                          type="text"
                          value={workFormData.projectType}
                          onChange={(e) => setWorkFormData(prev => ({ ...prev, projectType: e.target.value }))}
                          placeholder="请输入自定义项目类型..."
                          className="w-full bg-white border-2 border-[#FF6B4A] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] mt-2"
                        />
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        分类
                      </label>
                      <input
                        type="text"
                        value={workFormData.category}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, category: e.target.value }))}
                        placeholder="例如：独立APP设计 / 业务实践"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        项目徽章
                      </label>
                      <input
                        type="text"
                        value={workFormData.projectBadge}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, projectBadge: e.target.value }))}
                        placeholder="例如：独立APP设计"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        排序
                      </label>
                      <input
                        type="number"
                        value={workFormData.sortOrder}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, sortOrder: Number(e.target.value) }))}
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        能力标签（逗号分隔）
                      </label>
                      <input
                        type="text"
                        value={typeof workFormData.skills === 'string' ? workFormData.skills : workFormData.skills.join(', ')}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, skills: e.target.value }))}
                        placeholder="例如：产品设计, UI/UX, Figma"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1">
                      <ImageIcon className="w-4 h-4" /> 作品封面图 *
                    </label>
                    <div className="bg-white border-2 border-dashed border-[#4A3E26] rounded-xl p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleWorkImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                        id="work-image-upload"
                      />
                      {workFormData.previewImage ? (
                        <div className="relative">
                          <img
                            src={workFormData.previewImage}
                            alt="作品封面"
                            className="w-full max-w-xs mx-auto aspect-square object-cover rounded-xl border-2 border-[#4A3E26]"
                          />
                          <label
                            htmlFor="work-image-upload"
                            className="block text-center mt-3 text-sm font-bold text-[#FF6B4A] cursor-pointer hover:underline"
                          >
                            更换图片
                          </label>
                        </div>
                      ) : (
                        <label
                          htmlFor="work-image-upload"
                          className="flex flex-col items-center justify-center cursor-pointer py-8 hover:bg-[#FCF9EE] rounded-xl transition-colors"
                        >
                          {uploadingImage ? (
                            <span className="text-sm font-bold text-[#8E6D3B] animate-pulse">上传中...</span>
                          ) : (
                            <>
                              <ImageIcon className="w-10 h-10 text-[#8E6D3B]/50 mb-2" />
                              <span className="text-sm font-bold text-[#8E6D3B]">点击上传作品封面图</span>
                              <span className="text-xs text-[#8E6D3B]/60 mt-1">支持 jpg, png, gif, webp</span>
                            </>
                          )}
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        默认描述
                      </label>
                      <textarea
                        value={workFormData.defaultDesc}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, defaultDesc: e.target.value }))}
                        placeholder="卡片默认显示的描述..."
                        rows={2}
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        悬停描述
                      </label>
                      <textarea
                        value={workFormData.hoverDesc}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, hoverDesc: e.target.value }))}
                        placeholder="鼠标悬停时显示的描述..."
                        rows={2}
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] resize-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                      价值主张
                    </label>
                    <input
                      type="text"
                      value={workFormData.valueDesc}
                      onChange={(e) => setWorkFormData(prev => ({ ...prev, valueDesc: e.target.value }))}
                      placeholder="一句话说清作品的价值..."
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        解决的问题
                      </label>
                      <textarea
                        value={workFormData.problemDesc}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, problemDesc: e.target.value }))}
                        placeholder="这个作品解决了什么问题..."
                        rows={2}
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] resize-none"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        我的角色
                      </label>
                      <input
                        type="text"
                        value={workFormData.myRole}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, myRole: e.target.value }))}
                        placeholder="例如：产品设计 + UI设计"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                      设计概念
                    </label>
                    <textarea
                      value={workFormData.concept}
                      onChange={(e) => setWorkFormData(prev => ({ ...prev, concept: e.target.value }))}
                      placeholder="一句话描述作品的核心概念..."
                      rows={2}
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                      创作故事
                    </label>
                    <textarea
                      value={workFormData.story}
                      onChange={(e) => setWorkFormData(prev => ({ ...prev, story: e.target.value }))}
                      placeholder="讲讲这个作品背后的故事..."
                      rows={5}
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1">
                        🎮 原型链接
                      </label>
                      <input
                        type="url"
                        value={workFormData.prototypeUrl}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, prototypeUrl: e.target.value }))}
                        placeholder="例如：https://axshare.com/..."
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1">
                        🌐 上线产品链接
                      </label>
                      <input
                        type="url"
                        value={workFormData.liveUrl}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, liveUrl: e.target.value }))}
                        placeholder="例如：https://..."
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        尺寸 / 规格
                      </label>
                      <input
                        type="text"
                        value={workFormData.details.dimensions}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, details: { ...prev.details, dimensions: e.target.value } }))}
                        placeholder="例如：3840 x 2160 px"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        介质 / 材质
                      </label>
                      <input
                        type="text"
                        value={workFormData.details.medium}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, details: { ...prev.details, medium: e.target.value } }))}
                        placeholder="例如：Digital Painting"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        创成年份
                      </label>
                      <input
                        type="text"
                        value={workFormData.details.year}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, details: { ...prev.details, year: e.target.value } }))}
                        placeholder="例如：2026"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        年份标签
                      </label>
                      <input
                        type="text"
                        value={workFormData.yearLabel}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, yearLabel: e.target.value }))}
                        placeholder="例如：EXPLORED IN 2025"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                        底部标签
                      </label>
                      <input
                        type="text"
                        value={workFormData.bottomLabel}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, bottomLabel: e.target.value }))}
                        placeholder="例如：PRODUCT DESIGN · PROTOTYPE"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workFormData.hasPrototype}
                          onChange={(e) => setWorkFormData(prev => ({ ...prev, hasPrototype: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3BB4FE] border-2 border-[#4A3E26]"></div>
                      </label>
                      <span className="text-sm font-bold text-[#4A3E26]">
                        🎮 有原型
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workFormData.hasLiveProduct}
                          onChange={(e) => setWorkFormData(prev => ({ ...prev, hasLiveProduct: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#3BEA72] border-2 border-[#4A3E26]"></div>
                      </label>
                      <span className="text-sm font-bold text-[#4A3E26]">
                        🌐 有上线产品
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={workFormData.hasCaseStudy}
                          onChange={(e) => setWorkFormData(prev => ({ ...prev, hasCaseStudy: e.target.checked }))}
                          className="sr-only peer"
                        />
                        <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#F3C556] border-2 border-[#4A3E26]"></div>
                      </label>
                      <span className="text-sm font-bold text-[#4A3E26]">
                        📖 有案例详情
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={workFormData.isPublic}
                        onChange={(e) => setWorkFormData(prev => ({ ...prev, isPublic: e.target.checked }))}
                        className="sr-only peer"
                      />
                      <div className="w-12 h-6 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#FF6B4A] border-2 border-[#4A3E26]"></div>
                    </label>
                    <span className="text-sm font-bold text-[#4A3E26]">
                      {workFormData.isPublic ? '🌍 公开可见' : '🔒 仅自己可见'}
                    </span>
                  </div>

                  <div className="flex gap-3 pt-4 border-t-2 border-dashed border-[#4A3E26]/20">
                    <button
                      type="button"
                      onClick={resetWorkForm}
                      className="flex-1 bg-[#FFFDE5] hover:bg-white border-2 border-[#4A3E26] text-[#4A3E26] font-black py-3 rounded-xl shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5 transition-all text-sm"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="flex-1 bg-[#FF6B4A] hover:bg-[#e45131] disabled:opacity-50 border-2 border-[#4A3E26] text-white font-black py-3 rounded-xl shadow-[2px_2px_0_0#4A3E26] active:translate-y-0.5 transition-all text-sm flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? '保存中...' : (editingWork ? '更新作品' : '发布作品')}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showWorkForm && (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-black text-[#4A3E26]">作品管理</h2>
                    <p className="text-sm text-[#8E6D3B] font-bold mt-1">
                      共 {works.length} 个作品 · 公开 {works.filter(w => w.isPublic).length} 个
                    </p>
                  </div>
                  <button
                    onClick={openCreateWorkForm}
                    className="bg-[#FF6B4A] hover:bg-[#e45131] active:translate-y-0.5 border-4 border-[#4A3E26] text-white font-black px-5 py-2.5 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all flex items-center gap-2 text-sm"
                  >
                    <Plus className="w-5 h-5" />
                    新增作品
                  </button>
                </div>

                {isLoadingWorks ? (
                  <div className="text-center py-16">
                    <div className="animate-spin w-10 h-10 border-4 border-[#FF6B4A] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-[#8E6D3B]">加载中...</p>
                  </div>
                ) : works.length === 0 ? (
                  <div className="text-center py-16 bg-[#FFFDE5] border-4 border-dashed border-[#4A3E26]/30 rounded-[2rem]">
                    <p className="text-4xl mb-4">🎨</p>
                    <p className="text-lg font-black text-[#4A3E26] mb-2">还没有任何作品</p>
                    <p className="text-sm text-[#8E6D3B] font-bold mb-6">点击上方按钮，添加你的第一个作品吧</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {works.map((work) => (
                      <div
                        key={work.id}
                        className={`bg-white border-4 border-[#4A3E26] rounded-[1.5rem] overflow-hidden shadow-[4px_4px_0_0_#4A3E26] flex flex-col ${
                          !work.isPublic ? 'opacity-70' : ''
                        }`}
                      >
                        <div className="aspect-square bg-[#FCF9EE] relative shrink-0">
                          <img
                            src={work.previewImage}
                            alt={work.title}
                            className="w-full h-full object-cover"
                          />
                          {!work.isPublic && (
                            <div className="absolute top-3 left-3 bg-gray-600 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-[#4A3E26]">
                              🔒 私密
                            </div>
                          )}
                          <div className="absolute top-3 right-3 bg-[#FFFDE5] text-[#4A3E26] text-xs font-bold px-2 py-1 rounded-full border-2 border-[#4A3E26] shadow-[2px_2px_0_0_#4A3E26]">
                            #{work.sortOrder}
                          </div>
                        </div>
                        <div className="p-4 flex flex-col flex-1">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="text-lg font-black text-[#4A3E26] truncate">{work.title}</h3>
                              <p className="text-xs text-[#8E6D3B] font-bold uppercase tracking-wider truncate">{work.englishTitle}</p>
                            </div>
                          </div>
                          {work.category && (
                            <p className="text-xs text-[#FF6B4A] font-bold mb-2">{work.category}</p>
                          )}
                          <p className="text-sm text-[#665B45] line-clamp-2 leading-relaxed">{work.concept}</p>
                          
                          {(work.hasPrototype || work.hasLiveProduct) && (
                            <div className="flex gap-2 mt-3">
                              {work.hasPrototype && (
                                work.prototypeUrl ? (
                                  <a
                                    href={work.prototypeUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-xs font-black text-center bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] py-2 rounded-lg border-2 border-[#4A3E26] transition-colors"
                                  >
                                    🎮 体验原型
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openWorkPreview(work)}
                                    className="flex-1 text-xs font-black text-center bg-[#E8F5E9] hover:bg-[#C8E6C9] text-[#2E7D32] py-2 rounded-lg border-2 border-[#4A3E26] transition-colors"
                                  >
                                    🎮 体验原型
                                  </button>
                                )
                              )}
                              {work.hasLiveProduct && (
                                work.liveUrl ? (
                                  <a
                                    href={work.liveUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex-1 text-xs font-black text-center bg-[#D4F0FC] hover:bg-[#B3E5FC] text-[#0277BD] py-2 rounded-lg border-2 border-[#4A3E26] transition-colors"
                                  >
                                    🌐 访问产品
                                  </a>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => openWorkPreview(work)}
                                    className="flex-1 text-xs font-black text-center bg-[#D4F0FC] hover:bg-[#B3E5FC] text-[#0277BD] py-2 rounded-lg border-2 border-[#4A3E26] transition-colors"
                                  >
                                    🌐 访问产品
                                  </button>
                                )
                              )}
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between mt-auto pt-4 border-t border-dashed border-[#4A3E26]/20">
                            <span className="text-xs text-[#8E6D3B] font-bold">
                              {work.details.year}
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openWorkPreview(work)}
                                className="p-1.5 hover:bg-[#E8F5E9] rounded-lg transition-colors"
                                title="预览"
                              >
                                <Eye className="w-4 h-4 text-[#4CAF50]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleWorkPublic(work)}
                                className="p-1.5 hover:bg-[#FFF9BB] rounded-lg transition-colors"
                                title={work.isPublic ? '设为私密' : '设为公开'}
                              >
                                {work.isPublic ? (
                                  <Eye className="w-4 h-4 text-[#4A3E26]" />
                                ) : (
                                  <EyeOff className="w-4 h-4 text-[#8E6D3B]" />
                                )}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditWorkForm(work)}
                                className="p-1.5 hover:bg-[#D4F0FC] rounded-lg transition-colors"
                                title="编辑"
                              >
                                <Edit2 className="w-4 h-4 text-[#3BB4FE]" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => handleDeleteWork(e, work.id)}
                                className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                                title="删除"
                              >
                                <Trash2 className="w-4 h-4 text-[#FF6B4A]" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}

            {showWorkPreview && previewWork && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={closeWorkPreview}>
                <div
                  className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-[8px_8px_0_0_#4A3E26]"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="sticky top-0 bg-[#FFFDE5] border-b-4 border-[#4A3E26] p-4 flex items-center justify-between z-10">
                    <h3 className="text-xl font-black text-[#4A3E26]">👁️ 作品预览</h3>
                    <button
                      onClick={closeWorkPreview}
                      className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                    >
                      <X className="w-5 h-5 text-[#4A3E26]" />
                    </button>
                  </div>

                  <div className="p-6">
                    <div className="aspect-square bg-[#FCF9EE] border-4 border-[#4A3E26] rounded-[1.5rem] overflow-hidden mb-6 shadow-[4px_4px_0_0_#4A3E26]">
                      <img
                        src={previewWork.image}
                        alt={previewWork.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h2 className="text-3xl font-black text-[#4A3E26] mb-1">{previewWork.title}</h2>
                        <p className="text-sm text-[#8E6D3B] font-bold uppercase tracking-wider">{previewWork.englishTitle}</p>
                      </div>

                      {previewWork.category && (
                        <div className="inline-block bg-[#FF6B4A] text-white text-xs font-black px-3 py-1 rounded-full border-2 border-[#4A3E26] shadow-[2px_2px_0_0_#4A3E26]">
                          {previewWork.category}
                        </div>
                      )}

                      {previewWork.concept && (
                        <div className="bg-white border-2 border-[#4A3E26] rounded-xl p-4">
                          <h4 className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider mb-2">💡 设计概念</h4>
                          <p className="text-sm text-[#4A3E26] font-bold leading-relaxed">{previewWork.concept}</p>
                        </div>
                      )}

                      {previewWork.story && (
                        <div className="bg-white border-2 border-[#4A3E26] rounded-xl p-4">
                          <h4 className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider mb-2">📖 创作故事</h4>
                          <p className="text-sm text-[#4A3E26] leading-relaxed whitespace-pre-wrap">{previewWork.story}</p>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-4">
                        {previewWork.details.dimensions && (
                          <div className="bg-white border-2 border-[#4A3E26] rounded-xl p-3 text-center">
                            <h4 className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider mb-1">📐 尺寸</h4>
                            <p className="text-sm font-bold text-[#4A3E26]">{previewWork.details.dimensions}</p>
                          </div>
                        )}
                        {previewWork.details.medium && (
                          <div className="bg-white border-2 border-[#4A3E26] rounded-xl p-3 text-center">
                            <h4 className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider mb-1">🎨 介质</h4>
                            <p className="text-sm font-bold text-[#4A3E26]">{previewWork.details.medium}</p>
                          </div>
                        )}
                        {previewWork.details.year && (
                          <div className="bg-white border-2 border-[#4A3E26] rounded-xl p-3 text-center">
                            <h4 className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider mb-1">📅 年份</h4>
                            <p className="text-sm font-bold text-[#4A3E26]">{previewWork.details.year}</p>
                          </div>
                        )}
                      </div>

                      {(previewWork.prototypeUrl || previewWork.liveUrl) && (
                        <div className="flex gap-3">
                          {previewWork.prototypeUrl && (
                            <a
                              href={previewWork.prototypeUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center bg-[#4CAF50] hover:bg-[#388E3C] text-white font-black py-3 rounded-xl border-2 border-[#4A3E26] shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5 transition-all"
                            >
                              🎮 体验原型
                            </a>
                          )}
                          {previewWork.liveUrl && (
                            <a
                              href={previewWork.liveUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 text-center bg-[#2196F3] hover:bg-[#1976D2] text-white font-black py-3 rounded-xl border-2 border-[#4A3E26] shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5 transition-all"
                            >
                              🌐 访问产品
                            </a>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t-2 border-dashed border-[#4A3E26]/20">
                        <span className="text-xs font-bold text-[#8E6D3B]">
                          排序: #{previewWork.sortOrder}
                        </span>
                        <span className={`text-xs font-black px-3 py-1 rounded-full border-2 border-[#4A3E26] ${
                          previewWork.isPublic
                            ? 'bg-[#E8F5E9] text-[#2E7D32]'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {previewWork.isPublic ? '🌍 公开' : '🔒 私密'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'about' && (
          <>
            <div className="mb-8">
              <h2 className="text-2xl font-black text-[#4A3E26] mb-2">💼 能力技能管理</h2>
              <p className="text-sm text-[#8E6D3B] font-bold">管理个人能力技能卡片</p>
            </div>

            {!showSkillForm && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#8E6D3B]">共 {skills.length} 个技能</span>
                <button
                  type="button"
                  onClick={openCreateSkillForm}
                  className="bg-[#3BB4FE] hover:bg-[#1fa1ef] active:translate-y-0.5 border-4 border-[#4A3E26] text-white font-black px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  新增技能
                </button>
              </div>
            )}

            {showSkillForm && (
              <div className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[6px_6px_0_0_#4A3E26] mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[#4A3E26]">
                    {editingSkill ? '✏️ 编辑技能' : '✨ 新增技能'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetSkillForm}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[#4A3E26]" />
                  </button>
                </div>

                <form onSubmit={handleSkillSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">图标</label>
                      <input
                        type="text"
                        value={skillFormData.icon}
                        onChange={(e) => setSkillFormData(prev => ({ ...prev, icon: e.target.value }))}
                        placeholder="例如：📊"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">图标背景色</label>
                      <input
                        type="color"
                        value={skillFormData.iconBgColor}
                        onChange={(e) => setSkillFormData(prev => ({ ...prev, iconBgColor: e.target.value }))}
                        className="w-full bg-white border-2 border-[#4A3E26] px-2 py-1 rounded-xl cursor-pointer"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">标签</label>
                      <input
                        type="text"
                        value={skillFormData.label}
                        onChange={(e) => setSkillFormData(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="例如：核心技能一"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">排序</label>
                      <input
                        type="number"
                        value={skillFormData.sortOrder}
                        onChange={(e) => setSkillFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">标题 *</label>
                    <input
                      type="text"
                      value={skillFormData.title}
                      onChange={(e) => setSkillFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="例如：[ 财务与审计基础 ]"
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">描述</label>
                    <textarea
                      value={skillFormData.description}
                      onChange={(e) => setSkillFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="详细描述这个技能..."
                      rows={4}
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetSkillForm}
                      className="bg-white hover:bg-gray-100 border-4 border-[#4A3E26] text-[#4A3E26] font-black px-4 py-2 rounded-xl shadow-[2px_2px_0_0_#4A3E26] transition-all text-sm"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-[#3BB4FE] hover:bg-[#1fa1ef] disabled:bg-gray-400 disabled:cursor-not-allowed active:translate-y-0.5 border-4 border-[#4A3E26] text-white font-black px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all text-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showSkillForm && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {skills.map(skill => (
                  <div
                    key={skill.id}
                    className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[4px_4px_0_0_#4A3E26] flex flex-col gap-4"
                  >
                    <div
                      className="w-12 h-12 rounded-2xl border-2 border-[#4A3E26] flex items-center justify-center text-2xl shadow-[2px_2px_0_0_#4A3E26]"
                      style={{ backgroundColor: skill.iconBgColor }}
                    >
                      {skill.icon}
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs text-[#8E6D3B] font-bold">{skill.label}</p>
                      <h3 className="text-xl font-black text-[#4A3E26]">{skill.title}</h3>
                    </div>
                    <p className="text-sm text-[#665B45] leading-relaxed flex-1">{skill.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-[#4A3E26]/20">
                      <span className="text-xs font-bold text-[#8E6D3B]">排序: #{skill.sortOrder}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditSkillForm(skill)}
                          className="p-1.5 hover:bg-[#D4F0FC] rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-[#3BB4FE]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteSkill(skill.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-[#FF6B4A]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8 pt-8 border-t-4 border-dashed border-[#4A3E26]">
              <h2 className="text-2xl font-black text-[#4A3E26] mb-2">📅 成长经历管理</h2>
              <p className="text-sm text-[#8E6D3B] font-bold">管理个人成长经历卡片</p>
            </div>

            {!showGrowthForm && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#8E6D3B]">共 {growthItems.length} 条经历</span>
                <button
                  type="button"
                  onClick={openCreateGrowthForm}
                  className="bg-[#FF6B4A] hover:bg-[#e45131] active:translate-y-0.5 border-4 border-[#4A3E26] text-white font-black px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  新增经历
                </button>
              </div>
            )}

            {showGrowthForm && (
              <div className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[6px_6px_0_0_#4A3E26] mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[#4A3E26]">
                    {editingGrowth ? '✏️ 编辑成长经历' : '✨ 新增成长经历'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetGrowthForm}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[#4A3E26]" />
                  </button>
                </div>

                <form onSubmit={handleGrowthSubmit} className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">时间段</label>
                      <input
                        type="text"
                        value={growthFormData.period}
                        onChange={(e) => setGrowthFormData(prev => ({ ...prev, period: e.target.value }))}
                        placeholder="例如：2021 — 2025"
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">时间段背景色</label>
                      <input
                        type="color"
                        value={growthFormData.periodBgColor}
                        onChange={(e) => setGrowthFormData(prev => ({ ...prev, periodBgColor: e.target.value }))}
                        className="w-full bg-white border-2 border-[#4A3E26] px-2 py-1 rounded-xl cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">排序</label>
                      <input
                        type="number"
                        value={growthFormData.sortOrder}
                        onChange={(e) => setGrowthFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 0 }))}
                        className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">标题 *</label>
                    <input
                      type="text"
                      value={growthFormData.title}
                      onChange={(e) => setGrowthFormData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="例如：学生时代：专业积累"
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">副标题</label>
                    <input
                      type="text"
                      value={growthFormData.subtitle}
                      onChange={(e) => setGrowthFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                      placeholder="例如：建立金融基础"
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A]"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">描述</label>
                    <textarea
                      value={growthFormData.description}
                      onChange={(e) => setGrowthFormData(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="详细描述这段成长经历..."
                      rows={4}
                      className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#FF6B4A] resize-none"
                    />
                  </div>

                  <div className="flex justify-end gap-4 pt-4">
                    <button
                      type="button"
                      onClick={resetGrowthForm}
                      className="bg-white hover:bg-gray-100 border-4 border-[#4A3E26] text-[#4A3E26] font-black px-4 py-2 rounded-xl shadow-[2px_2px_0_0_#4A3E26] transition-all text-sm"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-[#FF6B4A] hover:bg-[#e45131] disabled:bg-gray-400 disabled:cursor-not-allowed active:translate-y-0.5 border-4 border-[#4A3E26] text-white font-black px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all text-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showGrowthForm && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {growthItems.map(growth => (
                  <div
                    key={growth.id}
                    className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[4px_4px_0_0_#4A3E26]"
                  >
                    <span
                      className="text-xs border-2 border-[#4A3E26] px-2.5 py-1 rounded-full font-black text-[#4A3E26]"
                      style={{ backgroundColor: growth.periodBgColor }}
                    >
                      {growth.period}
                    </span>
                    <h3 className="text-xl font-black text-[#4A3E26] mt-4 mb-2">{growth.title}</h3>
                    <p className="text-sm font-bold text-[#8E6D3B] mb-2">{growth.subtitle}</p>
                    <p className="text-sm text-[#665B45] leading-relaxed mb-4">{growth.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-dashed border-[#4A3E26]/20">
                      <span className="text-xs font-bold text-[#8E6D3B]">排序: #{growth.sortOrder}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditGrowthForm(growth)}
                          className="p-1.5 hover:bg-[#D4F0FC] rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-[#3BB4FE]" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteGrowth(growth.id)}
                          className="p-1.5 hover:bg-red-100 rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-[#FF6B4A]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="mb-8 pt-8 border-t-4 border-dashed border-[#4A3E26]">
              <h2 className="text-2xl font-black text-[#4A3E26] mb-2">📚 学习计划管理</h2>
              <p className="text-sm text-[#8E6D3B] font-bold">管理个人学习计划卡片</p>
            </div>

            {!showLearningForm && (
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[#8E6D3B]">共 {learningItems.length} 个学习计划</span>
                <button
                  type="button"
                  onClick={openCreateLearningForm}
                  className="bg-[#3BEA72] hover:bg-[#2dd35f] active:translate-y-0.5 border-4 border-[#4A3E26] text-[#4A3E26] font-black px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all flex items-center gap-2 text-sm"
                >
                  <Plus className="w-4 h-4" />
                  新增学习计划
                </button>
              </div>
            )}

            {showLearningForm && (
              <div className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-5 md:p-7 shadow-[6px_6px_0_0_#4A3E26] mb-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-[#4A3E26]">
                    {editingLearning ? '✏️ 编辑学习计划' : '✨ 新增学习计划'}
                  </h3>
                  <button
                    type="button"
                    onClick={resetLearningForm}
                    className="p-2 hover:bg-red-100 rounded-xl transition-colors"
                  >
                    <X className="w-5 h-5 text-[#4A3E26]" />
                  </button>
                </div>

                <form onSubmit={handleLearningSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)] gap-7 items-start">
                    <div className="space-y-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">卡片标题 *</label>
                          <input
                            type="text"
                            value={learningFormData.title}
                            onChange={(e) => setLearningFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="例如：AI 协作实践"
                            className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                          />
                        </div>
                        <div>
                          <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">底部状态</label>
                          <input
                            type="text"
                            value={learningFormData.status}
                            onChange={(e) => setLearningFormData(prev => ({ ...prev, status: e.target.value }))}
                            placeholder="例如：持续探索中"
                            className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">卡片简介</label>
                        <textarea
                          value={learningFormData.description}
                          onChange={(e) => setLearningFormData(prev => ({ ...prev, description: e.target.value }))}
                          placeholder="概括这一组学习计划..."
                          rows={3}
                          className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#3BB4FE] resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">主题颜色</label>
                          <div className="flex gap-2">
                            <input
                              type="color"
                              value={learningFormData.color}
                              onChange={(e) => setLearningFormData(prev => ({ ...prev, color: e.target.value }))}
                              className="w-14 bg-white border-2 border-[#4A3E26] p-1 rounded-xl cursor-pointer"
                            />
                            <input
                              type="text"
                              value={learningFormData.color}
                              onChange={(e) => setLearningFormData(prev => ({ ...prev, color: e.target.value }))}
                              className="min-w-0 flex-1 bg-white border-2 border-[#4A3E26] px-3 py-2.5 rounded-xl text-sm font-mono font-bold text-[#4A3E26]"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider">卡片编号 / 排序</label>
                          <input
                            type="number"
                            min="1"
                            value={learningFormData.sortOrder}
                            onChange={(e) => setLearningFormData(prev => ({ ...prev, sortOrder: parseInt(e.target.value) || 1 }))}
                            className="w-full bg-white border-2 border-[#4A3E26] px-4 py-2.5 rounded-xl text-sm font-bold text-[#4A3E26] focus:outline-none focus:ring-2 focus:ring-[#3BB4FE]"
                          />
                        </div>
                      </div>

                      <div className="pt-2">
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div>
                            <h4 className="font-black text-[#4A3E26]">学习任务清单</h4>
                            <p className="text-xs text-[#8E6D3B] font-bold">每一项对应首页卡片中的一个圆点任务</p>
                          </div>
                          <button
                            type="button"
                            onClick={addLearningNode}
                            className="shrink-0 bg-[#D4F0FC] hover:bg-[#bfe9fb] border-2 border-[#4A3E26] text-[#4A3E26] font-black px-3 py-2 rounded-xl shadow-[2px_2px_0_0_#4A3E26] text-xs flex items-center gap-1"
                          >
                            <Plus className="w-4 h-4" />
                            添加任务
                          </button>
                        </div>

                        <div className="space-y-4">
                          {learningFormData.nodes.map((node, index) => (
                            <div key={node.id} className="bg-white border-2 border-[#4A3E26] rounded-2xl p-4 shadow-[2px_2px_0_0_#4A3E26]">
                              <div className="flex items-center justify-between gap-3 mb-3">
                                <span className="text-xs font-black px-2 py-1 rounded-full" style={{ backgroundColor: `${learningFormData.color}25`, color: learningFormData.color }}>
                                  任务 {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="flex items-center gap-1">
                                  <button type="button" onClick={() => moveLearningNode(index, -1)} disabled={index === 0} className="px-2 py-1 text-xs font-black rounded-lg hover:bg-[#D4F0FC] disabled:opacity-30">↑</button>
                                  <button type="button" onClick={() => moveLearningNode(index, 1)} disabled={index === learningFormData.nodes.length - 1} className="px-2 py-1 text-xs font-black rounded-lg hover:bg-[#D4F0FC] disabled:opacity-30">↓</button>
                                  <button type="button" onClick={() => removeLearningNode(index)} className="p-1.5 rounded-lg hover:bg-red-100" title="删除任务">
                                    <Trash2 className="w-4 h-4 text-[#FF6B4A]" />
                                  </button>
                                </div>
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                <input
                                  type="text"
                                  value={node.title}
                                  onChange={(e) => updateLearningNode(index, { title: e.target.value })}
                                  placeholder="任务标题，例如：把逻辑画清楚"
                                  className="bg-[#FCF9EE] border-2 border-[#4A3E26]/60 px-3 py-2 rounded-xl text-sm font-bold text-[#4A3E26]"
                                />
                                <input
                                  type="text"
                                  value={node.tool}
                                  onChange={(e) => updateLearningNode(index, { tool: e.target.value })}
                                  placeholder="简短说明，例如：AI + draw.io"
                                  className="bg-[#FCF9EE] border-2 border-[#4A3E26]/60 px-3 py-2 rounded-xl text-sm font-bold"
                                  style={{ color: learningFormData.color }}
                                />
                              </div>

                              <textarea
                                value={node.description}
                                onChange={(e) => updateLearningNode(index, { description: e.target.value })}
                                placeholder="展开任务时显示的详细说明..."
                                rows={2}
                                className="w-full mt-3 bg-[#FCF9EE] border-2 border-[#4A3E26]/60 px-3 py-2 rounded-xl text-sm text-[#4A3E26] resize-none"
                              />

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                                <input
                                  type="text"
                                  value={node.tags.join(', ')}
                                  onChange={(e) => updateLearningNode(index, { tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean) })}
                                  placeholder="标签，用英文逗号分隔"
                                  className="bg-[#FCF9EE] border-2 border-[#4A3E26]/60 px-3 py-2 rounded-xl text-xs font-bold text-[#4A3E26]"
                                />
                                <input
                                  type="url"
                                  value={node.link || ''}
                                  onChange={(e) => updateLearningNode(index, { link: e.target.value })}
                                  placeholder="相关链接（可选）"
                                  className="bg-[#FCF9EE] border-2 border-[#4A3E26]/60 px-3 py-2 rounded-xl text-xs font-bold text-[#4A3E26]"
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="xl:sticky xl:top-28">
                      <p className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider mb-3">首页效果实时预览</p>
                      <ThemePath
                        id={learningFormData.sortOrder || 1}
                        title={learningFormData.title || '学习计划标题'}
                        description={learningFormData.description || '这里会显示这张卡片的简介。'}
                        color={learningFormData.color}
                        status={learningFormData.status || '持续探索中'}
                        nodes={learningFormData.nodes.filter(node => node.title.trim())}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-4 pt-5 border-t-2 border-dashed border-[#4A3E26]/20">
                    <button
                      type="button"
                      onClick={resetLearningForm}
                      className="bg-white hover:bg-gray-100 border-4 border-[#4A3E26] text-[#4A3E26] font-black px-4 py-2 rounded-xl shadow-[2px_2px_0_0_#4A3E26] transition-all text-sm"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="bg-[#3BEA72] hover:bg-[#2dd35f] disabled:bg-gray-400 disabled:cursor-not-allowed active:translate-y-0.5 border-4 border-[#4A3E26] text-[#4A3E26] font-black px-4 py-2 rounded-xl shadow-[4px_4px_0_0_#4A3E26] transition-all text-sm flex items-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {isSaving ? '保存中...' : '保存'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {!showLearningForm && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
                {learningItems.map(learning => (
                  <div
                    key={learning.id}
                    className="flex flex-col gap-3"
                  >
                    <ThemePath
                      id={learning.sortOrder}
                      title={learning.title}
                      description={learning.description}
                      color={learning.color}
                      status={learning.status}
                      nodes={learning.nodes}
                    />
                    <div className="flex items-center justify-between bg-white border-2 border-[#4A3E26] rounded-xl px-4 py-2 shadow-[2px_2px_0_0_#4A3E26]">
                      <span className="text-xs font-bold text-[#8E6D3B]">{learning.nodes.length} 个任务 · 排序 #{learning.sortOrder}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => openEditLearningForm(learning)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#D4F0FC] hover:bg-[#bfe9fb] border-2 border-[#4A3E26] rounded-lg text-xs font-black text-[#4A3E26]"
                          title="编辑"
                        >
                          <Edit2 className="w-4 h-4 text-[#3BB4FE]" />
                          编辑
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLearning(learning.id)}
                          className="p-2 hover:bg-red-100 border-2 border-transparent hover:border-[#4A3E26] rounded-lg transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4 text-[#FF6B4A]" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
