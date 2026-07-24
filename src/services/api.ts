import { upload } from '@vercel/blob/client';

const TOKEN_KEY = 'sijin_admin_token';
const USER_KEY = 'sijin_admin_user';

export const authService = {
  getToken(): string | null {
    return localStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string) {
    localStorage.setItem(TOKEN_KEY, token);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  getUser(): string | null {
    return localStorage.getItem(USER_KEY);
  },

  setUser(username: string) {
    localStorage.setItem(USER_KEY, username);
  },

  removeUser() {
    localStorage.removeItem(USER_KEY);
  },

  isLoggedIn(): boolean {
    return !!this.getToken();
  },

  logout() {
    this.removeToken();
    this.removeUser();
  }
};

export interface LifeFragment {
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
  createdAt?: string;
  updatedAt?: string;
}

export interface StatsSummary {
  month: string;
  monthName: string;
  totalMoments: number;
  totalPhotos: number;
  totalLocations: number;
  totalTags: number;
  totalPublicMoments: number;
  latestFragment: LifeFragment | null;
}

export interface GuestbookNote {
  id: string;
  nickname: string;
  content: string;
  color: string;
  emoji: string;
  rotation: number;
  createdAt: string;
}

export interface Work {
  id: string;
  number: string;
  title: string;
  englishTitle: string;
  category: string;
  projectType: string;
  projectBadge: string;
  defaultDesc: string;
  hoverDesc: string;
  valueDesc: string;
  problemDesc: string;
  myRole: string;
  skills: string[];
  previewImage: string;
  concept: string;
  story: string;
  hasPrototype: boolean;
  prototypeUrl?: string;
  hasLiveProduct: boolean;
  liveUrl?: string;
  hasCaseStudy: boolean;
  yearLabel: string;
  bottomLabel: string;
  isPublic: boolean;
  sortOrder: number;
  details: {
    dimensions: string;
    medium: string;
    year: string;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface Skill {
  id: string;
  icon: string;
  iconBgColor: string;
  label: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Growth {
  id: string;
  period: string;
  periodBgColor: string;
  title: string;
  subtitle: string;
  description: string;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningNode {
  id: string;
  title: string;
  tool: string;
  description: string;
  tags: string[];
  link?: string;
}

export interface Learning {
  id: string;
  title: string;
  description: string;
  color: string;
  status: string;
  nodes: LearningNode[];
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SiteContent {
  home: {
    heroTitle: string;
    leftImage: string;
    leftImageAlt: string;
    leftCaption: string;
    rightImage: string;
    rightImageAlt: string;
    rightCaption: string;
    creatorLabel: string;
    creatorTitle: string;
    creatorName: string;
    introEnglish: string;
    introChinese: string;
    tourButton: string;
    screenAboutTitle: string;
    screenAboutButton: string;
    screenLifeTitle: string;
    screenLifeButton: string;
    screenWorksTitle: string;
    screenWorksButton: string;
  };
  about: {
    heading: string;
    greeting: string;
    paragraphs: string[];
    portraitImage: string;
    portraitAlt: string;
    portraitCaption: string;
    skillsHeading: string;
    skillsSubtitle: string;
    skillsScript: string;
    learningHeading: string;
    learningSubtitle: string;
    learningDescription: string;
    learningScript: string;
    growthHeading: string;
    growthSubtitle: string;
    growthScript: string;
  };
  works: {
    heading: string;
    description: string;
    script: string;
    closingHeading: string;
    closingParagraphs: string[];
  };
  life: {
    heading: string;
    subtitle: string;
    aboutTitle: string;
    photoTitle: string;
    photoDescription: string;
    diaryTitle: string;
    diaryDescription: string;
    momentTitle: string;
    momentDescription: string;
    quote: string;
    fallbackMemoryDate: string;
    fallbackMemoryImage: string;
    fallbackMemoryQuote: string;
    galleryHeading: string;
    gallerySubtitle: string;
    guestbookHeading: string;
    guestbookSubtitle: string;
    guestbookTag: string;
  };
  typography: {
    heroSize: number;
    displaySize: number;
    headingSize: number;
    bodySize: number;
    helperSize: number;
    displayWeight: number;
    headingWeight: number;
    bodyWeight: number;
    helperWeight: number;
    mobileAutoLighten: boolean;
  };
  footer: {
    heading: string;
    slogan: string;
    copyright: string;
    privacyLabel: string;
    privacyUrl: string;
    termsLabel: string;
    termsUrl: string;
  };
}

export const DEFAULT_SITE_CONTENT: SiteContent = {
  home: {
    heroTitle: 'Hey,buddy!',
    leftImage: '/96d711b6-dd57-4a44-8c37-eb9d21ac1c99.png',
    leftImageAlt: '四金的肖像照 1',
    leftCaption: '生而自由，爱而无畏',
    rightImage: '/ef62c276-8600-4522-ad7e-08be636b13e3.png',
    rightImageAlt: '四金的肖像照 2',
    rightCaption: '今天的太阳比昨天大 🔆',
    creatorLabel: 'CREATOR',
    creatorTitle: '我的名字',
    creatorName: '四金',
    introEnglish: 'A wanderer between inspiration and reality',
    introChinese: '在灵感与现实之间 慢慢生长的温暖追光者。',
    tourButton: 'THIS IS YOUR GUIDED TOUR OF ME......',
    screenAboutTitle: '关于我',
    screenAboutButton: '了解更多 →',
    screenLifeTitle: '生活碎片',
    screenLifeButton: '去逛逛 →',
    screenWorksTitle: '我的作品',
    screenWorksButton: '查看作品 →',
  },
  about: {
    heading: 'ABOUT ME',
    greeting: '嗨，我是四金。',
    paragraphs: [
      '2004年出生，现阶段保持慢节奏的自我沉淀与持续成长。',
      '我相信生活是由细节拼成的——窗台上慢慢移动的光，老巷子里那棵槐树四季换样子，朋友不经意说出口却刚好戳中的话。我喜欢收集这些，它们是我看待世界的方式，也悄悄变成我的一部分。',
      '我对喜欢的事有一种执拗的认真。会为一个小问题反复琢磨，会为一件事翻遍资料，享受那种沉浸进去、时间消失的感觉。比起结果，我更在意过程里有没有真正"在场"。',
      '还在成长，但方向很笃定——做个认真生活、慢慢发光的人。',
      '不急着被定义，也不急着赶路。',
    ],
    portraitImage: '/96d711b6-dd57-4a44-8c37-eb9d21ac1c99.png',
    portraitAlt: '关于我 肖像',
    portraitCaption: '在极小的事物里发现极大的宇宙 ✦',
    skillsHeading: 'ABOUT SKILLS',
    skillsSubtitle: '我的能力',
    skillsScript: 'My Skills',
    learningHeading: 'ABOUT LEARNING',
    learningSubtitle: '近期学点啥',
    learningDescription: '(记录最近好奇的事情，以及我如何一步步把它们变成能力。)',
    learningScript: "What I'm Learning",
    growthHeading: 'ABOUT GROWTH',
    growthSubtitle: '成长历程',
    growthScript: 'My Growth',
  },
  works: {
    heading: 'ABOUT WORK',
    description: '每一份作品，都像是我在某个阶段留下的坐标，它们记录着当时的感受、思考与成长。',
    script: 'Work Showcase',
    closingHeading: 'Bye,buddy!',
    closingParagraphs: [
      '看到这里，你已经陪我走过了我的小世界。',
      '很感谢你愿意花时间，听我的故事、看我的作品、了解我的成长。这个网站会一直在这里，记录我未来的每一步，也期待能见证你的故事。未来的路还很长，我会继续带着热爱与真诚，慢慢走、认真走。',
      '最后，再次谢谢你的到来。',
      '愿我们都能在自己的领域里，闪闪发光；下次再见啦～',
    ],
  },
  life: {
    heading: '生活切片 —— 把普通日子慢慢收藏',
    subtitle: "Collecting the days I don't want to forget.",
    aboutTitle: '关于这个角落',
    photoTitle: '镜头日记',
    photoDescription: '用照片保存旅途、街景、美食和偶然遇见的风景。',
    diaryTitle: '日常随笔',
    diaryDescription: '记录某一天的感受、生活感悟，以及突然冒出来的小想法。',
    momentTitle: '闪光时刻',
    momentDescription: '收藏值得纪念的成长、第一次尝试和生活中的小小成就。',
    quote: '"生活不是等待被总结的大事，而是一个个被记住的瞬间。"',
    fallbackMemoryDate: '2025.04.17',
    fallbackMemoryImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=warm%20sunny%20afternoon%20light%20through%20window%20on%20wooden%20desk%20with%20coffee%20cup%20and%20plant&image_size=square_hd',
    fallbackMemoryQuote: '当时没有觉得特别，后来却很想念。',
    galleryHeading: '生活图鉴',
    gallerySubtitle: '一些日常，一些喜欢，一些想记住的瞬间',
    guestbookHeading: '四金的留香阁',
    guestbookSubtitle: 'Leave a sweet note on the digital corkboard',
    guestbookTag: '#四金的时光小屋',
  },
  typography: {
    heroSize: 124,
    displaySize: 80,
    headingSize: 24,
    bodySize: 18,
    helperSize: 14,
    displayWeight: 800,
    headingWeight: 600,
    bodyWeight: 400,
    helperWeight: 400,
    mobileAutoLighten: false,
  },
  footer: {
    heading: "Let's build something\nextraordinary together.",
    slogan: '一定会成为一个很棒的大人！',
    copyright: '© 2026 四金. All rights reserved.',
    privacyLabel: 'Privacy Policy',
    privacyUrl: '',
    termsLabel: 'Terms of Service',
    termsUrl: '',
  },
};

const API_BASE = '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const apiService = {
  async getSiteContent(): Promise<SiteContent> {
    const res = await fetch(`${API_BASE}/site-content`);
    if (!res.ok) throw new Error('获取页面内容失败');
    return res.json();
  },

  async getAdminSiteContent(): Promise<SiteContent> {
    const res = await fetch(`${API_BASE}/admin/site-content`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('获取页面内容失败');
    }
    return res.json();
  },

  async updateSiteContent(content: SiteContent): Promise<SiteContent> {
    const res = await fetch(`${API_BASE}/admin/site-content`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(content)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '保存页面内容失败');
    }
    return data;
  },

  async login(username: string, password: string) {
    const res = await fetch(`${API_BASE}/admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '登录失败');
    return data;
  },

  async verifyToken(): Promise<boolean> {
    const token = authService.getToken();
    if (!token) return false;
    try {
      const res = await fetch(`${API_BASE}/admin/verify`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return res.ok;
    } catch {
      return false;
    }
  },

  async getPublicFragments(category?: 'photo' | 'diary' | 'moment'): Promise<LifeFragment[]> {
    const url = new URL(`${API_BASE}/life-fragments`, window.location.origin);
    if (category) url.searchParams.set('category', category);
    const res = await fetch(url.toString());
    if (!res.ok) throw new Error('获取生活记录失败');
    return res.json();
  },

  async getAllFragments(category?: 'photo' | 'diary' | 'moment'): Promise<LifeFragment[]> {
    const url = new URL(`${API_BASE}/admin/life-fragments`, window.location.origin);
    if (category) url.searchParams.set('category', category);
    const res = await fetch(url.toString(), {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('获取生活记录失败');
    }
    return res.json();
  },

  async getStatsSummary(year?: number, month?: number): Promise<StatsSummary> {
    const query = new URLSearchParams();
    if (year !== undefined) query.set('year', String(year));
    if (month !== undefined) query.set('month', String(month));
    const suffix = query.toString() ? `?${query.toString()}` : '';
    const res = await fetch(`${API_BASE}/life-fragments/stats/summary${suffix}`);
    if (!res.ok) throw new Error('获取统计信息失败');
    return res.json();
  },

  async createFragment(fragment: Partial<LifeFragment>): Promise<LifeFragment> {
    const res = await fetch(`${API_BASE}/admin/life-fragments`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(fragment)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '创建失败');
    }
    return data;
  },

  async updateFragment(id: string, fragment: Partial<LifeFragment>): Promise<LifeFragment> {
    const res = await fetch(`${API_BASE}/admin/life-fragments/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(fragment)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '更新失败');
    }
    return data;
  },

  async deleteFragment(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/life-fragments/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('删除失败');
    }
  },

  async uploadImage(file: File): Promise<{ url: string; filename: string }> {
    const token = authService.getToken();
    if (!token) {
      authService.logout();
      window.location.href = '/admin';
      throw new Error('请先登录后台');
    }

    const blob = await upload(`website-images/${file.name}`, file, {
      access: 'public',
      handleUploadUrl: `${API_BASE}/admin/upload`,
      clientPayload: token,
    });

    return {
      url: blob.url,
      filename: blob.pathname,
    };
  },

  async deleteImage(filename: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/upload/${filename}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('删除图片失败');
    }
  },

  async getGuestbookNotes(): Promise<GuestbookNote[]> {
    const res = await fetch(`${API_BASE}/guestbook`);
    if (!res.ok) throw new Error('获取留言失败');
    return res.json();
  },

  async createGuestbookNote(note: { nickname: string; content: string; color: string; emoji: string }): Promise<GuestbookNote> {
    const res = await fetch(`${API_BASE}/guestbook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(note)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '提交留言失败');
    return data;
  },

  async getAllGuestbookNotes(): Promise<GuestbookNote[]> {
    const res = await fetch(`${API_BASE}/admin/guestbook`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('获取留言失败');
    }
    return res.json();
  },

  async updateGuestbookNote(id: string, note: Partial<GuestbookNote>): Promise<GuestbookNote> {
    const res = await fetch(`${API_BASE}/admin/guestbook/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(note)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '更新留言失败');
    }
    return data;
  },

  async deleteGuestbookNote(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/guestbook/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('删除留言失败');
    }
  },

  async getPublicWorks(): Promise<Work[]> {
    const res = await fetch(`${API_BASE}/works`);
    if (!res.ok) throw new Error('获取作品失败');
    return res.json();
  },

  async getAllWorks(): Promise<Work[]> {
    const res = await fetch(`${API_BASE}/admin/works`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('获取作品失败');
    }
    return res.json();
  },

  async createWork(work: Partial<Work>): Promise<Work> {
    const res = await fetch(`${API_BASE}/admin/works`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(work)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '创建作品失败');
    }
    return data;
  },

  async updateWork(id: string, work: Partial<Work>): Promise<Work> {
    const res = await fetch(`${API_BASE}/admin/works/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(work)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '更新作品失败');
    }
    return data;
  },

  async deleteWork(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/works/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('删除作品失败');
    }
  },

  async getSkills(): Promise<Skill[]> {
    const res = await fetch(`${API_BASE}/skills`);
    if (!res.ok) throw new Error('获取技能失败');
    return res.json();
  },

  async getAllSkills(): Promise<Skill[]> {
    const res = await fetch(`${API_BASE}/admin/skills`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('获取技能失败');
    }
    return res.json();
  },

  async createSkill(skill: Partial<Skill>): Promise<Skill> {
    const res = await fetch(`${API_BASE}/admin/skills`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(skill)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '创建技能失败');
    }
    return data;
  },

  async updateSkill(id: string, skill: Partial<Skill>): Promise<Skill> {
    const res = await fetch(`${API_BASE}/admin/skills/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(skill)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '更新技能失败');
    }
    return data;
  },

  async deleteSkill(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/skills/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('删除技能失败');
    }
  },

  async getGrowth(): Promise<Growth[]> {
    const res = await fetch(`${API_BASE}/growth`);
    if (!res.ok) throw new Error('获取成长经历失败');
    return res.json();
  },

  async getAllGrowth(): Promise<Growth[]> {
    const res = await fetch(`${API_BASE}/admin/growth`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('获取成长经历失败');
    }
    return res.json();
  },

  async createGrowth(growth: Partial<Growth>): Promise<Growth> {
    const res = await fetch(`${API_BASE}/admin/growth`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(growth)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '创建成长经历失败');
    }
    return data;
  },

  async updateGrowth(id: string, growth: Partial<Growth>): Promise<Growth> {
    const res = await fetch(`${API_BASE}/admin/growth/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(growth)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '更新成长经历失败');
    }
    return data;
  },

  async deleteGrowth(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/growth/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('删除成长经历失败');
    }
  },

  async getLearning(): Promise<Learning[]> {
    const res = await fetch(`${API_BASE}/learning`);
    if (!res.ok) throw new Error('获取学习计划失败');
    return res.json();
  },

  async getAllLearning(): Promise<Learning[]> {
    const res = await fetch(`${API_BASE}/admin/learning`, {
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('获取学习计划失败');
    }
    return res.json();
  },

  async createLearning(learning: Partial<Learning>): Promise<Learning> {
    const res = await fetch(`${API_BASE}/admin/learning`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(learning)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '创建学习计划失败');
    }
    return data;
  },

  async updateLearning(id: string, learning: Partial<Learning>): Promise<Learning> {
    const res = await fetch(`${API_BASE}/admin/learning/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(learning)
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error(data.error || '更新学习计划失败');
    }
    return data;
  },

  async deleteLearning(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/learning/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    if (!res.ok) {
      if (res.status === 401) {
        authService.logout();
        window.location.href = '/admin';
      }
      throw new Error('删除学习计划失败');
    }
  },

  async translate(text: string, targetLang: string = 'en'): Promise<string> {
    const res = await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, targetLang })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || '翻译失败');
    return data.text;
  }
};
