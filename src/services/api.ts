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

export interface Learning {
  id: string;
  icon: string;
  iconBgColor: string;
  title: string;
  description: string;
  progress: number;
  sortOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

const API_BASE = '/api';

const getAuthHeaders = (): HeadersInit => {
  const token = authService.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
};

export const apiService = {
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

  async getStatsSummary(): Promise<StatsSummary> {
    const res = await fetch(`${API_BASE}/life-fragments/stats/summary`);
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
