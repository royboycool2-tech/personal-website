import { VercelRequest, VercelResponse } from '@vercel/node';
import { Redis } from '@upstash/redis';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import guestbookSeed from '../data/guestbook.json';
import growthSeed from '../data/growth.json';
import learningSeed from '../data/learning.json';
import lifeFragmentsSeed from '../data/life-fragments.json';
import skillsSeed from '../data/skills.json';
import worksSeed from '../data/works.json';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

const JWT_SECRET = requireEnv('JWT_SECRET');
const JWT_EXPIRES_IN = '24h';
const ADMIN_USERNAME = requireEnv('ADMIN_USERNAME');
const ADMIN_PASSWORD = requireEnv('ADMIN_PASSWORD');
const ADMIN_PASSWORD_HASH = bcrypt.hashSync(ADMIN_PASSWORD, 10);

interface GuestbookNote {
  id: string;
  nickname: string;
  content: string;
  color: string;
  emoji: string;
  rotation: number;
  createdAt: string;
}

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
  createdAt: string;
  updatedAt: string;
}

interface Work {
  id: string;
  number: string;
  title: string;
  englishTitle: string;
  category: string;
  projectType: 'app' | 'business' | 'exploration' | 'process';
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
  prototypeUrl: string;
  hasLiveProduct: boolean;
  liveUrl: string;
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
  createdAt: string;
  updatedAt: string;
}

interface Skill {
  id: string;
  icon: string;
  iconBgColor: string;
  label: string;
  title: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Growth {
  id: string;
  period: string;
  periodBgColor: string;
  title: string;
  subtitle: string;
  description: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

interface Learning {
  id: string;
  icon: string;
  iconBgColor: string;
  title: string;
  description: string;
  progress: number;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

let guestbookNotes: GuestbookNote[] = [
  {
    id: 'seed-1',
    nickname: '庆庆',
    content: '摔倒了就站起来，不然浪费时间。',
    color: '#FFF9BB',
    emoji: '✨',
    rotation: 1.5,
    createdAt: new Date('2026-07-23').toISOString()
  },
  {
    id: 'seed-2',
    nickname: '小汤',
    content: '世间最可怕的禁锢，从不是物理禁锢，而是内心的彷徨与恐惧：害怕试错成本太高，害怕蝴蝶效应太强，最后选择留在原地。',
    color: '#D6F6D5',
    emoji: '🍀',
    rotation: -1.2,
    createdAt: new Date('2026-07-23').toISOString()
  },
  {
    id: 'seed-3',
    nickname: '小一',
    content: '万事顺遂，毫无蹉跎',
    color: '#E8DFF5',
    emoji: '🌸',
    rotation: 2.3,
    createdAt: new Date('2026-07-22').toISOString()
  },
  {
    id: 'seed-4',
    nickname: '嘉禾望岗',
    content: '永远不落幕的电影阐述着我们的关系🎵',
    color: '#D4F0FC',
    emoji: '🌸',
    rotation: -0.8,
    createdAt: new Date('2026-07-22').toISOString()
  }
];

let lifeFragments: LifeFragment[] = [
  {
    id: 'life1',
    title: '夏天开始有了形状',
    content: '下班时天还很亮，风里已经有夏天的味道。路过花店时拍下了今天最喜欢的一小块颜色。',
    date: '2025.06.18',
    category: 'photo',
    location: '深圳',
    weather: '☀️',
    tags: ['下班路上', '生活随拍'],
    images: [],
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'life2',
    title: '一碗面的治愈',
    content: '下雨天不想做饭，下楼吃了一碗热乎乎的番茄鸡蛋面。简单的食物，最抚凡人心。',
    date: '2025.05.10',
    category: 'diary',
    location: '家楼下',
    mood: '🍜',
    tags: ['美食', '日常'],
    images: [],
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'life3',
    title: '第一次做手冲咖啡',
    content: '跟着教程学了手冲，虽然比例还没掌握好，但整个过程很治愈。闻着咖啡香，时间都慢下来了。',
    date: '2025.04.05',
    category: 'moment',
    location: '家',
    mood: '☕',
    tags: ['新尝试', '成长'],
    images: [],
    isPublic: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let works: Work[] = [
  {
    id: 'work-1',
    number: '001',
    title: '售后二维码',
    englishTitle: 'After-Sales QR Code',
    category: '业务实践 / 产品探索',
    projectType: 'business',
    projectBadge: '真实业务衍生',
    defaultDesc: '基于多语言耳机售后内容，完成信息架构与Axure概念原型探索。',
    hoverDesc: '围绕6种语言、8类常见问题，梳理"扫码—查找问题—阅读方案—联系售后"的用户路径。',
    valueDesc: '让售后答案更容易被找到',
    problemDesc: '解决多语言售后内容分散、用户查找困难、客服压力大的问题',
    myRole: '负责信息架构设计、用户路径梳理、Axure原型制作',
    skills: ['信息架构', '用户路径', 'Axure', '多语言设计', '业务分析'],
    previewImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mobile%20phone%20QR%20code%20after-sales%20service%20app%20interface%20FAQ%20page%20clean%20design&image_size=square_hd',
    concept: '基于真实业务场景的售后二维码产品探索，让用户扫码就能快速找到答案。',
    story: '这是一个源于真实业务需求的探索项目。当时公司的多语言耳机售后内容分散在不同地方，用户查找困难，客服压力也很大。我主动承担起这个探索任务，围绕6种语言、8类常见问题，尝试梳理"扫码—查找问题—阅读方案—联系售后"的完整用户路径，并完成了信息架构设计和Axure概念原型。虽然最终没有正式上线，但这个探索过程让我深刻理解了"从业务问题出发做产品"的思考方式。',
    hasPrototype: true,
    prototypeUrl: 'https://mi2sqn.axshare.com/?code=a5622cf790a66e909596e2877028ddff&g=4',
    hasLiveProduct: false,
    liveUrl: '',
    hasCaseStudy: true,
    yearLabel: 'EXPLORED IN 2025',
    bottomLabel: 'PERSONAL EXPLORATION · AXURE',
    isPublic: true,
    sortOrder: 1,
    details: {
      dimensions: 'Mobile Web',
      medium: 'Axure RP + 用户研究',
      year: '2025'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'work-2',
    number: '002',
    title: '心情记录APP',
    englishTitle: 'Mood Tracker App',
    category: '独立APP设计',
    projectType: 'app',
    projectBadge: '独立APP设计',
    defaultDesc: '一款温柔的情绪追踪工具，用轻量的方式记录每天的心情变化。',
    hoverDesc: '帮助用户觉察情绪模式、建立自我关怀习惯，在忙碌生活中留出与自己对话的空间。',
    valueDesc: '在忙碌日子里，留一块温柔的情绪自留地',
    problemDesc: '解决现代人情绪被忽视、压力积累但缺乏觉察和出口的问题',
    myRole: '产品设计 + UI设计 + 原型制作',
    skills: ['产品设计', 'UI/UX', '交互设计', 'Figma', '动效设计'],
    previewImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=mood%20tracker%20app%20mobile%20interface%20cute%20warm%20colors%20emotional%20journal%20clean%20design&image_size=square_hd',
    concept: '一款温柔的情绪追踪APP，用轻量、温暖的方式陪伴用户记录和觉察情绪。',
    story: '这是我从自己的需求出发设计的一款APP。有段时间工作压力很大，我发现自己甚至说不清"今天心情怎么样"。于是萌生了做一个心情记录工具的想法——不需要复杂的功能，只需要每天花30秒，轻轻点一下就能记录。设计过程中特别注重"温柔感"的营造：圆润的图形、温暖的配色、舒缓的动效，希望它不像一个工具，更像一个可以放心倾诉的朋友。',
    hasPrototype: true,
    prototypeUrl: '',
    hasLiveProduct: false,
    liveUrl: '',
    hasCaseStudy: true,
    yearLabel: 'PROTOTYPE · 2025',
    bottomLabel: 'PRODUCT DESIGN · PROTOTYPE',
    isPublic: true,
    sortOrder: 2,
    details: {
      dimensions: 'iOS & Android',
      medium: 'Figma + Principle',
      year: '2025'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'work-3',
    number: '003',
    title: '书单管理APP',
    englishTitle: 'Reading List App',
    category: '独立APP设计',
    projectType: 'app',
    projectBadge: '独立APP设计',
    defaultDesc: '把想读的书都收进一个口袋，让"收藏=开始读"的距离更近一点。',
    hoverDesc: '解决书单越存越多、却从不翻开的问题，用轻量提醒和阅读进度追踪帮你把想读的书真正读完。',
    valueDesc: '让每一本想读的书，都不只是躺在收藏夹里',
    problemDesc: '解决用户书单囤积、想读的书永远停留在"想读"状态的问题',
    myRole: '产品设计 + 视觉设计 + 交互原型',
    skills: ['产品设计', '信息架构', 'UI设计', '交互原型', '用户思维'],
    previewImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=reading%20list%20app%20mobile%20interface%20books%20library%20cozy%20warm%20minimal%20clean%20design&image_size=square_hd',
    concept: '一款专注于"把想读的书读完"的书单管理APP，让收藏不再是终点。',
    story: '我自己就是一个"书单囤积症"患者——看到推荐就收藏，但收藏了再也没打开过。于是我设计了这款书单管理APP，核心思路不是"让你存更多书"，而是"帮你把存的书读完"。功能上包含：轻量的阅读进度追踪、每周一本的温柔提醒、读书状态可视化等。设计上走的是温暖的纸质书质感，希望每次打开都像翻开一本真正的书。',
    hasPrototype: false,
    prototypeUrl: '',
    hasLiveProduct: false,
    liveUrl: '',
    hasCaseStudy: true,
    yearLabel: 'PERSONAL PROJECT · 2025',
    bottomLabel: 'PRODUCT DESIGN · CONCEPT',
    isPublic: true,
    sortOrder: 3,
    details: {
      dimensions: 'Mobile App',
      medium: 'Figma + 竞品分析',
      year: '2025'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'work-4',
    number: '004',
    title: '产品物料流程优化',
    englishTitle: 'Packaging Process Optimization',
    category: '流程优化 / 标准化建设',
    projectType: 'process',
    projectBadge: '流程优化',
    defaultDesc: '累计推动100余款产品物料交付，建立标准化对接机制，整体落地效率提升约90%。',
    hoverDesc: '解决产品包装与说明书需求反复变更、设计与生产对接断层、交付周期不可控的痛点。',
    valueDesc: '把反复踩的坑，变成可以复用的路',
    problemDesc: '解决物料交付流程不清晰、需求反复变更、跨部门协作效率低下的问题',
    myRole: '主导流程梳理、标准制定、机制落地',
    skills: ['流程设计', '标准化建设', '跨部门协作', '项目管理', '问题分析'],
    previewImage: 'https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=process%20optimization%20workflow%20diagram%20product%20packaging%20standardization%20colorful%20flat%20design&image_size=square_hd',
    concept: '从需求到落地的全链路产品物料标准化体系，让每一次交付都更高效。',
    story: '在担任产品助理期间，我负责产品包装及说明书相关工作。刚接手时，整个流程非常混乱——需求反复变、设计来回改、生产端总是出状况，每次交付都像打仗。我开始有意识地梳理和沉淀：把常见的需求整理成模板、把设计规范整理成checklist、把和生产端的对接标准文档化。慢慢的，大家开始习惯用这些标准，交付越来越顺。最后累计推动了100余款产品物料交付，整体落地效率提升了约90%。这个项目让我深刻体会到：好的产品思维，不仅能做产品，也能优化做事的方式。',
    hasPrototype: false,
    prototypeUrl: '',
    hasLiveProduct: false,
    liveUrl: '',
    hasCaseStudy: true,
    yearLabel: 'WORK PRACTICE · 2024-2026',
    bottomLabel: 'WORK PRACTICE · STANDARDIZATION',
    isPublic: true,
    sortOrder: 4,
    details: {
      dimensions: '全链路体系',
      medium: '流程设计 + 标准规范 + 跨部门协作',
      year: '2024-2026'
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let skills: Skill[] = [
  {
    id: 'skill-1',
    icon: '📊',
    iconBgColor: '#3BB4FE',
    label: '核心技能一',
    title: '[ 财务与审计基础 ]',
    description: '金融学本科背景，系统学习微观经济学、宏观经济学、中央银行学、计量经济学、投资银行学、证券投资学、国际金融学及保险学。持有初级会计师资格，具备财务资料整理、凭证核对、往来函证及审计底稿编制等实践经验。',
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'skill-2',
    icon: '📝',
    iconBgColor: '#FF6B4A',
    label: '核心技能二',
    title: '[ 产品内容管理 ]',
    description: '具备产品包装及说明书全生命周期管理经验，能够完成需求梳理、产品信息归纳、内容框架搭建、合规信息核验与交付质量检查。在工作中注重信息准确性、用户易读性以及产品定位的一致性。',
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'skill-3',
    icon: '🤝',
    iconBgColor: '#3BEA72',
    label: '核心技能三',
    title: '[ 项目协作与执行 ]',
    description: '能够协调业务、认证、运营、品质及设计等多方角色，持续跟进需求、设计、打样、核验和批量生产环节。熟悉跨部门项目推进逻辑，能够及时识别风险、处理流程卡点并保障任务按期交付。',
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let growth: Growth[] = [
  {
    id: 'growth-1',
    period: '2021 — 2025',
    periodBgColor: '#F3C556',
    title: '学生时代：专业积累',
    subtitle: '建立金融基础',
    description: '就读于武昌首义学院金融学专业，本科期间系统学习经济、金融、投资与计量分析等课程。曾获"学习进步先进个人"和国家励志奖学金，在持续学习中逐步形成严谨、细致且注重依据的思考方式。',
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'growth-2',
    period: '2024.12 — 2025.05',
    periodBgColor: '#3BB4FE',
    title: '实习经历：审计实践',
    subtitle: '理解企业经营',
    description: '在北京中天恒会计师事务所浙江分所担任审计助理，参与资料收集、凭证抽查、往来函证和审计底稿编制。通过接触真实企业数据与业务资料，加深了对会计科目、内部流程及企业经营活动的理解。',
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'growth-3',
    period: '2025.08 — 2026.6',
    periodBgColor: '#3BEA72',
    title: '初入职场：产品工作',
    subtitle: '推动业务落地',
    description: '进入深圳市臻亿科技有限公司担任产品助理，负责产品包装及说明书相关工作，衔接业务需求与设计生产流程。累计推动100余款产品物料交付，并参与建立标准化对接机制，使整体落地效率提升约90%。',
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

let learning: Learning[] = [
  {
    id: 'learning-1',
    icon: '📚',
    iconBgColor: '#FF6B4A',
    title: '产品设计思维',
    description: '系统学习产品设计方法论，包括用户研究、需求分析、原型设计等核心能力。',
    progress: 65,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'learning-2',
    icon: '🎨',
    iconBgColor: '#3BB4FE',
    title: 'UI视觉设计',
    description: '提升Figma使用技能，学习色彩搭配、排版设计和组件化设计思维。',
    progress: 40,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'learning-3',
    icon: '💻',
    iconBgColor: '#3BEA72',
    title: '前端开发基础',
    description: '学习HTML、CSS和JavaScript基础知识，了解React框架的核心概念。',
    progress: 25,
    sortOrder: 3,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const redis = Redis.fromEnv();
const STORAGE_KEYS = {
  guestbook: 'personal-website:guestbook',
  lifeFragments: 'personal-website:life-fragments',
  works: 'personal-website:works',
  skills: 'personal-website:skills',
  growth: 'personal-website:growth',
  learning: 'personal-website:learning',
} as const;

async function loadCollection<T>(key: string, fallback: T[]): Promise<T[]> {
  const stored = await redis.get<T[]>(key);
  if (stored) return stored;

  await redis.set(key, fallback, { nx: true });
  return (await redis.get<T[]>(key)) ?? fallback;
}

async function loadState(): Promise<void> {
  [
    guestbookNotes,
    lifeFragments,
    works,
    skills,
    growth,
    learning,
  ] = await Promise.all([
    loadCollection(STORAGE_KEYS.guestbook, guestbookSeed as unknown as GuestbookNote[]),
    loadCollection(STORAGE_KEYS.lifeFragments, lifeFragmentsSeed as unknown as LifeFragment[]),
    loadCollection(STORAGE_KEYS.works, worksSeed as unknown as Work[]),
    loadCollection(STORAGE_KEYS.skills, skillsSeed as unknown as Skill[]),
    loadCollection(STORAGE_KEYS.growth, growthSeed as unknown as Growth[]),
    loadCollection(STORAGE_KEYS.learning, learningSeed as unknown as Learning[]),
  ]);
}

async function saveCollection<T>(key: string, value: T[]): Promise<void> {
  await redis.set(key, value);
}

const authenticateAdmin = (req: VercelRequest, res: VercelResponse, next: () => void) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: '未登录，请先登录' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { username: string };
    (req as any).admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: '登录已过期，请重新登录' });
  }
};

const handleRequest = async (req: VercelRequest, res: VercelResponse) => {
  const { method } = req;
  const url = new URL(req.url || '/', 'http://localhost').pathname;

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (method === 'OPTIONS') {
    return res.status(200).end();
  }

  await loadState();

  if (method === 'POST' && url === '/api/admin/login') {
    const { username, password } = req.body as { username?: string; password?: string };

    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }

    if (username !== ADMIN_USERNAME) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const isPasswordValid = bcrypt.compareSync(password, ADMIN_PASSWORD_HASH);
    if (!isPasswordValid) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    return res.json({
      token,
      username,
      expiresIn: 86400
    });
  }

  if (method === 'GET' && url === '/api/admin/verify') {
    authenticateAdmin(req, res, () => {
      res.json({ valid: true, username: (req as any).admin.username });
    });
    return;
  }

  if (method === 'POST' && url === '/api/admin/upload') {
    try {
      const jsonResponse = await handleUpload({
        body: req.body as HandleUploadBody,
        request: req,
        onBeforeGenerateToken: async (_pathname, clientPayload) => {
          if (!clientPayload) {
            throw new Error('Missing administrator token');
          }
          jwt.verify(clientPayload, JWT_SECRET);
          return {
            allowedContentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
            addRandomSuffix: true,
          };
        },
        onUploadCompleted: async () => {},
      });
      return res.status(200).json(jsonResponse);
    } catch (error) {
      return res.status(401).json({
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    }
  }

  if (method === 'GET' && url === '/api/guestbook') {
    const sorted = [...guestbookNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return res.json(sorted);
  }

  if (method === 'POST' && url === '/api/guestbook') {
    const { nickname, content, color, emoji } = req.body as { nickname?: string; content?: string; color?: string; emoji?: string };
    if (!nickname || !content) {
      return res.status(400).json({ error: '昵称和内容不能为空' });
    }
    const newNote: GuestbookNote = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      nickname: String(nickname),
      content: String(content),
      color: color || '#FFF9BB',
      emoji: emoji || '✨',
      rotation: Math.random() * 6 - 3,
      createdAt: new Date().toISOString(),
    };
    guestbookNotes.unshift(newNote);
    await saveCollection(STORAGE_KEYS.guestbook, guestbookNotes);
    return res.status(201).json(newNote);
  }

  if (method === 'GET' && url === '/api/admin/guestbook') {
    authenticateAdmin(req, res, () => {
      const sorted = [...guestbookNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      res.json(sorted);
    });
    return;
  }

  if (method === 'PUT' && url?.startsWith('/api/admin/guestbook/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const { nickname, content, color, emoji } = req.body as { nickname?: string; content?: string; color?: string; emoji?: string };
      const index = guestbookNotes.findIndex(n => n.id === id);
      if (index === -1) {
        return res.status(404).json({ error: '留言不存在' });
      }
      guestbookNotes[index] = {
        ...guestbookNotes[index],
        nickname: nickname !== undefined ? String(nickname) : guestbookNotes[index].nickname,
        content: content !== undefined ? String(content) : guestbookNotes[index].content,
        color: color !== undefined ? String(color) : guestbookNotes[index].color,
        emoji: emoji !== undefined ? String(emoji) : guestbookNotes[index].emoji,
      };
      res.json(guestbookNotes[index]);
    });
    await saveCollection(STORAGE_KEYS.guestbook, guestbookNotes);
    return;
  }

  if (method === 'DELETE' && url?.startsWith('/api/admin/guestbook/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = guestbookNotes.findIndex(n => n.id === id);
      if (index === -1) {
        return res.status(404).json({ error: '留言不存在' });
      }
      guestbookNotes.splice(index, 1);
      res.json({ success: true });
    });
    await saveCollection(STORAGE_KEYS.guestbook, guestbookNotes);
    return;
  }

  if (method === 'GET' && url === '/api/life-fragments') {
    const publicFragments = lifeFragments.filter(f => f.isPublic);
    const category = req.query.category as string;
    if (category && ['photo', 'diary', 'moment'].includes(category)) {
      return res.json(publicFragments.filter(f => f.category === category));
    }
    return res.json(publicFragments);
  }

  if (method === 'GET' && url === '/api/admin/life-fragments') {
    authenticateAdmin(req, res, () => {
      const category = req.query.category as string;
      if (category && ['photo', 'diary', 'moment'].includes(category)) {
        return res.json(lifeFragments.filter(f => f.category === category));
      }
      res.json(lifeFragments);
    });
    return;
  }

  if (method === 'GET' && url?.startsWith('/api/life-fragments/')) {
    const id = url.split('/').pop() || '';
    const fragment = lifeFragments.find(f => f.id === id);

    if (!fragment) {
      return res.status(404).json({ error: '记录不存在' });
    }

    if (!fragment.isPublic) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        return res.status(403).json({ error: '无权访问此记录' });
      }
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(403).json({ error: '无权访问此记录' });
      }
    }

    return res.json(fragment);
  }

  if (method === 'GET' && url === '/api/life-fragments/stats/summary') {
    const publicFragments = lifeFragments.filter(f => f.isPublic);

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'];

    const monthFragments = publicFragments.filter(f => {
      const date = new Date(f.date.replace(/\./g, '-'));
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    });

    const totalPhotos = monthFragments.reduce((sum, f) => sum + f.images.length, 0);

    const locations = new Set<string>();
    monthFragments.forEach(f => {
      if (f.location) locations.add(f.location);
    });

    const tags = new Set<string>();
    monthFragments.forEach(f => {
      f.tags.forEach(t => tags.add(t));
    });

    return res.json({
      month: monthNames[currentMonth],
      monthName: monthNames[currentMonth],
      totalMoments: monthFragments.length,
      totalPhotos,
      totalLocations: locations.size,
      totalTags: tags.size,
      totalPublicMoments: publicFragments.length,
      latestFragment: monthFragments[0] || null
    });
  }

  if (method === 'POST' && url === '/api/admin/life-fragments') {
    authenticateAdmin(req, res, () => {
      const { title, content, date, category, location, mood, weather, tags, images, isPublic } = req.body as any;

      if (!title || !content || !date) {
        return res.status(400).json({ error: '标题、内容和日期为必填项' });
      }

      const newFragment: LifeFragment = {
        id: `life-${Date.now()}`,
        title,
        content,
        date,
        category: category || 'diary',
        location: location || '',
        mood: mood || '',
        weather: weather || '',
        tags: tags || [],
        images: images || [],
        isPublic: isPublic !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      lifeFragments.unshift(newFragment);
      res.status(201).json(newFragment);
    });
    await saveCollection(STORAGE_KEYS.lifeFragments, lifeFragments);
    return;
  }

  if (method === 'PUT' && url?.startsWith('/api/admin/life-fragments/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = lifeFragments.findIndex(f => f.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '记录不存在' });
      }

      const { title, content, date, category, location, mood, weather, tags, images, isPublic } = req.body as any;

      lifeFragments[index] = {
        ...lifeFragments[index],
        title: title || lifeFragments[index].title,
        content: content !== undefined ? content : lifeFragments[index].content,
        date: date || lifeFragments[index].date,
        category: category || lifeFragments[index].category,
        location: location !== undefined ? location : lifeFragments[index].location,
        mood: mood !== undefined ? mood : lifeFragments[index].mood,
        weather: weather !== undefined ? weather : lifeFragments[index].weather,
        tags: tags || lifeFragments[index].tags,
        images: images || lifeFragments[index].images,
        isPublic: isPublic !== undefined ? isPublic : lifeFragments[index].isPublic,
        updatedAt: new Date().toISOString()
      };

      res.json(lifeFragments[index]);
    });
    await saveCollection(STORAGE_KEYS.lifeFragments, lifeFragments);
    return;
  }

  if (method === 'DELETE' && url?.startsWith('/api/admin/life-fragments/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = lifeFragments.findIndex(f => f.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '记录不存在' });
      }

      lifeFragments.splice(index, 1);
      res.json({ success: true });
    });
    await saveCollection(STORAGE_KEYS.lifeFragments, lifeFragments);
    return;
  }

  if (method === 'GET' && url === '/api/works') {
    const publicWorks = works.filter(w => w.isPublic).sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json(publicWorks);
  }

  if (method === 'GET' && url === '/api/admin/works') {
    authenticateAdmin(req, res, () => {
      const sorted = [...works].sort((a, b) => a.sortOrder - b.sortOrder);
      res.json(sorted);
    });
    return;
  }

  if (method === 'GET' && url?.startsWith('/api/works/')) {
    const id = url.split('/').pop() || '';
    const work = works.find(w => w.id === id);
    if (!work) {
      return res.status(404).json({ error: '作品不存在' });
    }
    if (!work.isPublic) {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
      if (!token) {
        return res.status(403).json({ error: '无权访问此作品' });
      }
      try {
        jwt.verify(token, JWT_SECRET);
      } catch (err) {
        return res.status(403).json({ error: '无权访问此作品' });
      }
    }
    return res.json(work);
  }

  if (method === 'POST' && url === '/api/admin/works') {
    authenticateAdmin(req, res, () => {
      const {
        number, title, englishTitle, category, projectType, projectBadge,
        defaultDesc, hoverDesc, valueDesc, problemDesc, myRole, skills: workSkills,
        previewImage, concept, story,
        hasPrototype, prototypeUrl, hasLiveProduct, liveUrl, hasCaseStudy,
        yearLabel, bottomLabel,
        isPublic, sortOrder, details
      } = req.body as any;

      if (!title || !previewImage) {
        return res.status(400).json({ error: '标题和封面图为必填项' });
      }

      let nextNumber = 1;
      if (works.length > 0) {
        const maxNum = works.reduce((max, w) => {
          const num = parseInt(w.number, 10);
          return isNaN(num) ? max : Math.max(max, num);
        }, 0);
        nextNumber = maxNum + 1;
      }

      const newWork: Work = {
        id: `work-${Date.now()}`,
        number: String(number || String(nextNumber).padStart(3, '0')),
        title: String(title),
        englishTitle: String(englishTitle || ''),
        category: String(category || ''),
        projectType: (projectType || 'app') as 'app' | 'business' | 'exploration' | 'process',
        projectBadge: String(projectBadge || ''),
        defaultDesc: String(defaultDesc || ''),
        hoverDesc: String(hoverDesc || ''),
        valueDesc: String(valueDesc || ''),
        problemDesc: String(problemDesc || ''),
        myRole: String(myRole || ''),
        skills: Array.isArray(workSkills) ? workSkills : [],
        previewImage: String(previewImage),
        concept: String(concept || ''),
        story: String(story || ''),
        hasPrototype: hasPrototype !== undefined ? Boolean(hasPrototype) : !!prototypeUrl,
        prototypeUrl: String(prototypeUrl || ''),
        hasLiveProduct: hasLiveProduct !== undefined ? Boolean(hasLiveProduct) : !!liveUrl,
        liveUrl: String(liveUrl || ''),
        hasCaseStudy: hasCaseStudy !== undefined ? Boolean(hasCaseStudy) : true,
        yearLabel: String(yearLabel || ''),
        bottomLabel: String(bottomLabel || ''),
        isPublic: isPublic !== false,
        sortOrder: sortOrder || works.length + 1,
        details: details || { dimensions: '', medium: '', year: '' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      works.push(newWork);
      res.status(201).json(newWork);
    });
    await saveCollection(STORAGE_KEYS.works, works);
    return;
  }

  if (method === 'PUT' && url?.startsWith('/api/admin/works/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = works.findIndex(w => w.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '作品不存在' });
      }

      const {
        number, title, englishTitle, category, projectType, projectBadge,
        defaultDesc, hoverDesc, valueDesc, problemDesc, myRole, skills: workSkills,
        previewImage, concept, story,
        hasPrototype, prototypeUrl, hasLiveProduct, liveUrl, hasCaseStudy,
        yearLabel, bottomLabel,
        isPublic, sortOrder, details
      } = req.body as any;

      works[index] = {
        ...works[index],
        number: number !== undefined ? String(number) : works[index].number,
        title: title !== undefined ? String(title) : works[index].title,
        englishTitle: englishTitle !== undefined ? String(englishTitle) : works[index].englishTitle,
        category: category !== undefined ? String(category) : works[index].category,
        projectType: projectType !== undefined ? projectType : works[index].projectType,
        projectBadge: projectBadge !== undefined ? String(projectBadge) : works[index].projectBadge,
        defaultDesc: defaultDesc !== undefined ? String(defaultDesc) : works[index].defaultDesc,
        hoverDesc: hoverDesc !== undefined ? String(hoverDesc) : works[index].hoverDesc,
        valueDesc: valueDesc !== undefined ? String(valueDesc) : works[index].valueDesc,
        problemDesc: problemDesc !== undefined ? String(problemDesc) : works[index].problemDesc,
        myRole: myRole !== undefined ? String(myRole) : works[index].myRole,
        skills: workSkills !== undefined ? (Array.isArray(workSkills) ? workSkills : []) : works[index].skills,
        previewImage: previewImage !== undefined ? String(previewImage) : works[index].previewImage,
        concept: concept !== undefined ? String(concept) : works[index].concept,
        story: story !== undefined ? String(story) : works[index].story,
        hasPrototype: hasPrototype !== undefined ? Boolean(hasPrototype) : works[index].hasPrototype,
        prototypeUrl: prototypeUrl !== undefined ? String(prototypeUrl) : works[index].prototypeUrl,
        hasLiveProduct: hasLiveProduct !== undefined ? Boolean(hasLiveProduct) : works[index].hasLiveProduct,
        liveUrl: liveUrl !== undefined ? String(liveUrl) : works[index].liveUrl,
        hasCaseStudy: hasCaseStudy !== undefined ? Boolean(hasCaseStudy) : works[index].hasCaseStudy,
        yearLabel: yearLabel !== undefined ? String(yearLabel) : works[index].yearLabel,
        bottomLabel: bottomLabel !== undefined ? String(bottomLabel) : works[index].bottomLabel,
        isPublic: isPublic !== undefined ? Boolean(isPublic) : works[index].isPublic,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : works[index].sortOrder,
        details: details !== undefined ? { ...works[index].details, ...details } : works[index].details,
        updatedAt: new Date().toISOString()
      };

      res.json(works[index]);
    });
    await saveCollection(STORAGE_KEYS.works, works);
    return;
  }

  if (method === 'DELETE' && url?.startsWith('/api/admin/works/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = works.findIndex(w => w.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '作品不存在' });
      }

      works.splice(index, 1);
      res.json({ success: true });
    });
    await saveCollection(STORAGE_KEYS.works, works);
    return;
  }

  if (method === 'GET' && url === '/api/skills') {
    const sorted = [...skills].sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json(sorted);
  }

  if (method === 'GET' && url === '/api/admin/skills') {
    authenticateAdmin(req, res, () => {
      const sorted = [...skills].sort((a, b) => a.sortOrder - b.sortOrder);
      res.json(sorted);
    });
    return;
  }

  if (method === 'POST' && url === '/api/admin/skills') {
    authenticateAdmin(req, res, () => {
      const { icon, iconBgColor, label, title, description, sortOrder } = req.body as any;

      if (!title) {
        return res.status(400).json({ error: '标题为必填项' });
      }

      const newSkill: Skill = {
        id: `skill-${Date.now()}`,
        icon: icon || '📊',
        iconBgColor: iconBgColor || '#3BB4FE',
        label: label || '',
        title: String(title),
        description: description || '',
        sortOrder: sortOrder || skills.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      skills.push(newSkill);
      res.status(201).json(newSkill);
    });
    await saveCollection(STORAGE_KEYS.skills, skills);
    return;
  }

  if (method === 'PUT' && url?.startsWith('/api/admin/skills/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = skills.findIndex(s => s.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '技能不存在' });
      }

      const { icon, iconBgColor, label, title, description, sortOrder } = req.body as any;

      skills[index] = {
        ...skills[index],
        icon: icon !== undefined ? String(icon) : skills[index].icon,
        iconBgColor: iconBgColor !== undefined ? String(iconBgColor) : skills[index].iconBgColor,
        label: label !== undefined ? String(label) : skills[index].label,
        title: title !== undefined ? String(title) : skills[index].title,
        description: description !== undefined ? String(description) : skills[index].description,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : skills[index].sortOrder,
        updatedAt: new Date().toISOString()
      };

      res.json(skills[index]);
    });
    await saveCollection(STORAGE_KEYS.skills, skills);
    return;
  }

  if (method === 'DELETE' && url?.startsWith('/api/admin/skills/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = skills.findIndex(s => s.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '技能不存在' });
      }

      skills.splice(index, 1);
      res.json({ success: true });
    });
    await saveCollection(STORAGE_KEYS.skills, skills);
    return;
  }

  if (method === 'GET' && url === '/api/growth') {
    const sorted = [...growth].sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json(sorted);
  }

  if (method === 'GET' && url === '/api/admin/growth') {
    authenticateAdmin(req, res, () => {
      const sorted = [...growth].sort((a, b) => a.sortOrder - b.sortOrder);
      res.json(sorted);
    });
    return;
  }

  if (method === 'POST' && url === '/api/admin/growth') {
    authenticateAdmin(req, res, () => {
      const { period, periodBgColor, title, subtitle, description, sortOrder } = req.body as any;

      if (!title) {
        return res.status(400).json({ error: '标题为必填项' });
      }

      const newGrowth: Growth = {
        id: `growth-${Date.now()}`,
        period: period || '',
        periodBgColor: periodBgColor || '#F3C556',
        title: String(title),
        subtitle: subtitle || '',
        description: description || '',
        sortOrder: sortOrder || growth.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      growth.push(newGrowth);
      res.status(201).json(newGrowth);
    });
    await saveCollection(STORAGE_KEYS.growth, growth);
    return;
  }

  if (method === 'PUT' && url?.startsWith('/api/admin/growth/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = growth.findIndex(g => g.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '成长经历不存在' });
      }

      const { period, periodBgColor, title, subtitle, description, sortOrder } = req.body as any;

      growth[index] = {
        ...growth[index],
        period: period !== undefined ? String(period) : growth[index].period,
        periodBgColor: periodBgColor !== undefined ? String(periodBgColor) : growth[index].periodBgColor,
        title: title !== undefined ? String(title) : growth[index].title,
        subtitle: subtitle !== undefined ? String(subtitle) : growth[index].subtitle,
        description: description !== undefined ? String(description) : growth[index].description,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : growth[index].sortOrder,
        updatedAt: new Date().toISOString()
      };

      res.json(growth[index]);
    });
    await saveCollection(STORAGE_KEYS.growth, growth);
    return;
  }

  if (method === 'DELETE' && url?.startsWith('/api/admin/growth/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = growth.findIndex(g => g.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '成长经历不存在' });
      }

      growth.splice(index, 1);
      res.json({ success: true });
    });
    await saveCollection(STORAGE_KEYS.growth, growth);
    return;
  }

  if (method === 'GET' && url === '/api/learning') {
    const sorted = [...learning].sort((a, b) => a.sortOrder - b.sortOrder);
    return res.json(sorted);
  }

  if (method === 'GET' && url === '/api/admin/learning') {
    authenticateAdmin(req, res, () => {
      const sorted = [...learning].sort((a, b) => a.sortOrder - b.sortOrder);
      res.json(sorted);
    });
    return;
  }

  if (method === 'POST' && url === '/api/admin/learning') {
    authenticateAdmin(req, res, () => {
      const { icon, iconBgColor, title, description, progress, sortOrder } = req.body as any;

      if (!title) {
        return res.status(400).json({ error: '标题为必填项' });
      }

      const newLearning: Learning = {
        id: `learning-${Date.now()}`,
        icon: icon || '📚',
        iconBgColor: iconBgColor || '#FF6B4A',
        title: String(title),
        description: description || '',
        progress: progress || 0,
        sortOrder: sortOrder || learning.length + 1,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      learning.push(newLearning);
      res.status(201).json(newLearning);
    });
    await saveCollection(STORAGE_KEYS.learning, learning);
    return;
  }

  if (method === 'PUT' && url?.startsWith('/api/admin/learning/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = learning.findIndex(l => l.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '学习计划不存在' });
      }

      const { icon, iconBgColor, title, description, progress, sortOrder } = req.body as any;

      learning[index] = {
        ...learning[index],
        icon: icon !== undefined ? String(icon) : learning[index].icon,
        iconBgColor: iconBgColor !== undefined ? String(iconBgColor) : learning[index].iconBgColor,
        title: title !== undefined ? String(title) : learning[index].title,
        description: description !== undefined ? String(description) : learning[index].description,
        progress: progress !== undefined ? Number(progress) : learning[index].progress,
        sortOrder: sortOrder !== undefined ? Number(sortOrder) : learning[index].sortOrder,
        updatedAt: new Date().toISOString()
      };

      res.json(learning[index]);
    });
    await saveCollection(STORAGE_KEYS.learning, learning);
    return;
  }

  if (method === 'DELETE' && url?.startsWith('/api/admin/learning/')) {
    authenticateAdmin(req, res, () => {
      const id = url.split('/').pop() || '';
      const index = learning.findIndex(l => l.id === id);

      if (index === -1) {
        return res.status(404).json({ error: '学习计划不存在' });
      }

      learning.splice(index, 1);
      res.json({ success: true });
    });
    await saveCollection(STORAGE_KEYS.learning, learning);
    return;
  }

  return res.status(404).json({ error: '未找到该接口' });
};

export default handleRequest;
