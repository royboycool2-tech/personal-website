import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Bookmark,
  Search,
  MoreHorizontal,
  Sparkles,
  Heart,
  ExternalLink,
  MessageSquare,
  Check,
  Volume2,
  Lightbulb,
  Camera,
  Layers,
  ArrowRight,
  Smartphone,
  Tag
} from 'lucide-react';
import AdminLogin from './components/AdminLogin';
import AdminPanel from './components/AdminPanel';
import ThemePath from './components/ThemePath';
import {
  authService,
  apiService,
  StatsSummary,
  Work,
  Skill,
  Growth,
  Learning,
  SiteContent,
  DEFAULT_SITE_CONTENT
} from './services/api';

// Define Interface for Sticky Notes
interface StickyNote {
  id: string;
  nickname: string;
  content: string;
  color: string;
  emoji: string;
  createdAt: string;
  rotation: number;
}

// Define Interface for Life Fragments
interface LifeFragment {
  id: string;
  title: string;
  content: string;
  date: string;
  category: 'photo' | 'diary' | 'moment';
  location?: string;
  mood?: string;
  weather?: string;
  tags: string[];
  images: string[];
  isPublic: boolean;
}

// Define Interface for Daily Memory
interface DailyMemory {
  id: string;
  date: string;
  image: string;
  quote: string;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'home' | 'about' | 'works' | 'life'>(() => {
    const savedTab = localStorage.getItem('sijin_active_tab');
    return (savedTab as 'home' | 'about' | 'works' | 'life') || 'home';
  });
  const [screenTab, setScreenTab] = useState<'about' | 'life' | 'works'>('about');
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);
  const [selectedFragment, setSelectedFragment] = useState<LifeFragment | null>(null);

  const [isAdminRoute, setIsAdminRoute] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [statsSummary, setStatsSummary] = useState<StatsSummary | null>(null);
  const [isLoadingFragments, setIsLoadingFragments] = useState(false);
  const [worksList, setWorksList] = useState<Work[]>([]);
  const [isLoadingWorks, setIsLoadingWorks] = useState(false);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [growthItems, setGrowthItems] = useState<Growth[]>([]);
  const [learningItems, setLearningItems] = useState<Learning[]>([]);
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);

  const checkAdminRoute = () => {
    const path = window.location.pathname;
    setIsAdminRoute(path.startsWith('/admin'));
  };

  useEffect(() => {
    checkAdminRoute();
    const handlePopState = () => checkAdminRoute();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    localStorage.setItem('sijin_active_tab', activeTab);
    const frame = window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    });
    return () => window.cancelAnimationFrame(frame);
  }, [activeTab]);

  const navigateToAdmin = () => {
    window.history.pushState({}, '', '/admin');
    setIsAdminRoute(true);
  };

  const navigateToTabTop = (tab: 'home' | 'about' | 'works' | 'life') => {
    setActiveTab(tab);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
      });
    });
  };

  const verifyAdminStatus = async () => {
    if (!authService.getToken()) {
      setIsAdminVerified(false);
      return;
    }
    const valid = await apiService.verifyToken();
    setIsAdminVerified(valid);
    if (!valid) {
      authService.logout();
    }
  };

  useEffect(() => {
    if (isAdminRoute && authService.isLoggedIn()) {
      verifyAdminStatus();
    }
  }, [isAdminRoute]);

  const loadStatsSummary = async () => {
    try {
      const stats = await apiService.getStatsSummary();
      setStatsSummary(stats);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const loadLifeFragments = async () => {
    setIsLoadingFragments(true);
    try {
      const fragments = await apiService.getPublicFragments();
      setLifeFragments(fragments);
    } catch (err) {
      console.error('Failed to load fragments:', err);
    } finally {
      setIsLoadingFragments(false);
    }
  };

  const loadWorks = async () => {
    setIsLoadingWorks(true);
    try {
      const works = await apiService.getPublicWorks();
      setWorksList(works);
    } catch (err) {
      console.error('Failed to load works:', err);
    } finally {
      setIsLoadingWorks(false);
    }
  };

  const loadSkills = async () => {
    try {
      const skillsData = await apiService.getSkills();
      setSkills(skillsData);
    } catch (err) {
      console.error('Failed to load skills:', err);
    }
  };

  const loadGrowth = async () => {
    try {
      const growthData = await apiService.getGrowth();
      setGrowthItems(growthData);
    } catch (err) {
      console.error('Failed to load growth:', err);
    }
  };

  const loadLearning = async () => {
    try {
      const learningData = await apiService.getLearning();
      setLearningItems(learningData);
    } catch (err) {
      console.error('Failed to load learning:', err);
    }
  };

  const loadSiteContent = async () => {
    try {
      const content = await apiService.getSiteContent();
      setSiteContent(content);
    } catch (err) {
      console.error('Failed to load page content:', err);
    }
  };

  useEffect(() => {
    if (!isAdminRoute) {
      loadSiteContent();
      loadLifeFragments();
      loadStatsSummary();
      loadSkills();
      loadGrowth();
      loadLearning();
      loadWorks();
    }
  }, [isAdminRoute]);

  // Guestbook States
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [newNickname, setNewNickname] = useState('');
  const [newContent, setNewContent] = useState('');
  const [selectedColor, setSelectedColor] = useState('#FFF9BB'); // default yellow
  const [selectedEmoji, setSelectedEmoji] = useState('✨');
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);

  // Life Fragment States
  const [showPostForm, setShowPostForm] = useState(false);
  const [currentMemoryIndex, setCurrentMemoryIndex] = useState(0);
  const [lastMemoryIndex, setLastMemoryIndex] = useState<number | null>(null);
  const [lifeFragments, setLifeFragments] = useState<LifeFragment[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'photo' | 'diary' | 'moment'>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [viewMonthFilter, setViewMonthFilter] = useState(false);

  useEffect(() => {
    if (selectedWork || selectedFragment) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [selectedWork, selectedFragment]);

  const photoMemories = lifeFragments
    .filter(f => f.images.length > 0 && f.isPublic)
    .flatMap(fragment => 
      fragment.images.map((img, idx) => ({
        id: `${fragment.id}-${idx}`,
        date: fragment.date,
        image: img,
        quote: fragment.title
      }))
    );

  const dailyMemories = photoMemories.length > 0 ? photoMemories : [{
    id: 'fallback-memory',
    date: siteContent.life.fallbackMemoryDate,
    image: siteContent.life.fallbackMemoryImage,
    quote: siteContent.life.fallbackMemoryQuote
  }];

  // Interactive Work Settings (for details popup)
  const [sunsetGlow, setSunsetGlow] = useState(60);

  const colorPresets = [
    { name: '温暖黄', value: '#FFF9BB' },
    { name: '樱花粉', value: '#FFD1DC' },
    { name: '薄荷绿', value: '#D6F6D5' },
    { name: '晴空蓝', value: '#D4F0FC' },
    { name: '香芋紫', value: '#E8DFF5' }
  ];

  const emojiPresets = ['✨', '🌸', '☕', '🐱', '🚀', '🎨', '🔥', '💡', '🌟', '🍀'];

  // Initialize and load sticky notes from backend
  useEffect(() => {
    const loadNotes = async () => {
      try {
        const data = await apiService.getGuestbookNotes();
        setNotes(data);
      } catch (err) {
        console.log('Failed to load guestbook notes, fallback to localStorage');
        const savedNotes = localStorage.getItem('zhang_xiaoke_notes');
        if (savedNotes) {
          const parsed = JSON.parse(savedNotes);
          const filtered = parsed.filter((note: StickyNote) => !note.id.startsWith('seed-'));
          setNotes(filtered);
        }
      }
    };
    loadNotes();
  }, []);

  // Handle Daily Memory Shuffle
  const shuffleMemory = () => {
    if (dailyMemories.length <= 1) return;
    let newIndex;
    const avoidIndex = lastMemoryIndex !== null ? lastMemoryIndex : currentMemoryIndex;
    do {
      newIndex = Math.floor(Math.random() * dailyMemories.length);
    } while (newIndex === avoidIndex);
    setLastMemoryIndex(currentMemoryIndex);
    setCurrentMemoryIndex(newIndex);
  };

  const getFragmentByImageId = (imageId: string): LifeFragment | undefined => {
    const fragmentId = imageId.split('-').slice(0, -1).join('-');
    return lifeFragments.find(f => f.id === fragmentId);
  };

  const handleMemoryImageClick = () => {
    const memory = dailyMemories[currentMemoryIndex];
    const fragment = getFragmentByImageId(memory.id);
    if (fragment) {
      setSelectedFragment(fragment);
    }
  };

  // Category counts
  const categoryCounts = {
    all: lifeFragments.length,
    photo: lifeFragments.filter(f => f.category === 'photo').length,
    diary: lifeFragments.filter(f => f.category === 'diary').length,
    moment: lifeFragments.filter(f => f.category === 'moment').length,
  };

  // Is current month filter active
  const isCurrentMonth = (dateStr: string): boolean => {
    const now = new Date();
    const date = new Date(dateStr.replace(/\./g, '-'));
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  };

  // Filtered and sorted fragments
  const filteredFragments = (() => {
    let result = [...lifeFragments];
    
    if (selectedCategory !== 'all') {
      result = result.filter(f => f.category === selectedCategory);
    }
    
    if (viewMonthFilter) {
      result = result.filter(f => isCurrentMonth(f.date));
    }
    
    result.sort((a, b) => {
      const dateA = new Date(a.date.replace(/\./g, '-')).getTime();
      const dateB = new Date(b.date.replace(/\./g, '-')).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    
    return result;
  })();

  // Handle Sticky Note Submission
  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newNickname.trim() || !newContent.trim()) return;

    const newNote: StickyNote = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      nickname: newNickname.trim(),
      content: newContent.trim(),
      color: selectedColor,
      emoji: selectedEmoji,
      createdAt: new Date().toISOString(),
      rotation: Math.random() * 6 - 3
    };

    setNotes(prev => {
      const updatedNotes = [newNote, ...prev];
      localStorage.setItem('zhang_xiaoke_notes', JSON.stringify(updatedNotes));
      return updatedNotes;
    });
    setNewContent('');
    setNewNickname('');
    setSelectedColor('#FFF9BB');
    setSelectedEmoji('✨');
    setIsSubmitSuccess(true);
    setTimeout(() => setIsSubmitSuccess(false), 3000);

    apiService.createGuestbookNote({
      nickname: newNote.nickname,
      content: newNote.content,
      color: newNote.color,
      emoji: newNote.emoji
    }).catch(err => {
      console.log('Backend sync failed, keeping local copy.');
    });
  };

  const mobileWeightReduction = siteContent.typography.mobileAutoLighten ? 100 : 0;
  const typographyVariables = {
    '--site-hero-size': `${siteContent.typography.heroSize}px`,
    '--site-display-size': `${siteContent.typography.displaySize}px`,
    '--site-heading-size': `${siteContent.typography.headingSize}px`,
    '--site-body-size': `${siteContent.typography.bodySize}px`,
    '--site-helper-size': `${siteContent.typography.helperSize}px`,
    '--site-mobile-hero-size': `${Math.min(64, Math.max(40, Math.round(siteContent.typography.heroSize * 0.58)))}px`,
    '--site-mobile-display-size': `${Math.min(48, Math.max(28, Math.round(siteContent.typography.displaySize * 0.68)))}px`,
    '--site-mobile-heading-size': `${Math.max(18, Math.round(siteContent.typography.headingSize * 0.9))}px`,
    '--site-mobile-body-size': `${siteContent.typography.bodySize}px`,
    '--site-mobile-helper-size': `${siteContent.typography.helperSize}px`,
    '--site-display-weight': siteContent.typography.displayWeight,
    '--site-heading-weight': siteContent.typography.headingWeight,
    '--site-body-weight': siteContent.typography.bodyWeight,
    '--site-helper-weight': siteContent.typography.helperWeight,
    '--site-mobile-display-weight': Math.max(100, siteContent.typography.displayWeight - mobileWeightReduction),
    '--site-mobile-heading-weight': Math.max(100, siteContent.typography.headingWeight - mobileWeightReduction),
    '--site-mobile-body-weight': Math.max(100, siteContent.typography.bodyWeight - mobileWeightReduction),
    '--site-mobile-helper-weight': Math.max(100, siteContent.typography.helperWeight - mobileWeightReduction),
  } as React.CSSProperties;

  if (isAdminRoute) {
    if (isAdminVerified || authService.isLoggedIn()) {
      return (
        <AdminPanel
          onLogout={() => {
            authService.logout();
            setIsAdminVerified(false);
          }}
        />
      );
    }
    return (
      <AdminLogin
        onLoginSuccess={() => {
          setIsAdminVerified(true);
        }}
      />
    );
  }

  return (
    <div
      id="personal_website_container"
      style={typographyVariables}
      className="site-typography site-copy-font min-h-screen bg-[#FCF9EE] text-[#4A3E26] font-display selection:bg-[#3BB4FE] selection:text-white flex flex-col justify-between overflow-x-hidden pb-12"
    >
      
      {/* TOP SYSTEM NAV BAR (Mustard yellow top plate styled retro block style) */}
      <header id="website_header" className="bg-[#F3C556] border-b-4 border-[#4A3E26] px-4 py-3 flex items-center gap-4 shadow-[0_4px_0_0_#4A3E26] sticky top-0 z-50">
        <div className="w-10"></div>

        {/* Floating Custom Navigation Tabs */}
        <nav id="main_navigation_tabs" className="hidden md:flex justify-center gap-2 flex-1 bg-[#FFFDE5] border-2 border-[#4A3E26] rounded-full p-1.5 shadow-[2px_2px_0_0_#4A3E26]">
          <button
            id="tab_home_btn"
            onClick={() => { setActiveTab('home'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 rounded-full font-bold text-lg transition-all ${
              activeTab === 'home' ? 'bg-[#3BB4FE] text-white border-2 border-[#4A3E26] -my-1' : 'text-[#4A3E26] hover:bg-[#FFF9BB]'
            }`}
          >
            首页 (Home)
          </button>
          <button
            id="tab_about_btn"
            onClick={() => { setActiveTab('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 rounded-full font-bold text-lg transition-all ${
              activeTab === 'about' ? 'bg-[#3BB4FE] text-white border-2 border-[#4A3E26] -my-1' : 'text-[#4A3E26] hover:bg-[#FFF9BB]'
            }`}
          >
            关于我 (About Me)
          </button>
          <button
            id="tab_life_btn"
            onClick={() => { setActiveTab('life'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 rounded-full font-bold text-lg transition-all ${
              activeTab === 'life' ? 'bg-[#3BB4FE] text-white border-2 border-[#4A3E26] -my-1' : 'text-[#4A3E26] hover:bg-[#FFF9BB]'
            }`}
          >
            生活碎片 & 留言板 (Life & Guestbook)
          </button>
          <button
            id="tab_works_btn"
            onClick={() => { setActiveTab('works'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className={`px-6 py-2 rounded-full font-bold text-lg transition-all ${
              activeTab === 'works' ? 'bg-[#3BB4FE] text-white border-2 border-[#4A3E26] -my-1' : 'text-[#4A3E26] hover:bg-[#FFF9BB]'
            }`}
          >
            我的作品 (My Works)
          </button>
        </nav>

      </header>

      {/* MOBILE FLOATING NAV BAR */}
      <div id="mobile_nav_container" className="md:hidden sticky top-[60px] mx-4 mt-3 bg-[#F3C556] border-4 border-[#4A3E26] rounded-2xl p-2 flex justify-around items-center z-40 shadow-[0_5px_0_0_#4A3E26]">
        <button
          onClick={() => navigateToTabTop('home')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
            activeTab === 'home' ? 'bg-[#FFFDE5] text-[#3BB4FE] border-2 border-[#4A3E26] scale-105' : 'text-[#4A3E26]'
          }`}
        >
          <span className="text-xs font-black">Aa</span>
          <span className="text-[10px] font-bold">首页</span>
        </button>
        <button
          onClick={() => navigateToTabTop('about')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
            activeTab === 'about' ? 'bg-[#FFFDE5] text-[#3BB4FE] border-2 border-[#4A3E26] scale-105' : 'text-[#4A3E26]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span className="text-[10px] font-bold">关于我</span>
        </button>
        <button
          onClick={() => navigateToTabTop('life')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
            activeTab === 'life' ? 'bg-[#FFFDE5] text-[#3BB4FE] border-2 border-[#4A3E26] scale-105' : 'text-[#4A3E26]'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span className="text-[10px] font-bold">碎片&留言</span>
        </button>
        <button
          onClick={() => navigateToTabTop('works')}
          className={`flex flex-col items-center gap-0.5 p-1.5 rounded-xl transition-all ${
            activeTab === 'works' ? 'bg-[#FFFDE5] text-[#3BB4FE] border-2 border-[#4A3E26] scale-105' : 'text-[#4A3E26]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span className="text-[10px] font-bold">我的作品</span>
        </button>
      </div>

      {/* MAIN CONTAINER */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 flex-1 w-full">

        {/* ----------------- TAB 1: HOME (首页) ----------------- */}
        {activeTab === 'home' && (
          <div id="home_tab_view" data-site-page="home" className="site-page site-page-home space-y-4 animate-fadeIn">
            {/* Display Big Bold Heading - Hey,buddy! */}
            <div className="relative text-center pt-1 pb-0">
              <h1 className="site-hero-title text-7xl sm:text-8xl md:text-9xl font-black text-[#3BB4FE] italic tracking-tight font-display select-none leading-none">
                {siteContent.home.heroTitle}
              </h1>
              {/* Spiky Blue badge overlay */}
              <div className="absolute right-4 md:right-16 top-0 transform translate-y-12 animate-float">
                <div className="relative w-16 h-16 bg-[#3BB4FE] border-4 border-[#4A3E26] flex items-center justify-center shadow-[3px_3px_0_0_#4A3E26]" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}>
                  <span className="text-white font-handwriting text-xs font-bold rotate-12">✨</span>
                </div>
              </div>
            </div>

            {/* Visual Bento Arrangement (Screenshot 1 setup) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-0">
              
              {/* Left Polaroid Card - Male Portrait wearing Baseball Cap */}
              <div className="lg:col-span-3 flex justify-center lg:justify-start">
                <div className="polaroid-tilt-left bg-white border-4 border-[#7CC8F2] p-4 pb-8 w-64 md:w-72 shadow-[6px_6px_0_0_#7CC8F2] flex flex-col gap-3 lg:-mt-[3cm]">
                  <div className="aspect-square bg-[#E8DFF5] border-2 border-[#4A3E26] overflow-hidden rounded">
                    <img 
                      src={siteContent.home.leftImage}
                      alt={siteContent.home.leftImageAlt}
                      className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                    />
                  </div>
                  <div className="border-t-2 border-dashed border-[#4A3E26] pt-3 text-center">
                    <p className="font-handwriting text-lg text-[#8E6D3B] font-bold">{siteContent.home.leftCaption}</p>
                  </div>
                </div>
              </div>

              {/* Center Hand-Drawn Retro Monitor and Keyboard */}
              <div className="-mt-2 lg:-mt-8 lg:col-span-6 flex flex-col items-center justify-center">
                
                {/* Hand-Drawn CRT Monitor Outer Shield */}
                <div className="relative w-80 sm:w-96 bg-[#F3C556] border-4 border-[#4A3E26] rounded-[3rem] p-6 shadow-[8px_8px_0_0_#4A3E26] flex flex-col gap-4">
                  
                  {/* Inside Cyber Screen (Cyan background with drawing squiggles) */}
                  <div className="bg-[#3BB4FE] border-4 border-[#4A3E26] rounded-2xl p-4 aspect-[4/3] flex flex-col justify-between relative overflow-hidden">
                    
                    {/* Retro lines pattern overlay */}
                    <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#000_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none"></div>

                    {/* Screen Content Area */}
                    <div className="flex-1 flex flex-col items-center justify-center text-white relative z-10 overflow-hidden">
                      {screenTab === 'about' && (
                        <div key="about" className="screen-content animate-fade-in text-center px-2">
                          <div className="text-4xl mb-3">👋</div>
                          <h3 className="font-handwriting text-xl font-black mb-4">{siteContent.home.screenAboutTitle}</h3>
                          <button 
                            onClick={() => navigateToTabTop('about')}
                            className="bg-white text-[#3BB4FE] px-4 py-1.5 rounded-full text-sm font-bold border-2 border-[#4A3E26] shadow-[2px_2px_0_0_#4A3E26] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#4A3E26] transition-all"
                          >
                            {siteContent.home.screenAboutButton}
                          </button>
                        </div>
                      )}
                      {screenTab === 'life' && (
                        <div key="life" className="screen-content animate-fade-in text-center px-2">
                          <div className="text-4xl mb-3">📸</div>
                          <h3 className="font-handwriting text-xl font-black mb-4">{siteContent.home.screenLifeTitle}</h3>
                          <button 
                            onClick={() => navigateToTabTop('life')}
                            className="bg-white text-[#3BB4FE] px-4 py-1.5 rounded-full text-sm font-bold border-2 border-[#4A3E26] shadow-[2px_2px_0_0_#4A3E26] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#4A3E26] transition-all"
                          >
                            {siteContent.home.screenLifeButton}
                          </button>
                        </div>
                      )}
                      {screenTab === 'works' && (
                        <div key="works" className="screen-content animate-fade-in text-center px-2">
                          <div className="text-4xl mb-3">🎨</div>
                          <h3 className="font-handwriting text-xl font-black mb-4">{siteContent.home.screenWorksTitle}</h3>
                          <button 
                            onClick={() => navigateToTabTop('works')}
                            className="bg-white text-[#3BB4FE] px-4 py-1.5 rounded-full text-sm font-bold border-2 border-[#4A3E26] shadow-[2px_2px_0_0_#4A3E26] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#4A3E26] transition-all"
                          >
                            {siteContent.home.screenWorksButton}
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Screen webcam avatars mockup - Now clickable buttons */}
                    <div className="flex justify-around items-end gap-2 pt-4 relative z-10">
                      <button 
                        onClick={() => setScreenTab('about')}
                        className={`transition-all duration-300 ${screenTab === 'about' ? 'scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] -translate-y-2' : 'hover:scale-110'}`}
                      >
                        <svg viewBox="0 0 1024 1024" className="w-8 h-8 fill-[#9B7FD1]">
                          <path d="M897.260308 805.100308c-74.436923-36.903385-109.489231-29.814154-165.96677-40.172308s-101.612308-3.780923-118.823384-36.233846a116.657231 116.657231 0 0 1-13.312-70.971077h68.923077c2.323692-0.551385 3.899077-1.378462 6.498461-1.811692 51.357538-8.192 101.769846-23.945846 157.538462-38.045539-66.481231-115.2-55.768615-236.937846-73.097846-352.413538-20.48-147.022769-118.153846-234.299077-246.390154-225.437539C384.393846 31.153231 286.72 118.390154 264.979692 265.452308c-17.329231 115.515077-6.616615 237.252923-73.097846 352.413538 57.028923 14.099692 107.441231 29.853538 157.538462 38.084923 2.638769 0.393846 4.214154 1.260308 6.57723 1.772308h50.215385c-0.590769 8.231385-7.246769 80.423385-61.755077 98.540308-57.816615 19.219692-246.941538 16.659692-284.238769 102.242461A208.384 208.384 0 0 0 42.929231 984.615385H984.615385s-12.996923-142.729846-87.355077-179.515077z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => setScreenTab('life')}
                        className={`transition-all duration-300 ${screenTab === 'life' ? 'scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] -translate-y-2' : 'hover:scale-110'}`}
                      >
                        <svg viewBox="0 0 1024 1024" className="w-8 h-8 fill-[#9cf1a2]">
                          <path d="M608.9 112c31.4 59.9 83.3 178.1 129.1 194.4 5.4-4.3 10.7-8.7 16.1-13.1 6.8-108.3 172.1-147.8 201.6-4.4 30.2 146.4-104.9 90.6-165.9 134.4 33.8 66.6 69.7 139.2 103.4 205.8-48.6 25.9-127.9 92.8-185.5 102.7-10.7-1.9-10.2-13.9-14-18.7C713 590.7 629.9 498.3 512 622.8c-97.4 103 100.5 154.8 89.6 183.9-58.1 35.9-118 69.4-176.1 105.2-40.1-64-80.9-130.9-121.1-194.9-8 3.6-16.1 7.2-24 10.8-24.8 87.3-154.5 178.5-207.4 18.5C29.8 615.4 152 621.4 223.5 614c4.6-3.9 9.1-7.7 13.6-11.7-35.6-67.8-74.8-137.1-110.5-205 61.5-35.6 124.7-74.6 186.3-110.3 48.9 51.3-26.4 172.4 100.6 169.7 80.5-1.8 154-106 98-178.3-31.1-17.8-75.3-15.7-85.3-39-10.1-23.4 2.5-15.5 3.7-23.3 60.4-33.9 118.7-70.4 179-104.1z"/>
                        </svg>
                      </button>
                      <button 
                        onClick={() => setScreenTab('works')}
                        className={`transition-all duration-300 ${screenTab === 'works' ? 'scale-125 drop-shadow-[0_0_8px_rgba(255,255,255,0.8)] -translate-y-2' : 'hover:scale-110'}`}
                      >
                        <svg viewBox="0 0 1136 1024" className="w-9 h-8 fill-[#dbdbdb]">
                          <path d="M265.49969068 634.20671297l226.98046212 101.72058835c13.73768206 5.94270525 20.22063285 9.9559604 33.95831491 9.9559604a66.21871393 66.21871393 0 0 0 33.26371298-8.79829075 26.39487161 26.39487161 0 0 1 4.01325517-2.23816145l214.32327253-90.1438899a27.47536342 27.47536342 0 0 1 20.83805694 0l75.32571605 30.94837302c18.13682709 7.48626476 18.29118345 29.86788122 0.30871205 37.50850235L537.70645411 856.86520857a27.16665206 27.16665206 0 0 1-21.45548101-0.15435635L178.28856414 707.3714461c-17.75093722-7.94933248-17.44222517-30.02223758 0.61742408-37.4313245l86.59370245-35.73340863z m-10.26467244-175.11685432a27.01229571 27.01229571 0 0 1 20.45216636 1e-8l222.27260572 90.99284749 2.85558551 0.92613613a109.74709868 109.74709868 0 0 0 62.05110241-1.0804918L777.96153056 459.24421434a27.47536342 27.47536342 0 0 1 20.83805626-0.15435569l76.17467432 31.41144074c17.98247141 7.40908693 18.36836129 29.55916918 0.61742408 37.35414666L537.78363194 677.27203068a26.93511786 26.93511786 0 0 1-21.68701453 0L178.28856414 527.9326239c-17.75093722-7.87215465-17.44222517-29.94505907 0.61742408-37.35414599zM516.32815162 166.58528454a27.39818558 27.39818558 0 0 1 21.1467683-1e-8L876.05475294 311.06247787c17.75093722 7.5634426 17.9052929 29.40481349 0.30871204 37.19979031l-338.57983304 149.72529666a26.93511786 26.93511786 0 0 1-21.68701453 0L177.43960654 348.18508966c-17.51940301-7.71779897-17.36504733-29.6363477 0.30871204-37.19978964z"/>
                        </svg>
                      </button>
                    </div>

                    {/* Small power led bulbs */}
                    <div className="absolute bottom-2 left-4 flex gap-1.5">
                    </div>
                  </div>

                  {/* Monitor Stand */}
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-20 h-8 bg-[#E5AA33] border-x-4 border-b-4 border-[#4A3E26] rounded-b-xl z-10 shadow-[2px_2px_0_0_#4A3E26]"></div>
                </div>

                {/* Keyboard and shadow area */}
                <div className="mt-10 flex flex-col items-center">
                  <div className="w-72 sm:w-80 h-10 bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-xl flex items-center justify-around px-4 shadow-[4px_4px_0_0_#4A3E26] relative z-20">
                    {/* Simulated hand drawn key blocks */}
                    {Array.from({ length: 8 }).map((_, i) => (
                      <span key={i} className="w-5 h-2 bg-[#F3C556] border-2 border-[#4A3E26] rounded-sm"></span>
                    ))}
                  </div>
                  {/* Keyboard shadow mousepad */}
                  <div className="w-80 sm:w-96 h-3 bg-[#3BB4FE] border-2 border-[#4A3E26] rounded-full mt-1"></div>
                </div>
              </div>

              {/* Right Side Cards: Beanie Portrait + Sticky Note */}
              <div className="lg:col-span-3 flex flex-col gap-8 items-center lg:items-end">
                
                {/* Polaroid 2 - Beanie portrait */}
                <div className="polaroid-tilt-right bg-white border-4 border-[#7CC8F2] p-4 pb-8 w-64 shadow-[6px_6px_0_0_#7CC8F2] flex flex-col gap-3 relative mt-8 lg:mt-12">
                  
                  {/* Spiky gear badge overlay on photo corner */}
                  <div className="absolute -top-6 -right-6 w-14 h-14 bg-[#3BB4FE] border-4 border-[#4A3E26] flex items-center justify-center animate-bounce" style={{ clipPath: 'polygon(50% 0%, 83% 12%, 100% 43%, 91% 78%, 61% 100%, 25% 91%, 0% 61%, 12% 25%)' }}>
                    <Heart className="w-6 h-6 text-[#FFF066] fill-[#FFF066]" />
                  </div>

                  <div className="aspect-square bg-[#FFE9A6] border-2 border-[#4A3E26] overflow-hidden rounded">
                    <img 
                      src={siteContent.home.rightImage}
                      alt={siteContent.home.rightImageAlt}
                      className="w-full h-full object-cover hover:scale-105 transition-all duration-300"
                    />
                  </div>
                  <div className="border-t-2 border-dashed border-[#4A3E26] pt-3 text-center">
                    <p className="font-handwriting text-lg text-[#8E6D3B] font-bold">{siteContent.home.rightCaption}</p>
                  </div>
                </div>

                {/* Hand-drawn yellow post-it note: "我的名字 四金" */}
                <div className="sticky-note-tilt bg-[#FFF9BB] border-4 border-[#4A3E26] p-4 w-56 shadow-[4px_4px_0_0_#4A3E26] relative">
                  {/* Red pin detail */}
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-red-500 border-2 border-[#4A3E26] rounded-full shadow-md"></div>
                  
                  <div className="text-center pt-1 font-display space-y-1">
                    <p className="text-[#8E6D3B] text-xs tracking-wider">{siteContent.home.creatorLabel}</p>
                    <h3 className="text-2xl font-black text-[#4A3E26]">{siteContent.home.creatorTitle}</h3>
                    <p className="text-3xl font-bold text-[#3BB4FE] font-handwriting mt-1">{siteContent.home.creatorName}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Slogan section and guided tour button */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t-4 border-dashed border-[#4A3E26]">
              <div className="text-center md:text-left space-y-1">
                <p className="text-xs text-[#8E6D3B] tracking-widest font-black uppercase">{siteContent.home.introEnglish}</p>
                <h3 className="text-2xl font-bold text-[#4A3E26] font-display">{siteContent.home.introChinese}</h3>
              </div>

              <button 
                onClick={() => { setActiveTab('about'); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                className="bg-[#F3C556] border-4 border-[#4A3E26] hover:bg-[#ebd54c] active:translate-y-1 text-[#4A3E26] font-black px-6 py-3.5 rounded-2xl flex items-center gap-2.5 shadow-[4px_4px_0_0_#4A3E26] transition-all whitespace-nowrap text-sm"
              >
                {siteContent.home.tourButton}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ----------------- TAB 2: ABOUT ME (关于我) ----------------- */}
        {activeTab === 'about' && (
          <div id="about_tab_view" data-site-page="about" className="site-page site-page-about space-y-16 animate-fadeIn">
            
            {/* Section A: Basic Introduction */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-10 items-center">
              
              <div className="md:col-span-7 space-y-6">
                <div className="flex items-center gap-2">
                  <h2 className="site-display-title text-5xl md:text-6xl font-black text-[#3BB4FE] tracking-tight uppercase">
                    {siteContent.about.heading} <span className="text-[#F3C556] font-normal animate-bounce-dot" style={{ animationDelay: '0s' }}>*</span>
                  </h2>
                </div>

                <div className="site-copy-font site-red-copy text-base md:text-lg leading-relaxed text-[#4A3E26] space-y-4">
                  <p className="font-bold text-2xl text-[#4A3E26]">
                    {siteContent.about.greeting}
                  </p>
                  {siteContent.about.paragraphs.map((paragraph, index) => (
                    <p
                      key={`${index}-${paragraph.slice(0, 12)}`}
                      className={
                        index === 0
                          ? 'site-about-main-copy text-[#8E6D3B]'
                          : index >= siteContent.about.paragraphs.length - 2
                            ? 'site-about-closing-copy font-bold'
                            : 'site-about-main-copy'
                      }
                    >
                      {paragraph}
                    </p>
                  ))}
                </div>
              </div>

              {/* Right Polaroid Photo framed style */}
              <div className="md:col-span-5 flex justify-center">
                <div className="polaroid-tilt-right bg-white border-4 border-[#4A3E26] p-4 pb-8 w-72 md:w-80 shadow-[8px_8px_0_0_#4A3E26] relative">
                  
                  {/* Heart Star badge overlay */}
                  <div className="absolute -top-6 -left-6 w-16 h-16 bg-[#3BB4FE] border-4 border-[#4A3E26] flex items-center justify-center animate-pulse" style={{ clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)' }}>
                    <Heart className="w-6 h-6 text-[#FFF066] fill-[#FFF066]" />
                  </div>

                  <div className="aspect-square bg-[#FFFDE5] border-2 border-[#4A3E26] overflow-hidden rounded mb-4">
                    <img 
                      src={siteContent.about.portraitImage}
                      alt={siteContent.about.portraitAlt}
                      className="w-full h-full object-cover filter saturate-105"
                    />
                  </div>
                  <div className="text-center font-handwriting text-xl text-[#8E6D3B] font-black">
                    {siteContent.about.portraitCaption}
                  </div>
                </div>
              </div>
            </div>

            {/* Section B: ABOUT SKILLS */}
            <div className="space-y-8 pt-8 border-t-4 border-dashed border-[#4A3E26] relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="site-display-title text-4xl md:text-5xl font-black text-[#3BB4FE] tracking-tight uppercase">
                    {siteContent.about.skillsHeading} <span className="text-[#F3C556] font-normal animate-bounce-dot" style={{ animationDelay: '0.15s' }}>*</span>
                  </h2>
                  <p className="text-sm text-[#8E6D3B] tracking-wider mt-1 uppercase font-bold">{siteContent.about.skillsSubtitle}</p>
                </div>
                {/* Handwritten script annotation */}
                <span className="font-handwriting text-4xl text-[#4A3E26] rotate-[-4deg] self-start sm:self-auto translate-y-2 select-none">
                  {siteContent.about.skillsScript}
                </span>
              </div>

              {/* Dynamic skill cards */}
              <div className="site-copy-font site-red-copy grid grid-cols-1 md:grid-cols-3 gap-6">
                {skills.map(skill => (
                  <div
                    key={skill.id}
                    className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[4px_4px_0_0_#4A3E26] flex flex-col gap-4 hover:-translate-y-1 transition-all duration-300"
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
                    <p className="text-sm text-[#665B45] leading-relaxed">
                      {skill.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Section C: ABOUT LEARNING */}
            <div className="site-copy-font site-red-copy space-y-16 pt-8 border-t-4 border-dashed border-[#4A3E26] relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="site-display-title text-4xl md:text-5xl font-black text-[#3BB4FE] tracking-tight uppercase">
                    {siteContent.about.learningHeading} <span className="text-[#F3C556] font-normal">*</span>
                  </h2>
                  <p className="text-sm text-[#8E6D3B] tracking-wider mt-1 uppercase font-bold">{siteContent.about.learningSubtitle}</p>
                  <p className="text-[#706A5E] leading-relaxed max-w-xl mt-2">
                    {siteContent.about.learningDescription}
                  </p>
                </div>
                <span className="font-handwriting text-4xl text-[#4A3E26] rotate-[-2deg] self-start sm:self-auto translate-y-2 select-none">
                  {siteContent.about.learningScript}
                </span>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {learningItems.map((learning, index) => (
                  <div key={learning.id}>
                    <ThemePath
                      id={learning.sortOrder || index + 1}
                      title={learning.title}
                      description={learning.description}
                      color={learning.color}
                      status={learning.status}
                      nodes={learning.nodes}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Section D: ABOUT GROWTH */}
            <div className="space-y-8 pt-8 border-t-4 border-dashed border-[#4A3E26] relative">
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                <div>
                  <h2 className="site-display-title text-4xl md:text-5xl font-black text-[#3BB4FE] tracking-tight uppercase">
                    {siteContent.about.growthHeading} <span className="text-[#F3C556] font-normal animate-bounce-dot" style={{ animationDelay: '0.45s' }}>*</span>
                  </h2>
                  <p className="text-sm text-[#8E6D3B] tracking-wider mt-1 uppercase font-bold">{siteContent.about.growthSubtitle}</p>
                </div>
                {/* Handwritten script annotation */}
                <span className="font-handwriting text-4xl text-[#4A3E26] rotate-[3deg] self-start sm:self-auto translate-y-2 select-none">
                  {siteContent.about.growthScript}
                </span>
              </div>

              {/* Dynamic growth cards */}
              <div className="site-copy-font site-red-copy grid grid-cols-1 md:grid-cols-3 gap-6">
                {growthItems.map((growth, index) => (
                  <div
                    key={growth.id}
                    className={`bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[4px_4px_0_0_#4A3E26] hover:-translate-y-1 hover:shadow-[6px_6px_0_0_#4A3E26] active:translate-y-1 active:shadow-[2px_2px_0_0_#4A3E26] cursor-pointer transition-all duration-300`}
                  >
                    <span
                      className="text-xs border-2 border-[#4A3E26] px-2.5 py-1 rounded-full font-black text-[#4A3E26]"
                      style={{ backgroundColor: growth.periodBgColor }}
                    >
                      {growth.period}
                    </span>
                    <h3 className="text-xl font-black text-[#4A3E26] mt-4 mb-2">{growth.title}</h3>
                    <p className="text-sm font-bold text-[#8E6D3B] mb-2">{growth.subtitle}</p>
                    <p className="text-sm text-[#665B45] leading-relaxed">
                      {growth.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ----------------- TAB 3: WORKS (我的作品) ----------------- */}
        {activeTab === 'works' && (
          <div id="works_tab_view" data-site-page="works" className="site-page site-page-works space-y-12 animate-fadeIn">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2 border-b-4 border-dashed border-[#4A3E26] pb-6">
              <div>
                <h2 className="site-display-title text-5xl md:text-6xl font-black text-[#3BB4FE] tracking-tight uppercase">
                  {siteContent.works.heading} <span className="text-[#F3C556] font-normal">*</span>
                </h2>
                <p className="text-sm md:text-base text-[#8E6D3B] tracking-wide mt-2 font-bold max-w-xl">
                  {siteContent.works.description}
                </p>
              </div>
              <span className="font-handwriting text-5xl text-[#4A3E26] rotate-[-3deg] select-none whitespace-nowrap self-start sm:self-auto translate-y-1">
                {siteContent.works.script}
              </span>
            </div>

            {/* Works List Grid - 2 Column Mixed Cards */}
            {isLoadingWorks ? (
              <div className="text-center py-16">
                <div className="animate-spin w-10 h-10 border-4 border-[#3BB4FE] border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className="text-sm font-bold text-[#8E6D3B]">加载中...</p>
              </div>
            ) : worksList.length === 0 ? (
              <div className="text-center py-16 bg-[#FFFDE5] border-4 border-dashed border-[#4A3E26]/30 rounded-[2rem]">
                <p className="text-4xl mb-4">🎨</p>
                <p className="text-lg font-black text-[#4A3E26] mb-2">还没有作品</p>
                <p className="text-sm text-[#8E6D3B] font-bold">敬请期待～</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {worksList.map((work) => {
                const typeColors: Record<string, { bg: string; accent: string; text: string }> = {
                  app: { bg: 'bg-[#D4F0FC]/30', accent: 'bg-[#3BB4FE]', text: 'text-[#3BB4FE]' },
                  business: { bg: 'bg-[#FFF9BB]/30', accent: 'bg-[#F3C556]', text: 'text-[#B8860B]' },
                  exploration: { bg: 'bg-[#D6F6D5]/30', accent: 'bg-[#3BEA72]', text: 'text-[#28a745]' },
                  process: { bg: 'bg-[#FFE4D6]/50', accent: 'bg-[#FF6B4A]', text: 'text-[#FF6B4A]' },
                };
                const color = typeColors[work.projectType] || typeColors.app;

                return (
                  <div
                    key={work.id}
                    className={`group relative bg-white border-4 border-[#4A3E26] rounded-[1.5rem] shadow-[5px_5px_0_0_#4A3E26] hover:-translate-y-1 hover:shadow-[7px_7px_0_0_#4A3E26] transition-all duration-300 overflow-hidden ${color.bg} flex flex-col`}
                  >
                    {/* Card Header */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-3">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-lg font-black text-[#4A3E26]/70">
                          #{work.number}
                        </span>
                        <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border-2 border-[#4A3E26] ${color.accent} text-white`}>
                          {work.projectBadge}
                        </span>
                      </div>
                    </div>

                    {/* Card Body - Mixed Layout: Left Text + Right Preview */}
                    <div className="px-5 pb-5 flex-1 flex flex-col">
                      <div className="flex gap-4 flex-1">
                        {/* Left: Text Content */}
                        <div className="flex-1 min-w-0 flex flex-col">
                          {/* Title - Always Visible */}
                          <h3 className="text-xl md:text-2xl font-black text-[#4A3E26] leading-tight mb-1 h-14">
                            {work.title}
                          </h3>

                          {/* Mobile: Show both value and description */}
                          <div className="md:hidden space-y-2 flex-1">
                            <p className="text-sm font-bold text-[#3BB4FE] leading-snug">
                              {work.valueDesc}
                            </p>
                            <p className="text-xs text-[#665B45] leading-relaxed line-clamp-3">
                              {work.defaultDesc}
                            </p>
                          </div>

                          {/* Desktop: Hover Switch Effect - Fixed Height */}
                          <div className="hidden md:block relative flex-1 min-h-[80px]">
                            {/* Default State */}
                            <div className="space-y-2 transition-all duration-300 group-hover:opacity-0 group-hover:translate-y-2 absolute inset-0">
                              <p className="text-sm text-[#665B45] leading-relaxed line-clamp-4">
                                {work.defaultDesc}
                              </p>
                            </div>
                            {/* Hover State */}
                            <div className="space-y-2 opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 absolute inset-0">
                              <p className={`text-sm font-black ${color.text} leading-snug`}>
                                {work.valueDesc}
                              </p>
                              <p className="text-xs text-[#665B45] leading-relaxed line-clamp-3">
                                {work.hoverDesc}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right: Preview Image (Phone Mockup Style) - Aligned to top */}
                        <div className="w-24 md:w-28 shrink-0 self-start pt-1">
                          <div className="aspect-[9/16] bg-white border-3 border-[#4A3E26] rounded-xl overflow-hidden shadow-[2px_2px_0_0_#4A3E26] relative">
                            <img
                              src={work.previewImage}
                              alt={work.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            {/* Phone top bar */}
                            <div className="absolute top-0 left-0 right-0 h-3 bg-[#4A3E26]/10 backdrop-blur-sm flex items-center justify-center">
                              <div className="w-6 h-1 bg-[#4A3E26]/30 rounded-full"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Buttons - Always at bottom, fixed height container */}
                      <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-dashed border-[#4A3E26]/10 h-11 items-center">
                        {work.hasCaseStudy && (
                          <button
                            onClick={() => setSelectedWork(work)}
                            className={`border-2 border-[#4A3E26] font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5 ${color.accent} text-white hover:brightness-105`}
                          >
                            <span>查看案例</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {work.hasPrototype && (
                          <button
                            onClick={() => {
                              if (work.prototypeUrl && work.prototypeUrl !== '#') {
                                window.open(work.prototypeUrl, '_blank');
                              } else {
                                setSelectedWork(work);
                              }
                            }}
                            className="bg-[#FFFDE5] hover:bg-[#FFF9BB] border-2 border-[#4A3E26] text-[#4A3E26] font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5"
                          >
                            <span>体验原型</span>
                            <Smartphone className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {work.hasLiveProduct && (
                          <button
                            onClick={() => work.liveUrl && window.open(work.liveUrl, '_blank')}
                            className="bg-[#3BEA72] hover:bg-[#2dd35f] border-2 border-[#4A3E26] text-[#4A3E26] font-black py-2.5 rounded-xl text-xs transition-all flex items-center justify-center gap-1 shadow-[2px_2px_0_0_#4A3E26] active:translate-y-0.5"
                          >
                            <span>体验产品</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 py-3 border-t-2 border-dashed border-[#4A3E26]/20 bg-white/50 mt-auto">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-black text-[#8E6D3B]/80 uppercase tracking-wider">
                          {work.bottomLabel}
                        </p>
                        <p className="text-[10px] font-bold text-[#8E6D3B]/60">
                          {work.yearLabel}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            )}

            {/* Work Detail Page */}
            {selectedWork && (
              <div className="fixed inset-0 bg-[#FCF9EE] z-50 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 md:px-8 py-6 md:py-10 relative">
                  
                  {/* Close button */}
                  <button 
                    onClick={() => {
                      setSelectedWork(null);
                      setTimeout(() => {
                        document.getElementById('works_tab_view')?.scrollIntoView({ behavior: 'auto' });
                      }, 100);
                    }}
                    className="fixed top-4 right-4 md:top-6 md:right-6 z-50 w-10 h-10 bg-[#FFFDE5] border-2 border-[#4A3E26] rounded-full flex items-center justify-center shadow-[2px_2px_0_0_#4A3E26] hover:translate-y-0.5 hover:shadow-[1px_1px_0_0_#4A3E26] transition-all text-[#4A3E26] text-xl font-bold cursor-pointer"
                  >
                    ×
                  </button>

                  <div className="space-y-6 pt-4">
                    {/* Project Intro Section */}
                    <div className="space-y-4 pt-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-lg font-black text-[#4A3E26]/70">
                          #{selectedWork.number}
                        </span>
                        <span className="text-xs font-black px-3 py-1 rounded-full border-2 border-[#4A3E26] bg-[#3BB4FE] text-white">
                          {selectedWork.projectBadge}
                        </span>
                        <span className="text-xs font-bold text-[#8E6D3B]">
                          {selectedWork.yearLabel}
                        </span>
                      </div>

                      <h2 className="text-3xl md:text-5xl font-black text-[#4A3E26]">
                        {selectedWork.title}
                      </h2>
                      <p className="text-base font-handwriting text-[#8E6D3B] font-bold">
                        {selectedWork.englishTitle}
                      </p>

                      {/* Quick Info Cards */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
                        <div className="bg-[#FFFDE5] border-2 border-[#4A3E26] rounded-xl p-4">
                          <p className="text-[10px] font-black text-[#8E6D3B] uppercase tracking-wider mb-1.5">
                            项目是什么
                          </p>
                          <p className="text-sm font-bold text-[#4A3E26] leading-snug">
                            {selectedWork.defaultDesc}
                          </p>
                        </div>
                        <div className="bg-[#D4F0FC]/30 border-2 border-[#4A3E26] rounded-xl p-4">
                          <p className="text-[10px] font-black text-[#3BB4FE] uppercase tracking-wider mb-1.5">
                            解决什么问题
                          </p>
                          <p className="text-sm font-bold text-[#4A3E26] leading-snug">
                            {selectedWork.problemDesc}
                          </p>
                        </div>
                        <div className="bg-[#FFF9BB]/30 border-2 border-[#4A3E26] rounded-xl p-4">
                          <p className="text-[10px] font-black text-[#B8860B] uppercase tracking-wider mb-1.5">
                            我负责什么
                          </p>
                          <p className="text-sm font-bold text-[#4A3E26] leading-snug">
                            {selectedWork.myRole}
                          </p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-3 flex-wrap pt-4">
                        {selectedWork.hasPrototype && (
                          <button 
                            onClick={() => {
                              if (selectedWork.prototypeUrl && selectedWork.prototypeUrl !== '#') {
                                window.open(selectedWork.prototypeUrl, '_blank');
                              }
                            }}
                            className="bg-[#3BB4FE] hover:bg-[#1fa1ef] border-2 border-[#4A3E26] text-white font-black px-6 py-3 rounded-xl text-sm transition-all shadow-[3px_3px_0_0_#4A3E26] active:translate-y-0.5 flex items-center gap-2"
                          >
                            <Smartphone className="w-4 h-4" />
                            体验原型
                          </button>
                        )}
                        {selectedWork.hasLiveProduct && (
                          <button 
                            onClick={() => selectedWork.liveUrl && window.open(selectedWork.liveUrl, '_blank')}
                            className="bg-[#3BEA72] hover:bg-[#2dd35f] border-2 border-[#4A3E26] text-[#4A3E26] font-black px-6 py-3 rounded-xl text-sm transition-all shadow-[3px_3px_0_0_#4A3E26] active:translate-y-0.5 flex items-center gap-2"
                          >
                            <ExternalLink className="w-4 h-4" />
                            体验产品
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t-2 border-dashed border-[#4A3E26]/20"></div>

                    {/* Main Content */}
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                      {/* Left: Preview Image */}
                      <div className="md:col-span-5 space-y-4">
                        <div className="aspect-square bg-white border-4 border-[#4A3E26] rounded-2xl overflow-hidden shadow-[4px_4px_0_0_#4A3E26]">
                          <img 
                            src={selectedWork.previewImage} 
                            alt={selectedWork.title} 
                            className="w-full h-full object-cover"
                          />
                        </div>

                        {/* Skills Tags */}
                        <div className="bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-2xl p-4 shadow-[2px_2px_0_0_#4A3E26] space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-black text-[#8E6D3B] uppercase tracking-wider">
                            <Tag className="w-4 h-4 text-[#F3C556]" />
                            <span>能力标签</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedWork.skills.map((skill, i) => (
                              <span
                                key={i}
                                className="text-[10px] bg-white border border-[#4A3E26]/30 px-2 py-0.5 rounded-full font-bold text-[#4A3E26]"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Text Content */}
                      <div className="md:col-span-7 space-y-4">
                        <div className="p-4 bg-[#FCF9EE] border-l-4 border-[#F3C556] rounded-r-xl">
                          <p className="font-bold text-[#8E6D3B]">设计概念 (Design Concept)</p>
                          <p className="text-sm mt-1 text-[#4A3E26]">{selectedWork.concept}</p>
                        </div>

                        <div>
                          <p className="font-black text-[#4A3E26] flex items-center gap-1">
                            <Sparkles className="w-4 h-4 text-[#F3C556]" />
                            项目故事 (Project Story)
                          </p>
                          <p className="text-sm mt-2 text-justify leading-relaxed whitespace-pre-line text-[#4A3E26]">{selectedWork.story}</p>
                        </div>

                        <div className="pt-2 grid grid-cols-3 gap-3 text-xs text-[#8E6D3B]">
                          <div>
                            <span className="block font-bold uppercase text-[10px] tracking-wider text-gray-500">项目规模</span>
                            <span className="font-black text-sm text-[#4A3E26]">{selectedWork.details.dimensions}</span>
                          </div>
                          <div>
                            <span className="block font-bold uppercase text-[10px] tracking-wider text-gray-500">主要工具</span>
                            <span className="font-black text-sm text-[#4A3E26]">{selectedWork.details.medium}</span>
                          </div>
                          <div>
                            <span className="block font-bold uppercase text-[10px] tracking-wider text-gray-500">时间</span>
                            <span className="font-black text-sm text-[#4A3E26]">{selectedWork.details.year}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* BYE BUDDY Ending visual */}
            <div className="space-y-8 pt-12 border-t-4 border-dashed border-[#4A3E26] flex flex-col items-center justify-center text-center">
              <h2 className="site-display-title text-6xl md:text-7xl font-black text-[#3BB4FE] italic tracking-tight font-display">
                {siteContent.works.closingHeading}
              </h2>

              {/* Miniature computer graphic */}
              <div className="w-36 bg-[#F3C556] border-2 border-[#4A3E26] rounded-[1.5rem] p-2.5 shadow-[4px_4px_0_0_#4A3E26] flex flex-col gap-1.5 animate-bounce">
                <div className="bg-[#3BB4FE] border-2 border-[#4A3E26] rounded-lg p-1 aspect-[4/3] flex flex-col justify-between relative overflow-hidden">
                  <div className="w-full flex justify-center pt-1.5">
                    <svg viewBox="0 0 100 30" className="w-8 text-white stroke-current stroke-2 fill-none">
                      <path d="M10,15 Q30,5 50,15 T90,15" />
                    </svg>
                  </div>
                  <div className="flex justify-around items-end gap-1">
                    <span className="w-3 h-3 bg-indigo-600 rounded-full border border-[#4A3E26] animate-bounce-dot" style={{ animationDelay: '0s' }}></span>
                    <span className="w-4 h-4 bg-orange-500 rounded-full border border-[#4A3E26] -translate-y-0.5 animate-bounce-dot" style={{ animationDelay: '0.15s' }}></span>
                    <span className="w-3 h-3 bg-emerald-400 rounded-full border border-[#4A3E26] animate-bounce-dot" style={{ animationDelay: '0.3s' }}></span>
                  </div>
                </div>
              </div>

              <div className="max-w-xl space-y-4 text-xs md:text-sm text-[#8E6D3B] leading-relaxed font-bold">
                {siteContent.works.closingParagraphs.map((paragraph, index) => (
                  <p
                    key={`${index}-${paragraph.slice(0, 12)}`}
                    className={index === siteContent.works.closingParagraphs.length - 1 ? 'text-sm text-[#4A3E26] tracking-wide mt-2' : ''}
                  >
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* ----------------- TAB 4: LIFE FRAGMENTS (生活碎片) ----------------- */}
        {activeTab === 'life' && (
          <div id="life_tab_view" data-site-page="life" className="site-page site-page-life space-y-16 animate-fadeIn">
            
            {/* Section A: Life Fragments Intro */}
            <div className="space-y-6">
              <div className="flex flex-col gap-2">
                <div>
                  <h2 className="site-display-title text-3xl md:text-4xl font-black text-[#3BB4FE] tracking-tight">
                    {siteContent.life.heading}
                  </h2>
                  <p className="text-xs text-[#8E6D3B] mt-1 font-medium opacity-70">
                    {siteContent.life.subtitle}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left block: About this corner */}
                <div className="lg:col-span-5 bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[4px_4px_0_0_#4A3E26] flex flex-col justify-between space-y-6">
                  <div>
                    <h3 className="text-xl font-black text-[#4A3E26] border-b-2 border-[#4A3E26] pb-2 mb-4">{siteContent.life.aboutTitle}</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3 w-full p-2 rounded-xl">
                        <div className="w-10 h-10 shrink-0 bg-[#3BB4FE] border-2 border-[#4A3E26] rounded-xl flex items-center justify-center text-xl shadow-[1px_1px_0_0_#4A3E26]">
                          📷
                        </div>
                        <div>
                          <h4 className="font-black text-[#4A3E26] text-sm">{siteContent.life.photoTitle}</h4>
                          <p className="text-xs text-[#8E6D3B] mt-0.5">{siteContent.life.photoDescription}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full p-2 rounded-xl">
                        <div className="w-10 h-10 shrink-0 bg-[#FF6B4A] border-2 border-[#4A3E26] rounded-xl flex items-center justify-center text-xl shadow-[1px_1px_0_0_#4A3E26]">
                          📝
                        </div>
                        <div>
                          <h4 className="font-black text-[#4A3E26] text-sm">{siteContent.life.diaryTitle}</h4>
                          <p className="text-xs text-[#8E6D3B] mt-0.5">{siteContent.life.diaryDescription}</p>
                        </div>
                      </div>
                      <div className="flex gap-3 w-full p-2 rounded-xl">
                        <div className="w-10 h-10 shrink-0 bg-[#3BEA72] border-2 border-[#4A3E26] rounded-xl flex items-center justify-center text-xl shadow-[1px_1px_0_0_#4A3E26]">
                          ✨
                        </div>
                        <div>
                          <h4 className="font-black text-[#4A3E26] text-sm">{siteContent.life.momentTitle}</h4>
                          <p className="text-xs text-[#8E6D3B] mt-0.5">{siteContent.life.momentDescription}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-[#FCF9EE] border-2 border-[#4A3E26] p-3.5 rounded-xl text-center">
                    <p className="text-xs text-[#8E6D3B] font-bold">{siteContent.life.quote}</p>
                  </div>
                </div>

                {/* Right block: Monthly Stats + Random Memory */}
                <div className="lg:col-span-7 bg-[#FFFDE5] border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[4px_4px_0_0_#4A3E26] grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
                  
                  {/* Monthly Stats Card */}
                  <div className="border-4 border-[#4A3E26] rounded-2xl p-5 bg-[#FCF9EE] flex flex-col gap-4 shadow-[4px_4px_0_0_#4A3E26]">
                    <div className="text-center pb-3 border-b-2 border-dashed border-[#4A3E26]">
                      <h4 className="font-black text-lg text-[#4A3E26] flex items-center justify-center gap-1.5">
                        📊 本月记忆统计
                      </h4>
                      <p className="text-[10px] text-[#8E6D3B] mt-1">
                        {statsSummary ? statsSummary.monthName : '本月'}
                      </p>
                    </div>

                    <div className="flex-1 flex flex-col justify-center gap-3">
                      <div className="text-center">
                        <p className="text-3xl font-black text-[#3BB4FE]">
                          {statsSummary ? statsSummary.totalMoments : '-'}
                        </p>
                        <p className="text-xs font-bold text-[#8E6D3B] mt-0.5">个瞬间</p>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-[#FFFDE5] border-2 border-[#4A3E26] rounded-xl p-2 text-center shadow-[2px_2px_0_0_#4A3E26]">
                          <p className="text-lg">📷</p>
                          <p className="text-base font-black text-[#4A3E26]">
                            {statsSummary ? statsSummary.totalPhotos : '-'}
                          </p>
                          <p className="text-[9px] text-[#8E6D3B] font-bold">张照片</p>
                        </div>
                        <div className="bg-[#FFFDE5] border-2 border-[#4A3E26] rounded-xl p-2 text-center shadow-[2px_2px_0_0_#4A3E26]">
                          <p className="text-lg">📍</p>
                          <p className="text-base font-black text-[#4A3E26]">
                            {statsSummary ? statsSummary.totalLocations : '-'}
                          </p>
                          <p className="text-[9px] text-[#8E6D3B] font-bold">个地点</p>
                        </div>
                        <div className="bg-[#FFFDE5] border-2 border-[#4A3E26] rounded-xl p-2 text-center shadow-[2px_2px_0_0_#4A3E26]">
                          <p className="text-lg">🏷️</p>
                          <p className="text-base font-black text-[#4A3E26]">
                            {statsSummary ? statsSummary.totalTags : '-'}
                          </p>
                          <p className="text-[9px] text-[#8E6D3B] font-bold">个标签</p>
                        </div>
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setViewMonthFilter(!viewMonthFilter);
                        setSelectedCategory('all');
                      }}
                      className={`w-full py-2.5 rounded-xl font-black text-sm border-2 border-[#4A3E26] transition-all active:translate-y-0.5 shadow-[2px_2px_0_0_#4A3E26] ${
                        viewMonthFilter 
                          ? 'bg-[#3BB4FE] text-white' 
                          : 'bg-[#F3C556] text-[#4A3E26] hover:bg-[#ebd54c]'
                      }`}
                    >
                      {viewMonthFilter ? '✓ 已筛选本月' : '查看本月记录'}
                    </button>
                  </div>

                  {/* Random Memory Card */}
                  <div className="flex flex-col items-center justify-center text-center p-4 gap-4 border-4 border-dashed border-[#4A3E26]/30 rounded-2xl">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-[#8E6D3B] tracking-wider uppercase">随机回忆</p>
                      <p className="text-[10px] text-[#8E6D3B] font-bold">{dailyMemories[currentMemoryIndex].date}</p>
                    </div>
                    <div 
                      onClick={handleMemoryImageClick}
                      className="w-44 h-44 bg-white border-4 border-[#4A3E26] p-2 rounded-2xl shadow-[4px_4px_0_0_#4A3E26] relative cursor-pointer hover:-translate-y-0.5 transition-transform"
                    >
                      <img 
                        src={dailyMemories[currentMemoryIndex].image} 
                        alt="daily memory"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    </div>
                    <div className="space-y-1 max-w-[180px]">
                      <p className="text-xs font-bold text-[#4A3E26] italic">
                        "{dailyMemories[currentMemoryIndex].quote}"
                      </p>
                    </div>
                    <button 
                      onClick={shuffleMemory}
                      className="bg-[#FF6B4A] hover:bg-[#ff5a36] active:translate-y-0.5 border-2 border-[#4A3E26] text-white font-black px-4 py-1.5 rounded-full shadow-[2px_2px_0_0_#4A3E26] transition-all text-xs flex items-center gap-1.5"
                    >
                      🔄 换一片记忆
                    </button>
                  </div>

                </div>
              </div>
            </div>

            {/* Section B: Life Fragments Timeline */}
            <div className="space-y-6 pt-8 border-t-4 border-dashed border-[#4A3E26]">
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
                  <div>
                    <h2 className="site-display-title text-2xl md:text-3xl font-black text-[#3BB4FE] tracking-tight">
                      {siteContent.life.galleryHeading}
                    </h2>
                    <p className="text-xs text-[#8E6D3B] mt-1 font-medium">
                      {viewMonthFilter ? '本月的生活记录' : siteContent.life.gallerySubtitle}
                    </p>
                  </div>
                  {viewMonthFilter && (
                    <button
                      onClick={() => setViewMonthFilter(false)}
                      className="text-xs font-bold text-[#8E6D3B] hover:text-[#4A3E26] underline self-start sm:self-auto"
                    >
                      ← 取消本月筛选
                    </button>
                  )}
                </div>

                {/* Filter & Sort Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Category Pills */}
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { key: 'all', label: '全部', count: categoryCounts.all },
                      { key: 'photo', label: '镜头日记', count: categoryCounts.photo },
                      { key: 'diary', label: '日常随笔', count: categoryCounts.diary },
                      { key: 'moment', label: '闪光时刻', count: categoryCounts.moment },
                    ].map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => setSelectedCategory(cat.key as typeof selectedCategory)}
                        className={`px-4 py-1.5 rounded-full font-black text-xs border-2 border-[#4A3E26] transition-all active:translate-y-0.5 flex items-center gap-1.5 ${
                          selectedCategory === cat.key
                            ? 'bg-[#3BB4FE] text-white shadow-[2px_2px_0_0_#4A3E26]'
                            : 'bg-white text-[#4A3E26] hover:bg-[#FCF9EE] shadow-[2px_2px_0_0_#4A3E26]'
                        }`}
                      >
                        {cat.label}
                        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                          selectedCategory === cat.key
                            ? 'bg-white/20 text-white'
                            : 'bg-[#4A3E26]/10 text-[#8E6D3B]'
                        }`}>
                          {cat.count}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Sort Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-[#8E6D3B]">排序：</span>
                    <div className="flex bg-[#FCF9EE] border-2 border-[#4A3E26] rounded-full overflow-hidden shadow-[2px_2px_0_0_#4A3E26]">
                      <button
                        onClick={() => setSortOrder('newest')}
                        className={`px-3 py-1 text-xs font-black transition-all ${
                          sortOrder === 'newest'
                            ? 'bg-[#FF6B4A] text-white'
                            : 'text-[#4A3E26] hover:bg-[#FFF9BB]'
                        }`}
                      >
                        最新发布
                      </button>
                      <button
                        onClick={() => setSortOrder('oldest')}
                        className={`px-3 py-1 text-xs font-black transition-all ${
                          sortOrder === 'oldest'
                            ? 'bg-[#FF6B4A] text-white'
                            : 'text-[#4A3E26] hover:bg-[#FFF9BB]'
                        }`}
                      >
                        最早发布
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Masonry-like layout */}
              <div className="columns-1 sm:columns-2 lg:columns-3 gap-6 space-y-6">
                {isLoadingFragments ? (
                  <div className="col-span-full text-center py-16">
                    <div className="animate-spin w-10 h-10 border-4 border-[#3BB4FE] border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-sm font-bold text-[#8E6D3B]">正在加载生活记录...</p>
                  </div>
                ) : filteredFragments.length === 0 ? (
                  <div className="col-span-full text-center py-16 bg-[#FFFDE5] border-4 border-dashed border-[#4A3E26]/30 rounded-[2rem]">
                    <p className="text-5xl mb-4">
                      {selectedCategory === 'photo' ? '📷' : selectedCategory === 'diary' ? '📝' : selectedCategory === 'moment' ? '✨' : '📷'}
                    </p>
                    <p className="text-lg font-black text-[#4A3E26] mb-2">
                      {viewMonthFilter
                        ? '本月还没有生活记录'
                        : selectedCategory === 'all' ? '还没有生活记录' :
                          selectedCategory === 'photo' ? '还没有镜头日记' :
                          selectedCategory === 'diary' ? '还没有日常随笔' : '还没有闪光时刻'}
                    </p>
                    <p className="text-sm text-[#8E6D3B] font-bold">四金的生活图鉴正在加载中...</p>
                  </div>
                ) : (
                  filteredFragments.map((fragment, index) => (
                  <div 
                    key={fragment.id}
                    onClick={() => setSelectedFragment(fragment)}
                    className="break-inside-avoid bg-white border-4 border-[#4A3E26] rounded-[1.5rem] overflow-hidden shadow-[4px_4px_0_0_#4A3E26] hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                    style={{ transform: `rotate(${(index % 2 === 0 ? -0.5 : 0.5)}deg)` }}
                  >
                    {/* Category Badge */}
                    <div className="px-4 pt-3">
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full font-bold text-white border border-[#4A3E26] inline-block"
                        style={{
                          backgroundColor: fragment.category === 'photo' ? '#3BB4FE' :
                                          fragment.category === 'diary' ? '#FF6B4A' : '#3BEA72'
                        }}
                      >
                        {fragment.category === 'photo' ? '📷 镜头日记' :
                         fragment.category === 'diary' ? '📝 日常随笔' : '✨ 闪光时刻'}
                      </span>
                    </div>
                    {/* Images */}
                    {fragment.images.length > 0 && (
                      <div className={`grid gap-0.5 p-1.5 ${fragment.images.length === 1 ? 'grid-cols-1' : fragment.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'}`}>
                        {fragment.images.slice(0, fragment.images.length === 3 ? 3 : 4).map((img, imgIndex) => (
                          <div 
                            key={imgIndex} 
                            className={`overflow-hidden rounded-lg ${fragment.images.length === 3 && imgIndex === 0 ? 'col-span-2' : ''}`}
                          >
                            <img 
                              src={img} 
                              alt={fragment.title}
                              className={`w-full object-cover hover:scale-105 transition-transform duration-500 ${fragment.images.length === 1 ? 'aspect-[4/3]' : 'aspect-square'}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Content */}
                    <div className="p-4 space-y-3">
                      {/* Meta info */}
                      <div className="flex items-center gap-2 text-[10px] text-[#8E6D3B] font-bold flex-wrap">
                        <span>📅 {fragment.date}</span>
                        {fragment.location && (
                          <>
                            <span className="text-[#4A3E26]/20">·</span>
                            <span>📍 {fragment.location}</span>
                          </>
                        )}
                        {(fragment.weather || fragment.mood) && (
                          <>
                            <span className="text-[#4A3E26]/20">·</span>
                            <span>{fragment.weather || fragment.mood}</span>
                          </>
                        )}
                      </div>

                      {/* Title */}
                      <h3 className="text-lg font-black text-[#4A3E26]">{fragment.title}</h3>

                      {/* Content */}
                      <p className="text-sm text-[#665B45] leading-relaxed">
                        {fragment.content}
                      </p>

                      {/* Tags */}
                      <div className="flex gap-1.5 flex-wrap pt-2 border-t border-dashed border-[#4A3E26]/20">
                        {fragment.tags.map((tag, tagIndex) => (
                          <span 
                            key={`${fragment.id}-${tag}-${tagIndex}`}
                            className="text-[10px] bg-[#FFF9BB] border border-[#4A3E26] px-2 py-0.5 rounded-full font-bold text-[#4A3E26]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  ))
                )}
              </div>
            </div>

            {/* Fragment Detail Modal */}
            {selectedFragment && (
              <div className="fixed inset-0 bg-[#4A3E26]/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
                <div className="bg-[#FCF9EE] border-4 border-[#4A3E26] rounded-[2.5rem] w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[10px_10px_0_0_#4A3E26] relative">
                  
                  {/* Close button */}
                  <button 
                    onClick={() => setSelectedFragment(null)}
                    className="absolute top-4 right-4 z-10 w-10 h-10 bg-[#FFFDE5] border-2 border-[#4A3E26] rounded-full hover:bg-red-200 active:translate-y-0.5 transition-all shadow-[2px_2px_0_0_#4A3E26] flex items-center justify-center text-xl font-bold"
                  >
                    ✕
                  </button>

                  <div className="p-6 md:p-8 space-y-6">
                    {/* Header */}
                    <div className="space-y-4">
                      <span 
                        className="text-xs px-3 py-1 rounded-full font-bold text-white border-2 border-[#4A3E26] inline-block shadow-[2px_2px_0_0_#4A3E26]"
                        style={{
                          backgroundColor: selectedFragment.category === 'photo' ? '#3BB4FE' :
                                          selectedFragment.category === 'diary' ? '#FF6B4A' : '#3BEA72'
                        }}
                      >
                        {selectedFragment.category === 'photo' ? '📷 镜头日记' :
                         selectedFragment.category === 'diary' ? '📝 日常随笔' : '✨ 闪光时刻'}
                      </span>
                      
                      <h2 className="text-3xl md:text-4xl font-black text-[#4A3E26]">
                        {selectedFragment.title}
                      </h2>

                      <div className="flex items-center gap-3 text-sm text-[#8E6D3B] font-bold flex-wrap">
                        <span>📅 {selectedFragment.date}</span>
                        {selectedFragment.location && (
                          <>
                            <span className="text-[#4A3E26]/20">·</span>
                            <span>📍 {selectedFragment.location}</span>
                          </>
                        )}
                        {(selectedFragment.weather || selectedFragment.mood) && (
                          <>
                            <span className="text-[#4A3E26]/20">·</span>
                            <span>{selectedFragment.weather || selectedFragment.mood}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Images */}
                    {selectedFragment.images.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-[#3BB4FE]" /> 照片记录
                        </p>
                        <div className={`grid gap-3 ${
                          selectedFragment.images.length === 1 ? 'grid-cols-1' : 
                          selectedFragment.images.length === 2 ? 'grid-cols-2' : 'grid-cols-2'
                        }`}>
                          {selectedFragment.images.map((img, index) => (
                            <div 
                              key={index} 
                              className={`overflow-hidden rounded-2xl border-4 border-[#4A3E26] shadow-[4px_4px_0_0_#4A3E26] ${
                                selectedFragment.images.length === 3 && index === 0 ? 'col-span-2' : ''
                              }`}
                            >
                              <img 
                                src={img} 
                                alt={`${selectedFragment.title} - ${index + 1}`}
                                className="w-full h-auto object-cover"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Content */}
                    <div className="space-y-3">
                      <p className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1.5">
                        <Bookmark className="w-4 h-4 text-[#F3C556]" /> 内容记录
                      </p>
                      <div className="bg-[#FFFDE5] border-l-4 border-[#F3C556] p-5 rounded-r-2xl border-2 border-l-4 border-[#4A3E26]/20">
                        <p className="text-sm md:text-base leading-relaxed text-[#4A3E26] whitespace-pre-line">
                          {selectedFragment.content}
                        </p>
                      </div>
                    </div>

                    {/* Tags */}
                    {selectedFragment.tags.length > 0 && (
                      <div className="space-y-3 pt-2">
                        <p className="text-xs font-black text-[#8E6D3B] uppercase tracking-wider flex items-center gap-1.5">
                          <Search className="w-4 h-4 text-[#FF6B4A]" /> 相关标签
                        </p>
                        <div className="flex gap-2 flex-wrap">
                          {selectedFragment.tags.map((tag, index) => (
                            <span 
                              key={index}
                              className="text-sm bg-[#FFF9BB] border-2 border-[#4A3E26] px-3 py-1 rounded-full font-bold text-[#4A3E26] shadow-[2px_2px_0_0_#4A3E26]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Section C: Sticky Guestbook (留言板) */}
            <div className="space-y-8 pt-8 border-t-4 border-dashed border-[#4A3E26]">
              <div>
                <h2 className="site-display-title text-4xl md:text-5xl font-black text-[#3BB4FE] tracking-tight uppercase">
                  {siteContent.life.guestbookHeading} <span className="text-[#F3C556] font-normal">✦</span>
                </h2>
                <p className="text-sm text-[#8E6D3B] tracking-wider font-bold uppercase mt-1">{siteContent.life.guestbookSubtitle}</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Note submission Form */}
                <form 
                  onSubmit={handleAddNote}
                  className="lg:col-span-4 border-4 border-[#4A3E26] rounded-[2rem] p-6 shadow-[4px_4px_0_0_#4A3E26] space-y-4 transition-colors duration-300"
                  style={{ backgroundColor: selectedColor }}
                >
                  <h3 className="text-xl font-black text-[#4A3E26]">📌 贴上一张留言纸条</h3>
                  
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8E6D3B]">你的大名 (Nickname)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="e.g. 灵感探测器"
                      value={newNickname}
                      onChange={(e) => setNewNickname(e.target.value)}
                      className="w-full bg-[#FCF9EE] border-2 border-[#4A3E26] px-3 py-2 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8E6D3B]">写点什么 (Your message)</label>
                    <textarea 
                      required
                      rows={3}
                      placeholder="写句祝福或者对设计的看法吧..."
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      className="w-full bg-[#FCF9EE] border-2 border-[#4A3E26] px-3 py-2 rounded-xl text-sm font-bold text-[#4A3E26] placeholder-[#8E6D3B]/40 focus:bg-white focus:outline-none resize-none"
                    />
                  </div>

                  {/* Preset Colors */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8E6D3B]">纸条底色 (Color Presets)</label>
                    <div className="flex gap-2 flex-wrap">
                      {colorPresets.map((col) => (
                        <button
                          key={col.value}
                          type="button"
                          onClick={() => setSelectedColor(col.value)}
                          className={`w-7 h-7 rounded-full border-2 border-[#4A3E26] shadow-[1px_1px_0_0_#4A3E26] relative transition-all ${
                            selectedColor === col.value ? 'scale-110 border-black ring-2 ring-[#3BB4FE]/50' : 'opacity-80 hover:opacity-100'
                          }`}
                          style={{ backgroundColor: col.value }}
                          title={col.name}
                        >
                          {selectedColor === col.value && (
                            <Check className="w-3.5 h-3.5 text-[#4A3E26] absolute inset-0 m-auto stroke-[3px]" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Emoji stamps */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#8E6D3B]">图章表情 (Stamp Emoji)</label>
                    <div className="flex gap-1.5 flex-wrap">
                      {emojiPresets.map((em) => (
                        <button
                          key={em}
                          type="button"
                          onClick={() => setSelectedEmoji(em)}
                          className={`w-7 h-7 flex items-center justify-center rounded-md border text-sm transition-all ${
                            selectedEmoji === em ? 'bg-[#3BB4FE] text-white border-[#4A3E26] scale-110 font-bold' : 'bg-[#FCF9EE] border-[#4A3E26] hover:bg-[#FFF9BB]'
                          }`}
                        >
                          {em}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-[#3BB4FE] hover:bg-[#1fa1ef] active:translate-y-0.5 border-4 border-[#4A3E26] text-white font-black py-2.5 rounded-xl shadow-[3px_3px_0_0_#4A3E26] transition-all text-sm flex items-center justify-center gap-1.5"
                  >
                    <Plus className="w-4 h-4 stroke-[3px]" />
                    <span>钉在软木板上 (Pin note)</span>
                  </button>

                  {isSubmitSuccess && (
                    <p className="text-center text-xs text-[#3BEA72] font-black animate-pulse">
                      🎉 留言大成功！已收录至本地留言软木板！
                    </p>
                  )}
                </form>

                {/* Corkboard with sticky notes */}
                <div className="lg:col-span-8 bg-[#E5B573] border-4 border-[#4A3E26] rounded-[2.5rem] p-6 shadow-[6px_6px_0_0_#4A3E26] min-h-[400px] relative overflow-hidden bg-[radial-gradient(#ab7d3f_1px,transparent_1px)] [background-size:24px_24px]">
                  
                  {/* Subtle wood borders */}
                  <div className="absolute inset-0 border-8 border-[#A67B43] pointer-events-none rounded-[2rem]"></div>

                  {/* Notes mapping container */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 relative z-10 p-2">
                    {notes.map((note) => (
                      <div 
                        key={note.id}
                        className="p-5 border-4 border-[#4A3E26] rounded-2xl shadow-[4px_4px_0_0_#4A3E26] relative transition-transform duration-300"
                        style={{ 
                          backgroundColor: note.color, 
                          transform: `rotate(${note.rotation}deg)` 
                        }}
                      >
                        {/* Red pin detail */}
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-3.5 h-3.5 bg-red-500 border-2 border-[#4A3E26] rounded-full shadow-sm"></div>

                        {/* Stamp overlay */}
                        <div className="absolute top-2 right-2 text-2xl select-none opacity-80 filter rotate-12">
                          {note.emoji}
                        </div>

                        <div className="space-y-2">
                          <p className="text-xs font-handwriting font-black text-[#8E6D3B] border-b border-[#4A3E26]/25 pb-1">
                            From: <span className="text-sm font-display text-[#4A3E26] font-black">{note.nickname}</span>
                          </p>
                          <p className="text-xs md:text-sm text-[#4A3E26] leading-relaxed font-medium font-display text-justify">
                            {note.content}
                          </p>
                          <div className="flex justify-between items-center text-[9px] text-[#8E6D3B]/70 pt-1 font-mono">
                            <span>{new Date(note.createdAt).toLocaleDateString()}</span>
                            <span>{siteContent.life.guestbookTag}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {notes.length === 0 && (
                    <div className="h-full flex items-center justify-center p-8 text-center text-white/80 font-black">
                      还没人在留言软木板上钉过纸条呢，写下你的第一个留言吧！💬
                    </div>
                  )}

                </div>

              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER BAR (Warm yellow styling matching screens) */}
      <footer data-site-page="footer" className="site-page site-page-footer mt-auto border-t-4 border-[#4A3E26] bg-[#F3C556] py-10 px-4 sm:px-8 text-[#4A3E26] shadow-[inset_0_4px_0_0_rgba(0,0,0,0.05)]">
        <div className="max-w-4xl mx-auto">
          {/* Main content: left title + right nav */}
          <div className="flex flex-col sm:flex-row justify-between gap-8 pb-8">
            {/* Left side: big title + slogan */}
            <div className="flex-1">
              <h2 className="font-black text-2xl sm:text-3xl leading-tight mb-4">
                {siteContent.footer.heading.split('\n').map((line, index) => (
                  <React.Fragment key={`${index}-${line}`}>
                    {line}
                    {index < siteContent.footer.heading.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </h2>
              <p className="site-copy-font site-red-copy text-lg text-[#8E6D3B]">
                {siteContent.footer.slogan}
              </p>
            </div>

            {/* Right side: explore navigation */}
            <div className="sm:text-right">
              <h3 className="font-black text-lg mb-4 border-b-2 border-[#4A3E26] inline-block pb-1">
                Explore
              </h3>
              <ul className="space-y-2 font-bold">
                <li>
                  <button onClick={() => setActiveTab('home')} className="hover:text-[#3BB4FE] transition-colors">
                    Home
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('about')} className="hover:text-[#3BB4FE] transition-colors">
                    About Me
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('life')} className="hover:text-[#3BB4FE] transition-colors">
                    Life & Guestbook
                  </button>
                </li>
                <li>
                  <button onClick={() => setActiveTab('works')} className="hover:text-[#3BB4FE] transition-colors">
                    My Works
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t-2 border-[#4A3E26] pt-6"></div>

          {/* Bottom: copyright + links */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-xs font-bold">
            <p>{siteContent.footer.copyright}</p>
            <div className="flex gap-6">
              {siteContent.footer.privacyUrl ? (
                <a href={siteContent.footer.privacyUrl} target="_blank" rel="noreferrer" className="hover:text-[#3BB4FE] transition-colors">
                  {siteContent.footer.privacyLabel}
                </a>
              ) : (
                <span>{siteContent.footer.privacyLabel}</span>
              )}
              {siteContent.footer.termsUrl ? (
                <a href={siteContent.footer.termsUrl} target="_blank" rel="noreferrer" className="hover:text-[#3BB4FE] transition-colors">
                  {siteContent.footer.termsLabel}
                </a>
              ) : (
                <span>{siteContent.footer.termsLabel}</span>
              )}
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
