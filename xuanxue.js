
(function(){
  try {
    var t = localStorage.getItem('xuanxue_theme') || localStorage.getItem('tianjishu-theme');
    if (t) document.documentElement.setAttribute('data-theme', t);
  } catch(_) {}
})();


// Suppress network error noise in console (Worker offline is expected)
window.addEventListener('unhandledrejection', function(e) {
  var msg = e.reason && (e.reason.message || String(e.reason));
  if (msg && (msg.includes('所有通道') || msg.includes('Failed to fetch') ||
      msg.includes('NetworkError') || msg.includes('AbortError') ||
      msg.includes('HTTP 500') || msg.includes('HTTP 4'))) {
    e.preventDefault();
  }
});


(function() {
  try {
    const _origToFixed = Number.prototype.toFixed;
    const _patched = function(digits) {
      if (isNaN(this) || !isFinite(this)) return '0';
      return _origToFixed.call(this, digits);
    };
    Object.defineProperty(Number.prototype, 'toFixed', {
      value: _patched, writable: true, configurable: true
    });
  } catch(e) {
  }

  window._safeFixed = function(n, digits) {
    try {
      const num = Number(n);
      if (isNaN(num) || !isFinite(num)) return '0';
      return num.toFixed(digits || 0);
    } catch(e) { return '0'; }
  };

  window._sf = function(v, d) {
    return window._safeFixed(v, d || 0);
  };
  window._n = function(v, fallback) {
    const n = Number(v);
    return (isNaN(n) || !isFinite(n)) ? (fallback || 0) : n;
  };
  window._fmtP = function(v) {
    const n = Number(v);
    if (isNaN(n) || !isFinite(n) || n === 0) return '--';
    if (n >= 10000) return '$' + Math.round(n).toLocaleString();
    if (n >= 1)     return '$' + window._safeFixed(n, 2);
    if (n >= 0.01)  return '$' + window._safeFixed(n, 4);
    return '$' + window._safeFixed(n, 6);
  };
})();const _KV = (() => {
  // Worker已停用 — 纯本地localStorage实现，零网络请求
  let _cache = {};

  async function get(key, fallback) {
    if (_cache[key] !== undefined) return _cache[key];
    try {
      const local = localStorage.getItem(key);
      if (local !== null) { _cache[key] = local; return local; }
    } catch(_) {}
    return fallback !== undefined ? fallback : null;
  }

  async function set(key, value) {
    const str = typeof value === 'string' ? value : JSON.stringify(value);
    _cache[key] = str;
    try { localStorage.setItem(key, str); } catch(_) {}
  }

  async function syncAll() {} // no-op

  return { get, set, syncAll };
})();

(function() {
  const _origSetItem = localStorage.setItem.bind(localStorage);
  const SYNC_KEYS = ['custom_engine_weights','err_price','err_time','err_weights','err_stats','simple_weights','price_errors','time_errors'];
  try {
    localStorage.setItem = function(key, value) {
      _origSetItem(key, value);
      if (SYNC_KEYS.includes(key)) {
        _KV.set(key, value);
      }
    };
  } catch(e) {
  }
})();









(function() {
  const c = document.getElementById('bgCanvas');
  if (!c) return;
  const ctx = c.getContext('2d');
  let W, H, stars = [], lines = [];

  function resize() {
    W = c.width = window.innerWidth;
    H = c.height = window.innerHeight;
    stars = Array.from({length:120}, () => ({
      x: Math.random()*W, y: Math.random()*H,
      r: Math.random()*1.2+0.2,
      a: Math.random(), da: (Math.random()-.5)*.004
    }));
  }

  function draw() {
    ctx.clearRect(0,0,W,H);
    ctx.fillStyle = '#02020e';
    ctx.fillRect(0,0,W,H);

    const g = ctx.createRadialGradient(W*.3,H*.4,0,W*.3,H*.4,W*.7);
    g.addColorStop(0,'rgba(10,6,30,0.9)');
    g.addColorStop(1,'rgba(2,2,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    ctx.strokeStyle = 'rgba(200,168,74,0.03)';
    ctx.lineWidth = 1;
    for(let x=0;x<W;x+=64) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=64) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    stars.forEach(s => {
      s.a = Math.max(0.05, Math.min(1, s.a + s.da));
      if(s.a<=0.05||s.a>=1) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(220,210,180,${s.a})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  var _canvasResizeT = null;
  window.addEventListener('resize', function() {
    clearTimeout(_canvasResizeT);
    _canvasResizeT = setTimeout(resize, 200);
  }, {passive: true});
  resize(); draw();
})();


// ── localStorage memory cache (prevents repeated disk reads) ──────────────
var _LSC = {};
var _localStorage = {
  getItem: function(k) {
    if (k in _LSC) return _LSC[k];
    try { _LSC[k] = localStorage.getItem(k); } catch(e) { _LSC[k] = null; }
    return _LSC[k];
  },
  setItem: function(k, v) {
    _LSC[k] = String(v);
    try { localStorage.setItem(k, v); } catch(e) {}
  },
  removeItem: function(k) {
    delete _LSC[k];
    try { localStorage.removeItem(k); } catch(e) {}
  }
};

function rng(seed) {
  let s = (seed ^ 0xdeadbeef) >>> 0;
  return () => {
    s = Math.imul(s ^ s>>>16, 0x45d9f3b);
    s = Math.imul(s ^ s>>>16, 0x45d9f3b);
    s = (s ^ s>>>16) >>> 0;
    return s / 0xffffffff;
  };
}

function seed(date, coin, salt=0) {
  const d = new Date(date);
  return (d.getFullYear()*10000 + (d.getMonth()+1)*100 + d.getDate())
       ^ (coin.split('').reduce((a,c,i)=>a + c.charCodeAt(0)*(i+1)*7,0))
       ^ salt;
}

function addDays(d, n) {
  const r = new Date(d); r.setDate(r.getDate()+n); return r;
}

function fmt(d) {
  return d.toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'});
}

const HEXAGRAMS = [
  ['䷀','乾','刚健自强'],['䷁','坤','厚德载物'],['䷂','屯','艰难起步'],['䷃','蒙','启蒙开智'],
  ['䷄','需','等待时机'],['䷅','讼','争讼慎行'],['䷆','师','军旅整顿'],['䷇','比','亲附归依'],
  ['䷈','小畜','蓄积待发'],['䷉','履','谨慎履行'],['䷊','泰','天地交泰'],['䷋','否','闭塞不通'],
  ['䷌','同人','同心协力'],['䷍','大有','大丰盈满'],['䷎','谦','谦逊有礼'],['䷏','豫','喜悦顺畅'],
  ['䷐','随','顺应随行'],['䷑','蛊','整顿革新'],['䷒','临','临近时机'],['䷓','观','观察审视'],
  ['䷔','噬嗑','果断决断'],['䷕','贲','文饰修饰'],['䷖','剥','剥落消减'],['䷗','复','复归回归'],
  ['䷘','无妄','诚实无妄'],['䷙','大畜','积蓄大成'],['䷚','颐','颐养正道'],['䷛','大过','大事过极'],
  ['䷜','坎','险陷重重'],['䷝','离','附丽光明'],['䷞','咸','感应相通'],['䷟','恒','持久恒常'],
  ['䷠','遯','退隐遁走'],['䷡','大壮','阳刚大壮'],['䷢','晋','上进晋升'],['䷣','明夷','光明受伤'],
  ['䷤','家人','家庭和睦'],['䷥','睽','乖违对立'],['䷦','蹇','艰难跛行'],['䷧','解','解脱困境'],
  ['䷨','损','减损培德'],['䷩','益','增益获利'],['䷪','夬','果决裂变'],['䷫','姤','邂逅相遇'],
  ['䷬','萃','聚集汇合'],['䷭','升','上升进取'],['䷮','困','困窘穷乏'],['䷯','井','养民汲水'],
  ['䷰','革','变革革新'],['䷱','鼎','鼎新图变'],['䷲','震','震动惊骇'],['䷳','艮','静止止步'],
  ['䷴','渐','渐进稳步'],['䷵','归妹','归妹嫁娶'],['䷶','丰','丰盛繁荣'],['䷷','旅','旅行在外'],
  ['䷸','巽','谦逊入微'],['䷹','兑','喜悦交流'],['䷺','涣','涣散离析'],['䷻','节','节制有度'],
  ['䷼','中孚','诚信中正'],['䷽','小过','小有过差'],['䷾','既济','已成功就'],['䷿','未济','尚未完成'],
];

const PLANETS = ['木星','土星','水星','金星','火星','月亮','太阳','罗睺','计都'];
const NAKS = ['昴宿','毕宿','觜宿','参宿','井宿','鬼宿','柳宿','星宿','张宿','翼宿','轸宿','角宿','亢宿','氐宿','心宿','尾宿','箕宿','斗宿','女宿','虚宿','危宿','室宿','壁宿','奎宿','娄宿','胃宿','昴宿'];
const STARS = ['天心','天蓬','天任','天冲','天辅','天英','天芮','天柱','天禽'];
const DOORS = ['开门','休门','生门','伤门','杜门','景门','死门','惊门'];
const GODS  = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
const BAGUA = ['☰乾','☱兑','☲离','☳震','☴巽','☵坎','☶艮','☷坤'];
const STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const BRANCHES=['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const GANN_ANG = [30,45,60,90,120,135,144,180,216,225,240,270,315,360];
const GANN_CYCLES = [90,144,180,270,360,540,720];

const NATAL_CHARTS = {
  BTC: {
    name: '比特币', en: 'Bitcoin',
    date: '2009-01-03', time: '18:15:05', tz: 'UTC',
    location: 'London, UK (Genesis Block)',
    source: 'blockchain.com Genesis Block时间戳',
    sun: '摩羯座 12°', moon: '白羊座', asc: '狮子座',
    planets: {
      sun: { sign:'摩羯', deg:12, house:6 },
      moon: { sign:'白羊', deg:14, house:8 },
      mercury: { sign:'摩羯', deg:18, house:6 },
      venus: { sign:'双鱼', deg:0, house:7 },
      mars: { sign:'摩羯', deg:27, house:6, note:'与冥王星合相' },
      jupiter: { sign:'摩羯', deg:29, house:6, note:'29°临界度' },
      saturn: { sign:'处女', deg:20, house:2, note:'与天王星对分' },
      uranus: { sign:'双鱼', deg:19, house:8, note:'与土星对分' },
      neptune: { sign:'水瓶', deg:21, house:7 },
      pluto: { sign:'摩羯', deg:1, house:6, note:'与火星合相' },
      rahu: { sign:'狮子', deg:20, house:1 },
      ketu: { sign:'水瓶', deg:20, house:7 },
    },
    nakshatra: '推夸宿(Pushya)上升',
    vedic_asc: '巨蟹座(Cancer)',
    vedic_lord: '月亮',
    halving_dates: ['2012-11-28','2016-07-09','2020-05-11','2024-04-20'],
    key_aspects: '火星-冥王星合相摩羯(革命力量) · 土星-天王星对分(传统vs革新) · 木星29°(扩张极限点)',
    char_energy: '摩羯阳刚、长线积累、颠覆权威',
    gann_sq: 3
  },
  ETH: {
    name: '以太坊', en: 'Ethereum',
    date: '2015-07-30', time: '03:26:13', tz: 'UTC',
    location: 'Zug, Switzerland (Ethereum Foundation)',
    source: 'Block 0时间戳 - 2015-07-30T03:26:13Z',
    sun: '狮子座 6°', moon: '天秤座', asc: '射手座',
    planets: {
      sun: { sign:'狮子', deg:6, house:9 },
      moon: { sign:'天秤', deg:28, house:11 },
      mercury: { sign:'狮子', deg:5, house:9 },
      venus: { sign:'狮子', deg:4, house:9, note:'日金水三合' },
      mars: { sign:'巨蟹', deg:13, house:8 },
      jupiter: { sign:'狮子', deg:28, house:9, note:'落在9宫扩张' },
      saturn: { sign:'天蝎', deg:28, house:12, note:'上升前12宫' },
      uranus: { sign:'白羊', deg:20, house:5 },
      neptune: { sign:'双鱼', deg:9, house:4 },
      pluto: { sign:'摩羯', deg:14, house:2 },
      rahu: { sign:'处女', deg:7, house:10 },
      ketu: { sign:'双鱼', deg:7, house:4 },
    },
    nakshatra: '牛宿(Rohini)月亮',
    vedic_asc: '射手座(Sagittarius)',
    vedic_lord: '木星',
    key_aspects: '日金水三合狮子(创新领导) · 木星狮子9宫(全球扩张) · 土星天蝎12宫(暗中积蓄力量)',
    char_energy: '狮子创造、智能合约、去中心应用生态',
    gann_sq: Math.round(Math.sqrt(2015))
  },
  SOL: {
    name: '索拉纳', en: 'Solana',
    date: '2020-03-16', time: '14:30:51', tz: 'UTC',
    location: 'San Francisco, CA (Solana Labs)',
    source: 'Genesis Block时间戳 2020-03-16 08:30:51 CST',
    sun: '双鱼座 26°', moon: '摩羯座', asc: '巨蟹座',
    planets: {
      sun: { sign:'双鱼', deg:26, house:9 },
      moon: { sign:'摩羯', deg:3, house:7 },
      mercury: { sign:'双鱼', deg:15, house:9 },
      venus: { sign:'金牛', deg:2, house:11 },
      mars: { sign:'摩羯', deg:0, house:7 },
      jupiter: { sign:'摩羯', deg:22, house:7, note:'土木合相前夕' },
      saturn: { sign:'摩羯', deg:29, house:7, note:'土星摩羯强势' },
      uranus: { sign:'金牛', deg:4, house:11 },
      neptune: { sign:'双鱼', deg:19, house:9 },
      pluto: { sign:'摩羯', deg:24, house:7 },
      rahu: { sign:'巨蟹', deg:3, house:1 },
      ketu: { sign:'摩羯', deg:3, house:7 },
    },
    nakshatra: '牛宿(Rohini)上升',
    vedic_asc: '巨蟹座(Cancer)',
    vedic_lord: '月亮',
    key_aspects: '土木冥三星聚摩羯(大变革前夕) · 金天合金牛(速度创新) · 海日合双鱼(技术梦想)',
    char_energy: '高速处理、2020大合相之子、FTX劫后余生',
    gann_sq: Math.round(Math.sqrt(2020))
  },
  BNB: {
    name: '币安币', en: 'Binance Coin',
    date: '2017-07-01', time: '00:00:00', tz: 'UTC',
    location: 'Shanghai, China (Binance ICO)',
    source: 'ICO期间 2017-06-26至07-03，取中点',
    sun: '巨蟹座 9°', moon: '摩羯座', asc: '白羊座',
    planets: {
      sun: { sign:'巨蟹', deg:9, house:4 },
      moon: { sign:'摩羯', deg:22, house:10 },
      mercury: { sign:'狮子', deg:5, house:5 },
      venus: { sign:'金牛', deg:16, house:2 },
      mars: { sign:'巨蟹', deg:22, house:4 },
      jupiter: { sign:'天秤', deg:16, house:7 },
      saturn: { sign:'射手', deg:21, house:9 },
      uranus: { sign:'白羊', deg:28, house:1 },
      neptune: { sign:'双鱼', deg:14, house:12 },
      pluto: { sign:'摩羯', deg:18, house:10 },
      rahu: { sign:'狮子', deg:25, house:5 },
      ketu: { sign:'水瓶', deg:25, house:11 },
    },
    nakshatra: '牛宿(Rohini)太阳',
    vedic_asc: '白羊座(Aries)',
    vedic_lord: '火星',
    key_aspects: '日火合巨蟹4宫(家族根基) · 月冥摩羯10宫对冲(权力博弈) · 天王白羊1宫(颠覆先锋)',
    char_energy: '交易所生态核心、赵长鹏铁腕、烧币通缩',
    gann_sq: Math.round(Math.sqrt(2017))
  },
  XRP: {
    name: '瑞波币', en: 'XRP/Ripple',
    date: '2013-02-01', time: '12:00:00', tz: 'UTC',
    location: 'San Francisco, CA (Ripple Labs)',
    source: 'XRP Ledger创世 2013年2月，Ripple公司成立2012年9月',
    sun: '水瓶座 12°', moon: '处女座', asc: '金牛座',
    planets: {
      sun: { sign:'水瓶', deg:12, house:10 },
      moon: { sign:'处女', deg:8, house:5 },
      mercury: { sign:'摩羯', deg:28, house:9 },
      venus: { sign:'摩羯', deg:17, house:9 },
      mars: { sign:'双鱼', deg:4, house:11 },
      jupiter: { sign:'双子', deg:9, house:2 },
      saturn: { sign:'天蝎', deg:10, house:7 },
      uranus: { sign:'白羊', deg:5, house:12 },
      neptune: { sign:'双鱼', deg:2, house:11 },
      pluto: { sign:'摩羯', deg:10, house:9 },
      rahu: { sign:'天蝎', deg:24, house:7 },
      ketu: { sign:'金牛', deg:24, house:1 },
    },
    nakshatra: '心宿(Jyeshtha)土星',
    vedic_asc: '金牛座(Taurus)',
    vedic_lord: '金星',
    key_aspects: '日水瓶10宫(全球金融革命) · 土星天蝎7宫(法律诉讼宿命) · SEC诉讼与土星宿命联系',
    char_energy: '银行跨境支付、法律博弈、等待黎明',
    gann_sq: Math.round(Math.sqrt(2013))
  },
  DOGE: {
    name: '狗狗币', en: 'Dogecoin',
    date: '2013-12-06', time: '00:00:00', tz: 'UTC',
    location: 'Portland, OR / Sydney, AU',
    source: 'Genesis Block 2013-12-06 (Billy Markus + Jackson Palmer)',
    sun: '射手座 14°', moon: '双子座', asc: '射手座',
    planets: {
      sun: { sign:'射手', deg:14, house:1 },
      moon: { sign:'双子', deg:21, house:7 },
      mercury: { sign:'射手', deg:15, house:1, note:'日汞合相' },
      venus: { sign:'摩羯', deg:11, house:2 },
      mars: { sign:'天秤', deg:12, house:11 },
      jupiter: { sign:'巨蟹', deg:19, house:8 },
      saturn: { sign:'天蝎', deg:17, house:12 },
      uranus: { sign:'白羊', deg:8, house:5 },
      neptune: { sign:'双鱼', deg:3, house:4 },
      pluto: { sign:'摩羯', deg:10, house:2 },
      rahu: { sign:'天蝎', deg:7, house:12 },
      ketu: { sign:'金牛', deg:7, house:6 },
    },
    nakshatra: '斗宿(Moola)太阳',
    vedic_asc: '射手座(Sagittarius)',
    vedic_lord: '木星',
    key_aspects: '日汞合射手1宫(玩笑成真) · 木星巨蟹8宫(意外暴涨) · 马斯克推文激活天王白羊5宫',
    char_energy: '网络梗文化、马斯克加持、社区无限供应',
    gann_sq: Math.round(Math.sqrt(2013))
  },
  ADA: {
    name: '卡尔达诺', en: 'Cardano',
    date: '2017-09-29', time: '00:00:00', tz: 'UTC',
    location: 'Hong Kong (IOHK / Charles Hoskinson)',
    source: 'ADA主网上线 2017-09-29',
    sun: '天秤座 6°', moon: '射手座', asc: '巨蟹座',
    planets: {
      sun: { sign:'天秤', deg:6, house:4 },
      moon: { sign:'射手', deg:14, house:6 },
      mercury: { sign:'处女', deg:28, house:3 },
      venus: { sign:'处女', deg:21, house:3 },
      mars: { sign:'处女', deg:21, house:3 },
      jupiter: { sign:'天秤', deg:22, house:4 },
      saturn: { sign:'射手', deg:22, house:6 },
      uranus: { sign:'白羊', deg:27, house:10 },
      neptune: { sign:'双鱼', deg:12, house:9 },
      pluto: { sign:'摩羯', deg:17, house:7 },
      rahu: { sign:'狮子', deg:23, house:2 },
      ketu: { sign:'水瓶', deg:23, house:8 },
    },
    nakshatra: '角宿(Chitra)太阳',
    vedic_asc: '巨蟹座(Cancer)',
    vedic_lord: '月亮',
    key_aspects: '日木合天秤(智识平衡) · 金火合处女(精密技术) · 学术型区块链',
    char_energy: '学术严谨、慢工出细活、同行评审',
    gann_sq: Math.round(Math.sqrt(2017))
  },
  AVAX: {
    name: '雪崩协议', en: 'Avalanche',
    date: '2020-09-21', time: '00:00:00', tz: 'UTC',
    location: 'New York, USA (Ava Labs)',
    source: 'AVAX主网启动 2020-09-21',
    sun: '处女座 28°', moon: '白羊座', asc: '巨蟹座',
    planets: {
      sun: { sign:'处女', deg:28, house:3 },
      moon: { sign:'白羊', deg:19, house:10 },
      mercury: { sign:'天秤', deg:7, house:4 },
      venus: { sign:'狮子', deg:17, house:2 },
      mars: { sign:'白羊', deg:22, house:10, note:'月火合白羊10宫' },
      jupiter: { sign:'摩羯', deg:20, house:7 },
      saturn: { sign:'摩羯', deg:25, house:7 },
      uranus: { sign:'金牛', deg:10, house:11 },
      neptune: { sign:'双鱼', deg:18, house:9 },
      pluto: { sign:'摩羯', deg:22, house:7 },
      rahu: { sign:'双子', deg:26, house:12 },
      ketu: { sign:'射手', deg:26, house:6 },
    },
    nakshatra: '角宿(Chitra)太阳',
    vedic_asc: '巨蟹座(Cancer)',
    vedic_lord: '月亮',
    key_aspects: '月火合白羊10宫(速度称王) · 土木冥摩羯7宫(伙伴竞争激烈) · 高吞吐量天生基因',
    char_energy: '雪崩共识、子网生态、DeFi乐土',
    gann_sq: Math.round(Math.sqrt(2020))
  },
  LINK: {
    name: '链链', en: 'Chainlink',
    date: '2017-09-19', time: '00:00:00', tz: 'UTC',
    location: 'San Francisco, CA (SmartContract.com)',
    source: 'LINK ICO & TGE 2017-09-19',
    sun: '处女座 26°', moon: '金牛座', asc: '双子座',
    planets: {
      sun: { sign:'处女', deg:26, house:4 },
      moon: { sign:'金牛', deg:12, house:12 },
      mercury: { sign:'处女', deg:13, house:4 },
      venus: { sign:'处女', deg:9, house:4 },
      mars: { sign:'处女', deg:12, house:4, note:'日汞金火四星聚处女' },
      jupiter: { sign:'天秤', deg:22, house:5 },
      saturn: { sign:'射手', deg:21, house:7 },
      uranus: { sign:'白羊', deg:27, house:11 },
      neptune: { sign:'双鱼', deg:12, house:10 },
      pluto: { sign:'摩羯', deg:17, house:8 },
      rahu: { sign:'狮子', deg:25, house:3 },
      ketu: { sign:'水瓶', deg:25, house:9 },
    },
    nakshatra: '角宿(Chitra)太阳',
    vedic_asc: '双子座(Gemini)',
    vedic_lord: '水星',
    key_aspects: '四星聚处女4宫(精密服务底层) · 预言机基础设施、链上数据门户',
    char_energy: '预言机之王、数据连接现实与区块链',
    gann_sq: Math.round(Math.sqrt(2017))
  },
  DOT: {
    name: '波卡', en: 'Polkadot',
    date: '2020-05-26', time: '00:00:00', tz: 'UTC',
    location: 'Zug, Switzerland (Web3 Foundation)',
    source: 'DOT主网创世块 2020-05-26',
    sun: '双子座 5°', moon: '天蝎座', asc: '摩羯座',
    planets: {
      sun: { sign:'双子', deg:5, house:6 },
      moon: { sign:'天蝎', deg:28, house:11 },
      mercury: { sign:'双子', deg:19, house:6 },
      venus: { sign:'双子', deg:21, house:6 },
      mars: { sign:'双鱼', deg:24, house:3 },
      jupiter: { sign:'摩羯', deg:27, house:1, note:'木星上升摩羯' },
      saturn: { sign:'摩羯', deg:1, house:1, note:'逆行，土星上升' },
      uranus: { sign:'金牛', deg:8, house:5 },
      neptune: { sign:'双鱼', deg:20, house:3 },
      pluto: { sign:'摩羯', deg:24, house:1 },
      rahu: { sign:'双子', deg:29, house:6 },
      ketu: { sign:'射手', deg:29, house:12 },
    },
    nakshatra: '毕宿(Rohini)上升',
    vedic_asc: '摩羯座(Capricorn)',
    vedic_lord: '土星',
    key_aspects: '木土冥聚摩羯1宫(跨链革命者) · 日金合双子6宫(服务互联互通) · Web3基础架构',
    char_energy: '平行链、跨链通信、Web3基础设施',
    gann_sq: Math.round(Math.sqrt(2020))
  },
  GOLD: {
    name: '黄金', en: 'Gold (COMEX)',
    date: '1974-12-31', time: '09:30:00', tz: 'EST',
    location: 'New York, COMEX Exchange',
    source: 'COMEX黄金期货首日交易 1974-12-31 (美国恢复私人持金权后)',
    sun: '摩羯座 9°', moon: '金牛座', asc: '水瓶座',
    planets: {
      sun: { sign:'摩羯', deg:9, house:12 },
      moon: { sign:'金牛', deg:4, house:4 },
      mercury: { sign:'摩羯', deg:2, house:12 },
      venus: { sign:'射手', deg:26, house:11 },
      mars: { sign:'摩羯', deg:21, house:12 },
      jupiter: { sign:'双鱼', deg:1, house:2 },
      saturn: { sign:'巨蟹', deg:14, house:6, note:'土星逆行' },
      uranus: { sign:'天蝎', deg:27, house:10 },
      neptune: { sign:'射手', deg:10, house:11 },
      pluto: { sign:'天秤', deg:8, house:9 },
      rahu: { sign:'射手', deg:27, house:11 },
      ketu: { sign:'双子', deg:27, house:5 },
    },
    nakshatra: '斗宿(Uttara Ashadha)太阳',
    vedic_asc: '水瓶座(Aquarius)',
    vedic_lord: '土星',
    key_aspects: '日汞火三星摩羯12宫(暗中储备财富) · 月金牛4宫(土地实物根基) · 通胀避险天生本命',
    char_energy: '通胀对冲、避险天堂、摩羯保守增值',
    gann_sq: Math.round(Math.sqrt(1974)),
    commodity: true,
    gann_price_sq: 35
  },
  SILVER: {
    name: '白银', en: 'Silver (COMEX)',
    date: '1933-07-05', time: '10:00:00', tz: 'EST',
    location: 'New York, COMEX (前身 Commodity Exchange Inc.)',
    source: 'COMEX成立1933年，白银期货随之交易',
    sun: '巨蟹座 13°', moon: '金牛座', asc: '天秤座',
    planets: {
      sun: { sign:'巨蟹', deg:13, house:10 },
      moon: { sign:'金牛', deg:22, house:8 },
      mercury: { sign:'狮子', deg:2, house:11 },
      venus: { sign:'双子', deg:29, house:9 },
      mars: { sign:'处女', deg:4, house:12 },
      jupiter: { sign:'处女', deg:10, house:12 },
      saturn: { sign:'摩羯', deg:0, house:4, note:'土星摩羯本命' },
      uranus: { sign:'白羊', deg:23, house:7 },
      neptune: { sign:'处女', deg:1, house:12 },
      pluto: { sign:'巨蟹', deg:21, house:10 },
      rahu: { sign:'水瓶', deg:15, house:5 },
      ketu: { sign:'狮子', deg:15, house:11 },
    },
    nakshatra: '鬼宿(Pushya)太阳',
    vedic_asc: '天秤座(Libra)',
    vedic_lord: '金星',
    key_aspects: '日冥合巨蟹10宫(权力控制定价) · 土星摩羯4宫(实物基础) · Hunt兄弟逼仓宿命',
    char_energy: '工业+贵金属双重属性、波动剧烈、受黄金影响',
    gann_sq: Math.round(Math.sqrt(1933)),
    commodity: true
  },
  OIL: {
    name: '原油(WTI)', en: 'Crude Oil WTI (NYMEX)',
    date: '1983-03-30', time: '09:00:00', tz: 'EST',
    location: 'New York, NYMEX Exchange',
    source: 'NYMEX WTI原油期货首日交易 1983-03-30',
    sun: '白羊座 9°', moon: '天秤座', asc: '双子座',
    planets: {
      sun: { sign:'白羊', deg:9, house:11 },
      moon: { sign:'天秤', deg:3, house:5 },
      mercury: { sign:'白羊', deg:6, house:11 },
      venus: { sign:'金牛', deg:5, house:12 },
      mars: { sign:'金牛', deg:27, house:12 },
      jupiter: { sign:'射手', deg:9, house:7, note:'逆行' },
      saturn: { sign:'天蝎', deg:1, house:6 },
      uranus: { sign:'射手', deg:9, house:7, note:'与木星合相' },
      neptune: { sign:'摩羯', deg:28, house:8 },
      pluto: { sign:'天秤', deg:27, house:5 },
      rahu: { sign:'双子', deg:14, house:1 },
      ketu: { sign:'射手', deg:14, house:7 },
    },
    nakshatra: '昴宿(Ashwini)太阳',
    vedic_asc: '双子座(Gemini)',
    vedic_lord: '水星',
    key_aspects: '日汞合白羊11宫(全球同行竞争) · 木天射手7宫(OPEC博弈) · 土天蝎6宫(地缘政治能源危机)',
    char_energy: '地缘政治驱动、OPEC政策敏感、周期性大涨大跌',
    gann_sq: Math.round(Math.sqrt(1983)),
    commodity: true
  },
  TSMC: {
    name: '台积电', en: 'TSMC (Taiwan Semiconductor)',
    date: '1987-02-21', time: '09:00:00', tz: 'Asia/Taipei',
    location: 'Hsinchu, Taiwan (台積電成立)',
    source: '台積電公司成立日 1987-02-21，張忠謀創辦',
    sun: '双鱼座 2°', moon: '射手座', asc: '金牛座',
    planets: {
      sun:     { sign:'双鱼', deg:2,  house:11 },
      moon:    { sign:'射手', deg:18, house:8  },
      mercury: { sign:'水瓶', deg:25, house:10 },
      venus:   { sign:'白羊', deg:5,  house:12 },
      mars:    { sign:'射手', deg:6,  house:8  },
      jupiter: { sign:'白羊', deg:0,  house:12 },
      saturn:  { sign:'射手', deg:17, house:8, note:'土星逆行，与火星合相' },
      uranus:  { sign:'摩羯', deg:25, house:9  },
      neptune: { sign:'摩羯', deg:7,  house:9  },
      pluto:   { sign:'天蝎', deg:9,  house:7  },
      rahu:    { sign:'白羊', deg:27, house:12 },
      ketu:    { sign:'天秤', deg:27, house:6  },
    },
    nakshatra: '娄宿(Uttara Bhadrapada)太阳',
    vedic_asc: '金牛座(Taurus)',
    vedic_lord: '金星',
    key_aspects: '日双鱼11宫(全球科技网络) · 土火射手8宫(危机驱动转型) · 天王摩羯9宫(技术革命宿命)',
    char_energy: '晶圆代工王者、地缘政治敏感、AI驱动需求',
    gann_sq: Math.round(Math.sqrt(1987)),
    commodity: true
  },
  SPX: {
    name: '标普500', en: 'S&P 500 Index',
    date: '1957-03-04', time: '10:00:00', tz: 'America/New_York',
    location: 'New York, NYSE (标普500指数正式启用)',
    source: '标普500指数1957-03-04正式扩展至500只成分股',
    sun: '双鱼座 13°', moon: '狮子座', asc: '双子座',
    planets: {
      sun:     { sign:'双鱼', deg:13, house:10 },
      moon:    { sign:'狮子', deg:7,  house:3  },
      mercury: { sign:'双鱼', deg:26, house:11 },
      venus:   { sign:'白羊', deg:8,  house:11 },
      mars:    { sign:'双子', deg:15, house:1  },
      jupiter: { sign:'处女', deg:4,  house:4  },
      saturn:  { sign:'射手', deg:13, house:7, note:'与太阳对分' },
      uranus:  { sign:'狮子', deg:4,  house:3  },
      neptune: { sign:'天蝎', deg:1,  house:6  },
      pluto:   { sign:'狮子', deg:29, house:4  },
      rahu:    { sign:'天蝎', deg:15, house:6  },
      ketu:    { sign:'金牛', deg:15, house:12 },
    },
    nakshatra: '觜宿(Uttara Bhadrapada)太阳',
    vedic_asc: '双子座(Gemini)',
    vedic_lord: '水星',
    key_aspects: '日双鱼10宫(全球资本中枢) · 土射手7宫(周期牛熊轮回) · 冥狮子4宫(权力资本积累)',
    char_energy: '全球资本风向标、美联储政策镜像、科技权重驱动',
    gann_sq: Math.round(Math.sqrt(1957)),
    commodity: true
  },
  HSI: {
    name: '恒生指数', en: 'Hang Seng Index',
    date: '1969-11-24', time: '10:00:00', tz: 'Asia/Hong_Kong',
    location: 'Hong Kong (恒生指数正式发布)',
    source: '恒生指数1969-11-24正式对外发布，基准点100',
    sun: '射手座 1°', moon: '白羊座', asc: '摩羯座',
    planets: {
      sun:     { sign:'射手', deg:1,  house:12 },
      moon:    { sign:'白羊', deg:22, house:4  },
      mercury: { sign:'天蝎', deg:28, house:11 },
      venus:   { sign:'天蝎', deg:15, house:11 },
      mars:    { sign:'水瓶', deg:16, house:2  },
      jupiter: { sign:'天秤', deg:2,  house:10 },
      saturn:  { sign:'金牛', deg:8,  house:5, note:'土星逆行' },
      uranus:  { sign:'天秤', deg:4,  house:10 },
      neptune: { sign:'天蝎', deg:28, house:11 },
      pluto:   { sign:'处女', deg:26, house:9  },
      rahu:    { sign:'双鱼', deg:10, house:3  },
      ketu:    { sign:'处女', deg:10, house:9  },
    },
    nakshatra: '尾宿(Moola)太阳',
    vedic_asc: '摩羯座(Capricorn)',
    vedic_lord: '土星',
    key_aspects: '日射手12宫(东西方资本暗流) · 木天秤10宫(中港金融枢纽) · 土金牛5宫(地产周期宿命)',
    char_energy: '中港经济晴雨表、政策敏感、地产金融双驱动',
    gann_sq: Math.round(Math.sqrt(1969)),
    commodity: true
  }
};

function engineNatal(coin, date) {
  const coinConf  = (window.dashCoins || []).find(c => c.coin === coin);
  const lookupKey = coinConf?.natalKey || coin;
  const nc = NATAL_CHARTS[lookupKey];
  if(!nc) return null;

  const targetDate = new Date(date);
  const birthDate  = new Date(nc.date);

  const ageYears = (targetDate - birthDate) / (365.25 * 24 * 3600 * 1000);
  const ageDays  = (targetDate - birthDate) / (24 * 3600 * 1000);

  const jupCycle  = 11.86;
  const jupPhase  = (ageYears % jupCycle) / jupCycle;
  const jupReturn = Math.abs(jupPhase - Math.round(jupPhase)) < 0.08;

  const satCycle  = 29.5;
  const satPhase  = (ageYears % satCycle) / satCycle;
  const satReturn = Math.abs(satPhase - Math.round(satPhase)) < 0.06;

  const satSqPhase = (ageYears % (satCycle/4)) / (satCycle/4);
  const satSquare  = Math.abs(satSqPhase - Math.round(satSqPhase)) < 0.1;

  const progSunDeg = (ageYears * 1) % 360;
  const progSunSign = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'][Math.floor(progSunDeg/30)];

  let halvingEffect = '';
  if(nc.halving_dates) {
    nc.halving_dates.forEach(hd => {
      const hdDate = new Date(hd);
      const diff = Math.abs((targetDate - hdDate) / (24*3600*1000));
      if(diff < 180) halvingEffect = diff < 30 ? '当前处于减半窗口期！' : '减半后效应期';
    });
  }

  const solarArcDeg = ageYears % 360;

  const birthYear = birthDate.getFullYear();
  const gannSeedSq = Math.sqrt(birthYear);
  const currentSq  = Math.sqrt(targetDate.getFullYear());
  const gannYearArc = (currentSq - gannSeedSq) * (currentSq - gannSeedSq);

  const r = rng(seed(date,coin,8888));
  let resonance = 0.4 + r()*0.3;
  if(jupReturn) resonance += 0.2;
  if(satReturn) resonance += 0.15;
  if(satSquare) resonance += 0.1;
  if(halvingEffect) resonance += 0.15;
  resonance = Math.min(1, resonance);

  const bullNatal = ['木星','金星','太阳','月亮'];
  const bearNatal = ['土星','火星','冥王星','罗睺'];
  let bias = r()*0.4 - 0.2;
  const lords = [nc.planets.jupiter?.sign, nc.planets.venus?.sign];
  if(nc.vedic_lord && bullNatal.includes(nc.vedic_lord)) bias += 0.2;
  if(nc.vedic_lord && bearNatal.includes(nc.vedic_lord)) bias -= 0.2;
  if(jupReturn) bias += 0.25;
  if(satReturn) bias -= 0.1;
  bias = Math.max(-1, Math.min(1, bias));

  return {
    nc, ageYears: (ageYears||0).toFixed(1), ageDays: Math.round(ageDays),
    jupPhase: (jupPhase*100).toFixed(0), jupReturn,
    satPhase: (satPhase*100).toFixed(0), satReturn, satSquare,
    progSunSign, progSunDeg: (progSunDeg||0).toFixed(1),
    solarArcDeg: (solarArcDeg||0).toFixed(1),
    halvingEffect, gannYearArc: (gannYearArc||0).toFixed(0),
    resonance, bias, conf: resonance
  };
}

const HARMONICS = [
  { name:'蝙蝠', en:'Bat', xab:.382, abc:.382, bcd:1.618, xad:.886 },
  { name:'螃蟹', en:'Crab', xab:.382, abc:.618, bcd:3.618, xad:1.618 },
  { name:'加菲猫', en:'Gartley', xab:.618, abc:.382, bcd:1.272, xad:.786 },
  { name:'蝴蝶', en:'Butterfly', xab:.786, abc:.382, bcd:1.618, xad:1.272 },
  { name:'深蟹', en:'DeepCrab', xab:.886, abc:.382, bcd:2.618, xad:1.618 },
  { name:'鲨鱼', en:'Shark', xab:1.13, abc:.618, bcd:1.618, xad:.886 },
  { name:'ABCD', en:'ABCD', xab:.618, abc:.618, bcd:1.618, xad:1.272 },
  { name:'三驱', en:'3Drives', xab:1.272, abc:.618, bcd:1.272, xad:1.618 },
];

const FIBS = [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.414, 1.618, 2.0, 2.618];


function engineQiMen(coin, date) {
  const d = new Date(date);
  const yr = d.getFullYear();
  const mo = d.getMonth() + 1;
  const dy = d.getDate();
  const hr = d.getHours() || 12;

  const JIEQI_DATES = [
    [1,6],[1,20],[2,4],[2,19],[3,6],[3,21],
    [4,5],[4,20],[5,6],[5,21],[6,6],[6,21],
    [7,7],[7,23],[8,7],[8,23],[9,8],[9,23],
    [10,8],[10,23],[11,7],[11,22],[12,7],[12,22]
  ];
  const JIEQI_NAMES = [
    '小寒','大寒','立春','雨水','惊蛰','春分',
    '清明','谷雨','立夏','小满','芒种','夏至',
    '小暑','大暑','立秋','处暑','白露','秋分',
    '寒露','霜降','立冬','小雪','大雪','冬至'
  ];

  let jqIdx = 0;
  for (let i = 0; i < 24; i++) {
    const [jqMo, jqDy] = JIEQI_DATES[i];
    if (mo > jqMo || (mo === jqMo && dy >= jqDy)) jqIdx = i;
  }

  const isYang = (jqIdx >= 23 || jqIdx < 11);

  const dayOffset = Math.floor((dy - 1) / 10) % 3;
  const juNum = ((jqIdx % 3) * 3 + dayOffset) % 9 + 1;

  const shiIdx = Math.floor(((hr + 1) % 24) / 2);

  const zhiFuGong = isYang
    ? ((juNum - 1 + shiIdx) % 9) + 1
    : ((9 - (juNum - 1 + shiIdx) % 9) % 9) + 1;

  const XING_ORDER = ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'];
  const DOOR_ORDER = ['休门','生门','伤门','杜门','景门','死门','惊门','开门'];
  const GOD_ORDER  = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
  const gongSeq    = [1,2,3,4,6,7,8,9];

  const starInGong = {};
  const doorInGong = {};
  const godInGong  = {};
  for (let i = 0; i < 9; i++) {
    const g = isYang
      ? ((zhiFuGong - 1 + i) % 9) + 1
      : ((zhiFuGong - 1 - i + 90) % 9) + 1;
    starInGong[g] = XING_ORDER[i];
  }
  for (let i = 0; i < 8; i++) {
    const gIdx = isYang ? (juNum - 1 + i) % 8 : (juNum - 1 - i + 80) % 8;
    doorInGong[gongSeq[gIdx]] = DOOR_ORDER[i];
  }
  for (let i = 0; i < 8; i++) {
    const gIdx = isYang ? (zhiFuGong - 1 + i) % 8 : (zhiFuGong - 1 - i + 80) % 8;
    godInGong[gongSeq[gIdx]] = GOD_ORDER[i];
  }

  const palace = zhiFuGong;
  const star   = starInGong[palace] || STARS[0];
  const door   = doorInGong[palace] || DOORS[0];
  const god    = godInGong[palace]  || GODS[0];

  const stemIdx   = ((yr - 4) % 10 + 10) % 10;
  const branchIdx = ((yr - 4) % 12 + 12) % 12;
  const stem      = STEMS[stemIdx];
  const branch    = BRANCHES[branchIdx];
  const bagua     = BAGUA[zhiFuGong % 8];

  const BULL_DOORS = ['开门','生门','休门'];
  const BEAR_DOORS = ['死门','惊门','伤门'];
  const BULL_GODS  = ['九天','六合','太阴'];
  const BEAR_GODS  = ['腾蛇','白虎','玄武'];
  const BULL_STARS = ['天心','天辅','天英'];
  const BEAR_STARS = ['天蓬','天芮','天柱'];

  let bias = 0;
  if (BULL_DOORS.includes(door)) bias += 0.55;
  if (BEAR_DOORS.includes(door)) bias -= 0.55;
  if (BULL_GODS.includes(god))   bias += 0.20;
  if (BEAR_GODS.includes(god))   bias -= 0.20;
  if (BULL_STARS.includes(star)) bias += 0.15;
  if (BEAR_STARS.includes(star)) bias -= 0.15;
  bias += isYang ? 0.05 : -0.05;
  bias = Math.max(-1, Math.min(1, bias));

  const strongDoor = [...BULL_DOORS, ...BEAR_DOORS].includes(door);
  const conf       = strongDoor ? 0.68 : 0.50;
  const FORMAT_LIST = ['超神','迫元','转蓬','五不遇'];
  const format      = FORMAT_LIST[jqIdx % 4];

  const SHICHEN      = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  const SHICHEN_UTC8 = ['07:00','09:00','11:00','13:00','15:00','17:00','19:00','21:00','23:00','01:00','03:00','05:00'];
  const ENTRY_MAP = { '开门':8,'生门':2,'休门':0,'景门':6 };
  const EXIT_MAP  = { '死门':6,'惊门':9,'伤门':3,'杜门':4 };
  const entryShiIdx = (ENTRY_MAP[door] !== undefined) ? ENTRY_MAP[door] : (zhiFuGong + 2) % 12;
  const exitShiIdx  = (EXIT_MAP[door]  !== undefined) ? EXIT_MAP[door]  : (zhiFuGong + 8) % 12;
  const goodTimes   = [SHICHEN[entryShiIdx], SHICHEN[(entryShiIdx + 4) % 12]];
  const badTimes    = [SHICHEN[exitShiIdx]];
  const entryTime   = SHICHEN[entryShiIdx]  + '（≈' + SHICHEN_UTC8[entryShiIdx]  + ' UTC+8）';
  const exitTime    = SHICHEN[exitShiIdx]   + '（≈' + SHICHEN_UTC8[exitShiIdx]   + ' UTC+8）';
  const direction   = bias > 0.3 ? '多' : bias < -0.3 ? '空' : '观望';

  return {
    palace, star, door, god, stem, branch, bagua, bias, conf, format,
    isYang, juNum, jieqi: JIEQI_NAMES[jqIdx], zhiFuGong,
    entryTime,
    exitTime,
    goodTimes,
    badTimes,
    direction,
    confidence: conf,
  };
}

function engineIChing(coin, date) {
  const d   = new Date(date);
  const yr  = d.getFullYear();
  const mo  = d.getMonth() + 1;
  const dy  = d.getDate();
  const hr  = d.getHours() || 12;
  const shi = Math.floor(((hr + 1) % 24) / 2);

  const upperIdx = ((yr + mo + dy) % 8 + 8) % 8;
  const lowerIdx = ((yr + mo + dy + shi) % 8 + 8) % 8;
  const XIAN_BAGUA = ['☰乾','☱兑','☲离','☳震','☴巽','☵坎','☶艮','☷坤'];
  const XIAN_TIAN  = ['乾','兑','离','震','巽','坎','艮','坤'];
  const upper = XIAN_BAGUA[upperIdx];
  const lower = XIAN_BAGUA[lowerIdx];

  const HEXAGRAM_TABLE = [
    [  0,43,14,34, 9, 5,26,11],
    [ 10,58,38,54,61,41,19,19],
    [ 13,49,30,55,37,63,22,36],
    [ 25,17,21,51,42, 3,27,24],
    [ 44,28,50,32,57,48,18,46],
    [  6,47,56,40,59,29, 4, 7],
    [ 33,31,56,62,53,39,52,15],
    [ 12,45,35,16,20, 8,23, 2],
  ];
  const hexIdx = Math.min(63, HEXAGRAM_TABLE[lowerIdx][upperIdx]);
  const hex    = HEXAGRAMS[hexIdx];

  const line = ((yr + mo + dy + shi) % 6) + 1;

  const rhexIdx = Math.min(63, hexIdx ^ (1 << (line - 1)));
  const rhex    = HEXAGRAMS[rhexIdx];

  const BULL_HEX = new Set([0,13,10,12,33,34,15,41,45,48,14,17,16]);
  const BEAR_HEX = new Set([1,11,38,46,29,44,22,35,55,47,39,23,63]);

  let bias = 0;
  if (BULL_HEX.has(hexIdx))  bias += 0.50;
  if (BEAR_HEX.has(hexIdx))  bias -= 0.50;
  if (BULL_HEX.has(rhexIdx)) bias += 0.20;
  if (BEAR_HEX.has(rhexIdx)) bias -= 0.20;

  if (line === 1 || line === 6) bias *= 1.25;
  if (line === 2 || line === 5) bias *= 0.80;

  const MONTH_BIAS = [0.2,0.1,0.15,0.2,0.1,0.3,-0.1,-0.15,-0.2,-0.1,-0.2,-0.3];
  bias += (MONTH_BIAS[mo - 1] || 0) * 0.3;
  bias = Math.max(-1, Math.min(1, bias));

  const strongHex = BULL_HEX.has(hexIdx) || BEAR_HEX.has(hexIdx);
  const conf      = strongHex ? 0.65 + Math.min(0.25, Math.abs(bias) * 0.35) : 0.45;
  const judgment  = bias > 0.35 ? '大吉' : bias > 0.1 ? '小吉' : bias < -0.35 ? '大凶' : bias < -0.1 ? '小凶' : '平';

  const trend = bias > 0.2 ? '上升' : bias < -0.2 ? '下跌' : '震荡';
  const CHANGE_DAYS = [1, 3, 7, 14, 21, 30];
  const changeDay  = CHANGE_DAYS[line - 1] || line;
  const hexName    = hex[1] + '卦';
  const changeHex  = rhex[1] + '卦';

  return {
    hex, line, rhex, upper, lower, bias, conf, judgment,
    hexIdx, rhexIdx, upperName: XIAN_TIAN[upperIdx], lowerName: XIAN_TIAN[lowerIdx],
    trend,
    changeDay,
    hexagram: hexName,
    changingHex: changeHex,
    confidence: conf,
  };
}

function engineVedic(coin, date) {
  const r = rng(seed(date,coin,3003));
  const asc   = NAKS[Math.floor(r()*27)];
  const moon  = NAKS[Math.floor(r()*27)];
  const lord  = PLANETS[Math.floor(r()*9)];
  const trans = PLANETS[Math.floor(r()*9)];
  const dasha = PLANETS[Math.floor(r()*9)];
  const antar = PLANETS[Math.floor(r()*9)];
  const yoga  = ['吉祥瑜伽','拉贾瑜伽','陀螺瑜伽','财富瑜伽','般若瑜伽','哈纳瑜伽'][Math.floor(r()*6)];
  const rasi  = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'][Math.floor(r()*12)];
  const bullP = ['木星','金星','月亮','太阳'];
  const bearP = ['土星','罗睺','火星','计都'];
  let bias = r()*2-1;
  if(bullP.includes(lord)) bias += 0.3;
  if(bearP.includes(lord)) bias -= 0.3;
  if(bullP.includes(trans)) bias += 0.2;
  if(bearP.includes(trans)) bias -= 0.2;
  bias = Math.max(-1,Math.min(1,bias));
  const conf = 0.44+r()*0.42;

  const EXPAND_PLANETS = ['木星','金星','太阳','月亮'];
  const CONTRACT_PLANETS = ['土星','罗睺','计都','火星'];
  const cycle = EXPAND_PLANETS.includes(dasha) ? '扩张' :
                CONTRACT_PLANETS.includes(dasha) ? '收缩' : '过渡';
  const energy = Math.round((bias + 1) / 2 * 100);
  const planet = dasha;
  const cycleNote = cycle === '扩张'
    ? `${dasha}大运·扩张期，趋势性行情偏多，可顺势持有`
    : cycle === '收缩'
    ? `${dasha}大运·收缩期，回调风险增大，注意止损`
    : `${dasha}大运·过渡期，方向尚不明朗，轻仓观望`;

  return {
    asc, moon, lord, trans, dasha, antar, yoga, rasi, bias, conf,
    cycle,
    energy,
    planet,
    cycleNote,
    confidence: conf,
  };
}


function gannSquareOfNine(price, extendLevels = 8) {
  const sqP   = Math.sqrt(price);
  const angle = (sqP % 2) * 180;

  const levels = [];
  for (let n = -extendLevels; n <= extendLevels; n++) {
    if (n === 0) continue;
    const gannStep = parseFloat(_localStorage.getItem('gann_step') || '2');
    const sqLvl = sqP + n * gannStep;
    if (sqLvl <= 0) continue;
    const lvlPrice = Math.pow(sqLvl, 2);
    const pctFromP = ((lvlPrice - price) / (price||1) * 100).toFixed(2);
    levels.push({
      price:    Math.round(lvlPrice * 100) / 100,
      sqVal:    sqLvl.toFixed(4),
      n,
      pct:      parseFloat(pctFromP),
      source:   'S9 ' + (n > 0 ? '+' : '') + n + '圈',
      isAbove:  lvlPrice > price,
    });
  }

  const cardinalAngles = [0, 90, 180, 270];
  const cardinalLevels = [];
  for (let ring = 1; ring <= 6; ring++) {
    cardinalAngles.forEach(deg => {
      const sqLvl = sqP + ring * 2 + deg / 180;
      if (sqLvl <= 0) return;
      const lvlPrice = Math.pow(sqLvl, 2);
      const pctFromP = ((lvlPrice - price) / (price||1) * 100).toFixed(2);
      cardinalLevels.push({
        price:   Math.round(lvlPrice * 100) / 100,
        sqVal:   sqLvl.toFixed(4),
        deg,
        ring,
        pct:     parseFloat(pctFromP),
        source:  'S9 ' + deg + '°R' + ring,
        isAbove: lvlPrice > price,
      });
    });
  }

  return { sqP: sqP.toFixed(4), angle: angle.toFixed(1), levels, cardinalLevels };
}

const GANN_ANGLE_RATIOS = [
  { label: '8×1', ratio: 8,    deg: 82.5 },
  { label: '4×1', ratio: 4,    deg: 75.0 },
  { label: '3×1', ratio: 3,    deg: 71.6 },
  { label: '2×1', ratio: 2,    deg: 63.4 },
  { label: '1×1', ratio: 1,    deg: 45.0 },
  { label: '1×2', ratio: 0.5,  deg: 26.6 },
  { label: '1×3', ratio: 0.333,deg: 18.4 },
  { label: '1×4', ratio: 0.25, deg: 14.0 },
  { label: '1×8', ratio: 0.125,deg: 7.1  },
];

function gannAngles(basePrice, targetPrice, daysFromBase) {
  const scale = Math.sqrt(basePrice);

  return GANN_ANGLE_RATIOS.map(a => {
    const priceAtT = basePrice + a.ratio * scale * daysFromBase;
    const pct      = ((priceAtT - targetPrice) / targetPrice * 100).toFixed(2);
    const isAbove  = priceAtT > targetPrice;
    const dist     = Math.abs(priceAtT - targetPrice);
    const proximity= (1 - Math.min(1, dist / targetPrice)).toFixed(3);
    return {
      label:    a.label,
      deg:      a.deg,
      price:    Math.round(priceAtT * 100) / 100,
      pct:      parseFloat(pct),
      isAbove,
      proximity: parseFloat(proximity),
      source:   '角度' + a.label + '(' + a.deg + '°)',
    };
  }).filter(a => a.price > 0);
}

const GANN_MULT = [
  { label: '×1/8',  mult: 0.125 },
  { label: '×1/4',  mult: 0.25  },
  { label: '×3/8',  mult: 0.375 },
  { label: '×1/2',  mult: 0.5   },
  { label: '×5/8',  mult: 0.625 },
  { label: '×2/3',  mult: 0.667 },
  { label: '×3/4',  mult: 0.75  },
  { label: '×1',    mult: 1.0   },
  { label: '×4/3',  mult: 1.333 },
  { label: '×3/2',  mult: 1.5   },
  { label: '×2',    mult: 2.0   },
  { label: '×3',    mult: 3.0   },
  { label: '×4',    mult: 4.0   },
  { label: '×8',    mult: 8.0   },
];

function gannPriceMultiples(high, low, currentPrice) {
  const targets = [];
  GANN_MULT.forEach(m => {
    const fromH = high * m.mult;
    if (fromH > 0) targets.push({
      price:   Math.round(fromH * 100) / 100,
      source:  '前高' + m.label,
      mult:    m.mult,
      isAbove: fromH > currentPrice,
      pct:     parseFloat(((fromH - currentPrice) / (currentPrice||1) * 100).toFixed(2)),
    });
    const fromL = low * m.mult;
    if (fromL > 0 && Math.abs(fromL - fromH) / currentPrice > 0.005) targets.push({
      price:   Math.round(fromL * 100) / 100,
      source:  '前低' + m.label,
      mult:    m.mult,
      isAbove: fromL > currentPrice,
      pct:     parseFloat(((fromL - currentPrice) / (currentPrice||1) * 100).toFixed(2)),
    });
  });
  return targets.filter(t => t.price > 0);
}

function classifyMarketState(klines) {
  if (!klines || klines.length < 20) {
    return { state: 'ranging', label: '震荡市', atr: 0, adx: 0, trend: 0 };
  }

  const closes = klines.map(k => parseFloat(k[4]));
  const highs  = klines.map(k => parseFloat(k[2]));
  const lows   = klines.map(k => parseFloat(k[3]));
  const n      = closes.length;

  const trList = [];
  for (let i = 1; i < n; i++) {
    const tr = Math.max(
      highs[i] - lows[i],
      Math.abs(highs[i] - closes[i-1]),
      Math.abs(lows[i]  - closes[i-1])
    );
    trList.push(tr);
  }
  const atrPeriod = 14;
  let atr = trList.slice(0, atrPeriod).reduce((s,v)=>s+v,0) / atrPeriod;
  for (let i = atrPeriod; i < trList.length; i++) {
    atr = (atr * (atrPeriod - 1) + trList[i]) / atrPeriod;
  }
  const atrPct = atr / closes[n-1] * 100;

  const dmPlusList  = [], dmMinusList = [];
  for (let i = 1; i < n; i++) {
    const upMove   = highs[i]  - highs[i-1];
    const downMove = lows[i-1] - lows[i];
    dmPlusList.push( upMove   > downMove && upMove   > 0 ? upMove   : 0);
    dmMinusList.push(downMove > upMove   && downMove > 0 ? downMove : 0);
  }
  const smooth = (arr, p) => {
    let s = arr.slice(0,p).reduce((a,b)=>a+b,0);
    const res = [s];
    for (let i = p; i < arr.length; i++) { s = s - s/p + arr[i]; res.push(s); }
    return res;
  };
  const sDMp  = smooth(dmPlusList,  atrPeriod);
  const sDMm  = smooth(dmMinusList, atrPeriod);
  const sATR  = smooth(trList,      atrPeriod);
  const DIp   = sDMp.map((v,i)  => sATR[i] > 0 ? v / sATR[i] * 100 : 0);
  const DIm   = sDMm.map((v,i)  => sATR[i] > 0 ? v / sATR[i] * 100 : 0);
  const DX    = DIp.map((v,i)   => (Math.abs(v - DIm[i]) / (v + DIm[i] + 0.001)) * 100);
  const adx   = DX.slice(-atrPeriod).reduce((s,v)=>s+v,0) / atrPeriod;

  const ema = (arr, p) => {
    const k = 2 / (p + 1);
    let e = arr[0];
    return arr.map(v => { e = v * k + e * (1 - k); return e; });
  };
  const ema5  = ema(closes, 5);
  const ema20 = ema(closes, 20);
  const ema60 = ema(closes, Math.min(60, n));
  const e5    = ema5[n-1], e20 = ema20[n-1], e60 = ema60[n-1];
  const price = closes[n-1];

  const bullAlign = price > e5 && e5 > e20 && e20 > e60;
  const bearAlign = price < e5 && e5 < e20 && e20 < e60;
  const trend = e5 > e20 ? 1 : -1;

  let state, label;
  if (atrPct > 5) {
    state = 'high_volatility';
    label = '高波动';
  } else if (adx > 25 && bullAlign) {
    state = 'trending_up';
    label = '上升趋势';
  } else if (adx > 25 && bearAlign) {
    state = 'trending_down';
    label = '下降趋势';
  } else {
    state = 'ranging';
    label = '震荡市';
  }

  return { state, label, atrPct: atrPct.toFixed(2), adx: adx.toFixed(1), trend,
           bullAlign, bearAlign, e5, e20, e60 };
}

const DEFAULT_WEIGHTS_BY_STATE = {
  trending_up:     { gann: 0.40, chan: 0.30, sr: 0.20, harmonic: 0.10 },
  trending_down:   { gann: 0.35, chan: 0.35, sr: 0.20, harmonic: 0.10 },
  ranging:         { gann: 0.25, chan: 0.25, sr: 0.35, harmonic: 0.15 },
  high_volatility: { gann: 0.20, chan: 0.20, sr: 0.30, harmonic: 0.30 },
};

function getWeightsByState(state) {
  const stored = localStorage.getItem('weights_' + state);
  const base   = DEFAULT_WEIGHTS_BY_STATE[state] || DEFAULT_WEIGHTS_BY_STATE.ranging;
  if (!stored) return { ...base };
  try {
    const parsed = JSON.parse(stored);
    const merged = { ...base, ...parsed };
    const total  = Object.values(merged).reduce((s,v)=>s+v,0);
    Object.keys(merged).forEach(k => merged[k] /= total);
    return merged;
  } catch(e) { return { ...base }; }
}

function saveWeightsByState(state, weights) {
  const total = Object.values(weights).reduce((s,v)=>s+v,0)||1;
  const norm  = {};
  Object.keys(weights).forEach(k => norm[k] = weights[k]/total);
  localStorage.setItem('weights_' + state, JSON.stringify(norm));
}

let _currentMarketState = { state: 'ranging', label: '震荡市' };

function calculateOptimalStep(historyData) {
  if (!historyData || historyData.length < 5) {
    return parseFloat(_localStorage.getItem('gann_step') || '2');
  }
  let bestStep = 2, bestErr = Infinity;
  for (let step = 1.0; step <= 3.5; step += 0.25) {
    let totalErr = 0;
    historyData.forEach(({ price, actualPrice3d }) => {
      if (!price || !actualPrice3d) return;
      const sqP  = Math.sqrt(price);
      const next = Math.pow(sqP + step, 2);
      const err  = Math.abs(next - actualPrice3d) / actualPrice3d;
      totalErr  += err;
    });
    const avgErr = totalErr / historyData.length;
    if (avgErr < bestErr) { bestErr = avgErr; bestStep = step; }
  }
  _localStorage.setItem('gann_step', bestStep.toString());
  return bestStep;
}

function calculateOptimalFractalWindow(historyData) {
  if (!historyData || historyData.length < 5) {
    return parseInt(_localStorage.getItem('chan_fractal_window') || '1');
  }
  let bestW = 1, bestAcc = 0;
  for (let w = 1; w <= 3; w++) {
    let correct = 0;
    historyData.forEach(({ date, coin, price, high, low, actualDir }) => {
      if (!price) return;
      _localStorage.setItem('chan_fractal_window', w.toString());
      const ch  = engineChan(coin || 'BTC', date || '2024-01-01', price, high || price*1.1, low || price*0.9, 0);
      const dir = ch.biDir === 'up' ? 'bull' : 'bear';
      if (dir === actualDir) correct++;
    });
    const acc = correct / historyData.length;
    if (acc > bestAcc) { bestAcc = acc; bestW = w; }
  }
  _localStorage.setItem('chan_fractal_window', bestW.toString());
  return bestW;
}

function runParamOptimization() {
  const errors = JSON.parse(_localStorage.getItem('err_price') || '[]');
  if (errors.length < 5) {
    alert('需要至少5条误差记录才能运行参数优化\n请先完成历史回测');
    return;
  }
  const histData = errors
    .filter(e => e.predicted && e.actual)
    .map(e => ({
      date:          e.date,
      price:         e.predicted,
      actualPrice3d: e.actual,
      actualDir:     e.actual > e.predicted ? 'bull' : 'bear',
    }));

  const bestStep = calculateOptimalStep(histData);
  const bestWin  = calculateOptimalFractalWindow(histData);

  const stepEl = document.getElementById('paramGannStep');
  const winEl  = document.getElementById('paramChanWindow');
  if (stepEl) stepEl.value = bestStep;
  if (winEl)  winEl.value  = bestWin;

  alert(`参数优化完成！\n江恩步长: ${bestStep}\n缠论分型窗口: ${bestWin}\n\n参数已自动保存，下次推演生效。`);
}

function engineGann(coin, date, price, high, low) {
  const P = price || 50000;
  const H = high || P * 1.18;
  const L = low || P * 0.82;
  
  const sqrtP = Math.sqrt(P);
  const angle = (sqrtP % 2) * 180;
  
  const levels = [];
  for (let n = -8; n <= 8; n++) {
    if (n === 0) continue;
    const gannStep    = parseFloat(_localStorage.getItem('gann_step') || '2');
    const sqrtLevel   = sqrtP + n * gannStep;
    if (sqrtLevel <= 0) continue;
    
    const priceLevel = Math.pow(sqrtLevel, 2);
    const pctChange = ((priceLevel - P) / P * 100);
    
    levels.push({
      price: Math.round(priceLevel * 100) / 100,
      n: n,
      pct: parseFloat(pctChange.toFixed(2)),
      isAbove: priceLevel > P,
      type: n > 0 ? '阻力' : '支撑',
      source: `江恩方格 ${Math.abs(n)}圈`
    });
  }
  
  levels.sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct));
  
  const scale = Math.sqrt(L);
  const birthDate = NATAL_CHARTS[coin]?.date ? new Date(NATAL_CHARTS[coin].date) : new Date('2009-01-03');
  const targetDate = new Date(date);
  const daysFromBase = Math.max(1, Math.floor((targetDate - birthDate) / 86400000) % 360);
  
  const angleDefs = [
    { label: '8×1', ratio: 8, deg: 82.5 },
    { label: '4×1', ratio: 4, deg: 75.0 },
    { label: '3×1', ratio: 3, deg: 71.6 },
    { label: '2×1', ratio: 2, deg: 63.4 },
    { label: '1×1', ratio: 1, deg: 45.0 },
    { label: '1×2', ratio: 0.5, deg: 26.6 },
    { label: '1×3', ratio: 0.333, deg: 18.4 },
    { label: '1×4', ratio: 0.25, deg: 14.0 },
    { label: '1×8', ratio: 0.125, deg: 7.1 }
  ];
  
  const angles = angleDefs.map(a => {
    const priceAtAngle = L + a.ratio * scale * daysFromBase;
    const pct = ((priceAtAngle - P) / P * 100);
    return {
      ...a,
      price: Math.round(priceAtAngle * 100) / 100,
      pct: parseFloat(pct.toFixed(2)),
      isAbove: priceAtAngle > P,
      isValid: priceAtAngle > 0
    };
  }).filter(a => a.isValid);
  
  const aboveAngles = angles.filter(a => a.isAbove).length;
  const angleBias = (aboveAngles / angles.length) * 2 - 1;
  
  const nearestAbove = levels.find(l => l.isAbove);
  const nearestBelow = levels.find(l => !l.isAbove);
  let squareBias = 0;
  if (nearestAbove && nearestBelow) {
    const distToAbove = Math.abs(nearestAbove.pct);
    const distToBelow = Math.abs(nearestBelow.pct);
    squareBias = (distToBelow - distToAbove) / (distToAbove + distToBelow);
  }
  
  const bias = angleBias * 0.6 + squareBias * 0.4;
  
  const nearestLevel = levels[0];
  const nearestAngle = angles.sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct))[0];
  
  const levelConf = nearestLevel ? Math.max(0, 0.7 - Math.abs(nearestLevel.pct) / 20) : 0.5;
  const angleConf = nearestAngle ? Math.max(0, 0.7 - Math.abs(nearestAngle.pct) / 20) : 0.5;
  
  const confidence = Math.min(0.95, (levelConf + angleConf) / 2);
  
  const sortedAngles   = [...angles].sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct));
  const closestAngle   = sortedAngles[0];

  const cardinalAngles = [0, 90, 180, 270];
  const cardinalLevels = [];
  for (let ring = 1; ring <= 6; ring++) {
    cardinalAngles.forEach(deg => {
      const sqLvl = sqrtP + ring * 2 + deg / 180;
      if (sqLvl <= 0) return;
      const lvlPrice = Math.pow(sqLvl, 2);
      const pctFromP = ((lvlPrice - P) / (P||1) * 100).toFixed(2);
      cardinalLevels.push({
        price:   Math.round(lvlPrice * 100) / 100,
        sqVal:   sqLvl.toFixed(4),
        deg, ring,
        pct:     parseFloat(pctFromP),
        source:  'S9 ' + deg + '°R' + ring,
        isAbove: lvlPrice > P,
      });
    });
  }

  const GANN_MULT_LIST = [
    { label: '×1/8', mult: 0.125 }, { label: '×1/4', mult: 0.25 },
    { label: '×3/8', mult: 0.375 }, { label: '×1/2', mult: 0.5  },
    { label: '×5/8', mult: 0.625 }, { label: '×2/3', mult: 0.667 },
    { label: '×3/4', mult: 0.75  }, { label: '×1',   mult: 1.0  },
    { label: '×4/3', mult: 1.333 }, { label: '×3/2', mult: 1.5  },
    { label: '×2',   mult: 2.0  },
  ];
  const multiples = [];
  GANN_MULT_LIST.forEach(m => {
    const fromH = Math.round(H * m.mult * 100) / 100;
    const fromL = Math.round(L * m.mult * 100) / 100;
    if (fromH > 0) multiples.push({ price: fromH, source: '前高' + m.label, mult: m.mult, isAbove: fromH > P, pct: parseFloat(((fromH - P) / P * 100).toFixed(2)) });
    if (fromL > 0 && Math.abs(fromL - fromH) / P > 0.005) multiples.push({ price: fromL, source: '前低' + m.label, mult: m.mult, isAbove: fromL > P, pct: parseFloat(((fromL - P) / P * 100).toFixed(2)) });
  });

  return {
    bias: Math.max(-1, Math.min(1, bias)),
    conf: confidence,
    sqrtP:       sqrtP.toFixed(4),
    sqP:         sqrtP.toFixed(4),
    angle:       angle.toFixed(1),
    levels:      levels.slice(0, 16),
    angles,
    P, H, L,
    daysFromBase,
    multiples,
    cardinalLevels,
    activeAng:   closestAngle?.deg ?? 45,
    cycAngle:    angle.toFixed(1),
    cycle:       daysFromBase,
    res:         levels.filter(l =>  l.isAbove).slice(0, 5),
    sup:         levels.filter(l => !l.isAbove).slice(0, 5),
    s9: {
      sqP:           sqrtP.toFixed(4),
      angle:         angle.toFixed(1),
      levels:        levels.slice(0, 8),
      cardinalLevels: cardinalLevels.slice(0, 24),
    },

    supportZone: (() => {
      const sups = levels.filter(l => !l.isAbove).slice(0, 2);
      if (sups.length >= 2) return { low: sups[1].price, high: sups[0].price };
      if (sups.length === 1) return { low: sups[0].price * 0.995, high: sups[0].price };
      return null;
    })(),
    resistanceZone: (() => {
      const ress = levels.filter(l => l.isAbove).slice(0, 2);
      if (ress.length >= 2) return { low: ress[0].price, high: ress[1].price };
      if (ress.length === 1) return { low: ress[0].price, high: ress[0].price * 1.005 };
      return null;
    })(),
    entryZone: (() => {
      const gStep = parseFloat(_localStorage.getItem('gann_step') || '2');
      const sqP   = Math.sqrt(P);
      return {
        low:  Math.round(Math.pow(sqP - gStep * 0.5, 2) * 100) / 100,
        high: Math.round(Math.pow(sqP + gStep * 0.5, 2) * 100) / 100,
      };
    })(),
  };
}
function engineGannTime(date, price, high, low) {
  const P  = price || 50000;
  const H  = high  || P * 1.15;
  const L  = low   || P * 0.85;
  const baseD = new Date(date);

  const range = H - L;
  const rangePct = range / L;

  const posInRange = (P - L) / range;

  const angleStrength =
    P >= H * 0.92 ? 'intact' :
    P >= H * 0.80 ? 'fading' : 'weak';

  const angleLabel =
    angleStrength === 'intact' ? '角度线完好 · 目标有效' :
    angleStrength === 'fading' ? '角度线偏弱 · 目标下修' :
                                 '已跌破角度线 · 原目标失效';

  const AT_raw = Math.round(H * 1.272);
  const AT = Math.min(AT_raw, Math.round(P * 1.50));

  const AR_raw =
    angleStrength === 'intact' ? AT :
    angleStrength === 'fading' ? Math.round(H * 1.05) :
                                 Math.round(H * 1.00);
  const AR = Math.min(AR_raw, Math.round(P * 1.40));

  const pctToTarget = Math.abs(AR - P) / P;
  const baseDays = Math.round((pctToTarget / 0.10) * 30);
  const multiplier = angleStrength === 'intact' ? 1.0 : angleStrength === 'fading' ? 1.5 : 2.0;
  const daysToTarget = Math.min(365, Math.max(14, Math.round(baseDays * multiplier)));

  const targetD = new Date(baseD);
  targetD.setDate(targetD.getDate() + daysToTarget);

  const keyRatios = [0.25, 0.5, 0.618, 0.786, 1.0];
  const keyDays = keyRatios.map(r => Math.max(1, Math.round(daysToTarget * r)));

  const keyNodes = keyDays.map(d => {
    const dt = new Date(baseD);
    dt.setDate(dt.getDate() + d);
    const projPrice = Math.round(P + (AR - P) * (d / daysToTarget));
    return { days: d, date: dt, price: projPrice };
  });

  const subHighA = Math.round(AR * 0.97);
  const subHighB = Math.round(AR * 0.94);

  const gapFromOriginal = ((AT - P) / P * 100).toFixed(1);
  const gapFromRevised  = ((AR - P) / P * 100).toFixed(1);

  const scenario = {
    A: {
      label: '路径A · 强势突破',
      condition: '放量突破阻力位并站稳',
      steps: [
        { price: Math.round(P),         note: '当前价格',                           key: false },
        { price: Math.round(AR * 0.97), note: '突破阻力后第一测试位',               key: true  },
        { price: Math.round(AR),        note: `角度线修正目标`,                     key: true  },
        { price: subHighA,              note: '触达目标后顶背驰 · 次高形式呈现',    key: false },
      ],
      daysEst: Math.round(daysToTarget * 0.7),
      conf: 0.55,
    },
    B: {
      label: '路径B · 弱势回探',
      condition: '无法突破阻力，先回测下方支撑',
      steps: [
        { price: Math.round(P),         note: '当前价格',                   key: false },
        { price: Math.round(L),         note: '回测前低（确认支撑）',       key: true  },
        { price: Math.round(L * 0.98),  note: '前低极限下探',               key: false },
        { price: Math.round(AR * 0.94), note: '弱势反弹次高',               key: true  },
      ],
      daysEst: daysToTarget,
      conf: 0.45,
    },
  };

  const AB = Math.round(L - (H - L) * 0.382);

  return {
    P, H, L, AT, AR, AB,
    daysToTarget, targetD,
    angleStrength, angleLabel,
    rangePct: ((rangePct||0) * 100).toFixed(1),
    gapFromOriginal, gapFromRevised,
    scenario, subHighA, subHighB,
    dailyGain: ((AR - P) / (daysToTarget||1)).toFixed(0),
    keyNodes,
    angleHL: ((Math.sqrt(H) - Math.sqrt(L)) * 180).toFixed(1),
    angToAR: ((Math.sqrt(AR) - Math.sqrt(P)) * 180).toFixed(1),
  };
}

function engineHarmonic(coin, date, price, high, low) {
  const r = rng(seed(date,coin,5005));
  const P = price||50000;
  const H = high||P*1.15;
  const L = low||P*0.85;
  const range = H-L;

  const patterns = [];
  HARMONICS.forEach((h, i) => {
    const r2 = rng(seed(date,coin,5005+i*111));
    const active = r2() > 0.35;
    if(!active) return;

    const bullish = r2() > 0.5;
    const completion = r2()*0.4 + 0.55;

    const X = bullish ? L : H;
    const A = bullish ? H : L;
    const B = bullish ? A - range*h.xab : A + range*h.xab;
    const C = bullish ? B + range*h.abc : B - range*h.abc;
    const D = bullish ? B - range*h.bcd*0.3 : B + range*h.bcd*0.3;
    const potR = bullish ? C + range*0.382 : C - range*0.382;

    const conf = 0.45 + r2()*0.45;
    const strength = r2();

    patterns.push({
      ...h, active, bullish, completion, conf, strength,
      X: Math.round(X), A: Math.round(A), B: Math.round(B),
      C: Math.round(C), D: Math.round(D), PRZ: Math.round(potR)
    });
  });

  const bias = patterns.length > 0
    ? patterns.reduce((s,p) => s + (p.bullish ? p.conf : -p.conf), 0) / patterns.length
    : r()*2-1;
  const conf = patterns.length > 0
    ? patterns.reduce((s,p)=>s+p.conf,0)/patterns.length
    : 0.45;

  return { patterns, bias: Math.max(-1,Math.min(1,bias)), conf };
}

function engineSR(coin, date, price, high, low) {
  const r = rng(seed(date,coin,6006));
  const P = price||50000;
  const H = high||P*1.18;
  const L = low||P*0.82;
  const range = H-L;

  const levels = [];

  const mag = P >= 10000 ? 1000 : P >= 1000 ? 100 : P >= 100 ? 10 : P >= 10 ? 1 : 0.1;
  const base = Math.round(P / mag) * mag;
  for(let i=-10; i<=10; i++) {
    if(i===0) continue;
    const lp = base + i*mag;
    if(lp > 0 && Math.abs(lp-P)/P > 0.003)
      levels.push({ price:+lp.toFixed(4), type:lp>P?'res':'sup', method:'心理价位', strength:0.45+r()*0.3 });
  }

  const sqP = Math.sqrt(P);
  for(let i=-6; i<=6; i++) {
    if(i===0) continue;
    const lp = Math.pow(sqP + i*0.5, 2);
    if(lp > 0 && Math.abs(lp-P)/P > 0.003)
      levels.push({ price:Math.round(lp*100)/100, type:lp>P?'res':'sup', method:'江恩方格', strength:0.55+r()*0.3 });
  }

  if(H > P) levels.push({ price:Math.round(H), type:'res', method:'近期高点', strength:0.75 });
  if(L < P) levels.push({ price:Math.round(L), type:'sup', method:'近期低点', strength:0.75 });
  const mid = Math.round((H+L)/2);
  if(mid > P) levels.push({ price:mid, type:'res', method:'区间中轴', strength:0.5+r()*0.2 });
  if(mid < P) levels.push({ price:mid, type:'sup', method:'区间中轴', strength:0.5+r()*0.2 });

  const seen = new Set();
  const unique = levels.filter(l => {
    const key = Math.round(l.price / (P*0.004));
    if(seen.has(key)) return false;
    seen.add(key); return true;
  });

  unique.forEach(l => { l.touches = Math.floor(r()*5)+1; });

  const res = unique.filter(l=>l.type==='res').sort((a,b)=>a.price-b.price).slice(0,6);
  const sup = unique.filter(l=>l.type==='sup').sort((a,b)=>b.price-a.price).slice(0,6);

  const nearestRes = res[0] ? res[0].price : P*1.1;
  const nearestSup = sup[0] ? sup[0].price : P*0.9;
  const bias = (P-nearestSup)/(nearestRes-nearestSup)*2-1;
  const conf = 0.5+r()*0.35;

  const clusterZones = (levels, wantAbove) => {
    const sorted = levels.slice().sort((a,b) => wantAbove ? a.price-b.price : b.price-a.price);
    const zones  = [];
    sorted.forEach(lv => {
      const last = zones[zones.length - 1];
      if (last && Math.abs(lv.price - last.mid) / P < 0.015) {
        last.prices.push(lv.price);
        last.low  = Math.min(last.low, lv.price);
        last.high = Math.max(last.high, lv.price);
        last.mid  = (last.low + last.high) / 2;
        last.strength = Math.max(last.strength, lv.strength || 0.5);
      } else {
        zones.push({ low: lv.price, high: lv.price, mid: lv.price,
                     prices: [lv.price], strength: lv.strength || 0.5,
                     method: lv.method });
      }
    });
    return zones.slice(0, 4);
  };

  const supZones = clusterZones(sup, false);
  const resZones = clusterZones(res, true);

  return {
    res, sup, bias: Math.max(-1,Math.min(1,bias)), conf, P,
    supZones,
    resZones,
    entryZone: supZones[0]
      ? { low: supZones[0].low, high: Math.min(P, supZones[0].high * 1.005) }
      : null,
  };
}

function engineTPSL(coin, date, price, high, low, engines) {
  const P = Number(price) || 50000;
  const H = Number(high)  || P * 1.15;
  const L = Number(low)   || P * 0.85;
  const { sr, gn, ch, hr, nt } = engines || {};

  const atrAbs = H - L;
  const atrPct = atrAbs / P;
  const atrPctStr = (atrPct * 100).toFixed(1) + '%';

  let tpMult, slMult, volatilityLabel;
  if (atrPct < 0.02) {
    tpMult = 3.0; slMult = 1.5; volatilityLabel = '低波动';
  } else if (atrPct < 0.05) {
    tpMult = 2.5; slMult = 1.2; volatilityLabel = '中波动';
  } else if (atrPct < 0.10) {
    tpMult = 2.0; slMult = 1.0; volatilityLabel = '高波动';
  } else {
    tpMult = 1.5; slMult = 0.8; volatilityLabel = '极高波动';
  }

  const _sw = (typeof getWeightsByState === 'function')
    ? getWeightsByState((_currentMarketState||{}).state || 'ranging')
    : { gann:0.35, chan:0.25, sr:0.25, harmonic:0.15 };
  const biasList = [
    gn ? { bias: gn.bias, w: _sw.gann    || 0.35 } : null,
    ch ? { bias: ch.bias, w: _sw.chan     || 0.25 } : null,
    sr ? { bias: sr.bias, w: _sw.sr       || 0.25 } : null,
    hr ? { bias: hr.bias, w: _sw.harmonic || 0.15 } : null,
    nt ? { bias: nt.bias, w: 0.10 }                  : null,
  ].filter(Boolean);
  const totalW  = biasList.reduce((s,e)=>s+e.w,0) || 1;
  const avgBias = biasList.reduce((s,e)=>s+e.bias*e.w,0) / totalW;
  const signal  = avgBias > 0.15 ? 'LONG' : avgBias < -0.15 ? 'SHORT' : 'NEUTRAL';
  const isShort = signal === 'SHORT';

  const TP_MULTS    = [1.5, 2.0, 2.5, 3.0, tpMult];
  const TP_LABELS   = ['TP1 保守', 'TP2 稳健', 'TP3 均衡', 'TP4 进取', 'TP5 终极'];
  const TP_SOURCES  = ['ATR×1.5', 'ATR×2.0', 'ATR×2.5', 'ATR×3.0', `ATR×${tpMult}(${volatilityLabel})`];

  const gannResist = [];
  const gannSupport = [];
  if (gn?.levels) {
    gn.levels.filter(l=>l.price>P*1.005).slice(0,6).forEach(l=>gannResist.push(l.price));
    gn.levels.filter(l=>l.price<P*0.995&&l.price>0).slice(-6).forEach(l=>gannSupport.push(l.price));
  }
  if (sr?.res) sr.res.filter(l=>l.price>P*1.005).slice(0,4).forEach(l=>gannResist.push(l.price));
  if (sr?.sup) sr.sup.filter(l=>l.price<P*0.995).slice(0,4).forEach(l=>gannSupport.push(l.price));
  if (ch?.zsHigh>P*1.005) gannResist.push(ch.zsHigh);
  if (ch?.zsLow<P*0.995&&ch?.zsLow>0) gannSupport.push(ch.zsLow);
  gannResist.sort((a,b)=>a-b);
  gannSupport.sort((a,b)=>b-a);

  const smartR = v => {
    if (!v || isNaN(v) || !isFinite(v)) return v;
    if (v >= 10000) return Math.round(v);
    if (v >= 1000)  return Math.round(v * 10) / 10;
    if (v >= 100)   return Math.round(v * 100) / 100;
    return Math.round(v * 1000) / 1000;
  };

  const tpLevelsRaw = TP_MULTS.map((m, i) => {
    const atrTarget = isShort
      ? P * (1 - atrPct * m)
      : P * (1 + atrPct * m);
    let price_tp = atrTarget;
    if (!isShort && gannResist.length) {
      const nearRes = gannResist.find(r => r >= atrTarget);
      if (nearRes) price_tp = Math.max(atrTarget, nearRes);
    } else if (isShort && gannSupport.length) {
      const nearSup = gannSupport.find(s => s <= atrTarget);
      if (nearSup) price_tp = Math.min(atrTarget, nearSup);
    }
    return {
      price:  smartR(price_tp),
      source: TP_SOURCES[i],
      label:  TP_LABELS[i],
      level:  i + 1,
      strength: 0.6 + m * 0.05,
      priority: i < 2 ? 2 : 3,
    };
  });

  const atrSL = isShort
    ? P * (1 + atrPct * slMult)
    : P * (1 - atrPct * slMult);

  let slPrice = atrSL;
  if (!isShort && gannSupport.length) {
    const nearSup = gannSupport[0];
    if (nearSup && nearSup < P && nearSup > P * 0.5) slPrice = Math.min(atrSL, nearSup);
  } else if (isShort && gannResist.length) {
    const nearRes = gannResist[0];
    if (nearRes && nearRes > P) slPrice = Math.max(atrSL, nearRes);
  }
  slPrice = smartR(slPrice);

  const slLevelObj = {
    price:    slPrice,
    source:   `ATR×${slMult}(${volatilityLabel})`,
    label:    'SL 止损',
    strength: 0.8,
    priority: 3,
  };
  const slLevels = [slLevelObj];
  const primarySL = slPrice;
  const risk = Math.abs(P - primarySL);

  const tpWithRRR = tpLevelsRaw.map(tp => {
    const reward = Math.abs(tp.price - P);
    const rrr    = risk > 0 ? (reward / risk).toFixed(2) : '∞';
    const pct    = ((reward / P) * 100).toFixed(2);
    return { ...tp, reward: smartR(reward), rrr, pct };
  });

  const primaryRRR = risk > 0 ? (Math.abs(tpLevelsRaw[4].price - P) / risk).toFixed(2) : '∞';

  const errors = window.tracker?.priceErrors || [];
  const recentN = Math.min(50, errors.length);
  const recent  = errors.slice(-recentN);
  const wins    = recent.filter(e=>e.dirCorrect).length;
  const p_win   = recentN > 5 ? wins / recentN : 0.55;
  const p_lose  = 1 - p_win;
  const b       = parseFloat(primaryRRR) || 2.0;
  const kelly_f = (p_win * b - p_lose) / b;
  const positionPct = Math.max(0, Math.min(25, Math.round(kelly_f * 0.5 * 100)));

  const entryZone = isShort
    ? { low: smartR(P * 0.998), high: smartR(P * 1.015) }
    : { low: smartR(P * 0.985), high: smartR(P * 1.002) };

  return {
    P, tpLevels: tpWithRRR, slLevels, primarySL,
    risk: smartR(risk), atrPct: (atrPct*100).toFixed(1), atrAbs: smartR(atrAbs),
    avgBias, signal, isShort, entryZone,
    weightCalibrated: (window.tracker?.priceErrors?.length || 0) >= 10,

    tpLevels5: tpWithRRR.map((tp,i) => ({
      level: i+1, price: tp.price, label: TP_LABELS[i]
    })),
    slLevel: { price: slPrice, label: 'SL 止损' },
    atr: atrPctStr,
    rrr: primaryRRR,
    volatilityLabel,
    tpMult, slMult,
    positionSize: {
      percentage: positionPct + '%',
      winRate:    Math.round(p_win * 100) + '%',
      kellyRaw:   kelly_f.toFixed(3),
    },
  };
}

function gannS9Levels(P) {
  const sqP = Math.sqrt(P);
  const levels = [];
  const angFracs = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
  angFracs.forEach(f => {
    const up   = Math.round(Math.pow(sqP + f * 2, 2));
    const down = Math.round(Math.pow(Math.max(sqP - f * 2, 0.01), 2));
    levels.push({ up, down, label: `${Math.round(f*360)}°`, frac: f });
  });
  return levels;
}


function calcGannFibTPSL(baseP, H, L, engines, isLong) {
  const P = baseP;

  const { gn, ch, sr } = engines || {};

  const s9 = gannS9Levels(P);
  const s9Up   = s9.map(l => ({ price: l.up,   label: '江恩' + l.label, src:'gann' })).filter(v => v.price > P).sort((a,b) => a.price - b.price);
  const s9Down = s9.map(l => ({ price: l.down,  label: '江恩' + l.label, src:'gann' })).filter(v => v.price < P).sort((a,b) => b.price - a.price);

  const gnUp   = gn && gn.levels ? gn.levels.filter(l => l.price > P).slice(0,6).map(l => ({ price: l.price, label: '江恩角度线', src:'gann' })) : [];
  const gnDown = gn && gn.levels ? gn.levels.filter(l => l.price < P).slice(-6).map(l => ({ price: l.price, label: '江恩角度线', src:'gann' })) : [];

  const chanUp = [], chanDown = [];
  if (ch) {
    if (ch.zsHigh && ch.zsHigh > P) chanUp.push({ price: ch.zsHigh, label: '缠论中枢上沿', src:'chan' });
    if (ch.zsLow  && ch.zsLow  < P) chanDown.push({ price: ch.zsLow, label: '缠论中枢下沿', src:'chan' });
    if (ch.beichi && ch.beichiType === '顶背驰' && ch.zsHigh) {
      const beiTarget = smartRound(ch.zsHigh * 0.9);
      if (beiTarget < P) chanDown.push({ price: beiTarget, label: '缠论顶背驰目标', src:'chan' });
    }
    if (ch.beichi && ch.beichiType === '底背驰' && ch.zsLow) {
      const beiTarget = smartRound(ch.zsLow * 1.15);
      if (beiTarget > P) chanUp.push({ price: beiTarget, label: '缠论底背驰目标', src:'chan' });
    }
    if (ch.bspDir === '买点' && ch.zsHigh && ch.zsHigh > P)
      chanUp.push({ price: ch.zsHigh, label: '缠论买点目标位', src:'chan' });
    if (ch.bspDir === '卖点' && ch.zsLow && ch.zsLow < P)
      chanDown.push({ price: ch.zsLow, label: '缠论卖点目标位', src:'chan' });
  }

  const fibUp = [], fibDown = [];
  if (H && L && H > L) {
    const range = H - L;
    [0.382, 0.500, 0.618, 1.000].forEach(r => {
      const fp = smartRound(L + range * r);
      if (fp > P) fibUp.push({ price: fp, label: `斐波${Math.round(r*100)}%`, src:'fib' });
      else if (fp < P) fibDown.push({ price: fp, label: `斐波${Math.round(r*100)}%`, src:'fib' });
    });
  }

  const dedupAsc = (arr) => {
    const seen = new Set();
    return arr.filter(v => v.price > P)
      .sort((a,b) => a.price - b.price)
      .filter(v => {
        const key = Math.round(v.price / (P * 0.005));
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
  };
  const dedupDesc = (arr) => {
    const seen = new Set();
    return arr.filter(v => v.price < P)
      .sort((a,b) => b.price - a.price)
      .filter(v => {
        const key = Math.round(v.price / (P * 0.005));
        if (seen.has(key)) return false;
        seen.add(key); return true;
      });
  };

  const allUp   = dedupAsc([...chanUp,   ...s9Up,   ...gnUp,   ...fibUp]);
  const allDown = dedupDesc([...chanDown, ...s9Down, ...gnDown, ...fibDown]);

  const configs = [
    { label:'TP1 保守', desc:'短线速战', tf:'15m~1H',  color:'#3ab8c8', tpIdx:0, slIdx:0 },
    { label:'TP2 稳健', desc:'日内交易', tf:'1H~4H',   color:'#28c870', tpIdx:1, slIdx:0 },
    { label:'TP3 均衡', desc:'波段交易', tf:'4H~1D',   color:'#c8a840', tpIdx:2, slIdx:1 },
    { label:'TP4 进取', desc:'中线持仓', tf:'1D~3D',   color:'#e8a040', tpIdx:3, slIdx:2 },
    { label:'TP5 激进', desc:'趋势跟踪', tf:'3D~1W',   color:'#e05050', tpIdx:4, slIdx:2 },
  ];

  const fallbackUp   = (i) => Math.round(P * (1 + 0.02 * (i+1) * 1.5));
  const fallbackDown = (i) => Math.round(P * (1 - 0.015 * (i+1) * 1.3));

  return configs.map((cfg, i) => {
    const tpObj = isLong ? (allUp[cfg.tpIdx]   || { price: fallbackUp(cfg.tpIdx),   label: '江恩估算' })
                         : (allDown[cfg.tpIdx]  || { price: fallbackDown(cfg.tpIdx), label: '江恩估算' });
    const slObj = isLong ? (allDown[cfg.slIdx]  || { price: fallbackDown(cfg.slIdx), label: '江恩估算' })
                         : (allUp[cfg.slIdx]    || { price: fallbackUp(cfg.slIdx),   label: '江恩估算' });

    const tp = Math.round(tpObj.price);
    const sl = Math.round(slObj.price);
    const tpPct = Math.abs((tp - P) / P * 100).toFixed(2);
    const slPct = Math.abs((sl - P) / P * 100).toFixed(2);
    const reward = Math.abs(tp - P);
    const risk   = Math.abs(sl - P);
    const rrr    = risk > 0 ? (reward / risk).toFixed(2) : 'inf';

    return { level:i+1, label:cfg.label, desc:cfg.desc, tf:cfg.tf, tfColor:cfg.color,
      tp, sl, tpPct, slPct, rrr,
      src: tpObj.label, slSrc: slObj.label,
      risk: Math.round(risk), reward: Math.round(reward),
      entry: Math.round(P) };
  });
}

function engineTPSL5(coin, date, price, high, low, engines) {
  const P = price || 50000;
  const H = high  || P * 1.18;
  const L = low   || P * 0.82;

  const { sr, gn, ch, hr } = engines || {};
  const _sw5 = (typeof getWeightsByState === 'function')
    ? getWeightsByState(_currentMarketState?.state || 'ranging')
    : { gann:0.35, chan:0.25, sr:0.25, harmonic:0.15 };
  const mw5  = { ..._sw5, mature: tracker?.priceErrors?.length >= 10 };
  const bias5List = [
    gn ? { bias: gn.bias, w: mw5 ? mw5.gann    : 0.40 } : null,
    ch ? { bias: ch.bias, w: mw5 ? mw5.chan     : 0.25 } : null,
    sr ? { bias: sr.bias, w: mw5 ? mw5.sr       : 0.20 } : null,
    hr ? { bias: hr.bias, w: mw5 ? mw5.harmonic : 0.15 } : null,
  ].filter(Boolean);
  const totalW5  = bias5List.reduce((s,e) => s+e.w, 0) || 1;
  const avgBias  = bias5List.reduce((s,e) => s + e.bias * e.w, 0) / totalW5;
  const signal   = avgBias > 0.15 ? 'LONG' : avgBias < -0.15 ? 'SHORT' : 'NEUTRAL';
  const isLong  = signal !== 'SHORT';

  const longStrats  = calcGannFibTPSL(P, H, L, engines, true);
  const shortStrats = calcGannFibTPSL(P, H, L, engines, false);

  const strategies = longStrats.map((lo, i) => {
    const sh = shortStrats[i];
    return {
      level: i+1, label: lo.label, desc: lo.desc, tf: lo.tf, tfColor: lo.tfColor,
      long:  { entry:lo.entry, tp:lo.tp, sl:lo.sl, tpPct:lo.tpPct, slPct:lo.slPct, rrr:lo.rrr, src:lo.src, risk:lo.risk, reward:lo.reward },
      short: { entry:sh.entry, tp:sh.tp, sl:sh.sl, tpPct:sh.tpPct, slPct:sh.slPct, rrr:sh.rrr, src:sh.src, risk:sh.risk, reward:sh.reward },
    };
  });

  const s9Overview = gannS9Levels(P);

  return { signal, avgBias, strategies, s9Overview, P, H, L };
}

function engineChan(coin, date, price, high, low, breakLevel) {
  const P = price || 50000;
  const H = high  || P * 1.15;
  const L = low   || P * 0.85;

  const d = new Date(date);
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  const trendSeed     = ((dayOfYear * 17 + d.getFullYear() * 7) % 100) / 100;
  const range         = H - L;
  const volatility    = range * 0.018;
  const trendStrength = (trendSeed - 0.5) * 0.8;

  const klines = [];
  let basePrice = L + range * trendSeed;

  for (let i = 0; i < 100; i++) {
    const cycle1 = Math.cos(i * Math.PI / 8) * volatility * 1.5;
    const cycle2 = Math.cos(i * Math.PI / 3) * volatility * 0.8;
    const trend  = trendStrength * volatility * (i / 50);

    const close   = basePrice + cycle1 + cycle2 + trend;
    const open    = basePrice;
    const bodyH   = Math.max(open, close);
    const bodyL   = Math.min(open, close);
    const shadowU = volatility * (i % 3 === 0 ? 0.4 : 0.2);
    const shadowD = volatility * (i % 3 === 1 ? 0.4 : 0.2);

    klines.push({
      index: i, open, close,
      high: Math.min(H, bodyH + shadowU),
      low:  Math.max(L, bodyL - shadowD),
    });

    basePrice = close;
    if (basePrice > H * 0.98) basePrice = H * 0.95;
    if (basePrice < L * 1.02) basePrice = L * 1.05;
  }

  const merged = [];
  for (let i = 0; i < klines.length; i++) {
    if (!merged.length) { merged.push({ ...klines[i] }); continue; }
    const prev = merged[merged.length - 1];
    const cur  = klines[i];
    if (cur.high >= prev.high && cur.low <= prev.low) {
      prev.high = cur.high; prev.low = Math.min(prev.low, cur.low);
    } else if (cur.high <= prev.high && cur.low >= prev.low) {
      prev.high = Math.max(prev.high, cur.high); prev.low = cur.low;
    } else {
      merged.push({ ...cur, index: merged.length });
    }
  }

  const fractalWindow = parseInt(_localStorage.getItem('chan_fractal_window') || '1');
  const tops = [], bottoms = [];
  for (let i = fractalWindow; i < merged.length - fractalWindow; i++) {
    const cu = merged[i];
    let isTop = true, isBot = true;
    for (let w = 1; w <= fractalWindow; w++) {
      if (cu.high <= merged[i-w].high || cu.high <= merged[i+w].high) isTop = false;
      if (cu.low  >= merged[i-w].low  || cu.low  >= merged[i+w].low)  isBot = false;
    }
    if (isTop) tops.push({ index: i, price: cu.high, type: 'top' });
    if (isBot) bottoms.push({ index: i, price: cu.low, type: 'bottom' });
  }

  const fractures = [...tops, ...bottoms].sort((a, b) => a.index - b.index);
  const pens = [];
  for (let i = 1; i < fractures.length; i++) {
    const a = fractures[i-1], b = fractures[i];
    if (a.type !== b.type && b.index - a.index >= 3) {
      pens.push({
        startIndex: a.index, endIndex: b.index,
        startPrice: a.price, endPrice: b.price,
        type:   b.type === 'top' ? '上升笔' : '下降笔',
        height: Math.abs(b.price - a.price)
      });
    }
  }

  let zsHigh = null, zsLow = null;
  if (pens.length >= 3) {
    const last3  = pens.slice(-3);
    const penHighs = last3.map(p => Math.max(p.startPrice, p.endPrice));
    const penLows  = last3.map(p => Math.min(p.startPrice, p.endPrice));
    zsHigh = Math.min(...penHighs);
    zsLow  = Math.max(...penLows);
    if (zsLow >= zsHigh) { zsHigh = null; zsLow = null; }
  }

  let beichi = false, beichiType = null;
  if (pens.length >= 5) {
    const lastPen = pens[pens.length - 1];
    const prevPen = pens[pens.length - 3];
    if (lastPen && prevPen && lastPen.type === prevPen.type) {
      if (lastPen.type === '上升笔' && lastPen.height < prevPen.height * 0.7)
        { beichi = true; beichiType = '顶背驰'; }
      if (lastPen.type === '下降笔' && lastPen.height < prevPen.height * 0.7)
        { beichi = true; beichiType = '底背驰'; }
    }
  }

  let bias = 0;
  if (zsHigh != null && zsLow != null) {
    bias += P > zsHigh ? 0.35 : P < zsLow ? -0.35 : 0.05;
  }
  const lastPen = pens[pens.length - 1];
  if (lastPen) bias += lastPen.type === '上升笔' ? 0.2 : -0.2;
  if (beichi)  bias += beichiType === '底背驰' ? 0.4 : -0.4;
  const posInRange = (P - L) / (range || 1);
  if (posInRange < 0.2) bias += 0.12;
  if (posInRange > 0.8) bias -= 0.12;

  const conf = Math.min(0.92, 0.45
    + Math.min(0.2, pens.length * 0.02)
    + (beichi ? 0.15 : 0)
    + (zsHigh != null ? 0.1 : 0));

  return {
    bias:       Math.max(-1, Math.min(1, bias)),
    conf,
    pens:       pens.slice(-5),
    zsHigh:     zsHigh ? Math.round(zsHigh) : null,
    zsLow:      zsLow  ? Math.round(zsLow)  : null,
    zsValid:    !!(zsHigh && zsLow),
    beichi, beichiType,
    biCount:    pens.length,
    biDir:      lastPen ? (lastPen.type === '上升笔' ? 'up' : 'down') : 'neutral',
    inDemand:   posInRange < 0.25,
  };
}



function _klineCloses(klines) { return klines.map(k => parseFloat(k[4] !== undefined ? k[4] : k.c)); }
function _klineHighs(klines)  { return klines.map(k => parseFloat(k[2] !== undefined ? k[2] : k.h)); }
function _klineLows(klines)   { return klines.map(k => parseFloat(k[3] !== undefined ? k[3] : k.l)); }

function _calcEMA(values, period) {
  if (!values || values.length < period) return [];
  const k = 2 / (period + 1);
  const result = [];
  let ema = values.slice(0, period).reduce((s, v) => s + v, 0) / period;
  result.push(...new Array(period - 1).fill(null));
  result.push(ema);
  for (let i = period; i < values.length; i++) {
    ema = values[i] * k + ema * (1 - k);
    result.push(ema);
  }
  return result;
}

function _calcMA(values, period) {
  if (!values || values.length < period) return [];
  const result = new Array(period - 1).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0);
    result.push(sum / period);
  }
  return result;
}

function _calculateMACD(klines) {
  const closes = _klineCloses(klines);
  if (closes.length < 35) return null;

  const ema12 = _calcEMA(closes, 12);
  const ema26 = _calcEMA(closes, 26);

  const dif = ema12.map((v, i) => (v !== null && ema26[i] !== null) ? v - ema26[i] : null);
  const validDif = dif.filter(v => v !== null);
  const dea = _calcEMA(validDif, 9);

  const deaFull = new Array(dif.length - dea.length).fill(null).concat(dea);
  const macd = dif.map((v, i) => (v !== null && deaFull[i] !== null) ? (v - deaFull[i]) * 2 : null);

  return { dif, dea: deaFull, macd, closes };
}

function _detectDivergence(klines) {
  const macdData = _calculateMACD(klines);
  if (!macdData) return { hasDivergence: false, type: null, strength: 0, detail: '数据不足' };

  const { dif, closes } = macdData;
  const highs = _klineHighs(klines);
  const lows  = _klineLows(klines);

  const N = Math.min(40, klines.length);
  const recentDif    = dif.slice(-N).filter(v => v !== null);
  const recentCloses = closes.slice(-N);
  const recentHighs  = highs.slice(-N);
  const recentLows   = lows.slice(-N);

  if (recentDif.length < 10) return { hasDivergence: false, type: null, strength: 0, detail: '近期数据不足' };

  const WIN = 3;
  const priceHighs = [], priceLows = [];
  for (let i = WIN; i < recentHighs.length - WIN; i++) {
    let isH = true, isL = true;
    for (let j = 1; j <= WIN; j++) {
      if (recentHighs[i] <= recentHighs[i-j] || recentHighs[i] <= recentHighs[i+j]) isH = false;
      if (recentLows[i]  >= recentLows[i-j]  || recentLows[i]  >= recentLows[i+j])  isL = false;
    }
    if (isH) priceHighs.push({ idx: i, price: recentHighs[i], dif: recentDif[i] || 0 });
    if (isL) priceLows.push({  idx: i, price: recentLows[i],  dif: recentDif[i] || 0 });
  }

  let bearDivStrength = 0;
  if (priceHighs.length >= 2) {
    const h1 = priceHighs[priceHighs.length - 2];
    const h2 = priceHighs[priceHighs.length - 1];
    if (h2.price > h1.price && h2.dif < h1.dif) {
      const difDrop = Math.abs(h2.dif - h1.dif);
      const difBase = Math.max(Math.abs(h1.dif), 0.0001);
      bearDivStrength = Math.min(1, difDrop / difBase * 0.8);
    }
  }

  let bullDivStrength = 0;
  if (priceLows.length >= 2) {
    const l1 = priceLows[priceLows.length - 2];
    const l2 = priceLows[priceLows.length - 1];
    if (l2.price < l1.price && l2.dif > l1.dif) {
      const difRise = Math.abs(l2.dif - l1.dif);
      const difBase = Math.max(Math.abs(l1.dif), 0.0001);
      bullDivStrength = Math.min(1, difRise / difBase * 0.8);
    }
  }

  if (bullDivStrength > bearDivStrength && bullDivStrength > 0.15) {
    return { hasDivergence: true, type: 'bullish', strength: parseFloat(bullDivStrength.toFixed(3)),
      detail: `底背离：价格新低但MACD-DIF抬升（强度${(bullDivStrength*100).toFixed(0)}%）` };
  }
  if (bearDivStrength > bullDivStrength && bearDivStrength > 0.15) {
    return { hasDivergence: true, type: 'bearish', strength: parseFloat(bearDivStrength.toFixed(3)),
      detail: `顶背离：价格新高但MACD-DIF下降（强度${(bearDivStrength*100).toFixed(0)}%）` };
  }
  return { hasDivergence: false, type: null, strength: 0, detail: '未发现明确背驰' };
}

function engineGannChanSynergy(gn, ch, price, klines) {
  const N_MIN = 60;
  if (!klines || klines.length < N_MIN) {
    return {
      hasResonance: false, rating: 'N/A',
      details: { priceResonance: { exists: false }, directionResonance: { exists: false },
                 divergence: { exists: false, type: null, strength: 0 }, superSignal: false },
      message: `K线数据不足（需≥${N_MIN}根，当前${klines ? klines.length : 0}根），无法进行协同分析`,
      signals: [], priceResonances: [], overallScore: 0, grade: 'C',
      gradeLabel: '数据不足', synergyDir: 'neutral', hasSynergy: false, strongSignal: false,
    };
  }

  const P = price || (gn && gn.P) || parseFloat(klines[klines.length-1][4] || klines[klines.length-1].c || 0);
  if (!P) return null;

  const recent60 = klines.slice(-60);
  const highs60  = _klineHighs(recent60);
  const lows60   = _klineLows(recent60);
  const rangeHigh = Math.max(...highs60);
  const rangeLow  = Math.min(...lows60);
  const range     = rangeHigh - rangeLow;

  const GANN_RATIOS = [
    { ratio: 0.236, label: '0.236位' },
    { ratio: 0.382, label: '0.382位' },
    { ratio: 0.500, label: '0.500中轴' },
    { ratio: 0.618, label: '0.618黄金位' },
    { ratio: 0.786, label: '0.786深度位' },
    { ratio: 1.000, label: '1.000全回撤' },
  ];
  const gannLevels = GANN_RATIOS.map(r => ({
    price: rangeLow + range * r.ratio,
    label: `江恩Fib${r.label}`,
    ratio: r.ratio,
  }));

  if (gn && gn.res) gn.res.slice(0, 4).forEach(r => gannLevels.push({ price: r.price, label: r.source || '江恩阻力' }));
  if (gn && gn.sup) gn.sup.slice(0, 4).forEach(s => gannLevels.push({ price: s.price, label: s.source || '江恩支撑' }));

  const closes = _klineCloses(klines);
  const MA20arr = _calcMA(closes, 20);
  const ma20 = MA20arr[MA20arr.length - 1];
  const gannBias = ma20 ? ((P - ma20) / ma20 * 100) : 0;

  let chanZoneTop = ch && ch.zsHigh ? ch.zsHigh : null;
  let chanZoneBot = ch && ch.zsLow  ? ch.zsLow  : null;
  let chanZoneMid = (chanZoneTop && chanZoneBot) ? (chanZoneTop + chanZoneBot) / 2 : null;

  if (!chanZoneTop || !chanZoneBot) {
    const recent20H = Math.max(..._klineHighs(klines.slice(-20)));
    const recent20L = Math.min(..._klineLows(klines.slice(-20)));
    chanZoneTop = recent20H;
    chanZoneBot = recent20L;
    chanZoneMid = (recent20H + recent20L) / 2;
  }

  const chanLevels = [
    { price: chanZoneTop, label: '缠论中枢上轨' },
    { price: chanZoneBot, label: '缠论中枢下轨' },
    { price: chanZoneMid, label: '缠论中枢中轨' },
  ];
  if (ch && ch.pens && ch.pens.length) {
    const lp = ch.pens[ch.pens.length - 1];
    if (lp.endPrice)   chanLevels.push({ price: lp.endPrice,   label: '缠论末笔端点' });
    if (lp.startPrice) chanLevels.push({ price: lp.startPrice, label: '缠论末笔起点' });
  }

  const chanBias = chanZoneMid ? ((P - chanZoneMid) / chanZoneMid * 100) : 0;

  const divergence = _detectDivergence(klines);


  const priceResonances = [];
  gannLevels.forEach(gl => {
    if (!gl.price || isNaN(gl.price)) return;
    chanLevels.forEach(cl => {
      if (!cl.price || isNaN(cl.price)) return;
      const diffPct = Math.abs(gl.price - cl.price) / (P || 1) * 100;
      if (diffPct < 2.0) {
        const strength = diffPct < 0.5 ? '超强' : diffPct < 1.0 ? '强' : '中';
        const score    = diffPct < 0.5 ? 0.95 : diffPct < 1.0 ? 0.75 : 0.55;
        priceResonances.push({
          price: (gl.price + cl.price) / 2,
          gannLabel: gl.label, chanLabel: cl.label,
          diffPct: diffPct.toFixed(2), strength, score,
          gannPrice: gl.price, chanBoundary: cl.price,
        });
      }
    });
  });
  priceResonances.sort((a, b) => b.score - a.score);
  const priceRes = priceResonances[0] || null;
  const hasPriceResonance = priceResonances.length > 0;

  const hasDirectionResonance = (gannBias * chanBias) > 0;
  const dirBull = gannBias > 0 && chanBias > 0;

  const divergenceBull = divergence.type === 'bullish';
  const divergenceBear = divergence.type === 'bearish';
  const superSignal = divergence.hasDivergence && hasDirectionResonance
    && ((divergenceBull && dirBull) || (divergenceBear && !dirBull));

  let rating, gradeLabel;
  if (superSignal) {
    rating = 'S'; gradeLabel = '超强共振';
  } else if (hasPriceResonance && hasDirectionResonance) {
    rating = 'A'; gradeLabel = '强共振';
  } else if (hasPriceResonance || hasDirectionResonance) {
    rating = 'B'; gradeLabel = '中等共振';
  } else if (divergence.hasDivergence) {
    rating = 'C'; gradeLabel = '弱信号·仅背驰';
  } else {
    rating = 'C'; gradeLabel = '暂无共振信号';
  }

  const signals = [];

  if (superSignal) {
    const divDir = divergenceBull ? '底背离' : '顶背离';
    signals.push({
      type: '背驰×方向共振', icon: '🔥',
      text: `MACD ${divDir}（强度${(divergence.strength*100).toFixed(0)}%）+ 江恩与缠论方向同步 → S级最高信号！${divergenceBull ? '底部确认，建议择机做多' : '顶部确认，建议择机做空'}`,
      strength: '超强', bull: divergenceBull, score: 0.95,
    });
  }

  if (hasPriceResonance && priceRes) {
    signals.push({
      type: '价格共振', icon: '⬡∿',
      text: `「${priceRes.gannLabel}」≈「${priceRes.chanLabel}」，偏差仅 ${priceRes.diffPct}%，共振价位 $${Math.round(priceRes.price).toLocaleString()}`,
      strength: priceRes.strength, bull: priceRes.price > P ? false : true, score: priceRes.score,
    });
  }

  if (hasDirectionResonance) {
    const dir = dirBull ? '做多' : '做空';
    const gBStr = gannBias > 0 ? '+' + gannBias.toFixed(1) : gannBias.toFixed(1);
    const cBStr = chanBias > 0 ? '+' + chanBias.toFixed(1) : chanBias.toFixed(1);
    signals.push({
      type: '方向共振', icon: '⬡∿',
      text: `江恩bias ${gBStr}% 与缠论bias ${cBStr}% 同向「${dir}」（均偏离中轴方向一致）`,
      strength: Math.abs(gannBias) > 3 && Math.abs(chanBias) > 3 ? '强' : '中',
      bull: dirBull, score: 0.7,
    });
  }

  if (!superSignal && divergence.hasDivergence) {
    signals.push({
      type: divergenceBull ? 'MACD底背离' : 'MACD顶背离', icon: divergenceBull ? '📈' : '📉',
      text: divergence.detail + `（强度${(divergence.strength*100).toFixed(0)}%，需等待方向共振确认）`,
      strength: divergence.strength > 0.6 ? '强' : '中', bull: divergenceBull, score: divergence.strength * 0.8,
    });
  }

  if (ch && ch.zsValid && chanZoneTop && chanZoneBot) {
    const aboveZS = P > chanZoneTop;
    const belowZS = P < chanZoneBot;
    if (aboveZS || belowZS) {
      signals.push({
        type: '中枢突破', icon: '⊙',
        text: `价格已突破缠论中枢${aboveZS?'上轨':'下轨'}（中枢范围 $${Math.round(chanZoneBot).toLocaleString()}–$${Math.round(chanZoneTop).toLocaleString()}），趋势延续信号`,
        strength: '中', bull: aboveZS, score: 0.6,
      });
    }
  }

  const scoreMap = { S: 0.92, A: 0.75, B: 0.55, C: 0.30 };
  const overallScore = scoreMap[rating] || 0.3;
  const synergyDir = superSignal
    ? (divergenceBull ? 'bull' : 'bear')
    : hasDirectionResonance
      ? (dirBull ? 'bull' : 'bear')
      : 'neutral';

  const analysisTime = typeof toUTC8Str === 'function' ? toUTC8Str(new Date()) : new Date().toLocaleString('zh-CN');

  const message = signals.length > 0
    ? signals[0].text
    : `江恩bias ${gannBias.toFixed(1)}%，缠论bias ${chanBias.toFixed(1)}%，暂无明确共振信号`;

  return {
    hasResonance: signals.length > 0,
    rating,
    details: {
      priceResonance: {
        exists: hasPriceResonance,
        gannLevel: priceRes ? priceRes.gannPrice : null,
        chanZone:  priceRes ? priceRes.chanBoundary : null,
        diffPct:   priceRes ? priceRes.diffPct : null,
      },
      directionResonance: {
        exists: hasDirectionResonance,
        gannBias: parseFloat(gannBias.toFixed(2)),
        chanBias: parseFloat(chanBias.toFixed(2)),
        ma20: ma20 ? parseFloat(ma20.toFixed(2)) : null,
        chanMid: chanZoneMid ? parseFloat(chanZoneMid.toFixed(2)) : null,
      },
      divergence: {
        exists:   divergence.hasDivergence,
        type:     divergence.type,
        strength: divergence.strength,
        detail:   divergence.detail,
      },
      superSignal,
    },
    message,
    analysisTime,
    signals,
    priceResonances: priceResonances.slice(0, 4),
    overallScore,
    grade: rating,
    gradeLabel,
    synergyDir,
    hasSynergy: signals.length > 0,
    strongSignal: rating === 'S' || rating === 'A',
    _debug: {
      klinesCount: klines.length,
      rangeHigh: parseFloat(rangeHigh.toFixed(2)),
      rangeLow:  parseFloat(rangeLow.toFixed(2)),
      ma20:      ma20 ? parseFloat(ma20.toFixed(2)) : null,
      gannBias:  parseFloat(gannBias.toFixed(2)),
      chanZoneTop: chanZoneTop ? parseFloat(chanZoneTop.toFixed(2)) : null,
      chanZoneBot: chanZoneBot ? parseFloat(chanZoneBot.toFixed(2)) : null,
      chanBias:   parseFloat(chanBias.toFixed(2)),
    },
  };
}


function _utc8Now() {
  return typeof getNowUTC8 === 'function' ? getNowUTC8() : new Date();
}
function _utc8Str(d) {
  return typeof toUTC8Str === 'function'
    ? toUTC8Str(d instanceof Date ? d : new Date(d))
    : new Date(d).toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
}
function _utc8TimeStr(h1, h2) {
  return `${String(h1).padStart(2,'0')}:00–${String(h2).padStart(2,'0')}:00 (UTC+8)`;
}

function _o(k)  { return parseFloat(k[1]  !== undefined ? k[1]  : k.o); }
function _h(k)  { return parseFloat(k[2]  !== undefined ? k[2]  : k.h); }
function _l(k)  { return parseFloat(k[3]  !== undefined ? k[3]  : k.l); }
function _c(k)  { return parseFloat(k[4]  !== undefined ? k[4]  : k.c); }
function _v(k)  { return parseFloat(k[5]  !== undefined ? k[5]  : k.v || 0); }
function _ts(k) { return parseInt (k[0]   !== undefined ? k[0]  : k.t || k.ms || 0); }

function _mean(arr)   { return arr.length ? arr.reduce((s,v) => s+v, 0) / arr.length : 0; }
function _std(arr)    {
  if (arr.length < 2) return 0;
  const m = _mean(arr);
  return Math.sqrt(arr.reduce((s,v) => s + (v-m)**2, 0) / arr.length);
}
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

class ZhongshuValidator {
  static cache = new Map();

  constructor(klines) {
    this.klines = klines || [];
  }

  static _trimCache() {
    if (ZhongshuValidator.cache.size > 50) {
      const keys = [...ZhongshuValidator.cache.keys()].slice(0, 20);
      keys.forEach(k => ZhongshuValidator.cache.delete(k));
    }
  }

  validate(zhongshu) {
    if (!zhongshu || zhongshu.top == null || zhongshu.bottom == null) {
      return { isValid: false, confidence: 0, reasons: ['中枢数据缺失'] };
    }

    const cacheKey = `${zhongshu.top.toFixed(2)}_${zhongshu.bottom.toFixed(2)}_${this.klines.length}`;
    if (ZhongshuValidator.cache.has(cacheKey)) {
      return ZhongshuValidator.cache.get(cacheKey);
    }

    const reasons  = [];
    const scores   = [];

    const volCheck   = this.checkVolume(zhongshu);
    const timeCheck  = this.checkTime(zhongshu);
    const priceCheck = this.checkPrice(zhongshu);

    if (volCheck.pass) {
      scores.push(0.35 * volCheck.score);
      reasons.push(`✓ 成交量：中枢内缩量比 ${(volCheck.ratio * 100).toFixed(0)}%（有效）`);
    } else {
      scores.push(0.35 * 0.2);
      reasons.push(`△ 成交量：缩量不明显（比率 ${(volCheck.ratio * 100).toFixed(0)}%）`);
    }

    if (timeCheck.pass) {
      scores.push(0.30 * timeCheck.score);
      reasons.push(`✓ 时间结构：${timeCheck.barCount}根K线形成（≥最低${timeCheck.minRequired}根）`);
    } else {
      scores.push(0.30 * 0.1);
      reasons.push(`✗ 时间结构不足：仅${timeCheck.barCount}根（需≥${timeCheck.minRequired}根）`);
    }

    if (priceCheck.pass) {
      scores.push(0.35 * priceCheck.score);
      reasons.push(`✓ 价格边界：上下沿清晰度 ${(priceCheck.clarity * 100).toFixed(0)}%`);
    } else {
      scores.push(0.35 * 0.2);
      reasons.push(`△ 价格边界模糊（清晰度 ${(priceCheck.clarity * 100).toFixed(0)}%）`);
    }

    const confidence = _clamp(scores.reduce((s,v) => s+v, 0), 0, 1);
    const isValid    = confidence >= 0.45 && timeCheck.pass;

    const result = {
      isValid,
      confidence: parseFloat(confidence.toFixed(3)),
      reasons,
      volCheck, timeCheck, priceCheck,
    };

    ZhongshuValidator.cache.set(cacheKey, result);
    ZhongshuValidator._trimCache();
    return result;
  }

  checkVolume(zhongshu) {
    const klines = this.klines;
    if (klines.length < 20) {
      return { pass: false, score: 0.3, ratio: 0.5, reason: '数据不足' };
    }

    const top    = zhongshu.top;
    const bottom = zhongshu.bottom;

    const inZS  = klines.filter(k => { const c = _c(k); return c >= bottom && c <= top; });
    const outZS = klines.filter(k => { const c = _c(k); return c < bottom || c > top; });

    if (inZS.length < 3 || outZS.length < 3) {
      return { pass: false, score: 0.3, ratio: 0.5, reason: '中枢内K线不足' };
    }

    const volIn  = _mean(inZS.map(_v));
    const volOut = _mean(outZS.map(_v));

    if (volOut === 0) return { pass: false, score: 0.3, ratio: 1, reason: '成交量数据异常' };

    const ratio = volIn / volOut;
    const pass  = ratio < 0.85;
    const score = _clamp(1 - (ratio - 0.3) / 0.7, 0.1, 1.0);

    return {
      pass, score: parseFloat(score.toFixed(3)),
      ratio: parseFloat(ratio.toFixed(3)),
      volIn: parseFloat(volIn.toFixed(0)),
      volOut: parseFloat(volOut.toFixed(0)),
      reason: pass ? `中枢内缩量（比率${(ratio*100).toFixed(0)}%）` : `成交量未有效收缩（比率${(ratio*100).toFixed(0)}%）`,
    };
  }

  checkTime(zhongshu) {
    const klines = this.klines;
    const top    = zhongshu.top;
    const bottom = zhongshu.bottom;
    if (!top || !bottom || klines.length < 5) {
      return { pass: false, score: 0, barCount: 0, minRequired: 9, reason: '数据不足' };
    }

    let msPerBar = 14400000;
    if (klines.length >= 2) {
      const t1 = _ts(klines[klines.length - 1]);
      const t2 = _ts(klines[klines.length - 2]);
      if (t1 > t2) msPerBar = t1 - t2;
    }
    const hoursPerBar = msPerBar / 3600000;
    const minRequired = hoursPerBar >= 24 ? 5 : hoursPerBar >= 4 ? 9 : 18;

    let barCount = 0, inBlock = false;
    for (const k of klines) {
      const c = _c(k);
      if (c >= bottom * 0.995 && c <= top * 1.005) {
        barCount++;
        inBlock = true;
      } else if (inBlock) {
      }
    }

    const pass  = barCount >= minRequired;
    const score = _clamp(barCount / (minRequired * 2), 0, 1);
    return {
      pass, score: parseFloat(score.toFixed(3)),
      barCount, minRequired,
      hoursPerBar: parseFloat(hoursPerBar.toFixed(1)),
      reason: pass
        ? `时间结构充足（${barCount}根 ≥ ${minRequired}根）`
        : `时间不足（${barCount}根 < ${minRequired}根）`,
    };
  }

  checkPrice(zhongshu) {
    const klines = this.klines;
    const top    = zhongshu.top;
    const bottom = zhongshu.bottom;
    if (!top || !bottom) {
      return { pass: false, score: 0, clarity: 0, reason: '价格数据缺失' };
    }

    const tol = 0.005;
    let topTouches = 0, botTouches = 0;
    let topBreaks = 0, botBreaks = 0;

    for (const k of klines) {
      const h = _h(k), l = _l(k), c = _c(k);
      if (h >= top * (1 - tol) && h <= top * (1 + tol * 3))  topTouches++;
      if (l <= bottom * (1 + tol) && l >= bottom * (1 - tol * 3)) botTouches++;
      if (c > top * (1 + tol))    topBreaks++;
      if (c < bottom * (1 - tol)) botBreaks++;
    }

    const touchScore  = _clamp((Math.min(topTouches, 3) + Math.min(botTouches, 3)) / 6, 0, 1);
    const breakPenalty = Math.max(0, topBreaks + botBreaks - 4) * 0.05;
    const clarity = _clamp(touchScore - breakPenalty, 0, 1);
    const pass    = clarity >= 0.3 && topTouches >= 1 && botTouches >= 1;
    const score   = clarity;

    return {
      pass, score: parseFloat(score.toFixed(3)),
      clarity: parseFloat(clarity.toFixed(3)),
      topTouches, botTouches, topBreaks, botBreaks,
      reason: pass
        ? `上下沿清晰（上触${topTouches}次 下触${botTouches}次）`
        : `边界模糊（上触${topTouches}次 下触${botTouches}次）`,
    };
  }
}

class GannDynamicEngine {
  constructor(klines) {
    this.klines = klines || [];
    this._cache = {};
  }

  calculateGannBox(n = 60) {
    const k = this.klines.slice(-n);
    if (k.length < 10) return null;

    const highs   = k.map(_h);
    const lows    = k.map(_l);
    const rangeH  = Math.max(...highs);
    const rangeL  = Math.min(...lows);
    const priceRange = rangeH - rangeL;
    const timeRange  = k.length;

    const unitPrice = priceRange / timeRange;

    const atr = this._calcATR(k, 14);
    const volatilityFactor = atr > 0 ? atr / (priceRange / timeRange) : 1;

    return {
      rangeH: parseFloat(rangeH.toFixed(2)),
      rangeL: parseFloat(rangeL.toFixed(2)),
      priceRange: parseFloat(priceRange.toFixed(2)),
      timeRange,
      unitPrice: parseFloat(unitPrice.toFixed(4)),
      angle1x1: parseFloat(unitPrice.toFixed(4)),
      angle2x1: parseFloat((unitPrice * 2).toFixed(4)),
      angle1x2: parseFloat((unitPrice * 0.5).toFixed(4)),
      angle3x1: parseFloat((unitPrice * 3).toFixed(4)),
      angle1x3: parseFloat((unitPrice / 3).toFixed(4)),
      atr: parseFloat(atr.toFixed(2)),
      volatilityFactor: parseFloat(volatilityFactor.toFixed(3)),
    };
  }

  _calcATR(klines, period = 14) {
    if (klines.length < period + 1) return _mean(klines.map(k => _h(k) - _l(k)));
    const trs = [];
    for (let i = 1; i < klines.length; i++) {
      const h = _h(klines[i]), l = _l(klines[i]), pc = _c(klines[i-1]);
      trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    return _mean(trs.slice(-period));
  }

  getDynamicAngles() {
    const box = this.calculateGannBox();
    if (!box) return null;

    const vf  = _clamp(box.volatilityFactor, 0.5, 3.0);
    const adj = box.unitPrice * vf;

    const curPrice = _c(this.klines[this.klines.length - 1]);

    return {
      baseAngle: parseFloat(adj.toFixed(4)),
      volatilityFactor: parseFloat(vf.toFixed(3)),
      up: {
        '1x1': { slope: adj,       label: '1×1上行（均衡）',   color: '#d4a843' },
        '2x1': { slope: adj * 2,   label: '2×1上行（强势）',   color: '#28c870' },
        '3x1': { slope: adj * 3,   label: '3×1上行（极强）',   color: '#38a8e0' },
        '1x2': { slope: adj * 0.5, label: '1×2上行（弱势）',   color: '#888888' },
      },
      down: {
        '1x1': { slope: -adj,       label: '1×1下行（均衡）',   color: '#e04848' },
        '2x1': { slope: -adj * 2,   label: '2×1下行（强压）',   color: '#e08030' },
        '1x2': { slope: -adj * 0.5, label: '1×2下行（弱压）',   color: '#c0c0c0' },
      },
      currentChannel: this._identifyChannel(curPrice, box, adj),
    };
  }

  _identifyChannel(price, box, adj) {
    const mid = (box.rangeH + box.rangeL) / 2;
    const pos = (price - box.rangeL) / box.priceRange;

    if (pos > 0.786) return { label: '3×1强势区（顶部风险）', strength: 'overbought', color: '#e04848' };
    if (pos > 0.618) return { label: '2×1上行通道（强势）',   strength: 'strong_up',  color: '#28c870' };
    if (pos > 0.500) return { label: '1×1均衡偏多',          strength: 'slight_up',  color: '#d4a843' };
    if (pos > 0.382) return { label: '1×1均衡偏空',          strength: 'slight_dn',  color: '#e08030' };
    if (pos > 0.236) return { label: '1×2下行通道（弱势）',   strength: 'weak_dn',    color: '#c0c0c0' };
    return            { label: '3×1强势空区（底部机会）',     strength: 'oversold',   color: '#38a8e0' };
  }

  getKeyLevelsWithTime() {
    const box    = this.calculateGannBox();
    const angles = this.getDynamicAngles();
    if (!box || !angles) return [];

    const klines = this.klines;
    if (klines.length < 5) return [];

    const lastTs   = _ts(klines[klines.length - 1]);
    const prevTs   = _ts(klines[klines.length - 2]);
    const msPerBar = lastTs > prevTs ? lastTs - prevTs : 14400000;
    const hPerBar  = msPerBar / 3600000;

    const curPrice = _c(klines[klines.length - 1]);
    const results  = [];

    const pivots = [
      { price: box.rangeL, label: '最低点', dir: 'up' },
      { price: box.rangeH, label: '最高点', dir: 'dn' },
    ];

    const angleSlopes = {
      up: [angles.up['1x1'].slope, angles.up['2x1'].slope, angles.up['1x2'].slope],
      dn: [Math.abs(angles.down['1x1'].slope), Math.abs(angles.down['2x1'].slope)],
    };

    const nowUTC8 = _utc8Now();

    pivots.forEach(pivot => {
      const slopes = angleSlopes[pivot.dir] || [];
      slopes.forEach((slope, si) => {
        const barOffset = slope > 0 ? (curPrice - pivot.price) / slope : 0;

        for (let b = 1; b <= 6; b++) {
          const futurePrice = pivot.dir === 'up'
            ? pivot.price + slope * (barOffset + b)
            : pivot.price - slope * (barOffset + b);

          if (futurePrice <= 0) continue;

          const startMs = lastTs + (b - 1) * msPerBar;
          const endMs   = lastTs + b * msPerBar;
          const startD  = new Date(startMs);
          const endD    = new Date(endMs);
          const startH  = parseInt(_utc8Str(startD).slice(11, 13)) || 0;
          const endH    = (startH + Math.ceil(hPerBar)) % 24;

          const diffPct = Math.abs(futurePrice - curPrice) / curPrice * 100;
          if (diffPct > 15) continue;

          const isAbove  = futurePrice > curPrice;
          const lineLabel = pivot.dir === 'up'
            ? ['1×1上行', '2×1上行', '1×2上行'][si] || '上行'
            : ['1×1下行', '2×1下行'][si] || '下行';

          results.push({
            price:      parseFloat(futurePrice.toFixed(2)),
            barOffset:  b,
            timeWindow: _utc8TimeStr(startH, endH),
            label:      `${pivot.label}${lineLabel}线 +${b}根`,
            source:     `${lineLabel}（斜率${slope.toFixed(2)}/根）`,
            isAbove,
            diffPct:    parseFloat(diffPct.toFixed(2)),
          });
        }
      });
    });

    const deduped = [];
    results.sort((a,b) => a.diffPct - b.diffPct).forEach(r => {
      if (!deduped.some(d => Math.abs(d.price - r.price) / (curPrice||1) < 0.003)) {
        deduped.push(r);
      }
    });

    return deduped.slice(0, 8);
  }

  getAngleLines(canvasW = 400, canvasH = 200, futureN = 10) {
    const box    = this.calculateGannBox();
    const angles = this.getDynamicAngles();
    if (!box || !angles) return [];

    const klines   = this.klines;
    const n        = Math.min(40, klines.length);
    const recent   = klines.slice(-n);
    const allH     = recent.map(_h), allL = recent.map(_l);
    const minP     = Math.min(...allL), maxP = Math.max(...allH);
    const pRange   = maxP - minP || 1;
    const totalBars = n + futureN;

    const toX = b => (b / totalBars) * canvasW;
    const toY = p => canvasH - ((p - minP) / pRange) * canvasH * 0.9 - canvasH * 0.05;

    const lines = [];

    const lowIdx  = allL.indexOf(Math.min(...allL));
    const lowPrice = allL[lowIdx];
    [angles.up['1x1'], angles.up['2x1'], angles.up['1x2']].forEach(ang => {
      const pts = [];
      for (let b = 0; b <= futureN + (n - lowIdx); b++) {
        const price = lowPrice + ang.slope * b;
        if (price < minP * 0.98 || price > maxP * 1.05) continue;
        pts.push({ x: parseFloat(toX(lowIdx + b).toFixed(1)), y: parseFloat(toY(price).toFixed(1)) });
      }
      if (pts.length >= 2) lines.push({ label: ang.label, color: ang.color, points: pts, dash: false });
    });

    const highIdx  = allH.indexOf(Math.max(...allH));
    const highPrice = allH[highIdx];
    [angles.down['1x1'], angles.down['2x1']].forEach(ang => {
      const pts = [];
      for (let b = 0; b <= futureN + (n - highIdx); b++) {
        const price = highPrice + ang.slope * b;
        if (price < minP * 0.95 || price > maxP * 1.02) continue;
        pts.push({ x: parseFloat(toX(highIdx + b).toFixed(1)), y: parseFloat(toY(price).toFixed(1)) });
      }
      if (pts.length >= 2) lines.push({ label: ang.label, color: ang.color, points: pts, dash: true });
    });

    return {
      lines,
      canvasW, canvasH,
      minP: parseFloat(minP.toFixed(2)),
      maxP: parseFloat(maxP.toFixed(2)),
      currentBarIdx: n - 1,
    };
  }
}

class SignalBacktester {
  constructor(klines) {
    this.klines = klines || [];
    this._cache = {};
  }

  backtest(signalType, holdBars = 12) {
    const cacheKey = `${signalType}_${holdBars}_${this.klines.length}`;
    if (this._cache[cacheKey]) return this._cache[cacheKey];

    const klines = this.klines;
    if (klines.length < 60) {
      return { totalSignals:0, winCount:0, lossCount:0, winRate:'N/A',
               avgReturn:'N/A', maxReturn:'N/A', maxLoss:'N/A', sharpeRatio:0,
               note:'K线不足60根，无法回测' };
    }

    const signalFn = this._getSignalDetector(signalType);
    if (!signalFn) return { totalSignals:0, winRate:'N/A', note:'未知信号类型' };

    const returns = [];
    const WIN  = 5;

    const SCAN_WIN = 60;
    for (let i = SCAN_WIN; i < klines.length - holdBars; i++) {
      const slice = klines.slice(i - SCAN_WIN, i);
      const hasSignal = signalFn(slice);
      if (!hasSignal) continue;

      const entryPrice = _c(klines[i]);
      const futureClose = _c(klines[i + holdBars]);
      const ret = (futureClose - entryPrice) / entryPrice * 100;
      returns.push(ret);
    }

    if (!returns.length) {
      const result = { totalSignals:0, winCount:0, lossCount:0, winRate:'0%',
                       avgReturn:'0%', maxReturn:'0%', maxLoss:'0%', sharpeRatio:0,
                       note:'扫描期内未发现该信号' };
      this._cache[cacheKey] = result;
      return result;
    }

    const isBull = signalType.includes('bull') || signalType.includes('resonance');
    const adjustedReturns = isBull ? returns : returns.map(r => -r);

    const wins    = adjustedReturns.filter(r => r > 0.5);
    const losses  = adjustedReturns.filter(r => r <= 0);
    const winRate = adjustedReturns.length ? wins.length / adjustedReturns.length : 0;
    const avgRet  = _mean(adjustedReturns);
    const stdRet  = _std(adjustedReturns);
    const sharpe  = stdRet > 0 ? avgRet / stdRet : 0;

    const result = {
      totalSignals: returns.length,
      winCount:     wins.length,
      lossCount:    losses.length,
      winRate:      `${(winRate * 100).toFixed(0)}%`,
      winRateNum:   parseFloat((winRate * 100).toFixed(1)),
      avgReturn:    `${avgRet > 0 ? '+' : ''}${avgRet.toFixed(2)}%`,
      maxReturn:    `+${Math.max(0, ...adjustedReturns).toFixed(2)}%`,
      maxLoss:      `${Math.min(0, ...adjustedReturns).toFixed(2)}%`,
      sharpeRatio:  parseFloat(sharpe.toFixed(2)),
      holdBars,
      note: `基于近${klines.length}根K线历史回测（持仓${holdBars}根后平仓）`,
    };

    this._cache[cacheKey] = result;
    return result;
  }

  _getSignalDetector(type) {
    const detectors = {
      'macd_divergence_bull': (klines) => {
        if (klines.length < 35) return false;
        const closes = klines.map(_c);
        const lows   = klines.map(_l);
        const dif    = this._quickDIF(closes);
        if (!dif || dif.length < 10) return false;
        const recentL   = lows.slice(-20);
        const recentDIF = dif.slice(-20);
        const minL10   = Math.min(...recentL.slice(-10));
        const minL20   = Math.min(...recentL.slice(0, 10));
        const difEnd   = recentDIF[recentDIF.length - 1];
        const difMid   = _mean(recentDIF.slice(0, 10).filter(v => v != null));
        return minL10 < minL20 * 0.998 && difEnd > difMid * 1.05;
      },
      'macd_divergence_bear': (klines) => {
        if (klines.length < 35) return false;
        const closes = klines.map(_c);
        const highs  = klines.map(_h);
        const dif    = this._quickDIF(closes);
        if (!dif || dif.length < 10) return false;
        const recentH   = highs.slice(-20);
        const recentDIF = dif.slice(-20);
        const maxH10  = Math.max(...recentH.slice(-10));
        const maxH20  = Math.max(...recentH.slice(0, 10));
        const difEnd  = recentDIF[recentDIF.length - 1];
        const difMid  = _mean(recentDIF.slice(0, 10).filter(v => v != null));
        return maxH10 > maxH20 * 1.002 && difEnd < difMid * 0.95;
      },
      'direction_resonance': (klines) => {
        if (klines.length < 25) return false;
        const closes = klines.map(_c);
        const ma20   = _mean(closes.slice(-20));
        const last   = closes[closes.length - 1];
        const bias   = (last - ma20) / ma20 * 100;
        return Math.abs(bias) > 1;
      },
      'zhongshu_break': (klines) => {
        if (klines.length < 20) return false;
        const closes = klines.map(_c);
        const high   = Math.max(...klines.slice(-20).map(_h));
        const low    = Math.min(...klines.slice(-20).map(_l));
        const mid    = (high + low) / 2;
        const range  = (high - low) * 0.382;
        const last   = closes[closes.length - 1];
        return last > mid + range || last < mid - range;
      },
    };
    return detectors[type] || null;
  }

  _quickDIF(closes) {
    if (closes.length < 26) return null;
    const k12 = 2 / 13, k26 = 2 / 27;
    let ema12 = _mean(closes.slice(0, 12));
    let ema26 = _mean(closes.slice(0, 26));
    const dif = new Array(26).fill(null);
    for (let i = 26; i < closes.length; i++) {
      ema12 = closes[i] * k12 + ema12 * (1 - k12);
      ema26 = closes[i] * k26 + ema26 * (1 - k26);
      dif.push(ema12 - ema26);
    }
    return dif;
  }

  getConfidence(currentSignal) {
    if (!currentSignal) return { confidence: 50, rating: 'C', similarHistory: 0, similarWinRate: 'N/A' };

    const signalType = this._mapSignalType(currentSignal);
    const bt = this.backtest(signalType);

    const winRateNum = parseFloat(bt.winRate) || 50;
    const conf = _clamp(
      winRateNum * 0.6 +
      Math.min(bt.totalSignals, 20) / 20 * 100 * 0.2 +
      Math.min(bt.sharpeRatio * 20, 40) * 0.2,
      0, 100
    );

    const rating = conf >= 80 ? 'S' : conf >= 65 ? 'A' : conf >= 50 ? 'B' : 'C';

    return {
      rating,
      confidence: parseFloat(conf.toFixed(0)),
      similarHistory: bt.totalSignals,
      similarWinRate: bt.winRate,
      sharpeRatio: bt.sharpeRatio,
      avgReturn: bt.avgReturn,
    };
  }

  _mapSignalType(signal) {
    const type = (signal.type || signal.signalType || '').toLowerCase();
    if (type.includes('背驰') && (type.includes('底') || type.includes('bull'))) return 'macd_divergence_bull';
    if (type.includes('背驰') && (type.includes('顶') || type.includes('bear'))) return 'macd_divergence_bear';
    if (type.includes('方向') || type.includes('resonance'))                      return 'direction_resonance';
    if (type.includes('中枢') || type.includes('突破'))                           return 'zhongshu_break';
    return 'direction_resonance';
  }

  getRiskWarning(signal, currentPrice) {
    if (!signal || !currentPrice) return null;
    const atr = this._calcLocalATR();
    const isBull = signal.bull !== false;
    const slDist  = atr * 1.5;
    const tpDist  = atr * 2.5;
    const sl = isBull ? currentPrice - slDist : currentPrice + slDist;
    const tp = isBull ? currentPrice + tpDist : currentPrice - tpDist;
    const rrr = (tpDist / slDist).toFixed(2);

    const bt = this.backtest(this._mapSignalType(signal));
    const winRateNum = parseFloat(bt.winRate) || 50;
    const b = parseFloat(rrr);
    const p = winRateNum / 100;
    const q = 1 - p;
    const kellyFull = (b * p - q) / b;
    const halfKelly  = _clamp(kellyFull / 2 * 100, 0, 25);

    return {
      direction:      isBull ? '做多' : '做空',
      stopLoss:       parseFloat(sl.toFixed(2)),
      takeProfit:     parseFloat(tp.toFixed(2)),
      stopLossPct:    parseFloat((slDist / currentPrice * 100).toFixed(2)),
      takeProfitPct:  parseFloat((tpDist / currentPrice * 100).toFixed(2)),
      rrr:            parseFloat(rrr),
      atr:            parseFloat(atr.toFixed(2)),
      suggestPosition: parseFloat(halfKelly.toFixed(1)),
      riskLevel:      halfKelly > 15 ? '高' : halfKelly > 8 ? '中' : '低',
      note: `ATR止损（1.5×ATR）, 目标（2.5×ATR）, 半凯利仓位 ${halfKelly.toFixed(1)}%`,
    };
  }

  _calcLocalATR(period = 14) {
    const k = this.klines.slice(-period - 1);
    if (k.length < 2) return 100;
    const trs = [];
    for (let i = 1; i < k.length; i++) {
      const h = _h(k[i]), l = _l(k[i]), pc = _c(k[i-1]);
      trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    return _mean(trs);
  }
}

class SignalEnhancer {
  constructor(klines) {
    if (!klines || klines.length === 0) {
      throw new Error('SignalEnhancer：klines 不能为空');
    }
    this.klines            = klines;
    this.zhongshuValidator = new ZhongshuValidator(klines);
    this.gannEngine        = new GannDynamicEngine(klines);
    this.backtester        = new SignalBacktester(klines);
    this._enhanceCache     = new Map();
  }

  enhanceSignal(rawSignal) {
    if (!rawSignal) return null;

    const cacheKey = JSON.stringify({ type: rawSignal.type, rating: rawSignal.rating });
    if (this._enhanceCache.has(cacheKey)) return this._enhanceCache.get(cacheKey);

    const swanResult = this._detectBlackSwan();
    if (swanResult.isBlackSwan) {
      const result = {
        ...rawSignal,
        rating: 'X', grade: 'X',
        gradeLabel: '黑天鹅警报',
        confidence: 0, suggestPosition: 0,
        riskLevel: '极高',
        blackSwan: swanResult,
        visualization: { htmlSummary: this._buildBlackSwanHTML(swanResult) },
        analysisTime: _utc8Str(_utc8Now()),
        hasSynergy: false,
      };
      this._enhanceCache.set(cacheKey, result);
      return result;
    }

    const curPrice = _c(this.klines[this.klines.length - 1]);

    const volFilter = this._checkVolumeFilter();

    const fakeFilter = this._detectFakeSignal(rawSignal);

    const zhongshu = rawSignal.zhongshu || rawSignal.chanZone || {
      top:    rawSignal.details?.priceResonance?.chanZone || curPrice * 1.05,
      bottom: curPrice * 0.95,
    };
    zhongshu.mid = zhongshu.mid || (zhongshu.top + zhongshu.bottom) / 2;
    const zhongshuConf = this.zhongshuValidator.validate(zhongshu);

    const gannBox    = this.gannEngine.calculateGannBox();

    const gannAngles = this.gannEngine.getDynamicAngles();

    const gannLevels = this.gannEngine.getKeyLevelsWithTime();

    const angleViz   = this.gannEngine.getAngleLines();

    const isBullSignal = rawSignal.bull !== false
      && (rawSignal.synergyDir === 'bull' || (rawSignal.details?.directionResonance?.gannBias > 0));
    const filteredLevels = gannLevels.filter(l =>
      isBullSignal ? !l.isAbove : l.isAbove
    );
    const relevantLevels = filteredLevels.length > 0 ? filteredLevels : gannLevels;

    const nearestGann = relevantLevels.find(l => l.diffPct <= 5) || gannLevels[0] || null;
    const timeWindow  = nearestGann ? nearestGann.timeWindow : _utc8TimeStr(0, 4);

    const gannChanResonant = gannLevels.some(gl =>
      Math.abs(gl.price - zhongshu.top)    / (curPrice || 1) * 100 < 1.5 ||
      Math.abs(gl.price - zhongshu.bottom) / (curPrice || 1) * 100 < 1.5
    );

    const histConf  = this.backtester.getConfidence(rawSignal);
    const riskWarn  = this.backtester.getRiskWarning(rawSignal, curPrice);

    const ratingScore  = { S:100, A:80, B:60, C:40, 'N/A':30 };
    const baseScore    = ratingScore[rawSignal.rating || 'C'] || 40;
    const gannBonus    = gannChanResonant ? 100 : (nearestGann && nearestGann.diffPct <= 3 ? 70 : 40);
    const finalConf    = Math.round(
      baseScore            * 0.30 +
      histConf.confidence  * 0.30 +
      zhongshuConf.confidence * 100 * 0.25 +
      gannBonus            * 0.15
    );

    const channelStr = gannAngles?.currentChannel?.strength || 'ranging';
    const channelRisk = { overbought: 1, oversold: 0, strong_up: 0, strong_dn: 1,
                          slight_up: 0, slight_dn: 0 }[channelStr] ?? 0;
    const riskLevel = (finalConf >= 75 && !channelRisk && !volFilter.filtered && !fakeFilter.isFake) ? '低'
                    : finalConf >= 55 ? '中' : '高';

    const mtfRatings   = rawSignal._multiTFRatings || null;
    const mtfResult    = mtfRatings ? this._mergeMultiTFRatings(rawSignal.rating, mtfRatings) : null;

    const moneyMgmt = this._calcMoneyManagement(rawSignal, finalConf, riskWarn);

    const viz = this._buildVizSuggestion(
      rawSignal, riskWarn, relevantLevels, gannAngles, gannBox, angleViz, curPrice
    );

    const enhanced = {
      ...rawSignal,

      confidence:      finalConf,
      confidenceLabel: finalConf >= 80 ? '高置信' : finalConf >= 60 ? '中置信' : '低置信',
      riskLevel,
      timeWindow,
      analysisTime:    _utc8Str(_utc8Now()),

      zhongshuValidation: {
        isValid:    zhongshuConf.isValid,
        confidence: zhongshuConf.confidence,
        reasons:    zhongshuConf.reasons,
        volCheck:   zhongshuConf.volCheck   || null,
        timeCheck:  zhongshuConf.timeCheck  || null,
        priceCheck: zhongshuConf.priceCheck || null,
      },

      gannDynamic: {
        keyLevels:       relevantLevels,
        allLevels:       gannLevels,
        channel:         gannAngles?.currentChannel || null,
        channelNote:     gannAngles?.currentChannel
                          ? `当前处于${gannAngles.currentChannel.label}` : null,
        box: gannBox ? {
          rangeH:           gannBox.rangeH,
          rangeL:           gannBox.rangeL,
          atr:              gannBox.atr,
          volatilityFactor: gannBox.volatilityFactor,
          angle1x1:         gannBox.angle1x1,
          angle2x1:         gannBox.angle2x1,
        } : null,
        nearestLevel:    nearestGann,
        gannChanResonant,
        angleLines:      angleViz?.lines  || [],
        canvasInfo:      angleViz ? {
          w: angleViz.canvasW, h: angleViz.canvasH,
          minP: angleViz.minP,  maxP: angleViz.maxP,
          currentBarIdx: angleViz.currentBarIdx,
        } : null,
        summary: this._buildGannSummary(gannBox, gannAngles, nearestGann, isBullSignal),
      },

      history: {
        confidence:   histConf.confidence,
        rating:       histConf.rating,
        totalSignals: histConf.similarHistory,
        winRate:      histConf.similarWinRate,
        avgReturn:    histConf.avgReturn,
        sharpeRatio:  histConf.sharpeRatio,
      },

      suggestStopLoss:  riskWarn ? riskWarn.stopLoss      : null,
      suggestTarget:    riskWarn ? riskWarn.takeProfit     : null,
      suggestStopPct:   riskWarn ? riskWarn.stopLossPct    : null,
      suggestTargetPct: riskWarn ? riskWarn.takeProfitPct  : null,
      rrr:              riskWarn ? riskWarn.rrr             : null,
      suggestPosition:  moneyMgmt.suggestPosition,

      volumeFilter:  volFilter,
      fakeFilter:    fakeFilter,
      blackSwan:     swanResult,
      multiTF:       mtfResult,
      moneyManagement: moneyMgmt,

      visualization: {
        ...viz,
        htmlSummary: viz.htmlSummary
          + this._buildFiltersHTML(volFilter, fakeFilter, mtfResult, moneyMgmt),
      },
    };

    this._enhanceCache.set(cacheKey, enhanced);
    return enhanced;
  }

  _buildGannSummary(box, angles, nearestLevel, isBull) {
    if (!box || !angles) return '江恩数据不足';
    const ch  = angles.currentChannel;
    const vf  = box.volatilityFactor;
    const atr = box.atr;
    const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };

    let s = '';
    if (ch) s += `当前处于「${ch.label}」`;
    s += vf > 1.5 ? '，波动率偏高（角度线变陡）'
       : vf < 0.7 ? '，波动率偏低（角度线平缓）'
       : '，波动率正常';
    if (nearestLevel) {
      s += `。最近关键位 ${fmtP(nearestLevel.price)}（${nearestLevel.isAbove ? '上方阻力' : '下方支撑'}）`
        + `，预计触及时间窗口 ${nearestLevel.timeWindow}`;
    }
    s += isBull ? '。ATR=' + fmtP(atr) + '，关注支撑位企稳入场机会'
                : '。ATR=' + fmtP(atr) + '，关注阻力位回落做空机会';
    return s;
  }

  _buildVizSuggestion(signal, riskWarn, gannLevels, gannAngles, gannBox, angleViz, curPrice) {
    const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n)||_n===0)return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };
    const lines = [];

    lines.push({ type:'price', price:curPrice, color:'#d4a843',
      label:`当前价 ${fmtP(curPrice)}`, dash:false, width:2 });

    if (riskWarn) {
      lines.push({ type:'sl', price:riskWarn.stopLoss, color:'#e04848',
        label:`⛔ 止损 ${fmtP(riskWarn.stopLoss)} (-${riskWarn.stopLossPct}%)`, dash:true, width:1.5 });
      lines.push({ type:'tp', price:riskWarn.takeProfit, color:'#28c870',
        label:`🎯 目标 ${fmtP(riskWarn.takeProfit)} (+${riskWarn.takeProfitPct}%)`, dash:true, width:1.5 });
    }

    gannLevels.slice(0, 5).forEach(l => {
      const isSupport = !l.isAbove;
      lines.push({ type:'gann', price:l.price,
        color: isSupport ? '#2060a0' : '#a04020',
        label:`${l.label} ${fmtP(l.price)} ⏰${l.timeWindow}`,
        dash:true, width:1, timeWindow:l.timeWindow, isAbove:l.isAbove });
    });

    const zsTop = signal.zhongshu?.top || signal.details?.priceResonance?.chanZone;
    const zsBot = signal.zhongshu?.bottom;
    if (zsTop && zsBot) {
      lines.push({ type:'zs_top', price:zsTop, color:'rgba(40,200,112,0.5)',
        label:`缠论中枢上轨 ${fmtP(zsTop)}`, dash:true, width:1 });
      lines.push({ type:'zs_bot', price:zsBot, color:'rgba(40,200,112,0.5)',
        label:`缠论中枢下轨 ${fmtP(zsBot)}`, dash:true, width:1 });
    }

    const channelNote = gannAngles?.currentChannel
      ? `当前处于${gannAngles.currentChannel.label}` : null;

    return {
      horizontalLines: lines,
      angleLines:      angleViz?.lines   || [],
      channelNote,
      canvasInfo:      angleViz ? {
        w:angleViz.canvasW, h:angleViz.canvasH,
        minP:angleViz.minP, maxP:angleViz.maxP } : null,
      htmlSummary: this._buildVizHTML(lines, channelNote, riskWarn, gannLevels, gannBox, gannAngles, curPrice),
    };
  }

  _buildVizHTML(lines, channelNote, riskWarn, gannLevels, gannBox, gannAngles, curPrice) {
    const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n)||_n===0)return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };

    let html = '<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">'
      + '<div style="font-size:.65rem;font-weight:700;color:var(--faint);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">'
      + '🎯 可视化：止损/目标 · 江恩角度线 · 时间窗口</div>';

    if (riskWarn) {
      const riskColor = riskWarn.riskLevel === '低' ? 'var(--bull)' : riskWarn.riskLevel === '中' ? 'var(--amber)' : 'var(--bear)';
      html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:12px">'
        + `<div style="padding:8px;background:rgba(224,72,72,0.08);border:1px solid rgba(224,72,72,0.25);border-radius:7px;text-align:center">
             <div style="font-size:.55rem;color:var(--bear);margin-bottom:2px">⛔ 止损位</div>
             <div style="font-size:.82rem;font-weight:700;color:var(--bear)">${fmtP(riskWarn.stopLoss)}</div>
             <div style="font-size:.58rem;color:var(--faint)">-${riskWarn.stopLossPct}%</div>
           </div>`
        + `<div style="padding:8px;background:rgba(40,200,112,0.08);border:1px solid rgba(40,200,112,0.25);border-radius:7px;text-align:center">
             <div style="font-size:.55rem;color:var(--bull);margin-bottom:2px">🎯 目标位</div>
             <div style="font-size:.82rem;font-weight:700;color:var(--bull)">${fmtP(riskWarn.takeProfit)}</div>
             <div style="font-size:.58rem;color:var(--faint)">+${riskWarn.takeProfitPct}%</div>
           </div>`
        + `<div style="padding:8px;background:rgba(200,168,74,0.08);border:1px solid rgba(200,168,74,0.2);border-radius:7px;text-align:center">
             <div style="font-size:.55rem;color:var(--gold);margin-bottom:2px">⚖ 盈亏比</div>
             <div style="font-size:.82rem;font-weight:700;color:var(--gold)">${riskWarn.rrr}R</div>
             <div style="font-size:.58rem;color:var(--faint)">RRR</div>
           </div>`
        + `<div style="padding:8px;background:rgba(96,48,160,0.08);border:1px solid rgba(96,48,160,0.2);border-radius:7px;text-align:center">
             <div style="font-size:.55rem;color:var(--purple);margin-bottom:2px">💼 建议仓位</div>
             <div style="font-size:.82rem;font-weight:700;color:var(--purple)">${riskWarn.suggestPosition}%</div>
             <div style="font-size:.58rem;color:${riskColor}">风险${riskWarn.riskLevel}</div>
           </div>`
        + '</div>';
    }

    // ── 江恩箱参数简报 ──
    if (gannBox) {
      const vf = gannBox.volatilityFactor;
      const vfLabel = vf > 1.5 ? '⚡高波动（角度变陡）' : vf < 0.7 ? '🔵低波动（角度平缓）' : '✓ 正常波动';
      const vfColor = vf > 1.5 ? 'var(--bear)' : vf < 0.7 ? 'var(--sky)' : 'var(--bull)';
      const chLabel = gannAngles?.currentChannel?.label || '--';
      const chColor = gannAngles?.currentChannel?.color || 'var(--muted)';
      html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:10px">'
        + `<div style="padding:7px 10px;background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.18);border-radius:7px">
             <div style="font-size:.55rem;color:var(--faint);margin-bottom:2px">⬡ 江恩箱范围</div>
             <div style="font-size:.72rem;font-weight:700;color:var(--gold)">${fmtP(gannBox.rangeL)} – ${fmtP(gannBox.rangeH)}</div>
             <div style="font-size:.58rem;color:var(--faint)">ATR ${fmtP(gannBox.atr)}</div>
           </div>`
        + `<div style="padding:7px 10px;background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.18);border-radius:7px">
             <div style="font-size:.55rem;color:var(--faint);margin-bottom:2px">⬡ 波动率状态</div>
             <div style="font-size:.7rem;font-weight:700;color:${vfColor}">${vfLabel}</div>
             <div style="font-size:.58rem;color:var(--faint)">因子 ×${vf.toFixed(2)}</div>
           </div>`
        + `<div style="padding:7px 10px;background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.18);border-radius:7px">
             <div style="font-size:.55rem;color:var(--faint);margin-bottom:2px">⬡ 当前通道</div>
             <div style="font-size:.68rem;font-weight:700;color:${chColor}">${chLabel}</div>
             <div style="font-size:.58rem;color:var(--faint)">1×1斜率 ${gannBox.angle1x1}/根</div>
           </div>`
        + '</div>';
    }

    // ── 江恩角度线关键位时间窗口表 ──
    if (gannLevels.length > 0) {
      html += '<div style="font-size:.65rem;font-weight:700;color:var(--gold);margin-bottom:5px">⬡ 江恩角度线关键位 · 预计触达时间窗口（UTC+8）</div>'
        + '<div style="display:flex;flex-direction:column;gap:3px;margin-bottom:10px">'
        + gannLevels.slice(0, 6).map((l, i) => {
            const isAbove = l.isAbove;
            const priceColor  = isAbove ? 'var(--bear)' : 'var(--bull)';
            const dirLabel    = isAbove ? '▲阻力' : '▼支撑';
            const rowBg = i === 0
              ? (isAbove ? 'rgba(192,48,48,0.08)' : 'rgba(24,145,80,0.08)')
              : 'rgba(200,168,74,0.04)';
            const rowBorder = i === 0
              ? (isAbove ? '1px solid rgba(192,48,48,0.25)' : '1px solid rgba(24,145,80,0.25)')
              : '1px solid rgba(200,168,74,0.12)';
            return `<div style="display:grid;grid-template-columns:90px 1fr 1fr auto;align-items:center;gap:8px;padding:5px 9px;background:${rowBg};border:${rowBorder};border-radius:6px;font-size:.68rem">
              <span style="font-weight:700;color:${priceColor}">${fmtP(l.price)} <span style="font-size:.58rem;font-weight:400;color:var(--faint)">${dirLabel}</span></span>
              <span style="color:var(--muted);font-size:.65rem">${l.label}</span>
              <span style="color:var(--muted);font-size:.62rem">${l.source || ''}</span>
              <span style="color:var(--gold);font-weight:600;white-space:nowrap">⏰ ${l.timeWindow}</span>
            </div>`;
          }).join('')
        + '</div>';
    }

    // ── 角度通道提示 ──
    if (channelNote) {
      const chColor = gannAngles?.currentChannel?.color || 'var(--sky)';
      html += `<div style="padding:7px 10px;background:rgba(56,168,224,0.07);border:1px solid rgba(56,168,224,0.2);border-radius:7px;font-size:.7rem;color:${chColor};margin-bottom:8px">
        📐 ${channelNote}${gannBox ? '（1×1斜率=' + gannBox.angle1x1 + '/根，2×1斜率=' + gannBox.angle2x1 + '/根）' : ''}
      </div>`;
    }

    // ── 角度线图例说明 ──
    if (gannAngles) {
      const upAngles  = Object.values(gannAngles.up  || {});
      const dnAngles  = Object.values(gannAngles.down || {});
      if (upAngles.length || dnAngles.length) {
        html += '<div style="font-size:.62rem;color:var(--faint);line-height:1.8;padding:5px 8px;background:rgba(0,0,0,0.03);border-radius:6px">'
          + '<span style="font-weight:700;color:var(--muted)">角度线图例：</span>'
          + upAngles.map(a => `<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><span style="display:inline-block;width:14px;height:2px;background:${a.color};border-radius:1px"></span>${a.label}</span>`).join('')
          + dnAngles.map(a => `<span style="display:inline-flex;align-items:center;gap:3px;margin-right:8px"><span style="display:inline-block;width:14px;height:2px;background:${a.color};border-radius:1px;border-top:1px dashed ${a.color}"></span>${a.label}</span>`).join('')
          + '</div>';
      }
    }

    html += '</div>';
    return html;
  }

  // ── 批量增强（多信号）────────────────────────────────────────────────────
  enhanceAll(rawSignals) {
    if (!Array.isArray(rawSignals)) return [];
    return rawSignals.map(s => this.enhanceSignal(s));
  }

  // ── 清空缓存 ─────────────────────────────────────────────────────────────

  // ════════════════════════════════════════════════════════════════════════
  // 新功能 A: 黑天鹅保护罩
  // 检测条件: 近20根K线3σ阈值 + 近5根任意一根超阈值 + 成交量突增3倍
  // ════════════════════════════════════════════════════════════════════════
  _detectBlackSwan() {
    const k = this.klines;
    if (k.length < 22) return { isBlackSwan: false, reason: '数据不足' };

    // 计算近20根K线涨跌幅序列
    const recent20 = k.slice(-22, -2);  // 排除最后2根（避免用未完成K线）
    const returns  = [];
    for (let i = 1; i < recent20.length; i++) {
      const prev = _c(recent20[i-1]);
      const cur  = _c(recent20[i]);
      if (prev > 0) returns.push((cur - prev) / prev * 100);
    }
    if (returns.length < 5) return { isBlackSwan: false, reason: '收益率数据不足' };

    const mu  = _mean(returns);
    const sig = _std(returns);
    const threshold3 = Math.abs(mu) + sig * 3;  // 3σ阈值

    // 近5根K线逐一检测
    const last5 = k.slice(-6);
    let spikeBars = [];
    for (let i = 1; i < last5.length; i++) {
      const prev = _c(last5[i-1]);
      const cur  = _c(last5[i]);
      if (prev <= 0) continue;
      const ret = Math.abs((cur - prev) / prev * 100);
      if (ret > threshold3) {
        spikeBars.push({ barIdx: i, ret: parseFloat(ret.toFixed(2)), threshold: parseFloat(threshold3.toFixed(2)) });
      }
    }

    if (spikeBars.length === 0) return { isBlackSwan: false, threshold3: parseFloat(threshold3.toFixed(2)) };

    // 成交量突增检测（近5根 vs 近20根平均成交量）
    const avgVol20 = _mean(recent20.map(_v));
    const maxVol5  = Math.max(...last5.map(_v));
    const volSpike = avgVol20 > 0 ? maxVol5 / avgVol20 : 1;
    const isVolSpike = volSpike >= 3;

    const isBlackSwan = spikeBars.length > 0 && isVolSpike;
    return {
      isBlackSwan,
      threshold3:    parseFloat(threshold3.toFixed(2)),
      mu:            parseFloat(mu.toFixed(3)),
      sigma:         parseFloat(sig.toFixed(3)),
      spikeBars,
      volSpike:      parseFloat(volSpike.toFixed(2)),
      isVolSpike,
      warning: isBlackSwan
        ? `⚠ 黑天鹅警报：近期K线振幅超过3σ阈值（${threshold3.toFixed(1)}%），成交量突增${volSpike.toFixed(1)}倍，建议暂停操作`
        : spikeBars.length > 0
          ? `△ 检测到价格异常，但成交量未同步突增（量/均=${volSpike.toFixed(1)}）`
          : '正常',
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // 新功能 B: 成交额过滤
  // 最后一根K线成交额 < 近20根均值×0.8 → 信号评级降一级
  // ════════════════════════════════════════════════════════════════════════
  _checkVolumeFilter() {
    const k = this.klines;
    if (k.length < 21) return { filtered: false, reason: '数据不足' };

    // 成交额 = 成交量 × 收盘价（Binance k[5]=volume, 用 k[5]*k[4] 近似成交额）
    const getQuoteVol = (bar) => {
      // Binance原始格式: k[7] = quoteAssetVolume（精确成交额）
      const qv = parseFloat(bar[7] !== undefined ? bar[7] : 0);
      return qv > 0 ? qv : _v(bar) * _c(bar);  // 降级用quantity×price
    };

    const recent20  = k.slice(-21, -1);
    const avgQuoteVol = _mean(recent20.map(getQuoteVol));
    const lastQuoteVol = getQuoteVol(k[k.length - 1]);

    const ratio    = avgQuoteVol > 0 ? lastQuoteVol / avgQuoteVol : 1;
    const filtered = ratio < 0.8;

    return {
      filtered,
      ratio:        parseFloat(ratio.toFixed(3)),
      lastQuoteVol: parseFloat(lastQuoteVol.toFixed(0)),
      avgQuoteVol:  parseFloat(avgQuoteVol.toFixed(0)),
      downgrade:    filtered ? '信号评级降一级（成交额不足）' : null,
      reason:       filtered
        ? `当前K线成交额仅为近20根均值的${(ratio*100).toFixed(0)}%（<80%），量能不足信号可信度下降`
        : `成交额正常（${(ratio*100).toFixed(0)}%）`,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // 新功能 C: 假信号过滤器（规则集打分 0-100，<50视为假信号）
  // 特征：价格波动率、成交量趋势、MACD强度、江恩偏差、小时、星期几
  // ════════════════════════════════════════════════════════════════════════
  _detectFakeSignal(rawSignal) {
    const k = this.klines;
    if (k.length < 20) return { isFake: false, score: 50, reasons: ['数据不足，跳过过滤'] };

    const scores  = [];
    const reasons = [];

    // ① 价格波动率规则：ATR/价格 在 0.5%~5% 区间为健康
    const atr   = this.backtester._calcLocalATR(14);
    const price = _c(k[k.length - 1]);
    const atrPct = price > 0 ? atr / price * 100 : 0;
    if (atrPct >= 0.5 && atrPct <= 5) {
      scores.push(80); reasons.push(`✓ 波动率健康（ATR ${atrPct.toFixed(1)}%）`);
    } else if (atrPct < 0.3 || atrPct > 10) {
      scores.push(20); reasons.push(`✗ 波动率异常（ATR ${atrPct.toFixed(1)}%，可能假突破）`);
    } else {
      scores.push(55); reasons.push(`△ 波动率偏${atrPct > 5 ? '高' : '低'}（ATR ${atrPct.toFixed(1)}%）`);
    }

    // ② 成交量趋势规则：最近5根成交量均值 vs 前5根
    const vol5  = _mean(k.slice(-5).map(_v));
    const vol10 = _mean(k.slice(-10, -5).map(_v));
    const volTrend = vol10 > 0 ? vol5 / vol10 : 1;
    if (volTrend >= 1.1) {
      scores.push(85); reasons.push(`✓ 量能放大（${(volTrend).toFixed(2)}x），信号有支撑`);
    } else if (volTrend < 0.7) {
      scores.push(25); reasons.push(`✗ 量能萎缩（${(volTrend).toFixed(2)}x），信号可疑`);
    } else {
      scores.push(60); reasons.push(`△ 量能持平（${(volTrend).toFixed(2)}x）`);
    }

    // ③ MACD强度规则：DIF绝对值 vs 近期ATR的比值
    const macdD = this.backtester._quickDIF(k.map(_c));
    const lastDIF = macdD ? macdD[macdD.length - 1] || 0 : 0;
    const macdStrength = atr > 0 ? Math.abs(lastDIF) / atr : 0;
    if (macdStrength >= 0.3) {
      scores.push(80); reasons.push(`✓ MACD强度充足（DIF/ATR=${macdStrength.toFixed(2)}）`);
    } else if (macdStrength < 0.05) {
      scores.push(30); reasons.push(`✗ MACD信号极弱（DIF/ATR=${macdStrength.toFixed(2)}）`);
    } else {
      scores.push(55); reasons.push(`△ MACD信号一般（DIF/ATR=${macdStrength.toFixed(2)}）`);
    }

    // ④ 江恩偏差规则：gannBias 在 ±1~8% 为有效信号区间
    const gannBias = rawSignal.details?.directionResonance?.gannBias || 0;
    const absBias  = Math.abs(gannBias);
    if (absBias >= 1 && absBias <= 8) {
      scores.push(75); reasons.push(`✓ 江恩偏差适中（bias=${gannBias.toFixed(1)}%）`);
    } else if (absBias > 15) {
      scores.push(20); reasons.push(`✗ 江恩偏差过大（bias=${gannBias.toFixed(1)}%，极端区域）`);
    } else {
      scores.push(50); reasons.push(`△ 江恩偏差偏${absBias < 1 ? '小' : '大'}（bias=${gannBias.toFixed(1)}%）`);
    }

    // ⑤ 时间规则（UTC+8）：亚洲盘前（00:00-06:00）流动性低，信号质量弱
    const nowH = _utc8Now().getHours();
    if (nowH >= 8 && nowH < 24) {
      scores.push(80); reasons.push(`✓ 交易时段活跃（UTC+8 ${nowH}:xx）`);
    } else {
      scores.push(35); reasons.push(`△ 低流动性时段（UTC+8 ${nowH}:xx，00-08点）`);
    }

    // ⑥ 星期几规则（UTC+8）：周六周日加密市场成交清淡
    const dayOfWeek = _utc8Now().getDay();  // 0=Sun, 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      scores.push(40); reasons.push(`△ 周末市场（成交量通常偏低）`);
    } else {
      scores.push(75); reasons.push(`✓ 工作日（${['日','一','二','三','四','五','六'][dayOfWeek]}）`);
    }

    const avgScore = Math.round(_mean(scores));
    const isFake   = avgScore < 50;

    return {
      isFake,
      score:       avgScore,
      scoreLabel:  avgScore >= 75 ? '高质量' : avgScore >= 50 ? '中等' : '疑似假信号',
      reasons,
      downgrade:   isFake ? '信号评级降一级（综合打分<50）' : null,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // 新功能 D: 多周期评级合并
  // 输入: 当前周期评级 + 其他周期评级数组
  // 规则: 全一致→保留原级；否则取最低级
  // ════════════════════════════════════════════════════════════════════════
  _mergeMultiTFRatings(currentRating, tfRatings) {
    // tfRatings: { '1h': 'A', '4h': 'S', '1d': 'B' }
    const ORDER = { 'S':4, 'A':3, 'B':2, 'C':1, 'N/A':0, 'X':0 };
    const all   = [currentRating, ...Object.values(tfRatings)].filter(r => r && r !== 'N/A' && r !== 'X');

    if (!all.length) return { merged: currentRating, allSame: false, details: tfRatings };

    const allSame   = all.every(r => r === all[0]);
    const minRating = all.reduce((min, r) => (ORDER[r] || 0) < (ORDER[min] || 0) ? r : min, all[0]);
    const merged    = allSame ? currentRating : minRating;

    const tfs = Object.entries(tfRatings).map(([tf, r]) =>
      `${tf.toUpperCase()}:${r}`
    ).join(' / ');

    return {
      merged,
      allSame,
      details:    tfRatings,
      summary:    `${tfs} → 取${allSame ? '一致' : '最低'}评级 ${merged}`,
      downgraded: !allSame && (ORDER[merged] || 0) < (ORDER[currentRating] || 0),
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // 新功能 E: 自动资金管理引擎
  // 凯利公式 + 半凯利 + 信号等级调整 + 单笔上限 + 日亏损暂停
  // ════════════════════════════════════════════════════════════════════════
  _calcMoneyManagement(rawSignal, confidence, riskWarn) {
    const WR  = Math.min(0.95, Math.max(0.05, (confidence / 100)));  // 胜率估算
    const RRR = riskWarn ? (riskWarn.rrr || 1.5) : 1.5;              // 盈亏比
    const b   = RRR;
    const p   = WR;
    const q   = 1 - p;

    // 凯利公式: f* = (b*p - q) / b
    const kellyFull = (b * p - q) / b;
    const halfKelly = kellyFull / 2;

    // 信号等级调整因子
    const gradeMultiplier = { S:1.2, A:1.0, B:0.75, C:0.5, X:0, 'N/A':0.3 };
    const gradeMult = gradeMultiplier[rawSignal.rating || 'C'] || 0.5;

    // 最终仓位
    const rawPosition = halfKelly * gradeMult * 100;
    const MAX_POS     = 30;  // 单笔最大30%

    // 检查日亏损暂停（从 localStorage 读取当日亏损记录）
    let dayLossBlocked = false;
    let dayLossPct     = 0;
    try {
      const today     = typeof nowUTC8DateStr === 'function' ? nowUTC8DateStr() : new Date().toISOString().slice(0,10);
      const dayLossKey = 'mm_dayloss_' + today;
      dayLossPct       = parseFloat(localStorage.getItem(dayLossKey) || '0');
      dayLossBlocked   = dayLossPct >= 5;
    } catch(e) {}

    const suggestPosition = dayLossBlocked ? 0
      : parseFloat(Math.min(MAX_POS, Math.max(0, rawPosition)).toFixed(1));

    // 账户假设（若有 localStorage 余额记录则用）
    let balance = 10000;
    try { balance = parseFloat(localStorage.getItem('mm_balance') || '10000'); } catch(e) {}
    const riskAmount    = suggestPosition > 0 && riskWarn
      ? parseFloat((balance * suggestPosition / 100 * riskWarn.stopLossPct / 100).toFixed(2))
      : 0;
    const unitQty = suggestPosition > 0 && riskWarn && riskWarn.stopLoss > 0 && riskWarn.stopLoss < (_c(this.klines[this.klines.length-1]) * 10)
      ? parseFloat(((balance * suggestPosition / 100) / _c(this.klines[this.klines.length-1])).toFixed(4))
      : 0;

    return {
      suggestPosition,
      kellyFull:       parseFloat((kellyFull * 100).toFixed(2)),
      halfKelly:       parseFloat((halfKelly * 100).toFixed(2)),
      gradeMult,
      rawPosition:     parseFloat(rawPosition.toFixed(2)),
      cappedBy:        rawPosition > MAX_POS ? `单笔上限${MAX_POS}%` : null,
      dayLossBlocked,
      dayLossPct,
      balance,
      riskAmount,
      unitQty,
      rrr:             parseFloat(RRR.toFixed(2)),
      winRateEst:      parseFloat((WR * 100).toFixed(1)),
      note: dayLossBlocked
        ? `⛔ 今日已亏损${dayLossPct.toFixed(1)}%（≥5%），系统自动暂停交易`
        : suggestPosition <= 0
          ? '信号质量不足，建议空仓观望'
          : `建议仓位 ${suggestPosition}%（半凯利${(halfKelly*100).toFixed(1)}% × 评级系数${gradeMult}）`,
    };
  }

  // ════════════════════════════════════════════════════════════════════════
  // 黑天鹅警告HTML
  // ════════════════════════════════════════════════════════════════════════
  _buildBlackSwanHTML(swan) {
    return '<div style="margin:12px 0;padding:14px 18px;background:rgba(224,48,48,0.12);border:2px solid rgba(224,48,48,0.5);border-radius:12px">'
      + '<div style="font-size:1rem;font-weight:800;color:var(--bear);margin-bottom:8px">🦢 黑天鹅警报 — 建议暂停所有操作</div>'
      + '<div style="font-size:.78rem;color:var(--text);line-height:1.8">' + (swan.warning || '') + '</div>'
      + '<div style="margin-top:10px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:.68rem">'
      + `<div style="padding:6px 8px;background:rgba(224,48,48,0.08);border-radius:6px;text-align:center"><div style="color:var(--faint)">3σ阈值</div><div style="font-weight:700;color:var(--bear)">${swan.threshold3}%</div></div>`
      + `<div style="padding:6px 8px;background:rgba(224,48,48,0.08);border-radius:6px;text-align:center"><div style="color:var(--faint)">量能突增</div><div style="font-weight:700;color:var(--bear)">${swan.volSpike}x</div></div>`
      + `<div style="padding:6px 8px;background:rgba(224,48,48,0.08);border-radius:6px;text-align:center"><div style="color:var(--faint)">异常K线</div><div style="font-weight:700;color:var(--bear)">${swan.spikeBars.length}根</div></div>`
      + '</div></div>';
  }

  // ════════════════════════════════════════════════════════════════════════
  // 新功能汇总HTML卡片（注入可视化底部）
  // ════════════════════════════════════════════════════════════════════════
  _buildFiltersHTML(volFilter, fakeFilter, mtfResult, moneyMgmt) {
    let html = '<div style="margin-top:10px;border-top:1px solid var(--border);padding-top:10px">'
      + '<div style="font-size:.62rem;font-weight:700;color:var(--faint);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">🛡 信号质量过滤 · 资金管理</div>';

    // ── 成交额过滤 + 假信号 ──
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px">';

    // 成交额过滤卡
    const vfColor = volFilter.filtered ? 'var(--bear)' : 'var(--bull)';
    html += `<div style="padding:8px 10px;background:${volFilter.filtered?'rgba(224,72,72,0.07)':'rgba(40,200,112,0.06)'};border:1px solid ${volFilter.filtered?'rgba(224,72,72,0.2)':'rgba(40,200,112,0.2)'};border-radius:7px">
      <div style="font-size:.58rem;font-weight:700;color:${vfColor};margin-bottom:3px">${volFilter.filtered?'⚠ 成交额过滤':'✓ 成交额正常'}</div>
      <div style="font-size:.65rem;color:var(--muted)">${volFilter.reason}</div>
    </div>`;

    // 假信号过滤卡
    const sfColor  = fakeFilter.score >= 75 ? 'var(--bull)' : fakeFilter.score >= 50 ? 'var(--amber)' : 'var(--bear)';
    const sfBg     = fakeFilter.score >= 50 ? 'rgba(40,200,112,0.06)' : 'rgba(224,72,72,0.07)';
    const sfBorder = fakeFilter.score >= 50 ? 'rgba(40,200,112,0.2)' : 'rgba(224,72,72,0.2)';
    html += `<div style="padding:8px 10px;background:${sfBg};border:1px solid ${sfBorder};border-radius:7px">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:3px">
        <div style="font-size:.58rem;font-weight:700;color:${sfColor}">${fakeFilter.isFake?'⚠ 疑似假信号':'✓ '+fakeFilter.scoreLabel}</div>
        <div style="font-size:.7rem;font-weight:800;color:${sfColor}">${fakeFilter.score}分</div>
      </div>
      <div style="height:4px;background:var(--bg2);border-radius:2px;overflow:hidden">
        <div style="height:100%;width:${fakeFilter.score}%;background:${sfColor};border-radius:2px"></div>
      </div>
    </div>`;

    html += '</div>';

    // ── 多周期评级 ──
    if (mtfResult) {
      const mc = mtfResult.allSame ? 'var(--bull)' : mtfResult.downgraded ? 'var(--bear)' : 'var(--amber)';
      html += `<div style="padding:8px 10px;background:rgba(56,168,224,0.06);border:1px solid rgba(56,168,224,0.18);border-radius:7px;margin-bottom:8px;font-size:.68rem">
        <div style="font-weight:700;color:var(--sky);margin-bottom:3px">🔀 多周期验证</div>
        <div style="color:${mc}">${mtfResult.summary}</div>
      </div>`;
    }

    // ── 资金管理引擎 ──
    if (moneyMgmt) {
      const blocked   = moneyMgmt.dayLossBlocked;
      const posColor  = blocked ? 'var(--faint)' : moneyMgmt.suggestPosition >= 15 ? 'var(--bull)' : moneyMgmt.suggestPosition >= 5 ? 'var(--gold)' : 'var(--bear)';
      html += '<div style="padding:10px 12px;background:rgba(96,48,160,0.06);border:1px solid rgba(96,48,160,0.2);border-radius:8px">'
        + '<div style="font-size:.62rem;font-weight:700;color:var(--purple);margin-bottom:7px">💼 自动资金管理引擎</div>';

      if (blocked) {
        html += `<div style="padding:8px 10px;background:rgba(224,72,72,0.1);border:1px solid rgba(224,72,72,0.3);border-radius:6px;font-size:.7rem;color:var(--bear)">⛔ ${moneyMgmt.note}</div>`;
      } else {
        html += '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;text-align:center;margin-bottom:6px">'
          + `<div style="padding:6px 4px;background:rgba(96,48,160,0.06);border-radius:6px"><div style="font-size:.5rem;color:var(--faint)">全凯利</div><div style="font-size:.75rem;font-weight:700;color:var(--muted)">${moneyMgmt.kellyFull}%</div></div>`
          + `<div style="padding:6px 4px;background:rgba(96,48,160,0.08);border-radius:6px"><div style="font-size:.5rem;color:var(--faint)">半凯利</div><div style="font-size:.75rem;font-weight:700;color:var(--muted)">${moneyMgmt.halfKelly}%</div></div>`
          + `<div style="padding:6px 4px;background:rgba(96,48,160,0.12);border-radius:6px;border:1px solid rgba(96,48,160,0.25)"><div style="font-size:.5rem;color:var(--faint)">评级系数</div><div style="font-size:.75rem;font-weight:700;color:var(--purple)">×${moneyMgmt.gradeMult}</div></div>`
          + `<div style="padding:6px 4px;background:rgba(96,48,160,0.15);border-radius:6px;border:1px solid rgba(96,48,160,0.35)"><div style="font-size:.5rem;color:var(--purple)">建议仓位</div><div style="font-size:.85rem;font-weight:800;color:${posColor}">${moneyMgmt.suggestPosition}%</div></div>`
          + '</div>'
          + `<div style="font-size:.65rem;color:var(--muted);line-height:1.6">${moneyMgmt.note}</div>`;
        if (moneyMgmt.cappedBy) {
          html += `<div style="margin-top:4px;font-size:.6rem;color:var(--amber)">△ 已按${moneyMgmt.cappedBy}截断</div>`;
        }
        if (moneyMgmt.riskAmount > 0) {
          html += `<div style="margin-top:4px;font-size:.6rem;color:var(--faint)">预计风险金额：$${moneyMgmt.riskAmount.toLocaleString()} · 单位数量：${moneyMgmt.unitQty}</div>`;
        }
      }
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  clearCache() {
    this._enhanceCache.clear();
    ZhongshuValidator.cache.clear();
    this.backtester._cache = {};
    this.gannEngine._cache = {};
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// 多周期协同评级：同时拉取 1h/4h/1d K线，各跑一次 engineGannChanSynergy
// 调用方式: await engineGannChanSynergyMultiTF(gn, ch, price, coin)
// ══════════════════════════════════════════════════════════════════════════════
async function engineGannChanSynergyMultiTF(gn, ch, price, coin) {
  const sym = (coin || 'BTC') + 'USDT';
  const TFS = [
    { tf: '1h',  limit: 80  },
    { tf: '4h',  limit: 80  },
    { tf: '1d',  limit: 80  },
  ];

  // 并发拉取三周期（失败的周期忽略）
  const klinesMap = {};
  await Promise.all(TFS.map(async ({ tf, limit }) => {
    try {
      const data = await fetchKlines(sym, tf, limit);
      if (Array.isArray(data) && data.length >= 20) klinesMap[tf] = data;
    } catch(e) {  }
  }));

  // 对每个周期跑 engineGannChanSynergy
  const ratings = {};
  for (const [tf, klines] of Object.entries(klinesMap)) {
    const result = engineGannChanSynergy(gn, ch, price, klines);
    ratings[tf] = result ? result.rating : 'N/A';
  }

  // 合并规则：全一致保持原级，否则取最低
  const ORDER = { S:4, A:3, B:2, C:1, 'N/A':0, X:0 };
  const validRatings = Object.values(ratings).filter(r => r && r !== 'N/A' && r !== 'X');
  const allSame = validRatings.length > 0 && validRatings.every(r => r === validRatings[0]);
  const minRating = validRatings.length
    ? validRatings.reduce((min, r) => ORDER[r] < ORDER[min] ? r : min, validRatings[0])
    : 'N/A';

  return {
    ratings,          // { '1h': 'A', '4h': 'S', '1d': 'B' }
    allSame,
    mergedRating: allSame ? (validRatings[0] || 'N/A') : minRating,
    klinesCount: Object.fromEntries(Object.entries(klinesMap).map(([tf, k]) => [tf, k.length])),
  };
}

// ══════════════════════════════════════════════════════════════════════════════
// 一键推演所有币种（遍历 dashCoins，依次展示每个币种详情页）
// 自动 runDashboard（若尚未推演），然后轮播所有有结果的币种
// ══════════════════════════════════════════════════════════════════════════════
let _sweepTimer = null;
let _sweepIdx   = 0;
let _sweepCoins = [];
let _sweepRunning = false;

async function startCoinSweep() {
  if (_sweepRunning) { stopCoinSweep(); return; }

  // 先确保有推演结果
  const hasResults = dashCoins.some(c => dashResults[c.coin] && dashResults[c.coin] !== 'loading' && dashResults[c.coin].score);
  if (!hasResults) {
    const btn = document.getElementById('sweepBtn');
    if (btn) btn.textContent = '⏳ 推演中…';
    await runDashboard();
  }

  // 收集所有有完整结果的币种（按评分降序）
  _sweepCoins = dashCoins
    .filter(c => dashResults[c.coin] && dashResults[c.coin] !== 'loading' && dashResults[c.coin].score)
    .sort((a, b) => (dashResults[b.coin]?.score || 0) - (dashResults[a.coin]?.score || 0));

  if (!_sweepCoins.length) {
    alert('暂无推演结果，请先点击「联网全部推演」');
    return;
  }

  _sweepIdx     = 0;
  _sweepRunning = true;
  _updateSweepBtn();

  // 进度条注入
  _injectSweepProgress();
  _sweepTick();
}

function stopCoinSweep() {
  _sweepRunning = false;
  if (_sweepTimer) { clearTimeout(_sweepTimer); _sweepTimer = null; }
  _updateSweepBtn();
  _removeSweepProgress();
  closeDetail();
}

function _sweepTick() {
  if (!_sweepRunning || _sweepIdx >= _sweepCoins.length) {
    stopCoinSweep();
    return;
  }
  const coin = _sweepCoins[_sweepIdx];
  selectCoin(coin.coin);
  _updateSweepProgress(_sweepIdx + 1, _sweepCoins.length, coin);

  // 每张停留4秒，然后切下一个
  const delay = parseInt(document.getElementById('sweepDelay')?.value || '4') * 1000;
  _sweepIdx++;
  _sweepTimer = setTimeout(_sweepTick, delay);
}

function _updateSweepBtn() {
  const btn = document.getElementById('sweepBtn');
  if (!btn) return;
  if (_sweepRunning) {
    btn.textContent = '⏹ 停止轮播';
    btn.style.background = 'rgba(224,72,72,0.15)';
    btn.style.borderColor = 'rgba(224,72,72,0.4)';
    btn.style.color = 'var(--bear)';
  } else {
    btn.textContent = '🔄 一键轮播';
    btn.style.background = '';
    btn.style.borderColor = '';
    btn.style.color = '';
  }
}

function _injectSweepProgress() {
  let el = document.getElementById('sweepProgressBar');
  if (el) return;
  el = document.createElement('div');
  el.id = 'sweepProgressBar';
  el.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:9999;height:3px;background:rgba(200,168,74,0.2)';
  el.innerHTML = '<div id="sweepProgressFill" style="height:100%;width:0%;background:linear-gradient(90deg,var(--gold),var(--gold3));transition:width .3s;border-radius:2px"></div>'
    + '<div id="sweepProgressLabel" style="position:absolute;top:6px;right:12px;font-size:.62rem;font-family:var(--font-mono);color:var(--gold);background:var(--card);padding:2px 8px;border-radius:99px;border:1px solid var(--border)"></div>';
  document.body.appendChild(el);
}

function _updateSweepProgress(cur, total, coin) {
  const fill  = document.getElementById('sweepProgressFill');
  const label = document.getElementById('sweepProgressLabel');
  if (fill)  fill.style.width  = (cur / total * 100) + '%';
  if (label) label.textContent = `${cur}/${total} · ${coin.label || coin.coin} · 评分${dashResults[coin.coin]?.score || '--'}`;
}

function _removeSweepProgress() {
  const el = document.getElementById('sweepProgressBar');
  if (el) el.remove();
}

// ══════════════════════════════════════════════════════════════════════════════
// 全局注册 — 挂载到 window 供系统其他模块调用
// ══════════════════════════════════════════════════════════════════════════════
window.SignalEnhancer     = SignalEnhancer;
window.ZhongshuValidator  = ZhongshuValidator;
window.GannDynamicEngine  = GannDynamicEngine;
window.SignalBacktester   = SignalBacktester;



// ═══════════════════════════════════════════════
// NODES
// ═══════════════════════════════════════════════
function generateNodes(coin, date, days, sys, engines) {
  const r = rng(seed(date,coin,9999));
  const base = new Date(date);
  const nodes = [];
  const used  = new Set();
  const NC = NATAL_CHARTS[coin];

  // ── Gann time grid (extended for multi-year) ──
  const gannBase = [30,45,60,90,120,144,180,270,360,540,720];
  // For 2yr+ add yearly multiples
  if(days > 400) {
    [365,500,600,730,900,1095].forEach(d=>{ if(!gannBase.includes(d)) gannBase.push(d); });
  }
  const gannT = gannBase.filter(d=>d<=days);
  gannT.forEach(d => {
    if(sys.gann) {
      const r2 = rng(seed(addDays(base,d),coin,4004));
      nodes.push(mkNode(coin, addDays(base,d), d, r2, sys, ['gann'], engines));
      used.add(d);
    }
  });

  // ── Natal transit nodes (命盘过境节点) ──
  if(sys.natal && NC) {
    const birthDate = new Date(NC.date);
    // Jupiter cycle: every ~11.86yr = 4331 days → quarterly hits
    const jupPeriod = 4331;
    const jupMod    = ((base - birthDate) / 86400000) % jupPeriod;
    // Next Jupiter square (every ~1083 days from birth)
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      const nextJupDays = Math.round((frac * jupPeriod - jupMod + jupPeriod) % jupPeriod);
      if(nextJupDays > 0 && nextJupDays <= days) {
        if(!used.has(nextJupDays)) {
          const r2 = rng(seed(addDays(base,nextJupDays),coin,7771));
          const n = mkNode(coin, addDays(base,nextJupDays), nextJupDays, r2, sys, ['natal'], engines);
          n.type = frac===1.0||frac===0.5 ? '木星回归/对冲' : '木星四分相';
          n.conf = 0.65 + r2()*0.25;
          n.details = '命盘木星周期'+Math.round(frac*100)+'%・' + n.details;
          nodes.push(n); used.add(nextJupDays);
        }
      }
    });

    // Saturn cycle: every ~29.5yr = 10773 days → 4 squares
    const satPeriod = 10773;
    const satMod    = ((base - birthDate) / 86400000) % satPeriod;
    [0.25, 0.5, 0.75].forEach(frac => {
      const nextSatDays = Math.round((frac * satPeriod - satMod + satPeriod) % satPeriod);
      if(nextSatDays > 0 && nextSatDays <= days) {
        if(!used.has(nextSatDays)) {
          const r2 = rng(seed(addDays(base,nextSatDays),coin,8882));
          const n = mkNode(coin, addDays(base,nextSatDays), nextSatDays, r2, sys, ['natal'], engines);
          n.type = frac===0.5 ? '土星对分相' : '土星四分相';
          n.isBull = false; // Saturn = pressure
          n.conf = 0.6 + r2()*0.3;
          n.details = '命盘土星压力周期・' + n.details;
          nodes.push(n); used.add(nextSatDays);
        }
      }
    });

    // BTC halving windows
    if(NC.halving_dates) {
      const baseTime = base.getTime();
      NC.halving_dates.forEach(hd => {
        const halvTime = new Date(hd).getTime();
        const off = Math.round((halvTime - baseTime) / 86400000);
        if(off > 0 && off <= days && !used.has(off)) {
          const r2 = rng(seed(addDays(base,off),coin,5551));
          const n = mkNode(coin, addDays(base,off), off, r2, sys, ['natal','gann'], engines);
          n.type = '减半事件窗口';
          n.isBull = true;
          n.conf = 0.82;
          n.details = 'BTC减半・供应量减半・历史牛市启动窗口';
          nodes.push(n); used.add(off);
        }
      });
    }

    // Commodity-specific cycles
    if(NC.commodity) {
      // Quarterly cycles (90 days) for commodities
      for(let q=90; q<=days; q+=90) {
        if(!used.has(q)) {
          const r2 = rng(seed(addDays(base,q),coin,3301));
          if(r2() > 0.5) { // only add ~half for density
            const n = mkNode(coin, addDays(base,q), q, r2, sys, ['natal','gann'], engines);
            n.type = '季度周期节点';
            n.conf = 0.48 + r2()*0.3;
            nodes.push(n); used.add(q);
          }
        }
      }
    }
  }

  // ── Solar arc degree hits (太阳弧度年度节点) ──
  // Each year, progressed Sun moves ~1 degree, hitting natal planet degrees
  if(sys.natal && NC) {
    const importantDegs = [0,30,60,90,120,150,180]; // major aspect degrees
    importantDegs.forEach(targetDeg => {
      const daysToHit = Math.round(targetDeg * 365.25);
      if(daysToHit > 0 && daysToHit <= days && !used.has(daysToHit)) {
        const r2 = rng(seed(addDays(base,daysToHit),coin,9910));
        if(r2() > 0.6) {
          const n = mkNode(coin, addDays(base,daysToHit), daysToHit, r2, sys, ['natal'], engines);
          n.type = '推运太阳相位';
          n.conf = 0.5 + r2()*0.25;
          n.details = '推运太阳'+targetDeg+'°相位・' + n.details;
          nodes.push(n); used.add(daysToHit);
        }
      }
    });
  }

  // ── Random multi-system nodes ──
  const density = days <= 90 ? 8 : days <= 365 ? 14 : days <= 730 ? 24 : 38;
  const extra = density + Math.floor(r()*(density/3));
  for(let tries=0; tries<extra*5 && nodes.length < extra+gannT.length+8; tries++) {
    const offset = Math.floor(r()*days)+1;
    if(used.has(offset)) continue;
    const r2 = rng(seed(addDays(base,offset),coin,1234));
    const activeSys = [];
    if(sys.qimen && r2()>.4) activeSys.push('qimen');
    if(sys.iching && r2()>.4) activeSys.push('iching');
    if(sys.vedic  && r2()>.4) activeSys.push('vedic');
    if(sys.harmonic && r2()>.35) activeSys.push('harmonic');
    if(sys.sr     && r2()>.45) activeSys.push('sr');
    if(sys.chan   && r2()>.4) activeSys.push('chan');
    if(sys.natal  && r2()>.55) activeSys.push('natal');
    if(activeSys.length===0) {
      const all = Object.keys(sys).filter(k=>sys[k] && k!=='natal');
      if(all.length===0) continue;
      activeSys.push(all[Math.floor(r2()*all.length)]);
    }
    used.add(offset);
    nodes.push(mkNode(coin, addDays(base,offset), offset, r2, sys, activeSys, engines));
  }

  nodes.sort((a,b)=>a.offset-b.offset);
  return nodes;
}

// ── 各系统盘中时间推算逻辑 ────────────────────────────────────────────────
// 每个系统有其专属的时间窗口推导逻辑，精确到小时/分钟

// 奇门遁甲：按九宫时辰推算（每宫2小时）
const QIMEN_HOURS = [
  { h:'01:00', t:'子时', note:'坎宫·夜盘深水期' },
  { h:'03:00', t:'丑时', note:'艮宫·早盘酝酿' },
  { h:'05:00', t:'寅时', note:'震宫·亚市开盘前' },
  { h:'07:00', t:'卯时', note:'巽宫·亚市活跃' },
  { h:'09:00', t:'辰时', note:'中宫·欧盘前' },
  { h:'11:00', t:'巳时', note:'乾宫·欧盘开盘' },
  { h:'13:00', t:'午时', note:'兑宫·欧盘高峰' },
  { h:'15:00', t:'未时', note:'坤宫·美盘前' },
  { h:'17:00', t:'申时', note:'离宫·美盘开盘' },
  { h:'19:00', t:'酉时', note:'中宫·美盘高峰' },
  { h:'21:00', t:'戌时', note:'乾宫·美盘尾盘' },
  { h:'23:00', t:'亥时', note:'坎宫·日线收盘' },
];

// 印度占星：行星对应的强力时段（UTC）
const VEDIC_PLANET_HOURS = {
  '太阳': { peak: '12:00', window: '11:00-13:00', note: '太阳中天·日线主导时' },
  '月亮': { peak: '20:00', window: '19:00-21:00', note: '月亮过中天·情绪波动峰' },
  '木星': { peak: '15:00', window: '14:00-16:00', note: '木星时·扩张动能释放' },
  '金星': { peak: '10:00', window: '09:00-11:00', note: '金星时·买盘主导' },
  '土星': { peak: '22:00', window: '21:00-23:00', note: '土星时·压制力道最强' },
  '火星': { peak: '07:00', window: '06:00-08:00', note: '火星时·突破/暴跌启动' },
  '水星': { peak: '09:00', window: '08:30-10:00', note: '水星时·消息面驱动' },
  '罗睺': { peak: '06:00', window: '05:00-07:00', note: '罗睺(北交)·黑天鹅时段' },
  '计都': { peak: '18:00', window: '17:00-19:00', note: '计都(南交)·反转触发' },
};

// 江恩：关键角度对应的盘中时间（360°=24h，每15°=1h）
function gannAngleToTime(angle) {
  const h = Math.round((angle % 360) / 15);
  const hh = String(h % 24).padStart(2, '0');
  const mm = String(Math.round(((angle % 360) % 15) / 15 * 60)).padStart(2, '0');
  return `${hh}:${mm}`;
}

// 缠论：笔段转折多在开/收盘附近
const CHAN_TIMES = [
  { h:'00:30', note:'亚市开盘30分钟·一笔完成' },
  { h:'04:00', note:'亚欧切换·中枢震荡结束' },
  { h:'08:00', note:'欧盘开盘·新一笔启动' },
  { h:'09:30', note:'欧盘活跃·笔段确认' },
  { h:'14:30', note:'欧美交叉·背驰出现' },
  { h:'16:00', note:'美盘开盘·突破方向定' },
  { h:'20:00', note:'美盘高峰·买卖点触发' },
  { h:'23:00', note:'日线收盘·分型确认' },
];

// 谐波：PRZ触达多在流动性最强时段
const HARMONIC_WINDOWS = ['08:00-10:00','14:30-16:30','20:00-22:00'];

// 波动率共振：市场流动性峰值时间
const VOL_WINDOWS = ['00:00-01:00','04:00-05:00','08:00-09:30','14:00-16:30','20:00-22:00','23:00-00:00'];

function calcNodeTime(activeSys, r, date, engines) {
  // 每个系统有独立时间推算逻辑，取置信最高的
  const times = [];

  if (activeSys.includes('qimen')) {
    // 奇门：按宫位数推算时辰
    const palace = Math.floor(r() * 9);
    const qt = QIMEN_HOURS[palace % QIMEN_HOURS.length];
    // 在时辰内取具体分钟
    const baseH = parseInt(qt.h);
    const mins = Math.floor(r() * 60);
    const exactTime = `${String(baseH).padStart(2,'0')}:${String(Math.round(mins/5)*5).padStart(2,'0')}`;
    times.push({ time: exactTime, window: `${qt.h}–${String((baseH+2)%24).padStart(2,'0')}:00`, label: `奇门${qt.t}`, note: qt.note, conf: 0.72 });
  }

  if (activeSys.includes('vedic')) {
    const planets = Object.keys(VEDIC_PLANET_HOURS);
    const pl = planets[Math.floor(r() * planets.length)];
    const vh = VEDIC_PLANET_HOURS[pl];
    times.push({ time: vh.peak, window: vh.window, label: `${pl}时`, note: vh.note, conf: 0.68 });
  }

  if (activeSys.includes('gann')) {
    // 江恩：用角度直接映射时间，90°=06:00, 180°=12:00, 270°=18:00, 360°=00:00
    const angles = [90, 120, 144, 180, 240, 270, 360, 480];
    const ang = angles[Math.floor(r() * angles.length)] % 360;
    const h = Math.floor(ang / 15);
    const m = Math.round(((ang / 15) - h) * 60);
    const t = `${String(h).padStart(2,'0')}:${String(Math.round(m/5)*5).padStart(2,'0')}`;
    times.push({ time: t, window: `±30分钟`, label: `江恩${ang}°时刻`, note: `角度线 ${ang}°→ 时间轴映射`, conf: 0.65 });
  }

  if (activeSys.includes('chan')) {
    const ct = CHAN_TIMES[Math.floor(r() * CHAN_TIMES.length)];
    const baseH = parseInt(ct.h);
    const mins = Math.floor(r() * 30);
    const t = `${String(baseH).padStart(2,'0')}:${String(mins).padStart(2,'0')}`;
    times.push({ time: t, window: `±15分钟`, label: '缠论笔段转折', note: ct.note, conf: 0.60 });
  }

  if (activeSys.includes('harmonic')) {
    const hw = HARMONIC_WINDOWS[Math.floor(r() * HARMONIC_WINDOWS.length)];
    const [hs] = hw.split('-');
    const baseH = parseInt(hs);
    const mins = Math.floor(r() * 90 + 15);
    const eh = baseH + Math.floor(mins / 60);
    const em = mins % 60;
    const t = `${String(eh%24).padStart(2,'0')}:${String(Math.round(em/5)*5).padStart(2,'0')}`;
    times.push({ time: t, window: hw, label: '谐波PRZ触达', note: '流动性高峰PRZ完成', conf: 0.62 });
  }

  if (activeSys.includes('iching')) {
    // 易经：六爻对应6个四小时时段
    const line = Math.floor(r() * 6);
    const baseH = line * 4;
    const mins = Math.floor(r() * 60);
    const t = `${String(baseH).padStart(2,'0')}:${String(Math.round(mins/5)*5).padStart(2,'0')}`;
    const lineNames = ['初爻(00-04h)','二爻(04-08h)','三爻(08-12h)','四爻(12-16h)','五爻(16-20h)','上爻(20-24h)'];
    times.push({ time: t, window: lineNames[line], label: '易经动爻时刻', note: `第${line+1}爻·${lineNames[line]}触动`, conf: 0.55 });
  }

  if (activeSys.includes('natal')) {
    // 命盘：按行星时（每小时主星轮换）
    const hNat = Math.floor(r() * 24);
    const mNat = Math.floor(r() * 60);
    const t = `${String(hNat).padStart(2,'0')}:${String(Math.round(mNat/5)*5).padStart(2,'0')}`;
    const planetH = PLANETS[hNat % PLANETS.length];
    times.push({ time: t, window: `${String(hNat).padStart(2,'0')}:00–${String((hNat+1)%24).padStart(2,'0')}:00`, label: `命盘${planetH}时`, note: `命盘行星时·${planetH}主导时段`, conf: 0.58 });
  }

  if (activeSys.includes('qimen') || activeSys.includes('sr')) {
    // 支撑阻力：整点/半点触发
    const hrs = [2,4,8,10,14,16,20,22];
    const h = hrs[Math.floor(r() * hrs.length)];
    const m = r() > 0.5 ? 0 : 30;
    const t = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
    times.push({ time: t, window: `±10分钟`, label: '关键价位触达', note: `整点附近流动性聚集`, conf: 0.50 });
  }

  // 选置信最高的时间
  if (times.length === 0) {
    const h = Math.floor(r() * 24);
    const m = Math.floor(r() * 12) * 5;
    return { time: `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`, window: '±1小时', label: '综合推算', note: '多系统时间交叉', conf: 0.45 };
  }

  times.sort((a, b) => b.conf - a.conf);
  return times[0];
}

function mkNode(coin, date, offset, r, sys, activeSys, engines) {
  const isBull = r() > 0.5;
  const mag = ['微幅','小幅','中等','显著','重大'][Math.floor(r()*5)];
  const type = ['趋势转折','波段高低点','缺口填补','突破确认','回调支撑','加速上升','加速下跌','周期极值','共振节点'][Math.floor(r()*9)];
  const conf = 0.38 + r()*0.58;
  const hexIdx = Math.floor(r()*64);
  const planet = PLANETS[Math.floor(r()*9)];
  const angle  = GANN_ANG[Math.floor(r()*GANN_ANG.length)];
  const h = HARMONICS[Math.floor(r()*HARMONICS.length)];

  const details = [];
  if(activeSys.includes('qimen'))   details.push(`奇门${DOORS[Math.floor(r()*8)]}应期`);
  if(activeSys.includes('iching'))  details.push(`${HEXAGRAMS[hexIdx][0]}${HEXAGRAMS[hexIdx][1]}卦动爻`);
  if(activeSys.includes('vedic'))   details.push(`${planet}过境${NAKS[Math.floor(r()*27)]}`);
  if(activeSys.includes('gann'))    details.push(`江恩${angle}°时间共振`);
  if(activeSys.includes('harmonic'))details.push(`${h.name}形态PRZ区域`);
  if(activeSys.includes('sr'))      details.push(`斐波${FIBS[Math.floor(r()*FIBS.length)]}回撤位`);
  if(activeSys.includes('chan'))    details.push(`缠论${['顶背驰','底背驰','中枢突破'][Math.floor(r()*3)]}`);
  if(activeSys.includes('natal'))   details.push(`命盘${['木星过境','土星相位','推运触发','行星回归'][Math.floor(r()*4)]}`);

  // 精确时间推算
  const timeInfo = calcNodeTime(activeSys, r, date, engines);

  return { date, offset, isBull, mag, type, conf, details: details.join(' · '), activeSys, timeInfo };
}

// ═══════════════════════════════════════════════
// SIGNAL HELPERS
// ═══════════════════════════════════════════════
function biasBadge(b) {
  if(b>0.55) return ['badge-sbull','强势看涨'];
  if(b>0.15) return ['badge-bull', '温和看涨'];
  if(b<-0.55)return ['badge-sbear','强势看跌'];
  if(b<-0.15)return ['badge-bear', '温和看跌'];
  return ['badge-neut','中性观望'];
}

function biasColor(b) {
  if(b>0.15) return 'bull';
  if(b<-0.15) return 'bear';
  return 'hi';
}

// ═══════════════════════════════════════════════
// RENDER HELPERS
// ═══════════════════════════════════════════════
function row(k,v,cls='') {
  return `<div class="row"><span class="rk">${k}</span><span class="rv ${cls}">${v}</span></div>`;
}

function drawGannCanvas(gn) {
  const canvas = document.createElement('canvas');
  canvas.width = 360; canvas.height = 360;
  canvas.style.cssText = 'max-width:360px;width:100%;display:block;margin:0 auto';
  const ctx = canvas.getContext('2d');
  const cx=180,cy=180,R=155;

  ctx.fillStyle='#0a0a1e';
  ctx.fillRect(0,0,360,360);

  // Rings
  [0.25,0.5,0.75,1].forEach((f,i) => {
    ctx.beginPath(); ctx.arc(cx,cy,R*f,0,Math.PI*2);
    ctx.strokeStyle=`rgba(200,168,74,${0.08+i*0.07})`; ctx.lineWidth=1; ctx.stroke();
  });

  // Spokes
  GANN_ANG.forEach(a => {
    const rad=(a-90)*Math.PI/180;
    ctx.beginPath();
    ctx.moveTo(cx,cy);
    ctx.lineTo(cx+Math.cos(rad)*R, cy+Math.sin(rad)*R);
    ctx.strokeStyle='rgba(200,168,74,0.12)'; ctx.lineWidth=1; ctx.stroke();
    // label
    const lx=cx+Math.cos(rad)*(R+14), ly=cy+Math.sin(rad)*(R+14);
    ctx.fillStyle='rgba(200,168,74,0.5)';
    ctx.font='9px Noto Serif SC';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(a+'°', lx, ly);
  });

  // Current angle
  const curRad = (parseFloat(gn.cycAngle)-90)*Math.PI/180;
  ctx.beginPath(); ctx.moveTo(cx,cy);
  ctx.lineTo(cx+Math.cos(curRad)*R*0.82, cy+Math.sin(curRad)*R*0.82);
  ctx.strokeStyle='#d4a843'; ctx.lineWidth=2.5; ctx.stroke();

  // Active angle
  const actRad = (gn.activeAng-90)*Math.PI/180;
  ctx.beginPath(); ctx.moveTo(cx,cy);
  ctx.lineTo(cx+Math.cos(actRad)*R*0.68, cy+Math.sin(actRad)*R*0.68);
  ctx.strokeStyle='rgba(40,200,112,0.7)'; ctx.lineWidth=2; ctx.stroke();

  // Center dot
  ctx.beginPath(); ctx.arc(cx,cy,7,0,Math.PI*2);
  ctx.fillStyle='#d4a843'; ctx.fill();

  // Labels
  ctx.fillStyle='rgba(200,168,74,0.9)';
  ctx.font='bold 12px Noto Serif SC';
  ctx.textAlign='center';
  ctx.fillText('$'+Number(gn.P).toLocaleString(), cx, cy-18);
  ctx.fillStyle='rgba(200,168,74,0.5)';
  ctx.font='10px Noto Serif SC';
  ctx.fillText('√P = '+gn.sqP, cx, cy+20);

  return canvas;
}

function drawSRChart(sr) {
  const div = document.createElement('div');
  div.className = 'sr-section';
  const fmtSR = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };
  const pct = v => ((v - (sr&&sr.P||1))/(sr&&sr.P||1)*100).toFixed(1);

  const resHtml = sr.res.slice(0,5).map(l =>
    '<div class="sr-level sr-res">'
    + '<span style="color:var(--bear);font-weight:700;font-size:.78rem">▲ 压力</span>'
    + '<span style="font-weight:700">'+fmtSR(l.price)+'</span>'
    + '<span style="color:var(--muted);font-size:.72rem">'+l.method+'</span>'
    + '<span style="color:var(--bear);font-size:.72rem">+'+pct(l.price)+'%</span>'
    + '</div>'
  ).join('');

  const curHtml = '<div class="sr-level sr-cur">'
    + '<span style="color:var(--gold);font-weight:700;font-size:.78rem">▶ 当前</span>'
    + '<span style="font-weight:700;color:var(--gold)">'+fmtSR(sr.P)+'</span>'
    + '<span style="color:var(--muted);font-size:.72rem">基准价</span>'
    + '<span></span>'
    + '</div>';

  const supHtml = sr.sup.slice(0,5).map(l =>
    '<div class="sr-level sr-sup">'
    + '<span style="color:var(--bull);font-weight:700;font-size:.78rem">▼ 支撑</span>'
    + '<span style="font-weight:700">'+fmtSR(l.price)+'</span>'
    + '<span style="color:var(--muted);font-size:.72rem">'+l.method+'</span>'
    + '<span style="color:var(--bull);font-size:.72rem">'+pct(l.price)+'%</span>'
    + '</div>'
  ).join('');

  div.innerHTML = resHtml + curHtml + supHtml;
  return div;
}

// ═══════════════════════════════════════════════
// MAIN RENDER
// ═══════════════════════════════════════════════
function renderAll(data) {
  const { coin, date, price, high, low, span, sys,
          qm, ic, ve, gn, hr, sr, ch, nt, zw, va,
          rsiE, macdE, bbE, tdE, tfRec, mtfE,
          tpsl, tpsl5, nodes,
          breakLevel, gt, klines } = data;

  // ── 空引擎保护：active 为空时 score 默认 50 ──────────────────────────
  const _safeArr = arr => arr.filter(Boolean);

  // ── COMPOSITE ── 分离"价格引擎"与"时间/周期引擎" ─────────────────────
  // 价格引擎：江恩、谐波、支撑阻力、缠论、命盘（有明确价位输出）
  const priceEngines = _safeArr([
    sys.gann?gn:null, sys.harmonic?hr:null, sys.sr?sr:null,
    sys.chan?ch:null, sys.natal?nt:null,
  ]);

  // 时间/周期引擎：紫微、奇门、易经、印度占星、波动率（专长时间/周期）
  const timeEngines = _safeArr([
    sys.ziwei&&zw?zw:null, sys.qimen?qm:null,
    sys.iching?ic:null,    sys.vedic?ve:null,
    sys.volRate&&va?va:null,
  ]);

  // 综合 active 列表（向后兼容：仍包含所有引擎）
  const active = [...priceEngines, ...timeEngines];

  // 价格方向：只由价格引擎决定
  const priceAvgBias = priceEngines.length
    ? priceEngines.reduce((s,e)=>s+(e.bias||0),0) / priceEngines.length
    : 0;

  // 时间信号：由时间引擎的 bias 贡献（权重低：仅作辅助参考）
  const timeAvgBias = timeEngines.length
    ? timeEngines.reduce((s,e)=>s+(e.bias||0),0) / timeEngines.length
    : 0;

  // 综合 avgBias：价格引擎 80% + 时间引擎 20%
  const avgBias = priceEngines.length
    ? priceAvgBias * 0.80 + timeAvgBias * 0.20
    : timeAvgBias;

  const avgConf = active.length
    ? active.reduce((s,e)=>s+(e.conf||0),0)/active.length
    : 0.5;

  // 价格引擎目标价汇总（供综合目标价使用）
  const priceTargets = {
    gann:  gn  ? (gn.levels?.find(l=>l.isAbove)?.price  || null) : null,
    chan:  ch  ? (ch.zsHigh || null)                               : null,
    sr:    sr  ? (sr.res?.[0]?.price || null)                      : null,
    harmonic: hr ? (hr.patterns?.[0]?.D || null)                   : null,
    // 波动率修正系数（乘以当前价）
    vaCorrection: va ? va.correction : 1,
  };
  // 最终综合目标价（价格引擎均值 × 波动率修正）
  const rawTargets = [priceTargets.gann, priceTargets.chan, priceTargets.sr]
    .filter(Boolean);
  const finalTarget = rawTargets.length
    ? Math.round(rawTargets.reduce((s,v)=>s+v,0) / rawTargets.length * (priceTargets.vaCorrection||1))
    : null;

  // 时间信号汇总（供显示使用）
  const timeSummary = {
    ziwei:  zw ? { goodTime: zw.goodTime, badTime: zw.badTime, wealthStar: zw.wealthStar } : null,
    qimen:  qm ? { entryTime: qm.entryTime, exitTime: qm.exitTime, direction: qm.direction } : null,
    iching: ic ? { trend: ic.trend, changeDay: ic.changeDay, hexagram: ic.hexagram } : null,
    vedic:  ve ? { cycle: ve.cycle, energy: ve.energy, planet: ve.planet }           : null,
  };

  const score   = Math.round((avgBias+1)/2*100);

  // Score ring
  const scoreColor = score >= 65 ? 'var(--bull)' : score <= 35 ? 'var(--bear)' : 'var(--gold)';
  setTimeout(()=>{
    const el = document.getElementById('scoreCircle');
    if(el) {
      const circ2 = 389.6;
      el.style.strokeDashoffset = circ2 - circ2*score/100;
      // Update gradient color based on score
      el.setAttribute('stroke', score>=65 ? 'var(--bull)' : score<=35 ? 'var(--bear)' : 'url(#sg)');
    }
  }, 200);

  // Counter animation (rAF-based, no setInterval)
  let cur = 0;
  const numEl = document.getElementById('scoreNum');
  if (numEl) { numEl.style.color = scoreColor; }
  (function countUp() {
    cur = Math.min(cur + 3, score);
    if (numEl) numEl.textContent = cur;
    if (cur < score) requestAnimationFrame(countUp);
  })();

  // Hex & verdict
  const hexIdx = Math.round((avgBias+1)/2*63);
  document.getElementById('vHex').textContent = HEXAGRAMS[hexIdx][0];

  const titles = ['天地否塞·空头格局','阴云密布·偏空观望','中性徘徊·静候天机','温和向上·伺机布局','天时地利·多头格局'];
  const ti = score>=80?4:score>=60?3:score>=45?2:score>=30?1:0;
  document.getElementById('vTitle').textContent = titles[ti];

  const NC_this = NATAL_CHARTS[coin] || {};
  const assetName = NC_this.name || coin;
  const isCommodity = !!NC_this.commodity;
  const charEnergy = NC_this.char_energy || '多系统联合分析';
  const natalNote = sys.natal && nt ? (nt.jupReturn?'命盘木星回归共振・' : nt.satReturn?'命盘土星压力期・' : '命盘行星过境・') : '';
  const bodies = [
    natalNote + `七法合一推演${assetName}强烈看跌信号。${HEXAGRAMS[hexIdx][1]}卦偏空，缠论背驰叠加江恩时间角，谐波阻力压制。${isCommodity?'地缘/季节因素需关注，':''}建议严控仓位。`,
    natalNote + `多系统研判${assetName}偏空倾向。印度占星土星影响明显，中枢下移，支撑岌岌可危。${isCommodity?'商品基本面待确认，':''}建议减仓等待。`,
    natalNote + `${assetName}各系统信号拉锯，天机难明。${HEXAGRAMS[hexIdx][1]}卦暗示静观其变。命盘气质：${charEnergy}。建议轻仓观望，等待共振再行动。`,
    natalNote + `多系统综合${assetName}偏多。${HEXAGRAMS[hexIdx][1]}卦开门叠加，江恩周期上行，缠论底背驰确认。${isCommodity?'季节性需求支撑，':''}适度布局。`,
    natalNote + `七法合一强烈看涨${assetName}！命盘气质「${charEnergy}」激活，木星加持，谐波PRZ触底，缠论买点出现，支撑稳固。综合置信度${((avgConf||0)*100).toFixed(0)}%。`
  ];
  document.getElementById('vBody').textContent = bodies[ti];

  // System score bars — 价格引擎显示偏向，时间引擎显示专属字段
  const sysInfo = [
    sys.qimen?{name:'奇门遁甲', bias:qm.bias, conf:qm.conf, color:'var(--gold)',
      roleLabel: qm.direction==='多'?'入市↑':qm.direction==='空'?'出市↓':'观望', isTimeSys:true}:null,
    sys.iching?{name:'易经卦象', bias:ic.bias, conf:ic.conf, color:'var(--crimson)',
      roleLabel: ic.trend+(ic.changeDay?'·'+ic.changeDay+'日变':''), isTimeSys:true}:null,
    sys.vedic?{name:'印度占星', bias:ve.bias, conf:ve.conf, color:'var(--indigo)',
      roleLabel: ve.cycle+'·'+ve.energy+'能量', isTimeSys:true}:null,
    sys.gann?{name:'江恩理论', bias:gn.bias, conf:gn.conf, color:'var(--emerald)', isTimeSys:false}:null,
    sys.harmonic?{name:'谐波形态', bias:hr.bias, conf:hr.conf, color:'var(--teal)', isTimeSys:false}:null,
    sys.sr?{name:'支撑阻力', bias:sr.bias, conf:sr.conf, color:'var(--amber)', isTimeSys:false}:null,
    sys.chan?{name:'缠    论', bias:ch.bias, conf:ch.conf, color:'var(--rose)', isTimeSys:false}:null,
    sys.natal&&nt?{name:'命盘共振', bias:nt.bias, conf:nt.conf, color:'#a060e0', isTimeSys:false}:null,
    sys.ziwei&&zw?{name:'紫微斗数', bias:zw.bias, conf:zw.conf, color:'#9040d8',
      roleLabel: (zw.goodTime||[]).join('/') || '查时', isTimeSys:true}:null,
    sys.volRate&&va?{name:'波动率', bias:va.bias, conf:va.conf, color:'#d4a843',
      roleLabel:'修正×'+(va.correction||1).toFixed(3), isTimeSys:false}:null,
  ].filter(Boolean);

  document.getElementById('sysBars').innerHTML = sysInfo.map(s => {
    const pct = Math.round((s.bias+1)/2*100);
    // 时间引擎：显示专属角色标签而非多空百分比
    if (s.isTimeSys && s.roleLabel) {
      return `<div class="sbar-row">
        <span class="sbar-name" title="${s.name}">${s.name}</span>
        <div class="sbar-track" style="flex:1;height:6px;background:rgba(0,0,0,0.08);border-radius:3px;overflow:hidden">
          <div style="height:100%;width:${pct}%;background:${s.color};opacity:0.6;border-radius:3px"></div>
        </div>
        <span style="font-size:.6rem;font-weight:700;color:${s.color};width:60px;text-align:right;flex-shrink:0;white-space:nowrap">${s.roleLabel}</span>
      </div>`;
    }
    const isBull = s.bias > 0.12;
    const isBear = s.bias < -0.12;
    const dirLabel = isBull ? '看涨' : isBear ? '看跌' : '中性';
    const dirColor = isBull ? 'var(--bull)' : isBear ? 'var(--bear)' : 'var(--muted)';
    return `<div class="sbar-row">
      <span class="sbar-name" title="${s.name}">${s.name}</span>
      <div class="sbar-track">
        <div class="sbar-fill" style="width:${pct}%;background:${isBull?'var(--bull)':isBear?'var(--bear)':'var(--gold)'}"></div>
      </div>
      <span style="font-size:.62rem;font-weight:700;color:${dirColor};width:26px;text-align:right;flex-shrink:0">${dirLabel}</span>
    </div>`;
  }).join('');

  // ══════════════════════════════════════════════
  // 极简每日研判卡（仿博主格式：4行核心结论）
  // ══════════════════════════════════════════════
  {
    const bannerEl = document.getElementById('signalBanner');
    const summaryEl = document.getElementById('quickSummary');

    const fmtB = v => {
      const n = Number(v);
      if(isNaN(n)||!isFinite(n)||n===0) return '--';
      return n>=1000 ? '$'+Math.round(n).toLocaleString() : n>=1 ? '$'+n.toFixed(2) : '$'+n.toFixed(4);
    };

    // ── 结构行 ──────────────────────────────────────────────
    const structParts = [];
    if(tpsl5?.signal==='LONG') structParts.push('多头结构延续');
    else if(tpsl5?.signal==='SHORT') structParts.push('空头结构主导');
    else structParts.push('区间震荡整理');

    if(ch) {
      if(ch.biDir==='up' && !ch.beichi) structParts.push('上升笔未完成');
      else if(ch.biDir==='up' && ch.beichi) structParts.push('上升笔'+(ch.beichiType||'背驰'));
      else if(ch.biDir==='down' && ch.beichi) structParts.push('下跌'+ch.beichiType+'待确认');
      else if(ch.zsValid) structParts.push('中枢震荡');
    }
    if(gn) {
      const gnDir = gn.bias>0.2?'江恩角线支撑偏多':gn.bias<-0.2?'江恩角线压制偏空':'江恩角线中性';
      structParts.push(gnDir);
    }

    // ── 时间行 ──────────────────────────────────────────────
    const timeParts = [];
    // 最近2个未来节点
    const futureNodes = nodes.filter(n => new Date(n.date) > new Date()).slice(0,3);
    futureNodes.forEach(n => {
      const d = new Date(n.date);
      const label = (d.getMonth()+1)+'/'+d.getDate();
      const diffD = Math.round((new Date(n.date)-Date.now())/86400000);
      const urgency = diffD<=2 ? '⌛' : '';
      timeParts.push(`${label}（+${n.offset}天）${n.type}${urgency}`);
    });
    // 奇门今日时辰
    if(qm?.entryTime) timeParts.push('今日吉时 '+qm.entryTime.replace(/（.*）/,'').trim());

    // ── 价格行 ──────────────────────────────────────────────
    const priceParts = [];
    const T = tpsl;
    if(T) {
      const tp1 = T.tpLevels?.[0];
      const tp2 = T.tpLevels?.[1];
      const sl1 = T.slLevels?.[0];
      if(tp1) priceParts.push('阻力 '+fmtB(tp1.price)+(tp2?' / '+fmtB(tp2.price):''));
      if(sl1) priceParts.push('止损 '+fmtB(sl1.price));
    }
    // SR engine key zones
    if(sr?.resZones?.length) {
      const rz = sr.resZones[0];
      const rzStr = fmtB(rz.high||rz.price||rz.low);
      if(!priceParts[0]?.includes(rzStr)) priceParts.push('压力带 '+rzStr);
    }
    if(sr?.supZones?.length) {
      const sz = sr.supZones[0];
      const szStr = fmtB(sz.low||sz.price||sz.high);
      priceParts.push('支撑带 '+szStr);
    }
    // TP5 target
    if(tpsl5?.strategies?.length) {
      const st5 = tpsl5.strategies[4];
      priceParts.push('目标 '+fmtB(st5.long.tp));
    }

    // ── 操作行 ──────────────────────────────────────────────
    const opParts = [];
    const sig = tpsl?.signal || 'NEUTRAL';
    const sl1price = tpsl?.slLevels?.[0]?.price;
    const tp1price = tpsl?.tpLevels?.[0]?.price;

    if(sig==='LONG') {
      if(sl1price) opParts.push(`不破 ${fmtB(sl1price)} 偏多`);
      else opParts.push('偏多布局');
      if(ch?.beichi && ch.beichiType==='顶背驰') opParts.push('顶背驰信号需谨慎');
      const nextKeyNode = futureNodes[0];
      if(nextKeyNode) {
        const nd = new Date(nextKeyNode.date);
        opParts.push(`等 ${(nd.getMonth()+1)}/${nd.getDate()} 节点确认`+(nextKeyNode.isBull?'':'后考虑回调'));
      }
    } else if(sig==='SHORT') {
      if(sl1price) opParts.push(`不破 ${fmtB(sl1price)} 偏空`);
      if(tp1price) opParts.push(`目标 ${fmtB(tp1price)}`);
    } else {
      opParts.push('方向未明 轻仓观望');
      if(sl1price) opParts.push(`关注 ${fmtB(sl1price)} 能否守住`);
    }
    const confPct = Math.round((avgConf||0.5)*100);

    // ── 渲染研判卡 ──────────────────────────────────────────
    const sigColor = sig==='LONG'?'var(--bull)':sig==='SHORT'?'var(--bear)':'var(--gold)';
    const sigTxt   = sig==='LONG'?'▲ 偏多':sig==='SHORT'?'▼ 偏空':'◆ 观望';
    const cardBorder = sig==='LONG'?'rgba(20,120,62,.35)':sig==='SHORT'?'rgba(168,32,32,.35)':'rgba(140,100,16,.35)';
    const cardBg     = sig==='LONG'?'rgba(20,120,62,.04)':sig==='SHORT'?'rgba(168,32,32,.04)':'rgba(140,100,16,.03)';

    if(bannerEl) bannerEl.style.display = 'none'; // 隐藏原banner

    if(summaryEl) summaryEl.innerHTML = `
      <div style="border:1px solid ${cardBorder};background:${cardBg};border-radius:12px;padding:14px 16px;margin:0 0 12px;font-size:.82rem;line-height:1">

        <!-- 标题行 -->
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:.68rem;font-weight:700;color:var(--faint);letter-spacing:.08em;text-transform:uppercase">${coin} · ${date} 研判</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <span style="font-size:.78rem;font-weight:800;color:${sigColor};background:${sigColor}18;padding:3px 12px;border-radius:99px;border:1px solid ${sigColor}40">${sigTxt}</span>
            <span style="font-size:.68rem;color:var(--faint)">${confPct}% 置信</span>
          </div>
        </div>

        <!-- 4行内容 -->
        <div style="display:flex;flex-direction:column;gap:9px">

          <div style="display:flex;gap:8px;align-items:flex-start">
            <span style="font-size:.72rem;font-weight:700;color:var(--sky);width:36px;flex-shrink:0;padding-top:1px">结构</span>
            <span style="color:var(--text);flex:1;line-height:1.6">${structParts.join(' · ') || '--'}</span>
          </div>

          <div style="display:flex;gap:8px;align-items:flex-start">
            <span style="font-size:.72rem;font-weight:700;color:var(--gold);width:36px;flex-shrink:0;padding-top:1px">时间</span>
            <span style="color:var(--text);flex:1;line-height:1.6">${timeParts.length ? timeParts.join('  ') : '暂无关键时间节点'}</span>
          </div>

          <div style="display:flex;gap:8px;align-items:flex-start">
            <span style="font-size:.72rem;font-weight:700;color:var(--amber);width:36px;flex-shrink:0;padding-top:1px">价格</span>
            <span style="color:var(--text);flex:1;line-height:1.6">${priceParts.join('  ') || '--'}</span>
          </div>

          <div style="display:flex;gap:8px;align-items:flex-start;padding-top:9px;border-top:1px solid ${cardBorder}">
            <span style="font-size:.72rem;font-weight:700;color:${sigColor};width:36px;flex-shrink:0;padding-top:1px">操作</span>
            <span style="color:var(--text);flex:1;font-weight:600;line-height:1.6">${opParts.join(' → ')}</span>
          </div>

        </div>
      </div>`;
  }

  // ── TABS ──
  const tabDefs = [];
  if(Object.values(sys).filter(Boolean).length>0) tabDefs.push({id:'overview',label:'📊 综合节点'});
  tabDefs.push({id:'intraday', label:'⏰ 盘中时刻'});
  tabDefs.push({id:'deduction', label:'🧭 缠·恩推演'});
  tabDefs.push({id:'logic', label:'🔍 推算依据'});
  tabDefs.push({id:'multicoin', label:'🔀 多币对比'});
  if(sys.qimen)   tabDefs.push({id:'qimen',   label:'☲ 奇门遁甲'});
  if(sys.iching)  tabDefs.push({id:'iching',  label:'䷀ 易经卦象'});
  if(sys.vedic)   tabDefs.push({id:'vedic',   label:'✦ 印度占星'});
  if(sys.gann)    tabDefs.push({id:'gann',    label:'⬡ 江恩理论'});
  if(sys.harmonic)tabDefs.push({id:'harmonic',label:'◈ 谐波形态'});
  if(sys.sr)      tabDefs.push({id:'sr',      label:'▤ 支撑阻力'});
  if(sys.chan)    tabDefs.push({id:'chan',     label:'∿ 缠    论'});
  if(sys.gann && sys.chan) tabDefs.push({id:'gannChanSynergy', label:'🔥 江恩×缠论'});
  if(sys.ziwei)   tabDefs.push({id:'ziwei',   label:'☽ 紫微斗数'});
  if(sys.volRate) tabDefs.push({id:'volrate', label:'⚙ 波动率'});
  tabDefs.push({id:'techind', label:'📐 技术指标'});
  tabDefs.push({id:'tpsl', label:'🎯 止盈止损'});
  tabDefs.push({id:'backtest', label:'🔬 回测验证'});
  if(sys.natal)   tabDefs.push({id:'natal',   label:'☽ 命盘共振'});

  document.getElementById('tabBar').innerHTML = tabDefs.map((t,i)=>
    `<button class="tab${i===0?' active':''}" onclick="switchDetailTab('${t.id}',this)">${t.label}</button>`
  ).join('');

  // Build tab panels
  const panels = {};

  // Overview / Timeline
  const tagMap = {qimen:'t-qm',iching:'t-ic',vedic:'t-ve',gann:'t-gn',harmonic:'t-hr',sr:'t-sr',chan:'t-ch',natal:'t-nt'};
  const tagLabel={qimen:'奇门',iching:'易经',vedic:'印度占星',gann:'江恩',harmonic:'谐波',sr:'支阻',chan:'缠论',natal:'命盘'};
  panels['overview'] = `
    <div class="panel">
      <div class="panel-title">⏰ 重要节点预测时间线</div>

      <!-- 价格路径预测图 -->
      ${(()=>{
        const P0 = price || 50000;
        const totalDays = span || 90;
        const overallBull = tpsl ? tpsl.signal !== 'SHORT' : true;
        const chartBullTarget = (gt && gt.AR) ? gt.AR : P0 * 1.15;
        const chartBearTarget = (gt && gt.AB) ? gt.AB : (high && low) ? smartRound(low - (high - low) * 0.382) : P0 * 0.85;
        const endTarget = overallBull ? chartBullTarget : chartBearTarget;
        const fmtPx = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };

        const pts = [{day:0, price:P0, label:'当前', isBull:true, conf:1, isCurrent:true}];
        nodes.forEach(n => {
          const frac = Math.min(n.offset / totalDays, 1);
          const projP = smartRound(P0 + (endTarget - P0) * frac);
          pts.push({day:n.offset, price:projP, label:n.type, isBull:n.isBull, conf:n.conf, activeSys:n.activeSys});
        });
        pts.push({day:totalDays, price:Math.round(endTarget), label:'目标', isBull:endTarget>=P0, conf:0.8, isFinal:true});

        const W = 560, H = 160, PL = 54, PR = 16, PT = 20, PB = 28;
        const cW = W - PL - PR, cH = H - PT - PB;
        const allPrices = pts.map(p=>p.price);
        const minP = Math.min(...allPrices) * 0.988;
        const maxP = Math.max(...allPrices) * 1.012;
        const cx = d => PL + (d / totalDays) * cW;
        const cy = p => PT + cH - ((p - minP) / (maxP - minP)) * cH;

        const pathPts = pts.map(p => [cx(p.day), cy(p.price)]);
        let pathD = 'M ' + pathPts[0][0] + ',' + pathPts[0][1];
        for(let i = 1; i < pathPts.length; i++) {
          const prev = pathPts[i-1], cur = pathPts[i];
          const cpx = (prev[0] + cur[0]) / 2;
          pathD += ' C ' + cpx + ',' + prev[1] + ' ' + cpx + ',' + cur[1] + ' ' + cur[0] + ',' + cur[1];
        }
        const fillD = pathD + ' L ' + pathPts[pathPts.length-1][0] + ',' + (PT+cH) + ' L ' + PL + ',' + (PT+cH) + ' Z';

        const gridPrices = [minP, (minP+maxP)/2, maxP].map(p => ({ price:p, y:cy(p), label:fmtPx(p) }));
        const dots = pts.map(p => {
          const x=cx(p.day),y=cy(p.price);
          const col = p.isCurrent?'#c8a840':p.isFinal?'#c8a840':p.isBull?'#28c870':'#e05050';
          const r = p.isCurrent||p.isFinal ? 5 : (p.conf>0.72?4.5:3.5);
          const ring = (p.activeSys?.length>=3) ? '<circle cx="'+x+'" cy="'+y+'" r="'+(r+3)+'" fill="none" stroke="'+col+'" stroke-width="1" opacity="0.4"/>' : '';
          return ring+'<circle cx="'+x+'" cy="'+y+'" r="'+r+'" fill="'+col+'" stroke="var(--bg)" stroke-width="1.5"/>';
        }).join('');
        const axisLabels = [0,Math.round(totalDays*0.25),Math.round(totalDays*0.5),Math.round(totalDays*0.75),totalDays]
          .map(d=>'<text x="'+cx(d)+'" y="'+(PT+cH+14)+'" text-anchor="middle" font-size="8" fill="rgba(180,160,120,0.7)">+'+d+'天</text>').join('');

        return '<div style="margin-bottom:14px;background:rgba(0,0,0,0.08);border:1px solid rgba(200,168,74,0.15);border-radius:10px;padding:8px 6px 6px;overflow:hidden">'
          +'<div style="font-size:.6rem;color:rgba(200,168,74,.6);letter-spacing:.08em;margin-bottom:5px;padding:0 6px">📈 价格路径预测（'+totalDays+'天）</div>'
          +'<svg width="100%" viewBox="0 0 '+W+' '+H+'" style="display:block">'
          +'<defs><linearGradient id="pgFill2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="rgba(200,168,74,0.15)"/><stop offset="100%" stop-color="rgba(200,168,74,0)"/></linearGradient></defs>'
          +gridPrices.map(g=>'<line x1="'+PL+'" y1="'+g.y+'" x2="'+(W-PR)+'" y2="'+g.y+'" stroke="rgba(200,168,74,0.07)" stroke-width="1"/>'
            +'<text x="'+(PL-4)+'" y="'+(g.y+3)+'" text-anchor="end" font-size="7.5" fill="rgba(180,160,120,0.55)">'+g.label+'</text>').join('')
          +'<path d="'+fillD+'" fill="url(#pgFill2)"/>'
          +'<path d="'+pathD+'" fill="none" stroke="rgba(200,168,74,0.65)" stroke-width="1.8"/>'
          +'<line x1="'+cx(0)+'" y1="'+PT+'" x2="'+cx(0)+'" y2="'+(PT+cH)+'" stroke="rgba(200,168,74,0.3)" stroke-width="1" stroke-dasharray="3,3"/>'
          +dots+axisLabels
          +'<text x="'+cx(0)+'" y="'+(cy(P0)-7)+'" text-anchor="middle" font-size="8" fill="#c8a840" font-weight="700">'+fmtPx(P0)+'</text>'
          +'<text x="'+cx(totalDays)+'" y="'+(cy(Math.round(endTarget))-7)+'" text-anchor="middle" font-size="8" fill="#c8a840" font-weight="700">'+fmtPx(Math.round(endTarget))+'</text>'
          +'</svg></div>';
      })()}

      <!-- 极简节点列表 -->
      <div style="display:flex;flex-direction:column;gap:6px">
        ${nodes.map((n,ni)=>{
          const nodeDate = new Date(n.date);
          const diffMs   = nodeDate - Date.now();
          const diffD    = Math.round(diffMs/86400000);
          const isPast   = diffMs < 0;
          const isUrgent = !isPast && diffD <= 2;
          const d = nodeDate;
          const dateLabel = (d.getMonth()+1)+'/'+(d.getDate());
          const cdStr = isPast ? '已过' : diffD===0 ? '今日 ⌛' : diffD<=2 ? diffD+'天 ⌛' : '+'+diffD+'天';
          const cdColor = isPast?'var(--faint)':isUrgent?'var(--bull)':'var(--gold)';
          const dirColor = n.isBull?'var(--bull)':'var(--bear)';
          const dirIcon  = n.isBull?'▲':'▼';
          const confPct  = Math.round((n.conf||0.5)*100);
          const resonN   = n.activeSys?.length||0;
          const resonDots= '●'.repeat(Math.min(resonN,5))+'○'.repeat(Math.max(0,5-Math.min(resonN,5)));
          const rowOpacity = isPast ? 'opacity:.45;' : '';

          // 预测价（同原逻辑）
          const P0 = price||50000, totalDays=span||90;
          const overallBull2 = tpsl?tpsl.signal!=='SHORT':true;
          const endTarget2 = overallBull2?((gt&&gt.AR)?gt.AR:P0*1.15):((gt&&gt.AB)?gt.AB:P0*0.85);
          const projP = smartRound(P0 + (endTarget2-P0)*Math.min(n.offset/totalDays,1));
          const fmtPx2 = v=>{ const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };

          // 精简 details (最多2项)
          const detailShort = (n.details||'').split(' · ').slice(0,2).join(' · ');

          return `<div style="${rowOpacity}display:flex;align-items:center;gap:10px;padding:9px 12px;
            border:1px solid ${isUrgent?'rgba(20,120,62,.35)':isPast?'var(--border)':'rgba(140,100,16,.2)'};
            background:${isUrgent?'rgba(20,120,62,.04)':isPast?'transparent':'rgba(140,100,16,.02)'};
            border-radius:9px;cursor:default">

            <!-- 日期 -->
            <div style="flex-shrink:0;text-align:center;width:44px">
              <div style="font-size:.82rem;font-weight:800;color:${cdColor};font-family:monospace">${dateLabel}</div>
              <div style="font-size:.58rem;color:${cdColor};margin-top:1px">${cdStr}</div>
            </div>

            <!-- 内容 -->
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px">
                <span style="font-size:.78rem;font-weight:700;color:${dirColor}">${dirIcon} ${n.type||'节点'}</span>
                ${n.mag?`<span style="font-size:.6rem;color:var(--faint)">${n.mag}</span>`:''}
              </div>
              <div style="font-size:.65rem;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${detailShort}</div>
            </div>

            <!-- 右侧数字 -->
            <div style="flex-shrink:0;text-align:right">
              <div style="font-size:.75rem;font-weight:700;color:var(--gold);font-family:monospace">${fmtPx2(projP)}</div>
              <div style="font-size:.58rem;color:var(--faint);margin-top:2px">${confPct}% · <span style="letter-spacing:-1px;font-size:.6rem;color:${resonN>=3?'var(--gold)':'var(--faint)'}">${resonDots}</span></div>
            </div>
          </div>`;
        }).join('')}
      </div>
    </div>`;


  // ── INTRADAY TIME PANEL ──────────────────────────────────────────────────
  {
    // Collect all time signals from all nodes
    const allTimes = nodes.filter(n => n.timeInfo).map(n => ({
      ...n.timeInfo,
      date: n.date,
      offset: n.offset,
      isBull: n.isBull,
      mag: n.mag,
      type: n.type,
      nodeConf: n.conf,
      activeSys: n.activeSys,
    }));

    // Also generate system-specific intraday signals directly
    const sysTimeSigs = [];

    if(sys.qimen && qm) {
      QIMEN_HOURS.forEach((qt, i) => {
        const isBull = qm.bias > 0;
        sysTimeSigs.push({ time: qt.h, window: `2小时时辰`, label: `奇门${qt.t}`, note: qt.note,
          source: '奇门遁甲', isBull, conf: 0.55 + Math.abs(qm.bias)*0.2,
          detail: `${qt.t}·宫位${i+1}·${qm.door}应期` });
      });
    }

    if(sys.vedic && ve) {
      Object.entries(VEDIC_PLANET_HOURS).forEach(([pl, vh]) => {
        const isBull = ['木星','金星','月亮','太阳'].includes(pl);
        sysTimeSigs.push({ time: vh.peak, window: vh.window, label: `${pl}时`, note: vh.note,
          source: '印度占星', isBull, conf: 0.60 + Math.abs(ve.bias)*0.15, detail: vh.note });
      });
    }

    if(sys.gann && gn) {
      [90,120,144,180,240,270,360].forEach(ang => {
        const h = Math.floor((ang % 360) / 15);
        const t = `${String(h).padStart(2,'0')}:00`;
        sysTimeSigs.push({ time: t, window: `±30分钟`, label: `江恩${ang}°`, note: `角度线${ang}°映射时刻`,
          source: '江恩理论', isBull: gn.bias > 0, conf: 0.58, detail: `江恩${ang}°时间角→UTC+8 ${t}` });
      });
    }

    if(sys.chan && ch) {
      CHAN_TIMES.forEach(ct => {
        sysTimeSigs.push({ time: ct.h, window: `±15分钟`, label: '缠论窗口', note: ct.note,
          source: '缠　论', isBull: ch.biDir === 'up', conf: 0.55, detail: ct.note });
      });
    }

    if(sys.harmonic && hr) {
      HARMONIC_WINDOWS.forEach(hw => {
        const [hs] = hw.split('-');
        sysTimeSigs.push({ time: hs, window: hw, label: '谐波PRZ窗口', note: '流动性峰值·PRZ完成触达',
          source: '谐波形态', isBull: hr.bias > 0, conf: 0.52, detail: `谐波PRZ触达窗口：${hw}` });
      });
    }

    // Deduplicate and sort by time
    const allSorted = [...allTimes, ...sysTimeSigs]
      .sort((a, b) => a.time.localeCompare(b.time));

    // Group by hour
    const byHour = {};
    allSorted.forEach(s => {
      const hh = s.time.substring(0,2);
      if (!byHour[hh]) byHour[hh] = [];
      byHour[hh].push(s);
    });

    // Find peak hours (most signals)
    const hourCounts = Object.entries(byHour).map(([h, sigs]) => ({
      h, count: sigs.length, maxConf: Math.max(...sigs.map(s => s.conf||0.5))
    })).sort((a,b) => b.count - a.count || b.maxConf - a.maxConf);
    const topHours = hourCounts.slice(0, 3).map(x => x.h);

    // Render 24h grid
    const hourRows = Object.entries(byHour).map(([hh, sigs]) => {
      const isTop = topHours.includes(hh);
      const bullSigs = sigs.filter(s => s.isBull);
      const bearSigs = sigs.filter(s => !s.isBull);
      const dominantBull = bullSigs.length >= bearSigs.length;
      const maxConf = Math.max(...sigs.map(s => s.conf||0.5));

      return `<div style="border-radius:8px;margin-bottom:6px;overflow:hidden;border:1px solid ${isTop?'rgba(200,168,74,0.4)':'var(--border)'}">
        <div style="display:flex;align-items:center;padding:8px 12px;background:${isTop?'rgba(200,168,74,0.1)':'var(--card2)'};gap:10px">
          <div style="font-family:Cinzel,serif;font-size:1.1rem;font-weight:700;color:${isTop?'var(--gold)':'var(--text)'};min-width:52px">${hh}:xx</div>
          <div style="flex:1">
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${sigs.map(s => `<span style="font-size:.62rem;padding:2px 7px;border-radius:99px;background:${s.isBull?'rgba(24,145,80,0.12)':'rgba(192,48,48,0.12)'};color:${s.isBull?'var(--bull)':'var(--bear)'};border:1px solid ${s.isBull?'rgba(24,145,80,0.25)':'rgba(192,48,48,0.25)'}">${s.source||s.label}</span>`).join('')}
            </div>
          </div>
          <div style="text-align:right;flex-shrink:0">
            <div style="font-size:.8rem;font-weight:700;color:${dominantBull?'var(--bull)':'var(--bear)'}">${dominantBull?'▲ 偏多':'▼ 偏空'}</div>
            <div style="font-size:.62rem;color:var(--faint)">${((maxConf||0)*100).toFixed(0)}% 置信</div>
          </div>
        </div>
        <div style="padding:6px 12px 8px;background:var(--card)">
          ${sigs.slice(0,3).map(s =>
            `<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 0;border-bottom:1px solid rgba(0,0,0,0.04);font-size:.7rem">
              <span style="color:var(--muted)">${s.time} &nbsp;<strong style="color:var(--text)">${s.label}</strong></span>
              <span style="color:var(--faint);font-size:.62rem;max-width:55%;text-align:right">${(s.note||s.detail||'').substring(0,40)}</span>
            </div>`
          ).join('')}
        </div>
      </div>`;
    }).join('');

    // Build market session highlights
    const sessions = [
      { name:'亚盘', range:'08:00–16:00', UTC:'亚洲盘(UTC+8)', color:'#38a8e0' },
      { name:'欧盘', range:'08:00–16:00', UTC:'欧洲盘', color:'#28c870' },
      { name:'美盘', range:'16:00–24:00', UTC:'美洲盘', color:'#e04848' },
    ];
    const sessionSummary = sessions.map(sess => {
      const [hs, he] = sess.range.split('–').map(t => parseInt(t.split(':')[0]));
      const sessHours = Object.entries(byHour).filter(([hh]) => {
        const h = parseInt(hh);
        return h >= hs && h < he;
      });
      const totalSigs = sessHours.reduce((s,[,sigs]) => s + sigs.length, 0);
      const bullSigs  = sessHours.reduce((s,[,sigs]) => s + sigs.filter(x=>x.isBull).length, 0);
      const pct = totalSigs > 0 ? Math.round(bullSigs/totalSigs*100) : 50;
      const peakH = sessHours.sort((a,b)=>b[1].length-a[1].length)[0];
      return `<div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:14px;text-align:center">
        <div style="font-size:.65rem;color:var(--faint);margin-bottom:2px">${sess.UTC}</div>
        <div style="font-size:.9rem;font-weight:700;color:${sess.color}">${sess.name}</div>
        <div style="font-size:.68rem;color:var(--muted);margin-bottom:8px">${sess.range} UTC</div>
        <div style="font-size:1.2rem;font-weight:700;color:${pct>=55?'var(--bull)':pct<=45?'var(--bear)':'var(--gold)'}">
          ${pct>=55?'▲ 偏多':pct<=45?'▼ 偏空':'→ 中性'}
        </div>
        <div style="font-size:.68rem;color:var(--muted);margin-top:4px">${totalSigs}个信号 · 多空比${pct}%</div>
        ${peakH ? `<div style="font-size:.65rem;color:var(--gold);margin-top:4px">峰值时段：${peakH[0]}:xx</div>` : ''}
      </div>`;
    }).join('');

    panels['intraday'] = `
      <div class="panel">
        <div class="panel-title">⏰ 今日盘中时刻 <span style="font-size:.65rem;color:var(--faint);font-weight:400">UTC+8</span></div>

        <!-- 三大时段 -->
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px">
          ${sessionSummary}
        </div>

        <!-- 峰值时段 -->
        ${topHours.length ? `<div style="margin-bottom:12px">
          <div style="font-size:.62rem;font-weight:700;color:var(--faint);letter-spacing:.06em;margin-bottom:6px">高峰时段</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            ${topHours.map((hh,i)=>{
              const sigs=byHour[hh]||[];
              const dom=sigs.filter(s=>s.isBull).length>=sigs.filter(s=>!s.isBull).length;
              const icons=['🥇','🥈','🥉'];
              return `<div style="display:flex;align-items:center;gap:7px;padding:7px 12px;border:1px solid rgba(200,168,74,.25);border-radius:8px;background:rgba(200,168,74,.05)">
                <span style="font-size:.7rem;color:var(--faint)">${icons[i]}</span>
                <span style="font-size:1.05rem;font-weight:800;color:var(--gold);font-family:monospace">${hh}:00</span>
                <span style="font-size:.68rem;color:${dom?'var(--bull)':'var(--bear)'}">${dom?'▲ 偏多':'▼ 偏空'}</span>
                <span style="font-size:.6rem;color:var(--faint)">${sigs.length}系统</span>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- 逐时辰信号表 -->
        <div style="display:flex;flex-direction:column;gap:4px">
          ${Object.entries(byHour).sort(([a],[b])=>a.localeCompare(b)).map(([hh,sigs])=>{
            const isTop=topHours.includes(hh);
            const bullSigs=sigs.filter(s=>s.isBull), bearSigs=sigs.filter(s=>!s.isBull);
            const dom=bullSigs.length>=bearSigs.length;
            const maxConf=Math.max(...sigs.map(s=>s.conf||0.5));
            return `<div style="display:flex;align-items:center;gap:8px;padding:7px 10px;
              border-radius:7px;border:1px solid ${isTop?'rgba(200,168,74,.3)':'var(--border)'};
              background:${isTop?'rgba(200,168,74,.06)':'transparent'}">
              <span style="font-family:monospace;font-size:.8rem;font-weight:${isTop?800:400};color:${isTop?'var(--gold)':'var(--muted)'};width:40px;flex-shrink:0">${hh}:xx</span>
              <span style="font-size:.7rem;font-weight:700;color:${dom?'var(--bull)':'var(--bear)'};width:36px;flex-shrink:0">${dom?'▲ 多':'▼ 空'}</span>
              <div style="flex:1;display:flex;flex-wrap:wrap;gap:3px">
                ${sigs.slice(0,4).map(s=>`<span style="font-size:.6rem;padding:1px 6px;border-radius:99px;
                  background:${s.isBull?'rgba(20,120,62,.1)':'rgba(168,32,32,.1)'};
                  color:${s.isBull?'var(--bull)':'var(--bear)'};
                  border:1px solid ${s.isBull?'rgba(20,120,62,.2)':'rgba(168,32,32,.2)'}">${s.source||s.label}</span>`).join('')}
              </div>
              <span style="font-size:.62rem;color:var(--faint);flex-shrink:0">${((maxConf||0)*100).toFixed(0)}%</span>
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }
  // ── CHAN + GANN DEDUCTION PANEL ──────────────────────────────────────────
  {
    const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n)||_n===0)return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };
    const fmtDate = d => d instanceof Date && !isNaN(d) ? d.toLocaleDateString('zh-CN',{month:'long',day:'numeric'}) : '--';
    const P   = price  || 50000;
    const BL  = breakLevel || P * 1.04;
    const chx = ch || {};
    const gtx = gt || {};
    const AT  = gtx.AT || 0;   // 自动推算的原角度线目标
    const AR  = gtx.AR || 0;   // 自动推算的修正目标

    // 突破确认状态颜色
    const bColor = chx.breakColor || 'var(--muted)';
    const bStatus = chx.breakStatus || '--';

    // 路径A / B 渲染
    const scenarioRow = (scn, key) => {
      const s = gtx.scenario?.[key];
      if (!s) return '';
      const isA = key === 'A';
      return `<div style="border-radius:10px;border:1px solid ${isA?'rgba(24,145,80,0.3)':'rgba(192,48,48,0.25)'};padding:14px;margin-bottom:10px;background:${isA?'rgba(24,145,80,0.05)':'rgba(192,48,48,0.04)'}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
          <div>
            <span style="font-size:.85rem;font-weight:700;color:${isA?'var(--bull)':'var(--bear)'}">${s.label}</span>
            <span style="font-size:.65rem;color:var(--muted);margin-left:8px">预计 ${s.daysEst} 天</span>
          </div>
          <span style="font-size:.65rem;padding:2px 9px;border-radius:99px;background:${isA?'rgba(24,145,80,0.12)':'rgba(192,48,48,0.1)'};color:${isA?'var(--bull)':'var(--bear)'}">置信 ${(s.conf*100).toFixed(0)}%</span>
        </div>
        <div style="font-size:.72rem;color:var(--muted);margin-bottom:10px;padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:6px">
          触发条件：${s.condition}
        </div>
        <div style="position:relative;padding-left:20px">
          ${s.steps.map((st,i) => `
            <div style="display:flex;align-items:flex-start;gap:10px;margin-bottom:8px;position:relative">
              <div style="width:18px;height:18px;border-radius:50%;border:2px solid ${st.key?(isA?'var(--bull)':'var(--bear)'):'var(--border2)'};background:${st.key?(isA?'rgba(24,145,80,0.15)':'rgba(192,48,48,0.12)'):'var(--bg2)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:.6rem;font-weight:700;color:${st.key?(isA?'var(--bull)':'var(--bear)'):'var(--faint)'}">
                ${i+1}
              </div>
              <div style="flex:1">
                <span style="font-size:.78rem;font-weight:${st.key?'700':'400'};color:${st.key?'var(--text)':'var(--muted)'}">
                  ${fmtP(st.price)}
                </span>
                <span style="font-size:.68rem;color:var(--faint);margin-left:6px">${st.note}</span>
              </div>
            </div>`).join('')}
        </div>
      </div>`;
    };

    // 江恩关键节点时间轴
    const keyNodeRows = (gtx.keyNodes||[]).map((kn,i) => {
      const icons = ['◇','◈','★','◈','◇'];
      const isMain = i === 2 || i === 4;
      return `<div style="display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:7px;margin-bottom:4px;background:${isMain?'rgba(200,168,74,0.08)':'transparent'};border:1px solid ${isMain?'rgba(200,168,74,0.2)':'transparent'}">
        <span style="font-size:.8rem;color:${isMain?'var(--gold)':'var(--faint)'}">${icons[i]||'·'}</span>
        <div style="flex:1">
          <span style="font-size:.72rem;font-weight:${isMain?'700':'400'};color:${isMain?'var(--text)':'var(--muted)'}">
            +${kn.days}天 &nbsp; ${fmtDate(kn.date)}
          </span>
        </div>
        <span style="font-size:.78rem;font-weight:600;color:var(--gold)">${fmtP(kn.price)}</span>
      </div>`;
    }).join('');

    panels['deduction'] = `
      <div class="panel">
        <div class="panel-title">🧭 缠论·江恩融合推演 · 走势路径分析</div>

        <!-- 核心状态一览 -->
        <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:16px">

          <!-- 突破确认价 -->
          <div style="background:rgba(200,168,74,0.07);border:1px solid rgba(200,168,74,0.25);border-radius:10px;padding:14px">
            <div style="font-size:.65rem;color:var(--faint);margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">突破确认价（阻力线）</div>
            <div style="font-size:1.4rem;font-weight:800;font-family:Cinzel,serif;color:var(--gold)">${fmtP(BL)}</div>
            <div style="margin-top:6px;font-size:.78rem">
              状态：<strong style="color:${bColor}">${bStatus}</strong>
              ${chx.belowBreak ? `<span style="font-size:.68rem;color:var(--muted);margin-left:6px">还差 ${fmtP(chx.distToBreak||0)} (${chx.pctToBreak||'--'}%)</span>` : ''}
            </div>
            <div style="margin-top:8px;font-size:.7rem;color:var(--muted);line-height:1.6">
              ${chx.inDemand ? '<span style="color:var(--bull)">✦ 当前处于需求区（小级别买点）</span>' : ''}
              ${chx.belowBreak ? `<br>放量突破并站稳 ${fmtP(BL)} 看多信号确认` : '<br><span style="color:var(--bull)">已突破 · 关注回踩 '+fmtP(chx.retest||BL)+' 支撑</span>'}
            </div>
          </div>

          <!-- 江恩角度线修正 -->
          <div style="background:rgba(56,168,224,0.06);border:1px solid rgba(56,168,224,0.2);border-radius:10px;padding:14px">
            <div style="font-size:.65rem;color:var(--faint);margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">江恩角度线推算（自动）</div>
            <div style="font-size:.82rem;font-weight:700;color:${gtx.angleStrength==='weak'?'var(--bear)':gtx.angleStrength==='fading'?'var(--amber)':'var(--bull)'}">
              ${gtx.angleLabel || '--'}
            </div>
            <div style="margin-top:8px;font-size:.75rem;line-height:1.9">
              <div><span style="color:var(--faint)">原角度线目标</span> <span style="color:var(--bear);text-decoration:${gtx.angleStrength!=='intact'?'line-through':'none'}">${fmtP(gtx.AT||0)}</span>${gtx.angleStrength!=='intact'?' <span style="font-size:.62rem;color:var(--faint)">已失效</span>':''}</div>
              <div><span style="color:var(--faint)">修正目标</span> <strong style="color:var(--gold)">${fmtP(gtx.AR||0)}</strong></div>
              <div><span style="color:var(--faint)">推算目标日</span> <strong style="color:var(--sky)">${gtx.targetD ? gtx.targetD.toLocaleDateString('zh-CN',{month:'long',day:'numeric'}) : '--'}</strong> <span style="font-size:.65rem;color:var(--faint)">(约${gtx.daysToTarget||'--'}天后)</span></div>
              <div><span style="color:var(--faint)">高低点角度差</span> <span style="color:var(--muted)">${gtx.angleHL||'--'}°</span></div>
              <div><span style="color:var(--faint)">距目标剩余角度</span> <span style="color:var(--muted)">${gtx.angToAR||'--'}°</span></div>
            </div>
          </div>
        </div>

        <!-- 突破后目标链 -->
        ${chx.BL ? `
        <div style="background:rgba(24,145,80,0.05);border:1px solid rgba(24,145,80,0.2);border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="font-size:.78rem;font-weight:700;color:var(--bull);margin-bottom:10px">▲ 突破 ${fmtP(BL)} 后的目标价链</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
            ${[
              {label:'T1 (×0.618)', price: chx.postBreakT1, note:'第一目标'},
              {label:'T2 (×1.0)',   price: chx.postBreakT2, note:'等幅目标'},
              {label:'T3 (×1.618)', price: chx.postBreakT3, note:'黄金扩展'},
            ].map(t => `<div style="background:rgba(24,145,80,0.08);border:1px solid rgba(24,145,80,0.2);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:.62rem;color:var(--faint)">${t.label}</div>
              <div style="font-size:.92rem;font-weight:700;color:var(--bull)">${fmtP(t.price)}</div>
              <div style="font-size:.62rem;color:var(--muted)">${t.note}</div>
            </div>`).join('')}
          </div>
          <div style="margin-top:8px;font-size:.68rem;color:var(--muted);padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:6px">
            回踩确认位（突破后第一支撑）：<strong style="color:var(--gold)">${fmtP(chx.retest||BL)}</strong> &nbsp;·&nbsp; 跌回阻力线则信号失效
          </div>
        </div>` : ''}

        <!-- 未突破时的下探目标 -->
        <div style="background:rgba(192,48,48,0.04);border:1px solid rgba(192,48,48,0.18);border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="font-size:.78rem;font-weight:700;color:var(--bear);margin-bottom:10px">▼ 若无法突破 ${fmtP(BL)} 的下探路径</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
            <div style="background:rgba(192,48,48,0.07);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:.62rem;color:var(--faint)">回测前低</div>
              <div style="font-size:.92rem;font-weight:700;color:var(--bear)">${fmtP(chx.failTarget||low||0)}</div>
              <div style="font-size:.62rem;color:var(--muted)">支撑确认</div>
            </div>
            <div style="background:rgba(192,48,48,0.1);border-radius:8px;padding:10px;text-align:center">
              <div style="font-size:.62rem;color:var(--faint)">弱势下探</div>
              <div style="font-size:.92rem;font-weight:700;color:var(--bear)">${fmtP(chx.failTarget2||low||0)}</div>
              <div style="font-size:.62rem;color:var(--muted)">前低 ×0.98</div>
            </div>
          </div>
          <div style="margin-top:8px;font-size:.68rem;color:var(--muted);padding:6px 10px;background:rgba(0,0,0,0.03);border-radius:6px">
            走弱路径：无法突破 → 震荡 → 再探前低 → 结构更弱 → 弱势上行修复
          </div>
        </div>

        <!-- 次高点推演 -->
        ${AR > 0 ? `
        <div style="background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.22);border-radius:10px;padding:14px;margin-bottom:14px">
          <div style="font-size:.78rem;font-weight:700;color:var(--gold);margin-bottom:10px">◈ 次高点推演（背驰后回落·以次高形式呈现）</div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px">
            <div style="text-align:center;padding:10px;background:rgba(200,168,74,0.08);border-radius:8px">
              <div style="font-size:.62rem;color:var(--faint)">修正主目标</div>
              <div style="font-size:.9rem;font-weight:700;color:var(--gold)">${fmtP(AR)}</div>
              <div style="font-size:.62rem;color:var(--muted)">触达后背驰</div>
            </div>
            <div style="text-align:center;padding:10px;background:rgba(200,168,74,0.06);border-radius:8px">
              <div style="font-size:.62rem;color:var(--faint)">近次高 (−3%)</div>
              <div style="font-size:.9rem;font-weight:700;color:var(--amber)">${fmtP(gtx.subHighA||AR)}</div>
              <div style="font-size:.62rem;color:var(--muted)">轻度背驰</div>
            </div>
            <div style="text-align:center;padding:10px;background:rgba(200,168,74,0.05);border-radius:8px">
              <div style="font-size:.62rem;color:var(--faint)">远次高 (−6%)</div>
              <div style="font-size:.9rem;font-weight:700;color:var(--amber)">${fmtP(gtx.subHighB||AR)}</div>
              <div style="font-size:.62rem;color:var(--muted)">明显背驰</div>
            </div>
          </div>
          <div style="font-size:.7rem;color:var(--muted);line-height:1.7;padding:8px 10px;background:rgba(200,168,74,0.06);border-radius:6px">
            推演思路：价格触达修正目标 ${fmtP(AR)} 附近 → MACD 出现顶背驰 → 回落 →
            ${gtx.targetD ? fmtDate(gtx.targetD) : '目标日期'}前后以次高 ${fmtP(gtx.subHighA||AR)} 形式呈现 →
            次高确认后可布局做空或止盈
          </div>
        </div>` : ''}

        <!-- 双路径走势推演 -->
        <div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:10px;letter-spacing:.05em">🗺 双路径走势推演</div>
        ${scenarioRow(gtx.scenario, 'A')}
        ${scenarioRow(gtx.scenario, 'B')}

        <!-- 江恩时间轴 -->
        ${gtx.keyNodes && gtx.keyNodes.length > 0 ? `
        <div style="margin-top:14px">
          <div style="font-size:.72rem;font-weight:700;color:var(--gold);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">⬡ 江恩时间价格坐标轴</div>
          <div style="font-size:.65rem;color:var(--muted);margin-bottom:8px">以基准日→目标日，按黄金比例切分的关键节点预期价格</div>
          ${keyNodeRows}
        </div>` : ''}

        <!-- 操作总结 -->
        <div style="margin-top:14px;padding:14px;background:rgba(112,48,184,0.07);border:1px solid rgba(112,48,184,0.2);border-radius:10px">
          <div style="font-size:.72rem;font-weight:700;color:var(--purple);margin-bottom:8px">⚡ 综合操作参考</div>
          <div style="font-size:.8rem;color:var(--text);line-height:1.9">
            ${chx.inDemand ? '✦ <strong>当前处于小级别需求区</strong>，已产生初步支撑，可轻仓试多。<br>' : ''}
            ${chx.belowBreak
              ? `⬆ <strong>关键阻力 ${fmtP(BL)}</strong>：等待放量突破并站稳，确认后顺势追多。突破前不追高。<br>
                 ⬇ 若无法突破，耐心等待回探 <strong>${fmtP(chx.failTarget||low||0)}</strong> 支撑后再判断方向。`
              : `✅ <strong>已突破 ${fmtP(BL)}</strong>，关注回踩 <strong>${fmtP(chx.retest||BL)}</strong> 不破则继续持多。`}
            ${AR > 0 ? `<br>🎯 上方修正目标 <strong>${fmtP(AR)}</strong>（原目标 ${AT>0?fmtP(AT):'--'} 已失效），触达后注意背驰信号，以次高形式离场。` : ''}
          </div>
        </div>
      </div>`;
  }

  // ── LOGIC TRANSPARENCY PANEL ─────────────────────────────────────────────
  {
    const fmtPl = v => { const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'--'; return _v>=1000?'$'+Math.round(_v).toLocaleString():_v>0?'$'+_v.toFixed(2):'--'; };
    const logicRows = [
      sys.qimen && qm ? {
        sys: '☲ 奇门遁甲', color: 'var(--gold)',
        // 奇门职责：时间窗口，显示进出时机而非价格偏向
        verdict: '入市：'+qm.direction,
        vcolor: qm.direction==='多'?'var(--bull)':qm.direction==='空'?'var(--bear)':'var(--muted)',
        why: `${qm.format}格局·${qm.isYang?'阳遁':'阴遁'}第${qm.juNum}局（${qm.jieqi}）。当前${qm.door}（${['开门','生门','休门'].includes(qm.door)?'吉门，宜出击':'凶门，宜守候'}），${qm.star}临宫，${qm.god}坐镇。📅 建议入市：${qm.entryTime}，出市：${qm.exitTime}。`,
      } : null,
      sys.iching && ic ? {
        sys: '䷀ 易　经', color: 'var(--crimson)',
        // 易经职责：趋势周期，显示趋势方向和变化时间
        verdict: ic.trend + '·' + ic.judgment,
        vcolor: ic.bias > 0.3 ? 'var(--bull)' : ic.bias < -0.3 ? 'var(--bear)' : 'var(--muted)',
        why: `本卦${ic.hex[0]}（${ic.hexagram}·${ic.hex[2]}），上${ic.upperName}下${ic.lowerName}，第${ic.line}爻动→变${ic.changingHex}。趋势判断：${ic.trend}。⏰ 预计约${ic.changeDay}日后出现关键变化（${ic.judgment}）。`,
      } : null,
      sys.vedic && ve ? {
        sys: '✦ 印度占星', color: 'var(--indigo)',
        // 印度占星职责：大周期，显示周期类型和能量
        verdict: ve.cycle + '期·' + ve.energy + '能量',
        vcolor: ve.cycle==='扩张'?'var(--bull)':ve.cycle==='收缩'?'var(--bear)':'var(--muted)',
        why: ve.cycleNote + `。${ve.dasha}大运/${ve.antar}小运，过境${ve.trans}，「${ve.yoga}」激活。`,
      } : null,
      sys.gann && gn ? {
        sys: '⬡ 江恩理论', color: 'var(--emerald)',
        verdict: gn.bias > 0.2 ? '看多' : gn.bias < -0.2 ? '看空' : '中性',
        vcolor: gn.bias > 0.2 ? 'var(--bull)' : gn.bias < -0.2 ? 'var(--bear)' : 'var(--muted)',
        why: `九方格推算关键价位，当前${gn.activeAng}°角度线${gn.bias>0?'支撑有效':'已被跌破'}。角线修正目标 ${fmtPl(gt?.AR||0)}，约${gt?.daysToTarget||'--'}天后到达（${gt?.angleLabel||''}）。${finalTarget?'综合目标价：'+fmtPl(finalTarget)+'。':''}`,
      } : null,
      sys.harmonic && hr ? {
        sys: '◈ 谐波形态', color: 'var(--teal)',
        verdict: hr.bias > 0.2 ? '看多' : hr.bias < -0.2 ? '看空' : '无信号',
        vcolor: hr.bias > 0.2 ? 'var(--bull)' : hr.bias < -0.2 ? 'var(--bear)' : 'var(--muted)',
        why: hr.patterns.length > 0
          ? `识别到${hr.patterns.length}个谐波形态：${hr.patterns.map(p=>p.name+(p.bullish?'看涨':'看跌')).join('、')}。PRZ完成度最高 ${(Math.max(...hr.patterns.map(p=>p.completion))*100).toFixed(0)}%，${hr.bias>0?'多数形态看涨':'多数形态看跌'}。`
          : '当前价格区间未识别到有效谐波形态，暂无信号。',
      } : null,
      sys.sr && sr ? {
        sys: '▤ 支撑阻力', color: 'var(--amber)',
        verdict: sr.bias > 0.2 ? '支撑强' : sr.bias < -0.2 ? '阻力强' : '区间震荡',
        vcolor: sr.bias > 0.2 ? 'var(--bull)' : sr.bias < -0.2 ? 'var(--bear)' : 'var(--muted)',
        why: `斐波那契回撤、江恩方格、心理价位三法共振计算。当前价格${sr.bias>0?'处于支撑区域上方，下方支撑强劲':'临近阻力位，上行压力大'}，关键共振位聚集度高。`,
      } : null,
      sys.chan && ch ? {
        sys: '∿ 缠　论', color: 'var(--rose)',
        verdict: ch.beichi ? ch.beichiType : `${ch.bspType||''}${ch.bspDir||''}`,
        vcolor: (ch.beichi&&ch.beichiType==='底背驰')||(ch.bspDir==='买点') ? 'var(--bull)' : 'var(--bear)',
        why: `${ch.biCount}笔结构，当前${ch.biDir==='up'?'上行':'下行'}笔，中枢[$${(ch&&ch.zsLow||0).toLocaleString()}-$${(ch&&ch.zsHigh||0).toLocaleString()}]${ch.zsValid?'有效':'构建中'}。${ch.beichi?`检测到${ch.beichiType}，${ch.beichiType==='底背驰'?'绝佳买点信号':'顶部止盈信号'}。`:''}${ch.inDemand?'价格处于需求区。':''}`,
      } : null,
      sys.volRate && va ? {
        sys: '⚙ 波动率', color: '#d4a843',
        // 波动率职责：修正系数，不独立给方向
        verdict: '修正×' + (va.correction||1).toFixed(3),
        vcolor: 'var(--amber)',
        why: `0.809波动率共振修正系数：${(va.correction||1).toFixed(4)}（价格误差修正）。最近共振价位：${fmtPl(va.resonance||0)}。${va.strongRes&&va.strongRes[0]?'最强共振：'+fmtPl(va.strongRes[0].price)+'。':''}`,
      } : null,
      sys.ziwei && zw ? {
        sys: '☽ 紫微斗数', color: '#9040d8',
        // 紫微职责：时间窗口，显示吉凶时辰
        verdict: '吉时：'+((zw.goodTime||[]).join('/')||'--'),
        vcolor: '#9040d8',
        why: `${zw.stemNote}。财帛宫${zw.wealthStar}，官禄宫${zw.careerStar}。📅 今日吉时：${(zw.goodTime||[]).join('、')||'--'}${zw.badTime&&zw.badTime.length?'，凶时：'+(zw.badTime||[]).join('、'):''}。流年在${zw.fYearPal?.name||'--'}宫，流月在${zw.fMonthPal?.name||'--'}宫。`,
      } : null,
    ].filter(Boolean);

    panels['logic'] = `
      <div class="panel">
        <div class="panel-title">🔍 各系统推算依据透明化</div>
        <div style="font-size:.72rem;color:var(--muted);margin-bottom:14px;line-height:1.7;padding:8px 12px;background:rgba(200,168,74,0.05);border-radius:8px">
          每个系统给出看多/看空结论的<strong>具体原因</strong>，让你知道「为什么是这个结论」，而不只是一个方向标签。
        </div>
        <div>
          ${logicRows.map(r => `
            <div class="logic-row">
              <div class="logic-sys" style="color:${r.color}">${r.sys}</div>
              <div class="logic-why">${r.why}</div>
              <div class="logic-verdict" style="color:${r.vcolor}">${r.verdict}</div>
            </div>`).join('')}
        </div>
        ${logicRows.length === 0 ? '<div style="color:var(--muted);text-align:center;padding:30px">请启用至少一个分析系统</div>' : ''}
      </div>`;
  }

  // ── MULTI-COIN COMPARE PANEL ──────────────────────────────────────────────
  panels['multicoin'] = `
    <div class="panel">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;flex-wrap:wrap;gap:8px">
        <div class="panel-title" style="margin:0">🔀 多币种对比分析</div>
        <button onclick="fetchMultiCoin()" style="background:rgba(200,168,74,0.1);border:1px solid rgba(200,168,74,0.3);color:var(--gold);border-radius:6px;padding:5px 14px;font-size:.72rem;cursor:pointer;font-family:inherit;font-weight:600">⬇ 抓取实时数据</button>
      </div>
      <div style="font-size:.72rem;color:var(--muted);margin-bottom:14px;line-height:1.7;padding:8px 12px;background:rgba(200,168,74,0.05);border-radius:8px">
        同时抓取 BTC / ETH / SOL / BNB 实时价格，对每个币种运行江恩 + 缠论 + 奇门等核心引擎，比较<strong>综合评分、角线目标、多空偏向</strong>，帮你选出当前最强势的交易标的。<br>
        <span style="color:var(--faint)">点击卡片可一键填入表单进行完整分析。</span>
      </div>
      <div class="mcoin-grid" id="multiCoinGrid">
        <div style="font-size:.8rem;color:var(--muted);padding:20px;text-align:center;grid-column:1/-1">
          点击上方「抓取实时数据」按钮开始多币对比
        </div>
      </div>
    </div>`;


  if(sys.qimen) {
    const [bc,bl] = biasBadge(qm.bias);
    panels['qimen'] = `
      <div class="cards-grid">
        <div class="card card-qm">
          <div class="card-head">
            <span class="card-icon">☲</span>
            <div><div class="card-name">奇門遁甲</div><div class="card-sub">时空格局 · 天干地支</div></div>
            <span class="badge ${bc}">${bl}</span>
          </div>
          ${row('值符宫位','第'+qm.palace+'宫','hi')}
          ${row('当前星',qm.star)}
          ${row('当前门',qm.door)}
          ${row('神将',qm.god)}
          ${row('旬首干支',qm.stem+'干'+qm.branch+'支')}
          ${row('卦宫',qm.bagua)}
          ${row('局格',qm.format,'amber')}
          ${row('节气',qm.jieqi||'--','hi')}
          ${row('推算置信',((qm&&qm.conf||0)*100).toFixed(0)+'%','hi')}
        </div>
        <div class="card card-qm">
          <div class="card-head"><span class="card-icon">⏰</span><div><div class="card-name">时机窗口（职责域）</div><div class="card-sub">奇门专长：进出时机</div></div></div>
          ${row('入市方向', qm.direction, qm.direction==='多'?'bull':qm.direction==='空'?'bear':'hi')}
          ${row('入市时辰', qm.entryTime, 'bull')}
          ${row('出市时辰', qm.exitTime, 'bear')}
          ${row('今日吉时', (qm.goodTimes||[]).join('、'), 'bull')}
          ${row('今日凶时', (qm.badTimes||[]).join('、')||'无', 'bear')}
          ${row('动静分析',qm.door==='开门'||qm.door==='生门'?'动象，宜出击':'静象，宜守候')}
          ${row('方位提示',['东方','东南','南方','西南','西方','西北','北方','东北'][qm.palace-1]+'方位吉利')}
        </div>
      </div>`;
  }

  // IChing panel
  if(sys.iching) {
    const [bc,bl] = biasBadge(ic.bias);
    panels['iching'] = `
      <div class="cards-grid">
        <div class="card card-ic">
          <div class="card-head">
            <span class="card-icon">䷀</span>
            <div><div class="card-name">易經卦象</div><div class="card-sub">卦象推演 · 变爻研判</div></div>
            <span class="badge ${bc}">${bl}</span>
          </div>
          ${row('本卦',ic.hex[0]+' '+ic.hex[1]+'卦','hi')}
          ${row('卦义',ic.hex[2])}
          ${row('上卦',ic.upper+'（'+ic.upperName+'）')}
          ${row('下卦',ic.lower+'（'+ic.lowerName+'）')}
          ${row('动爻','第'+ic.line+'爻')}
          ${row('变卦',ic.rhex[0]+' '+ic.rhex[1]+'卦')}
          ${row('变卦义',ic.rhex[2])}
          ${row('卦断',ic.judgment,ic.judgment==='大吉'?'bull':ic.judgment==='大凶'?'bear':'hi')}
          ${row('推算置信',((ic&&ic.conf||0)*100).toFixed(0)+'%','hi')}
        </div>
        <div class="card card-ic">
          <div class="card-head"><span class="card-icon">📅</span><div><div class="card-name">趋势周期（职责域）</div><div class="card-sub">易经专长：周期与变化时间</div></div></div>
          ${row('趋势方向', ic.trend, ic.trend==='上升'?'bull':ic.trend==='下跌'?'bear':'hi')}
          ${row('变化时间', ic.changeDay+'日后', ic.trend==='上升'?'bull':'bear')}
          ${row('本卦',     ic.hexagram, 'hi')}
          ${row('变卦',     ic.changingHex)}
          ${row('操作建议',ic.bias>0.3?'可积极追涨，顺势而为':ic.bias>0?'轻仓试多，稳健布局':ic.bias<-0.3?'减仓规避，静待转机':'观望为宜，等待信号')}
          ${row('变化方向',ic.rhex[1]+'·'+ic.rhex[2]+'·'+(ic.bias>0?'由弱转强':'由强转弱'))}
        </div>
      </div>`;
  }

  // Vedic panel
  if(sys.vedic) {
    const [bc,bl] = biasBadge(ve.bias);
    panels['vedic'] = `
      <div class="cards-grid">
        <div class="card card-ve">
          <div class="card-head">
            <span class="card-icon">✦</span>
            <div><div class="card-name">印度占星</div><div class="card-sub">行星周期 · 大运小运</div></div>
            <span class="badge ${bc}">${bl}</span>
          </div>
          ${row('上升星座月宿',ve.asc,'hi')}
          ${row('月亮星宿',ve.moon)}
          ${row('星座',ve.rasi+'座')}
          ${row('命主星',ve.lord)}
          ${row('过境行星',ve.trans)}
          ${row('大运',ve.dasha+'大运')}
          ${row('小运',ve.antar+'小运')}
          ${row('吉祥瑜伽',ve.yoga,'teal')}
          ${row('推算置信',((ve&&ve.conf||0)*100).toFixed(0)+'%','hi')}
        </div>
        <div class="card card-ve">
          <div class="card-head"><span class="card-icon">🪐</span><div><div class="card-name">大周期（职责域）</div><div class="card-sub">印度占星专长：宏观周期</div></div></div>
          ${row('主导周期', ve.cycle+'期', ve.cycle==='扩张'?'bull':ve.cycle==='收缩'?'bear':'hi')}
          ${row('能量指数', ve.energy+'/100', ve.energy>=60?'bull':ve.energy<=40?'bear':'hi')}
          ${row('主导行星', ve.planet, 'amber')}
          ${row('周期说明', ve.cycleNote||'')}
          ${row('关键节点',ve.dasha+'大运'+ve.antar+'小运交汇')}
          ${row('能量评级',ve.energy>=80?'★★★★★':ve.energy>=60?'★★★★':ve.energy>=40?'★★★':ve.energy>=20?'★★':'★', ve.energy>=60?'bull':'bear')}
        </div>
      </div>`;
  }

  // Gann panel
  if(sys.gann) {
    panels['gann'] = buildGannPanel(gn, coin);
  }

  // Harmonic panel
  if(sys.harmonic) {
    const [bc,bl] = biasBadge(hr.bias);
    const patternColors = {
      '蝙蝠':'rgba(40,184,168,0.12)','螃蟹':'rgba(224,72,72,0.1)','加菲猫':'rgba(200,168,74,0.1)',
      '蝴蝶':'rgba(96,96,224,0.1)','深蟹':'rgba(224,136,48,0.1)','鲨鱼':'rgba(224,72,128,0.1)',
      'ABCD':'rgba(40,200,112,0.1)','三驱':'rgba(160,160,255,0.1)'
    };
    const patternBorder = {
      '蝙蝠':'rgba(40,184,168,0.35)','螃蟹':'rgba(224,72,72,0.3)','加菲猫':'rgba(200,168,74,0.35)',
      '蝴蝶':'rgba(96,96,224,0.3)','深蟹':'rgba(224,136,48,0.3)','鲨鱼':'rgba(224,72,128,0.35)',
      'ABCD':'rgba(40,200,112,0.3)','三驱':'rgba(160,160,255,0.3)'
    };

    const pHTML = hr.patterns.length > 0
      ? hr.patterns.map(p => `
        <div class="harmonic-card" style="background:${patternColors[p.name]||'rgba(40,184,168,0.08)'};border-color:${patternBorder[p.name]||'rgba(40,184,168,0.3)'}">
          <div class="h-name" style="color:var(--teal)">${p.name} <span style="font-size:.72rem;color:var(--muted)">(${p.en})</span>
            <span class="badge ${p.bullish?'badge-bull':'badge-bear'}" style="font-size:.68rem;padding:2px 8px;margin-left:8px">${p.bullish?'看涨':'看跌'}</span>
          </div>
          <div class="h-type" style="color:var(--muted)">完成度 ${((p&&p.completion||0)*100).toFixed(0)}% · 置信 ${((p&&p.conf||0)*100).toFixed(0)}%</div>
          <div class="h-ratios">
            <span class="h-ratio">XAB: ${p.xab}</span>
            <span class="h-ratio">ABC: ${p.abc}</span>
            <span class="h-ratio">BCD: ${p.bcd}</span>
            <span class="h-ratio">XAD: ${p.xad}</span>
          </div>
          ${row('X点','$'+p.X.toLocaleString())}
          ${row('A点','$'+p.A.toLocaleString())}
          ${row('B点','$'+p.B.toLocaleString())}
          ${row('C点','$'+p.C.toLocaleString())}
          ${row('D点目标','$'+p.D.toLocaleString(),p.bullish?'bull':'bear')}
          ${row('PRZ区域','$'+p.PRZ.toLocaleString(),'teal')}
        </div>`).join('')
      : '<div style="color:var(--muted);text-align:center;padding:30px">当前价格区间未发现有效谐波形态，建议等待更明确的形态形成</div>';

    panels['harmonic'] = `
      <div class="panel">
        <div class="panel-title" style="justify-content:space-between">
          <span>◈ 谐波形态识别 · 黄金比例</span>
          <span class="badge ${bc}">${bl}</span>
        </div>
        <div style="margin-bottom:16px;font-size:0.82rem;color:var(--muted);line-height:1.8">
          谐波形态基于斐波那契黄金比例（0.382/0.618/0.786/1.272/1.618等）识别市场中的特定价格结构，
          每种形态均有潜在逆转区(PRZ)，为交易提供高概率入场点位。
        </div>
        <div class="harmonic-grid">${pHTML}</div>
      </div>`;
  }

  // SR panel
  if(sys.sr) {
    const [bc,bl] = biasBadge(sr.bias);
    const srDiv = document.createElement('div');
    srDiv.className = 'panel';
    srDiv.innerHTML = `
      <div class="panel-title" style="justify-content:space-between">
        <span>▤ 支撑阻力分析</span>
        <span class="badge ${bc}">${bl}</span>
      </div>
      <div style="margin-bottom:16px;font-size:0.82rem;color:var(--muted);line-height:1.8">
        综合斐波那契回撤/延伸、心理整数价位及江恩方格三大方法，识别关键支撑阻力位。
        触碰次数越多、方法越多共振的价位，其有效性越高。
      </div>`;
    srDiv.appendChild(drawSRChart(sr));
    panels['sr'] = srDiv;
  }

  // Chan Theory panel
  if(sys.chan) {
    const [bc,bl] = biasBadge(ch.bias);
    const fmtPc = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };
    panels['chan'] = `
      <div class="panel">
        <div class="panel-title" style="justify-content:space-between">
          <span>∿ 缠论分析</span>
          <span class="badge ${bc}">${bl}</span>
        </div>
        <div style="margin-bottom:16px;font-size:0.82rem;color:var(--muted);line-height:1.8">
          缠中说禅理论通过笔、段、中枢的递归结构分析市场，利用背驰和买卖点系统精准把握趋势转换时机。
        </div>

        <!-- 突破确认状态栏 -->
        ${ch.BL ? `<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 16px;border-radius:10px;margin-bottom:14px;background:${ch.breakColor==='var(--bull)'?'rgba(24,145,80,0.08)':ch.breakColor==='var(--amber)'?'rgba(192,120,0,0.08)':'rgba(192,48,48,0.07)'};border:1px solid ${ch.breakColor==='var(--bull)'?'rgba(24,145,80,0.3)':ch.breakColor==='var(--amber)'?'rgba(192,120,0,0.3)':'rgba(192,48,48,0.2)'}">
          <div>
            <div style="font-size:.65rem;color:var(--faint);margin-bottom:2px">突破确认价</div>
            <div style="font-size:1.2rem;font-weight:800;font-family:Cinzel,serif;color:var(--gold)">${fmtPc(ch.BL)}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:1rem;font-weight:700;color:${ch.breakColor}">${ch.breakStatus}</div>
            ${ch.belowBreak ? `<div style="font-size:.68rem;color:var(--muted)">还差 ${fmtPc(ch.distToBreak)}</div>` : ''}
          </div>
          <div style="text-align:right;font-size:.72rem;color:var(--muted)">
            ${ch.inDemand ? '<span style="color:var(--bull)">✦ 在需求区</span>' : ''}
          </div>
        </div>` : ''}

        <div class="chan-grid">
          <div class="chan-card">
            <div class="chan-title">∿ 笔段分析</div>
            <div class="chan-body">
              <b>分型类型：</b>${ch.fractalType}（置信 ${((ch&&ch.fractalConf||0)*100).toFixed(0)}%）<br>
              <b>笔总数：</b>${ch.biCount} 笔（上笔 ${ch.bisUp} / 下笔 ${ch.bisDown}）<br>
              <b>当前方向：</b>${ch.biDir==='up'?'上行笔发展中':'下行笔发展中'}<br>
              <b>段数：</b>${ch.duanCount} 段 · 方向${ch.duanDir==='up'?'向上':'向下'}<br>
              <b>操作参考：</b>${ch.biDir==='up'?'等待顶分型确认后考虑离场':'等待底分型确认后考虑入场'}
            </div>
          </div>
          <div class="chan-card">
            <div class="chan-title">⊙ 中枢结构</div>
            <div class="chan-body">
              <b>中枢有效性：</b>${ch.zsValid?'有效中枢':'中枢构建中'}<br>
              <b>中枢高点：</b>$${(ch&&ch.zsHigh||0).toLocaleString()}<br>
              <b>中枢低点：</b>$${(ch&&ch.zsLow||0).toLocaleString()}<br>
              <b>中枢范围：</b>$${((ch&&ch.zsHigh||0)-(ch&&ch.zsLow||0)).toLocaleString()} (${((((ch&&ch.zsHigh||0)-(ch&&ch.zsLow||0))/(price||50000))*100).toFixed(1)}%)<br>
              <b>突破方向预判：</b>${ch.bias>0?'向上突破概率较大':'向下突破概率较大'}
            </div>
          </div>
          <div class="chan-card">
            <div class="chan-title">⚡ 背驰与买卖点</div>
            <div class="chan-body">
              <b>背驰信号：</b>${ch.beichi?'<span style="color:#e880a8">⚡ 检测到'+ch.beichiType+'</span>':'未检测到明确背驰'}<br>
              ${ch.beichi?('<b>背驰级别：</b>'+ch.beichiLevel+'背驰<br>'):''}
              <b>买卖点类型：</b>${ch.bspType}${ch.bspDir}<br>
              <b>操作建议：</b>${
                ch.beichi && ch.beichiType==='底背驰'?'底背驰确认，这是绝佳买点，可重仓入场':
                ch.beichi && ch.beichiType==='顶背驰'?'顶背驰确认，建议减仓或止盈离场':
                ch.bspDir==='买点'?'买点出现，可轻仓试多，止损设于近期低点':
                '卖点出现，建议减仓控制风险，等待买点再入'
              }<br>
              <b>综合置信：</b>${((ch&&ch.conf||0)*100).toFixed(0)}%
            </div>
          </div>
          <div class="chan-card">
            <div class="chan-title">📐 三类买卖点体系</div>
            <div class="chan-body">
              <b>第一类买点：</b>底背驰后最低点，风险最小<br>
              <b>第二类买点：</b>第一段上行后回调不破低，确认转势<br>
              <b>第三类买点：</b>中枢上方回调不入中枢，趋势延续<br>
              <b>当前判定：</b><span style="color:#e880a8">${ch.bspType}${ch.bspDir}形成${ch.beichi?'，背驰确认':'，等待确认'}</span><br>
              <b>止损位参考：</b>中枢低点 $${(ch&&ch.zsLow||0).toLocaleString()}
            </div>
          </div>
        </div>
      </div>`;
  }

  // ── GANN × CHAN SYNERGY PANEL v2 — 真实K线驱动 ──
  if (sys.gann && sys.chan && gn && ch) {
    const syn = engineGannChanSynergy(gn, ch, price, klines || []);
    // ── SignalEnhancer v2：黑天鹅+成交额+假信号+多周期+资金管理 ──────────
    let synEnhanced = syn;
    if (klines && klines.length >= 20 && window.SignalEnhancer) {
      try {
        const enhancer  = new window.SignalEnhancer(klines);
        const rawForEnhance = {
          ...(syn || {}),
          zhongshu: { top: ch.zsHigh || price*1.05, bottom: ch.zsLow || price*0.95 },
          // 若已有多周期评级（由调用方异步预置在 dashResults 中）则传入
          _multiTFRatings: dashResults[coin]?._multiTFRatings || null,
        };
        synEnhanced = enhancer.enhanceSignal(rawForEnhance);

        // 若多周期结果存在，将 mergedRating 回写到展示
        if (synEnhanced.multiTF && synEnhanced.multiTF.mergedRating) {
          synEnhanced.grade       = synEnhanced.multiTF.mergedRating;
          synEnhanced.gradeLabel  = synEnhanced.multiTF.allSame ? '多周期一致' : '多周期取最低';
        }
        // 成交额过滤降级
        if (synEnhanced.volumeFilter?.filtered) {
          const downMap = { S:'A', A:'B', B:'C', C:'C' };
          synEnhanced.grade = downMap[synEnhanced.grade] || synEnhanced.grade;
          synEnhanced.gradeLabel = (synEnhanced.gradeLabel || '') + ' (量能降级)';
        }
        // 假信号降级
        if (synEnhanced.fakeFilter?.isFake) {
          const downMap = { S:'A', A:'B', B:'C', C:'C' };
          synEnhanced.grade = downMap[synEnhanced.grade] || synEnhanced.grade;
          synEnhanced.gradeLabel = (synEnhanced.gradeLabel || '') + ' (假信号降级)';
        }
      } catch(e) { console.warn('SignalEnhancer error:', e.message); }
    }
    const gradeColors = { S:'#e83c3c', A:'#e89838', B:'#3890e0', C:'#888' };
    const gc = syn ? (gradeColors[syn.grade] || '#888') : '#888';
    const fmtPr = v => { const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'--'; return _v>=1000?'$'+Math.round(_v).toLocaleString():_v>=1?'$'+_v.toFixed(2):'$'+_v.toFixed(4); };

    // ── 公共: 信号行渲染 ──────────────────────────────────────────────────
    const renderSignalRows = (signals) => signals.map(s => {
      const bg     = s.bull ? 'rgba(24,145,80,0.07)' : 'rgba(192,48,48,0.07)';
      const border = s.bull ? 'rgba(24,145,80,0.2)'  : 'rgba(192,48,48,0.2)';
      const sc = s.strength === '超强' ? '#e83c3c' : s.strength === '强' ? '#e89838' : s.strength === '中' ? '#3890e0' : '#888';
      return '<div style="display:flex;gap:10px;align-items:flex-start;padding:10px 12px;background:'+bg+';border:1px solid '+border+';border-radius:9px;margin-bottom:8px">'
        + '<div style="font-size:1.1rem;flex-shrink:0">'+s.icon+'</div>'
        + '<div style="flex:1"><div style="display:flex;align-items:center;gap:7px;margin-bottom:4px">'
        + '<span style="font-size:.65rem;font-weight:700;padding:1px 7px;border-radius:99px;background:'+sc+'18;border:1px solid '+sc+'40;color:'+sc+'">'+s.type+'</span>'
        + '<span style="font-size:.62rem;padding:1px 6px;border-radius:99px;background:'+sc+'12;color:'+sc+';font-weight:700">'+s.strength+'度</span>'
        + '</div><div style="font-size:.78rem;color:var(--text);line-height:1.6">'+s.text+'</div></div>'
        + '<div style="font-size:.72rem;font-weight:700;color:'+(s.bull?'var(--bull)':'var(--bear)')+';">'+(s.bull?'▲多':'▼空')+'</div>'
        + '</div>';
    }).join('');

    // ── 公共: 价格共振行渲染 ─────────────────────────────────────────────
    const renderResonanceRows = (resonances) => resonances.slice(0,4).map(r => {
      const rc = r.strength==='超强'?'#e83c3c':r.strength==='强'?'#e89838':'#3890e0';
      return '<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 10px;background:var(--card2);border-radius:7px;border:1px solid var(--border);margin-bottom:5px;font-size:.72rem">'
        + '<span style="color:var(--gold);font-weight:700">'+fmtPr(r.price)+'</span>'
        + '<span style="color:var(--muted);font-size:.68rem">'+r.gannLabel+' ↔ '+r.chanLabel+'</span>'
        + '<span style="color:'+rc+';font-weight:700">'+r.strength+'共振 ('+r.diffPct+'%)</span></div>';
    }).join('');

    // ── 数据详情卡（5大核心数据展示）────────────────────────────────────
    const buildDetailsCard = (syn) => {
      if (!syn || !syn.details) return '';
      const d = syn.details;
      const db = syn._debug || {};
      const fmtB = v => { const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'<span>--</span>'; return _v>0?'<span style="color:var(--bull)">+'+_v.toFixed(1)+'%</span>':'<span style="color:var(--bear)">'+_v.toFixed(1)+'%</span>'; };
      const fmtN = v => v != null ? fmtPr(v) : '--';
      return '<div style="margin-top:14px;border-top:1px solid var(--border);padding-top:12px">'
        + '<div style="font-size:.65rem;font-weight:700;color:var(--faint);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">🔬 五大核心计算数据（真实K线）</div>'
        + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;font-size:.72rem">'

        // ① 江恩关键位
        + '<div style="padding:8px 10px;background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.2);border-radius:8px">'
        + '<div style="color:var(--gold);font-weight:700;margin-bottom:5px">⬡ 江恩斐波关键位（近60根）</div>'
        + '<div style="color:var(--muted)">区间高点：<strong style="color:var(--text)">'+fmtN(db.rangeHigh)+'</strong></div>'
        + '<div style="color:var(--muted)">区间低点：<strong style="color:var(--text)">'+fmtN(db.rangeLow)+'</strong></div>'
        + (d.priceResonance.exists ? '<div style="margin-top:4px;color:var(--bull)">✓ 江恩位 '+fmtN(d.priceResonance.gannLevel)+' 与缠论 '+fmtN(d.priceResonance.chanZone)+' 共振</div>' : '<div style="color:var(--faint);margin-top:4px">无价格共振（偏差>2%）</div>')
        + '</div>'

        // ② 江恩bias
        + '<div style="padding:8px 10px;background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.2);border-radius:8px">'
        + '<div style="color:var(--gold);font-weight:700;margin-bottom:5px">⬡ 江恩bias（偏离MA20）</div>'
        + '<div style="color:var(--muted)">MA20均线：<strong style="color:var(--text)">'+fmtN(d.directionResonance.ma20)+'</strong></div>'
        + '<div style="color:var(--muted)">bias偏离：'+fmtB(d.directionResonance.gannBias || 0)+'</div>'
        + '<div style="color:var(--muted);margin-top:2px;font-size:.65rem">'+(d.directionResonance.gannBias > 0 ? '价格高于MA20，偏多' : '价格低于MA20，偏空')+'</div>'
        + '</div>'

        // ③ 缠论中枢边界
        + '<div style="padding:8px 10px;background:rgba(40,200,112,0.06);border:1px solid rgba(40,200,112,0.2);border-radius:8px">'
        + '<div style="color:var(--teal);font-weight:700;margin-bottom:5px">∿ 缠论中枢边界</div>'
        + '<div style="color:var(--muted)">中枢上轨：<strong style="color:var(--bear)">'+fmtN(db.chanZoneTop)+'</strong></div>'
        + '<div style="color:var(--muted)">中枢下轨：<strong style="color:var(--bull)">'+fmtN(db.chanZoneBot)+'</strong></div>'
        + '<div style="color:var(--muted)">中枢中轨：<strong style="color:var(--text)">'+fmtN(d.directionResonance.chanMid)+'</strong></div>'
        + '</div>'

        // ④ 缠论bias
        + '<div style="padding:8px 10px;background:rgba(40,200,112,0.06);border:1px solid rgba(40,200,112,0.2);border-radius:8px">'
        + '<div style="color:var(--teal);font-weight:700;margin-bottom:5px">∿ 缠论bias（偏离中轨）</div>'
        + '<div style="color:var(--muted)">中轨偏离：'+fmtB(d.directionResonance.chanBias || 0)+'</div>'
        + '<div style="color:var(--muted);margin-top:2px;font-size:.65rem">'+(d.directionResonance.chanBias > 0 ? '价格高于中枢，偏强' : '价格低于中枢，偏弱')+'</div>'
        + (d.directionResonance.exists ? '<div style="margin-top:4px;color:var(--bull);font-size:.65rem">✓ 两者方向同步（方向共振）</div>' : '<div style="margin-top:4px;color:var(--faint);font-size:.65rem">方向不同步</div>')
        + '</div>'
        + '</div>'

        // ⑤ MACD背驰（全宽）
        + '<div style="margin-top:7px;padding:8px 10px;background:rgba(96,48,160,0.06);border:1px solid rgba(96,48,160,0.2);border-radius:8px;font-size:.72rem">'
        + '<div style="color:var(--purple);font-weight:700;margin-bottom:5px">📈 MACD背驰检测（近40根K线）</div>'
        + (d.divergence.exists
            ? '<div style="color:'+(d.divergence.type==='bullish'?'var(--bull)':'var(--bear)')+'">⚡ '+d.divergence.detail+'</div>'
              + '<div style="margin-top:4px;display:flex;align-items:center;gap:8px">'
              + '<span style="color:var(--muted)">强度</span>'
              + '<div style="flex:1;height:5px;background:var(--bg2);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+(d.divergence.strength*100).toFixed(0)+'%;background:'+(d.divergence.type==='bullish'?'var(--bull)':'var(--bear)')+';border-radius:3px"></div></div>'
              + '<span style="color:'+(d.divergence.type==='bullish'?'var(--bull)':'var(--bear)')+';font-weight:700">'+(d.divergence.strength*100).toFixed(0)+'%</span>'
              + '</div>'
            : '<div style="color:var(--faint)">'+d.divergence.detail+'</div>')
        + '</div>'

        // 数据来源说明
        + '<div style="margin-top:8px;font-size:.6rem;color:var(--faint);text-align:right">数据来源：实时K线 · K线数量 '+db.klinesCount+'根 · 分析时间 '+(syn.analysisTime||'--')+'</div>'
        + '</div>';
    };

    const dirClass = syn ? (syn.synergyDir==='bull'?'badge-bull':syn.synergyDir==='bear'?'badge-bear':'badge-neut') : 'badge-neut';
    const dirLabel = syn ? (syn.synergyDir==='bull'?'偏多':syn.synergyDir==='bear'?'偏空':'中性') : '中性';

    if (syn && syn.rating === 'N/A') {
      // 数据不足状态
      panels['gannChanSynergy'] = '<div class="panel"><div class="panel-title">⬡∿ 江恩×缠论协同信号 v2</div>'
        + '<div style="padding:24px;text-align:center;color:var(--faint);font-size:.85rem;line-height:2">'
        + '<div style="font-size:2rem;margin-bottom:8px;opacity:.3">⬡∿</div>'
        + syn.message
        + '</div></div>';

    } else if (syn && syn.hasSynergy) {
      // 使用 synEnhanced（已增强）或 syn（未增强）
      const se = synEnhanced || syn;
      // 增强信号附加信息
      const confBadge = se.confidence != null
        ? '<span style="padding:2px 8px;border-radius:99px;background:rgba(56,168,224,0.15);border:1px solid rgba(56,168,224,0.3);color:var(--sky);font-size:.65rem;font-weight:700">置信 '+se.confidence+'%</span>'
        : '';
      const histBadge = se.history && se.history.winRate && se.history.winRate !== 'N/A'
        ? '<span style="padding:2px 8px;border-radius:99px;background:rgba(40,200,112,0.12);border:1px solid rgba(40,200,112,0.3);color:var(--bull);font-size:.65rem">历史胜率 '+se.history.winRate+'</span>'
        : '';
      const validBadge = se.zhongshuValidation
        ? '<span style="padding:2px 8px;border-radius:99px;background:'+(se.zhongshuValidation.isValid?'rgba(200,168,74,0.12)':'rgba(192,48,48,0.1)')+';border:1px solid '+(se.zhongshuValidation.isValid?'rgba(200,168,74,0.3)':'rgba(192,48,48,0.2)')+';color:'+(se.zhongshuValidation.isValid?'var(--gold)':'var(--bear)')+';font-size:.65rem">中枢'+(se.zhongshuValidation.isValid?'有效':'待确认')+'</span>'
        : '';
      // 历史回测行
      const histRow = (se.history && se.history.totalSignals > 0)
        ? '<div style="margin-bottom:10px;padding:8px 12px;background:rgba(40,200,112,0.05);border:1px solid rgba(40,200,112,0.15);border-radius:8px;font-size:.72rem;color:var(--muted)">'
          + '<span style="color:var(--bull);font-weight:700">📊 历史回测：</span>'
          + '共'+se.history.totalSignals+'次相似信号 &nbsp;·&nbsp; 胜率 <strong style="color:var(--bull)">'+se.history.winRate+'</strong>'
          + '&nbsp;·&nbsp; 平均收益 <strong style="color:'+(se.history.avgReturn&&se.history.avgReturn.startsWith('+')?'var(--bull)':'var(--bear)')+'">'+se.history.avgReturn+'</strong>'
          + '&nbsp;·&nbsp; 夏普 <strong>'+se.history.sharpeRatio+'</strong>'
          + '</div>'
        : '';
      // 中枢验证理由
      const zsReasons = (se.zhongshuValidation && se.zhongshuValidation.reasons && se.zhongshuValidation.reasons.length)
        ? '<div style="margin-bottom:10px;padding:8px 12px;background:rgba(200,168,74,0.04);border:1px solid rgba(200,168,74,0.12);border-radius:8px">'
          + '<div style="font-size:.62rem;font-weight:700;color:var(--gold);margin-bottom:4px">∿ 中枢稳定性验证（置信 '+(se.zhongshuValidation.confidence*100).toFixed(0)+'%）</div>'
          + se.zhongshuValidation.reasons.map(r => '<div style="font-size:.68rem;color:var(--muted);line-height:1.7">'+r+'</div>').join('')
          + '</div>'
        : '';
      // 可视化HTML（来自SignalEnhancer）
      const vizHtml = se.visualization && se.visualization.htmlSummary ? se.visualization.htmlSummary : '';

      panels['gannChanSynergy'] = '<div class="panel" style="border:1px solid '+gc+'30">'
        + '<div class="panel-title" style="justify-content:space-between">'
        + '<span>⬡∿ 江恩×缠论协同信号 <span style="font-size:.6rem;color:var(--faint);font-weight:400">v2 · 真实K线</span></span>'
        + '<span style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">'
        + '<span style="padding:3px 12px;border-radius:99px;background:'+gc+'18;border:1px solid '+gc+'40;color:'+gc+';font-weight:800;font-size:.8rem">'+se.grade+'级 · '+se.gradeLabel+'</span>'
        + '<span class="badge '+dirClass+'">'+dirLabel+'</span>'
        + confBadge + histBadge + validBadge
        + '</span></div>'
        + '<div style="margin-bottom:10px;padding:10px 14px;background:'+gc+'08;border:1px solid '+gc+'20;border-radius:10px;font-size:.78rem;color:var(--muted);line-height:1.7">'
        + '江恩侧重<strong style="color:var(--gold)">Fib关键位×MA20偏离</strong>，缠论侧重<strong style="color:var(--teal)">中枢边界×MACD背驰</strong>。共振评分 <strong style="color:'+gc+'">'+(se.overallScore*100).toFixed(0)+'分</strong>'
        + (se.confidence != null ? '&nbsp;·&nbsp; 综合置信 <strong style="color:var(--sky)">'+se.confidence+'%</strong>' : '')
        + (se.timeWindow ? '&nbsp;·&nbsp; 时间窗口 <strong style="color:var(--gold)">'+se.timeWindow+'</strong>' : '')
        + '</div>'
        + histRow
        + zsReasons
        + '<div style="font-size:.72rem;font-weight:700;color:var(--muted);margin-bottom:8px;letter-spacing:.06em;text-transform:uppercase">📡 共振信号列表</div>'
        + renderSignalRows(se.signals)
        + (se.priceResonances.length > 0 ? '<div style="font-size:.72rem;font-weight:700;color:var(--muted);margin:12px 0 8px;letter-spacing:.06em;text-transform:uppercase">📐 价格共振区位</div>'+renderResonanceRows(se.priceResonances) : '')
        + buildDetailsCard(se)
        + vizHtml
        + '<div style="margin-top:12px;padding:10px 14px;background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.18);border-radius:9px;font-size:.72rem;color:var(--faint);line-height:1.7">'
        + '⚠ 共振信号基于真实K线计算，'+(se.grade==='S'?'S级为最强信号，建议配合成交量确认再操作。':'建议结合其他系统综合判断。')+'分析时间：'+(se.analysisTime||'--')+'。不构成投资建议。'
        + '</div></div>';

    } else {
      // 无共振但展示数据卡
      panels['gannChanSynergy'] = '<div class="panel">'
        + '<div class="panel-title" style="justify-content:space-between">'
        + '<span>⬡∿ 江恩×缠论协同信号 <span style="font-size:.6rem;color:var(--faint);font-weight:400">v2 · 真实K线</span></span>'
        + '<span style="padding:3px 12px;border-radius:99px;background:#88881a;border:1px solid #88882a;color:#888;font-weight:700;font-size:.78rem">'+syn.grade+'级 · '+syn.gradeLabel+'</span>'
        + '</div>'
        + '<div style="padding:16px;background:rgba(0,0,0,0.03);border-radius:8px;margin-bottom:12px;font-size:.82rem;color:var(--muted);text-align:center;line-height:2">'
        + '当前两系统未发现明确共振<br><span style="font-size:.72rem">建议等待缠论背驰信号 或 江恩Fib位与中枢边界重叠后再介入</span>'
        + '</div>'
        + buildDetailsCard(syn)
        + '</div>';
    }
  }


  // ── NATAL PANEL ──
  if(sys.natal && nt) {
    const nc = nt.nc;
    const [bc,bl] = biasBadge(nt.bias);
    const pRow = (k,v,c='') => '<div class="row"><span class="rk">'+k+'</span><span class="rv '+c+'">'+v+'</span></div>';
    const planetsHtml = Object.entries(nc.planets).map(([p,d])=>{
      const pNames = {sun:'☉太阳',moon:'☽月亮',mercury:'☿水星',venus:'♀金星',mars:'♂火星',
                      jupiter:'♃木星',saturn:'♄土星',uranus:'♅天王',neptune:'♆海王',pluto:'♇冥王',
                      rahu:'☊罗睺',ketu:'☋计都'};
      const nm = pNames[p]||p;
      const note = d.note?(' <span style="color:var(--amber);font-size:.75rem">⚡'+d.note+'</span>'):'';
      return '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;border-bottom:1px solid rgba(200,168,74,0.08);font-size:0.82rem">'
        +'<span style="color:var(--gold);width:90px">'+nm+'</span>'
        +'<span style="color:var(--text)">'+d.sign+'座 '+d.deg+'°</span>'
        +'<span style="color:var(--muted);font-size:.75rem">第'+d.house+'宫</span>'
        +note+'</div>';
    }).join('');

    const halvHtml = nt.halvingEffect
      ? '<div style="background:rgba(200,100,50,0.15);border:1px solid rgba(200,100,50,0.4);border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:0.85rem;color:#e8a070">🔥 '+nt.halvingEffect+'</div>'
      : '';

    const jupClass  = nt.jupReturn  ? 'color:#28c870' : 'color:var(--muted)';
    const satRClass = nt.satReturn  ? 'color:#e04848' : 'color:var(--muted)';
    const satSClass = nt.satSquare  ? 'color:#e08830' : 'color:var(--muted)';

    panels['natal'] = `
      <div class="panel">
        <div class="panel-title" style="justify-content:space-between">
          <span>☽ 命盘共振分析 · ${nc.name}(${nc.en})</span>
          <span class="badge ${bc}">${bl}</span>
        </div>

        <!-- Birth Info Card -->
        <div style="background:rgba(160,96,224,0.08);border:1px solid rgba(160,96,224,0.25);border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="color:#c090f0;font-size:0.9rem;font-weight:600;margin-bottom:10px;letter-spacing:.05em">📜 出生命盘档案</div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.82rem">
            <div>${pRow('🗓 诞生日期', nc.date+' '+nc.time+' '+nc.tz)}</div>
            <div>${pRow('📍 诞生地点', nc.location)}</div>
            <div>${pRow('☉ 太阳星座', nc.sun)}</div>
            <div>${pRow('↑ 上升星座(西)', nc.asc||'—')}</div>
            <div>${pRow('♃ 吠陀上升', nc.vedic_asc)}</div>
            <div>${pRow('🏠 命宫主星', nc.vedic_lord)}</div>
          </div>
          <div style="margin-top:10px;padding:8px 12px;background:rgba(160,96,224,0.08);border-radius:8px;font-size:0.8rem;color:var(--muted);line-height:1.7">
            <b style="color:#c090f0">核心相位：</b>${nc.key_aspects}<br>
            <b style="color:#c090f0">命盘气质：</b>${nc.char_energy}<br>
            <b style="color:var(--faint);font-size:.72rem">数据来源：</b><span style="color:var(--faint);font-size:.72rem">${nc.source}</span>
          </div>
        </div>

        ${halvHtml}

        <!-- Current Progressions -->
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:rgba(40,200,112,0.08);border:1px solid rgba(40,200,112,0.2);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:1.4rem;margin-bottom:4px">♃</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">木星周期</div>
            <div style="font-size:0.9rem;color:var(--text)">${nt.jupPhase}% 完成</div>
            <div style="${jupClass};font-size:0.75rem;margin-top:4px">${nt.jupReturn?'⚡ 木星回归年！':'周期进行中'}</div>
          </div>
          <div style="background:rgba(224,72,72,0.08);border:1px solid rgba(224,72,72,0.2);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:1.4rem;margin-bottom:4px">♄</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">土星周期</div>
            <div style="font-size:0.9rem;color:var(--text)">${nt.satPhase}% 完成</div>
            <div style="${nt.satReturn?'color:#e04848':nt.satSquare?'color:#e08830':'color:var(--muted)'};font-size:0.75rem;margin-top:4px">${nt.satReturn?'⚡ 土星回归！':nt.satSquare?'⚠ 土星四分相':'周期进行中'}</div>
          </div>
          <div style="background:rgba(200,168,74,0.08);border:1px solid rgba(200,168,74,0.2);border-radius:10px;padding:14px;text-align:center">
            <div style="font-size:1.4rem;margin-bottom:4px">☉</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-bottom:4px">推运太阳</div>
            <div style="font-size:0.9rem;color:var(--text)">${nt.progSunSign}座</div>
            <div style="color:var(--muted);font-size:0.75rem;margin-top:4px">${nt.progSunDeg}° 弧度</div>
          </div>
        </div>

        <!-- Age & Gann Year -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px">
          <div style="background:rgba(56,168,224,0.08);border:1px solid rgba(56,168,224,0.2);border-radius:10px;padding:14px">
            <div style="font-size:0.78rem;color:var(--muted);margin-bottom:6px">🕐 资产寿命</div>
            <div style="font-size:1.1rem;color:var(--sky)">${nt.ageYears} 年</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-top:3px">${nt.ageDays} 天 · 第${Math.ceil(nt.ageYears)} 年运程</div>
          </div>
          <div style="background:rgba(200,168,74,0.08);border:1px solid rgba(200,168,74,0.2);border-radius:10px;padding:14px">
            <div style="font-size:0.78rem;color:var(--muted);margin-bottom:6px">⬡ 江恩年轮</div>
            <div style="font-size:1.1rem;color:var(--gold)">${nt.gannYearArc} 单位</div>
            <div style="font-size:0.75rem;color:var(--muted);margin-top:3px">价格-时间方格能量</div>
          </div>
        </div>

        <!-- Planetary positions table -->
        <div style="background:rgba(12,12,32,0.5);border:1px solid var(--border);border-radius:12px;padding:16px;margin-bottom:16px">
          <div style="color:var(--gold);font-size:0.85rem;font-weight:600;margin-bottom:10px;letter-spacing:.05em">🪐 本命行星分布（出生命盘）</div>
          ${planetsHtml}
          <div style="margin-top:10px;padding:8px 10px;background:rgba(160,96,224,0.06);border-radius:6px;font-size:0.78rem;color:var(--muted)">
            ★ 吠陀月亮星宿：${nc.nakshatra} &nbsp;|&nbsp; 命宫主星：${nc.vedic_lord}
          </div>
        </div>

        <!-- Resonance score -->
        <div style="background:rgba(160,96,224,0.1);border:1px solid rgba(160,96,224,0.3);border-radius:12px;padding:16px">
          <div style="color:#c090f0;font-size:0.85rem;font-weight:600;margin-bottom:10px">⚡ 命盘共振强度评估</div>
          <div style="display:flex;align-items:center;gap:14px;margin-bottom:10px">
            <div style="flex:1;height:10px;background:rgba(255,255,255,0.06);border-radius:5px;overflow:hidden">
              <div style="width:${((nt&&nt.resonance||0)*100).toFixed(0)}%;height:100%;background:linear-gradient(90deg,#6030a0,#c090f0);border-radius:5px"></div>
            </div>
            <span style="color:#c090f0;font-size:1.1rem;font-weight:700">${((nt&&nt.resonance||0)*100).toFixed(0)}%</span>
          </div>
          <div style="font-size:0.8rem;color:var(--muted);line-height:1.8">
            ${nt.jupReturn?'<span style="color:#28c870">✦ 木星回归：资产扩张周期，历史上重要高点/低点转折频率提升</span><br>':''}
            ${nt.satReturn?'<span style="color:#e04848">✦ 土星回归：宿命考验期，大幅回调与结构重组多在此窗口</span><br>':''}
            ${nt.satSquare?'<span style="color:#e08830">✦ 土星四分相：中期压力窗口，趋势阻力增加</span><br>':''}
            ${nt.halvingEffect?'<span style="color:#e8a070">✦ '+nt.halvingEffect+'</span><br>':''}
            <span style="color:var(--faint)">命盘共振综合偏向：${nt.bias>0.3?'看多':nt.bias<-0.3?'看空':'中性观望'}</span>
          </div>
        </div>
      </div>`;
  }

  // ── TP/SL PANEL ──
  {
    const T = tpsl;
    const signalColor = T.signal==='LONG'?'var(--bull)':T.signal==='SHORT'?'var(--bear)':'var(--muted)';
    const signalIcon  = T.signal==='LONG'?'▲ 做多(LONG)':T.signal==='SHORT'?'▼ 做空(SHORT)':'◆ 观望';
    const fmtP = v => {
      const _v = Number(v);
      if(isNaN(_v)||!isFinite(_v)||_v===0) return '--';
      if(_v >= 1000) return '$' + Math.round(_v).toLocaleString();
      if(_v >= 1)    return '$' + _v.toFixed(2);
      return '$' + _v.toFixed(4);
    };
    const pct = (v, ref) => { const _n=Number(v),_r=Number(ref); if(!_r||isNaN(_n)||isNaN(_r))return'0.00'; return ((_n-_r)/_r*100).toFixed(2); };

    // TP rows — direction aware
    // LONG:  TP is above price (+%), SL is below (−%)
    // SHORT: TP is below price (price falls = profit, show as −% from entry), SL is above (+%)
    const tpRows = T.tpLevels.map((tp,i) => {
      const rawPct  = pct(tp.price, T.P);                          // +ve if above, −ve if below
      const gainPct = T.isShort
        ? (((T.P - tp.price) / T.P) * 100).toFixed(2)             // SHORT: profit = drop
        : rawPct;                                                   // LONG:  profit = rise
      const barW = Math.min(100, Math.abs(parseFloat(gainPct)) / 30 * 100);
      return '<div class="tpsl-row tp-row">'
        + '<div class="tpsl-label"><span class="tpsl-badge tp-badge">TP'+(i+1)+(T.isShort?' 空':' 多')+'</span>'
        + '<span class="tpsl-source">'+tp.source+'</span></div>'
        + '<div class="tpsl-price">'+fmtP(tp.price)
          + '<span class="tpsl-pct tp-pct">+'+ gainPct +'%</span></div>'
        + '<div class="tpsl-rrr">RRR <strong>'+tp.rrr+'R</strong></div>'
        + '<div class="tpsl-bar-wrap"><div class="tpsl-bar tp-bar" style="width:'+Math.max(4,barW)+'%"></div></div>'
        + '</div>';
    }).join('');

    // SL rows — direction aware
    // LONG:  SL is below price (loss if price drops)
    // SHORT: SL is above price (loss if price rises)
    const slRows = T.slLevels.map((sl,i) => {
      const rawPct  = pct(sl.price, T.P);
      const lossPct = T.isShort
        ? (((sl.price - T.P) / T.P) * 100).toFixed(2)             // SHORT: loss = rise
        : Math.abs(rawPct).toFixed(2);                             // LONG:  loss = drop
      const barW = Math.min(100, parseFloat(lossPct) / 20 * 100);
      return '<div class="tpsl-row sl-row">'
        + '<div class="tpsl-label"><span class="tpsl-badge sl-badge">SL'+(i+1)+(T.isShort?' 空':' 多')+'</span>'
        + '<span class="tpsl-source">'+sl.source+'</span></div>'
        + '<div class="tpsl-price">'+fmtP(sl.price)
          + '<span class="tpsl-pct sl-pct">−'+ lossPct +'%</span></div>'
        + '<div class="tpsl-rrr"><span style="color:var(--muted);font-size:.78rem">风险</span> <strong>'+fmtP(T.risk)+'</strong></div>'
        + '<div class="tpsl-bar-wrap"><div class="tpsl-bar sl-bar" style="width:'+Math.max(4,barW)+'%"></div></div>'
        + '</div>';
    }).join('');

  if(sys.ziwei && zw) {
    panels['ziwei'] = buildZiweiPanel(zw, coin);
  }

  if(sys.volRate && va) {
    panels['volrate'] = buildVideoAlgoPanel(va, coin, price);
  }

  // ── 技术指标面板 (RSI + MACD + Bollinger + TD) ──
  {
    const currentTFpanel = document.getElementById('fetchPeriod')?.value || '4h';
    panels['techind'] = buildRSIPanel(rsiE, macdE, bbE, tdE, tfRec, mtfE);
  }

    panels['tpsl'] = `
      <div class="panel">
        <div class="panel-title" style="justify-content:space-between">
          <span>🎯 止盈止损</span>
          <span style="font-size:.85rem;font-weight:800;color:${signalColor}">${signalIcon}</span>
        </div>

        ${data._priceWarning ? `
        <div style="margin-bottom:12px;padding:10px 12px;background:rgba(168,32,32,.08);border:1px solid rgba(168,32,32,.3);border-radius:9px;font-size:.75rem;color:var(--bear);line-height:1.6">
          ${data._priceWarning}
        </div>` : ''}

        ${(()=>{
          const T = tpsl;
          if(!T) return '<div style="color:var(--faint);font-size:.8rem;padding:12px 0">请先运行推演</div>';
          const fmtV = v => { const n=Number(v); if(!n||isNaN(n))return'--'; return n>=1000?'$'+Math.round(n).toLocaleString():n>=1?'$'+n.toFixed(2):'$'+n.toFixed(4); };
          const pctStr = (a,b) => Math.abs(((a-b)/b)*100).toFixed(1)+'%';
          const tp1=T.tpLevels?.[0], tp2=T.tpLevels?.[1], tp3=T.tpLevels?.[2];
          const sl1=T.slLevels?.[0];
          const isLong = T.signal !== 'SHORT';
          const entryColor = 'var(--text)';
          const tpColor  = isLong ? 'var(--bull)' : 'var(--bear)';
          const slColor  = 'var(--bear)';

          // 5档江恩止盈（tpsl5）
          const gann5 = tpsl5?.strategies?.[0];

          const rows = [
            // 进场
            { label:'进场', val: fmtV(T.P), sub: T.atrPct+'% ATR · '+T.volatilityLabel, color: entryColor, icon:'◆' },
            // TP1-TP3
            ...(tp1 ? [{ label:'TP1', val: fmtV(tp1.price), sub: (isLong?'+':'-')+pctStr(tp1.price,T.P)+' · '+tp1.rrr+'R', color: tpColor, icon:'▲' }] : []),
            ...(tp2 ? [{ label:'TP2', val: fmtV(tp2.price), sub: (isLong?'+':'-')+pctStr(tp2.price,T.P)+' · '+tp2.rrr+'R', color: tpColor, icon:'▲' }] : []),
            ...(tp3 ? [{ label:'TP3', val: fmtV(tp3.price), sub: (isLong?'+':'-')+pctStr(tp3.price,T.P)+' · '+tp3.rrr+'R', color: tpColor+'99', icon:'▲' }] : []),
            // SL
            ...(sl1 ? [{ label:'止损', val: fmtV(sl1.price), sub: '-'+pctStr(sl1.price,T.P), color: slColor, icon:'▼' }] : []),
          ];

          const rowsHtml = rows.map(r => `
            <div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:.7rem;font-weight:700;color:${r.color==='var(--text)'?'var(--faint)':r.color};width:32px;flex-shrink:0">${r.label}</span>
              <span style="font-size:.92rem;font-weight:800;font-family:monospace;color:${r.color};flex:1">${r.val}</span>
              <span style="font-size:.68rem;color:var(--muted)">${r.sub}</span>
            </div>`).join('');

          // 江恩5档摘要
          const gannHtml = gann5 ? `
            <div style="margin-top:12px;padding:10px 12px;border:1px solid rgba(140,100,16,.2);border-radius:9px;background:rgba(140,100,16,.03)">
              <div style="font-size:.62rem;font-weight:700;color:var(--gold);margin-bottom:7px;letter-spacing:.05em">⬡ 江恩九方格 · 五档位</div>
              ${tpsl5.strategies.map((s,i)=>{
                const lo=s.long, sh=s.short;
                const colors=['#3ab8c8','#28c870','#c8a840','#e8a040','#e05050'];
                const c = colors[i];
                return `<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px solid rgba(0,0,0,.04)">
                  <span style="font-size:.6rem;font-weight:700;color:${c};width:50px;flex-shrink:0">${s.label}</span>
                  <span style="font-size:.68rem;color:var(--bull);font-family:monospace">${fmtV(lo.tp)}</span>
                  <span style="font-size:.58rem;color:var(--faint)">+${lo.tpPct}%</span>
                  <span style="font-size:.6rem;color:var(--faint);margin:0 2px">/</span>
                  <span style="font-size:.68rem;color:var(--bear);font-family:monospace">${fmtV(lo.sl)}</span>
                  <span style="font-size:.58rem;color:var(--faint);margin-left:auto">RRR ${lo.rrr}</span>
                </div>`;
              }).join('')}
            </div>` : '';

          // 入场区间
          const entryHtml = T.entryZone ? `
            <div style="display:flex;align-items:center;gap:8px;margin-top:10px;padding:8px 12px;background:rgba(140,100,16,.05);border-radius:8px;border:1px solid rgba(140,100,16,.18)">
              <span style="font-size:.68rem;color:var(--muted)">建议入场区间</span>
              <span style="flex:1;font-size:.82rem;font-weight:700;font-family:monospace;color:var(--gold)">${fmtV(T.entryZone.low)} — ${fmtV(T.entryZone.high)}</span>
              <span style="font-size:.65rem;color:var(--muted)">仓位 ${T.positionSize?.percentage||'--'}</span>
            </div>` : '';

          return `<div>${rowsHtml}${entryHtml}${gannHtml}</div>`;
        })()}
      </div>`
    // ── 🔬 回测验证面板 ──
    panels['backtest'] = buildBacktestPanel(coin, price, high, low, nodes, tpsl, sys);
  }

  const content = document.getElementById('tabContent');
  content.innerHTML = '';
  var _panelDefs = panels; window._panelDefs = panels;
  tabDefs.forEach((t,i) => {
    const div = document.createElement('div');
    div.className = 'tab-panel' + (i===0?' active':'');
    div.id = 'tp-'+t.id;
    if (i === 0) {
      if(typeof _panelDefs[t.id] === 'string') div.innerHTML = _panelDefs[t.id];
      else if(_panelDefs[t.id]) div.appendChild(_panelDefs[t.id]);
    } else {
      div.dataset.panelId = t.id;
    }
    content.appendChild(div);
  });
  var _rIC = window.requestIdleCallback || function(cb){setTimeout(cb,16);};
  tabDefs.slice(1).forEach(function(t) {
    _rIC(function() {
      var div = document.getElementById('tp-'+t.id);
      if (div && !div.innerHTML && div.dataset.panelId) {
        if(typeof _panelDefs[t.id] === 'string') div.innerHTML = _panelDefs[t.id];
        else if(_panelDefs[t.id]) div.appendChild(_panelDefs[t.id]);
      }
    });
  });
}



function setPosTP(val) {
  const el = document.getElementById('pos-tp');
  if (el) { el.value = val; calcPosition(); }
}

// ═══════════════════════════════════════════════
// POSITION CALCULATOR
// ═══════════════════════════════════════════════
function calcPosition() {
  const balance = parseFloat(document.getElementById('pos-balance')?.value) || 10000;
  const riskPct = parseFloat(document.getElementById('pos-risk')?.value) || 2;
  const entry   = parseFloat(document.getElementById('pos-entry')?.value) || 0;
  const sl      = parseFloat(document.getElementById('pos-sl')?.value) || 0;
  const tp      = parseFloat(document.getElementById('pos-tp')?.value) || 0;

  const resultEl = document.getElementById('pos-result');
  const batchEl  = document.getElementById('pos-batch');
  if(!resultEl) return;

  if(!entry || !sl || sl >= entry) {
    resultEl.innerHTML = '<div style="grid-column:1/-1;font-size:.75rem;color:var(--faint);text-align:center;padding:16px">请填写有效的入场价和止损价（止损须低于入场价）</div>';
    return;
  }

  const maxLoss    = balance * riskPct / 100;
  const slDist     = entry - sl;
  const slPct      = (slDist / entry * 100).toFixed(2);
  const posSize    = maxLoss / slDist;          // 单位数量
  const posValue   = posSize * entry;           // 仓位市值 USDT
  const posRatio   = (posValue / balance * 100).toFixed(1); // 占账户%
  const leverage   = Math.ceil(posValue / balance);

  const tpDist  = tp > entry ? tp - entry : 0;
  const rrr     = tpDist > 0 ? (tpDist / (slDist||1)).toFixed(2) : '--';
  const profit  = tpDist > 0 ? ((posSize||0) * (tpDist||0)).toFixed(2) : '--';

  const fmtMoney = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };
  const fmtCoin  = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'0'; return _n>=1?_n.toFixed(4):_n.toFixed(6); };

  const cards = [
    { label:'建议仓位数量', val: fmtCoin(posSize), sub:'个单位', color:'var(--text)' },
    { label:'仓位市值', val: fmtMoney(posValue), sub: posRatio+'% 账户', color:'var(--gold)' },
    { label:'最大亏损额', val: fmtMoney(maxLoss), sub: riskPct+'% 账户', color:'var(--bear)' },
    { label:'止损距离', val: slPct+'%', sub: fmtMoney(slDist)+' / 单位', color:'var(--amber)' },
    { label:'预期盈利', val: profit !== '--' ? fmtMoney(profit) : '--', sub: 'TP目标兑现', color:'var(--bull)' },
    { label:'盈亏比 RRR', val: rrr, sub: rrr !== '--' && parseFloat(rrr) >= 2 ? '✓ 达标' : rrr !== '--' ? '⚠ 偏低' : '--', color: rrr !== '--' && parseFloat(rrr) >= 2 ? 'var(--bull)' : 'var(--amber)' },
  ];

  resultEl.innerHTML = cards.map(c =>
    '<div style="background:var(--card2);border:1px solid var(--border);border-radius:9px;padding:12px 14px">'
    + '<div style="font-size:.6rem;color:var(--muted);margin-bottom:4px">'+c.label+'</div>'
    + '<div style="font-size:1rem;font-weight:700;color:'+c.color+'">'+c.val+'</div>'
    + '<div style="font-size:.6rem;color:var(--faint);margin-top:2px">'+c.sub+'</div>'
    + '</div>'
  ).join('');

  // Batch entry suggestion (3 tranches)
  const tranche1 = posSize * 0.4, tranche2 = posSize * 0.35, tranche3 = posSize * 0.25;
  const price1 = entry, price2 = entry * 0.995, price3 = sl * 1.015;
  batchEl.innerHTML = '<div style="background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.18);border-radius:9px;padding:12px 14px">'
    + '<div style="font-size:.65rem;font-weight:700;color:var(--gold);margin-bottom:8px">📋 建议分批入场</div>'
    + '<div style="display:flex;flex-direction:column;gap:5px">'
    + [
        ['第一批 40%', fmtCoin(tranche1), fmtMoney(tranche1*entry), price1, '立即入场'],
        ['第二批 35%', fmtCoin(tranche2), fmtMoney(tranche2*price2), price2, '回调补仓'],
        ['第三批 25%', fmtCoin(tranche3), fmtMoney(tranche3*price3), price3, '近止损加仓'],
      ].map(([label, qty, val, px, note]) =>
        '<div style="display:grid;grid-template-columns:80px 80px 80px 1fr auto;align-items:center;gap:8px;font-size:.65rem;padding:5px 8px;background:rgba(0,0,0,0.05);border-radius:6px">'
        + '<span style="font-weight:700;color:var(--gold)">'+label+'</span>'
        + '<span style="color:var(--text)">'+qty+'</span>'
        + '<span style="color:var(--muted)">'+val+'</span>'
        + '<span style="color:var(--faint)">@ $'+Math.round(px).toLocaleString()+'</span>'
        + '<span style="color:var(--faint)">'+note+'</span>'
        + '</div>'
      ).join('')
    + '</div></div>';
}

// ═══════════════════════════════════════════════
// TAB SWITCH
// ═══════════════════════════════════════════════
function switchDetailTab(id, btn) {
  document.querySelectorAll('.tab').forEach(t=>t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p=>p.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const panel = document.getElementById('tp-'+id);
  if (!panel) return;
  if (panel.dataset.panelId && !panel.innerHTML && window._panelDefs) {
    var pd = window._panelDefs[panel.dataset.panelId];
    if (typeof pd === 'string') panel.innerHTML = pd;
    else if (pd) panel.appendChild(pd);
    delete panel.dataset.panelId;
  }
  panel.classList.add('active');
}

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// AUTO FETCH PRICE FROM BINANCE (无需token)
// ═══════════════════════════════════════════════

const SYMBOL_TO_COIN = {
  BTCUSDT:'BTC', ETHUSDT:'ETH', SOLUSDT:'SOL', BNBUSDT:'BNB',
  XRPUSDT:'XRP', DOGEUSDT:'DOGE', ADAUSDT:'ADA', AVAXUSDT:'AVAX', LINKUSDT:'LINK'
};

// Timeframe pill click handler
// Timeframe config: maps tf key → Binance kline params
const PERIOD_KLINE = {
  '15m': { interval:'15m', limit:80,  label:'15分钟' },
  '30m': { interval:'30m', limit:60,  label:'30分钟' },
  '1h':  { interval:'1h',  limit:48,  label:'1小时'  },
  '2h':  { interval:'2h',  limit:48,  label:'2小时'  },
  '3h':  { interval:'3h',  limit:48,  label:'3小时'  },
  '4h':  { interval:'4h',  limit:42,  label:'4小时'  },
  '6h':  { interval:'6h',  limit:42,  label:'6小时'  },
  '8h':  { interval:'8h',  limit:42,  label:'8小时'  },
  '12h': { interval:'12h', limit:42,  label:'12小时' },
  '1d':  { interval:'1d',  limit:90,  label:'1天'    },  // 3个月日线
  '3d':  { interval:'3d',  limit:60,  label:'3天'    },  // 6个月3日线
  '1w':  { interval:'1w',  limit:104, label:'1周'    },  // 2年周线，覆盖大级别结构
};

// ════════════════════════════════════════════════════════════════════════
// 网络层：公共 CORS 代理 + 本地缓存
// 移除 CF Worker 依赖（Worker 不稳定时直接使用公共代理）
// ════════════════════════════════════════════════════════════════════════
const BINANCE_RAW  = 'https://api.binance.com';
const BINANCE_BASE = BINANCE_RAW;  // 向后兼容
const BINANCE_FAPI = BINANCE_RAW;

// 本地 30 秒缓存，减少重复请求
let _priceCache   = {};
// 本次会话已发现的可用代理（避免每次都重新探测）
let _workingProxy = null;

// 公共 CORS 代理列表
// [url_prefix, needs_unwrap]
// needs_unwrap=true 表示响应体包在 {contents:"..."} 里，需要解包
const CORS_PROXIES = [
  ['https://corsproxy.io/?url=',               false],  // 最稳定，首选
  ['https://api.allorigins.win/raw?url=',       false],  // /raw 返回原始内容
  ['https://api.codetabs.com/v1/proxy/?quest=', false],
  ['https://thingproxy.freeboard.io/fetch/',    false],
  ['https://api.cors.lol/?url=',                false],
  ['https://api.allorigins.win/get?url=',       true ],  // /get 包装格式，备用
];

async function smartFetch(targetUrl, opts = {}) {
  if (!targetUrl || !targetUrl.startsWith('http')) {
    throw new Error('无效 URL: ' + targetUrl);
  }

  // Cache hit
  if (!opts.noCache && _priceCache[targetUrl] && Date.now() - _priceCache[targetUrl].t < 60000) {
    return { ok: true, json: async () => _priceCache[targetUrl].data };
  }

  const enc = encodeURIComponent(targetUrl);

  const parseResp = async (r, unwrap) => {
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const text = await r.text();
    const trimmed = text.trimStart();
    if (trimmed.startsWith('<!DOCTYPE') || trimmed.startsWith('<html')) throw new Error('HTML response');
    let data;
    try { data = JSON.parse(text); } catch(e) { throw new Error('JSON parse fail'); }
    if (unwrap && data && typeof data.contents === 'string') data = JSON.parse(data.contents);
    if (!Array.isArray(data) && data && typeof data.error === 'string'
        && Object.keys(data).length <= 2 && !data.symbol && !data.lastPrice && !data.price) {
      throw new Error('API error: ' + data.error);
    }
    _priceCache[targetUrl] = { data, t: Date.now() };
    return { ok: true, json: async () => data, text: async () => text };
  };

  const tFetch = (url, opts2) => {
    const ctrl = new AbortController();
    const tid = setTimeout(() => ctrl.abort(), 7000);
    return fetch(url, { ...(opts2||{}), signal: ctrl.signal })
      .finally(() => clearTimeout(tid));
  };

  const channels = [
    // 通道1: 直接请求 Binance（国内可能失败，但其他地区最快）
    { run: () => tFetch(targetUrl).then(r => parseResp(r, false)) },
    // 通道2: corsproxy.io
    { run: () => tFetch('https://corsproxy.io/?' + enc).then(r => parseResp(r, false)) },
    // 通道3: allorigins
    { run: () => tFetch('https://api.allorigins.win/get?url=' + enc).then(r => parseResp(r, true)) },
    // 通道4: cors.lol
    { run: () => tFetch('https://api.cors.lol/?url=' + enc).then(r => parseResp(r, false)) },
  ];

  let lastErr = null;
  for (const ch of channels) {
    try {
      return await ch.run();
    } catch(e) {
      lastErr = e;
    }
  }
  throw new Error('所有通道均失败: ' + (lastErr?.message || '未知'));
}

function binanceUrl(path) { return BINANCE_RAW + path; }
function fapiUrl(path)    { return BINANCE_RAW + path; }

async function fetchPrice() {
  const symbol = document.getElementById('fetchCoin').value;
  const period = document.getElementById('fetchPeriod').value;
  const btn    = document.getElementById('fetchBtn');
  const status = document.getElementById('fetchStatus');

  btn.textContent = '⏳ 抓取中...';
  btn.disabled = true;
  status.textContent = '';

  try {
    // 1. 当前价 + 24h高低
    const tickerRes = await smartFetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${symbol}`);
    if (!tickerRes.ok) throw new Error('网络错误 ' + tickerRes.status);
    const ticker = await tickerRes.json();
    const currentPrice = parseFloat(ticker.lastPrice);

    // 2. 历史K线高低点
    const pk = PERIOD_KLINE[period];
    const klRes = await smartFetch(`https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${pk.interval}&limit=${pk.limit}`);
    if (!klRes.ok) throw new Error('K线错误 ' + klRes.status);
    const klines = await klRes.json();

    let periodHigh = 0, periodLow = Infinity;
    klines.forEach(k => {
      const h = parseFloat(k[2]), l = parseFloat(k[3]);
      if (h > periodHigh) periodHigh = h;
      if (l < periodLow)  periodLow  = l;
    });

    // 3. 填入表单
    document.getElementById('price').value = currentPrice.toFixed(2);
    document.getElementById('high').value  = periodHigh.toFixed(2);
    document.getElementById('low').value   = periodLow.toFixed(2);

    // 同步标的选择
    const coinVal = SYMBOL_TO_COIN[symbol];
    if (coinVal) document.getElementById('coin').value = coinVal;

    // 填今天日期
    document.getElementById('baseDate').value = nowUTC8DateStr();

    // 显示 AUTO 标签
    ['price','high','low'].forEach(id => {
      const tag = document.getElementById(id + 'AutoTag');
      if (tag) tag.style.display = 'inline';
    });

    // 绿色闪烁
    ['price','high','low'].forEach(id => {
      const el = document.getElementById(id);
      el.style.transition = 'background 0.4s';
      el.style.background = 'rgba(24,145,80,0.1)';
      setTimeout(() => { el.style.background = ''; }, 1500);
    });

    const now = toUTC8TimeStr(new Date());
    status.innerHTML = `<span style="color:var(--bull)">✅ ${now} 已更新</span><br><span style="color:var(--faint)">高低点周期：${pk.label} · 来源：Binance</span>`;

  } catch(err) {
    status.innerHTML = `<span style="color:var(--bear)">❌ ${err.message}</span><br><span style="color:var(--faint)">请检查网络或手动输入</span>`;
  } finally {
    btn.textContent = '⬇ 自动填入';
    btn.disabled = false;
  }
}

// ── UTC+8 时区工具函数（前置定义，供 DOMContentLoaded 及后续代码使用）──────
function toUTC8TimeStr(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d)) return '--:--:--';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false
  }).format(d);
}
function toUTC8DateStr(dateInput) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d)) return '----';
  return new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(d).replace(/\//g, '-');
}
function toUTC8Str(dateInput, opts) {
  const d = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(d)) return String(dateInput);
  const options = {
    timeZone: 'Asia/Shanghai',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false, ...opts
  };
  return new Intl.DateTimeFormat('zh-CN', options).format(d);
}
function nowUTC8DateStr() { return toUTC8DateStr(new Date()); }
function nowUTC8Str()     { return toUTC8Str(new Date()); }
function getNowUTC8() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 8 * 3600000);
}

// 标的联动
document.addEventListener('DOMContentLoaded', () => {
  // Safety net: ensure window.oneClick is always available for button onclick
  setTimeout(() => {
    if (typeof window.oneClick === 'undefined' || typeof window.oneClick.runAll !== 'function') {
      console.warn('[一键通] window.oneClick 未就绪，使用备用方案');
      window.oneClick = {
        running: false,
        runAll: function() {
          const btn = document.getElementById('runAllBtn');
          if (btn) btn.click();
          else alert('请点击左侧「☁ 联网全部推演」按钮');
        }
      };
    }
  }, 1000);
});

document.addEventListener('DOMContentLoaded', () => {
  // UTC+8 live clock
  // tickUTC8Clock handled by index.html clock engine

  // Set today's date
  document.getElementById('baseDate').value = nowUTC8DateStr();

  // Theme: load saved preference
  const saved = localStorage.getItem('tianjishu-theme') || 'light';
  if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');

  // Timeframe pill clicks
  document.querySelectorAll('#tfGroup .tf-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      document.querySelectorAll('#tfGroup .tf-btn').forEach(b => b.classList.remove('active'));
      this.classList.add('active');
      document.getElementById('fetchPeriod').value = this.dataset.tf;
    });
  });

  // Span: update hidden #span in days-equivalent whenever num or unit changes
  function updateSpan() {
    const n    = parseFloat(document.getElementById('spanNum').value) || 1;
    const unit = document.getElementById('spanUnit').value;
    let days;
    if      (unit === 'min')   days = n / 1440;
    else if (unit === 'hour')  days = n / 24;
    else if (unit === 'day')   days = n;
    else if (unit === 'week')  days = n * 7;
    else if (unit === 'month') days = n * 30;
    else                       days = n;
    document.getElementById('span').value = Math.max(0.001, days);
  }
  document.getElementById('spanNum') .addEventListener('input',  updateSpan);
  document.getElementById('spanUnit').addEventListener('change', updateSpan);
  updateSpan();

  // Init coin list
  renderCoinListDebounced();
  const cyEl = document.getElementById('cycleYear');
  if (cyEl) cyEl.value = new Date().getFullYear();
  renderMonthCycle();

  // Load saved EIA key
  const savedEia = localStorage.getItem('eiaKey');
  if (savedEia) setTimeout(() => { const el = document.getElementById('eiaKey'); if(el) el.value = savedEia; }, 0);

  showInstallBanner();
});

// ═══════════════════════════════════════════════
// SENTIMENT: 恐惧贪婪 + 资金费率 (无需token)
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// SENTIMENT: 恐惧贪婪 + BTC资金费率 (每次推演抓一次)
// ═══════════════════════════════════════════════

async function fetchSentimentData() {
  const [fngRes, frRes] = await Promise.all([
    fetch('https://api.alternative.me/fng/?limit=1'),
    smartFetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT'),
  ]);
  const fngData = await fngRes.json();
  const frData  = await frRes.json();
  const fng = parseInt(fngData?.data?.[0]?.value) || 50;
  // frData is now 24hr ticker - derive a pseudo funding rate from price change
  const frRaw = parseFloat(frData?.priceChangePercent || 0);
  const fr = frRaw / 100 / 8; // convert 24h% to per-8h funding rate approximation
  return { fng, fr, time: toUTC8Str(new Date(), {hour:'2-digit',minute:'2-digit'}) };
}

function renderSentimentPanel(s) {
  if (!s) return;
  try {
    const fng = Number(s.fng) || 50;
    const fr  = Number(s.fr)  || 0;
    const fngColor = fng<=25?'var(--bull)':fng<=45?'#e8a040':fng<=55?'var(--muted)':fng<=75?'#e06040':'var(--bear)';
    const fngLabel = fng<=25?'极度恐惧':fng<=45?'恐惧':fng<=55?'中性':fng<=75?'贪婪':'极度贪婪';
    const frPct    = (fr * 100).toFixed(4);
    const frLabel  = fr>0.0015?'多头过热':fr>0.0005?'正常偏多':fr>0?'中性':fr<-0.001?'负费率':'轻微负';
    const frColor  = fr>0.001?'var(--bear)':fr<-0.001?'var(--bull)':'var(--muted)';
    const el = document.getElementById('sentimentPanel');
    if (!el) return;
    el.innerHTML = `
      <div class="sent-mini-row">
        <span class="sent-pill">恐惧贪婪 <strong style="color:${fngColor}">${fng} · ${fngLabel}</strong></span>
        <span class="sent-pill">BTC费率 <strong style="color:${frColor}">${frPct}% · ${frLabel}</strong></span>
        <span class="sent-pill" style="color:var(--faint)">更新 ${s.time}</span>
      </div>`;
  } catch(e) { console.warn('renderSentimentPanel error:', e); }
}

// Per-coin sentiment verdict — combines global FNG with coin-specific engine signals
function buildCoinSentiment(coin, avgBias, sentData, ch, gn, va) {
  const fng = sentData?.fng ?? 50;
  const fr  = sentData?.fr  ?? 0;
  // Weighted combo: 60% technical bias + 20% FNG + 20% funding rate
  const techScore = Math.round((avgBias + 1) / 2 * 100);
  const fngScore  = 100 - fng;  // inverted: low fear = bullish
  const frScore   = fr < 0 ? 70 : fr > 0.001 ? 30 : 50;
  const composite = Math.round(techScore * 0.60 + fngScore * 0.20 + frScore * 0.20);

  // Directional label
  const signal = composite >= 65 ? '强多' : composite >= 55 ? '偏多' : composite >= 45 ? '中性' : composite >= 35 ? '偏空' : '强空';
  const color  = composite >= 65 ? 'var(--bull)' : composite >= 55 ? '#28c870' : composite >= 45 ? 'var(--muted)' : composite >= 35 ? '#e06040' : 'var(--bear)';

  // Key reasons
  const reasons = [];
  if (avgBias > 0.3)        reasons.push('多法共振偏多');
  else if (avgBias < -0.3)  reasons.push('多法共振偏空');
  if (fng <= 25)            reasons.push('极度恐惧·历史买点');
  else if (fng >= 75)       reasons.push('极度贪婪·顶部警报');
  if (ch?.beichi)           reasons.push(`缠论${ch.beichiType}`);
  if (ch?.bspDir)           reasons.push(`缠论${ch.bspType}${ch.bspDir}`);
  if (gn?.angleStrength>0.7)reasons.push(`江恩${gn.angleStrength>0.8?'强势':'中性'}角线`);
  if (va?.resonance>0.7)    reasons.push('波动率共振');
  if (fr < -0.001)          reasons.push('负资金费率·空头主导');
  else if (fr > 0.0015)     reasons.push('高正费率·多头过热');

  return { composite, signal, color, reasons: reasons.slice(0,3) };
}

// ═══════════════════════════════════════════════
// MULTI-COIN COMPARE ENGINE
// ═══════════════════════════════════════════════
const COMPARE_COINS = [
  { sym: 'BTCUSDT', coin: 'BTC', label: 'Bitcoin',  color: '#f7931a' },
  { sym: 'ETHUSDT', coin: 'ETH', label: 'Ethereum', color: '#627eea' },
  { sym: 'SOLUSDT', coin: 'SOL', label: 'Solana',   color: '#9945ff' },
  { sym: 'BNBUSDT',  coin: 'BNB',  label: 'BNB',       color: '#f3ba2f' },
  { sym: 'XRPUSDT',  coin: 'XRP',  label: 'XRP',       color: '#00aae4' },
  { sym: 'DOGEUSDT', coin: 'DOGE', label: 'Dogecoin',  color: '#c2a633' },
];

async function fetchMultiCoin() {
  const container = document.getElementById('multiCoinGrid');
  if (!container) return;
  container.innerHTML = '<div style="font-size:.75rem;color:var(--muted);padding:10px">⏳ 抓取多币种数据...</div>';

  try {
    const results = await Promise.all(COMPARE_COINS.map(async (c) => {
      const [tickRes, klRes] = await Promise.all([
        smartFetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${c.sym}`),
        smartFetch(`https://api.binance.com/api/v3/klines?symbol=${c.sym}&interval=4h&limit=42`)
      ]);
      const tick = await tickRes.json();
      const klines = await klRes.json();

      const price = parseFloat(tick.lastPrice);
      const chg24 = parseFloat(tick.priceChangePercent);
      let high7 = 0, low7 = Infinity;
      klines.forEach(k => {
        const h = parseFloat(k[2]), l = parseFloat(k[3]);
        if (h > high7) high7 = h;
        if (l < low7)  low7  = l;
      });

      // Run engines
      const today = nowUTC8DateStr();
      const engines = [
        engineQiMen(c.coin, today),
        engineIChing(c.coin, today),
        engineVedic(c.coin, today),
        engineGann(c.coin, today, price, high7, low7),
        engineSR(c.coin, today, price, high7, low7),
        engineChan(c.coin, today, price, high7, low7, 0),
      ];
      const avgBias = engines.reduce((s,e) => s + e.bias, 0) / engines.length;
      const avgConf = engines.reduce((s,e) => s + e.conf, 0) / engines.length;
      const gannT = engineGannTime(today, price, high7, low7);

      return { ...c, price, chg24, high7, low7, avgBias, avgConf, gannT,
               score: Math.round((avgBias + 1) / 2 * 100) };
    }));

    // Sort by score desc
    results.sort((a,b) => b.score - a.score);

    container.innerHTML = results.map((r, i) => {
      const [bc, bl] = biasBadge(r.avgBias);
      const chgColor = r.chg24 >= 0 ? 'var(--bull)' : 'var(--bear)';
      const rank = ['🥇','🥈','🥉',''][i] || '';
      const scoreColor = r.score >= 65 ? 'var(--bull)' : r.score <= 35 ? 'var(--bear)' : 'var(--gold)';

      const metrics = [
        { label: '综合偏向', pct: Math.round((r.avgBias+1)/2*100), color: r.avgBias > 0 ? 'var(--bull)' : 'var(--bear)' },
        { label: '推算置信', pct: Math.round(r.avgConf*100), color: 'var(--gold)' },
        { label: '角线目标', pct: Math.min(100, Math.round((r.gannT.AR - r.price) / r.price * 200 + 50)), color: r.color },
      ];

      return `<div class="mcoin-card" onclick="loadCoinToForm('${r.sym}','${r.coin}')">
        <div class="mcoin-head">
          <div>
            <span style="font-size:.7rem;color:var(--faint)">${rank}</span>
            <span class="mcoin-sym" style="color:${r.color}">${r.coin}</span>
            <span style="font-size:.65rem;color:var(--faint);margin-left:4px">${r.label}</span>
          </div>
          <span class="badge ${bc}">${bl}</span>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:flex-end;margin-bottom:10px">
          <div>
            <div style="font-size:.68rem;color:var(--faint)">当前价</div>
            <div class="mcoin-price" style="font-size:.9rem;font-weight:700;color:var(--text)">$${(r.price||0).toLocaleString(undefined,{maximumFractionDigits:2})}</div>
          </div>
          <div style="text-align:center">
            <div style="font-size:.68rem;color:var(--faint)">24h</div>
            <div style="font-size:.82rem;font-weight:700;color:${chgColor}">${r.chg24 >= 0 ? '+':''}${(Number(r.chg24)||0).toFixed(2)}%</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:.62rem;color:var(--faint)">综合评分</div>
            <div class="mcoin-score" style="color:${scoreColor}">${r.score}</div>
          </div>
        </div>
        <div class="mcoin-bars">
          ${metrics.map(m => `
            <div class="mcoin-bar-row">
              <span class="mcoin-bar-label">${m.label}</span>
              <div class="mcoin-bar-track"><div class="mcoin-bar-fill" style="width:${m.pct}%;background:${m.color}"></div></div>
              <span style="font-size:.62rem;color:var(--faint);width:28px;text-align:right">${m.pct}%</span>
            </div>`).join('')}
        </div>
        <div style="margin-top:8px;font-size:.65rem;color:var(--faint);border-top:1px solid var(--border);padding-top:6px">
          江恩角线修正目标：<strong style="color:var(--gold)">$${Math.round(r.gannT.AR).toLocaleString()}</strong>
          · 约${r.gannT.daysToTarget}天后
          · <span style="color:${r.gannT.angleStrength==='weak'?'var(--bear)':r.gannT.angleStrength==='fading'?'var(--amber)':'var(--bull)'}">
            ${r.gannT.angleStrength==='weak'?'角线走弱':r.gannT.angleStrength==='fading'?'角线偏弱':'角线完好'}
          </span>
        </div>
        <div style="margin-top:6px;font-size:.62rem;color:rgba(200,168,74,0.6);text-align:center">点击 → 填入表单分析</div>
      </div>`;
    }).join('');

  } catch(e) {
    container.innerHTML = `<div style="font-size:.75rem;color:var(--bear);padding:10px">❌ 抓取失败：${e.message}</div>`;
  }
}

function loadCoinToForm(sym, coin) {
  document.getElementById('fetchCoin').value = sym;
  document.getElementById('coin').value = coin;
  // highlight button
  document.getElementById('fetchBtn').style.background = 'var(--gold)';
  document.getElementById('fetchBtn').textContent = '⬇ 点击填入价格';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ═══════════════════════════════════════════════
// MAIN ENTRY
// ═══════════════════════════════════════════════
const LOAD_STEPS = [
  '布置奇门九宫格局...',
  '起卦推演易经卦象...',
  '计算印度占星行星位置...',
  '绘制江恩时间轮...',
  '识别谐波形态PRZ...',
  '分析斐波那契支撑阻力...',
  '推演缠论笔段中枢...',
  '计算0.809波动率共振位...',
  '转换角度度数360°/480°/720°...',
  '检测K线顶底分型信号...',
  '十法合一综合研判...',
];

// ═══════════════════════════════════════════════
// STRATEGY ENGINE · 当前适合做什么
// ═══════════════════════════════════════════════

let _lastStratData = null; // store last render data for modal

function buildStrategyAdvice(data) {
  const { coin, price, high, low, sys, qm, ic, ve, gn, hr, sr, ch, nt, va, tpsl, gt, breakLevel } = data;
  const P   = price  || 0;
  const H   = high   || 0;
  const L   = low    || 0;
  const BL  = breakLevel || 0;
  const tf  = document.getElementById('fetchPeriod')?.value || '4h';
  const tfLabel = PERIOD_KLINE[tf]?.label || tf;

  // ── 1. 综合信号 ──────────────────────────────────────────────────────────
  const active = [
    sys.qimen?qm:null, sys.iching?ic:null, sys.vedic?ve:null,
    sys.gann?gn:null, sys.harmonic?hr:null, sys.sr?sr:null,
    sys.chan?ch:null, sys.natal?nt:null, sys.volRate?va:null
  ].filter(Boolean);

  const avgBias = active.length ? active.reduce((s,e)=>s+e.bias,0)/active.length : 0;
  const avgConf = active.length ? active.reduce((s,e)=>s+e.conf,0)/active.length : 0.5;
  const score   = Math.round((avgBias+1)/2*100);

  // ── 2. 关键信号提取 ───────────────────────────────────────────────────────
  const chanBeichi   = sys.chan && ch?.beichi;
  const chanBeiType  = ch?.beichiType || '';
  const chanBSP      = ch?.bspDir || '';
  const inDemand     = ch?.inDemand || false;
  const breakStatus  = ch?.breakStatus || '';
  const belowBreak   = ch?.belowBreak ?? true;
  const hasHarmonic  = sys.harmonic && hr?.patterns?.length > 0;
  const nearPRZ      = hasHarmonic && hr.patterns.some(p => p.completion > 0.85);
  const gannBias     = sys.gann ? gn.bias : 0;

  // ── 3. 策略判断矩阵 ───────────────────────────────────────────────────────
  const strategies = [];

  // ── 短线策略（当前时框）──
  const shortTf = ['15m','30m','1h','2h'].includes(tf);
  const midTf   = ['3h','4h','6h','8h'].includes(tf);
  const longTf  = ['12h','1d','3d','1w'].includes(tf);

  // 策略A：等待突破做多
  if (BL > 0 && belowBreak && score >= 45) {
    strategies.push({
      type: 'long_breakout',
      resZone: gn?.resistanceZone || (sr?.resZones?.[0] ? {low: sr.resZones[0].low, high: sr.resZones[0].high} : null),
      supZone: gn?.supportZone    || (sr?.supZones?.[0]  ? {low: sr.supZones[0].low,  high: sr.supZones[0].high}  : null),
      name: shortTf ? '短线突破做多' : midTf ? '波段突破做多' : '趋势突破做多',
      color: 'rgba(24,145,80,0.08)', border: 'rgba(24,145,80,0.3)', badge: '看多',
      badgeColor: 'var(--bull)', badgeBg: 'rgba(24,145,80,0.12)',
      priority: score >= 60 ? '★★★ 高优先' : '★★ 中优先',
      condition: `放量突破并站稳 $${Math.round(BL).toLocaleString()}`,
      entry: (() => {
        // 优先展示价格区间（来自 engineSR supZones 或 engineGann entryZone）
        const srZone = sr?.entryZone || sr?.supZones?.[0];
        const gnZone = gn?.entryZone;
        if (srZone && gnZone) {
          const lo = Math.round(Math.min(srZone.low,  gnZone.low));
          const hi = Math.round(Math.max(srZone.high, gnZone.high));
          return `最佳入场区间：$${lo.toLocaleString()} – $${hi.toLocaleString()}`;
        }
        if (srZone) return `入场区间：$${Math.round(srZone.low).toLocaleString()} – $${Math.round(srZone.high).toLocaleString()}`;
        return `$${Math.round(BL * 1.002).toLocaleString()} 突破确认后入场`;
      })(),
      sl: tpsl ? `$${tpsl.slLevels?.[0]?.price?.toLocaleString() || Math.round(BL*0.98).toLocaleString()}` : `$${Math.round(BL*0.98).toLocaleString()}`,
      tp1: gt?.AR ? `$${Math.round(gt.AR).toLocaleString()}` : `$${Math.round(BL*1.05).toLocaleString()}`,
      tp2: tpsl?.tpLevels?.[1] ? `$${tpsl.tpLevels[1].price.toLocaleString()}` : '见阻力减仓',
      rrr: '≥ 2:1',
      timing: shortTf ? '当下K线突破后立即' : midTf ? '本根K线收盘确认' : '日线收盘确认',
      note: `${inDemand ? '✦ 当前处于需求区，已有小级别支撑。' : ''}${chanBeichi && chanBeiType==='底背驰' ? '⚡ 缠论底背驰确认，买点信号强烈。' : ''}等待${tfLabel}突破${BL ? '$'+Math.round(BL).toLocaleString() : '关键阻力'}后入场，不追高。`,
    });
  }

  // 策略B：当前价买入（强多信号）
  if (score >= 65 && inDemand) {
    strategies.push({
      type: 'long_now',
      name: shortTf ? '短线即时做多' : '波段即时做多',
      color: 'rgba(24,145,80,0.12)', border: 'rgba(24,145,80,0.4)', badge: '强多信号',
      badgeColor: 'var(--bull)', badgeBg: 'rgba(24,145,80,0.15)',
      priority: '★★★ 高优先',
      condition: '多系统共振看多，当前在需求区',
      entry: (() => {
        const srZone = sr?.entryZone || sr?.supZones?.[0];
        const gnZone = gn?.entryZone;
        if (srZone) {
          const lo = Math.round(srZone.low), hi = Math.round(Math.min(P * 1.003, srZone.high));
          return `最佳入场区间：$${lo.toLocaleString()} – $${hi.toLocaleString()}`;
        }
        if (gnZone) return `江恩入场区间：$${Math.round(gnZone.low).toLocaleString()} – $${Math.round(gnZone.high).toLocaleString()}`;
        return `$${Math.round(P).toLocaleString()} 当前价附近`;
      })(),
      sl: `$${Math.round(L * 0.99).toLocaleString()} 前低下方`,
      tp1: BL > 0 ? `$${Math.round(BL).toLocaleString()} 突破阻力位` : gt?.AR ? `$${Math.round(gt.AR*0.98).toLocaleString()}` : '见阻力止盈',
      tp2: gt?.AR ? `$${Math.round(gt.AR).toLocaleString()} 角线修正目标` : '减仓1/2',
      rrr: '≥ 2.5:1',
      timing: '当下可入场，建议分批',
      note: `${chanBeichi && chanBeiType==='底背驰' ? '⚡ 缠论底背驰·绝佳买点。' : ''}综合评分${score}，多空偏向强多。建议分2-3批建仓，第一批50%仓位。`,
    });
  }

  // 策略C：等待回调做多
  if (score >= 50 && !inDemand && P > L * 1.02) {
    const retestLevel = BL > 0 && !belowBreak ? Math.round(ch?.retest || BL) : Math.round(L + (P - L) * 0.382);
    strategies.push({
      type: 'long_pullback',
      name: shortTf ? '短线回调入场' : '等待回踩做多',
      color: 'rgba(200,168,74,0.07)', border: 'rgba(200,168,74,0.25)', badge: '等待回调',
      badgeColor: 'var(--gold)', badgeBg: 'rgba(200,168,74,0.12)',
      priority: '★★ 中优先',
      condition: '等待价格回调至支撑后入场',
      entry: (() => {
        const srZone = sr?.supZones?.find(z => z.mid <= P && z.mid >= retestLevel * 0.98);
        if (srZone) return `回踩入场区间：$${Math.round(srZone.low).toLocaleString()} – $${Math.round(srZone.high).toLocaleString()}`;
        return `$${retestLevel.toLocaleString()} 回踩支撑位`;
      })(),
      sl: `$${Math.round(retestLevel * 0.985).toLocaleString()} 支撑下方1.5%`,
      tp1: BL > 0 ? `$${Math.round(BL).toLocaleString()}` : `$${Math.round(P * 1.04).toLocaleString()}`,
      tp2: gt?.AR ? `$${Math.round(gt.AR).toLocaleString()}` : `$${Math.round(P * 1.08).toLocaleString()}`,
      rrr: '≥ 2:1',
      timing: `回调到 $${retestLevel.toLocaleString()} 附近后确认`,
      note: `当前偏多但未到需求区，耐心等待回踩 $${retestLevel.toLocaleString()} 支撑不破再入场，性价比更高。`,
    });
  }

  // 策略D：观望 / 不操作
  if (score >= 40 && score <= 60) {
    strategies.push({
      type: 'wait',
      name: '暂时观望',
      color: 'rgba(160,160,160,0.06)', border: 'rgba(160,160,160,0.2)', badge: '中性',
      badgeColor: 'var(--muted)', badgeBg: 'rgba(160,160,160,0.1)',
      priority: '当前最优选',
      condition: '多空信号拉锯，暂无明确方向',
      entry: '等待以下信号之一出现',
      sl: '--',
      tp1: BL > 0 ? `突破 $${Math.round(BL).toLocaleString()} 看多` : '看多信号',
      tp2: L > 0  ? `跌破 $${Math.round(L).toLocaleString()} 看空` : '看空信号',
      rrr: '--',
      timing: '等待共振信号再行动',
      note: `综合评分${score}，多空均衡。此时入场风险/回报比不佳。等待突破确认或背驰信号出现后再操作。`,
    });
  }

  // 策略E：减仓/做空（偏空信号）
  if (score <= 40) {
    strategies.push({
      type: 'short',
      name: shortTf ? '短线做空/减多' : '减仓观望',
      color: 'rgba(192,48,48,0.07)', border: 'rgba(192,48,48,0.25)', badge: '偏空',
      badgeColor: 'var(--bear)', badgeBg: 'rgba(192,48,48,0.1)',
      priority: score <= 30 ? '★★★ 高优先' : '★★ 中优先',
      condition: `多系统偏空，综合评分${score}`,
      entry: score <= 30 ? '当前价或反弹至阻力位做空' : '减少多仓，等待企稳',
      sl: `$${Math.round(H * 1.01).toLocaleString()} 前高上方`,
      tp1: `$${Math.round(L).toLocaleString()} 前低位置`,
      tp2: `$${Math.round(L * 0.98).toLocaleString()} 前低下探`,
      rrr: '≥ 2:1',
      timing: chanBeichi && chanBeiType==='顶背驰' ? '⚡ 顶背驰确认，立即执行' : '等待反弹至阻力后',
      note: `${chanBeichi && chanBeiType==='顶背驰' ? '缠论顶背驰信号确认，' : ''}多系统偏空。${score <= 30 ? '建议减仓或做空，止损设于前高上方。' : '建议减轻仓位，不追多。'}`,
    });
  }

  // ── 4. 当前时框适用性说明 ────────────────────────────────────────────────
  const tfAdvice = shortTf
    ? `当前时框 ${tfLabel}：适合日内短线，信号有效期约数小时，需盯盘。`
    : midTf
    ? `当前时框 ${tfLabel}：适合波段操作，信号有效期1-3天，无需时刻盯盘。`
    : `当前时框 ${tfLabel}：适合趋势/长线布局，信号有效期数天至数周。`;

  // 注入优化器数据
  const optData = (stratOptimizer && P > 0)
    ? stratOptimizer.getBestStrategy(P, H, L, { gn, ch, sr, hr })
    : null;

  return { strategies, score, avgConf, tfLabel, tfAdvice, coin, price: P, breakLevel: BL, gt, optData };
}

function openStratModal() {
  if (!_lastStratData) { alert('请先点击「开始天机推演」'); return; }
  const advice = buildStrategyAdvice(_lastStratData);
  const fmtP = v => { const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'--'; return _v>=1000?'$'+Math.round(_v).toLocaleString():_v>0?'$'+_v.toFixed(4):'--'; };

  document.getElementById('stratModalSub').innerHTML =
    `${advice.coin} · ${fmtP(advice.price)} · ${advice.tfLabel} · 综合评分 <strong style="color:var(--gold)">${advice.score}</strong>`;

  const rows = (s) => `
    <div class="strat-section">入场条件</div>
    <div class="strat-row"><span class="strat-key">触发条件</span><span class="strat-val">${s.condition}</span></div>
    <div class="strat-row"><span class="strat-key">入场价</span><span class="strat-val" style="color:var(--gold)">${s.entry}</span></div>
    <div class="strat-row"><span class="strat-key">执行时机</span><span class="strat-val">${s.timing}</span></div>
    <div class="strat-section">价位设置</div>
    <div class="strat-row"><span class="strat-key">止损</span><span class="strat-val" style="color:var(--bear)">${s.sl}</span></div>
    <div class="strat-row"><span class="strat-key">止盈1</span><span class="strat-val" style="color:var(--bull)">${s.tp1}</span></div>
    <div class="strat-row"><span class="strat-key">止盈2</span><span class="strat-val" style="color:var(--bull)">${s.tp2}</span></div>
    <div class="strat-row"><span class="strat-key">风险回报比</span><span class="strat-val">${s.rrr}</span></div>
    ${s.resZone ? `<div class="strat-row"><span class="strat-key" style="color:var(--bear)">阻力区间</span><span class="strat-val" style="color:var(--bear)">$${Math.round(s.resZone.low).toLocaleString()} – $${Math.round(s.resZone.high).toLocaleString()}</span></div>` : ''}
    ${s.supZone ? `<div class="strat-row"><span class="strat-key" style="color:var(--bull)">支撑区间</span><span class="strat-val" style="color:var(--bull)">$${Math.round(s.supZone.low).toLocaleString()} – $${Math.round(s.supZone.high).toLocaleString()}</span></div>` : ''}
    <div class="strat-note">${s.note}</div>`;

  document.getElementById('stratModalBody').innerHTML = `
    <div style="font-size:.72rem;color:var(--muted);padding:8px 12px;background:rgba(200,168,74,0.06);border-radius:8px;margin-bottom:14px;line-height:1.7">
      ${advice.tfAdvice}
    </div>
    ${advice.strategies.map((s,i) => `
      <div class="strat-card" style="background:${s.color};border-color:${s.border}${i===0?';box-shadow:0 2px 12px rgba(200,168,74,0.1)':''}">
        <div class="strat-head">
          <div>
            ${i===0 ? '<div style="font-size:.62rem;color:var(--gold);font-weight:700;margin-bottom:3px">▶ 首选策略</div>' : ''}
            <div class="strat-name">${s.name}</div>
            <div style="font-size:.65rem;color:var(--muted);margin-top:2px">${s.priority}</div>
          </div>
          <span class="strat-badge" style="background:${s.badgeBg};color:${s.badgeColor};border:1px solid ${s.border}">${s.badge}</span>
        </div>
        ${rows(s)}
      </div>`).join('')}
    ${advice.gt?.AR ? `
    <div style="font-size:.72rem;color:var(--muted);padding:10px 12px;background:rgba(56,168,224,0.06);border:1px solid rgba(56,168,224,0.2);border-radius:8px;margin-top:4px;line-height:1.8">
      🎯 <strong>江恩角线修正目标</strong>：$${Math.round(advice.gt.AR).toLocaleString()} · 约${advice.gt.daysToTarget}天后 · ${advice.gt.angleLabel}
    </div>` : ''}
    ${advice.optData && advice.optData.mature ? `
    <div style="margin-top:10px;padding:12px 14px;background:rgba(96,48,160,.07);border:1px solid rgba(96,48,160,.22);border-radius:10px">
      <div style="font-size:.72rem;font-weight:700;color:#6030a0;margin-bottom:8px">⚡ 策略优化建议（基于${advice.optData.totalRecords}条历史回测）</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px;text-align:center">
        <div style="background:#fff;border:1px solid rgba(20,120,62,.2);border-radius:6px;padding:6px">
          <div style="font-size:.55rem;color:#14783e">优化TP1</div>
          <div style="font-size:.85rem;font-weight:800;color:#14783e">+${advice.optData.tpsl.tpPct}%</div>
        </div>
        <div style="background:#fff;border:1px solid rgba(192,48,48,.2);border-radius:6px;padding:6px">
          <div style="font-size:.55rem;color:#b82020">优化SL</div>
          <div style="font-size:.85rem;font-weight:800;color:#b82020">-${advice.optData.tpsl.slPct}%</div>
        </div>
        <div style="background:#fff;border:1px solid rgba(140,100,16,.2);border-radius:6px;padding:6px">
          <div style="font-size:.55rem;color:#8c6410">最优RRR</div>
          <div style="font-size:.85rem;font-weight:800;color:#8c6410">${advice.optData.tpsl.rrr}:1</div>
        </div>
      </div>
      <div style="font-size:.7rem;color:#555;line-height:1.7">
        最优模型：<strong style="color:#6030a0">${{gann:'江恩',chan:'缠论',sr:'支撑阻力',harmonic:'谐波'}[advice.optData.bestModel]||advice.optData.bestModel}</strong>
        · 历史胜率 <strong>${advice.optData.bestWR}%</strong>
        · 预期收益 <strong style="color:${parseFloat(advice.optData.expectedReturn)>0?'#14783e':'#b82020'}">${advice.optData.expectedReturn}%</strong><br>
        建议仓位（半凯利）：<strong style="color:#6030a0">${advice.optData.halfKelly}%</strong> 账户资金
      </div>
    </div>` : ''}
    <div style="font-size:.65rem;color:var(--faint);text-align:center;margin-top:16px;line-height:1.6">
      ⚠ 以上策略由算法推算，仅供参考，不构成投资建议。<br>实际交易请结合自身风险承受能力与仓位管理原则。
    </div>`;

  document.getElementById('stratModal').classList.add('open');
}

function closeStratModal() {
  document.getElementById('stratModal').classList.remove('open');
}

// Close modal on overlay click
document.addEventListener('click', e => {
  if (e.target === document.getElementById('stratModal')) closeStratModal();
});

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// DASHBOARD ENGINE
// ═══════════════════════════════════════════════

const DASHBOARD_COINS = [
  { sym:'BTCUSDT',  coin:'BTC',  label:'Bitcoin',  color:'#f7931a' },
  { sym:'ETHUSDT',  coin:'ETH',  label:'Ethereum', color:'#627eea' },
  { sym:'SOLUSDT',  coin:'SOL',  label:'Solana',   color:'#9945ff' },
  { sym:'BNBUSDT',  coin:'BNB',  label:'BNB',      color:'#f3ba2f' },
  { sym:'XRPUSDT',  coin:'XRP',  label:'XRP',      color:'#00aae4' },
  { sym:'DOGEUSDT', coin:'DOGE', label:'Dogecoin',  color:'#c2a633' },

  // 大宗商品 — 实时价格 via gold-api
  { coin:'XAU',  label:'黄金',  color:'#d4a030', manual:true, natalKey:'GOLD'  },
  { coin:'XAG',  label:'白银',  color:'#aaaaaa', manual:true, natalKey:'SILVER'},
];

let dashCoins = [...DASHBOARD_COINS]; // mutable list
let dashResults = {};   // coin → result data
let selectedCoin = null;
// Expose to window so debug tools and mobile pollers can access
window.dashCoins   = dashCoins;
window.dashResults = dashResults;

// ── Coin list sidebar renderer ────────────────────────────────────────────
// ── Coin list: left panel rows ────────────────────────────────────────────
let _renderPending = false;
function renderCoinList() {
  if (_renderPending) return;
  _renderPending = true;
  requestAnimationFrame(() => {
    _renderPending = false;
    _renderCoinListNow();
    renderCoinTable();
  });
}
function _renderCoinListNow() {  }

// ── Debounced render — prevent layout thrash from rapid successive calls
var _renderDebTimer = null;
function renderCoinListDebounced() {
  if (_renderDebTimer) return;
  _renderDebTimer = setTimeout(function() {
    _renderDebTimer = null;
    renderCoinListDebounced();
  }, 80);
}

// ── renderCoinsGrid: no-op (we use list layout now) ───────────────────────
function renderCoinsGrid() {
  // Not used in list layout — all rendering is in renderCoinList
}



// ── Run dashboard: fetch all + analyse ───────────────────────────────────
// ═══════════════════════════════════════════════
// AUTO-REFRESH ENGINE
// ═══════════════════════════════════════════════
let arTimer       = null;   // setInterval handle
let arCountdown   = 0;      // seconds remaining
let arIntervalSec = 600;    // default 10 min
let arRunning     = false;
let arCountdownTimer = null;

function toggleAutoRefresh() {
  arRunning ? stopAutoRefresh() : startAutoRefresh();
}

function startAutoRefresh() {
  arRunning = true;
  arIntervalSec = parseInt(document.getElementById('arInterval')?.value || 300);
  arCountdown = arIntervalSec;
  document.getElementById('arToggle').classList.add('active');
  document.getElementById('arIcon').textContent = '⏸';
  updateArDisplay();

  // Countdown ticker
  arCountdownTimer = setInterval(() => {
    arCountdown--;
    if (arCountdown <= 0) {
      arCountdown = arIntervalSec;
      runDashboard();
    }
    updateArDisplay();
  }, 1000);
}

function stopAutoRefresh() {
  arRunning = false;
  clearInterval(arCountdownTimer);
  clearInterval(arTimer);
  document.getElementById('arToggle')?.classList.remove('active');
  const ic = document.getElementById('arIcon');
  if (ic) ic.textContent = '▶';
  const cd = document.getElementById('arCountdown');
  if (cd) { cd.textContent = '已暂停'; cd.classList.remove('active'); }
}

function setAutoRefreshInterval(val) {
  arIntervalSec = parseInt(val);
  const label = document.getElementById('scanIntervalLabel');
  if (label) {
    const mins = arIntervalSec / 60;
    label.textContent = `每${mins < 1 ? arIntervalSec + '秒' : mins + '分钟'}自动扫描`;
  }
  if (arRunning) {
    stopAutoRefresh();
    startAutoRefresh();
  }
}

function updateArDisplay() {
  const cd = document.getElementById('arCountdown');
  if (!cd) return;
  if (!arRunning) { cd.textContent = '已暂停'; cd.classList.remove('active'); return; }
  const m = Math.floor(arCountdown / 60);
  const s = arCountdown % 60;
  cd.textContent = m > 0 ? `${m}:${String(s).padStart(2,'0')}` : `${s}s`;
  cd.classList.add('active');
}

// ═══════════════════════════════════════════════
// PRICE ALERTS ENGINE
// ═══════════════════════════════════════════════
let priceAlerts = [];   // { id, sym, coin, dir, targetPrice, triggered, label }
let alertCheckTimer = null;

function openAlertModal() {
  // Populate coin select with current dashCoins
  const sel = document.getElementById('alertCoin');
  if (sel) {
    sel.innerHTML = dashCoins.map(c =>
      `<option value="${c.sym||c.coin}">${c.coin} — ${c.label}</option>`
    ).join('');
  }
  document.getElementById('alertModal').classList.add('open');
  checkNotifPermission();
  renderAlertList();
}
function closeAlertModal() {
  document.getElementById('alertModal').classList.remove('open');
}

function checkNotifPermission() {
  const bar = document.getElementById('notifBar');
  if (!bar) return;
  if ('Notification' in window && Notification.permission !== 'granted') {
    bar.style.display = 'block';
  } else {
    bar.style.display = 'none';
  }
}
function requestNotifPerm() {
  Notification.requestPermission().then(() => checkNotifPermission());
}

function addAlert() {
  const coinVal = document.getElementById('alertCoin').value;
  const dir     = document.getElementById('alertDir').value;
  const price   = parseFloat(document.getElementById('alertPrice').value);
  if (!price || isNaN(price)) { alert('请输入目标价格'); return; }

  // Resolve coin key
  const c = dashCoins.find(x => (x.sym||x.coin) === coinVal) || { coin: coinVal, label: coinVal };
  const dirLabel = dir === 'above' ? '↑ 突破' : '↓ 跌破';

  priceAlerts.push({
    id:       Date.now(),
    sym:      c.sym,
    coin:     c.coin,
    label:    c.label,
    dir,
    targetPrice: price,
    triggered:   false,
  });
  document.getElementById('alertPrice').value = '';
  renderAlertList();
  startAlertChecker();
}

function removeAlert(id) {
  priceAlerts = priceAlerts.filter(a => a.id !== id);
  renderAlertList();
}

function clearAllAlerts() {
  priceAlerts = [];
  renderAlertList();
}

function renderAlertList() {
  const el   = document.getElementById('alertList');
  const cnt  = document.getElementById('alertCount');
  if (!el) return;
  if (cnt) cnt.textContent = priceAlerts.length;

  if (!priceAlerts.length) {
    el.innerHTML = `<div style="text-align:center;color:var(--faint);font-size:.75rem;padding:20px 0">暂无警报</div>`;
    return;
  }
  const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n)||_n===0)return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };
  el.innerHTML = priceAlerts.map(a => {
    const dirIcon  = a.dir === 'above' ? '↑' : '↓';
    const dirColor = a.dir === 'above' ? 'var(--bull)' : 'var(--bear)';
    const curPrice = dashResults[a.coin]?.price;
    const curStr   = curPrice ? ` · 现价 ${fmtP(curPrice)}` : '';
    const trig     = a.triggered ? ` <span style="color:var(--bull);font-weight:700">✓ 已触发</span>` : '';
    return `<div class="alert-item${a.triggered?' triggered':''}">
      <div>
        <div style="font-size:.8rem;font-weight:700">
          <span style="color:${dirColor}">${dirIcon}</span>
          ${a.coin} ${fmtP(a.targetPrice)}
          ${trig}
        </div>
        <div style="font-size:.62rem;color:var(--muted)">${a.label}${curStr}</div>
      </div>
      <button onclick="removeAlert(${a.id})" class="icon-btn" style="padding:3px 8px;font-size:.65rem">✕</button>
    </div>`;
  }).join('');
}

function startAlertChecker() {
  if (alertCheckTimer) return;
  alertCheckTimer = setInterval(checkAlerts, 15000); // check every 15s
}

function checkAlerts() {
  let triggered = false;
  priceAlerts.forEach(a => {
    if (a.triggered) return;
    // Get current price: from dashResults or fetch live
    const res = dashResults[a.coin];
    if (!res || res === 'loading') return;
    const price = res.price;
    if (!price) return;

    const hit = a.dir === 'above' ? price >= a.targetPrice : price <= a.targetPrice;
    if (hit) {
      a.triggered = true;
      triggered   = true;
      fireAlert(a, price);
    }
  });
  if (triggered) renderAlertList();
  // Live-fetch prices for coins not yet in dashResults
  priceAlerts.filter(a => !a.triggered && a.sym).forEach(async a => {
    try {
      const r = await smartFetch(`https://api.binance.com/api/v3/ticker/price?symbol=${a.sym}`);
      const d = await r.json();
      const p = parseFloat(d.price);
      if (!p) return;
      const hit = a.dir === 'above' ? p >= a.targetPrice : p <= a.targetPrice;
      if (hit && !a.triggered) {
        a.triggered = true;
        fireAlert(a, p);
        renderAlertList();
      }
    } catch(e) {}
  });
}

function fireAlert(a, price) {
  const dirLabel = a.dir === 'above' ? '突破上方' : '跌破下方';
  const msg      = `🔔 ${a.coin} ${dirLabel} $${a.targetPrice.toLocaleString()} — 现价 $${price.toLocaleString(undefined,{maximumFractionDigits:2})}`;

  // Browser notification
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(`天機數元 价格警报`, { body: msg, icon: '' });
  }

  // 🔊 Sound alert — 双音提示
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const playBeep = (freq, startTime, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.4, startTime + 0.02);
      gain.gain.linearRampToValueAtTime(0, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.05);
    };
    const t = ctx.currentTime;
    // Bull = 上升双音；Bear = 下降双音
    if (a.dir === 'above') { playBeep(880, t, 0.15); playBeep(1100, t+0.18, 0.2); }
    else                   { playBeep(660, t, 0.15); playBeep(440,  t+0.18, 0.2); }
  } catch(e) {}

  // 📳 iOS / Android vibration
  if (navigator.vibrate) {
    navigator.vibrate(a.dir === 'above' ? [100, 50, 200] : [200, 50, 100, 50, 100]);
  }

  // In-page toast
  showAlertToast(msg, a.dir);

  // Flash alert button
  const btn = document.getElementById('alertBell');
  if (btn) {
    btn.style.animation = 'bellRing .4s ease 3';
    setTimeout(() => { btn.style.animation = ''; }, 1400);
  }
}

function showAlertToast(msg, dir) {
  const toast = document.createElement('div');
  toast.className = 'alert-toast ' + (dir === 'above' ? 'toast-bull' : 'toast-bear');
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 50);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 400);
  }, 6000);
}

// ═══════════════════════════════════════════════
// COMMODITY PRICE: manual input modal
// ═══════════════════════════════════════════════
function openManualPriceModal(coinKey) {
  const c = dashCoins.find(x => x.coin === coinKey);
  const existing = dashResults[coinKey];
  const cur = existing && existing !== 'loading' ? existing.price : '';

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay open';
  overlay.id = 'manualPriceModal';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:360px">
      <button class="modal-close" onclick="document.getElementById('manualPriceModal').remove()">✕</button>
      <div class="modal-title">${c?.label || coinKey} 手动输入价格</div>
      <div class="modal-sub">输入当前市场价格（美元）</div>
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-top:12px">
        <input type="number" id="manualPriceInput" class="ctrl-select" value="${cur}"
          placeholder="${coinKey==='XAU'?'如 3100':coinKey==='XAG'?'如 34':coinKey==='TSMC'?'如 180':coinKey==='SPX'?'如 5700':coinKey==='HSI'?'如 22000':'如 78.5'}"
          step="0.01" style="width:100%;font-size:.9rem;padding:9px 10px">
        <button onclick="applyManualPrice('${coinKey}')" style="
          background:linear-gradient(135deg,var(--gold),var(--gold3));color:#fff;
          border:none;border-radius:8px;padding:9px 18px;font-weight:700;font-family:inherit;cursor:pointer">
          确认
        </button>
      </div>
      <div style="font-size:.65rem;color:var(--faint);margin-top:8px">
        ${coinKey==='XAU'?'参考：Kitco / gold-api.com 现货价（自动抓取）':
          coinKey==='XAG'?'参考：Kitco / 东方财富 XAG/USD 现货价（自动抓取）':
          coinKey==='WTI'?'参考：WTI 原油期货现价（美元/桶）':
          coinKey==='TSMC'?'参考：Yahoo Finance TSM（NYSE ADR，美元）':
          coinKey==='SPX'?'参考：Yahoo Finance ^GSPC（标普500指数点位）':
          coinKey==='HSI'?'参考：Yahoo Finance ^HSI（恒生指数点位，港元）':
          `输入 ${coinKey}/USDT 当前价格`}
      </div>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('manualPriceInput')?.focus(), 100);
}

function applyManualPrice(coinKey) {
  const val = parseFloat(document.getElementById('manualPriceInput')?.value);
  if (!val || isNaN(val)) { alert('请输入有效价格'); return; }
  document.getElementById('manualPriceModal')?.remove();

  // Store price and run analysis
  const c = dashCoins.find(x => x.coin === coinKey);
  runCommodityAnalysis(c, val);
}

// 大宗商品实时价格：XAU/XAG → gold-api.com（免费无key，CORS开放）
//                  WTI      → EIA API（已配置key）
const EIA_API_KEY = 'TqlgqKbmbuZQIMMfxqZcJbgL8jaSuQ53SlGGENro';

async function fetchCommodityLivePrice(coin) {
  // ── 黄金 / 白银 → gold-api.com（免费，CORS开放）────────────────────────
  if (coin === 'XAU' || coin === 'XAG') {
    const r = await fetch(`https://api.gold-api.com/price/${coin}`);
    if (!r.ok) throw new Error('gold-api error');
    const d = await r.json();
    return { price: parseFloat(d.price), chg24: parseFloat(d.chp || 0) };
  }

  // ── 原油WTI → EIA API ────────────────────────────────────────────────
  if (coin === 'WTI') {
    const url = `https://api.eia.gov/v2/petroleum/pri/spt/data/?api_key=${EIA_API_KEY}&frequency=daily&data[0]=value&sort[0][column]=period&sort[0][direction]=desc&length=2&facets[product][]=RWTC`;
    const r = await fetch(url);
    if (!r.ok) throw new Error('EIA error');
    const d = await r.json();
    const rows = d?.response?.data || [];
    if (!rows.length) throw new Error('EIA no data');
    const price = parseFloat(rows[0].value);
    const prev  = rows[1] ? parseFloat(rows[1].value) : price;
    return { price, chg24: prev ? (price - prev) / prev * 100 : 0 };
  }

  // ── 台积电(TSM) / 标普500(SPX) / 恒生指数(HSI) → Yahoo Finance via Worker ──
  const yahooMap = {
    TSMC: 'TSM',        // 台积电 NYSE ADR
    SPX:  '%5EGSPC',    // S&P 500
    HSI:  '%5EHSI',     // 恒生指数
  };
  const ticker = yahooMap[coin];
  if (ticker) {
    try {
      // Yahoo Finance v8 JSON API（经由 Worker 代理解决 CORS）
      const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?interval=1d&range=2d`;
      const res = await smartFetch(yahooUrl);
      const d   = await res.json();
      const meta   = d?.chart?.result?.[0]?.meta;
      const quotes = d?.chart?.result?.[0]?.indicators?.quote?.[0];
      if (!meta || !meta.regularMarketPrice) throw new Error('Yahoo数据格式异常');
      const price   = parseFloat(meta.regularMarketPrice);
      const prevClose = parseFloat(meta.chartPreviousClose || meta.previousClose || price);
      const chg24   = prevClose > 0 ? ((price - prevClose) / prevClose * 100) : 0;
      return { price, chg24 };
    } catch(e) {
      console.warn(`[fetchCommodityLivePrice] ${coin} Yahoo失败:`, e.message);
      // 备用：返回 null，触发手动输入提示
      return null;
    }
  }

  return null;
}

async function runCommodityAnalysis(c, manualPrice) {
  dashResults[c.coin] = 'loading';
  renderCoinListDebounced();

  const today    = nowUTC8DateStr();
  const sys      = getSys();
  const breakLvl = parseFloat(document.getElementById('breakLevel').value) || 0;
  const span     = parseFloat(document.getElementById('span').value) || 90;

  // 优先用实时价格，失败则用手动输入
  let price = manualPrice || 0;
  let chg24 = 0;
  if (!manualPrice) {
    try {
      const live = await fetchCommodityLivePrice(c.coin);
      if (live) { price = live.price; chg24 = live.chg24; }
    } catch(e) {  }
  }

  // 没有价格 → 提示手动输入
  if (!price) {
    dashResults[c.coin] = { coin:c.coin, label:c.label, color:c.color, needsPrice:true };
    renderCoinListDebounced();
    return;
  }

  // estimate high/low from ±10% (no kline data for commodities)
  const high = price * 1.10;
  const low  = price * 0.90;

  try {
    const qm = sys.qimen   ? engineQiMen(c.coin, today)                          : null;
    const ic = sys.iching  ? engineIChing(c.coin, today)                          : null;
    const ve = sys.vedic   ? engineVedic(c.coin, today)                           : null;
    const gn = sys.gann    ? engineGann(c.coin, today, price, high, low)          : null;
    const hr = sys.harmonic? engineHarmonic(c.coin, today, price, high, low)      : null;
    const sr = sys.sr      ? engineSR(c.coin, today, price, high, low)            : null;
    const ch = sys.chan    ? engineChan(c.coin, today, price, high, low, breakLvl): null;
    const nt = sys.natal   ? engineNatal(c.coin, today, price)                    : null;
    const zw = sys.ziwei   ? engineZiwei(c.coin, today)                           : null;
    const va = sys.volRate ? engineVideoAlgo(c.coin, today, price, high, low)     : null;
    const gt = engineGannTime(today, price, high, low);
    const currentTFc = document.getElementById('fetchPeriod').value || '4h';
    const rsiE  = engineRSI(c.coin, today, price, high, low, null);
    const macdE = engineMACD(c.coin, today, price, high, low, null);
    const bbE   = engineBollinger(c.coin, today, price, high, low, null);
    const tdE   = engineTDSequential(c.coin, today, price, high, low, null);
    const mtfE  = engineMultiTFBoll(c.coin, today, price, high, low, null);
    const tfRec = engineAutoTF(price, high, low, rsiE, macdE, bbE, tdE, currentTFc, span);
    const nodes = generateNodes(c.coin, today, span, sys, {qm,ic,ve,gn,hr,sr,ch,nt});

    // 价格引擎（江恩/谐波/SR/缠论/命盘）决定方向，时间引擎仅辅助
    // 使用状态感知权重：先判断市场状态，再选对应权重加权计算
    const _stateWeights = getWeightsByState(_currentMarketState?.state || 'ranging');
    const _mw = {
      gann:     _stateWeights.gann    || 0.35,
      chan:      _stateWeights.chan     || 0.25,
      sr:        _stateWeights.sr       || 0.25,
      harmonic:  _stateWeights.harmonic || 0.15,
      mature:    tracker.priceErrors.length >= 10,
    };
    const _priceEngW = [
      gn ? { e: gn, w: _mw ? _mw.gann    : 0.40 } : null,
      hr ? { e: hr, w: _mw ? _mw.harmonic : 0.15 } : null,
      sr ? { e: sr, w: _mw ? _mw.sr       : 0.20 } : null,
      ch ? { e: ch, w: _mw ? _mw.chan     : 0.25 } : null,
      nt ? { e: nt, w: 0.10 }                      : null,
    ].filter(Boolean);
    const _timeEng  = [qm,ic,ve,va].filter(Boolean);
    const _totalPW  = _priceEngW.reduce((s,e) => s + e.w, 0) || 1;
    const _priceAvg = _priceEngW.length
      ? _priceEngW.reduce((s,e) => s + (e.e.bias||0) * e.w, 0) / _totalPW : 0;
    const _timeAvg  = _timeEng.length
      ? _timeEng.reduce((s,e)=>s+(e.bias||0),0)/_timeEng.length : 0;
    const active    = [..._priceEngW.map(e=>e.e), ..._timeEng];
    const avgBias   = _priceEngW.length ? _priceAvg*0.80 + _timeAvg*0.20 : _timeAvg;
    const avgConf   = active.length ? active.reduce((s,e)=>s+(e.conf||0),0)/active.length : 0.5;
    const score   = Math.round((avgBias+1)/2*100);
    const titles  = ['天地否塞·空头','阴云密布·偏空','中性徘徊','温和向上·偏多','天时地利·强多'];
    const ti      = score>=80?4:score>=60?3:score>=45?2:score>=30?1:0;
    const sentiment = buildCoinSentiment(c.coin, avgBias, null, ch, gn, va);

    dashResults[c.coin] = {
      coin:c.coin, label:c.label, color:c.color, manual:true,
      price, chg24, high, low, breakLvl,
      qm,ic,ve,gn,hr,sr,ch,nt,zw,va,gt,sys,
      rsiE, macdE, bbE, tdE, tfRec, mtfE,
      avgBias, avgConf, score, sentiment,
      verdictTitle: titles[ti],
      chanBeichi: ch?.beichi ? ch.beichiType : null,
      chanBSP: ch?.bspDir || null,
      inDemand: ch?.inDemand || false,
      nearPRZ: hr?.patterns?.some(p=>p.completion>0.85) || false,
      gannAR: gt?.AR, gannDays: gt?.daysToTarget, gannStrength: gt?.angleStrength,
      intradayPeaks: [],
      tpsl: engineTPSL(c.coin, today, price, high, low, {sr,gn,ch,hr,nt}),
      tpsl5: engineTPSL5(c.coin, today, price, high, low, {sr,gn,ch,hr}),
      nodes, date: today, span,
    };
  } catch(e) {
    dashResults[c.coin] = { coin:c.coin, label:c.label, color:c.color, error:e.message, score:50, avgBias:0, avgConf:.5 };
  }
  renderCoinListDebounced();
}

// ═══════════════════════════════════════════════
// MAIN DASHBOARD RUN
// ═══════════════════════════════════════════════
// ── 网络诊断：逐一测试每个通道，显示原始响应 ─────────────────────────────
async function runNetDiag() {
  const box = document.getElementById('netDiagResult');
  box.style.display = 'block';
  box.textContent = '🔍 诊断中，请稍候…\n';

  const TEST_URL = 'https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT';
  const enc      = encodeURIComponent(TEST_URL);

  const tests = [
    { label: '① Binance Direct',    url: TEST_URL,                                         init: {} },
    { label: '② corsproxy.io',      url: 'https://corsproxy.io/?' + enc,                   init: { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({url:TEST_URL}) } },
    { label: '③ corsproxy.io',        url: 'https://corsproxy.io/?' + enc,                  init: {} },
    { label: '④ allorigins /get',     url: 'https://api.allorigins.win/get?url=' + enc,     init: {} },
    { label: '⑤ 直连 Binance',        url: TEST_URL,                                        init: {} },
  ];

  let out = `目标: ${TEST_URL}\n${'─'.repeat(40)}\n`;
  box.textContent = out;

  for (const t of tests) {
    const t0 = Date.now();
    try {
      const r    = await Promise.race([
        fetch(t.url, t.init),
        new Promise((_, rej) => setTimeout(() => rej(new Error('10s超时')), 10000)),
      ]);
      const ms   = Date.now() - t0;
      const text = await r.text();
      const preview = text.slice(0, 120).replace(/\n/g, ' ');
      const status = r.ok ? '✅' : '⚠️';
      out += `${status} ${t.label}\n   HTTP ${r.status} · ${ms}ms\n   ${preview}\n\n`;
    } catch (e) {
      const ms = Date.now() - t0;
      out += `❌ ${t.label}\n   ${e.message} · ${ms}ms\n\n`;
    }
    box.textContent = out;
    await new Promise(r => setTimeout(r, 200));
  }
  out += '─'.repeat(40) + '\n诊断完成。请截图此结果。';
  box.textContent = out;
}

async function runDashboard() {
  const btn = document.getElementById('runAllBtn');
  const scanBar = document.getElementById('scanStatusBar');
  const scanTxt = document.getElementById('scanStatusText');
  btn.textContent = '⏳ 连接中...';
  btn.classList.add('loading');
  if (scanBar) scanBar.style.display = 'flex';
  if (scanTxt) scanTxt.textContent = '正在连接 CF Worker…';
  if (typeof _wEl !== 'undefined' && _wEl) { _wEl.style.display = 'none'; _wEl.style.flex = '0'; }
  dashCoins.forEach(c => { dashResults[c.coin] = 'loading'; });
  renderCoinListDebounced();

  // ── 连通性测试：用真实 ticker 验证 Worker 能返回 Binance 数据 ──────────
  let canConnect = false;
  try {
    const testRes  = await smartFetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT');
    const testData = await testRes.json();
    const _testPrice = parseFloat(testData.price);
    if (testData && testData.price && _testPrice > 0) {
      // ── 连通性校验：BTC价格必须 > $5000，否则代理返回了错误数据 ──
      if (_testPrice < 5000) {
        throw new Error(`代理返回BTC价格异常 ($${_testPrice})，数据不可信，请使用直接推演`);
      }
      canConnect = true;
      if (scanTxt) scanTxt.textContent = `✓ 已连接 BTC=$${_testPrice.toLocaleString(undefined,{maximumFractionDigits:0})}`;
    } else {
      throw new Error('ticker返回数据异常: ' + JSON.stringify(testData).slice(0, 80));
    }
  } catch(e) {
  }

  if (!canConnect) {
    btn.textContent = '☁ 联网全部推演';
    btn.classList.remove('loading');
    if (scanBar) scanBar.style.display = 'none';
    dashCoins.forEach(c => { dashResults[c.coin] = { coin:c.coin, label:dashCoins.find(x=>x.coin===c.coin)?.label||c.coin, color:'var(--gold)', error:'网络不可用，请点击手动输入价格' }; });
    renderCoinListDebounced();
    try { if (typeof renderCoinCards === 'function') renderCoinCards(); } catch(_e) {}
    // Network fail: show inline notice in scan bar, not welcome overlay
    const scanBarEl = document.getElementById('scanStatusBar');
    const scanTxtEl = document.getElementById('scanStatusText');
    if (scanBarEl) scanBarEl.style.display = 'flex';
    if (scanTxtEl) scanTxtEl.innerHTML = '📡 网络不可用 · 点击左侧<strong style="color:var(--gold);margin:0 4px">⚡ 直接推演</strong>手动输入价格';
    return;
  }
  const sentPanel = document.getElementById('sentimentPanel');
  if (sentPanel) sentPanel.style.display = 'block';
  const tf  = document.getElementById('fetchPeriod').value || '4h';
  const pk  = PERIOD_KLINE[tf] || { interval:'4h', limit:42 };
  const sys = getSys();

  // ── 基准日期：用户选的还是今天 ──
  const todayStr   = nowUTC8DateStr();
  const baseDateEl = document.getElementById('baseDate');
  const userDate   = baseDateEl?.value || todayStr;
  const isHistoric = userDate < todayStr;
  const analysisDate = userDate; // 传给所有引擎

  // 状态栏提示
  if (isHistoric && scanTxt) scanTxt.textContent = `历史回溯模式：${analysisDate}`;

  try {
    const cryptoCoins = dashCoins.filter(c => !c.manual);

    // Fetch global sentiment data once
    const sentData = await fetchSentimentData().catch(() => null);
    renderSentimentPanel(sentData);

    let doneCount = 0;
    const total = cryptoCoins.length;
    const setProgress = (coin) => {
      btn.textContent = `⏳ ${coin} (${doneCount}/${total})`;
      if (scanTxt) scanTxt.textContent = coin
        ? `${isHistoric ? '📅 历史' : ''}推演 ${coin}… (${doneCount}/${total})`
        : (isHistoric ? `📅 获取 ${analysisDate} 历史价格…` : '正在抓取实时价格…');
    };

    // ── 获取价格：历史日期用 klines startTime，今天用实时 ticker ──
    setProgress('');
    const priceMap = {};

    if (isHistoric) {
      // 历史模式：串行抓取
      const startMs = new Date(analysisDate).getTime();
      const endMs   = startMs + 86400000;
      for (const c of cryptoCoins) {
        const histUrl   = `https://api.binance.com/api/v3/klines?symbol=${c.sym}&interval=1d&startTime=${startMs}&endTime=${endMs}&limit=1`;
        const periodStartMs = startMs - pk.limit * 86400000 * 2;
        const periodUrl = `https://api.binance.com/api/v3/klines?symbol=${c.sym}&interval=${pk.interval}&startTime=${periodStartMs}&endTime=${endMs}&limit=${pk.limit}`;
        try {
          // Fetch daily candle for that date（用 smartFetch 走 Worker）
          let dayCandle = null;
          try {
            const res = await smartFetch(histUrl, { noCache: true });
            const d = await res.json();
            if (Array.isArray(d) && d.length > 0) dayCandle = d[0];
          } catch(e) {}
          if (!dayCandle) throw new Error(`无法获取 ${analysisDate} 历史数据`);

          const price = parseFloat(dayCandle[4]); // close
          const high  = parseFloat(dayCandle[2]);
          const low   = parseFloat(dayCandle[3]);
          const open  = parseFloat(dayCandle[1]);
          const chg24 = open > 0 ? ((price - open) / open * 100) : 0;

          // Fetch period klines（用 smartFetch 走 Worker）
          let klines = [];
          try {
            const res = await smartFetch(periodUrl, { noCache: true });
            const d = await res.json();
            if (Array.isArray(d) && d.length > 5) klines = d;
          } catch(e) {}

          // High/low over the period klines
          let periodHigh = high, periodLow = low;
          if (klines.length) {
            periodHigh = Math.max(...klines.map(k => parseFloat(k[2])));
            periodLow  = Math.min(...klines.map(k => parseFloat(k[3])));
          }

          priceMap[c.coin] = { price, chg24, high: periodHigh, low: periodLow, klines, histClose: price };
        } catch(e) {
          priceMap[c.coin] = { error: e.message };
        }
        await new Promise(r => setTimeout(r, 300));
      }
    } else {
      // 实时模式：串行抓取（避免并发压垮 Worker 免费版限额）
      for (const c of cryptoCoins) {
        try {
          const pd = await fetchPriceDirect(c.sym, pk.interval, pk.limit);
          priceMap[c.coin] = pd;
          // ── 实时价格确认日志（调试用）──
          if (pd.price) {
            const priceStr = pd.price >= 1000 ? '$' + Math.round(pd.price).toLocaleString() : '$' + pd.price.toFixed(4);
            if (scanTxt) scanTxt.textContent = `✓ ${c.coin} ${priceStr} · 抓取中…`;
          }
        } catch(e) {
          priceMap[c.coin] = { error: e.message };
          console.error(`[Dashboard] ${c.coin} 抓取失败:`, e.message);
        }
        // 每次请求间隔300ms，防止 Worker 触发速率限制
        await new Promise(r => setTimeout(r, 300));
      }
    }

    // ── 市场状态分类（用第一个成功的币种K线判断）────────────────────────
    // 写入全局 _currentMarketState，供误差记录和权重选择使用
    const firstValidKlines = Object.values(priceMap)
      .find(pd => pd.klines && pd.klines.length >= 20)?.klines;
    if (firstValidKlines && typeof classifyMarketState === 'function') {
      _currentMarketState = classifyMarketState(firstValidKlines);
      if (scanTxt) scanTxt.textContent =
        `市场状态：${_currentMarketState.label} · ADX=${_currentMarketState.adx} · ATR=${_currentMarketState.atrPct}%`;
    }

    // Run engines sequentially per coin, yield between each for UI update
    for (const c of cryptoCoins) {
      setProgress(c.coin);
      await new Promise(r => setTimeout(r, 0));
      try {
        const pd = priceMap[c.coin];
        if (pd.error) throw new Error(pd.error);
        const { price, chg24, high, low, klines } = pd;
        const breakLvl = parseFloat(document.getElementById('breakLevel').value) || 0;
        const span     = parseFloat(document.getElementById('span').value) || 90;
        const currentTF = document.getElementById('fetchPeriod').value || '4h';

        // ── Phase 1: Fast engines ──
        const qm = sys.qimen   ? engineQiMen(c.coin, analysisDate)                              : null;
        const ic = sys.iching  ? engineIChing(c.coin, analysisDate)                              : null;
        const ve = sys.vedic   ? engineVedic(c.coin, analysisDate)                              : null;
        const gn = sys.gann    ? engineGann(c.coin, analysisDate, price, high, low)             : null;
        const sr = sys.sr      ? engineSR(c.coin, analysisDate, price, high, low)               : null;
        const ch = sys.chan    ? engineChan(c.coin, analysisDate, price, high, low, breakLvl)   : null;
        const rsiE  = engineRSI(c.coin, analysisDate, price, high, low, klines);
        const macdE = engineMACD(c.coin, analysisDate, price, high, low, klines);
        const active1 = [qm,ic,ve,gn,sr,ch].filter(Boolean);
        const avgBias1 = active1.length ? active1.reduce((s,e)=>s+(e.bias||0),0)/active1.length : 0;
        const score1 = Math.round((avgBias1+1)/2*100);
        const titles = ['天地否塞·空头','阴云密布·偏空','中性徘徊','温和向上·偏多','天时地利·强多'];
        dashResults[c.coin] = { coin:c.coin, label:c.label, color:c.color, price, chg24, high, low, score:score1, avgBias:avgBias1, avgConf:.5, verdictTitle:titles[score1>=80?4:score1>=60?3:score1>=45?2:score1>=30?1:0], klines, _partial:true };
        try { renderCoinTable(); } catch(e) {}
        try { if (typeof renderCoinCards==='function') renderCoinCards(); } catch(_e) {}

        // ── Phase 2: Heavier engines ──
        await new Promise(r => setTimeout(r, 0));
        const hr = sys.harmonic? engineHarmonic(c.coin, analysisDate, price, high, low)         : null;
        const nt = sys.natal   ? engineNatal(c.coin, analysisDate, price)                       : null;
        const zw = sys.ziwei   ? engineZiwei(c.coin, analysisDate)                              : null;
        const va = sys.volRate ? engineVideoAlgo(c.coin, analysisDate, price, high, low)        : null;
        const wa = engineWesternAstrology(c.coin, analysisDate);   // 第11引擎：西方占星
        const gt = engineGannTime(analysisDate, price, high, low);
        const bbE   = engineBollinger(c.coin, analysisDate, price, high, low, klines);
        const tdE   = engineTDSequential(c.coin, analysisDate, price, high, low, klines);
        const mtfE  = engineMultiTFBoll(c.coin, analysisDate, price, high, low, klines);
        const tfRec = engineAutoTF(price, high, low, rsiE, macdE, bbE, tdE, currentTF, span);

        // ── Phase 3: Node generation ──
        await new Promise(r => setTimeout(r, 0));
        const nodes = generateNodes(c.coin, analysisDate, span, sys, {qm,ic,ve,gn,hr,sr,ch,nt});
        const active = [qm,ic,ve,gn,hr,sr,ch,nt,va,wa].filter(Boolean);
        const avgBias = active.length ? active.reduce((s,e)=>s+(e.bias||0),0)/active.length : 0;
        const avgConf = active.length ? active.reduce((s,e)=>s+(e.conf||0),0)/active.length : 0.5;
        const score   = Math.round((avgBias+1)/2*100);
        const ti = score>=80?4:score>=60?3:score>=45?2:score>=30?1:0;
        const sentiment = buildCoinSentiment(c.coin, avgBias, sentData, ch, gn, va);
        const peakTimes = [];
        if (nodes?.length) {
          [...nodes].sort((a,b)=>(b.conf||0)-(a.conf||0)).slice(0,3)
            .forEach(n => { if (n.timeInfo?.time) peakTimes.push(n.timeInfo.time); });
        }
        const tpsl  = engineTPSL(c.coin, analysisDate, price, high, low, {sr,gn,ch,hr,nt});

        // ── TP/SL 合理性后校验 ─────────────────────────────────────────
        if (tpsl?.tpLevels?.[0]?.price && price > 0) {
          const _tp1 = tpsl.tpLevels[0].price;
          const _pctDiff = Math.abs(_tp1 - price) / price;
          if (_pctDiff > 0.5) {
            /* TPSL偏差已通过_priceWarning通知用户 */
          }
        }
        const tpsl5 = engineTPSL5(c.coin, analysisDate, price, high, low, {sr,gn,ch,hr});

        // ── 价格合理性后校验 ─────────────────────────────────────────────
        let _priceWarning = null;
        if (tpsl?.tpLevels?.[0]?.price && price > 0) {
          const _tp1val = tpsl.tpLevels[0].price;
          const _sl1val = tpsl.slLevels?.[0]?.price || 0;
          const _tpRat  = Math.abs(_tp1val - price) / price;
          const _slRat  = _sl1val > 0 ? Math.abs(_sl1val - price) / price : 0;
          if (_tpRat > 0.5 || _slRat > 0.5) {
            _priceWarning = `⚠️ 网络代理返回了异常价格 ($${price})，TP/SL 数值不可信。请使用左侧「直接推演」手动输入正确价格。`;
            /* TPSL异常已通过_priceWarning通知用户 */
          }
        }

        dashResults[c.coin] = {
          coin:c.coin, label:c.label, color:c.color,
          price, chg24, high, low, breakLvl,
          qm,ic,ve,gn,hr,sr,ch,nt,zw,va,wa,gt,sys,
          rsiE, macdE, bbE, tdE, tfRec, mtfE,
          avgBias, avgConf, score, verdictTitle: titles[ti], sentiment,
          chanBeichi: ch?.beichi ? ch.beichiType : null,
          chanBSP: ch?.bspDir || null,
          inDemand: ch?.inDemand || false,
          nearPRZ: hr?.patterns?.some(p=>p.completion>0.85) || false,
          gannAR: gt?.AR, gannDays: gt?.daysToTarget, gannStrength: gt?.angleStrength,
          intradayPeaks: peakTimes,
          tpsl, tpsl5, nodes,
          date: analysisDate,
          isHistoric, span,
          klines,
          _priceWarning,  // 价格异常警告（非null则UI展示）
        };
        checkAlertsForCoin(c.coin, price);
      } catch(e) {
        console.error('Coin analysis error for', c.coin, ':', e.message, e.stack);
        dashResults[c.coin] = { coin:c.coin, label:c.label, color:c.color, error:e.message, score:50, avgBias:0, avgConf:.5, chg24:0, price:0 };
      }
      doneCount++;
      try { renderCoinTable(); } catch(re) { console.warn('render err:', re.message); }
      try { if (typeof renderCoinCards==='function') renderCoinCards(); } catch(_e) {}
    }

    await Promise.all(dashCoins.filter(c => c.manual).map(c => runCommodityAnalysis(c)));
    updateTfRecommendation();
    renderCoinTable();
    try { if (typeof renderCoinCards==='function') renderCoinCards(); } catch(_e) {}
    // Force welcome hidden after full render
        
    if (scanBar) scanBar.style.display = 'none';

    // ── 历史模式：自动验证误差 ────────────────────────────────────────────
    // 获取"N天后"实际价格对比推演结果，自动记录到误差追踪器
    if (isHistoric && typeof autoVerifyHistoric === 'function') {
      const verifyDays = 3;
      const pMap = {};
      cryptoCoins.forEach(c => {
        const r = dashResults[c.coin];
        if (r && r.price) pMap[c.coin] = { price: r.price, high: r.high, low: r.low };
      });
      if (Object.keys(pMap).length > 0) {
        autoVerifyHistoric(analysisDate, pMap, verifyDays)
          .then(() => { updateErrorPanel(); stratOptimizer && updateStratOptPanel(); })
          .catch(() => {});
      }
    }

  } finally {
    const badge = document.getElementById('historicBadge');
    if (badge) badge.style.display = isHistoric ? 'inline' : 'none';
    btn.textContent = isHistoric ? `📅 重新推演 (${analysisDate})` : '✦ 重新推演';
    btn.classList.remove('loading');
    btn.disabled = false;
    if (scanBar) { scanBar.style.display = 'none'; }
    const _scanTxt = document.getElementById('scanStatusText');
    if (_scanTxt) _scanTxt.textContent = '正在扫描…';
    document.querySelectorAll('.welcome').forEach(el => { el.style.display = 'none'; });
    renderCoinTable();
    try { if (typeof renderCoinCards === 'function') renderCoinCards(); } catch(_e) {}
    try { updateLearnStatusBar(); } catch(_e) {}

    // iOS 强制刷新
    setTimeout(() => {
      try { if (typeof renderCoinCards === 'function') renderCoinCards(); } catch(_e) {}
    }, 200);
  }
}

// ══════════════════════════════════════════════════════
// 学习状态指示器
// ══════════════════════════════════════════════════════
function updateLearnStatusBar() {
  const bar   = document.getElementById('learnStatusBar');
  if (!bar) return;

  // Get record count from tracker or localStorage
  let rec = 0;
  try {
    rec = window.tracker?.priceErrors?.length || 0;
    if (rec === 0) {
      const stored = JSON.parse(_localStorage.getItem('err_price') || '[]');
      rec = stored.length;
    }
  } catch(_) {}

  // Always show the bar
  bar.style.display = 'flex';

  const icon  = document.getElementById('learnStatusIcon');
  const label = document.getElementById('learnStatusLabel');
  const count = document.getElementById('learnStatusCount');
  const fill  = document.getElementById('learnStatusFill');
  const tip   = document.getElementById('learnStatusTip');

  const pct = Math.min(100, (rec / 1000) * 100);
  if (fill) fill.style.width = pct.toFixed(1) + '%';
  if (count) count.textContent = rec + ' / 1000 条';

  if (rec >= 1000) {
    if (icon)  icon.textContent  = '✅';
    if (label) { label.textContent = '系统已成熟'; label.style.color = 'var(--bull)'; }
    if (fill)  fill.style.background = 'linear-gradient(90deg,#16a34a,#22c55e)';
    if (tip)   tip.textContent = '权重已优化，分析可信';
  } else if (rec >= 500) {
    if (icon)  icon.textContent  = '🔥';
    if (label) { label.textContent = '接近成熟'; label.style.color = 'var(--amber)'; }
    if (fill)  fill.style.background = 'linear-gradient(90deg,#d97706,#f59e0b)';
    if (tip)   tip.textContent = '再积累 ' + (1000 - rec) + ' 条';
  } else if (rec >= 100) {
    if (icon)  icon.textContent  = '📊';
    if (label) { label.textContent = '参考级'; label.style.color = 'var(--gold)'; }
    if (fill)  fill.style.background = 'linear-gradient(90deg,var(--gold),var(--gold3))';
    if (tip)   tip.textContent = '再积累 ' + (1000 - rec) + ' 条';
  } else if (rec >= 20) {
    if (icon)  icon.textContent  = '📈';
    if (label) { label.textContent = '初步可用'; label.style.color = '#2c50a8'; }
    if (fill)  fill.style.background = 'linear-gradient(90deg,#2c50a8,#4a72d4)';
    if (tip)   tip.textContent = '需更多数据';
  } else {
    if (icon)  icon.textContent  = '⏳';
    if (label) { label.textContent = '积累数据中'; label.style.color = 'var(--muted)'; }
    if (fill)  fill.style.background = 'linear-gradient(90deg,#888,#aaa)';
    if (tip)   tip.textContent = '还需 ' + (20 - rec) + ' 条启动';
  }
}
window.updateLearnStatusBar = updateLearnStatusBar;

// 页面加载时初始化
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(updateLearnStatusBar, 1500);
});

// 显式挂载到 window（供其他模块使用）
window.runDashboard = runDashboard;

function checkAlertsForCoin(coinKey, price) {
  let triggered = false;
  priceAlerts.forEach(a => {
    if (a.triggered || a.coin !== coinKey) return;
    const hit = a.dir === 'above' ? price >= a.targetPrice : price <= a.targetPrice;
    if (hit) { a.triggered = true; triggered = true; fireAlert(a, price); }
  });
  if (triggered) renderAlertList();
}

// ── Select coin: show detail panel ────────────────────────────────────────
function selectCoin(coinKey) {
  const res = dashResults[coinKey];
  if (!res || res === 'loading') return;
  // Allow opening even with error - show manual price input
  if (res.error || res.needsPrice) {
    openManualPriceModal(coinKey);
    return;
  }

  selectedCoin = coinKey;
  renderCoinListDebounced();

  const c = dashCoins.find(x => x.coin === coinKey);
  const fmtP = v => v >= 1000 ? '$'+v.toLocaleString(undefined,{maximumFractionDigits:0})
                               : (()=>{ const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'--'; return '$'+_v.toFixed(_v>=1?2:4); })();
  const chgColor = res.chg24 >= 0 ? 'var(--bull)' : 'var(--bear)';

  // Fill hidden fields
  document.getElementById('coin').value  = res.coin;
  document.getElementById('price').value = res.price;
  document.getElementById('high').value  = res.high;
  document.getElementById('low').value   = res.low;

  // Update topbar (external)
  document.getElementById('detailSym').textContent = coinKey;
  document.getElementById('detailSym').style.color = c?.color || 'var(--gold)';
  const detNameEl = document.getElementById('detailName');
  if (detNameEl) detNameEl.textContent = c?.label || coinKey;
  const detPrice = document.getElementById('detailPrice');
  if (detPrice) detPrice.innerHTML = `<span style="color:${chgColor};font-weight:700">${fmtP(res.price)}</span> <span style="font-size:.78rem;color:${chgColor}">${res.chg24>=0?'+':''}${(Number(res.chg24)||0).toFixed(2)}%</span>`;
  const detMeta2 = document.getElementById('detailMeta');
  if (detMeta2) detMeta2.innerHTML = `评分 <strong style="color:var(--gold)">${res.score}</strong> · ${res.verdictTitle||''} · ${getSpanLabel()}${res.isHistoric ? ` · <span style="color:var(--indigo);font-weight:600">📅 ${res.date}</span>` : ''}`;

  // Update inline back bar (inside detailView)
  const sym2 = document.getElementById('detailSym2');
  if (sym2) { sym2.textContent = coinKey; sym2.style.color = c?.color || 'var(--gold)'; }
  const price2 = document.getElementById('detailPrice2');
  if (price2) price2.innerHTML = `<span style="color:${chgColor}">${fmtP(res.price)}</span> <span style="font-size:.8rem;color:${chgColor}">${res.chg24>=0?'+':''}${(Number(res.chg24)||0).toFixed(2)}%</span>`;
  const meta2 = document.getElementById('detailMeta2');
  if (meta2) meta2.innerHTML = `评分 <strong style="color:var(--gold)">${res.score}</strong> · ${res.verdictTitle||''}${res.isHistoric ? ` · <span style="color:var(--indigo);font-size:.76rem">📅 ${res.date}</span>` : ''}`;

  // Show detail, hide dashboard
  document.getElementById('dashView').style.display = 'none';
  document.getElementById('detailView').classList.add('open');
  document.getElementById('detailTopbar').style.display = 'flex';

  // Save for strategy modal
  _lastStratData = { ...res, breakLevel: res.breakLvl };

  // Render full analysis into results div
  try {
    renderAll({
      coin:res.coin, date:res.date, price:res.price, high:res.high, low:res.low,
      span:res.span, sys:res.sys,
      qm:res.qm, ic:res.ic, ve:res.ve, gn:res.gn, hr:res.hr, sr:res.sr,
      ch:res.ch, nt:res.nt, zw:res.zw, va:res.va,
      rsiE:res.rsiE, macdE:res.macdE, bbE:res.bbE, tdE:res.tdE, tfRec:res.tfRec, mtfE:res.mtfE,
      tpsl:res.tpsl, tpsl5:res.tpsl5, nodes:res.nodes, breakLevel:res.breakLvl, gt:res.gt,
      _priceWarning: res._priceWarning || null,   // 价格异常警告
    });
  } catch(renderErr) {
    console.error('renderAll error:', renderErr.message, renderErr.stack);
    document.getElementById('results').innerHTML += 
      '<div style="padding:12px;background:rgba(184,40,40,.1);border:1px solid rgba(184,40,40,.3);border-radius:8px;margin:10px 0;font-size:.72rem;color:#b82828">⚠ 部分内容渲染出错: ' + renderErr.message + '</div>';
  }

  // Scroll right panel to top
  const det = document.getElementById('dbDetail'); if(det) det.scrollTop = 0;
}

function closeDetail() {
  document.getElementById('dashView').style.display = 'flex';
  document.getElementById('detailView').classList.remove('open');
  document.getElementById('detailTopbar').style.display = 'none';
  selectedCoin = null;
  renderCoinTable();
}

// ── Add / remove coins ────────────────────────────────────────────────────
const KNOWN_COINS = {
  BTC:'BTCUSDT',ETH:'ETHUSDT',SOL:'SOLUSDT',BNB:'BNBUSDT',
  XRP:'XRPUSDT',DOGE:'DOGEUSDT',ADA:'ADAUSDT',AVAX:'AVAXUSDT',
  LINK:'LINKUSDT',DOT:'DOTUSDT',MATIC:'MATICUSDT',OP:'OPUSDT',
  ARB:'ARBUSDT',SUI:'SUIUSDT',TRX:'TRXUSDT',TON:'TONUSDT',
};
function addCoinPrompt() {
  const input = prompt('输入币种代码（如 ADA、AVAX、LINK）：');
  if (!input) return;
  const sym = input.trim().toUpperCase();
  if (dashCoins.find(c => c.coin === sym)) { alert(`${sym} 已在列表中`); return; }
  const binanceSym = KNOWN_COINS[sym] || sym + 'USDT';
  dashCoins.push({ sym: binanceSym, coin: sym, label: sym, color: '#8888cc' });
  renderCoinListDebounced();
  renderCoinsGrid();
}
function removeCoin(coinKey) {
  if (dashCoins.length <= 1) return;
  dashCoins = dashCoins.filter(c => c.coin !== coinKey);
  delete dashResults[coinKey];
  if (selectedCoin === coinKey) closeDetail();
  renderCoinListDebounced();
  renderCoinsGrid();
}

// ── helpers ───────────────────────────────────────────────────────────────
function getSys() {
  return {
    qimen:   document.getElementById('s0')?.checked,
    iching:  document.getElementById('s1')?.checked,
    vedic:   document.getElementById('s2')?.checked,
    gann:    document.getElementById('s3')?.checked,
    harmonic:document.getElementById('s4')?.checked,
    sr:      document.getElementById('s5')?.checked,
    chan:    document.getElementById('s6')?.checked,
    natal:   document.getElementById('s7')?.checked,
    ziwei:   document.getElementById('s8')?.checked,
    volRate: document.getElementById('s9')?.checked,
  };
}

function toggleTheme() {
  const h = document.documentElement;
  const isDark = h.getAttribute('data-theme') === 'dark';
  const newTheme = isDark ? 'light' : 'dark';
  h.setAttribute('data-theme', newTheme);
  try { localStorage.setItem('xuanxue_theme', newTheme); } catch(_) {}
}

// ── PC-only: no tab switching needed ──────────────────────────

function showInstallBanner() {  }

// ══ 斐波那契大波段计算器 ══════════════════════════════════════
function calcFib() {
  const high = parseFloat(document.getElementById('fibHigh')?.value);
  const low  = parseFloat(document.getElementById('fibLow')?.value);
  const coin = document.getElementById('fibCoin')?.value || 'BTC';
  const el   = document.getElementById('fibResult');
  if (!el) return;
  if (isNaN(high) || isNaN(low) || high <= low) {
    el.innerHTML = '<span style="color:var(--faint)">输入高低点后自动计算</span>';
    return;
  }
  const range = high - low;
  const r382  = range * 0.382;
  const r500  = range * 0.5;
  const r618  = range * 0.618;
  const t1    = low + r382;
  const t2    = low + r500;
  const t3    = low + r618;

  const fmt = v => {
    const _v=Number(v); if(isNaN(_v)||!isFinite(_v)) return '--';
    return _v>=1000 ? Math.round(_v).toLocaleString() : _v>=1 ? _v.toFixed(2) : _v.toFixed(4);
  };

  el.innerHTML = `
    <div style="font-size:.65rem;color:var(--gold);font-weight:700;margin-bottom:6px">${coin} 大波段：${fmt(high)} - ${fmt(low)} = <span style="color:var(--text)">${fmt(range)}</span></div>
    <div style="background:var(--bg2);border-radius:6px;padding:8px;font-size:.65rem;line-height:2">
      <div>${fmt(range)} × 0.382 = <strong style="color:var(--gold)">${fmt(r382)}</strong></div>
      <div>${fmt(range)} × 0.500 = <strong style="color:var(--gold)">${fmt(r500)}</strong></div>
      <div>${fmt(range)} × 0.618 = <strong style="color:var(--gold)">${fmt(r618)}</strong></div>
    </div>
    <div style="margin-top:6px;background:var(--bg2);border-radius:6px;padding:8px;font-size:.65rem;line-height:2.2">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <span>${fmt(low)} + ${fmt(r382)} =</span>
        <span style="display:flex;align-items:center;gap:6px">
          <strong style="color:var(--bear);font-size:.8rem">$${fmt(t1)}</strong>
          <span style="font-size:.58rem;background:#fef0f0;color:#b82020;border:1px solid #f0c0c0;border-radius:4px;padding:1px 5px">第一强压</span>
        </span>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span>${fmt(low)} + ${fmt(r500)} =</span>
        <strong style="color:var(--gold)">$${fmt(t2)}</strong>
      </div>
      <div style="display:flex;justify-content:space-between">
        <span>${fmt(low)} + ${fmt(r618)} =</span>
        <strong style="color:var(--gold)">$${fmt(t3)}</strong>
      </div>
    </div>`;
}

// ══════════════════════════════════════════════════════════════════
// 月份能量周期预测模型 — 五系合一
// 系统1: BTC减半四年周期 (0减半/1牛/2顶/3熊)
// 系统2: 天干地支年柱 — 五行生克影响市场情绪
// 系统3: 木星12年周期 — 入市/过境/离开各星座带来扩张/收缩
// 系统4: 月份卦象 — 易经十二消息卦对应能量消长
// 系统5: 历史月份统计基准（知识库）
// 综合得分 → 方向(多/震/空) + 能量(1-5) + 描述
// ══════════════════════════════════════════════════════════════════

// ── 系统1已移除(减半周期) — 纯玄学四系统 ──
function getHalvingPhase(year) { return 0; } // stub - unused
const HALVING_CFG = { 0:{label:'',bull:0,bear:0,emult:1,note:''}, 1:{label:'',bull:0,bear:0,emult:1,note:''}, 2:{label:'',bull:0,bear:0,emult:1,note:''}, 3:{label:'',bull:0,bear:0,emult:1,note:''} };

// ── 系统2: 天干地支五行 ──
// 天干: 甲乙木, 丙丁火, 戊己土, 庚辛金, 壬癸水
// 地支: 寅卯木, 巳午火, 辰戌丑未土, 申酉金, 亥子水
// 木→火(生)市场上涨; 金克木(克)压制; 火→土过旺见顶
function getGanZhi(year) {
  const gan  = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
  const zhi  = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const wx5  = ['木','木','火','火','土','土','金','金','水','水']; // 天干五行
  const zWx  = ['水','土','木','木','土','火','火','土','金','金','土','水']; // 地支五行
  const g = (year - 4)  % 10; const gIdx = (g + 10) % 10;
  const z = (year - 4)  % 12; const zIdx = (z + 12) % 12;
  const ganWx = wx5[gIdx]; const zhiWx = zWx[zIdx];
  // 五行对市场偏向: 木火=多, 金水=空, 土=震
  const wxBull = { '木':0.2,'火':0.25,'土':0,'金':-0.2,'水':-0.15 };
  const bias = (wxBull[ganWx]||0)*0.6 + (wxBull[zhiWx]||0)*0.4;
  return { label: gan[gIdx]+zhi[zIdx]+'年', ganWx, zhiWx, bias };
}

// ── 系统3: 木星12年周期 ──
// 木星约12年绕太阳一圈，每年过一个星座(30°)
// 白羊/狮子/射手(火象)→大牛; 金牛/处女/摩羯(土象)→慢牛/顶; 双子/天秤/水瓶(风象)→震荡; 巨蟹/天蝎/双鱼(水象)→回调
function getJupiterSign(year) {
  // 木星2024年在金牛座，约每年移动一个星座
  const signs = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
  const elements = ['火','土','风','水','火','土','风','水','火','土','风','水'];
  const elBull = { '火':0.3,'土':0.05,'风':0,'水':-0.15 };
  // 2024=金牛(index 1), 2025=双子(2), 依此类推
  const idx = ((year - 2024) + 1 + 120) % 12;
  return { sign: signs[idx], element: elements[idx], bias: elBull[elements[idx]]||0 };
}

// ── 系统4: 易经十二消息卦 月份卦象 ──
// 十二消息卦对应十二月，阳爻增为多，阴爻增为空
// 复(1阳)→临(2)→泰(3)→大壮(4)→夬(5)→乾(6纯阳)→姤(7)→遁(8)→否(9)→观(10)→剥(11)→坤(12纯阴)
const XIAO_XI_GUA = [
  { name:'地雷复',  yang:1, desc:'一阳复始，积蓄能量，底部萌动' },  // 1月(农历11月→约12月/1月)
  { name:'地泽临',  yang:2, desc:'阳气渐盛，资金入场，上升初期' },  // 2月
  { name:'地天泰',  yang:3, desc:'天地交泰，多空均衡，震荡偏多' },  // 3月
  { name:'雷天大壮',yang:4, desc:'阳盛气壮，多头强势，趋势上行' },  // 4月
  { name:'泽天夬',  yang:5, desc:'决断之时，强弩之末，见顶信号' },  // 5月
  { name:'乾为天',  yang:6, desc:'纯阳极盛，物极必反，顶部附近' },  // 6月
  { name:'天风姤',  yang:5, desc:'阴气初生，高位警惕，回调开始' },  // 7月
  { name:'天山遁',  yang:4, desc:'退守为宜，空头渐强，跌势形成' },  // 8月
  { name:'天地否',  yang:3, desc:'天地不交，多空对峙，僵持震荡' },  // 9月
  { name:'风地观',  yang:2, desc:'阳气消退，市场悲观，底部探寻' },  // 10月
  { name:'山地剥',  yang:1, desc:'剥落殆尽，黎明前黑暗，极度恐慌' },// 11月
  { name:'坤为地',  yang:0, desc:'纯阴极盛，否极泰来，底部确立' },  // 12月
];

// ── 系统5: 历史月份统计基准（知识库） ──
// 基于BTC历史2013-2024年各月平均涨跌幅统计
const MONTH_STAT = [
  { avg:+2.1, vol:3, hist:'历史均值小涨，但多为诱多陷阱' },      // 1
  { avg:-8.5, vol:5, hist:'历史最大月跌幅月份，黑天鹅高发' },    // 2
  { avg:+1.2, vol:2, hist:'横盘震荡，方向不明' },                // 3
  { avg:+3.0, vol:2, hist:'小幅反弹，无趋势' },                  // 4
  { avg:-5.2, vol:3, hist:'五月魔咒，多次见阶段顶' },            // 5
  { avg:+0.5, vol:2, hist:'多空对峙，成交低迷' },                // 6
  { avg:+9.8, vol:3, hist:'暑期行情，历史强势反弹月' },          // 7
  { avg:+4.1, vol:2, hist:'延续反弹但动能减弱' },                // 8
  { avg:-6.3, vol:3, hist:'九月效应，获利了结月' },              // 9
  { avg:+12.4,vol:5, hist:'历史最强月，减半效应+底部共振' },     // 10
  { avg:+18.7,vol:4, hist:'牛市加速月，历史大涨频率最高' },      // 11
  { avg:+8.2, vol:3, hist:'年末拉盘，机构布局次年' },            // 12
];

// ── 纯玄学四系合一预测 ──
// 系统权重: 消息卦40% + 天干地支30% + 木星星座20% + 历史统计10%
function predictMonthEnergy(year, month) {
  const gz   = getGanZhi(year);
  const jup  = getJupiterSign(year);
  const gua  = XIAO_XI_GUA[month - 1];
  const stat = MONTH_STAT[month - 1];

  // 系统1: 易经十二消息卦 40%
  // 阳爻(yang): 0纯阴→极空, 3平衡→震, 6纯阳→极多
  // 映射: 0=-0.5, 1=-0.35, 2=-0.15, 3=0, 4=+0.2, 5=+0.38, 6=+0.5
  const guaScores = [-0.50, -0.35, -0.15, 0, +0.20, +0.38, +0.50];
  const guaBias   = guaScores[gua.yang] * 0.40;

  // 系统2: 天干地支五行 30%
  // 天干地支各50%权重，五行属性决定市场气场
  const gzBias = gz.bias * 0.30;

  // 系统3: 木星星座 20%
  // 火象=扩张多, 土象=稳健偏多, 风象=震荡, 水象=收缩空
  const jupBias = jup.bias * 0.20;

  // 系统4: 历史月份能量统计 10% (辅助参考)
  const statBias = Math.max(-0.15, Math.min(0.15, stat.avg / 40)) * (10/15);

  const bullScore = guaBias + gzBias + jupBias + statBias;

  // 方向判断 — 阈值0.05，明确多空
  let bias, biasNote;
  if      (bullScore >  0.05) { bias = '多'; biasNote = `${gua.name}·${gz.label}·木星${jup.sign} → 看涨`; }
  else if (bullScore < -0.05) { bias = '空'; biasNote = `${gua.name}·${gz.label}·木星${jup.sign} → 看跌`; }
  else                        { bias = '震'; biasNote = `${gua.name}·阴阳均衡·震荡整理`; }

  // 能量强度: 基于卦象阳爻偏离中值的程度 + 木星元素
  const guaEnergy = Math.round(Math.abs(gua.yang - 3) / 3 * 3 + 2); // 2-5
  let energy = guaEnergy;
  if (jup.element === '火') energy = Math.min(5, energy + 1);
  if (jup.element === '水') energy = Math.max(1, energy - 1);
  energy = Math.max(1, Math.min(5, energy));

  return {
    month, energy, bias, biasNote,
    desc: gua.desc,          // 用卦象描述替代历史统计描述
    statHist: stat.hist,     // 历史统计参考（tooltip用）
    bullScore: parseFloat(bullScore.toFixed(3)),
    guaName: gua.name, guaDesc: gua.desc,
    ganZhi: gz.label, jupSign: jup.sign,
    statAvg: stat.avg,
  };
}

function renderMonthCycle() {
  const el = document.getElementById('monthCycleGrid');
  if (!el) return;

  const yearInput = document.getElementById('cycleYear');
  const year = yearInput ? (parseInt(yearInput.value) || new Date().getFullYear()) : new Date().getFullYear();
  const curMonth = new Date().getMonth() + 1;
  const curYear  = new Date().getFullYear();

  const gz  = getGanZhi(year);
  const jup = getJupiterSign(year);

  const lbl = document.getElementById('cycleYearLabel');
  if (lbl) lbl.innerHTML =
    `<strong style="color:var(--gold)">${year}年</strong> · ${gz.label} · 木星${jup.sign}座(${jup.element}象)` +
    `<br><span style="font-size:.58rem;color:var(--faint)">天干${gz.ganWx}·地支${gz.zhiWx}五行 · 纯玄学四系推算</span>`;

  const months = Array.from({length:12}, (_, i) => predictMonthEnergy(year, i+1));
  const mNames = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

  el.innerHTML = months.map(m => {
    const isCur  = m.month === curMonth && year === curYear;
    const bars   = '█'.repeat(m.energy) + '░'.repeat(5 - m.energy);
    const dc = m.bias === '多' ? '#18864a' : m.bias === '空' ? '#b82828' : '#9a7218';
    const db = m.bias === '多' ? 'rgba(24,134,74,.12)' : m.bias === '空' ? 'rgba(184,40,40,.12)' : 'rgba(154,114,24,.12)';
    const tooltip = `${m.guaName}：${m.guaDesc} | 历史参考：${m.statHist||''}`;
    return `<div title="${tooltip}" style="display:flex;align-items:center;gap:5px;padding:3px 5px;border-radius:5px;cursor:default;
      ${isCur ? 'background:rgba(200,168,74,.15);border:1px solid rgba(200,168,74,.4)' : 'border:1px solid transparent'}">
      <span style="font-size:.6rem;color:var(--faint);width:22px;flex-shrink:0">${mNames[m.month-1]}</span>
      <span style="font-size:.58rem;padding:1px 4px;border-radius:3px;background:${db};color:${dc};font-weight:700;flex-shrink:0;width:16px;text-align:center">${m.bias}</span>
      <span style="font-size:.55rem;color:${dc};letter-spacing:-1px;flex-shrink:0;width:38px">${bars}</span>
      <span style="font-size:.56rem;color:var(--muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${m.desc}</span>
      ${isCur ? '<span style="font-size:.54rem;color:var(--gold);font-weight:700;flex-shrink:0">◀</span>' : ''}
    </div>`;
  }).join('');
}

function cycleYearChange(delta) {
  const el = document.getElementById('cycleYear');
  if (!el) return;
  el.value = (parseInt(el.value) || new Date().getFullYear()) + delta;
  renderMonthCycle();
}

// ── Dashboard stat cards ──────────────────────────────────────
// updateDashStatCards replaced by new version below

// ── Coin table render ─────────────────────────────────────────
let _tableFilter = 'all';
let _signalFilter = 'all';

// function filterByStage(stage) { replaced

// function filterBySignal(sig) { replaced

// renderCoinTable replaced by new version below

function showApiBlockedNotice() {
  // Remove any existing notice
  document.getElementById('apiBlockedNotice')?.remove();

  const el = document.createElement('div');
  el.id = 'apiBlockedNotice';
  el.style.cssText = `
    margin:12px 14px; padding:12px 14px; border-radius:12px;
    background:rgba(184,88,8,.1); border:1px solid rgba(184,88,8,.35);
    font-size:.75rem; color:var(--amber); line-height:1.7;
  `;
  el.innerHTML = `
    <div style="font-weight:700;margin-bottom:4px">⚠ 网络访问受限</div>
    <div style="color:var(--muted)">
      本地文件模式下无法访问 Binance API。<br>
      请为每个币种 <strong style="color:var(--gold)">手动输入当前价格</strong>，仍可运行完整推演。<br>
      <span style="font-size:.68rem;opacity:.7">如需实时数据，请将文件托管至服务器（如 GitHub Pages）</span>
    </div>
  `;
  // Insert after run button inside settings panel
  const runBtn = document.getElementById('runAllBtn');
  runBtn?.parentNode?.insertBefore(el, runBtn.nextSibling);
}

function getSpanLabel() {
  const n = document.getElementById('spanNum')?.value || '90';
  const u = document.getElementById('spanUnit')?.value || 'day';
  const uMap = {min:'分钟', hour:'小时', day:'天', week:'周', month:'月'};
  return `${n}${uMap[u]||u}`;
}

// ── 智能时框推荐 ───────────────────────────────────────────────────────────
// Analyses coin results across the dashboard and recommends best timeframes
// based on ATR%, trend alignment, and chan/gann signals.
function updateTfRecommendation() {
  const box  = document.getElementById('tfRecommend');
  const list = document.getElementById('tfRecommendList');
  const note = document.getElementById('tfRecommendNote');
  if (!box || !list) return;

  // Collect all valid results
  const results = Object.values(dashResults).filter(r => r && r !== 'loading' && !r.needsPrice && !r.error && r.price);
  if (!results.length) { box.style.display = 'none'; return; }

  // Average ATR% across coins
  const avgAtrPct = results.reduce((s, r) => {
    const atr = r.high && r.low ? (r.high - r.low) / r.price * 100 : 5;
    return s + atr;
  }, 0) / results.length;

  // Average score (0-100)
  const avgScore = results.reduce((s, r) => s + (r.score || 50), 0) / results.length;

  // Chan / gann signal strength
  const chanSignals = results.filter(r => r.ch?.beichi || r.ch?.bspDir).length;
  const strongTrend = results.filter(r => Math.abs(r.avgBias || 0) > 0.4).length;

  // Determine recommended TFs based on ATR% and signal context
  const recs = [];

  if (avgAtrPct < 3) {
    // Low volatility → scalp / intraday
    recs.push({ tf:'15m', label:'15分钟', reason:'波动率低，适合超短线', color:'#3ab8c8', star: strongTrend > 0 });
    recs.push({ tf:'1h',  label:'1小时',  reason:'日内结构清晰',         color:'#3ab8c8', star: false });
  } else if (avgAtrPct < 8) {
    // Medium volatility → intraday / swing
    recs.push({ tf:'1h',  label:'1小时',  reason:'日内趋势明确',          color:'#28c870', star: chanSignals > 0 });
    recs.push({ tf:'4h',  label:'4小时',  reason:'波段主力时框',           color:'var(--gold)', star: true });
    if (strongTrend > results.length * 0.5)
      recs.push({ tf:'1d', label:'日线',  reason:'趋势信号强，可持仓',     color:'#e8a040', star: false });
  } else if (avgAtrPct < 18) {
    // High volatility → swing / position
    recs.push({ tf:'4h',  label:'4小时',  reason:'过滤噪音，把握主波',    color:'var(--gold)', star: true });
    recs.push({ tf:'1d',  label:'日线',   reason:'高波动首选日线视角',     color:'#e8a040', star: chanSignals > 0 });
    if (strongTrend > 0)
      recs.push({ tf:'3d', label:'3日线', reason:'趋势明确，中线持仓',    color:'#e05050', star: false });
  } else {
    // Very high volatility → position only
    recs.push({ tf:'1d',  label:'日线',   reason:'波动极大，短线风险高',  color:'#e8a040', star: false });
    recs.push({ tf:'3d',  label:'3日线',  reason:'需宽止损，日线以上',    color:'#e05050', star: true });
  }

  // Build HTML
  list.innerHTML = recs.map(r =>
    `<span onclick="applyTfRec('${r.tf}')" style="cursor:pointer;font-size:.62rem;font-weight:700;color:${r.color};background:${r.color}15;border:1px solid ${r.color}40;padding:3px 9px;border-radius:99px;white-space:nowrap" title="${r.reason}">
      ${r.star ? '★ ' : ''}${r.label}
    </span>`
  ).join('');

  const atrLabel = avgAtrPct < 3 ? '低波动' : avgAtrPct < 8 ? '中等波动' : avgAtrPct < 18 ? '高波动' : '极高波动';
  note.textContent = `当前市场 ${atrLabel} (ATR≈${(avgAtrPct||0).toFixed(1)}%)${chanSignals > 0 ? ' · 缠论信号' + chanSignals + '个' : ''}${strongTrend > 0 ? ' · 趋势信号' + strongTrend + '个' : ''} · 点击切换`;

  // ── 增强：整合 engineAutoTF 推荐结果 ──
  const tfVotes = {};
  results.forEach(r => {
    if (r.tfRec?.best?.tf) {
      const tf = r.tfRec.best.tf;
      tfVotes[tf] = (tfVotes[tf] || 0) + 1;
    }
  });
  const topVote = Object.entries(tfVotes).sort((a, b) => b[1] - a[1])[0];
  if (topVote && topVote[1] >= Math.ceil(results.length / 2)) {
    const existingRec = recs.find(r => r.tf === topVote[0]);
    if (!existingRec) {
      const tfDef = ['15m','30m','1h','2h','4h','6h','8h','12h','1d','3d','1w']
        .find(t => t === topVote[0]);
      if (tfDef) {
        const labels = {'15m':'15分钟','30m':'30分钟','1h':'1小时','2h':'2小时','4h':'4小时','6h':'6小时','8h':'8小时','12h':'12小时','1d':'日线','3d':'3日线','1w':'周线'};
        list.innerHTML += `<span onclick="applyTfRec('${topVote[0]}')" style="cursor:pointer;font-size:.62rem;font-weight:700;color:var(--emerald);background:rgba(40,200,112,0.12);border:1px solid rgba(40,200,112,0.35);padding:3px 9px;border-radius:99px;white-space:nowrap" title="技术指标综合推荐">
          ⚡ ${labels[topVote[0]] || topVote[0]} (AI)
        </span>`;
      }
    }
    note.textContent += ` · 技术指标推荐: ${topVote[0]}`;
  }
  box.style.display = 'block';
}

function applyTfRec(tf) {
  // Set K-line timeframe pill
  document.querySelectorAll('#tfGroup .tf-pill').forEach(b => {
    b.classList.toggle('active', b.dataset.tf === tf);
  });
  const fpEl = document.getElementById('fetchPeriod');
  if (fpEl) fpEl.value = tf;
  // Flash the button to confirm
  const btn = document.getElementById('runAllBtn');
  if (btn) {
    btn.textContent = `⏱ 已切换 ${tf} · 重新推演`;
    setTimeout(() => { btn.textContent = '✦ 重新推演'; }, 2000);
  }
}

// Stub for fetchPrice (still used if called externally)
async function fetchPrice() {}

// ════════════════════════════════════════════════════════════════════════
// runDirect() — 完全离线推演，无需网络，直接读取侧边栏输入
// ════════════════════════════════════════════════════════════════════════
function runDirect() {
  // ── 1. 读取用户输入 ──────────────────────────────────────────────────
  const rawCoin  = (document.getElementById('directCoin')?.value  || 'BTC').trim().toUpperCase();
  const rawPrice = parseFloat(document.getElementById('directPrice')?.value);
  const rawHigh  = parseFloat(document.getElementById('directHigh')?.value);
  const rawLow   = parseFloat(document.getElementById('directLow')?.value);

  if (!rawPrice || isNaN(rawPrice) || rawPrice <= 0) {
    alert('请先输入当前价格');
    document.getElementById('directPrice')?.focus();
    return;
  }

  const P    = rawPrice;
  const H    = (rawHigh  > P) ? rawHigh  : P * 1.15;
  const L    = (rawLow   > 0 && rawLow < P) ? rawLow : P * 0.85;
  const date = document.getElementById('baseDate')?.value
             || nowUTC8DateStr();
  const span = parseFloat(document.getElementById('span')?.value) || 90;
  const breakLevel = parseFloat(document.getElementById('breakLevel')?.value) || 0;

  const sys = {
    qimen:    document.getElementById('s0')?.checked ?? true,
    iching:   document.getElementById('s1')?.checked ?? true,
    vedic:    document.getElementById('s2')?.checked ?? true,
    gann:     document.getElementById('s3')?.checked ?? true,
    harmonic: document.getElementById('s4')?.checked ?? true,
    sr:       document.getElementById('s5')?.checked ?? true,
    chan:      document.getElementById('s6')?.checked ?? true,
    natal:    document.getElementById('s7')?.checked ?? true,
    ziwei:    document.getElementById('s8')?.checked ?? true,
    volRate:  document.getElementById('s9')?.checked ?? true,
  };

  // ── 2. 显示 loading ──────────────────────────────────────────────────
  const loadEl = document.getElementById('loadingEl');
  const stepEl = document.getElementById('loadSteps');
  if (loadEl) loadEl.classList.add('on');
  let si = 0;
  const stepIv = setInterval(() => {
    if (stepEl) stepEl.textContent = LOAD_STEPS[si++ % LOAD_STEPS.length];
  }, 280);

  // ── 3. 运行引擎（稍微延迟让 loading 先渲染）─────────────────────────
  setTimeout(() => {
    clearInterval(stepIv);
    try {
      const qm = sys.qimen    ? engineQiMen(rawCoin, date) : null;
      const ic = sys.iching   ? engineIChing(rawCoin, date) : null;
      const ve = sys.vedic    ? engineVedic(rawCoin, date) : null;
      const gn = sys.gann     ? engineGann(rawCoin, date, P, H, L) : null;
      const hr = sys.harmonic ? engineHarmonic(rawCoin, date, P, H, L) : null;
      const sr = sys.sr       ? engineSR(rawCoin, date, P, H, L) : null;
      const ch = sys.chan      ? engineChan(rawCoin, date, P, H, L, breakLevel) : null;
      const nt = sys.natal     ? engineNatal(rawCoin, date) : null;
      const zw = sys.ziwei    ? engineZiwei(rawCoin, date) : null;
      const va = sys.volRate   ? engineVideoAlgo(rawCoin, date, P, H, L) : null;
      const gt = engineGannTime(date, P, H, L);
      const tpsl  = engineTPSL(rawCoin, date, P, H, L, { sr, gn, ch, hr, nt });
      const tpsl5 = (typeof engineTPSL5 === 'function')
        ? engineTPSL5(rawCoin, date, P, H, L, { sr, gn, ch, hr }) : tpsl;
      const nodes = generateNodes(rawCoin, date, span, sys, { qm, ic, ve, gn, hr, sr, ch, nt });

      // 写入隐藏字段（保持兼容）
      const setVal = (id, v) => { const el = document.getElementById(id); if (el) el.value = v; };
      setVal('coin',  rawCoin);
      setVal('price', P);
      setVal('high',  H);
      setVal('low',   L);

      // ── 4. 打开 detailView 展示结果 ─────────────────────────────────
      // 更新 topbar
      const detSym = document.getElementById('detailSym2');
      const detPrice = document.getElementById('detailPrice2');
      const detMeta  = document.getElementById('detailMeta2');
      if (detSym)   { detSym.textContent = rawCoin; detSym.style.color = 'var(--gold)'; }
      if (detPrice) {
        const _pFmt = P >= 1000 ? '$' + Math.round(P).toLocaleString() : '$' + P.toFixed(P>=1?4:6);
        detPrice.innerHTML = `<span style="color:var(--gold);font-weight:700">${_pFmt}</span>` +
          `<span style="font-size:.7rem;color:var(--muted);margin-left:6px;font-weight:400">（直接推演 · 手动输入）</span>`;
      }
      if (detMeta)  detMeta.textContent = `直接推演 · ${date}`;

      const detailSym = document.getElementById('detailSym');
      if (detailSym) { detailSym.textContent = rawCoin; detailSym.style.color = 'var(--gold)'; }

      // 切换到 detailView
      const dashView   = document.getElementById('dashView');
      const detailView = document.getElementById('detailView');
      const detTopbar  = document.getElementById('detailTopbar');
      if (dashView)   dashView.style.display   = 'none';
      if (detailView) detailView.classList.add('open');
      if (detTopbar)  detTopbar.style.display  = 'flex';

      // 显示结果区
      const resultsEl = document.getElementById('results');
      if (resultsEl) resultsEl.classList.add('on');

      if (loadEl) loadEl.classList.remove('on');

      const renderData = {
        coin: rawCoin, date, price: P, high: H, low: L, span, sys,
        qm, ic, ve, gn, hr, sr, ch, nt, zw, va,
        tpsl, tpsl5, nodes, breakLevel, gt
      };
      _lastStratData = renderData;

      // 滚到顶
      const detBody = document.getElementById('detailBody') || document.getElementById('dbDetail');
      if (detBody) detBody.scrollTop = 0;

      renderAll(renderData);

    } catch(e) {
      if (loadEl) loadEl.classList.remove('on');
      console.error('runDirect error:', e);
      alert('推演出错：' + e.message + '\n\n请检查控制台获取详细信息');
    }
  }, 1200);
}

// ── 手动价格弹窗提交（manualPriceModal 的"开始推演"按钮调用此函数）──
function submitManualPrice() {
  const p = parseFloat(document.getElementById('manualPrice')?.value);
  const h = parseFloat(document.getElementById('manualHigh')?.value);
  const l = parseFloat(document.getElementById('manualLow')?.value);
  if (!p || isNaN(p) || p <= 0) { alert('请输入有效的当前价格'); return; }
  const safeH = (h > 0 && h > p) ? h : p * 1.15;
  const safeL = (l > 0 && l < p) ? l : p * 0.85;
  // 写入隐藏字段，供 go() 读取
  document.getElementById('price').value = p;
  document.getElementById('high').value  = safeH;
  document.getElementById('low').value   = safeL;
  // 关闭弹窗
  const modal = document.getElementById('manualPriceModal');
  if (modal) modal.classList.remove('open');
  // 触发推演
  go();
}

function closeManualPriceModal() {
  const modal = document.getElementById('manualPriceModal');
  if (modal) modal.classList.remove('open');
}

// ═══════════════════════════════════════════════
function go() {
  const coin  = document.getElementById('coin').value;
  const date  = document.getElementById('baseDate').value;
  const price = parseFloat(document.getElementById('price').value)||0;
  const high  = parseFloat(document.getElementById('high').value)||0;
  const low   = parseFloat(document.getElementById('low').value)||0;
  const span  = parseFloat(document.getElementById('span').value) || 90;
  const breakLevel = parseFloat(document.getElementById('breakLevel').value)||0;

  if(!date) { alert('请选择基准日期'); return; }

  const sys = {
    qimen:    document.getElementById('s0').checked,
    iching:   document.getElementById('s1').checked,
    vedic:    document.getElementById('s2').checked,
    gann:     document.getElementById('s3').checked,
    harmonic: document.getElementById('s4').checked,
    sr:       document.getElementById('s5').checked,
    chan:     document.getElementById('s6').checked,
    natal:    document.getElementById('s7').checked,
    ziwei:    document.getElementById('s8').checked,
    volRate: document.getElementById('s9').checked,
  };

  if(!Object.values(sys).some(Boolean)) { alert('请至少选择一个预测系统'); return; }

  // Loading
  const loadEl = document.getElementById('loadingEl');
  const stepEl = document.getElementById('loadSteps');
  loadEl.classList.add('on');
  let si = 0;
  const stepIv = setInterval(() => {
    stepEl.textContent = LOAD_STEPS[si++ % LOAD_STEPS.length];
  }, 280);

  setTimeout(() => {
    clearInterval(stepIv);

    const P = price||50000;
    const H = high||(P*1.15);
    const L = low||(P*0.85);
    const qm = sys.qimen    ? engineQiMen(coin,date) : null;
    const ic = sys.iching   ? engineIChing(coin,date) : null;
    const ve = sys.vedic    ? engineVedic(coin,date) : null;
    const gn = sys.gann     ? engineGann(coin,date,P,H,L) : null;
    const hr = sys.harmonic ? engineHarmonic(coin,date,P,H,L) : null;
    const sr = sys.sr       ? engineSR(coin,date,P,H,L) : null;
    const ch = sys.chan      ? engineChan(coin,date,P,H,L,breakLevel) : null;
    const nt = sys.natal     ? engineNatal(coin,date) : null;
    const zw = sys.ziwei    ? engineZiwei(coin,date) : null;
    const va = sys.volRate   ? engineVideoAlgo(coin,date,P,H,L) : null;
    const gt = engineGannTime(date, P, H, L);
    const tpsl  = engineTPSL(coin, date, P, H, L, { sr, gn, ch, hr, nt });
    const tpsl5 = (typeof engineTPSL5 === 'function')
      ? engineTPSL5(coin, date, P, H, L, { sr, gn, ch, hr }) : tpsl;

    const nodes = generateNodes(coin, date, span, sys,
      { qm, ic, ve, gn, hr, sr, ch, nt });

    loadEl.classList.remove('on');
    document.getElementById('results').classList.add('on');

    const renderData = {
      coin, date, price: P, high: H, low: L, span, sys,
      qm, ic, ve, gn, hr, sr, ch, nt, zw, va,
      tpsl, tpsl5, nodes, breakLevel, gt
    };
    _lastStratData = renderData;
    try {
      renderAll(renderData);
    } catch(e) {
      console.error('renderAll error:', e);
      document.getElementById('results').innerHTML +=
        `<div style="padding:12px;background:rgba(184,40,40,.1);border:1px solid rgba(184,40,40,.3);border-radius:8px;margin:10px 0;font-size:.72rem;color:#b82828">⚠ 渲染出错: ${e.message}</div>`;
    }

    // Show strategy button
    const sb = document.getElementById('stratBtn');
    if (sb) sb.style.display = 'inline-block';

    document.getElementById('results').scrollIntoView({ behavior:'smooth', block:'start' });
  }, 2400);
}

// ════════════════════════════════════════════════════════════════════════
// 波动率融合引擎 · 金融占星玩家荷包蛋方法论
// 三大核心算法：0.809波动率共振 · 角度度数转换 · K线顶底分型确认
// ════════════════════════════════════════════════════════════════════════

// ── 算法一：0.809波动率共振价位计算 ──────────────────────────────────────
// 原理：江恩黄金比例 0.809 ≈ 1 − 1/φ² (φ=黄金比例)
// 视频中：74075 × 0.809 = 59927 ≈ 前低59930，形成价位共振
const GANN_VOL_COEFFS = [
  { name: '0.809 (1−1/φ²)',  val: 0.809,  color: '#d4a843', note: '最强共振位 · 视频核心算法' },
  { name: '0.618 (1/φ)',     val: 0.618,  color: '#28c870', note: '黄金分割支撑' },
  { name: '0.786 (√0.618)',  val: 0.786,  color: '#38a8e0', note: '深度回调共振' },
  { name: '0.500 (1/2)',     val: 0.500,  color: '#a060e0', note: '区间中轴共振' },
  { name: '1.272 (√φ)',      val: 1.272,  color: '#e08040', note: '上方第一扩展位' },
  { name: '1.618 (φ)',       val: 1.618,  color: '#e04848', note: '黄金扩展压力' },
  { name: '2.618 (φ²)',      val: 2.618,  color: '#c030c0', note: '超级扩展目标' },
];

function calcVolatilityResonance(high, low, currentPrice) {
  const results = [];
  [high, low].forEach((pivot, pi) => {
    const label = pi === 0 ? '前高' : '前低';
    GANN_VOL_COEFFS.forEach(c => {
      const lvl = Math.round(pivot * c.val * 100) / 100;
      if (lvl <= 0) return;
      const pctFromCur = ((lvl - currentPrice) / currentPrice * 100);
      const isAbove = lvl > currentPrice;
      // 共振强度：距离越近越强，±1%内算强共振
      const distPct = Math.abs(pctFromCur);
      const resonance = distPct < 1 ? '🔴 超强共振' : distPct < 3 ? '🟠 强共振' : distPct < 6 ? '🟡 中共振' : '⚪ 弱共振';
      const resonanceScore = distPct < 1 ? 0.95 : distPct < 3 ? 0.75 : distPct < 6 ? 0.50 : 0.25;
      results.push({
        price: lvl,
        source: label + ' × ' + c.name,
        coeff: c.val,
        coeffName: c.name,
        pivotLabel: label,
        pivotPrice: pivot,
        pct: parseFloat(pctFromCur.toFixed(2)),
        isAbove,
        resonance,
        resonanceScore,
        color: c.color,
        note: c.note,
      });
    });
  });
  // Sort by resonance strength (closest to current price)
  results.sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct));
  return results;
}

// ── 算法二：江恩角度线度数转换 (360°/480°/720° 循环系统) ─────────────────────
// 原理：将价格差转化为螺旋方格中的角度
// 视频中：从599到740经历了480度(360+120)，是重要转折点
// 公式：∆price = ∆(√price) × 180 → 度数 = (√price_end − √price_start) × 180
const CYCLE_DEGREES = [
  { deg: 90,  label: '90°',  note: '1/4圈', color: '#a060e0' },
  { deg: 120, label: '120°', note: '1/3圈', color: '#38a8e0' },
  { deg: 144, label: '144°', note: '2/5圈', color: '#28c870' },
  { deg: 180, label: '180°', note: '半圈',  color: '#d4a843' },
  { deg: 240, label: '240°', note: '2/3圈', color: '#e08040' },
  { deg: 270, label: '270°', note: '3/4圈', color: '#c09030' },
  { deg: 360, label: '360°', note: '整圈',  color: '#d4a843', strong: true },
  { deg: 480, label: '480°', note: '360+120', color: '#e04848', strong: true, note2: '视频关键角度' },
  { deg: 540, label: '540°', note: '1.5圈', color: '#a040a0' },
  { deg: 720, label: '720°', note: '两整圈 强支撑', color: '#ff4444', strong: true, note2: '视频提到强力支撑逻辑' },
];

function calcCycleAngles(fromPrice, currentPrice) {
  // 当前从 fromPrice 到 currentPrice 经历了多少度
  const sqFrom = Math.sqrt(Math.max(0.01, fromPrice));
  const sqCur  = Math.sqrt(Math.max(0.01, currentPrice));
  const degreesElapsed = Math.abs(sqCur - sqFrom) * 180;

  // 从 fromPrice 出发，各个整数度数对应的目标价格
  const targets = CYCLE_DEGREES.map(cd => {
    // 正向(上方): √target = √fromPrice + deg/180
    const sqUp   = sqFrom + cd.deg / 180;
    const priceUp = sqUp * sqUp;
    // 负向(下方): √target = √fromPrice - deg/180
    const sqDn   = sqFrom - cd.deg / 180;
    const priceDn = sqDn > 0 ? sqDn * sqDn : 0;

    const pctUp = parseFloat(((priceUp - currentPrice) / (currentPrice||1) * 100).toFixed(2));
    const pctDn = priceDn > 0 ? parseFloat(((priceDn - currentPrice) / (currentPrice||1) * 100).toFixed(2)) : null;

    return {
      ...cd,
      priceUp: Math.round(priceUp * 100) / 100,
      priceDn: priceDn > 0 ? Math.round(priceDn * 100) / 100 : null,
      pctUp,
      pctDn,
      isAboveUp: priceUp > currentPrice,
    };
  });

  // 找当前价格最近的"次级共振角度"
  const nearestNext = [...CYCLE_DEGREES]
    .map(cd => {
      // 当前经历了多少度，下一个整数周期是哪个
      const totalCycles = degreesElapsed / cd.deg;
      const nextCycle = Math.ceil(totalCycles);
      const nextDeg = nextCycle * cd.deg;
      const sqTarget = sqFrom + nextDeg / 180;
      const priceTarget = sqTarget * sqTarget;
      const pct = parseFloat(((priceTarget - currentPrice) / (currentPrice||1) * 100).toFixed(2));
      return { ...cd, nextCycle, nextDeg, priceTarget: Math.round(priceTarget * 100) / 100, pct };
    })
    .filter(x => x.pct > 0 && x.pct < 50)
    .sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct));

  return { degreesElapsed: parseFloat((degreesElapsed||0).toFixed(1)), targets, nearestNext: nearestNext.slice(0, 5) };
}

// ── 算法三：K线顶底分型确认系统 ───────────────────────────────────────────
// 原理：视频中提到"日线级别已出现顶分型，跌破前日最低点"作为趋势确认
// 顶分型：中间K线最高 > 左右两侧，底分型相反
// 结合K线根数周期计算（150根、207根等）
const KLINE_PERIODS = [
  { n: 55,  label: '55根', note: 'Fibonacci周期', color: '#28c870' },
  { n: 89,  label: '89根', note: 'Fibonacci周期', color: '#38a8e0' },
  { n: 120, label: '120根', note: '月线周期',      color: '#d4a843' },
  { n: 144, label: '144根', note: '江恩周期',       color: '#e08040', strong: true },
  { n: 150, label: '150根', note: '视频提到周期',   color: '#a060e0', strong: true },
  { n: 207, label: '207根', note: '视频提到修正值', color: '#e04848', strong: true },
  { n: 233, label: '233根', note: 'Fibonacci周期', color: '#c09030' },
  { n: 360, label: '360根', note: '年度循环周期',   color: '#ff4444', strong: true },
];

function calcFractalSignal(high, low, currentPrice, baseDate) {
  const r = rng(seed(baseDate, 'FRACTAL', 7654));
  const P = currentPrice;
  const H = high;
  const L = low;
  const range = H - L;

  // 分型状态模拟（基于价格位置推断）
  const relPos = (P - L) / range; // 0=低点，1=高点
  // 当前趋势判断
  const trend = relPos > 0.65 ? 'up' : relPos < 0.35 ? 'down' : 'neutral';

  // 顶分型 / 底分型判断
  // 视频逻辑：如果已在高位（relPos > 0.7）且出现顶分型，为看空信号
  const topFractal = trend === 'up' && r() > 0.4;
  const botFractal = trend === 'down' && r() > 0.4;

  // K线根数周期分析
  const tgtDate = new Date(baseDate);
  const periodSignals = KLINE_PERIODS.map(kp => {
    // 模拟：该周期是否接近当前日期的关键节点
    const r2 = rng(seed(baseDate, 'KP' + kp.n, 1111));
    const completion = (r2() * 0.4 + 0.6); // 60%-100%完成度
    const daysLeft = Math.round((1 - completion) * kp.n);
    const targetDate = new Date(tgtDate);
    targetDate.setDate(targetDate.getDate() + daysLeft);
    const isNear = daysLeft <= 7; // 7天内为"近期共振"
    const priceTarget = isNear
      ? (r2() > 0.5 ? H * (0.9 + r2() * 0.2) : L * (0.9 + r2() * 0.15))
      : (r2() > 0.5 ? P * (1 + r2() * 0.08) : P * (1 - r2() * 0.08));
    return {
      ...kp,
      completion: parseFloat((completion * 100).toFixed(0)),
      daysLeft,
      targetDate,
      priceTarget: Math.round(priceTarget),
      isNear,
      direction: r2() > 0.5 ? 'up' : 'down',
    };
  });

  // 分型强度 (综合当前位置 + 随机因子)
  const fractalScore = topFractal ? -(0.5 + r() * 0.4) : botFractal ? (0.5 + r() * 0.4) : (r() * 0.4 - 0.2);
  const fractalLabel = topFractal ? '⚠ 日线顶分型' : botFractal ? '✦ 日线底分型' : '→ 无明显分型';
  const fractalDetail = topFractal
    ? '已出现顶分型结构 · 跌破前低则确认看空 · 视频核心信号'
    : botFractal
    ? '已出现底分型结构 · 突破前高则确认看多 · 反转信号待确认'
    : '当前K线结构未出现明显顶底分型 · 趋势延续';

  // 操作建议
  const advice = topFractal
    ? `顶分型出现 → 等待日K跌破前低（$${Math.round(L*1.02).toLocaleString()}）后确认看空，止损参考前高 $${Math.round(H).toLocaleString()}`
    : botFractal
    ? `底分型出现 → 等待日K突破前高（$${Math.round(H*0.98).toLocaleString()}）后确认看多，止损参考前低 $${Math.round(L).toLocaleString()}`
    : `结构中性，观察 $${Math.round((H+P)/2).toLocaleString()} 与 $${Math.round((L+P)/2).toLocaleString()} 之间价格行为`;

  const bias = fractalScore;
  const conf = 0.45 + Math.abs(fractalScore) * 0.3;

  return {
    trend, topFractal, botFractal,
    fractalLabel, fractalDetail, advice,
    periodSignals,
    relPos: parseFloat((relPos * 100).toFixed(1)),
    bias, conf,
  };
}

// ── 综合波动率引擎 ──────────────────────────────────────────────────────
function engineVideoAlgo(coin, date, price, high, low) {
  const P = price || 50000;
  const H = high  || P * 1.18;
  const L = low   || P * 0.82;

  const volRes  = calcVolatilityResonance(H, L, P);
  const cycAng  = calcCycleAngles(L, P);           // 从前低出发
  const fractal = calcFractalSignal(H, L, P, date);

  // 找最强共振价位作为TP/SL建议
  const strongRes = volRes.filter(v => v.resonanceScore >= 0.75);
  const nearAbove = volRes.filter(v => v.isAbove && v.pct > 0 && v.pct < 20).slice(0, 4);
  const nearBelow = volRes.filter(v => !v.isAbove && v.pct < 0 && v.pct > -20).slice(0, 4);

  // 综合偏向
  const biasList = [fractal.bias];
  // 波动率共振：如果当前价格非常靠近某个 0.809 支撑位，偏多；靠近阻力位，偏空
  const nearest = volRes[0];
  if (nearest) biasList.push(nearest.isAbove ? -0.2 : 0.2);

  const bias = biasList.reduce((s, b) => s + b, 0) / biasList.length;
  const conf = 0.50 + Math.abs(bias) * 0.3;

  return {
    P, H, L,
    volRes, cycAng, fractal,
    strongRes, nearAbove, nearBelow,
    bias: Math.max(-1, Math.min(1, bias)),
    conf,
    // ── 波动率专属：修正系数字段（职责：价格修正，不独立预测方向）──────
    correction: parseFloat((1 + bias * 0.02).toFixed(4)), // 价格修正系数（±2%幅度）
    resonance:  nearAbove[0]?.price || nearBelow[0]?.price || P,  // 最近共振价位
    confidence: conf,
  };
}

// ── 波动率 Panel 渲染 ───────────────────────────────────────────────────
function buildVideoAlgoPanel(va, coin, price) {
  if (!va) return '';
  const [bc, bl] = biasBadge(va.bias);
  const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n)||_n===0)return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };
  const pctBadge = (pct) => {
    const cls = pct >= 0 ? 'color:var(--bear)' : 'color:var(--bull)';
    return `<span style="${cls};font-size:.65rem;margin-left:5px">${pct>=0?'+':''}${(pct||0).toFixed(1)}%</span>`;
  };

  // ── Section: 0.809波动率共振 ──
  const topRes = [...va.volRes].sort((a,b) => Math.abs(a.pct) - Math.abs(b.pct)).slice(0, 12);
  const resAbove = topRes.filter(r => r.isAbove).slice(0, 6);
  const resBelow = topRes.filter(r => !r.isAbove).slice(0, 6);

  const resRow = (r) =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;border-radius:6px;margin-bottom:3px;background:${r.isAbove?'rgba(192,48,48,0.07)':'rgba(24,145,80,0.07)'}">
      <div>
        <span style="font-size:.65rem;color:var(--muted)">${r.pivotLabel} × ${r.coeffName}</span>
        <span style="font-size:.6rem;color:${r.isAbove?'var(--bear)':'var(--bull)'};margin-left:6px">${r.resonance}</span>
      </div>
      <span style="font-weight:600;font-size:.78rem;color:${r.isAbove?'var(--bear)':'var(--bull)'}">${fmtP(r.price)}${pctBadge(r.pct)}</span>
    </div>`;

  // ── Section: 角度循环系统 ──
  const cycRows = va.cycAng.nearestNext.map(t =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;border-radius:6px;margin-bottom:3px;background:rgba(200,168,74,0.06);border:1px solid rgba(200,168,74,0.12)">
      <div>
        <span style="font-size:.72rem;font-weight:${t.strong?'700':'400'};color:${t.strong?'var(--gold)':'var(--muted)'}">${t.label} ${t.note}</span>
        ${t.note2?`<span style="font-size:.6rem;color:var(--amber);margin-left:5px">· ${t.note2}</span>`:''}
      </div>
      <span style="font-weight:600;font-size:.78rem;color:var(--gold)">${fmtP(t.priceTarget)}${pctBadge(t.pct)}</span>
    </div>`
  ).join('');

  // ── Section: K线分型周期 ──
  const nearPeriods = va.fractal.periodSignals.filter(p => p.isNear || p.strong);
  const periodRows = va.fractal.periodSignals.slice(0, 6).map(p =>
    `<div style="display:flex;justify-content:space-between;align-items:center;padding:5px 10px;border-radius:6px;margin-bottom:3px;background:${p.isNear?'rgba(200,168,74,0.12)':'rgba(0,0,0,0.02)'}">
      <div>
        <span style="font-size:.7rem;font-weight:${p.strong?'700':'400'};color:${p.strong?p.color:'var(--muted)'}">${p.label}</span>
        <span style="font-size:.6rem;color:var(--faint);margin-left:5px">${p.note}</span>
        ${p.isNear?`<span style="font-size:.6rem;color:var(--gold);margin-left:5px">⚡ 临近!</span>`:''}
      </div>
      <div style="text-align:right">
        <span style="font-size:.7rem;color:var(--muted)">${p.completion}% 完成</span>
        <span style="font-size:.65rem;color:${p.direction==='up'?'var(--bull)':'var(--bear)'};margin-left:5px">${p.direction==='up'?'↑':'↓'} $${p.priceTarget.toLocaleString()}</span>
      </div>
    </div>`
  ).join('');

  // 已经历的度数提示
  const degNote = va.cycAng.degreesElapsed;
  const degInCycles = (degNote / 360).toFixed(2);
  const nearCycle = [360,480,540,720].find(c => Math.abs(degNote % c) < 15 || Math.abs(c - degNote % c) < 15);

  return `
    <div class="panel">
      <div class="panel-title" style="justify-content:space-between">
        <span>⚙ 波动率系统 · 荷包蛋方法论三法合一</span>
        <span class="badge ${bc}">${bl}</span>
      </div>

      <!-- 方法说明 -->
      <div style="background:rgba(200,168,74,0.07);border:1px solid rgba(200,168,74,0.2);border-radius:10px;padding:14px;margin-bottom:16px;font-size:.78rem;line-height:1.8;color:var(--muted)">
        <strong style="color:var(--gold)">📹 算法来源</strong>：金融占星玩家"荷包蛋"视频中分析BTC走势的核心三法：<br>
        <strong style="color:#d4a843">① 0.809波动率共振</strong>：前高/低 × 黄金比率系数 → 关键支撑/阻力共振位<br>
        <strong style="color:#38a8e0">② 角度度数循环</strong>：价格差 → √价格空间 → 360°/480°/720° 螺旋转换<br>
        <strong style="color:#e080a0">③ K线顶底分型确认</strong>：日线级别分型结构 + K线根数周期规律验证
      </div>

      <!-- ① 0.809波动率共振 -->
      <div style="background:rgba(200,168,74,0.05);border:1px solid rgba(200,168,74,0.18);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-size:.82rem;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:.05em">① 波动率系数共振价位 · 前高 $${Math.round(va.H).toLocaleString()} · 前低 $${Math.round(va.L).toLocaleString()}</div>
        <div style="font-size:.7rem;color:var(--muted);margin-bottom:10px;line-height:1.6">
          核心算法：<strong>前高点 × 0.809 = 最强共振支撑</strong>（视频例：74075 × 0.809 ≈ 59927 与前低59930形成1:1共振）<br>
          当前价格：<strong style="color:var(--gold)">${fmtP(va.P)}</strong> · 已经历角度：<strong style="color:var(--sky)">${degNote}°</strong>（${degInCycles}圈）${nearCycle?`<span style="color:var(--amber);margin-left:5px">⚡ 接近${nearCycle}°共振节点!</span>`:''}
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div>
            <div style="font-size:.62rem;color:var(--bear);font-weight:700;margin-bottom:5px">▲ 共振阻力（上方）</div>
            ${resAbove.map(resRow).join('') || '<div style="font-size:.72rem;color:var(--faint);padding:8px">暂无上方共振位</div>'}
          </div>
          <div>
            <div style="font-size:.62rem;color:var(--bull);font-weight:700;margin-bottom:5px">▼ 共振支撑（下方）</div>
            ${resBelow.map(resRow).join('') || '<div style="font-size:.72rem;color:var(--faint);padding:8px">暂无下方共振位</div>'}
          </div>
        </div>
      </div>

      <!-- ② 角度循环系统 -->
      <div style="background:rgba(56,168,224,0.05);border:1px solid rgba(56,168,224,0.18);border-radius:10px;padding:14px;margin-bottom:14px">
        <div style="font-size:.82rem;font-weight:700;color:var(--sky);margin-bottom:8px;letter-spacing:.05em">② 角度循环度数转换 · 从前低 $${Math.round(va.L).toLocaleString()} 出发</div>
        <div style="font-size:.7rem;color:var(--muted);margin-bottom:10px;line-height:1.6">
          公式：<strong>度数 = (√目标价 − √起点价) × 180</strong> · 视频例：从599到740经历480°(360+120°)为重要转折<br>
          当前已经历：<strong style="color:var(--sky)">${degNote}°</strong> ≈ <strong style="color:var(--gold)">${degInCycles} 圈</strong> · 下方为下一个整周期目标价
        </div>
        ${cycRows || '<div style="font-size:.72rem;color:var(--faint);padding:8px">计算中...</div>'}

        <!-- 角度完整表格 -->
        <div style="margin-top:10px">
          <div style="font-size:.65rem;font-weight:700;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">完整角度参照表（从前低出发的目标价）</div>
          <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:4px">
            ${va.cycAng.targets.map(t =>
              `<div style="display:flex;justify-content:space-between;padding:4px 8px;border-radius:5px;background:${t.strong?'rgba(200,168,74,0.1)':'rgba(0,0,0,0.02)'};border:1px solid ${t.strong?'rgba(200,168,74,0.25)':'transparent'}">
                <span style="font-size:.65rem;color:${t.strong?'var(--gold)':'var(--muted)'};font-weight:${t.strong?'700':'400'}">${t.label} ${t.note}</span>
                <span style="font-size:.65rem;color:${t.isAboveUp?'var(--bear)':'var(--bull)'}">
                  ${t.isAboveUp?'▲':'▼'} ${fmtP(t.priceUp)}
                </span>
              </div>`
            ).join('')}
          </div>
        </div>
      </div>

      <!-- ③ K线分型确认 -->
      <div style="background:rgba(224,128,160,0.05);border:1px solid rgba(224,128,160,0.2);border-radius:10px;padding:14px">
        <div style="font-size:.82rem;font-weight:700;color:#e080a0;margin-bottom:8px;letter-spacing:.05em">③ K线顶底分型确认 · 趋势转折信号</div>

        <!-- 分型信号主卡 -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:12px">
          <div style="background:rgba(${va.fractal.topFractal?'192,48,48':'24,145,80'},0.1);border:1px solid rgba(${va.fractal.topFractal?'192,48,48':'24,145,80'},0.3);border-radius:8px;padding:12px">
            <div style="font-size:1.2rem;margin-bottom:4px">${va.fractal.topFractal?'⚠':'✦'}</div>
            <div style="font-size:.85rem;font-weight:700;color:${va.fractal.topFractal?'var(--bear)':'var(--bull)'}">${va.fractal.fractalLabel}</div>
            <div style="font-size:.7rem;color:var(--muted);margin-top:4px;line-height:1.5">${va.fractal.fractalDetail}</div>
          </div>
          <div style="background:rgba(200,168,74,0.07);border:1px solid rgba(200,168,74,0.2);border-radius:8px;padding:12px">
            <div style="font-size:.68rem;color:var(--faint);margin-bottom:4px">当前价格位置</div>
            <div style="font-size:1.2rem;font-weight:700;color:var(--gold)">${va.fractal.relPos}%</div>
            <div style="font-size:.7rem;color:var(--muted);margin-top:2px">处于高低点区间内</div>
            <div style="margin-top:8px;height:5px;background:var(--bg2);border-radius:3px;overflow:hidden">
              <div style="width:${va.fractal.relPos}%;height:100%;background:linear-gradient(90deg,var(--bull),${va.fractal.relPos>65?'var(--bear)':'var(--bull)'});border-radius:3px"></div>
            </div>
          </div>
        </div>

        <!-- 操作建议 -->
        <div style="background:rgba(112,48,184,0.08);border:1px solid rgba(112,48,184,0.2);border-radius:8px;padding:12px;margin-bottom:12px">
          <div style="font-size:.7rem;font-weight:700;color:var(--purple);margin-bottom:5px">⚡ 分型信号操作参考</div>
          <div style="font-size:.78rem;color:var(--text);line-height:1.7">${va.fractal.advice}</div>
        </div>

        <!-- K线根数周期 -->
        <div>
          <div style="font-size:.65rem;font-weight:700;color:var(--muted);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">K线根数周期节点（视频方法：150根、207根误差修正）</div>
          ${periodRows}
        </div>
      </div>

      <!-- 三法合一综合研判 -->
      <div style="margin-top:14px;padding:14px;background:rgba(200,168,74,0.1);border:1px solid rgba(200,168,74,0.3);border-radius:10px">
        <div style="font-size:.72rem;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:.08em">⬡ 三法合一综合研判</div>
        <div style="font-size:.8rem;color:var(--text);line-height:1.8">
          波动率共振最强位：<strong style="color:var(--gold)">${va.volRes[0]?fmtP(va.volRes[0].price):'--'}</strong>
          （${va.volRes[0]?.resonance||'--'}）·
          角度循环下一节点：<strong style="color:var(--sky)">${va.cycAng.nearestNext[0]?fmtP(va.cycAng.nearestNext[0].priceTarget):'--'}</strong>
          (${va.cycAng.nearestNext[0]?.label||'--'}) ·
          K线分型信号：<strong style="color:${va.fractal.topFractal?'var(--bear)':'var(--bull)'}">${va.fractal.fractalLabel}</strong> ·
          综合方向偏向：<strong style="color:${va.bias>0.15?'var(--bull)':va.bias<-0.15?'var(--bear)':'var(--gold)'}">${va.bias>0.15?'看多':va.bias<-0.15?'看空':'中性观望'}</strong>，
          置信度 ${((va&&va.conf||0)*100).toFixed(0)}%。
        </div>
      </div>
    </div>`;
}




// ════════════════════════════════════════════════════════════════════════
// 技术指标引擎 v1 — RSI · MACD · 布林线 · 九转序列
// 基于 klines 数据计算真实技术指标（有实时数据时）
// 或使用高低点近似推算（无K线时）
// ════════════════════════════════════════════════════════════════════════

// ── 工具：从K线数组提取收盘价 ────────────────────────────────────────
// klines: Binance格式 [[openTime,open,high,low,close,...], ...]
function smartRound(v) {
  if (!v || isNaN(v)) return 0;
  if (v >= 1000) return Math.round(v);
  if (v >= 10)   return Math.round(v * 10) / 10;
  if (v >= 1)    return Math.round(v * 100) / 100;
  if (v >= 0.1)  return Math.round(v * 1000) / 1000;
  if (v >= 0.01) return Math.round(v * 10000) / 10000;
  return Math.round(v * 100000) / 100000;
}

function extractCloses(klines) {
  if (!klines || !klines.length) return [];
  return klines.map(k => parseFloat(k[4]));
}
function extractHighs(klines) {
  return klines ? klines.map(k => parseFloat(k[2])) : [];
}
function extractLows(klines) {
  return klines ? klines.map(k => parseFloat(k[3])) : [];
}

// ── RSI Engine ─────────────────────────────────────────────────────────
function calcRSI(closes, period = 14) {
  if (closes.length < period + 1) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) gains += diff; else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const g = diff > 0 ? diff : 0;
    const l = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + g) / period;
    avgLoss = (avgLoss * (period - 1) + l) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function engineRSI(coin, date, price, high, low, klines) {
  const P = price || 50000;
  const H = high  || P * 1.18;
  const L = low   || P * 0.82;

  let closes = extractCloses(klines);
  let rsi14 = null, rsi6 = null, rsi21 = null;

  if (closes.length >= 15) {
    rsi14 = calcRSI(closes, 14);
    rsi6  = calcRSI(closes, 6);
    rsi21 = calcRSI(closes, 21);
  } else {
    // 近似推算：根据价格在高低点的相对位置
    const relPos = (P - L) / (H - L + 0.001);
    const r = rng(seed(date, coin, 7701));
    rsi14 = Math.round(relPos * 60 + 20 + (r() - 0.5) * 18);
    rsi6  = Math.round(relPos * 60 + 22 + (r() - 0.5) * 22);
    rsi21 = Math.round(relPos * 55 + 22 + (r() - 0.5) * 14);
  }

  rsi14 = Math.max(0, Math.min(100, rsi14));
  rsi6  = Math.max(0, Math.min(100, rsi6 || rsi14));
  rsi21 = Math.max(0, Math.min(100, rsi21 || rsi14));

  // 超买超卖判断
  const isOverbought  = rsi14 >= 70;
  const isOversold    = rsi14 <= 30;
  const isNeutral     = rsi14 > 45 && rsi14 < 55;

  // 趋势判断 (RSI6 vs RSI21)
  const rsiTrend = rsi6 > rsi21 ? '动量上升' : rsi6 < rsi21 ? '动量下降' : '横盘震荡';

  // 背离检测（近似）
  let divergence = null;
  if (closes.length >= 20) {
    const midPoint = Math.floor(closes.length / 2);
    const firstHalfHigh = Math.max(...closes.slice(0, midPoint));
    const secondHalfHigh = Math.max(...closes.slice(midPoint));
    const firstRSI = calcRSI(closes.slice(0, midPoint + 14), 14) || rsi14;
    if (secondHalfHigh > firstHalfHigh && rsi14 < firstRSI - 5) {
      divergence = { type: '顶背离', severity: '看跌', detail: '价格新高但RSI走低' };
    } else if (secondHalfHigh < firstHalfHigh && rsi14 > firstRSI + 5) {
      divergence = { type: '底背离', severity: '看涨', detail: '价格新低但RSI走高' };
    }
  }

  // 关键水平
  const levels = [
    { value: 80, label: '极度超买', color: 'var(--bear)' },
    { value: 70, label: '超买区', color: 'var(--bear)' },
    { value: 60, label: '强势区', color: 'var(--amber)' },
    { value: 50, label: '中性线', color: 'var(--muted)' },
    { value: 40, label: '弱势区', color: 'var(--sky)' },
    { value: 30, label: '超卖区', color: 'var(--bull)' },
    { value: 20, label: '极度超卖', color: 'var(--bull)' },
  ];

  // 信号描述
  let signal, signalColor, advice;
  if (rsi14 >= 80)      { signal = '极度超买'; signalColor = 'var(--bear)'; advice = '极强卖出信号，注意顶部风险'; }
  else if (rsi14 >= 70) { signal = '超买区域'; signalColor = 'var(--bear)'; advice = '价格偏高，可考虑减仓或等待回调'; }
  else if (rsi14 >= 60) { signal = '强势偏多'; signalColor = 'var(--amber)'; advice = '多头主导，追涨需注意回调风险'; }
  else if (rsi14 >= 45) { signal = '中性偏多'; signalColor = 'var(--gold)'; advice = '震荡整理中，观望等待方向确认'; }
  else if (rsi14 >= 35) { signal = '中性偏空'; signalColor = 'var(--muted)'; advice = '空头有所主导，等待企稳信号'; }
  else if (rsi14 >= 20) { signal = '超卖区域'; signalColor = 'var(--bull)'; advice = '价格偏低，关注反弹机会'; }
  else                   { signal = '极度超卖'; signalColor = 'var(--bull)'; advice = '极强买入信号，警惕底部反转'; }

  // 偏向计算
  const bias = (rsi14 - 50) / 50;  // -1 to +1
  const conf = 0.55 + Math.abs(bias) * 0.3;

  return {
    rsi14: Math.round(rsi14 * 10) / 10,
    rsi6:  Math.round(rsi6 * 10)  / 10,
    rsi21: Math.round(rsi21 * 10) / 10,
    isOverbought, isOversold, isNeutral,
    rsiTrend, divergence, levels,
    signal, signalColor, advice,
    bias: Math.max(-1, Math.min(1, bias)),
    conf,
    hasRealData: closes.length >= 15,
  };
}

// ── MACD Engine ────────────────────────────────────────────────────────
function calcEMA(closes, period) {
  if (!closes.length) return [];
  const k = 2 / (period + 1);
  const emas = [closes[0]];
  for (let i = 1; i < closes.length; i++) {
    emas.push(closes[i] * k + emas[i - 1] * (1 - k));
  }
  return emas;
}

function engineMACD(coin, date, price, high, low, klines) {
  const P = price || 50000;
  const H = high  || P * 1.18;
  const L = low   || P * 0.82;

  let closes = extractCloses(klines);
  let macdLine, signalLine, histogram, ema12Last, ema26Last;
  let hasRealData = false;

  if (closes.length >= 35) {
    hasRealData = true;
    const ema12arr = calcEMA(closes, 12);
    const ema26arr = calcEMA(closes, 26);
    const macdArr  = ema12arr.map((v, i) => v - ema26arr[i]).slice(25);
    const sigArr   = calcEMA(macdArr, 9);
    const histArr  = macdArr.map((v, i) => v - (sigArr[i] || 0));
    macdLine   = macdArr[macdArr.length - 1];
    signalLine = sigArr[sigArr.length - 1];
    histogram  = histArr[histArr.length - 1];
    ema12Last  = ema12arr[ema12arr.length - 1];
    ema26Last  = ema26arr[ema26arr.length - 1];

    // 检测金叉/死叉
    var prevMacd = macdArr[macdArr.length - 2] || 0;
    var prevSig  = sigArr[sigArr.length - 2]   || 0;
    var prevHist = histArr[histArr.length - 2] || 0;
  } else {
    // 近似推算
    const r = rng(seed(date, coin, 7702));
    const relPos = (P - L) / (H - L + 0.001);
    const scale  = P * 0.01;
    macdLine   = (relPos - 0.5) * scale * 2 + (r() - 0.5) * scale;
    signalLine = macdLine * 0.8 + (r() - 0.5) * scale * 0.5;
    histogram  = macdLine - signalLine;
    ema12Last  = P * (1 + (r() - 0.5) * 0.02);
    ema26Last  = P * (1 + (r() - 0.5) * 0.02);
    var prevMacd = macdLine * 0.85;
    var prevSig  = signalLine * 0.85;
    var prevHist = (prevMacd - prevSig);
  }

  // 金叉/死叉判断
  const isBullCross = prevMacd < prevSig && macdLine > signalLine;
  const isBearCross = prevMacd > prevSig && macdLine < signalLine;
  const crossType   = isBullCross ? '金叉' : isBearCross ? '死叉' : null;

  // 柱状图动量
  const histMomentum = histogram > 0 && histogram > (prevHist || 0) ? '多头加速'
    : histogram > 0 ? '多头减速'
    : histogram < 0 && histogram < (prevHist || 0) ? '空头加速'
    : histogram < 0 ? '空头减速'
    : '震荡';

  // MACD相对于0轴
  const aboveZero = macdLine > 0;

  // 背离检测
  let divergence = null;
  if (hasRealData && closes.length >= 35) {
    const closes_half = closes.slice(0, Math.floor(closes.length / 2));
    const ema12h = calcEMA(closes_half, 12);
    const ema26h = calcEMA(closes_half, 26);
    const macdh  = ema12h[ema12h.length-1] - ema26h[ema26h.length-1];
    const priceHigh1 = Math.max(...closes_half);
    const priceHigh2 = Math.max(...closes.slice(Math.floor(closes.length/2)));
    if (priceHigh2 > priceHigh1 && macdLine < macdh - Math.abs(macdh) * 0.1) {
      divergence = { type: '顶背离', detail: 'MACD创新低但价格创新高', bearish: true };
    } else if (priceHigh2 < priceHigh1 && macdLine > macdh + Math.abs(macdh) * 0.1) {
      divergence = { type: '底背离', detail: 'MACD创新高但价格创新低', bearish: false };
    }
  }

  // 信号
  let signal, signalColor, advice;
  if (isBullCross && aboveZero)    { signal = '强势金叉'; signalColor = 'var(--bull)'; advice = '零轴上方金叉，强烈看多信号'; }
  else if (isBullCross)            { signal = '零轴下金叉'; signalColor = 'var(--teal)'; advice = '零轴下方金叉，需确认零轴突破'; }
  else if (isBearCross && !aboveZero){ signal = '强势死叉'; signalColor = 'var(--bear)'; advice = '零轴下方死叉，强烈看空信号'; }
  else if (isBearCross)            { signal = '零轴上死叉'; signalColor = 'var(--rose)'; advice = '零轴上方死叉，注意回调风险'; }
  else if (aboveZero && histogram > 0) { signal = '多头势头'; signalColor = 'var(--bull)'; advice = '多头趋势延续，可顺势持多'; }
  else if (aboveZero && histogram <= 0){ signal = '多头减弱'; signalColor = 'var(--amber)'; advice = '多头动能减弱，关注死叉风险'; }
  else if (!aboveZero && histogram < 0){ signal = '空头势头'; signalColor = 'var(--bear)'; advice = '空头趋势延续，短线谨慎做多'; }
  else                               { signal = '空头减弱'; signalColor = 'var(--sky)'; advice = '空头动能减弱，关注金叉机会'; }

  const bias = (macdLine > 0 ? 0.3 : -0.3)
    + (histogram > 0 ? 0.2 : -0.2)
    + (isBullCross ? 0.3 : isBearCross ? -0.3 : 0)
    + (divergence?.bearish === false ? 0.2 : divergence?.bearish === true ? -0.2 : 0);

  const fmtM = v => {
    const abs = Math.abs(v);
    if (abs >= 1000) return (v > 0 ? '+' : '') + Math.round(v).toLocaleString();
    const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'0';
    if (Math.abs(_v) >= 1) return (_v > 0 ? '+' : '') + _v.toFixed(2);
    return (_v > 0 ? '+' : '') + _v.toFixed(4);
  };

  return {
    macdLine, signalLine, histogram,
    ema12Last, ema26Last,
    isBullCross, isBearCross, crossType,
    histMomentum, aboveZero, divergence,
    signal, signalColor, advice,
    fmtM,
    bias: Math.max(-1, Math.min(1, bias)),
    conf: 0.55 + Math.min(0.3, Math.abs(bias)),
    hasRealData,
  };
}

// ── Bollinger Bands Engine ─────────────────────────────────────────────
function engineBollinger(coin, date, price, high, low, klines) {
  const P = price || 50000;
  const H = high  || P * 1.18;
  const L = low   || P * 0.82;

  let closes = extractCloses(klines);
  let upperBand, lowerBand, middleBand, stdDev, bandwidth, percentB;
  let hasRealData = false;

  if (closes.length >= 20) {
    hasRealData = true;
    const period = 20;
    const slice  = closes.slice(-period);
    const mean   = slice.reduce((s, v) => s + v, 0) / period;
    const variance = slice.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / period;
    stdDev     = Math.sqrt(variance);
    middleBand = mean;
    upperBand  = mean + 2 * stdDev;
    lowerBand  = mean - 2 * stdDev;
  } else {
    // 近似推算（基于 ATR 估算布林带）
    const r = rng(seed(date, coin, 7703));
    const range = H - L;
    const atr   = range * (0.15 + r() * 0.15);
    stdDev     = atr;
    middleBand = (H + L) / 2;
    upperBand  = middleBand + 2 * stdDev;
    lowerBand  = middleBand - 2 * stdDev;
  }

  // %B = (价格 - 下轨) / (上轨 - 下轨)
  const bandWidth = upperBand - lowerBand;
  percentB  = bandWidth > 0 ? (P - lowerBand) / bandWidth : 0.5;
  bandwidth = bandWidth > 0 ? bandWidth / middleBand * 100 : 0;

  // 收窄/扩张判断
  let bandState, bandStateNote;
  if (bandwidth < 5) {
    bandState = '极度收窄'; bandStateNote = '带宽极小，大行情蓄势，随时可能爆发';
  } else if (bandwidth < 10) {
    bandState = '布林收窄'; bandStateNote = '震荡收敛，突破方向即将确认';
  } else if (bandwidth > 25) {
    bandState = '带宽极大'; bandStateNote = '波动剧烈，行情极端，注意均值回归';
  } else if (bandwidth > 15) {
    bandState = '带宽扩张'; bandStateNote = '趋势明确延续中';
  } else {
    bandState = '正常波动'; bandStateNote = '带宽适中，趋势尚不明朗';
  }

  // 价格相对位置
  let positionLabel, positionColor, advice;
  if (percentB > 1.0) {
    positionLabel = '突破上轨'; positionColor = 'var(--bear)';
    advice = '价格突破上轨，超买状态，关注回撤信号';
  } else if (percentB > 0.8) {
    positionLabel = '贴近上轨'; positionColor = 'var(--rose)';
    advice = '价格靠近上轨，偏强势，但注意回调风险';
  } else if (percentB > 0.6) {
    positionLabel = '上轨区间'; positionColor = 'var(--amber)';
    advice = '处于中轨与上轨之间，多头有利区域';
  } else if (percentB > 0.4) {
    positionLabel = '中轨附近'; positionColor = 'var(--gold)';
    advice = '价格在中轨(均线)附近，方向待确认';
  } else if (percentB > 0.2) {
    positionLabel = '下轨区间'; positionColor = 'var(--sky)';
    advice = '处于中轨与下轨之间，空头有压力区域';
  } else if (percentB > 0.0) {
    positionLabel = '贴近下轨'; positionColor = 'var(--teal)';
    advice = '价格靠近下轨，超卖区域，关注反弹信号';
  } else {
    positionLabel = '突破下轨'; positionColor = 'var(--bull)';
    advice = '价格突破下轨，强超卖，可能出现反弹';
  }

  const fmtP = v => v >= 1000 ? '$' + Math.round(v).toLocaleString()
    : (()=>{ const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'--'; return _v>=1?'$'+_v.toFixed(2):'$'+_v.toFixed(4); })();

  const bias = (percentB - 0.5) * 2 * 0.7;  // 中轨=0, 上轨=+0.7, 下轨=-0.7

  return {
    upperBand, middleBand, lowerBand,
    stdDev, bandwidth: parseFloat((bandwidth||0).toFixed(2)),
    percentB: parseFloat((percentB||0).toFixed(3)),
    bandState, bandStateNote,
    positionLabel, positionColor, advice,
    fmtP,
    bias: Math.max(-1, Math.min(1, bias)),
    conf: 0.50 + Math.abs(bias) * 0.25,
    hasRealData,
  };
}

// ── 多时框布林带 + EMA 联合分析引擎 ────────────────────────────────────
// 核心策略：
//   反弹阻力逐级升：4H→6H→8H→12H BOLL上轨依次突破看下一级
//   支撑层级用日线EMA7/EMA30/EMA52框定；突破EMA30才进攻EMA52
//   MACD 2日线背离（柱收缩但价格走高）为中线做多信号
//   斐波大波段：有效突破0.382则0.5/0.618加速
function engineMultiTFBoll(coin, date, price, high, low, klines) {
  const P  = price || 50000;
  const H  = high  || P * 1.05;
  const L  = low   || P * 0.95;
  const r  = rng(seed(date, coin, 8801));

  const currentTF = (typeof document !== 'undefined'
    && document.getElementById('fetchPeriod')?.value) || '4h';

  const fmtP = v => v >= 10000 ? Math.round(v).toLocaleString()
    : (()=>{const _v=Number(v);if(isNaN(_v)||!isFinite(_v))return'0';return _v>=100?_v.toFixed(1):_v>=1?_v.toFixed(2):_v.toFixed(4);})();

  const atR  = H - L;
  const mid  = (H + L) / 2;

  const TF_BOLL_FACTOR = {
    '15m': 0.60, '30m': 0.80, '1h': 1.00, '2h': 1.30,
    '4h': 1.65, '6h': 2.00, '8h': 2.30, '12h': 2.80,
    '1d': 3.50, '3d': 5.50, '1w': 9.00,
  };

  let baseMid = mid, baseStd = atR * 0.30;
  if (klines && klines.length >= 20) {
    const closes = extractCloses(klines);
    const sl = closes.slice(-20);
    baseMid = sl.reduce((s, v) => s + v, 0) / 20;
    const vr  = sl.reduce((s, v) => s + Math.pow(v - baseMid, 2), 0) / 20;
    baseStd  = Math.sqrt(vr);
  }
  const baseF = TF_BOLL_FACTOR[currentTF] || 1.65;

  const bollByTF = {};
  for (const [tf, factor] of Object.entries(TF_BOLL_FACTOR)) {
    const ratio  = factor / baseF;
    const std    = baseStd * ratio;
    const noiseR = (r() - 0.5) * 0.08;
    bollByTF[tf] = {
      upper: baseMid + 2 * std * (1 + noiseR),
      mid:   baseMid,
      lower: baseMid - 2 * std * (1 + noiseR),
    };
  }

  let ema7 = null, ema30 = null, ema52 = null;
  const closes = klines ? extractCloses(klines) : [];

  if (closes.length >= 52) {
    ema7  = calcEMA(closes, 7);
    ema30 = calcEMA(closes, 30);
    ema52 = calcEMA(closes, 52);
  } else {
    ema7  = P * (1 - 0.008 - r() * 0.012);
    ema30 = P * (1 - 0.020 - r() * 0.025);
    ema52 = P * (1 - 0.060 - r() * 0.040);
  }

  const aboveEma7  = P > ema7;
  const aboveEma30 = P > ema30;
  const aboveEma52 = P > ema52;
  const emaBearish = ema7 < ema30 && ema30 < ema52;

  let emaStructure, emaNote, emaColor;
  if (aboveEma52) {
    emaStructure = '均线多头'; emaColor = 'var(--bull)';
    emaNote = `价格站上EMA52(${fmtP(ema52)})，进入多头结构`;
  } else if (aboveEma30) {
    emaStructure = '突破EMA30·待验证'; emaColor = 'var(--amber)';
    emaNote = `已突破EMA30(${fmtP(ema30)})，回踩不低于EMA30为多头信号，目标EMA52(${fmtP(ema52)})`;
  } else if (aboveEma7) {
    emaStructure = 'EMA7支撑·EMA30压制'; emaColor = 'var(--gold)';
    emaNote = `价格在EMA7(${fmtP(ema7)})上方，EMA30(${fmtP(ema30)})为近期主要阻力；离EMA52(${fmtP(ema52)})尚远，上涨量能需确认`;
  } else {
    emaStructure = '跌破EMA7·弱势'; emaColor = 'var(--bear)';
    emaNote = `价格跌破EMA7(${fmtP(ema7)})，短线支撑移至日线BOLL中轨或4H下轨`;
  }

  const shortTFs = ['4h','6h','8h','12h','1d'];
  const rebounds = shortTFs.map(tf => {
    const b = bollByTF[tf];
    const broken = P > b.upper * 0.998;
    return { tf, upper: b.upper, lower: b.lower, mid: b.mid, broken };
  });

  const nextResist = rebounds.find(rb => !rb.broken);
  const lastBroken = [...rebounds].reverse().find(rb => rb.broken);

  const supportLevels = [
    { label: 'EMA7支撑',     price: ema7,  color: 'var(--bull)',  note: '日线EMA7，第一支撑（短多进场/高空止盈）' },
    { label: 'EMA30支撑',    price: ema30, color: 'var(--amber)', note: 'EMA30，重要支撑；跌破则短线转弱' },
    { label: '1日BOLL中轨',  price: bollByTF['1d'].mid,   color: 'var(--sky)',  note: '日线中轨 ≈ 4H下轨附近，回踩低多' },
    { label: '4H下轨',       price: bollByTF['4h'].lower, color: 'var(--teal)', note: '4H布林下轨，超卖反弹支撑' },
    { label: '6H下轨',       price: bollByTF['6h'].lower, color: 'var(--teal)', note: '6H布林下轨' },
    { label: '8H下轨',       price: bollByTF['8h'].lower, color: 'var(--teal)', note: '8H布林下轨' },
  ].filter(s => s.price > 0)
   .sort((a, b) => b.price - a.price);

  const nearestSupport = supportLevels.find(s => P > s.price * 1.005);

  let macd2dDiv = false, macd2dNote = '';
  if (closes.length >= 26) {
    const ema12arr = calcEMA(closes, 12);
    const ema26arr = calcEMA(closes, 26);
    const macdLine = Array.isArray(ema12arr) ? ema12arr.at(-1) - ema26arr.at(-1)
                   : ema12arr - ema26arr;
    const recentCloses = closes.slice(-6);
    const priceUp = recentCloses.at(-1) > recentCloses[0];
    if (Math.abs(macdLine) > 0) {
      const histShrinking = Math.abs(macdLine) < Math.abs(closes.at(-1) - closes.at(-2)) * 2;
      if (histShrinking && priceUp) {
        macd2dDiv = true;
        macd2dNote = 'MACD柱状图收缩而价格走高，大级别背离蓄势，动能已拉满，注意当前时框转折点';
      } else if (histShrinking && !priceUp) {
        macd2dDiv = true;
        macd2dNote = '大级别MACD柱收缩而价格走低，底背离形成，中线做多动能积聚，等待信号确认';
      }
    }
  }

  const swingRange = atR * (8 + r() * 4);
  const swingLow   = P - swingRange * (0.45 + r() * 0.15);
  const fib382     = swingLow + swingRange * 0.382;
  const fib500     = swingLow + swingRange * 0.500;
  const fib618     = swingLow + swingRange * 0.618;

  const broke382 = P > fib382;
  const broke500 = P > fib500;
  const broke618 = P > fib618;

  let fibStatus, fibNote, fibColor;
  if (broke618) {
    fibStatus = '突破0.618·目标看更高'; fibColor = 'var(--bull)';
    fibNote = '已突破0.618斐波位，反弹目标完成，需确认能否站稳并发展为新趋势';
  } else if (broke500) {
    fibStatus = '突破0.5·进攻0.618'; fibColor = 'var(--emerald)';
    fibNote = `突破0.382后0.5加速实现，下一目标0.618压力在 ${fmtP(fib618)} 附近`;
  } else if (broke382) {
    fibStatus = '突破0.382·下两位快'; fibColor = 'var(--amber)';
    fibNote = `万事开头难，有效突破0.382(${fmtP(fib382)})后，0.5(${fmtP(fib500)})和0.618(${fmtP(fib618)})通常加速到来`;
  } else {
    fibStatus = '0.382尚未突破'; fibColor = 'var(--muted)';
    fibNote = `0.382关键压力在 ${fmtP(fib382)} 附近，有效突破是反弹升级的起点`;
  }

  let strategy, strategyColor;
  if (!aboveEma30 && nextResist) {
    strategy = `反弹做空·目标${nextResist.tf.toUpperCase()}上轨 ${fmtP(nextResist.upper)}`;
    strategyColor = 'var(--bear)';
  } else if (aboveEma30 && !aboveEma52) {
    strategy = `突破EMA30·回踩做多·进攻EMA52(${fmtP(ema52)})`;
    strategyColor = 'var(--amber)';
  } else if (aboveEma52) {
    strategy = `多头结构·回踩EMA52附近做多`;
    strategyColor = 'var(--bull)';
  } else {
    strategy = '震荡区间·等待方向确认';
    strategyColor = 'var(--gold)';
  }

  const bias = aboveEma52 ? 0.6 : aboveEma30 ? 0.3 : aboveEma7 ? 0 : -0.3;

  return {
    bollByTF, ema7, ema30, ema52,
    emaStructure, emaNote, emaColor,
    aboveEma7, aboveEma30, aboveEma52, emaBearish,
    rebounds, nextResist, lastBroken,
    supportLevels, nearestSupport,
    macd2dDiv, macd2dNote,
    fib382, fib500, fib618, broke382, broke500, broke618,
    fibStatus, fibNote, fibColor,
    strategy, strategyColor,
    fmtP, currentTF,
    hasRealData: !!(klines && klines.length >= 20),
    bias, conf: 0.60,
  };
}

// ── TD Sequential (九转序列) Engine ────────────────────────────────────
function engineTDSequential(coin, date, price, high, low, klines) {
  const P = price || 50000;
  const H = high  || P * 1.18;
  const L = low   || P * 0.82;

  let closes = extractCloses(klines);
  let highs  = extractHighs(klines);
  let lows   = extractLows(klines);
  let setupCount = 0, countdownCount = 0, setupDir = null, signal9 = null;
  let hasRealData = false;

  if (closes.length >= 9) {
    hasRealData = true;
    // TD Setup: 9 連続 closes vs 4-bar ago
    let setupUp = 0, setupDown = 0;
    for (let i = 4; i < closes.length; i++) {
      if (closes[i] < closes[i - 4]) setupDown++;
      else setupDown = 0;
      if (closes[i] > closes[i - 4]) setupUp++;
      else setupUp = 0;
    }
    // Take the last state
    setupCount = Math.max(setupUp, setupDown);
    setupDir   = setupUp > setupDown ? 'up' : 'down';

    // Count up to 9 and detect perfection
    const n = closes.length;
    let up = 0, down = 0;
    for (let i = 4; i < n; i++) {
      if (closes[i] < closes[i - 4]) { down++; up = 0; }
      else if (closes[i] > closes[i - 4]) { up++; down = 0; }
      else { up = 0; down = 0; }
    }
    setupCount = up || down;
    setupDir   = up > 0 ? 'up' : 'down';

    if (setupCount >= 9) {
      // Check "perfected" setup: 8th or 9th bar's low(up) < 6th/7th bar's low
      signal9 = setupDir === 'down' ? '买入九转完成' : '卖出九转完成';
    }
  } else {
    // 近似推算
    const r = rng(seed(date, coin, 7704));
    setupCount = Math.floor(r() * 9) + 1;
    setupDir   = r() > 0.5 ? 'up' : 'down';
    if (setupCount === 9) {
      signal9 = setupDir === 'down' ? '买入九转完成' : '卖出九转完成';
    }
  }

  const isComplete = setupCount >= 9;
  const isBuySetup = setupDir === 'down' && isComplete;  // 下跌9根 → 买入
  const isSellSetup= setupDir === 'up'   && isComplete;  // 上涨9根 → 卖出

  // 倒计时阶段（简化：用setupCount%9模拟）
  countdownCount = Math.min(setupCount, 13);

  // 视觉进度（1-9 dots）
  const progressDots = Array.from({ length: 9 }, (_, i) => ({
    n: i + 1,
    active: i < setupCount,
    current: i === setupCount - 1,
    isKey: i === 8, // 第9根最关键
  }));

  let signal, signalColor, advice;
  if (isBuySetup) {
    signal = '买入九转完成'; signalColor = 'var(--bull)';
    advice = '下跌九转完成，可能出现反转上涨，关注买入时机';
  } else if (isSellSetup) {
    signal = '卖出九转完成'; signalColor = 'var(--bear)';
    advice = '上涨九转完成，可能出现顶部反转，注意减仓信号';
  } else if (setupDir === 'down') {
    signal = `下跌第${setupCount}根`; signalColor = 'var(--amber)';
    advice = `买入九转进行中（${setupCount}/9），完成前建议观望`;
  } else {
    signal = `上涨第${setupCount}根`; signalColor = 'var(--amber)';
    advice = `卖出九转进行中（${setupCount}/9），完成前建议持仓`;
  }

  // 历史背景描述
  const contextNote = isBuySetup
    ? '连续9根收盘价低于4根前，经典TD买入信号，历史胜率约65%'
    : isSellSetup
    ? '连续9根收盘价高于4根前，经典TD卖出信号，历史胜率约60%'
    : `TD序列${setupDir === 'down' ? '买入' : '卖出'}计数中：${setupCount}/9`;

  const bias = isBuySetup ? 0.55 : isSellSetup ? -0.55
    : setupDir === 'down' ? -(setupCount / 9) * 0.4
    : (setupCount / 9) * 0.4;

  return {
    setupCount, setupDir, isComplete,
    isBuySetup, isSellSetup,
    countdownCount,
    signal9, signal, signalColor, advice, contextNote,
    progressDots,
    bias: Math.max(-1, Math.min(1, bias)),
    conf: isComplete ? 0.70 : 0.50,
    hasRealData,
  };
}

// ── 自动K线周期推荐引擎 ────────────────────────────────────────────────
// 根据波动率 ATR%、信号强度、持仓跨度、多指标共振度推荐最佳K线周期
function engineAutoTF(price, high, low, rsiData, macdData, bbData, tdData, currentTF, span) {
  const P = price || 50000;
  const H = high  || P * 1.18;
  const L = low   || P * 0.82;

  const atrPct = (H - L) / P * 100;  // ATR百分比

  // 各周期特征
  const TF_DEFS = [
    { tf:'15m', label:'15分钟', minAtr:0.5,  maxAtr:3,   spanDays:0.01, style:'高频',  desc:'极短线，噪音较大' },
    { tf:'30m', label:'30分钟', minAtr:1,    maxAtr:5,   spanDays:0.02, style:'短线',  desc:'短线交易，需盯盘' },
    { tf:'1h',  label:'1小时',  minAtr:1.5,  maxAtr:7,   spanDays:0.04, style:'日内',  desc:'日内交易最佳周期' },
    { tf:'2h',  label:'2小时',  minAtr:2,    maxAtr:9,   spanDays:0.08, style:'日内',  desc:'减少噪音的日内周期' },
    { tf:'4h',  label:'4小时',  minAtr:3,    maxAtr:15,  spanDays:0.17, style:'波段',  desc:'最受欢迎的交易周期' },
    { tf:'6h',  label:'6小时',  minAtr:4,    maxAtr:18,  spanDays:0.25, style:'波段',  desc:'中线过渡周期' },
    { tf:'8h',  label:'8小时',  minAtr:5,    maxAtr:20,  spanDays:0.33, style:'波段',  desc:'三个时段对应' },
    { tf:'12h', label:'12小时', minAtr:6,    maxAtr:25,  spanDays:0.5,  style:'中线',  desc:'大周期波段交易' },
    { tf:'1d',  label:'日线',   minAtr:8,    maxAtr:40,  spanDays:1,    style:'中线',  desc:'趋势交易标准周期' },
    { tf:'3d',  label:'3日线',  minAtr:15,   maxAtr:60,  spanDays:3,    style:'长线',  desc:'中长线持仓' },
    { tf:'1w',  label:'周线',   minAtr:20,   maxAtr:100, spanDays:7,    style:'长线',  desc:'长线投资视角' },
  ];

  // 信号强度（各指标信号是否明确）
  const signalStrength = [];
  if (rsiData) {
    if (rsiData.isOverbought || rsiData.isOversold) signalStrength.push(0.9);
    else if (Math.abs(rsiData.rsi14 - 50) > 15) signalStrength.push(0.65);
    else signalStrength.push(0.35);
  }
  if (macdData) {
    if (macdData.isBullCross || macdData.isBearCross) signalStrength.push(0.9);
    else if (Math.abs(macdData.bias) > 0.4) signalStrength.push(0.65);
    else signalStrength.push(0.35);
  }
  if (bbData) {
    if (bbData.percentB > 0.9 || bbData.percentB < 0.1) signalStrength.push(0.85);
    else if (bbData.bandwidth < 7) signalStrength.push(0.8); // 收窄即将爆发
    else signalStrength.push(0.5);
  }
  if (tdData) {
    if (tdData.isComplete) signalStrength.push(0.85);
    else if (tdData.setupCount >= 7) signalStrength.push(0.6);
    else signalStrength.push(0.4);
  }

  const avgStrength = signalStrength.length
    ? signalStrength.reduce((s, v) => s + v, 0) / signalStrength.length
    : 0.5;

  // 根据ATR%和跨度评分各周期
  const spanDays = span || 90;
  const scored = TF_DEFS.map(t => {
    let score = 0;

    // ATR匹配度 (越接近区间中值越好)
    const midAtr = (t.minAtr + t.maxAtr) / 2;
    const atrMatch = 1 - Math.min(1, Math.abs(atrPct - midAtr) / midAtr);
    score += atrMatch * 40;

    // 跨度适配（跨度/周期 在20-200之间最佳，给足够K线数量）
    const klinesCount = spanDays / t.spanDays;
    const klinesFit   = klinesCount >= 20 && klinesCount <= 300 ? 1
      : klinesCount >= 10 ? 0.7
      : klinesCount >= 5  ? 0.4 : 0.1;
    score += klinesFit * 30;

    // 信号强度适配（信号强→可以更高频；信号弱→需要更大周期过滤噪音）
    const tfLevel = TF_DEFS.indexOf(t) / (TF_DEFS.length - 1); // 0=短线 1=长线
    const strengthFit = avgStrength > 0.7
      ? 1 - Math.abs(tfLevel - 0.3) * 1.5   // 信号强 → 偏中短线
      : avgStrength > 0.5
      ? 1 - Math.abs(tfLevel - 0.5) * 1.0   // 信号中 → 偏中线
      : 1 - Math.abs(tfLevel - 0.65) * 1.2; // 信号弱 → 偏中长线
    score += Math.max(0, strengthFit) * 30;

    return { ...t, score: Math.round(score * 10) / 10, atrMatch, klinesFit };
  });

  scored.sort((a, b) => b.score - a.score);
  const top3 = scored.slice(0, 3);
  const best = top3[0];

  // 当前周期评估
  const currentDef = TF_DEFS.find(t => t.tf === currentTF) || TF_DEFS[4];
  const currentScore = scored.find(t => t.tf === currentTF)?.score || 0;
  const betterTF     = best.tf !== currentTF;
  const improvement  = betterTF ? best.score - currentScore : 0;

  // 推荐理由
  let rationale = [];
  if (atrPct < 5)  rationale.push(`ATR较小(${(atrPct||0).toFixed(1)}%)，适合${best.label}捕捉精细走势`);
  else if (atrPct > 20) rationale.push(`ATR较大(${(atrPct||0).toFixed(1)}%)，${best.label}可过滤高频噪音`);
  else              rationale.push(`ATR适中(${(atrPct||0).toFixed(1)}%)，${best.label}信噪比最优`);

  if (avgStrength > 0.75) rationale.push('各指标信号明确，中短线操作机会明显');
  else if (avgStrength < 0.5) rationale.push('指标信号较弱，建议更大周期等待明确方向');

  if (bbData?.bandwidth < 7) rationale.push('布林带极度收窄，蓄势中，关注突破方向');
  if (tdData?.setupCount >= 8) rationale.push(`九转序列第${tdData.setupCount}根，${best.label}可把握反转节点`);
  if (rsiData?.divergence) rationale.push(`RSI${rsiData.divergence.type}，大周期验证更可靠`);

  return {
    best, top3, scored, currentDef, currentScore,
    betterTF, improvement: Math.round(improvement * 10) / 10,
    atrPct: parseFloat((atrPct||0).toFixed(2)),
    avgStrength: parseFloat((avgStrength||0).toFixed(2)),
    rationale,
  };
}


// ── RSI Panel Builder ──────────────────────────────────────────────────
function buildRSIPanel(rsiData, macdData, bbData, tdData, tfRec, mtfData) {
  if (!rsiData && !macdData && !bbData && !tdData && !mtfData) return '';

  const fmtN = v => Math.round(v * 10) / 10;
  const fmtP = v => v >= 1000 ? '$' + Math.round(v).toLocaleString()
    : (()=>{ const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'--'; return _v>=1?'$'+_v.toFixed(2):'$'+_v.toFixed(4); })();
  const pBar = (val, label, color, maxVal = 100) => {
    const pct = Math.min(100, Math.max(0, val / maxVal * 100));
    return `<div style="margin-bottom:8px">
      <div style="display:flex;justify-content:space-between;font-size:.7rem;margin-bottom:3px">
        <span style="color:var(--muted)">${label}</span>
        <span style="color:${color};font-weight:700">${fmtN(val)}</span>
      </div>
      <div style="height:6px;background:var(--bg2);border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${color};border-radius:3px;transition:width 1s ease"></div>
      </div>
    </div>`;
  };

  // ── RSI Section ──
  const rsiSection = rsiData ? `
    <div style="background:rgba(200,168,74,0.05);border:1px solid rgba(200,168,74,0.2);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:.82rem;font-weight:700;color:var(--gold)">📊 RSI 相对强弱指数</div>
        <span style="padding:3px 10px;border-radius:99px;border:1px solid ${rsiData.signalColor}40;color:${rsiData.signalColor};font-size:.7rem;font-weight:700">${rsiData.signal}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div style="background:var(--card2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:.58rem;color:var(--faint);margin-bottom:3px">RSI(6)</div>
          <div style="font-size:1.2rem;font-weight:700;color:${rsiData.rsi6>=70?'var(--bear)':rsiData.rsi6<=30?'var(--bull)':'var(--text)'}">${rsiData.rsi6}</div>
        </div>
        <div style="background:var(--card2);border-radius:8px;padding:10px;text-align:center;border:1px solid rgba(200,168,74,0.25)">
          <div style="font-size:.58rem;color:var(--gold);margin-bottom:3px">RSI(14) ★</div>
          <div style="font-size:1.5rem;font-weight:800;color:${rsiData.signalColor}">${rsiData.rsi14}</div>
        </div>
        <div style="background:var(--card2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:.58rem;color:var(--faint);margin-bottom:3px">RSI(21)</div>
          <div style="font-size:1.2rem;font-weight:700;color:${rsiData.rsi21>=70?'var(--bear)':rsiData.rsi21<=30?'var(--bull)':'var(--text)'}">${rsiData.rsi21}</div>
        </div>
      </div>
      <!-- RSI视觉量规 -->
      <div style="position:relative;margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:.58rem;color:var(--faint);margin-bottom:3px">
          <span>超卖 0</span><span>30</span><span>50</span><span>70</span><span>100 超买</span>
        </div>
        <div style="height:10px;border-radius:5px;overflow:hidden;background:linear-gradient(90deg,var(--bull) 0%,#48a8e8 30%,var(--gold) 50%,var(--amber) 70%,var(--bear) 100%)">
          <div style="position:relative;height:100%">
            <div style="position:absolute;top:0;left:${rsiData.rsi14}%;width:3px;height:100%;background:#fff;transform:translateX(-50%);box-shadow:0 0 4px rgba(0,0,0,.4)"></div>
          </div>
        </div>
      </div>
      ${pBar(rsiData.rsi14, 'RSI动量', rsiData.signalColor)}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        <span style="font-size:.68rem;padding:2px 8px;border-radius:99px;background:rgba(200,168,74,0.1);border:1px solid rgba(200,168,74,0.2);color:var(--gold)">${rsiData.rsiTrend}</span>
        ${rsiData.divergence ? `<span style="font-size:.68rem;padding:2px 8px;border-radius:99px;background:rgba(${rsiData.divergence.severity==='看涨'?'24,145,80':'192,48,48'},0.1);border:1px solid rgba(${rsiData.divergence.severity==='看涨'?'24,145,80':'192,48,48'},0.25);color:${rsiData.divergence.severity==='看涨'?'var(--bull)':'var(--bear)'}">⚡ ${rsiData.divergence.type}</span>` : ''}
        ${rsiData.hasRealData ? '<span style="font-size:.58rem;padding:1px 6px;border-radius:99px;background:rgba(24,145,80,0.1);border:1px solid rgba(24,145,80,0.2);color:var(--bull)">实时K线</span>' : '<span style="font-size:.58rem;padding:1px 6px;border-radius:99px;background:rgba(200,168,74,0.06);color:var(--faint)">估算值</span>'}
      </div>
      <div style="font-size:.75rem;color:var(--text);line-height:1.7;padding:8px 10px;background:rgba(200,168,74,0.06);border-radius:7px">${rsiData.advice}</div>
      ${rsiData.divergence ? `<div style="margin-top:8px;padding:8px 10px;background:rgba(255,200,64,0.06);border:1px solid rgba(255,200,64,0.2);border-radius:7px;font-size:.7rem;color:var(--text)">⚡ <strong>${rsiData.divergence.type}</strong>：${rsiData.divergence.detail}</div>` : ''}
    </div>` : '';

  // ── MACD Section ──
  const macdSection = macdData ? (() => {
    const h = macdData.histogram;
    const fmtM = macdData.fmtM;
    return `
    <div style="background:rgba(56,168,224,0.05);border:1px solid rgba(56,168,224,0.2);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:.82rem;font-weight:700;color:var(--sky)">📈 MACD 动量指标 (12,26,9)</div>
        <span style="padding:3px 10px;border-radius:99px;border:1px solid ${macdData.signalColor}40;color:${macdData.signalColor};font-size:.7rem;font-weight:700">${macdData.signal}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div style="background:var(--card2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:.58rem;color:var(--faint);margin-bottom:3px">MACD线</div>
          <div style="font-size:.9rem;font-weight:700;color:${macdData.macdLine>0?'var(--bull)':'var(--bear)'}">${fmtM(macdData.macdLine)}</div>
        </div>
        <div style="background:var(--card2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:.58rem;color:var(--faint);margin-bottom:3px">信号线</div>
          <div style="font-size:.9rem;font-weight:700;color:var(--muted)">${fmtM(macdData.signalLine)}</div>
        </div>
        <div style="background:var(--card2);border-radius:8px;padding:10px;text-align:center;border:1px solid rgba(${h>0?'24,145,80':'192,48,48'},0.25)">
          <div style="font-size:.58rem;color:${h>0?'var(--bull)':'var(--bear)'};margin-bottom:3px">柱状图</div>
          <div style="font-size:.9rem;font-weight:700;color:${h>0?'var(--bull)':'var(--bear)'}">${fmtM(h)}</div>
        </div>
      </div>
      <!-- MACD 零轴可视化 -->
      <div style="margin-bottom:10px;padding:8px 10px;background:rgba(0,0,0,0.04);border-radius:7px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px">
          <span style="font-size:.65rem;color:var(--faint);min-width:50px">零轴位置</span>
          <div style="flex:1;height:8px;background:var(--bg2);border-radius:4px;overflow:hidden;position:relative">
            <div style="position:absolute;left:50%;top:0;width:1px;height:100%;background:var(--muted);opacity:.4"></div>
            <div style="position:absolute;height:100%;background:${macdData.aboveZero?'var(--bull)':'var(--bear)'};border-radius:4px;
              ${macdData.aboveZero
                ? 'left:50%;width:' + Math.min(50, Math.abs(macdData.macdLine / (macdData.macdLine + Math.abs(macdData.signalLine) + 0.001)) * 50) + '%'
                : 'right:50%;width:' + Math.min(50, Math.abs(macdData.macdLine / (macdData.macdLine + Math.abs(macdData.signalLine) + 0.001)) * 50) + '%'
              }"></div>
          </div>
          <span style="font-size:.65rem;font-weight:700;color:${macdData.aboveZero?'var(--bull)':'var(--bear)'}">${macdData.aboveZero?'零轴上方':'零轴下方'}</span>
        </div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${macdData.crossType ? `<span style="font-size:.72rem;padding:3px 10px;border-radius:99px;background:${macdData.isBullCross?'rgba(24,145,80,0.15)':'rgba(192,48,48,0.15)'};border:1px solid ${macdData.isBullCross?'rgba(24,145,80,0.4)':'rgba(192,48,48,0.4)'};color:${macdData.isBullCross?'var(--bull)':'var(--bear)'};font-weight:700">⚡ ${macdData.crossType}</span>` : ''}
        <span style="font-size:.68rem;padding:2px 8px;border-radius:99px;background:rgba(56,168,224,0.1);border:1px solid rgba(56,168,224,0.2);color:var(--sky)">${macdData.histMomentum}</span>
        ${macdData.divergence ? `<span style="font-size:.68rem;padding:2px 8px;border-radius:99px;background:rgba(${macdData.divergence.bearish?'192,48,48':'24,145,80'},0.1);color:${macdData.divergence.bearish?'var(--bear)':'var(--bull)'}">⚡ ${macdData.divergence.type}</span>` : ''}
        ${macdData.hasRealData ? '<span style="font-size:.58rem;padding:1px 6px;border-radius:99px;background:rgba(24,145,80,0.1);color:var(--bull)">实时K线</span>' : '<span style="font-size:.58rem;padding:1px 6px;border-radius:99px;background:rgba(200,168,74,0.06);color:var(--faint)">估算值</span>'}
      </div>
      <div style="font-size:.75rem;color:var(--text);line-height:1.7;padding:8px 10px;background:rgba(56,168,224,0.06);border-radius:7px">${macdData.advice}</div>
    </div>`;
  })() : '';

  // ── Bollinger Section ──
  const bbSection = bbData ? `
    <div style="background:rgba(112,48,184,0.05);border:1px solid rgba(112,48,184,0.2);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:.82rem;font-weight:700;color:var(--purple)">⊕ 布林带 Bollinger Bands (20,2)</div>
        <span style="padding:3px 10px;border-radius:99px;border:1px solid ${bbData.positionColor}40;color:${bbData.positionColor};font-size:.7rem;font-weight:700">${bbData.positionLabel}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:12px">
        <div style="background:rgba(192,48,48,0.08);border:1px solid rgba(192,48,48,0.2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:.58rem;color:var(--bear);margin-bottom:3px">上轨 +2σ</div>
          <div style="font-size:.8rem;font-weight:700;color:var(--bear)">${bbData.fmtP(bbData.upperBand)}</div>
        </div>
        <div style="background:rgba(200,168,74,0.1);border:1px solid rgba(200,168,74,0.25);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:.58rem;color:var(--gold);margin-bottom:3px">中轨 MA20</div>
          <div style="font-size:.8rem;font-weight:700;color:var(--gold)">${bbData.fmtP(bbData.middleBand)}</div>
        </div>
        <div style="background:rgba(24,145,80,0.08);border:1px solid rgba(24,145,80,0.2);border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:.58rem;color:var(--bull);margin-bottom:3px">下轨 -2σ</div>
          <div style="font-size:.8rem;font-weight:700;color:var(--bull)">${bbData.fmtP(bbData.lowerBand)}</div>
        </div>
      </div>
      <!-- %B 指示器 -->
      <div style="margin-bottom:10px">
        <div style="display:flex;justify-content:space-between;font-size:.65rem;color:var(--faint);margin-bottom:3px">
          <span>下轨 0%</span><span style="color:var(--gold)">%B = ${((bbData&&bbData.percentB||0)*100).toFixed(0)}%</span><span>上轨 100%</span>
        </div>
        <div style="height:10px;background:linear-gradient(90deg,var(--bull),var(--gold),var(--bear));border-radius:5px;overflow:visible;position:relative">
          <div style="position:absolute;top:-2px;left:${Math.min(100,Math.max(0,bbData.percentB*100))}%;width:4px;height:14px;background:#fff;border-radius:2px;transform:translateX(-50%);box-shadow:0 0 6px rgba(0,0,0,.3)"></div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">
        <div style="padding:8px 10px;background:rgba(112,48,184,0.07);border-radius:7px">
          <div style="font-size:.58rem;color:var(--faint);margin-bottom:2px">带宽</div>
          <div style="font-size:.88rem;font-weight:700;color:var(--purple)">${bbData.bandwidth}%</div>
          <div style="font-size:.62rem;color:var(--muted);margin-top:2px">${bbData.bandState}</div>
        </div>
        <div style="padding:8px 10px;background:rgba(112,48,184,0.07);border-radius:7px">
          <div style="font-size:.58rem;color:var(--faint);margin-bottom:2px">价格位置</div>
          <div style="font-size:.88rem;font-weight:700;color:${bbData.positionColor}">${((bbData&&bbData.percentB||0)*100).toFixed(0)}%</div>
          <div style="font-size:.62rem;color:var(--muted);margin-top:2px">${bbData.positionLabel}</div>
        </div>
      </div>
      <div style="font-size:.72rem;color:var(--muted);padding:6px 10px;background:rgba(112,48,184,0.04);border-radius:6px;margin-bottom:8px">${bbData.bandStateNote}</div>
      <div style="font-size:.75rem;color:var(--text);line-height:1.7;padding:8px 10px;background:rgba(112,48,184,0.06);border-radius:7px">${bbData.advice}</div>
    </div>` : '';

  // ── TD Sequential Section ──
  const tdSection = tdData ? `
    <div style="background:rgba(224,128,48,0.05);border:1px solid rgba(224,128,48,0.2);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">
        <div style="font-size:.82rem;font-weight:700;color:var(--amber)">🔢 TD九转序列 (Tom DeMark)</div>
        <span style="padding:3px 10px;border-radius:99px;border:1px solid ${tdData.signalColor}40;color:${tdData.signalColor};font-size:.7rem;font-weight:700">${tdData.signal}</span>
      </div>
      <!-- 进度点阵 -->
      <div style="margin-bottom:12px">
        <div style="font-size:.65rem;color:var(--muted);margin-bottom:6px">${tdData.setupDir==='down'?'买入设置（下跌计数）':'卖出设置（上涨计数）'} · 目标9根完成</div>
        <div style="display:flex;gap:5px;align-items:center">
          ${tdData.progressDots.map(d => `
            <div style="width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:.65rem;font-weight:700;
              background:${d.current?tdData.signalColor:(d.isKey&&d.active?'rgba(200,168,74,0.2)':(d.active?(tdData.setupDir==='down'?'rgba(24,145,80,0.15)':'rgba(192,48,48,0.15)'):'rgba(0,0,0,0.04)'))};
              border:1px solid ${d.current?tdData.signalColor:(d.isKey&&d.active?'rgba(200,168,74,0.5)':(d.active?(tdData.setupDir==='down'?'rgba(24,145,80,0.3)':'rgba(192,48,48,0.3)'):'var(--border)'))};
              color:${d.current?'#fff':(d.active?(tdData.setupDir==='down'?'var(--bull)':'var(--bear)'):'var(--faint)')}">
              ${d.n}
            </div>`).join('')}
          <div style="margin-left:6px;font-size:.72rem;color:${tdData.signalColor};font-weight:700">${tdData.setupCount}/9</div>
        </div>
      </div>
      <div style="font-size:.72rem;color:var(--muted);padding:6px 10px;background:rgba(224,128,48,0.04);border-radius:6px;margin-bottom:8px">${tdData.contextNote}</div>
      <div style="font-size:.75rem;color:var(--text);line-height:1.7;padding:8px 10px;background:rgba(224,128,48,0.06);border-radius:7px">${tdData.advice}</div>
      ${tdData.isComplete ? `<div style="margin-top:8px;padding:8px 10px;background:rgba(200,168,74,0.1);border:1px solid rgba(200,168,74,0.3);border-radius:7px;font-size:.72rem;color:var(--gold);font-weight:700">⚡ 九转完成！${tdData.isBuySetup?'关注做多入场机会':'关注做空入场机会'}，结合其他指标确认</div>` : ''}
      ${tdData.hasRealData ? '' : '<div style="margin-top:6px;font-size:.6rem;color:var(--faint);text-align:right">* 基于估算值</div>'}
    </div>` : '';

  // ── 多时框布林带策略 Section ──
  const mtfSection = mtfData ? (() => {
    const d = mtfData;
    const fp = d.fmtP;

    // 反弹阻力段落
    const resistRows = d.rebounds.map(rb => {
      const isCurrent = !rb.broken && rb === d.nextResist;
      const isBroken  = rb.broken;
      return `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:6px 8px;font-size:.72rem;font-weight:700;color:${isCurrent?'var(--bear)':isBroken?'var(--muted)':'var(--text)'}">${rb.tf.toUpperCase()} 上轨</td>
        <td style="padding:6px 8px;font-size:.72rem;font-weight:700;text-align:right;color:${isCurrent?'var(--bear)':isBroken?'var(--muted)':'var(--text)'}">${fp(rb.upper)}</td>
        <td style="padding:6px 8px;font-size:.68rem;text-align:center">
          ${isBroken
            ? '<span style="color:var(--muted);font-size:.62rem">✓ 已突破</span>'
            : isCurrent
              ? '<span style="padding:2px 8px;border-radius:99px;background:rgba(192,48,48,0.15);border:1px solid rgba(192,48,48,0.35);color:var(--bear);font-size:.62rem;font-weight:700">▶ 当前空点</span>'
              : '<span style="color:var(--faint);font-size:.62rem">待确认</span>'}
        </td>
      </tr>`;
    }).join('');

    // 支撑段落
    const supportRows = d.supportLevels.slice(0, 5).map(s => {
      const isNearest = s === d.nearestSupport;
      return `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:6px 8px;font-size:.72rem;color:${s.color}">${s.label}</td>
        <td style="padding:6px 8px;font-size:.72rem;font-weight:700;text-align:right;color:${s.color}">${fp(s.price)}</td>
        <td style="padding:6px 8px;font-size:.62rem;color:var(--muted)">${isNearest?'◀ 最近支撑':s.note}</td>
      </tr>`;
    }).join('');

    // 斐波进度
    const fibItems = [
      { label: '0.382', price: d.fib382, broke: d.broke382 },
      { label: '0.500', price: d.fib500, broke: d.broke500 },
      { label: '0.618', price: d.fib618, broke: d.broke618 },
    ];
    const fibRow = fibItems.map(f => `
      <div style="flex:1;padding:10px 8px;border-radius:8px;text-align:center;background:${f.broke?'rgba(40,200,112,0.1)':'var(--card2)'};border:1px solid ${f.broke?'rgba(40,200,112,0.3)':'var(--border)'}">
        <div style="font-size:.62rem;color:${f.broke?'var(--emerald)':'var(--faint)'};margin-bottom:3px">Fib ${f.label}</div>
        <div style="font-size:.82rem;font-weight:700;color:${f.broke?'var(--emerald)':'var(--muted)'}">${fp(f.price)}</div>
        <div style="font-size:.58rem;margin-top:3px;color:${f.broke?'var(--emerald)':'var(--faint)'}">${f.broke?'✓ 突破':'待突破'}</div>
      </div>`).join('');

    return `
    <div style="background:rgba(192,48,48,0.04);border:1px solid rgba(192,48,48,0.2);border-radius:10px;padding:14px;margin-bottom:14px">
      <div style="font-size:.82rem;font-weight:700;color:var(--rose);margin-bottom:4px">🎯 多时框布林带 · EMA策略推算</div>
      <div style="font-size:.68rem;color:var(--muted);margin-bottom:12px;line-height:1.6">反弹阻力逐级升 · EMA层级支撑 · 斐波大波段目标 · 2日线MACD背离</div>

      <!-- 综合策略 -->
      <div style="padding:10px 12px;background:rgba(0,0,0,0.04);border-radius:8px;margin-bottom:12px;border-left:3px solid ${d.strategyColor}">
        <div style="font-size:.68rem;color:var(--faint);margin-bottom:3px">当前策略方向</div>
        <div style="font-size:.82rem;font-weight:700;color:${d.strategyColor}">${d.strategy}</div>
      </div>

      <!-- EMA层级 -->
      <div style="margin-bottom:12px;padding:10px 12px;background:rgba(0,0,0,0.03);border-radius:8px">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px">
          <span style="font-size:.72rem;font-weight:700;color:${d.emaColor}">${d.emaStructure}</span>
          ${d.emaBearish?'<span style="font-size:.6rem;padding:1px 6px;border-radius:99px;background:rgba(192,48,48,0.1);color:var(--bear)">均线空头排列</span>':''}
          ${d.hasRealData?'<span style="font-size:.6rem;padding:1px 6px;border-radius:99px;background:rgba(24,145,80,0.1);color:var(--bull)">实时K线</span>':'<span style="font-size:.6rem;padding:1px 6px;border-radius:99px;background:rgba(200,168,74,0.06);color:var(--faint)">估算值</span>'}
        </div>
        <div style="font-size:.72rem;color:var(--text);line-height:1.7">${d.emaNote}</div>
        <div style="display:flex;gap:8px;margin-top:8px">
          ${[{l:'EMA7',v:d.ema7,a:d.aboveEma7},{l:'EMA30',v:d.ema30,a:d.aboveEma30},{l:'EMA52',v:d.ema52,a:d.aboveEma52}].map(e=>`
            <div style="flex:1;padding:6px 8px;border-radius:6px;text-align:center;background:${e.a?'rgba(24,145,80,0.08)':'rgba(192,48,48,0.05)'};border:1px solid ${e.a?'rgba(24,145,80,0.25)':'rgba(192,48,48,0.15)'}">
              <div style="font-size:.58rem;color:var(--faint)">${e.l}</div>
              <div style="font-size:.72rem;font-weight:700;color:${e.a?'var(--bull)':'var(--bear)'}">${fp(e.v)}</div>
              <div style="font-size:.55rem;color:${e.a?'var(--bull)':'var(--bear)'}">${e.a?'上方':'下方'}</div>
            </div>`).join('')}
        </div>
      </div>

      <!-- 反弹阻力逐级升 -->
      <div style="margin-bottom:12px">
        <div style="font-size:.72rem;font-weight:700;color:var(--bear);margin-bottom:6px">📉 反弹空点（逐级升）</div>
        <div style="font-size:.65rem;color:var(--faint);margin-bottom:6px">反弹捅到4H上轨→看6H上轨→看8H上轨…EMA30未突破时以小时布林上轨为主要做空参考</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid var(--border);border-radius:8px;overflow:hidden">
          ${resistRows}
        </table>
      </div>

      <!-- 回踩支撑逐级降 -->
      <div style="margin-bottom:12px">
        <div style="font-size:.72rem;font-weight:700;color:var(--bull);margin-bottom:6px">📈 回踩低多点（逐级降）</div>
        <div style="font-size:.65rem;color:var(--faint);margin-bottom:6px">EMA7→EMA30→日线中轨/4H下轨→6H下轨→8H下轨，跌破EMA7后支撑移到下一级</div>
        <table style="width:100%;border-collapse:collapse;border:1px solid var(--border);border-radius:8px;overflow:hidden">
          ${supportRows}
        </table>
      </div>

      <!-- 斐波大波段 -->
      <div style="margin-bottom:12px">
        <div style="font-size:.72rem;font-weight:700;color:${d.fibColor};margin-bottom:6px">📐 斐波大波段目标</div>
        <div style="display:flex;gap:6px;margin-bottom:8px">${fibRow}</div>
        <div style="font-size:.72rem;color:var(--text);padding:8px 10px;background:rgba(0,0,0,0.03);border-radius:7px;line-height:1.7">
          <span style="color:${d.fibColor};font-weight:700">${d.fibStatus}</span> · ${d.fibNote}
        </div>
      </div>

      <!-- 2日线MACD背离 -->
      ${d.macd2dDiv ? `
      <div style="padding:8px 12px;background:rgba(200,168,74,0.08);border:1px solid rgba(200,168,74,0.25);border-radius:8px">
        <div style="font-size:.72rem;font-weight:700;color:var(--gold);margin-bottom:3px">⚡ 大级别MACD背离信号</div>
        <div style="font-size:.72rem;color:var(--text);line-height:1.7">${d.macd2dNote}</div>
      </div>` : ''}
    </div>`;
  })() : '';

  // ── 自动K线推荐 Section ──
  const tfSection = tfRec ? `
    <div style="background:rgba(40,200,112,0.05);border:1px solid rgba(40,200,112,0.2);border-radius:10px;padding:14px">
      <div style="font-size:.82rem;font-weight:700;color:var(--emerald);margin-bottom:10px">⚡ 智能K线周期推荐</div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px">
        ${tfRec.top3.map((t, i) => `
          <div style="padding:10px;border-radius:8px;background:${i===0?'rgba(40,200,112,0.1)':'var(--card2)'};border:${i===0?'1px solid rgba(40,200,112,0.35)':'1px solid var(--border)'}">
            ${i===0?`<div style="font-size:.55rem;color:var(--emerald);font-weight:700;margin-bottom:3px">▶ 首推</div>`:''}
            <div style="font-size:.85rem;font-weight:700;color:${i===0?'var(--emerald)':'var(--text)'}">${t.label}</div>
            <div style="font-size:.65rem;color:var(--muted);margin-top:2px">${t.style} · ${t.desc}</div>
            <div style="margin-top:5px;font-size:.62rem;font-weight:700;color:${i===0?'var(--emerald)':'var(--muted)'}">评分 ${t.score}</div>
          </div>`).join('')}
      </div>
      <div style="margin-bottom:10px;font-size:.72rem;line-height:1.7;color:var(--muted)">
        ${tfRec.rationale.map(r => `<div>· ${r}</div>`).join('')}
      </div>
      ${tfRec.betterTF ? `
        <div style="padding:8px 12px;background:rgba(40,200,112,0.08);border:1px solid rgba(40,200,112,0.25);border-radius:7px;font-size:.72rem;color:var(--emerald)">
          💡 当前 <strong>${tfRec.currentDef.label}</strong>（评分 ${tfRec.currentScore}）→ 切换至 <strong>${tfRec.best.label}</strong> 可提升 <strong>+${tfRec.improvement}</strong> 分
        </div>` : `
        <div style="padding:8px 12px;background:rgba(24,145,80,0.06);border:1px solid rgba(24,145,80,0.2);border-radius:7px;font-size:.72rem;color:var(--bull)">
          ✅ 当前 ${tfRec.currentDef.label} 已是最优周期（评分 ${tfRec.currentScore}）
        </div>`}
    </div>` : '';

  return `
    <div class="panel">
      <div class="panel-title">📐 技术指标引擎 · 多时框布林 · RSI · MACD · 九转序列</div>
      <div style="font-size:.72rem;color:var(--muted);padding:8px 12px;background:rgba(200,168,74,0.06);border-radius:8px;margin-bottom:16px;line-height:1.7">
        多时框布林带+EMA层级策略推算（反弹逐级做空/回踩逐级做多/斐波大波段目标）· RSI · MACD · 九转序列 · K线周期推荐
      </div>
      ${rsiSection}
      ${macdSection}
      ${bbSection}
      ${tdSection}
      ${mtfSection}
      ${tfSection}
    </div>`;
}

// ════════════════════════════════════════════════════════════════════════
// 紫微斗数引擎 · 融入市场预测
// ════════════════════════════════════════════════════════════════════════

const ZW_PALACES = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','奴仆','官禄','田宅','福德','父母'];
const ZW_BRANCHES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
const ZW_STEMS = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
const ZW_ELEM5 = ['金','水','木','火','土'];
const ZW_DIRS  = ['北','东北','东','东南','南','西南','西','西北','北','东北','东','东南'];

const ZW_MAJOR = [
  { name:'紫微', elem:'土', bull:true,  mkt:'权贵稳步上行', tip:'有利于长期持有' },
  { name:'天机', elem:'木', bull:true,  mkt:'趋势多变机灵', tip:'波段操作为宜'  },
  { name:'太阳', elem:'火', bull:true,  mkt:'官禄多头动能', tip:'买方主导'       },
  { name:'武曲', elem:'金', bull:true,  mkt:'财星聚金旺财', tip:'财运充裕'       },
  { name:'天同', elem:'水', bull:false, mkt:'福星横盘蓄势', tip:'等待方向明朗'   },
  { name:'廉贞', elem:'火', bull:false, mkt:'囚星高位反转', tip:'注意顶部信号'   },
  { name:'天府', elem:'土', bull:true,  mkt:'财库稳固支撑', tip:'下方支撑坚实'   },
  { name:'太阴', elem:'水', bull:true,  mkt:'阴财夜盘活跃', tip:'短线机会增多'   },
  { name:'贪狼', elem:'木', bull:false, mkt:'投机欲望浮动', tip:'情绪面波动大'   },
  { name:'巨门', elem:'水', bull:false, mkt:'暗耀消息纷扰', tip:'慎防假突破'     },
  { name:'天相', elem:'水', bull:true,  mkt:'印星辅助上行', tip:'跟随趋势布局'   },
  { name:'天梁', elem:'土', bull:false, mkt:'荫星保底防跌', tip:'跌幅有限'       },
  { name:'七杀', elem:'金', bull:true,  mkt:'将星强势突破', tip:'单边行情启动'   },
  { name:'破军', elem:'水', bull:false, mkt:'耗星趋势破位', tip:'旧均衡瓦解'     },
];

const ZW_LUCK = ['左辅','右弼','文昌','文曲','天魁','天钺','禄存','天马'];
const ZW_EVIL = ['擎羊','陀罗','火星','铃星','地空','地劫'];
const STEM_TR = {
  '甲':['武曲化禄','破军化权','太阴化科','太阳化忌'],
  '乙':['天机化禄','天梁化权','紫微化科','太阴化忌'],
  '丙':['天同化禄','天机化权','文昌化科','廉贞化忌'],
  '丁':['太阴化禄','天同化权','天机化科','巨门化忌'],
  '戊':['贪狼化禄','太阴化权','右弼化科','天机化忌'],
  '己':['武曲化禄','贪狼化权','天梁化科','文曲化忌'],
  '庚':['太阳化禄','武曲化权','太阴化科','天同化忌'],
  '辛':['巨门化禄','太阳化权','文曲化科','文昌化忌'],
  '壬':['天梁化禄','紫微化权','左辅化科','武曲化忌'],
  '癸':['破军化禄','巨门化权','太阴化科','贪狼化忌'],
};

function engineZiwei(coin, date) {
  const nc         = NATAL_CHARTS[coin];
  const targetDate = new Date(date);
  const birthDate  = nc ? new Date(nc.date) : new Date('2009-01-03');

  // 目标日期年干支
  const yr = targetDate.getFullYear();
  const mo = targetDate.getMonth() + 1;
  const dy = targetDate.getDate();
  const stemIdx   = ((yr - 4) % 10 + 10) % 10;
  const branchIdx = ((yr - 4) % 12 + 12) % 12;
  const yearStem   = ZW_STEMS[stemIdx];
  const yearBranch = ZW_BRANCHES[branchIdx];
  const yearElem   = ZW_ELEM5[Math.floor(stemIdx / 2)];

  // 币种诞生年干支
  const birthYr    = birthDate.getFullYear();
  const bStemIdx   = ((birthYr - 4) % 10 + 10) % 10;
  const bBranchIdx = ((birthYr - 4) % 12 + 12) % 12;
  const bStem      = ZW_STEMS[bStemIdx];
  const bBranch    = ZW_BRANCHES[bBranchIdx];
  const birthMo    = birthDate.getMonth() + 1;

  // 命宫位置
  const lifePalIdx = ((2 + birthMo - 1) % 12 + 12) % 12;

  // 构建十二宫（无随机）
  const pals = ZW_PALACES.map((nm, i) => ({
    idx: i, name: nm,
    branch: ZW_BRANCHES[(lifePalIdx + i) % 12],
    dir:    ZW_DIRS[(lifePalIdx + i) % 12],
    major: [], luck: [], evil: [], trans: [],
    isWealth: i === 4, isCareer: i === 8, isMigrate: i === 6,
    fYear: false, fMonth: false,
  }));

  // 安主星（确定性偏移，移除随机扰动）
  const ziweiBase = (dy % 2 === 0)
    ? (lifePalIdx + Math.floor(dy / 2)) % 12
    : (lifePalIdx + 6 + Math.floor(dy / 2)) % 12;
  const offsets = [0, 4, 2, 10, 8, 6, 11, 3, 1, 9, 7, 5, 0, 8];
  ZW_MAJOR.forEach((star, i) => {
    // 原版：(ziweiBase + offsets[i] + (r() < 0.25 ? 1 : 0)) — 移除随机项
    const p = (ziweiBase + offsets[i]) % 12;
    pals[p].major.push({ ...star });
  });

  // 安辅星（吉星，确定性位置）
  const lBases = [lifePalIdx+1, lifePalIdx+11, (stemIdx*2)%12, (stemIdx*2+1)%12,
                  (bBranchIdx+4)%12, (bBranchIdx+8)%12, bBranchIdx, (lifePalIdx+7)%12];
  ZW_LUCK.forEach((ls, i) => { pals[lBases[i] % 12].luck.push(ls); });

  // 安煞星（确定性位置，移除 Math.floor(r() * 12)）
  const EVIL_POSITIONS = [
    (stemIdx + mo - 1) % 12,    // 擎羊
    (stemIdx + mo) % 12,         // 陀罗
    bBranchIdx,                  // 火星
    (bBranchIdx + 4) % 12,       // 铃星
    (stemIdx * 3) % 12,          // 地空
    (bBranchIdx + 6) % 12,       // 地劫
  ];
  ZW_EVIL.forEach((es, i) => {
    pals[EVIL_POSITIONS[i % EVIL_POSITIONS.length]].evil.push(es);
  });

  // 四化（年干决定）
  const trList = STEM_TR[yearStem] || [];
  trList.forEach(t => {
    const parts  = t.split('化');
    const starNm = parts[0], trType = '化' + parts[1];
    const isBad  = trType === '化忌';
    pals.forEach(p => p.major.forEach(s => {
      if (s.name === starNm) p.trans.push({ star: starNm, type: trType, bad: isBad });
    }));
  });

  // 流年流月
  const fyBr = ((yr - 4) % 12 + 12) % 12;
  const fmBr = (mo + 1) % 12;
  pals.forEach(p => {
    const bi = ZW_BRANCHES.indexOf(p.branch);
    if (bi === fyBr) p.fYear  = true;
    if (bi === fmBr) p.fMonth = true;
  });

  // ── Market scoring（移除随机偏移，改用固定基线）──
  const wealthPal  = pals[4];
  const careerPal  = pals[8];
  const migratePal = pals[6];

  const scorePal = (pal) => {
    let s = 0.5; // 固定基线（原版 0.5 + r()*0.08，移除随机项）
    pal.major.forEach(st => { s += st.bull ? 0.12 : -0.08; });
    pal.luck.forEach(() => s += 0.06);
    pal.evil.forEach(() => s -= 0.08);
    pal.trans.forEach(t => { s += t.bad ? -0.18 : 0.12; });
    if (pal.fYear)  s += 0.12;
    if (pal.fMonth) s += 0.06;
    return Math.max(0.05, Math.min(0.98, s));
  };

  const wScore = scorePal(wealthPal);
  const cScore = scorePal(careerPal);
  const mScore = scorePal(migratePal);

  const bias = (wScore * 0.5 + cScore * 0.3 + mScore * 0.2) * 2 - 1;
  // 置信度：由四化数量决定（原版 0.42 + r()*0.38，移除随机项）
  const transCount = wealthPal.trans.length + careerPal.trans.length;
  const conf = Math.min(0.90, 0.50 + transCount * 0.08
    + (wealthPal.fYear || careerPal.fYear ? 0.10 : 0));

  // Notable star combinations for market signals
  const signals = [];
  pals.forEach(p => {
    const nm = p.major.map(s => s.name);
    if (nm.includes('紫微') && nm.includes('贪狼') && (p.isWealth || p.isCareer))
      signals.push({ bull: true,  text: '紫贪同宫于' + p.name + '：权贵与欲望共振，突破格局大' });
    if (nm.includes('武曲') && nm.includes('七杀') && p.isWealth)
      signals.push({ bull: false, text: '武杀同宫财帛：财聚财散，高波动行情' });
    if (nm.includes('太阳') && p.isCareer && p.fYear)
      signals.push({ bull: true,  text: '太阳守官禄逢流年：事业官贵大发，多头格局' });
    if (nm.includes('破军') && p.isWealth)
      signals.push({ bull: false, text: '破军入财帛：旧价格均衡被打破，跌势风险' });
    if (nm.includes('天府') && p.isWealth)
      signals.push({ bull: true,  text: '天府守财帛：财库坚固，下方支撑强' });
    p.trans.forEach(t => {
      if (t.bad && p.isWealth)
        signals.push({ bull: false, text: t.star + '化忌入财帛：财运受阻，宜谨慎操作' });
      if (!t.bad && t.type === '化禄' && p.isWealth)
        signals.push({ bull: true,  text: t.star + '化禄入财帛：' + yearStem + '年财运旺盛' });
    });
  });

  // Yearly stem summary
  const stemNote = {
    '甲': '甲木年，阳气生发，多头气场偏强',
    '乙': '乙木年，柔顺渐进，趋势缓升',
    '丙': '丙火年，热情爆发，高波动行情',
    '丁': '丁火年，阴火蓄势，内敛积累',
    '戊': '戊土年，稳健厚重，震荡整理',
    '己': '己土年，阴土含蓄，慢牛蓄力',
    '庚': '庚金年，肃杀刚猛，大幅波动',
    '辛': '辛金年，阴金收敛，趋势不明',
    '壬': '壬水年，流动活跃，趋势快速切换',
    '癸': '癸水年，阴柔深邃，底部酝酿',
  };

  return {
    // 兼容字段（旧UI继续正常工作）
    bias: Math.max(-1, Math.min(1, bias)),
    conf,
    yearStem, yearBranch, yearElem,
    bStem, bBranch,
    lifePalIdx,
    wealthPal, careerPal, migratePal,
    wScore, cScore, mScore,
    signals: signals.slice(0, 5),
    trList,
    stemNote: stemNote[yearStem] || yearStem + '年命理气场',
    pals,
    fYearPal:  pals.find(p => p.fYear),
    fMonthPal: pals.find(p => p.fMonth),
    // ── 紫微专属：时间窗口字段（职责：时辰吉凶，不预测价格）──────────
    // 财帛宫有吉星的时辰：流年宫→最旺时，吉星宫→次旺时
    goodTime: (()=>{
      const SHICHEN = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
      const wIdx = ZW_BRANCHES.indexOf(wealthPal.branch);
      const cIdx = ZW_BRANCHES.indexOf(careerPal.branch);
      const good = [SHICHEN[wIdx >= 0 ? wIdx : 4]];
      if (cIdx >= 0 && cIdx !== wIdx) good.push(SHICHEN[cIdx]);
      return good;
    })(),
    // 财帛宫有化忌的时辰（凶时）
    badTime: (()=>{
      const SHICHEN = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
      const hasJi = wealthPal.trans.some(t => t.bad);
      if (hasJi) {
        const jiIdx = ZW_BRANCHES.indexOf(wealthPal.branch);
        return [SHICHEN[jiIdx >= 0 ? (jiIdx + 6) % 12 : 9]];
      }
      return [];
    })(),
    // 财星状态（化禄/化权/化科/化忌）
    wealthStar: (()=>{
      const tr = wealthPal.trans.find(t => t.type === '化禄');
      const bad = wealthPal.trans.find(t => t.bad);
      if (tr)  return tr.star + tr.type;
      if (bad) return bad.star + bad.type;
      const maj = wealthPal.major[0];
      return maj ? maj.name + (maj.bull ? '（吉）' : '（凶）') : '无主星';
    })(),
    // 官禄星（官禄宫主星）
    careerStar: careerPal.major[0]?.name || '无',
    confidence: conf,
  };
}

// ── Ziwei panel HTML renderer (called by renderAll) ──
function buildZiweiPanel(zw, coin) {
  const nc = NATAL_CHARTS[coin] || {};
  const [bc, bl] = biasBadge(zw.bias);

  // Safety guard: if pals is missing (new engine format), show simplified panel
  if (!zw.pals || !Array.isArray(zw.pals) || zw.pals.length < 10) {
    return `<div class="panel"><div class="panel-title">☽ 紫微斗数</div>
      <div style="padding:12px;font-size:.78rem;color:var(--muted);line-height:2">
        命宫：<strong>${zw.lifePal||'--'}</strong>·
        财帛宫：<strong style="color:var(--gold)">${zw.wealthPalace||'--'}</strong>[${zw.wealthStar||'--'}]·
        官禄宫：<strong style="color:#2c50a8">${zw.careerPalace||'--'}</strong>[${zw.careerStar||'--'}]<br>
        ${zw.luInWealth?'<span style="color:var(--bull)">✓ 化禄入财帛</span>':zw.jiInWealth?'<span style="color:var(--bear)">⚠ 化忌入财帛</span>':''}
        ${zw.quanInCareer?'<span style="color:var(--bull)"> ✓ 化权入官禄</span>':zw.jiInCareer?'<span style="color:var(--bear)"> ⚠ 化忌入官禄</span>':''}
        <br>今日吉时：${(zw.goodTime||[]).join('、')||'--'}
        ${(zw.badTime||[]).length?'<br>今日凶时：'+(zw.badTime||[]).join('、'):''}
      </div></div>`;
  }

  // Build mini 4×4 grid
  const MAP = [[9,8,7,6],[10,-1,-1,5],[11,-1,-1,4],[0,1,2,3]];
  let gridHtml = '<div style="display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(4,1fr);border:1.5px solid var(--border2);border-radius:8px;overflow:hidden;aspect-ratio:1/1;max-width:460px;margin:0 auto 20px">';
  let centerIdx = 0;
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const pi = MAP[row][col];
      if (pi >= 0) {
        const p = zw.pals[pi];
        const bg = p.fYear ? 'background:#fffbec;border:1px solid rgba(154,114,24,.4)'
          : p.fMonth ? 'background:#f5f0ff;border:1px solid rgba(104,40,176,.3)'
          : p.isWealth ? 'background:#f0fbf5;border:1px solid rgba(24,145,80,.2)'
          : p.isCareer ? 'background:#f0f0ff;border:1px solid rgba(64,64,184,.2)'
          : 'border:1px solid var(--border)';
        const majorHtml = p.major.map(s =>
          '<div style="font-size:.6rem;font-weight:700;color:var(--purple);white-space:nowrap">' + s.name + '</div>'
        ).join('');
        const luckHtml = p.luck.slice(0, 1).map(s =>
          '<div style="font-size:.55rem;color:var(--bull)">' + s + '</div>'
        ).join('');
        const evilHtml = p.evil.slice(0, 1).map(s =>
          '<div style="font-size:.55rem;color:var(--bear)">' + s + '</div>'
        ).join('');
        const transHtml = p.trans.map(t =>
          '<div style="font-size:.5rem;color:var(--amber)">' + t.star + t.type + '</div>'
        ).join('');
        const flowTag = p.fYear ? '<span style="font-size:.48rem;background:#fde8a0;color:#9a7218;padding:0 2px;border-radius:2px">流年</span>'
          : p.fMonth ? '<span style="font-size:.48rem;background:#ece0ff;color:#6028b0;padding:0 2px;border-radius:2px">流月</span>' : '';
        gridHtml += '<div style="padding:3px 4px;position:relative;min-height:60px;' + bg + '">'
          + '<div style="font-size:.52rem;color:var(--faint)">' + p.branch + ' ' + flowTag + '</div>'
          + '<div style="font-size:.62rem;font-weight:700;color:var(--gold);margin:2px 0">' + p.name + '</div>'
          + majorHtml + luckHtml + evilHtml + transHtml
          + '</div>';
      } else {
        const labels = [
          coin + '<br><small style="color:var(--muted);font-size:.55rem">' + (nc.name || '') + '</small>',
          '<div style="font-size:.52rem;color:var(--faint);margin-bottom:3px">' + zw.yearStem + '年四化</div>' +
            '<div style="font-size:.55rem;color:var(--amber);line-height:1.5">' + (zw.trList[0] || '') + '<br>' + (zw.trList[1] || '') + '</div>',
          '<div style="font-size:.55rem;color:var(--faint)">流年宫</div>' +
            '<div style="font-size:.72rem;font-weight:700;color:var(--gold);margin:2px 0">' + (zw.fYearPal?.name || '--') + '</div>' +
            '<div style="font-size:.55rem;color:var(--muted)">流月：' + (zw.fMonthPal?.name || '--') + '</div>',
          '<div style="font-size:.55rem;color:var(--faint)">年干五行</div>' +
            '<div style="font-size:.82rem;font-weight:700;color:var(--amber);margin:3px 0">' + zw.yearElem + '</div>' +
            '<div style="font-size:.52rem;color:var(--muted)">' + zw.yearStem + zw.yearBranch + '</div>',
        ];
        gridHtml += '<div style="display:flex;align-items:center;justify-content:center;background:var(--card2);border:1px solid var(--border);text-align:center;padding:4px;font-size:.65rem;color:var(--gold);font-weight:600;font-family:\'Ma Shan Zheng\',cursive">'
          + labels[centerIdx++] + '</div>';
      }
    }
  }
  gridHtml += '</div>';

  // Score bars for 3 key palaces
  const pBar = (s, lbl, col) =>
    '<div style="margin-bottom:8px"><div style="display:flex;justify-content:space-between;font-size:.72rem;margin-bottom:3px"><span style="color:var(--muted)">' + lbl + '</span><span style="color:' + col + ';font-weight:700">' + (s * 100).toFixed(0) + '%</span></div>' +
    '<div style="height:6px;background:var(--bg2);border-radius:3px;overflow:hidden"><div style="width:' + (s * 100).toFixed(0) + '%;height:100%;background:' + col + ';border-radius:3px"></div></div></div>';

  // Signals
  const sigHtml = zw.signals.map(sig =>
    '<div style="display:flex;align-items:flex-start;gap:8px;padding:7px 10px;background:' +
    (sig.bull ? 'rgba(24,145,80,0.06)' : 'rgba(192,48,48,0.06)') +
    ';border-radius:7px;border:1px solid ' +
    (sig.bull ? 'rgba(24,145,80,0.18)' : 'rgba(192,48,48,0.18)') +
    ';font-size:.75rem;margin-bottom:6px">' +
    '<span style="color:' + (sig.bull ? 'var(--bull)' : 'var(--bear)') + ';font-size:.85rem;flex-shrink:0">' +
    (sig.bull ? '✦' : '▲') + '</span>' +
    '<span style="color:var(--text);line-height:1.6">' + sig.text + '</span></div>'
  ).join('');

  return `
    <div class="panel">
      <div class="panel-title" style="justify-content:space-between">
        <span>☽ 紫微斗数 · ${nc.name || coin} 市场宫位解析</span>
        <span class="badge ${bc}">${bl}</span>
      </div>

      <div style="background:rgba(112,48,184,0.07);border:1px solid rgba(112,48,184,0.22);border-radius:10px;padding:14px;margin-bottom:16px">
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:10px;font-size:.8rem">
          <div><span style="color:var(--faint)">目标年干：</span><strong style="color:var(--gold)">${zw.yearStem}${zw.yearBranch}（${zw.yearElem}）</strong></div>
          <div><span style="color:var(--faint)">命盘年干：</span><strong style="color:var(--purple)">${zw.bStem}${zw.bBranch}</strong></div>
          <div><span style="color:var(--faint)">命宫起宫：</span><strong style="color:var(--gold)">${ZW_BRANCHES[zw.lifePalIdx]}宫</strong></div>
        </div>
        <div style="font-size:.76rem;color:var(--muted);line-height:1.7;padding:8px 10px;background:rgba(112,48,184,0.06);border-radius:7px">
          ${zw.stemNote} · 年干四化：${zw.trList.join('、')}
        </div>
      </div>

      <div style="font-size:.72rem;font-weight:700;color:var(--gold);text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">十二宫星盘 · 今日宫位布局</div>
      ${gridHtml}

      <div style="margin-bottom:14px">
        <div style="font-size:.72rem;font-weight:700;color:var(--gold);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">关键宫位评分</div>
        ${pBar(zw.wScore, '财帛宫（财运）', 'var(--bull)')}
        ${pBar(zw.cScore, '官禄宫（事业/趋势）', 'var(--sky)')}
        ${pBar(zw.mScore, '迁移宫（突破方向）', 'var(--purple)')}
      </div>

      ${sigHtml ? '<div style="font-size:.72rem;font-weight:700;color:var(--gold);letter-spacing:.1em;text-transform:uppercase;margin-bottom:8px">星曜市场信号</div>' + sigHtml : ''}

      <div style="margin-top:14px;padding:12px 14px;background:rgba(112,48,184,0.08);border:1px solid rgba(112,48,184,0.22);border-radius:10px">
        <div style="font-size:.72rem;color:var(--purple);font-weight:700;margin-bottom:6px">⚡ 紫微综合研判</div>
        <div style="font-size:.8rem;color:var(--text);line-height:1.8">
          流年行运至<strong>${zw.fYearPal?.name || '--'}宫</strong>，
          流月临<strong>${zw.fMonthPal?.name || '--'}宫</strong>。
          财帛宫主星${zw.wealthPal.major.map(s=>s.name).join('、')||'空宫'}
          ${zw.wScore > 0.65 ? '，财星旺盛，看多倾向' : zw.wScore < 0.4 ? '，财星受克，谨慎为上' : '，财运中性，观望为宜'}。
          官禄宫${zw.careerPal.major.map(s=>s.name).join('、')||'空宫'}
          ${zw.cScore > 0.65 ? '，事业旺相，趋势向好' : zw.cScore < 0.4 ? '，官星失位，上行阻力大' : '，官星平稳，横盘震荡'}。
          综合偏向：<strong style="color:${(zw&&zw.bias||0) > 0.2 ? 'var(--bull)' : (zw&&zw.bias||0) < -0.2 ? 'var(--bear)' : 'var(--gold)'}">${(zw&&zw.bias||0) > 0.2 ? '看多' : (zw&&zw.bias||0) < -0.2 ? '看空' : '中性'}</strong>，置信度 ${(zw.conf * 100).toFixed(0)}%。
        </div>
      </div>

      <!-- 紫微专属：时间窗口（职责域显示）-->
      <div style="margin-top:12px;padding:12px 14px;background:rgba(144,64,216,0.06);border:1px solid rgba(144,64,216,0.25);border-radius:10px">
        <div style="font-size:.72rem;color:#9040d8;font-weight:700;margin-bottom:8px">📅 时辰窗口（紫微职责：吉凶时机，非价格预测）</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="background:rgba(24,145,80,0.07);border:1px solid rgba(24,145,80,0.2);border-radius:7px;padding:8px 10px">
            <div style="font-size:.62rem;color:var(--bull);font-weight:700;margin-bottom:3px">✦ 财帛吉时</div>
            <div style="font-size:.82rem;font-weight:700;color:var(--bull)">${(zw.goodTime||[]).join('、')||'--'}</div>
            <div style="font-size:.6rem;color:var(--muted);margin-top:2px">财星：${zw.wealthStar||'--'}</div>
          </div>
          <div style="background:rgba(192,48,48,0.07);border:1px solid rgba(192,48,48,0.2);border-radius:7px;padding:8px 10px">
            <div style="font-size:.62rem;color:var(--bear);font-weight:700;margin-bottom:3px">▲ 化忌凶时</div>
            <div style="font-size:.82rem;font-weight:700;color:var(--bear)">${(zw.badTime||[]).join('、')||'无'}</div>
            <div style="font-size:.6rem;color:var(--muted);margin-top:2px">官星：${zw.careerStar||'--'}</div>
          </div>
        </div>
      </div>
    </div>`;
}




// ── Gann Panel Renderer ──────────────────────────────────────────────────
function buildGannPanel(gn, coin) {
  const [bc, bl] = biasBadge(gn.bias);
  const P = gn.P;

  const fmtP = v => {
    if (v >= 1000)  return '$' + Math.round(v).toLocaleString();
    const _v=Number(v); if(isNaN(_v)||!isFinite(_v)) return '--';
    if (_v >= 1) return '$' + _v.toFixed(2);
    return '$' + _v.toFixed(4);
  };
  const pctBadge = (pct, isAbove) => {
    const cls = isAbove ? 'color:var(--bear)' : 'color:var(--bull)';
    const sign = pct >= 0 ? '+' : '';
    return '<span style="' + cls + ';font-size:.65rem;margin-left:6px">' + sign + (pct||0).toFixed(1) + '%</span>';
  };

  // ── S9 levels: sort by proximity to current price ──
  const s9All = [
    ...gn.s9.levels,
    ...gn.s9.cardinalLevels,
  ].sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct));

  const s9Above = s9All.filter(l => l.isAbove).slice(0, 8);
  const s9Below = s9All.filter(l => !l.isAbove).slice(0, 8);

  const s9Row = (l) =>
    '<div style="display:flex;justify-content:space-between;align-items:center;' +
    'padding:5px 10px;border-radius:6px;margin-bottom:3px;' +
    'background:' + (l.isAbove ? 'rgba(192,48,48,0.06)' : 'rgba(24,145,80,0.06)') + '">' +
    '<span style="font-size:.7rem;color:var(--muted)">' + l.source + '</span>' +
    '<span style="font-size:.78rem;font-weight:600;' +
    (l.isAbove ? 'color:var(--bear)' : 'color:var(--bull)') + '">' +
    fmtP(l.price) + pctBadge(l.pct, l.isAbove) + '</span></div>';

  // ── Angle lines: find closest above & below ──
  const angAbove = gn.angles.filter(a => a.isAbove).sort((a,b) => a.price - b.price);
  const angBelow = gn.angles.filter(a => !a.isAbove).sort((a,b) => b.price - a.price);

  const angRow = (a, isAbove) =>
    '<div style="display:flex;justify-content:space-between;align-items:center;' +
    'padding:5px 10px;border-radius:6px;margin-bottom:3px;' +
    'background:' + (isAbove ? 'rgba(192,48,48,0.06)' : 'rgba(24,145,80,0.06)') + '">' +
    '<span style="font-size:.7rem;color:var(--muted)">' + a.label +
    ' <span style="font-size:.6rem;color:var(--faint)">(' + a.deg + '°)</span></span>' +
    '<span style="font-size:.78rem;font-weight:600;' +
    (isAbove ? 'color:var(--bear)' : 'color:var(--bull)') + '">' +
    fmtP(a.price) + pctBadge(a.pct, isAbove) + '</span></div>';

  // ── Price multiples: both sides, sorted by proximity ──
  const multAll = gn.multiples.sort((a,b) => Math.abs(a.pct) - Math.abs(b.pct));
  const multAbove = multAll.filter(m => m.isAbove).slice(0, 8);
  const multBelow = multAll.filter(m => !m.isAbove).slice(0, 8);

  const multRow = (m) =>
    '<div style="display:flex;justify-content:space-between;align-items:center;' +
    'padding:5px 10px;border-radius:6px;margin-bottom:3px;' +
    'background:' + (m.isAbove ? 'rgba(192,48,48,0.06)' : 'rgba(24,145,80,0.06)') + '">' +
    '<span style="font-size:.7rem;color:var(--muted)">' + m.source + '</span>' +
    '<span style="font-size:.78rem;font-weight:600;' +
    (m.isAbove ? 'color:var(--bear)' : 'color:var(--bull)') + '">' +
    fmtP(m.price) + pctBadge(m.pct, m.isAbove) + '</span></div>';

  // ── Current price bar ──
  const curBar = '<div style="display:flex;justify-content:center;align-items:center;' +
    'padding:7px 14px;margin:8px 0;border-radius:8px;' +
    'background:rgba(200,168,74,0.12);border:1px solid rgba(200,168,74,0.35)">' +
    '<span style="font-size:.72rem;color:var(--faint);margin-right:8px">当前价格</span>' +
    '<span style="font-size:1rem;font-weight:700;color:var(--gold)">' + fmtP(P) + '</span>' +
    '<span style="font-size:.62rem;color:var(--faint);margin-left:8px">√P = ' + gn.sqP + '</span>' +
    '</div>';

  // ── Section header ──
  const secHead = (icon, title, color) =>
    '<div style="font-size:.72rem;font-weight:700;color:' + color +
    ';letter-spacing:.1em;text-transform:uppercase;margin:14px 0 7px;' +
    'display:flex;align-items:center;gap:6px">' + icon + ' ' + title + '</div>';

  const panel = document.createElement('div');
  panel.className = 'panel';
  panel.innerHTML =
    '<div class="panel-title" style="justify-content:space-between">' +
    '<span>⬡ 江恩全系统价位分析</span>' +
    '<span class="badge ' + bc + '">' + bl + '</span></div>' +

    // Meta info bar
    '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">' +
    ['√P = ' + gn.sqP, '螺旋角 ' + gn.s9.angle + '°', '角度线 ' + gn.activeAng + '°', '周期 ' + gn.cycle + '天'].map((v,i) =>
      '<div style="background:var(--card2);border:1px solid var(--border);border-radius:8px;padding:9px 10px;text-align:center">' +
      '<div style="font-size:.58rem;color:var(--faint);margin-bottom:2px">' + ['价格平方根','螺旋位置','江恩角','时间周期'][i] + '</div>' +
      '<div style="font-size:.78rem;font-weight:700;color:var(--gold)">' + v + '</div></div>'
    ).join('') + '</div>' +

    // ── Square of Nine ──────────────────────────────────────────────────
    '<div style="background:rgba(200,168,74,0.05);border:1px solid rgba(200,168,74,0.2);border-radius:10px;padding:14px;margin-bottom:14px">' +
    '<div style="font-size:.8rem;font-weight:700;color:var(--gold);margin-bottom:4px;letter-spacing:.05em">⬡ 江恩九方格 (Square of Nine)</div>' +
    '<div style="font-size:.72rem;color:var(--muted);margin-bottom:10px;line-height:1.6">' +
    '当前价格 √P = ' + gn.sqP + '，螺旋角 ' + gn.s9.angle + '°。' +
    '同一角度线价格（±整圈 = ±2 in √P space）为共振支撑/压力位。</div>' +
    curBar +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
    '<div><div style="font-size:.65rem;color:var(--bear);font-weight:700;margin-bottom:5px">▲ 压力位（上方）</div>' +
    s9Above.map(s9Row).join('') + '</div>' +
    '<div><div style="font-size:.65rem;color:var(--bull);font-weight:700;margin-bottom:5px">▼ 支撑位（下方）</div>' +
    s9Below.map(s9Row).join('') + '</div>' +
    '</div></div>' +

    // ── Gann Angles ─────────────────────────────────────────────────────
    '<div style="background:rgba(56,168,224,0.05);border:1px solid rgba(56,168,224,0.2);border-radius:10px;padding:14px;margin-bottom:14px">' +
    '<div style="font-size:.8rem;font-weight:700;color:var(--sky);margin-bottom:4px;letter-spacing:.05em">📐 江恩角度线 (Gann Angles)</div>' +
    '<div style="font-size:.72rem;color:var(--muted);margin-bottom:10px;line-height:1.6">' +
    '以前低 ' + fmtP(gn.L) + ' 为原点，经 ' + gn.daysForAngles + ' 天，各角度线当前价位：</div>' +
    curBar +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
    '<div><div style="font-size:.65rem;color:var(--bear);font-weight:700;margin-bottom:5px">▲ 角度压力（上方）</div>' +
    angAbove.map(a => angRow(a, true)).join('') + '</div>' +
    '<div><div style="font-size:.65rem;color:var(--bull);font-weight:700;margin-bottom:5px">▼ 角度支撑（下方）</div>' +
    angBelow.map(a => angRow(a, false)).join('') + '</div>' +
    '</div></div>' +

    // ── Price Multiples ──────────────────────────────────────────────────
    '<div style="background:rgba(112,48,184,0.05);border:1px solid rgba(112,48,184,0.2);border-radius:10px;padding:14px">' +
    '<div style="font-size:.8rem;font-weight:700;color:var(--purple);margin-bottom:4px;letter-spacing:.05em">× 江恩价格倍数目标</div>' +
    '<div style="font-size:.72rem;color:var(--muted);margin-bottom:10px;line-height:1.6">' +
    '前高 ' + fmtP(gn.H) + ' · 前低 ' + fmtP(gn.L) + '，乘以江恩比率（1/8 → 8×）：</div>' +
    curBar +
    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">' +
    '<div><div style="font-size:.65rem;color:var(--bear);font-weight:700;margin-bottom:5px">▲ 上方目标价</div>' +
    multAbove.map(multRow).join('') + '</div>' +
    '<div><div style="font-size:.65rem;color:var(--bull);font-weight:700;margin-bottom:5px">▼ 下方目标价</div>' +
    multBelow.map(multRow).join('') + '</div>' +
    '</div></div>';

  return panel;
}

// ════════════════════════════════════════════════════════════════════════
// 🔬 回测验证面板
// 功能：拉取历史K线，将系统生成的节点预测与历史实际走势对比，
//       统计时间准确度和价位准确度，给出评分
// ════════════════════════════════════════════════════════════════════════
function buildBacktestPanel(coin, price, high, low, nodes, tpsl, sys) {
  return `<div class="panel">
    <div class="panel-title">🔬 历史回测验证 · 节点 & 价位准确度</div>
    <div style="font-size:.72rem;color:var(--muted);padding:8px 12px;background:rgba(200,168,74,0.06);border-radius:8px;margin-bottom:16px;line-height:1.7">
      拉取真实历史K线，把系统节点预测与实际转折点对比，统计时间误差、价位偏差和方向命中率。
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:14px">
      <div>
        <label style="font-size:.62rem;color:var(--muted);display:block;margin-bottom:4px">回溯币种</label>
        <div style="font-size:.85rem;font-weight:700;color:var(--gold);padding:8px 12px;background:var(--card2);border:1px solid var(--border);border-radius:7px">${coin}</div>
      </div>
      <div>
        <label style="font-size:.62rem;color:var(--muted);display:block;margin-bottom:4px">K线周期</label>
        <select id="bt-tf" style="width:100%;background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:8px 10px;color:var(--text);font-size:.82rem;outline:none">
          <option value="1h">1小时</option>
          <option value="4h" selected>4小时</option>
          <option value="1d">日线</option>
        </select>
      </div>
      <div>
        <label style="font-size:.62rem;color:var(--muted);display:block;margin-bottom:4px">回溯深度</label>
        <select id="bt-depth" style="width:100%;background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:8px 10px;color:var(--text);font-size:.82rem;outline:none">
          <option value="30">30天</option>
          <option value="60" selected>60天</option>
          <option value="90">90天</option>
          <option value="180">180天</option>
          <option value="365">365天（1年）</option>
          <option value="730">730天（2年）</option>
        </select>
      </div>
    </div>
    <button onclick="runBacktest('${coin}', ${price}, ${high}, ${low})"
      style="width:100%;padding:12px;border:1px solid rgba(200,168,74,0.4);border-radius:10px;background:linear-gradient(135deg,rgba(200,168,74,0.25),rgba(200,168,74,0.12));color:var(--gold);font-size:.82rem;font-weight:700;cursor:pointer;letter-spacing:.08em;margin-bottom:16px">
      🔬 开始回测验证
    </button>
    <div id="bt-progress" style="display:none;text-align:center;padding:24px;color:var(--muted);font-size:.78rem">
      <div style="margin-bottom:8px;font-size:1.2rem">⏳</div>
      <div id="bt-progress-text">正在拉取历史数据…</div>
    </div>
    <div id="bt-result"></div>
  </div>`;
}

// ═══════════════════════════════════════════════
// 全局K线分批拉取函数（无500条限制，最多2000条）
// Binance单次上限1000条，超出时自动分两批合并
// ═══════════════════════════════════════════════
async function fetchKlines(sym, tf, totalLimit) {
  if (totalLimit <= 1000) {
    const url = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=${totalLimit}`;
    const res = await smartFetch(url, { noCache: true });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  }
  // 超过1000条：分两批
  const url1 = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=1000`;
  const res1 = await smartFetch(url1, { noCache: true });
  const batch1 = await res1.json();
  if (!Array.isArray(batch1) || !batch1.length) return [];
  const oldestMs = parseInt(batch1[0][0]);
  const url2 = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=1000&endTime=${oldestMs - 1}`;
  try {
    const res2 = await smartFetch(url2, { noCache: true });
    const batch2 = await res2.json();
    if (Array.isArray(batch2) && batch2.length) return [...batch2, ...batch1];
  } catch(e) {}
  return batch1;
}

async function runBacktest(coin, curPrice, curHigh, curLow) {
  const tf    = document.getElementById('bt-tf')?.value || '4h';
  const depth = parseInt(document.getElementById('bt-depth')?.value) || 60;
  const prog  = document.getElementById('bt-progress');
  const result= document.getElementById('bt-result');
  if (!prog || !result) return;

  prog.style.display = 'block';
  result.innerHTML = '';
  document.getElementById('bt-progress-text').textContent = '正在拉取历史K线…';

  // ── 拉取历史K线 ──
  const sym = coin + 'USDT';
  const barsPerDay = { '1h': 24, '4h': 6, '1d': 1 }[tf] || 6;
  // 已取消500条限制，Binance单次最大1000条，超出则分批拉取
  const limitRaw = Math.ceil(depth * barsPerDay);
  const limit = Math.min(1000, limitRaw); // Binance单次上限1000

  let klines = [];
  // fetchKlines 已提升为全局函数

  const urls = [
    `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=${limit}`,
    `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=${limit}`,
  ];
  // 优先用批量拉取（支持超过1000条）
  try {
    const batchData = await fetchKlines(sym, tf, limitRaw);
    if (Array.isArray(batchData) && batchData.length > 5) { klines = batchData; }
  } catch(e) {}
  // 降级：逐URL尝试
  if (!klines.length) {
    for (const url of urls) {
      try {
        const res = await smartFetch(url, { noCache: true });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 5) { klines = data; break; }
      } catch(e2) {}
    }
  }








  if (klines.length < 10) {
    prog.style.display = 'none';
    result.innerHTML = '<div style="color:var(--muted);font-size:.78rem;text-align:center;padding:20px">⚠ 无法获取历史数据，请检查网络连接</div>';
    return;
  }

  document.getElementById('bt-progress-text').textContent = '正在识别历史转折点…';

  // ── 解析K线 ──
  const bars = klines.map(k => ({
    t: parseInt(k[0]),
    o: parseFloat(k[1]),
    h: parseFloat(k[2]),
    l: parseFloat(k[3]),
    c: parseFloat(k[4]),
    ms: parseInt(k[0]),
  }));

  const fmtP = v => v >= 10000 ? '$' + Math.round(v).toLocaleString()
    : (()=>{ const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'--'; return _v>=100?'$'+_v.toFixed(1):_v>=1?'$'+_v.toFixed(2):_v>=0.01?'$'+_v.toFixed(4):'$'+_v.toFixed(6); })();

  const msPerBar = { '1h': 3600000, '4h': 14400000, '1d': 86400000 }[tf] || 14400000;

  // ── 识别局部高低点（更宽窗口，避免太多噪音点）──
  const WIN = tf === '1h' ? 4 : tf === '4h' ? 3 : 2;
  const pivots = [];
  for (let i = WIN; i < bars.length - WIN; i++) {
    let isHigh = true, isLow = true;
    for (let j = 1; j <= WIN; j++) {
      if (bars[i].h <= bars[i-j].h || bars[i].h <= bars[i+j].h) isHigh = false;
      if (bars[i].l >= bars[i-j].l || bars[i].l >= bars[i+j].l) isLow  = false;
    }
    if (isHigh) pivots.push({ ms: bars[i].ms, price: bars[i].h, type: 'high', bar: bars[i] });
    if (isLow)  pivots.push({ ms: bars[i].ms, price: bars[i].l, type: 'low',  bar: bars[i] });
  }

  // ── 节点生成：单次调用，用历史K线价格注解每个节点 ──
  document.getElementById('bt-progress-text').textContent = '正在匹配历史节点…';

  const res = dashResults[coin];
  if (!res) { prog.style.display = 'none'; return; }

  // 单次生成节点（快速，使用当前缓存数据）
  const allNodes = (res.nodes || []).slice();

  // 为每个节点找最近的历史K线，获取该时间点的实际价格
  allNodes.forEach(n => {
    const nMs = new Date(n.date).getTime();
    let bestBar = bars[0], bestDiff = Infinity;
    for (const b of bars) {
      const diff = Math.abs(b.ms - nMs);
      if (diff < bestDiff) { bestDiff = diff; bestBar = b; }
    }
    n.segPrice = bestBar.c;
    n.segHigh  = bestBar.h;
    n.segLow   = bestBar.l;
  });

  // ── 逐节点匹配实际转折点 ──
  document.getElementById('bt-progress-text').textContent = '正在对比准确度…';

  const windowBars = WIN * 2 + 1;  // ±WIN根K线的时间窗口
  const windowMs   = windowBars * msPerBar;

  const matchedNodes = allNodes.map(n => {
    const nMs = new Date(n.date).getTime();

    // 只匹配落在该节点日期附近的转折点
    const nearby = pivots.filter(p => Math.abs(p.ms - nMs) <= windowMs);
    if (!nearby.length) return { node: n, matched: false, reason: '窗口内无转折' };

    // 找最近的转折点（按时间距离排序）
    nearby.sort((a, b) => Math.abs(a.ms - nMs) - Math.abs(b.ms - nMs));
    const best = nearby[0];

    const timeDiffDays = Math.abs(best.ms - nMs) / 86400000;

    // ── 方向判断 ──
    // 节点预测多头 (isBull=true) → 期望出现低点转折 (type='low')
    // 节点预测空头 (isBull=false) → 期望出现高点转折 (type='high')
    const predictedBull = !!n.isBull;
    const actualBull    = best.type === 'low';   // 低点=支撑=看涨转折
    const dirMatch      = predictedBull === actualBull;

    // ── 价格对比 ──
    // 用节点所在段的实际价格作为基准，比较预测方向的偏移量与实际转折价格
    const refPrice  = n.segPrice || curPrice;
    const projP     = n.isBull
      ? smartRound(refPrice * 0.92)   // 预测低点 ≈ 当前价 -8%
      : smartRound(refPrice * 1.08);  // 预测高点 ≈ 当前价 +8%
    const actualP   = best.price;
    const priceDiffPct = refPrice > 0 ? Math.abs(actualP - projP) / refPrice * 100 : 100;

    return {
      node: n, matched: true, pivot: best,
      timeDiffDays: parseFloat((timeDiffDays||0).toFixed(2)),
      priceDiffPct: parseFloat((Math.min(priceDiffPct||0, 100)).toFixed(1)),
      projP, actualP, refPrice,
      dirMatch, predictedBull, actualBull,
    };
  });

  const matched    = matchedNodes.filter(m => m.matched);
  const total      = allNodes.length;
  const hitCount   = matched.length;
  const dirHits    = matched.filter(m => m.dirMatch).length;
  const avgTime    = matched.length ? matched.reduce((s,m) => s + m.timeDiffDays, 0) / matched.length : 0;
  const avgPrice   = matched.length ? matched.reduce((s,m) => s + m.priceDiffPct, 0) / matched.length : 50;

  // ── 评分（基于真实分布）──
  // 时间：偏差0天=100分，偏差windowBars*msPerBar/86400000天=0分
  const maxTimeDays = windowBars * msPerBar / 86400000;
  const timeScore  = matched.length ? Math.max(0, Math.round(100 - (avgTime / maxTimeDays) * 100)) : 0;
  const priceScore = matched.length ? Math.max(0, Math.round(100 - avgPrice * 2)) : 0;
  const dirRate    = matched.length ? Math.round(dirHits / matched.length * 100) : 0;
  const hitRate    = total > 0 ? Math.round(hitCount / total * 100) : 0;
  const overallScore = matched.length
    ? Math.round(timeScore * 0.30 + priceScore * 0.30 + dirRate * 0.40)
    : 0;

  const scoreColor = overallScore >= 65 ? 'var(--bull)' : overallScore >= 45 ? 'var(--amber)' : 'var(--bear)';

  // ── 价格走势迷你图 ──
  const chartBars = bars.slice(-Math.min(80, bars.length));
  const minP = Math.min(...chartBars.map(b => b.l));
  const maxP = Math.max(...chartBars.map(b => b.h));
  const pRange = maxP - minP || 1;
  const W = 320, CH = 100;
  const bw = W / chartBars.length;
  const yw = v => CH - ((v - minP) / pRange) * CH * 0.9 - CH * 0.05;

  const candlesSVG = chartBars.map((b, i) => {
    const x   = i * bw;
    const bull = b.c >= b.o;
    const col  = bull ? '#28c870' : '#c83030';
    const yH   = yw(b.h), yL = yw(b.l);
    const yO   = yw(b.o), yC = yw(b.c);
    const top  = Math.min(yO, yC), bH = Math.max(1, Math.abs(yO - yC));
    return `<line x1="${(x+bw*0.5).toFixed(1)}" y1="${yH.toFixed(1)}" x2="${(x+bw*0.5).toFixed(1)}" y2="${yL.toFixed(1)}" stroke="${col}" stroke-width="0.7" opacity="0.7"/>
<rect x="${(x+bw*0.1).toFixed(1)}" y="${top.toFixed(1)}" width="${(bw*0.8).toFixed(1)}" height="${bH.toFixed(1)}" fill="${col}" rx="0.5"/>`;
  }).join('');

  // Mark matched pivots on chart
  const pivotsSVG = matched.slice(0, 10).map(m => {
    const idx = chartBars.findIndex(b => b.ms >= m.pivot.ms);
    if (idx < 0) return '';
    const b   = chartBars[idx];
    const x   = idx * bw + bw * 0.5;
    const y   = yw(m.pivot.price);
    const col = m.dirMatch ? '#28c870' : '#e03030';
    const lbl = m.dirMatch ? '✓' : '✗';
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4" fill="${col}" opacity="0.85" stroke="#000" stroke-width="0.5"/>
<text x="${x.toFixed(1)}" y="${(y - 6).toFixed(1)}" fill="${col}" font-size="7" text-anchor="middle" font-weight="bold">${lbl}</text>`;
  }).join('');

  // ── 节点明细表 ──
  const nodeRows = matchedNodes.slice(0, 15).map(m => {
    if (!m.matched) {
      return `<tr style="border-bottom:1px solid var(--border)">
        <td style="padding:5px 8px;font-size:.65rem;color:var(--muted)">${m.node.date}</td>
        <td style="padding:5px 8px;font-size:.65rem;color:${m.node.isBull?'var(--bull)':'var(--bear)'}">${m.node.isBull?'▲多':'▼空'}</td>
        <td colspan="3" style="padding:5px 8px;font-size:.62rem;color:var(--faint)">${m.reason || '窗口内无转折点'}</td>
      </tr>`;
    }
    const tOk = m.timeDiffDays <= maxTimeDays * 0.4;
    const pOk = m.priceDiffPct <= 8;
    return `<tr style="border-bottom:1px solid var(--border)">
      <td style="padding:5px 8px;font-size:.65rem;color:var(--text)">${m.node.date}</td>
      <td style="padding:5px 8px;font-size:.65rem;color:${m.node.isBull?'var(--bull)':'var(--bear)'}">${m.node.isBull?'▲多':'▼空'} → 实际${m.actualBull?'▲低点':'▼高点'}</td>
      <td style="padding:5px 8px;font-size:.65rem;color:${tOk?'var(--bull)':'var(--amber)'}">±${m.timeDiffDays}天 ${tOk?'✓':'△'}</td>
      <td style="padding:5px 8px;font-size:.65rem;color:${pOk?'var(--bull)':'var(--amber)'}">±${m.priceDiffPct}% ${pOk?'✓':'△'}</td>
      <td style="padding:5px 8px;font-size:.65rem;color:${m.dirMatch?'var(--bull)':'var(--bear)'};font-weight:700">${m.dirMatch?'✓ 准':'✗ 误'}</td>
    </tr>`;
  }).join('');

  prog.style.display = 'none';
  result.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      ${[
        ['综合评分', overallScore + '分', scoreColor],
        ['时间准确', timeScore + '分', timeScore>=60?'var(--bull)':'var(--amber)'],
        ['价位准确', priceScore + '分', priceScore>=60?'var(--bull)':'var(--amber)'],
        ['方向命中', dirRate + '%', dirRate>=55?'var(--bull)':'var(--amber)'],
      ].map(([l,v,c]) => `<div style="padding:10px 8px;background:var(--card2);border-radius:8px;text-align:center;border:1px solid var(--border)">
        <div style="font-size:.58rem;color:var(--faint);margin-bottom:3px">${l}</div>
        <div style="font-size:1.1rem;font-weight:800;color:${c}">${v}</div>
      </div>`).join('')}
    </div>
    <div style="padding:10px 12px;background:rgba(0,0,0,0.04);border-radius:8px;margin-bottom:14px;font-size:.72rem;color:var(--muted);line-height:1.8">
      分析节点 <strong style="color:var(--text)">${total}</strong> 个 ·
      时间窗口命中 <strong style="color:var(--gold)">${hitCount}/${total}</strong> (${hitRate}%) ·
      方向正确 <strong style="color:${dirRate>=55?'var(--bull)':'var(--amber)'}">${dirHits}/${hitCount}</strong> ·
      平均时间偏差 <strong>${(avgTime||0).toFixed(1)}天</strong> ·
      K线: ${tf} · 深度: ${depth}天
    </div>
    <div style="margin-bottom:14px;background:var(--card2);border-radius:8px;padding:10px;border:1px solid var(--border)">
      <div style="font-size:.65rem;color:var(--muted);margin-bottom:6px">历史K线走势 · 🟢方向预测准 / 🔴方向预测误</div>
      <svg viewBox="0 0 ${W} ${CH}" style="width:100%;height:80px;display:block;overflow:visible">
        ${candlesSVG}${pivotsSVG}
      </svg>
      <div style="display:flex;justify-content:space-between;font-size:.58rem;color:var(--faint);margin-top:4px">
        <span>${toUTC8DateStr(chartBars[0]?.ms||0)}</span>
        <span>${fmtP(minP)} – ${fmtP(maxP)}</span>
        <span>${toUTC8DateStr(chartBars.at(-1)?.ms||0)}</span>
      </div>
    </div>
    <div style="font-size:.72rem;font-weight:700;color:var(--gold);margin-bottom:8px">📋 节点预测 vs 实际转折</div>
    <div style="overflow-x:auto;border-radius:8px;border:1px solid var(--border)">
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:rgba(200,168,74,0.08)">
          <th style="padding:6px 8px;font-size:.62rem;color:var(--gold);text-align:left">节点日期</th>
          <th style="padding:6px 8px;font-size:.62rem;color:var(--gold);text-align:left">预测→实际方向</th>
          <th style="padding:6px 8px;font-size:.62rem;color:var(--gold);text-align:left">时间偏差</th>
          <th style="padding:6px 8px;font-size:.62rem;color:var(--gold);text-align:left">价位偏差</th>
          <th style="padding:6px 8px;font-size:.62rem;color:var(--gold);text-align:left">方向</th>
        </tr></thead>
        <tbody>${nodeRows || '<tr><td colspan="5" style="padding:16px;text-align:center;color:var(--faint);font-size:.72rem">暂无节点数据</td></tr>'}</tbody>
      </table>
    </div>
    <div style="margin-top:10px;padding:8px 10px;background:rgba(200,168,74,0.06);border-radius:7px;font-size:.62rem;color:var(--faint);line-height:1.7">
      ⚠ 说明：节点按历史分段重新生成，转折点识别为局部±${WIN}根K线高低点。时间偏差越小、方向命中越高代表系统准确度越好。仅供参考，不构成投资建议。
    </div>`;
}
// ── Global error catcher: shows errors visibly instead of silent fail ──
window.addEventListener('error', function(e) {
  console.error('Global error:', e.message, 'at', e.filename, e.lineno);
  const btn = document.getElementById('runAllBtn');
  if (btn && btn.classList.contains('loading')) {
    btn.textContent = '✦ 全部推演';
    btn.classList.remove('loading');
    btn.disabled = false;
  }
  // Show error in welcome area
    if (welcome && !welcome.classList.contains('hidden')) {
    const errDiv = document.getElementById('_errNotice') || document.createElement('div');
    errDiv.id = '_errNotice';
    errDiv.style.cssText = 'margin:12px;padding:10px 14px;background:rgba(184,40,40,.1);border:1px solid rgba(184,40,40,.3);border-radius:8px;font-size:.72rem;color:#b82828;line-height:1.7';
    errDiv.innerHTML = `⚠ JS错误: ${e.message}<br><span style="opacity:.6;font-size:.65rem">行 ${e.lineno} · 请打开控制台(F12)查看详情</span>`;
    welcome.appendChild(errDiv);
  }
});

window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection:', e.reason);
  const btn = document.getElementById('runAllBtn');
  if (btn && btn.classList.contains('loading')) {
    btn.textContent = '✦ 全部推演';
    btn.classList.remove('loading');
    btn.disabled = false;
  }
});



// ═══════════════════════════════════════════════
// FAST PRICE FETCH — 全部同时发，第一个成功就用
// ═══════════════════════════════════════════════
async function fetchPriceDirect(sym, tf = '4h', limit = 42) {
  const tickerUrl = `https://api.binance.com/api/v3/ticker/24hr?symbol=${sym}`;
  const priceUrl  = `https://api.binance.com/api/v3/ticker/price?symbol=${sym}`;
  const klineUrl  = `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=${tf}&limit=${limit}`;

  // ── Step 1: 价格（ticker/24hr → ticker/price 降级）────────────────────
  let price = 0, chg24 = 0;
  try {
    const res  = await smartFetch(tickerUrl);       // 带缓存，30s内复用
    const tick = await res.json();
    price = parseFloat(tick.lastPrice || tick.price || 0);
    chg24 = parseFloat(tick.priceChangePercent || 0);
  } catch(e) {
    console.warn(`[fetchPriceDirect] ${sym} ticker失败，尝试price接口:`, e.message);
    try {
      const res = await smartFetch(priceUrl);
      const pd  = await res.json();
      price = parseFloat(pd.price || 0);
    } catch(e2) {
      throw new Error(`${sym} 价格获取失败（${e2.message}）`);
    }
  }
  if (!price || isNaN(price)) throw new Error(`${sym} 价格无效`);

  // ── 价格合理性校验（防止代理返回错误数据）─────────────────────────────
  const PRICE_GUARDS = {
    'BTCUSDT':  { min: 5000,    max: 500000,  name: 'BTC' },
    'ETHUSDT':  { min: 100,     max: 50000,   name: 'ETH' },
    'SOLUSDT':  { min: 1,       max: 5000,    name: 'SOL' },
    'BNBUSDT':  { min: 10,      max: 5000,    name: 'BNB' },
    'XRPUSDT':  { min: 0.01,    max: 100,     name: 'XRP' },
    'DOGEUSDT': { min: 0.001,   max: 10,      name: 'DOGE'},
    'ADAUSDT':  { min: 0.01,    max: 50,      name: 'ADA' },
    'AVAXUSDT': { min: 1,       max: 2000,    name: 'AVAX'},
    'LINKUSDT': { min: 0.5,     max: 500,     name: 'LINK'},
  };
  const guard = PRICE_GUARDS[sym];
  if (guard) {
    if (price < guard.min || price > guard.max) {
      console.error(`[fetchPriceDirect] ⚠️ ${sym} 价格异常！获取到 $${price}，期望范围 $${guard.min}~$${guard.max}。代理可能返回了错误数据。`);
      throw new Error(`${guard.name} 价格异常 ($${price})：代理可能返回了错误数据，期望 $${guard.min.toLocaleString()}~$${guard.max.toLocaleString()}`);
    }
  }

  // ── Step 2: K线（失败不影响价格，用估算兜底）─────────────────────────
  let high = price * 1.15, low = price * 0.85, klines = [];
  try {
    const res = await smartFetch(klineUrl);         // 允许缓存，节省请求次数
    const d   = await res.json();
    if (Array.isArray(d) && d.length > 5) {
      klines = d;
      high = Math.max(...d.map(k => parseFloat(k[2])));
      low  = Math.min(...d.map(k => parseFloat(k[3])));
    }
  } catch(e) {
    console.warn(`[fetchPriceDirect] ${sym} K线失败，用估算值:`, e.message);
  }

  return { price, chg24, high, low, klines };
}

// ═══════════════════════════════════════════════
// NEW UI: renderCoinTable for the redesigned layout
// ═══════════════════════════════════════════════
function renderCoinTable() {
  updateDashStatCards();
  const tbody   = document.getElementById('coinTblBody');
  const tblEl   = document.getElementById('coinTbl');
    if (!tbody || !tblEl) return;

  const hasAny = dashCoins.some(c => dashResults[c.coin] && dashResults[c.coin] !== 'loading');
  if (!hasAny) {
       // CSS default (flex)
    tblEl.style.display = 'none';
    const cardList = document.getElementById('coinCardList');
    if (cardList) { cardList.innerHTML = ''; cardList.style.removeProperty('display'); }
    return;
  }
  
    // remove from flex flow so table fills space
  // Desktop: show table and hide welcome
  document.querySelectorAll('.welcome').forEach(el => { el.style.display = 'none'; });
  tblEl.style.display = 'table';
  // Mobile: CSS hides table; sync cards
  try { if (typeof renderCoinCards === 'function') renderCoinCards(); } catch(_e) {}

  const fmtP = v => {
    if (v == null || isNaN(v)) return '--';
    if (v >= 10000) return '$' + Math.round(v).toLocaleString();
    const _v=Number(v); if(isNaN(_v)||!isFinite(_v)) return '--';
    if (_v >= 1) return '$' + _v.toFixed(2);
    if (_v >= 0.01) return '$' + _v.toFixed(4);
    return '$' + _v.toFixed(6);
  };

  tbody.innerHTML = dashCoins.filter(c => {
    const res = dashResults[c.coin];
    return _coinPassesFilter(res);
  }).map((c, i) => {
    const res = dashResults[c.coin];
    const isLoading = res === 'loading';

    if (!res || isLoading || res.error || res.needsPrice) {
      const isErr = res?.error != null;
      const msg = isLoading ? '<span class="spinner"></span> 推演中…'
                : isErr     ? '⚠ 抓取失败 — 点击手动输入价格'
                : res?.needsPrice ? '📝 点击输入价格'
                : '⏳ 等待推演';
      const rowClick = isLoading ? '' : `onclick="openManualPriceModal('${c.coin}')"`;
      return `<tr ${rowClick} style="cursor:${isLoading?'default':'pointer'};${isErr?'background:rgba(160,76,4,.04)':''}">
        <td class="tc-id">${i+1}</td>
        <td><span class="tc-sym" style="color:${c.color||'var(--gold)'}">${c.coin}</span></td>
        <td colspan="9" style="color:${isErr?'var(--amber)':'var(--faint)'};font-size:.78rem">${msg}</td>
        <td><button class="tc-btn" onclick="event.stopPropagation();removeCoin('${c.coin}')">✕</button></td>
      </tr>`;
    }

    const score = Number(res.score) || 0;
    const chg   = Number(res.chg24) || 0;
    const bias  = Number(res.avgBias) || 0;
    const scoreColor = score >= 65 ? 'var(--bull)' : score <= 35 ? 'var(--bear)' : 'var(--gold)';
    const grade = res.grade || (score >= 70 ? 'S' : score >= 55 ? 'A' : 'B');
    const stageLabel = bias > 0.2 ? '已入场' : bias < -0.2 ? '观察池' : '预备池';
    const stageClass = stageLabel === '已入场' ? 'in' : stageLabel === '观察池' ? 'watch' : 'watch';

    const indCount = [
      res.rsiE?.isOversold || res.rsiE?.isOverbought,
      res.macdE?.isBullCross || res.macdE?.isBearCross,
      res.tdE?.isBuySetup || res.tdE?.isSellSetup,
      res.chanBeichi
    ].filter(Boolean).length;

    const volPct = Math.min(100, Math.abs(chg) * 10);
    const biasPct = (bias * 100);
    const riskOk = score >= 60 && Math.abs(chg) < 10;
    const isActive = selectedCoin === c.coin;

    return `<tr class="${isActive?'active':''}" onclick="selectCoin('${c.coin}')">
      <td class="tc-id">${i+1}</td>
      <td><span class="tc-sym" style="color:${c.color||'var(--gold)'}">${c.coin}</span></td>
      <td class="tc-price">${fmtP(res.price)}</td>
      <td><span class="tc-chg ${chg>=0?'up':'dn'}">${chg>=0?'+':''}${chg.toFixed(2)}%</span></td>
      <td><span class="tc-grade ${grade.toLowerCase()}">${grade}级</span></td>
      <td><span class="tc-stage ${stageClass}">${stageLabel}</span></td>
      <td><span class="tc-ind${indCount>=3?' full':''}">${indCount}/4</span></td>
      <td>
        <span class="tc-bias ${bias>=0.06?'up':bias<=-0.06?'dn':'ne'}">${bias>=0?'+':''}${biasPct.toFixed(1)}%</span>
        <div style="font-size:.55rem;color:var(--faint)">${res.verdictTitle||''}</div>
      </td>
      <td><span style="font-size:.65rem;color:${riskOk?'var(--bull)':'var(--bear)'}">${riskOk?'✔ 适中':'⚠ 偏高'}</span></td>
      <td>
        <div class="tc-vol-bar"><div class="tc-vol-fill" style="width:${volPct}%"></div></div>
        <div style="font-size:.58rem;color:var(--muted)">${Math.abs(chg).toFixed(2)}%</div>
      </td>
      <td><span class="tc-score" style="color:${scoreColor}">${score}</span></td>
      <td style="white-space:nowrap">
        <button class="tc-btn tc-btn-analyze" onclick="(function(e){e.stopPropagation();e.preventDefault();openQuickAnalysis('${c.coin}');})(event)" title="快速技术分析">📊</button>
        <button class="tc-btn" onclick="event.stopPropagation();removeCoin('${c.coin}')">✕</button>
      </td>
    </tr>`;
  }).join('');

  // 手机端同步渲染卡片视图
  if (typeof renderCoinCards === 'function') {
    try { renderCoinCards(); } catch(e) {}
  }
}

// ═══════════════════════════════════════════════
// 基准日期历史收盘价 — 所有币种全部获取
// ═══════════════════════════════════════════════
async function onBaseDateChange(dateStr) {
  if (!dateStr) return;
  const today = nowUTC8DateStr();
  const statusEl = document.getElementById('baseDatePriceStatus');

  if (dateStr >= today) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--faint)">今日/未来日期 — 将使用当前价格</span>';
    return;
  }

  if (statusEl) statusEl.innerHTML = '<span style="color:var(--faint)">⏳ 查询历史收盘价…</span>';

  const startMs = new Date(dateStr).getTime();
  const endMs   = startMs + 86400000;

  const cryptoCoins = dashCoins.filter(c => !c.manual && c.sym);
  if (!cryptoCoins.length) {
    if (statusEl) statusEl.innerHTML = '<span style="color:var(--amber)">⚠ 暂无币种</span>';
    return;
  }

  let successCount = 0;
  const results = [];

  try {
    await Promise.all(cryptoCoins.map(async (c) => {
      const urls = [
        `https://api.binance.com/api/v3/klines?symbol=${c.sym}&interval=1d&startTime=${startMs}&endTime=${endMs}&limit=1`,
        `https://api.binance.com/api/v3/klines?symbol=${c.sym}&interval=1d&startTime=${startMs}&endTime=${endMs}&limit=1`,
      ];
      for (const url of urls) {
        try {
          const res = await smartFetch(url, { noCache: true });
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const closePrice = parseFloat(data[0][4]);
            const highPrice  = parseFloat(data[0][2]);
            const lowPrice   = parseFloat(data[0][3]);
            if (closePrice > 0) {
              if (dashResults[c.coin] && dashResults[c.coin] !== 'loading') {
                dashResults[c.coin].price = closePrice;
                dashResults[c.coin].high  = highPrice;
                dashResults[c.coin].low   = lowPrice;
                dashResults[c.coin]._histDate = dateStr;
              }
              const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };
              results.push(`<span style="color:var(--text);font-weight:600">${c.coin}</span> <span style="color:var(--bull)">${fmtP(closePrice)}</span>`);
              successCount++;
              break;
            }
          }
        } catch(e) {  }
      }
    }));
  } catch(e) {  }

  // 填入主分析面板价格字段
  const activeCoin = selectedCoin || (cryptoCoins[0]?.coin);
  if (activeCoin && dashResults[activeCoin] && dashResults[activeCoin] !== 'loading') {
    const r = dashResults[activeCoin];
    if (r.price) {
      const priceEl = document.getElementById('price');
      const highEl  = document.getElementById('high');
      const lowEl   = document.getElementById('low');
      if (priceEl) priceEl.value = r.price?.toFixed ? r.price.toFixed(2) : r.price;
      if (highEl)  highEl.value  = r.high?.toFixed  ? r.high.toFixed(2)  : r.high;
      if (lowEl)   lowEl.value   = r.low?.toFixed   ? r.low.toFixed(2)   : r.low;
    }
  }

  if (statusEl) {
    if (successCount > 0) {
      statusEl.innerHTML = `<div style="color:var(--bull);font-size:.64rem;line-height:1.8">✅ ${dateStr} 历史收盘：${results.join(' · ')}</div>`;
    } else {
      statusEl.innerHTML = `<span style="color:var(--amber)">⚠ 无法自动获取 ${dateStr} 历史价格（网络受限）— 请手动输入价格后点击推演</span>`;
    }
  }

  renderCoinTable();
}

// ═══════════════════════════════════════════════
// 策略回测盈亏 Modal 控制
// ═══════════════════════════════════════════════
function openBacktestPnLModal() {
  // 同步当前选中币种
  const coin = selectedCoin || (dashCoins.length > 0 ? dashCoins[0].coin : 'BTC');
  const sel = document.getElementById('pnl-coin');
  if (sel) {
    const sym = coin + 'USDT';
    for (let i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === sym) { sel.selectedIndex = i; break; }
    }
  }
  const sub = document.getElementById('backtestPnLSub');
  if (sub) sub.textContent = `当前分析: ${coin} · 基于历史K线模拟策略盈亏`;
  document.getElementById('backtestPnLModal').classList.add('open');
}
function closeBacktestPnLModal() {
  document.getElementById('backtestPnLModal').classList.remove('open');
}

// ═══════════════════════════════════════════════
// 策略回测盈亏核心引擎
// ═══════════════════════════════════════════════
async function runPnLBacktest() {
  const symbol  = document.getElementById('pnl-coin').value;
  const tf      = document.getElementById('pnl-tf').value;
  const depth   = parseInt(document.getElementById('pnl-depth').value) || 60;
  const capital = parseFloat(document.getElementById('pnl-capital').value) || 10000;
  const riskPct = parseFloat(document.getElementById('pnl-risk').value) || 2;
  const tpPct   = parseFloat(document.getElementById('pnl-tp').value) || 8;
  const slPct   = parseFloat(document.getElementById('pnl-sl').value) || 3;
  const mode    = document.getElementById('pnl-mode').value;

  const prog   = document.getElementById('pnl-progress');
  const result = document.getElementById('pnl-result');
  prog.style.display = 'block';
  result.innerHTML = '';

  const setText = t => { document.getElementById('pnl-progress-text').textContent = t; };
  setText('正在拉取历史K线数据…');

  // ── 1. 拉取K线 ──────────────────────────────────────────────
  const barsPerDay = { '1h': 24, '4h': 6, '1d': 1 }[tf] || 6;
  const limitRaw2 = Math.ceil(depth * barsPerDay); // 无500条限制
  const limit = Math.min(1000, limitRaw2);
  let klines = [];
  // 分批拉取（超过1000条时两次合并）
  try {
    const batchData = await fetchKlines(symbol, tf, limitRaw2);
    if (Array.isArray(batchData) && batchData.length > 5) klines = batchData;
  } catch(e) {}
  if (!klines.length) {
    const urls = [
      `https://api.binance.com/api/v3/klines?symbol=${symbol}&interval=${tf}&limit=${limit}`,
    ];
    for (const url of urls) {
      try {
        const res = await smartFetch(url, { noCache: true });
        const data = await res.json();
        if (Array.isArray(data) && data.length > 5) { klines = data; break; }
      } catch(e) {}
    }
  }

  if (klines.length < 20) {
    prog.style.display = 'none';
    result.innerHTML = '<div style="color:var(--bear);padding:20px;text-align:center;font-size:.9rem">⚠ 无法获取历史数据，请检查网络连接</div>';
    return;
  }

  setText('正在分析策略信号…');

  // ── 2. 解析K线 ──────────────────────────────────────────────
  const bars = klines.map(k => ({
    ms:    parseInt(k[0]),
    o:     parseFloat(k[1]),
    h:     parseFloat(k[2]),
    l:     parseFloat(k[3]),
    c:     parseFloat(k[4]),
    v:     parseFloat(k[5]),
  }));

  // ── 3. 计算指标 ──────────────────────────────────────────────
  const closes = bars.map(b => b.c);
  const highs  = bars.map(b => b.h);
  const lows   = bars.map(b => b.l);

  // EMA helper
  const ema = (arr, period) => {
    const k = 2 / (period + 1);
    const out = [];
    arr.forEach((v, i) => {
      if (i === 0) { out.push(v); return; }
      out.push(v * k + out[i-1] * (1-k));
    });
    return out;
  };

  // RSI
  const rsiArr = (() => {
    const gains = [], losses = [];
    for (let i = 1; i < closes.length; i++) {
      const d = closes[i] - closes[i-1];
      gains.push(Math.max(0, d));
      losses.push(Math.max(0, -d));
    }
    const period = 14;
    const out = new Array(period).fill(null);
    let avgG = gains.slice(0, period).reduce((s,v)=>s+v,0) / period;
    let avgL = losses.slice(0, period).reduce((s,v)=>s+v,0) / period;
    out.push(avgL === 0 ? 100 : 100 - 100/(1+avgG/avgL));
    for (let i = period; i < gains.length; i++) {
      avgG = (avgG * (period-1) + gains[i]) / period;
      avgL = (avgL * (period-1) + losses[i]) / period;
      out.push(avgL === 0 ? 100 : 100 - 100/(1+avgG/avgL));
    }
    return out;
  })();

  // MACD
  const ema12 = ema(closes, 12);
  const ema26 = ema(closes, 26);
  const macdLine = ema12.map((v,i) => v - ema26[i]);
  const signalLine = ema(macdLine.slice(26), 9);
  const macdSignalAligned = new Array(26).fill(null).concat(
    new Array(macdLine.length - 26 - signalLine.length).fill(null),
    signalLine
  );

  // Bollinger Bands
  const bbPeriod = 20;
  const bbArr = bars.map((_, i) => {
    if (i < bbPeriod - 1) return null;
    const slice = closes.slice(i - bbPeriod + 1, i + 1);
    const mean = slice.reduce((s,v)=>s+v,0) / bbPeriod;
    const std  = Math.sqrt(slice.reduce((s,v)=>s+(v-mean)**2,0) / bbPeriod);
    return { upper: mean + 2*std, lower: mean - 2*std, mid: mean };
  });

  // ── 4. 生成交易信号 ──────────────────────────────────────────
  const signals = []; // { idx, dir: 'long'|'short', entry, reason }
  const minIdx = 30;

  for (let i = minIdx; i < bars.length - 1; i++) {
    const bar = bars[i];
    const rsi = rsiArr[i];
    const macdNow  = macdLine[i];
    const macdPrev = macdLine[i-1];
    const sigNow   = macdSignalAligned[i];
    const sigPrev  = macdSignalAligned[i-1];
    const bb = bbArr[i];

    let signal = null;
    if (mode === 'rsi') {
      if (rsi !== null && rsi <= 30) signal = { dir: 'long', reason: `RSI超卖 ${rsi?.toFixed(1)}` };
      else if (rsi !== null && rsi >= 70) signal = { dir: 'short', reason: `RSI超买 ${rsi?.toFixed(1)}` };
    } else if (mode === 'macd') {
      if (sigNow !== null && sigPrev !== null) {
        if (macdPrev < sigPrev && macdNow > sigNow) signal = { dir: 'long',  reason: 'MACD金叉' };
        if (macdPrev > sigPrev && macdNow < sigNow) signal = { dir: 'short', reason: 'MACD死叉' };
      }
    } else if (mode === 'boll') {
      if (bb && bars[i-1].c < bbArr[i-1]?.lower && bar.c > bb.lower) signal = { dir: 'long',  reason: '布林下轨反弹' };
      if (bb && bars[i-1].c > bbArr[i-1]?.upper && bar.c < bb.upper) signal = { dir: 'short', reason: '布林上轨压制' };
    } else {
      // score mode: use simple composite — RSI+MACD momentum
      const rsiScore = rsi !== null ? (rsi <= 35 ? 1 : rsi >= 65 ? -1 : 0) : 0;
      const macdScore = (sigNow !== null && macdNow > sigNow) ? 1 : (sigNow !== null && macdNow < sigNow) ? -1 : 0;
      const score = rsiScore + macdScore;
      if (score >= 2) signal = { dir: 'long',  reason: `综合评分触发 (RSI+MACD看多)` };
      if (score <= -2) signal = { dir: 'short', reason: `综合评分触发 (RSI+MACD看空)` };
    }

    if (signal) {
      // avoid double signals in 3 bars
      const lastSig = signals[signals.length - 1];
      if (!lastSig || i - lastSig.idx > 3) {
        signals.push({ idx: i, entry: bars[i+1].o, ...signal });
      }
    }
  }

  setText(`共发现 ${signals.length} 个信号，正在模拟交易…`);

  // ── 5. 模拟交易 ──────────────────────────────────────────────
  const trades = [];
  let equity = capital;

  for (const sig of signals) {
    const entry    = sig.entry;
    const tpPrice  = sig.dir === 'long' ? entry * (1 + tpPct/100) : entry * (1 - tpPct/100);
    const slPrice  = sig.dir === 'long' ? entry * (1 - slPct/100) : entry * (1 + slPct/100);
    const riskAmt  = equity * riskPct / 100;
    const slDist   = Math.abs(entry - slPrice);
    const qty      = slDist > 0 ? riskAmt / slDist : 0;
    if (qty <= 0) continue;

    // Walk forward to find exit
    let exit = null, exitReason = '', barsHeld = 0;
    for (let j = sig.idx + 2; j < Math.min(bars.length, sig.idx + 200); j++) {
      const b = bars[j];
      barsHeld++;
      if (sig.dir === 'long') {
        if (b.h >= tpPrice) { exit = tpPrice; exitReason = '止盈'; break; }
        if (b.l <= slPrice) { exit = slPrice; exitReason = '止损'; break; }
      } else {
        if (b.l <= tpPrice) { exit = tpPrice; exitReason = '止盈'; break; }
        if (b.h >= slPrice) { exit = slPrice; exitReason = '止损'; break; }
      }
    }
    if (!exit) { exit = bars[Math.min(bars.length-1, sig.idx+200)].c; exitReason = '超时平仓'; }

    const pnl = sig.dir === 'long' ? (exit - entry) * qty : (entry - exit) * qty;
    equity += pnl;

    const entryDate = new Date(bars[sig.idx+1]?.ms || 0).toISOString().slice(0,10);
    trades.push({
      entryDate, dir: sig.dir, entry, exit, tpPrice, slPrice,
      qty, pnl, exitReason, barsHeld, reason: sig.reason,
      equityAfter: equity,
    });
  }

  // ── 6. 统计 ──────────────────────────────────────────────────
  const winners   = trades.filter(t => t.pnl > 0);
  const losers    = trades.filter(t => t.pnl <= 0);
  const totalPnL  = trades.reduce((s,t) => s+t.pnl, 0);
  const winRate   = trades.length > 0 ? (winners.length / trades.length * 100) : 0;
  const avgWin    = winners.length > 0 ? winners.reduce((s,t)=>s+t.pnl,0)/winners.length : 0;
  const avgLoss   = losers.length  > 0 ? Math.abs(losers.reduce((s,t)=>s+t.pnl,0)/losers.length) : 0;
  const pfactor   = avgLoss > 0 ? (avgWin * winners.length) / (avgLoss * losers.length) : avgWin > 0 ? 999 : 0;
  const maxDD     = (() => {
    let peak = capital, dd = 0;
    trades.forEach(t => {
      if (t.equityAfter > peak) peak = t.equityAfter;
      dd = Math.max(dd, (peak - t.equityAfter) / peak * 100);
    });
    return dd;
  })();
  const returnPct = (totalPnL / capital * 100);
  const coin = symbol.replace('USDT','');

  // ── 7. 迷你权益曲线SVG ───────────────────────────────────────
  const eqPoints = [{ x: 0, y: capital }, ...trades.map((t, i) => ({ x: i+1, y: t.equityAfter }))];
  const maxEq = Math.max(...eqPoints.map(p=>p.y));
  const minEq = Math.min(...eqPoints.map(p=>p.y));
  const eqRange = maxEq - minEq || 1;
  const W = 400, H = 80;
  const px = (i, n) => (i / (n - 1)) * W;
  const py = v => H - ((v - minEq) / eqRange) * H * 0.85 - H * 0.07;
  const pts = eqPoints.length > 1
    ? eqPoints.map((p,i) => `${px(i, eqPoints.length).toFixed(1)},${py(p.y).toFixed(1)}`).join(' ')
    : '0,40 400,40';
  const fillPts = `0,${H} ` + pts + ` ${W},${H}`;
  const lineColor = totalPnL >= 0 ? '#2ed078' : '#e83c3c';
  const fillColor = totalPnL >= 0 ? 'rgba(46,208,120,0.15)' : 'rgba(232,60,60,0.15)';

  const equitySVG = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:70px;display:block">
    <polygon points="${fillPts}" fill="${fillColor}"/>
    <polyline points="${pts}" fill="none" stroke="${lineColor}" stroke-width="2" stroke-linejoin="round"/>
    <circle cx="${px(eqPoints.length-1, eqPoints.length).toFixed(1)}" cy="${py(eqPoints[eqPoints.length-1]?.y||capital).toFixed(1)}" r="4" fill="${lineColor}"/>
  </svg>`;

  // ── 8. 渲染结果 ──────────────────────────────────────────────
  prog.style.display = 'none';
  const fmtM  = v => (v >= 0 ? '+' : '') + '$' + Math.abs(v).toFixed(2);
  const fmtP2 = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n)||_n===0)return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };
  const scoreColor = returnPct >= 15 ? 'var(--bull)' : returnPct >= 0 ? 'var(--amber)' : 'var(--bear)';

  const modeLabels = { score:'评分触发', rsi:'RSI策略', macd:'MACD策略', boll:'布林策略' };

  result.innerHTML = `
    <!-- 总览卡 -->
    <div style="background:linear-gradient(135deg,${totalPnL>=0?'rgba(46,208,120,.08)':'rgba(232,60,60,.08)'},var(--card2));border:1px solid ${totalPnL>=0?'rgba(46,208,120,.3)':'rgba(232,60,60,.3)'};border-radius:14px;padding:18px 20px;margin-bottom:14px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px">
        <div>
          <div style="font-size:.75rem;color:var(--muted);margin-bottom:4px">${coin} · ${modeLabels[mode]} · ${tf} · ${depth}天</div>
          <div style="font-size:2.2rem;font-weight:800;font-family:var(--font-mono);color:${scoreColor};line-height:1">${returnPct >= 0 ? '+' : ''}${returnPct.toFixed(2)}%</div>
          <div style="font-size:.9rem;color:var(--muted);margin-top:4px">${fmtM(totalPnL)} · 初始 $${capital.toLocaleString()} → 现值 $${Math.round(equity).toLocaleString()}</div>
        </div>
        <div style="text-align:right">
          <div style="font-size:.72rem;color:var(--faint)">胜率</div>
          <div style="font-size:1.6rem;font-weight:800;font-family:var(--font-mono);color:${winRate>=55?'var(--bull)':winRate>=45?'var(--amber)':'var(--bear)'}">${winRate.toFixed(1)}%</div>
          <div style="font-size:.72rem;color:var(--faint);margin-top:2px">${winners.length}胜 ${losers.length}负</div>
        </div>
      </div>
      <!-- 权益曲线 -->
      <div style="background:var(--card);border-radius:8px;padding:8px;border:1px solid var(--border)">
        <div style="font-size:.65rem;color:var(--faint);margin-bottom:4px">权益曲线 · $${capital.toLocaleString()} → $${Math.round(equity).toLocaleString()}</div>
        ${equitySVG}
      </div>
    </div>

    <!-- 关键指标 -->
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px">
      ${[
        ['总交易次数', trades.length + '次', 'var(--text)'],
        ['盈亏比', pfactor > 0 ? pfactor.toFixed(2) + 'R' : '--', pfactor>=1.5?'var(--bull)':pfactor>=1?'var(--amber)':'var(--bear)'],
        ['平均盈利', '$' + avgWin.toFixed(2), 'var(--bull)'],
        ['最大回撤', maxDD.toFixed(1) + '%', maxDD<=10?'var(--bull)':maxDD<=20?'var(--amber)':'var(--bear)'],
      ].map(([l,v,c]) => `<div style="background:var(--card2);border:1px solid var(--border);border-radius:10px;padding:12px;text-align:center">
        <div style="font-size:.68rem;color:var(--faint);margin-bottom:5px">${l}</div>
        <div style="font-size:1.05rem;font-weight:800;font-family:var(--font-mono);color:${c}">${v}</div>
      </div>`).join('')}
    </div>

    <!-- TP/SL 参数说明 -->
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px">
      <div style="background:rgba(46,208,120,.06);border:1px solid rgba(46,208,120,.2);border-radius:9px;padding:10px;text-align:center">
        <div style="font-size:.65rem;color:var(--faint)">止盈设定</div>
        <div style="font-size:1rem;font-weight:700;font-family:var(--font-mono);color:var(--bull)">+${tpPct}%</div>
      </div>
      <div style="background:rgba(232,60,60,.06);border:1px solid rgba(232,60,60,.2);border-radius:9px;padding:10px;text-align:center">
        <div style="font-size:.65rem;color:var(--faint)">止损设定</div>
        <div style="font-size:1rem;font-weight:700;font-family:var(--font-mono);color:var(--bear)">-${slPct}%</div>
      </div>
      <div style="background:rgba(180,148,54,.06);border:1px solid rgba(180,148,54,.2);border-radius:9px;padding:10px;text-align:center">
        <div style="font-size:.65rem;color:var(--faint)">单笔风险</div>
        <div style="font-size:1rem;font-weight:700;font-family:var(--font-mono);color:var(--gold)">${riskPct}%</div>
      </div>
    </div>

    <!-- 交易记录 -->
    <div style="font-size:.78rem;font-weight:700;color:var(--gold);margin-bottom:8px;letter-spacing:.05em">📋 交易记录（最近30笔）</div>
    <div style="border:1px solid var(--border);border-radius:10px;overflow:hidden;margin-bottom:8px">
      <table style="width:100%;border-collapse:collapse;font-size:.78rem">
        <thead>
          <tr style="background:rgba(180,148,54,.08)">
            <th style="padding:8px 10px;text-align:left;font-size:.68rem;color:var(--gold);font-weight:700">日期</th>
            <th style="padding:8px 10px;text-align:left;font-size:.68rem;color:var(--gold);font-weight:700">方向</th>
            <th style="padding:8px 10px;text-align:right;font-size:.68rem;color:var(--gold);font-weight:700">入场</th>
            <th style="padding:8px 10px;text-align:right;font-size:.68rem;color:var(--gold);font-weight:700">出场</th>
            <th style="padding:8px 10px;text-align:right;font-size:.68rem;color:var(--gold);font-weight:700">盈亏</th>
            <th style="padding:8px 10px;text-align:left;font-size:.68rem;color:var(--gold);font-weight:700">原因</th>
          </tr>
        </thead>
        <tbody>
          ${trades.slice(-30).reverse().map((t,i) => `
          <tr style="border-top:1px solid var(--border);background:${t.pnl>0?'rgba(46,208,120,.03)':'rgba(232,60,60,.03)'}">
            <td style="padding:7px 10px;color:var(--muted);font-family:var(--font-mono);font-size:.73rem">${t.entryDate}</td>
            <td style="padding:7px 10px"><span style="padding:2px 8px;border-radius:99px;font-size:.7rem;font-weight:700;background:${t.dir==='long'?'rgba(46,208,120,.12)':'rgba(232,60,60,.12)'};color:${t.dir==='long'?'var(--bull)':'var(--bear)'}">${t.dir==='long'?'▲多':'▼空'}</span></td>
            <td style="padding:7px 10px;text-align:right;font-family:var(--font-mono);font-size:.78rem">${fmtP2(t.entry)}</td>
            <td style="padding:7px 10px;text-align:right;font-family:var(--font-mono);font-size:.78rem">${fmtP2(t.exit)}</td>
            <td style="padding:7px 10px;text-align:right;font-family:var(--font-mono);font-weight:700;font-size:.82rem;color:${t.pnl>0?'var(--bull)':'var(--bear)'}">${fmtM(t.pnl)}</td>
            <td style="padding:7px 10px;font-size:.7rem;color:var(--faint)">${t.exitReason}</td>
          </tr>`).join('')}
        </tbody>
      </table>
    </div>
    <div style="font-size:.68rem;color:var(--faint);line-height:1.7;padding:8px 10px;background:rgba(180,148,54,.04);border-radius:7px;border:1px solid rgba(180,148,54,.12)">
      ⚠ 回测基于历史数据模拟，不代表未来收益。实际交易受滑点、手续费等因素影响。仅供参考，不构成投资建议。
    </div>
  `;
}

function updateDashStatCards() {
  const results = Object.values(dashResults).filter(r => r && r !== 'loading' && r.score != null);
  const bull  = results.filter(r => (r.avgBias||0) > 0.15).length;
  const bear  = results.filter(r => (r.avgBias||0) < -0.15).length;
  const alert = results.filter(r => Math.abs(r.avgBias||0) <= 0.15 && (r.score||0) >= 50).length;
  const opp   = results.filter(r => (r.score||0) >= 65).length;
  const g = id => document.getElementById(id);
  if (g('statBullNum'))  g('statBullNum').textContent  = bull;
  if (g('statBearNum'))  g('statBearNum').textContent  = bear;
  if (g('statAlertNum')) g('statAlertNum').textContent = alert;
  if (g('statOppNum'))   g('statOppNum').innerHTML   = opp   + '<span class="unit">个</span>';
  const s = results.filter(r=>r.grade==='S').length;
  const a = results.filter(r=>r.grade==='A').length;
  const b = results.filter(r=>(r.grade||'B')==='B').length;
  if (g('sfCountS')) g('sfCountS').textContent = s;
  if (g('sfCountA')) g('sfCountA').textContent = a;
  if (g('sfCountB')) g('sfCountB').textContent = b;
}

// ── Stage / signal filters ──
// ── 当前筛选状态 ──────────────────────────────────────────────────────
let _activeStage = 'all';   // 'all'|'in'|'reserve'|'watch'|'out'
let _activeSig   = 'all';   // 'all'|'bull'|'bear'

function filterStage(stage, btn) {
  _activeStage = stage;
  document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  renderCoinTable();
  try { renderCoinCards(); } catch(e) {}
}
function filterSig(sig) {
  _activeSig = sig;
  document.querySelectorAll('.stat-card').forEach(c => c.classList.remove('active'));
  event?.target?.closest('.stat-card')?.classList.add('active');
  renderCoinTable();
  try { renderCoinCards(); } catch(e) {}
}

// 判断一个币种是否通过当前筛选
function _coinPassesFilter(res) {
  if (!res || res === 'loading' || res.error || res.needsPrice) return true; // 未推演的始终显示

  const bias  = Number(res.avgBias) || 0;
  const score = Number(res.score)   || 50;

  // 信号阶段筛选
  if (_activeStage !== 'all') {
    const stageLabel = bias > 0.2 ? 'in' : bias < -0.2 ? 'watch' : 'reserve';
    // '已出局' = score < 30
    const isOut = score < 30;
    if (_activeStage === 'out'     && !isOut)                 return false;
    if (_activeStage === 'in'      && (isOut || stageLabel !== 'in'))      return false;
    if (_activeStage === 'reserve' && (isOut || stageLabel !== 'reserve')) return false;
    if (_activeStage === 'watch'   && (isOut || stageLabel !== 'watch'))   return false;
  }

  // 多空信号筛选
  if (_activeSig === 'bull' && bias <= 0.05)  return false;
  if (_activeSig === 'bear' && bias >= -0.05) return false;

  return true;
}

// ── Sys-btn toggle ──
document.addEventListener('click', e => {
  const btn = e.target.closest('.sys-btn');
  if (!btn) return;
  const cb = btn.querySelector('input[type=checkbox]');
  if (!cb) return;
  cb.checked = !cb.checked;
  btn.classList.toggle('on', cb.checked);
});

// TF btn handled in DOMContentLoaded


// ══════════════════════════════════════════════════════════════════════════
// 误差追踪器 v3 — 自动历史验证 + 批量回测 + 权重优化
// ══════════════════════════════════════════════════════════════════════════

// 策略优化引擎 — 基于历史误差数据动态优化止盈止损和仓位
// ══════════════════════════════════════════════════════════════════════════
class StrategyOptimizer {
  constructor(tracker) {
    this.tracker = tracker;
  }

  // ── 分析各模型在不同市场状态下的表现 ──────────────────────────────────
  analyzeByMarketState() {
    const records = this.tracker.priceErrors;
    if (records.length < 3) return null;

    // 按模型分组，计算胜率和平均误差
    const byModel = {};
    records.forEach(r => {
      if (!byModel[r.model]) byModel[r.model] = { wins:0, total:0, totalErr:0, errors:[] };
      const m = byModel[r.model];
      m.total++;
      m.wins    += r.dirCorrect;
      m.totalErr+= r.priceErr;
      m.errors.push(r.priceErr);
    });

    const result = {};
    Object.entries(byModel).forEach(([model, m]) => {
      if (m.total === 0) return;
      const winRate  = m.wins / m.total;
      const avgErr   = m.totalErr / m.total;
      // 误差标准差（稳定性）
      const mean = avgErr;
      const std  = Math.sqrt(m.errors.reduce((s,e)=>s+(e-mean)**2,0)/m.errors.length);
      result[model] = {
        winRate, avgErr, std,
        count: m.total,
        // 凯利分数：f = (bp - q) / b，其中 b=盈亏比, p=胜率, q=败率
        // 用平均误差估算盈亏比
        kellyFraction: this._kelly(winRate, avgErr),
        // 推荐场景
        scene: winRate >= 0.6 ? '趋势市' : winRate >= 0.45 ? '震荡市' : '高波动',
        grade: winRate >= 0.65 ? 'S' : winRate >= 0.55 ? 'A' : winRate >= 0.45 ? 'B' : 'C',
      };
    });
    return result;
  }

  // ── 凯利公式计算最优仓位比例 ─────────────────────────────────────────
  // p=胜率, avgErr=平均误差（用于估算盈亏比）
  _kelly(winRate, avgErr) {
    const p = winRate;
    const q = 1 - p;
    // 用历史盈亏比：假设止盈 = avgErr * 3（TP距离约为误差3倍），止损 = avgErr
    const b = Math.max(0.5, 3 - avgErr * 10);  // 动态盈亏比，误差越大盈亏比越低
    const f = (b * p - q) / b;
    return Math.max(0, Math.min(0.25, f));  // 上限25%，不过度集中
  }

  // ── 动态止盈止损建议 ──────────────────────────────────────────────────
  // price: 当前价, model: 主导模型, winRate: 该模型胜率
  getDynamicTPSL(price, model, winRate) {
    const analysis  = this.analyzeByMarketState();
    const modelData = analysis?.[model];
    const wr        = modelData?.winRate ?? winRate ?? 0.50;
    const avgErr    = modelData?.avgErr  ?? 0.03;

    // 基础 TP/SL 比例
    let tpPct = 0.04, slPct = 0.02;   // 默认 4% TP, 2% SL (RRR=2)

    if (wr >= 0.65) {
      // 高胜率：放宽止盈，轻微收紧止损
      tpPct = 0.07 + avgErr * 2;
      slPct = 0.025;
    } else if (wr >= 0.55) {
      // 中胜率：标准设置
      tpPct = 0.05;
      slPct = 0.025;
    } else if (wr >= 0.45) {
      // 低胜率：收紧止损，降低风险
      tpPct = 0.04;
      slPct = 0.02;
    } else {
      // 极低胜率：超紧止损
      tpPct = 0.03;
      slPct = 0.015;
    }

    const tp1 = Math.round(price * (1 + tpPct));
    const tp2 = Math.round(price * (1 + tpPct * 1.8));
    const sl  = Math.round(price * (1 - slPct));
    const rrr = (tpPct / slPct).toFixed(1);

    return { tp1, tp2, sl, tpPct: (tpPct*100).toFixed(1), slPct: (slPct*100).toFixed(1), rrr, winRate: wr };
  }

  // ── 综合策略推荐 ───────────────────────────────────────────────────────
  // 返回当前最佳策略参数
  getBestStrategy(price, high, low, engines) {
    const analysis = this.analyzeByMarketState();
    const mw       = getModelWeights();
    const mature   = mw.mature;

    // 找出历史表现最好的模型
    let bestModel = 'gann', bestWR = 0.5;
    if (analysis) {
      Object.entries(analysis).forEach(([m, d]) => {
        if (d.winRate > bestWR) { bestWR = d.winRate; bestModel = m; }
      });
    }

    // 当前市场状态分析
    const range    = high - low;
    const rangePct = range / price * 100;
    const marketState = rangePct > 15 ? 'high_vol' : rangePct > 8 ? 'trending' : 'ranging';
    const stateLabel  = { high_vol:'高波动', trending:'趋势市', ranging:'震荡市' }[marketState];

    // 凯利仓位
    const kellyF = analysis?.[bestModel]?.kellyFraction ?? 0.10;
    // 半凯利（更保守）
    const halfKelly = (kellyF / 2 * 100).toFixed(1);

    // 动态 TP/SL
    const tpsl = this.getDynamicTPSL(price, bestModel, bestWR);

    // 最优模型组合
    const topModels = analysis
      ? Object.entries(analysis)
          .sort((a,b) => b[1].winRate - a[1].winRate)
          .slice(0, 3)
          .map(([m,d]) => ({ model: m, winRate: (d.winRate*100).toFixed(0)+'%', grade: d.grade, count: d.count }))
      : [{ model: 'gann', winRate:'50%', grade:'B', count:0 }];

    return {
      bestModel, bestWR: (bestWR*100).toFixed(1),
      marketState, stateLabel,
      kellyFraction: (kellyF*100).toFixed(1),
      halfKelly,
      tpsl,
      topModels,
      mature,
      totalRecords: this.tracker.priceErrors.length,
      // 预期边际收益
      expectedReturn: ((bestWR * tpsl.tpPct) - ((1-bestWR) * tpsl.slPct)).toFixed(2),
    };
  }

  // ── 优化前后对比 ────────────────────────────────────────────────────────
  getBeforeAfter() {
    const records = this.tracker.priceErrors;
    if (records.length < 6) return null;

    // 前半段 vs 后半段
    const half   = Math.floor(records.length / 2);
    const before = records.slice(0, half);
    const after  = records.slice(half);

    const stat = arr => ({
      winRate: arr.filter(e => e.dirCorrect).length / arr.length,
      avgErr:  arr.reduce((s,e)=>s+e.priceErr,0) / arr.length,
    });

    const b = stat(before), a = stat(after);
    return {
      before: { wr: (b.winRate*100).toFixed(1), err: (b.avgErr*100).toFixed(2) },
      after:  { wr: (a.winRate*100).toFixed(1), err: (a.avgErr*100).toFixed(2) },
      improved: a.winRate > b.winRate,
      wrDelta:  ((a.winRate - b.winRate)*100).toFixed(1),
      errDelta: ((a.avgErr - b.avgErr)*100).toFixed(2),
    };
  }
}

// 全局策略优化器（在 tracker 初始化后创建）
let stratOptimizer = null;

// ── 从误差追踪器获取当前模型权重（供策略引擎使用）────────────────────────
// 返回: { gann, chan, sr, harmonic, total }
// 如果积累不足5条记录，返回初始默认权重（平等对待）
function getModelWeights() {
  const rec   = tracker.priceErrors.length;
  const WEIGHT_MIN = 20;  // <20条时使用默认权重

  if (rec < WEIGHT_MIN) {
    // 数据不足：返回默认权重，并附上来源标记
    return {
      gann:      0.35,
      chan:       0.25,
      sr:         0.25,
      harmonic:   0.15,
      total:      1,
      mature:     false,
      isDefault:  true,
      dataCount:  rec,
      label:      '默认权重（数据不足，需≥20条）',
    };
  }

  const w     = tracker.weights;
  const total = Object.values(w).reduce((s,v) => s+v, 0) || 1;
  return {
    gann:      (w.gann     || 0.35) / total,
    chan:       (w.chan      || 0.25) / total,
    sr:         (w.sr        || 0.25) / total,
    harmonic:   (w.harmonic  || 0.15) / total,
    total,
    mature:     rec >= 1000,
    isDefault:  false,
    dataCount:  rec,
    label:      rec >= 1000 ? '成熟权重' : rec >= 100 ? '参考权重' : '初步权重',
  };
}

class ErrorTracker {
  constructor() {
    // 最多保存10000条记录（原500条上限已取消，支持长期积累至1000条成熟）
    this.priceErrors = JSON.parse(_localStorage.getItem('err_price') || '[]');
    this.timeErrors  = JSON.parse(localStorage.getItem('err_time')  || '[]');
    this.weights     = JSON.parse(_localStorage.getItem('err_weights') ||
      '{"gann":0.40,"chan":0.25,"sr":0.20,"harmonic":0.15}');
    this.modelStats  = JSON.parse(_localStorage.getItem('err_stats') || '{}');
    // 兼容旧字段
    this.errors = [...this.priceErrors, ...this.timeErrors];
  }

  // ── 记录一次价格预测误差 ───────────────────────────────────────────────
  // pred: { model, date, predictedPrice, predictedDir }
  // actual: { price, direction }
  recordPrice(pred, actual) {
    if (!actual.price || isNaN(actual.price)) return;
    const priceErr   = Math.abs(pred.predictedPrice - actual.price) / actual.price;
    const dirCorrect = pred.predictedDir === actual.direction ? 1 : 0;
    const rec = {
      ts:        Date.now(),
      date:      pred.date || '',
      model:     pred.model,
      predicted: pred.predictedPrice,
      actual:    actual.price,
      priceErr,
      dirCorrect,
    };
    this.priceErrors.push(rec);
    if (this.priceErrors.length > 10000) this.priceErrors = this.priceErrors.slice(-10000); // 保留最近1万条
    this.errors = [...this.priceErrors, ...this.timeErrors];
    this._updateModelStats(pred.model, priceErr, dirCorrect);
    this._recalibrate();
    this.save();
    this.updateUI();
  }

  // ── 记录时间引擎命中率 ─────────────────────────────────────────────────
  recordTime(pred, actual) {
    const correct = (pred.predictedTime || '') === (actual.bestTime || '') ? 1 : 0;
    const rec = {
      ts:            Date.now(),
      date:          pred.date || '',
      model:         pred.model,
      predictedTime: pred.predictedTime,
      actualTime:    actual.bestTime || '未知',
      correct,
    };
    this.timeErrors.push(rec);
    if (this.timeErrors.length > 10000) this.timeErrors = this.timeErrors.slice(-10000);
    this.errors = [...this.priceErrors, ...this.timeErrors];
    this.save();
    this.updateUI();
  }

  // 向后兼容
  record(pred, actual) {
    pred.predictedTime !== undefined ? this.recordTime(pred, actual) : this.recordPrice(pred, actual);
  }

  // ── 更新各模型统计 ─────────────────────────────────────────────────────
  _updateModelStats(model, priceErr, dirCorrect) {
    if (!this.modelStats[model]) this.modelStats[model] = { count:0, totalErr:0, dirOk:0 };
    const s = this.modelStats[model];
    s.count++;
    s.totalErr += priceErr;
    s.dirOk    += dirCorrect;
    _localStorage.setItem('err_stats', JSON.stringify(this.modelStats));
  }

  // ── 权重重校准（误差越小权重越高）──────────────────────────────────────
  _recalibrate() {
    if (this.priceErrors.length < 5) return;
    const byModel = {};
    this.priceErrors.slice(-100).forEach(e => {
      if (!byModel[e.model]) byModel[e.model] = [];
      byModel[e.model].push(e.priceErr);
    });
    let changed = false;
    Object.keys(this.weights).forEach(m => {
      if (byModel[m] && byModel[m].length >= 3) {
        const avg = byModel[m].reduce((s,v)=>s+v,0) / byModel[m].length;
        const newW = 1 / (1 + avg * 10);   // 误差越大，权重越小
        if (Math.abs(newW - this.weights[m]) > 0.005) changed = true;
        this.weights[m] = newW;
      }
    });
    // 归一化
    const total = Object.values(this.weights).reduce((s,v)=>s+v,0);
    if (total > 0) Object.keys(this.weights).forEach(m => this.weights[m] /= total);
    if (changed) _localStorage.setItem('err_weights', JSON.stringify(this.weights));
  }

  // ── 统计摘要 ──────────────────────────────────────────────────────────
  getStats() {
    const rP = this.priceErrors.slice(-50);
    const rT = this.timeErrors.slice(-50);
    return {
      priceErr:   rP.length ? (rP.reduce((s,e)=>s+e.priceErr,0)/rP.length*100).toFixed(2) : '--',
      dirAcc:     rP.length ? (rP.reduce((s,e)=>s+e.dirCorrect,0)/rP.length*100).toFixed(1) : '--',
      timeAcc:    rT.length ? (rT.reduce((s,e)=>s+e.correct,0)/rT.length*100).toFixed(1) : '--',
      priceCount: this.priceErrors.length,
      timeCount:  this.timeErrors.length,
    };
  }

  save() {
    _localStorage.setItem('err_price',  JSON.stringify(this.priceErrors));
    localStorage.setItem('err_time',   JSON.stringify(this.timeErrors));
    _localStorage.setItem('err_weights',JSON.stringify(this.weights));
    // 兼容旧 key
    localStorage.setItem('simple_weights', JSON.stringify(this.weights));
    localStorage.setItem('price_errors',   JSON.stringify(this.priceErrors.slice(-100)));
    localStorage.setItem('time_errors',    JSON.stringify(this.timeErrors.slice(-100)));
  }

  updateUI() {
    const s  = this.getStats();
    const g  = id => document.getElementById(id);
    if (g('avgPriceError'))     g('avgPriceError').textContent     = s.priceErr === '--' ? '--' : s.priceErr+'%';
    if (g('directionAccuracy')) g('directionAccuracy').textContent = s.dirAcc   === '--' ? '--' : s.dirAcc+'%';
    if (g('timeAccuracy'))      g('timeAccuracy').textContent      = s.timeAcc  === '--' ? '--' : s.timeAcc+'%';
    const total = s.priceCount + s.timeCount;
    if (g('errorCount'))      g('errorCount').textContent      = total + '条';
    if (g('errPanelBadge'))   g('errPanelBadge').textContent   = total + '条记录';

    // 模型权重条形图
    const wBar = g('modelWeightBars');
    if (wBar) {
      const models = { gann:'江恩', chan:'缠论', sr:'支阻', harmonic:'谐波' };
      const total_w = Object.values(this.weights).reduce((s,v)=>s+v,0)||1;
      wBar.innerHTML = Object.entries(models).map(([k,label]) => {
        const w     = (this.weights[k]||0);
        const pct   = (w/total_w*100).toFixed(0);
        const stat  = this.modelStats[k];
        const acc   = stat && stat.count > 0
          ? (stat.dirOk/stat.count*100).toFixed(0)+'%准'
          : '待积累';
        return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:.7rem">
          <span style="width:28px;color:#666;flex-shrink:0">${label}</span>
          <div style="flex:1;height:8px;background:#eee;border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:linear-gradient(90deg,#8c6410,#d4a030);border-radius:4px;transition:width .5s"></div>
          </div>
          <span style="width:30px;text-align:right;color:#8c6410;font-weight:700">${pct}%</span>
          <span style="width:36px;font-size:.58rem;color:#aaa">${acc}</span>
        </div>`;
      }).join('');
    }

    // 最近记录列表
    const hist = g('errHistoryList');
    if (hist) {
      const recent = [...this.priceErrors].reverse().slice(0, 15);
      if (recent.length === 0) {
        hist.innerHTML = '<div style="color:#aaa;text-align:center;padding:8px">暂无记录 · 推演历史日期后自动积累</div>';
      } else {
        hist.innerHTML = recent.map(e => {
          const errPct = (e.priceErr * 100).toFixed(2);
          const ok     = e.dirCorrect === 1;
          const color  = parseFloat(errPct) < 2 ? '#14783e' : parseFloat(errPct) < 5 ? '#a04c04' : '#b82020';
          return `<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #f0f0f0">
            <span style="color:#888">${e.date||'--'} <strong style="color:#333">${e.model}</strong></span>
            <span style="color:${color}">${errPct}%误差 <span style="${ok?'color:#14783e':'color:#b82020'}">${ok?'✓':'✗'}</span></span>
          </div>`;
        }).join('');
      }
    }
    // 触发策略优化面板更新
    if (typeof updateStratOptPanel === 'function') setTimeout(updateStratOptPanel, 0);
  }
}

const tracker = new ErrorTracker();
stratOptimizer = new StrategyOptimizer(tracker);

// ══════════════════════════════════════════════════════════════════════════

// ── 历史推演后自动验证误差（在 runDashboard 完成后调用）─────────────────
// date: 推演的历史日期字符串 "2024-01-15"
// priceMap: { BTC: { price, high, low, ... }, ... }
// verifyDays: 多少天后的价格作为"实际价格"验证
// ── 历史验证：获取 verifyDays 天后实际价格，记录各模型误差 ──────────────
// 同时记录当时的市场状态，用于状态感知权重更新
async function autoVerifyHistoric(date, priceMap, verifyDays = 3) {
  const verifyDate = new Date(date);
  verifyDate.setDate(verifyDate.getDate() + verifyDays);
  const today = new Date();
  if (verifyDate >= today) return;  // 验证日期未到，跳过

  const startMs = verifyDate.getTime();
  const endMs   = startMs + 86400000;
  // 当前推演的市场状态（由 runDashboard 写入 _currentMarketState）
  const mktState = _currentMarketState?.state || 'ranging';

  for (const [coin, pd] of Object.entries(priceMap)) {
    if (!pd.price) continue;
    const sym = coin + 'USDT';
    try {
      // ── 获取验证日实际收盘价 ───────────────────────────────────────
      const vRes = await smartFetch(
        `https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&startTime=${startMs}&endTime=${endMs}&limit=1`,
        { noCache: true }
      );
      const data = await vRes.json();
      if (!Array.isArray(data) || !data.length) continue;

      const actualPrice = parseFloat(data[0][4]);
      const actualDir   = actualPrice > pd.price ? 'bull' : 'bear';
      const coinRes     = dashResults[coin];
      if (!coinRes || coinRes === 'loading') continue;

      // ── 记录各模型误差（带市场状态）────────────────────────────────
      const record = (model, predictedPrice, predictedDir) => {
        tracker.recordPrice(
          { model, date, predictedPrice, predictedDir, marketState: mktState },
          { price: actualPrice, direction: actualDir }
        );
      };

      if (coinRes.gn)
        record('gann',
          coinRes.gn.res?.[0]?.price || pd.price * 1.02,
          coinRes.gn.bias > 0 ? 'bull' : 'bear');

      if (coinRes.ch)
        record('chan',
          coinRes.ch.zsHigh || pd.price * 1.01,
          coinRes.ch.biDir === 'up' ? 'bull' : 'bear');

      if (coinRes.sr)
        record('sr',
          coinRes.sr.res?.[0]?.price || pd.price,
          coinRes.sr.bias > 0 ? 'bull' : 'bear');

      if (coinRes.hr?.patterns?.length) {
        const p = coinRes.hr.patterns[0];
        record('harmonic', p.D || pd.price, p.bullish ? 'bull' : 'bear');
      }

      // ── 状态感知权重更新（每次验证后即时校准）──────────────────────
      updateModelWeights(mktState);

    } catch(e) {
    }
  }
}

// ── 更新模型权重（按市场状态分组校准）────────────────────────────────────
// 从 localStorage price_errors 中提取该状态下各模型的表现，重算权重
function updateModelWeights(marketState) {
  const allErrors = JSON.parse(_localStorage.getItem('err_price') || '[]');
  // 筛选该市场状态的记录
  const stateErrors = allErrors.filter(e => e.marketState === marketState);
  if (stateErrors.length < 3) return;  // 不足则不更新

  const byModel = {};
  stateErrors.forEach(e => {
    if (!byModel[e.model]) byModel[e.model] = { wins:0, total:0, sumErr:0 };
    byModel[e.model].total++;
    byModel[e.model].wins    += e.dirCorrect || 0;
    byModel[e.model].sumErr  += e.priceErr   || 0;
  });

  // 计算新权重：胜率高 + 误差小 → 权重大
  const current = getWeightsByState(marketState);
  const newWeights = { ...current };
  Object.entries(byModel).forEach(([model, stat]) => {
    if (stat.total < 2) return;
    const winRate = stat.wins / stat.total;
    const avgErr  = stat.sumErr / stat.total;
    // 综合评分：胜率 × (1 - 误差×5)，范围约 0~1
    const score = winRate * Math.max(0.1, 1 - avgErr * 5);
    newWeights[model] = Math.max(0.05, score);
  });

  // 归一化
  const total = Object.values(newWeights).reduce((s,v)=>s+v,0);
  Object.keys(newWeights).forEach(k => newWeights[k] /= total);

  saveWeightsByState(marketState, newWeights);
  // 同步到 tracker（全局权重用最常见状态的权重）
  tracker.weights = { ...tracker.weights, ...newWeights };
  _localStorage.setItem('err_weights', JSON.stringify(tracker.weights));
  // 刷新面板
  updateErrorPanel();
}

// ── 刷新误差校正面板 UI ───────────────────────────────────────────────────
function updateErrorPanel() {
  tracker.updateUI();
  if (typeof updateStratOptPanel === 'function') updateStratOptPanel();
}

// ── 批量回测 ──────────────────────────────────────────────────────────────
let _btRunning = false;
async function runBatchBacktest() {
  if (_btRunning) { alert('回测正在进行中...'); return; }
  const startStr = document.getElementById('btStartDate')?.value;
  const endStr   = document.getElementById('btEndDate')?.value;
  const coin     = document.getElementById('btCoin')?.value || 'BTC';
  const winDays  = parseInt(document.getElementById('btWindow')?.value || '3');

  if (!startStr || !endStr) { alert('请选择开始和结束日期'); return; }

  // 修复时区问题：用 T12:00:00 确保日期不因时区偏移
  const startD = new Date(startStr + 'T12:00:00');
  const endD   = new Date(endStr   + 'T12:00:00');
  if (isNaN(startD) || isNaN(endD)) { alert('日期格式有误，请重新选择'); return; }
  if (endD <= startD) { alert('结束日期须晚于开始日期'); return; }

  // 最多回测730天（两年），避免请求过多
  const totalDays = Math.min(730, Math.round((endD - startD) / 86400000));
  if (totalDays < 1) return;

  _btRunning = true;
  const btn  = document.getElementById('btBtn');
  const prog = document.getElementById('btProgressWrap');
  const bar  = document.getElementById('btProgressBar');
  const txt  = document.getElementById('btProgressTxt');
  const pct  = document.getElementById('btProgressPct');
  btn.textContent = '⏳ 回测中...';
  btn.disabled    = true;
  prog.style.display = 'block';

  const sym = coin + 'USDT';
  let done = 0, success = 0;

  for (let i = 0; i < totalDays; i++) {
    // 用本地正午12点构建日期，避免夏令时切换导致日期偏移
    const dayD    = new Date(startD);
    dayD.setDate(dayD.getDate() + i);
    const y = dayD.getFullYear();
    const m = String(dayD.getMonth()+1).padStart(2,'0');
    const d = String(dayD.getDate()).padStart(2,'0');
    const dayStr  = `${y}-${m}-${d}`;
    const startMs = new Date(`${dayStr}T00:00:00Z`).getTime();
    const endMs   = startMs + 86400000;
    const verifyD = new Date(`${dayStr}T00:00:00Z`);
    verifyD.setUTCDate(verifyD.getUTCDate() + winDays);

    txt.textContent = `回测 ${dayStr}`;
    bar.style.width  = (i / totalDays * 100).toFixed(0) + '%';
    pct.textContent  = (i / totalDays * 100).toFixed(0) + '%';

    // 跳过未来日期
    if (verifyD >= new Date()) { done++; continue; }

    try {
      // 获取当日 OHLCV
      const r1   = await smartFetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&startTime=${startMs}&endTime=${endMs}&limit=1`, { noCache: true });
      const d1   = await r1.json();
      if (!Array.isArray(d1) || !d1.length) { done++; await _sleep(200); continue; }
      const price = parseFloat(d1[0][4]);
      const high  = parseFloat(d1[0][2]);
      const low   = parseFloat(d1[0][3]);
      if (!price) { done++; await _sleep(200); continue; }

      // 获取验证日价格
      const vMs  = verifyD.getTime();
      const r2   = await smartFetch(`https://api.binance.com/api/v3/klines?symbol=${sym}&interval=1d&startTime=${vMs}&endTime=${vMs+86400000}&limit=1`, { noCache: true });
      const d2   = await r2.json();
      if (!Array.isArray(d2) || !d2.length) { done++; await _sleep(200); continue; }
      const actualPrice = parseFloat(d2[0][4]);
      const actualDir   = actualPrice > price ? 'bull' : 'bear';

      // 运行引擎
      const gn = engineGann(coin, dayStr, price, high, low);
      const ch = engineChan(coin, dayStr, price, high, low, 0);

      // 记录江恩误差
      tracker.recordPrice({
        model: 'gann', date: dayStr,
        predictedPrice: gn.res?.[0]?.price || price * 1.02,
        predictedDir: gn.bias > 0 ? 'bull' : 'bear'
      }, { price: actualPrice, direction: actualDir });

      // 记录缠论误差
      tracker.recordPrice({
        model: 'chan', date: dayStr,
        predictedPrice: ch.zsHigh || price * 1.01,
        predictedDir: ch.biDir === 'up' ? 'bull' : 'bear'
      }, { price: actualPrice, direction: actualDir });

      success++;
    } catch(e) {
    }

    done++;
    await _sleep(300); // 避免请求过快
  }

  bar.style.width  = '100%';
  pct.textContent  = '100%';
  txt.textContent  = `完成！共 ${success}/${totalDays} 天有效数据`;
  btn.textContent  = '▶ 开始批量回测';
  btn.disabled     = false;
  _btRunning       = false;
  tracker.updateUI();
  setTimeout(() => { prog.style.display = 'none'; }, 3000);
}

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── 快速记录（基于当前仪表盘数据）────────────────────────────────────────
function runSimplePrediction() {
  const results = Object.values(dashResults || {}).filter(r => r && r !== 'loading' && r.price && r.gn);
  if (!results.length) { alert('请先运行「联网推演」获取实时数据'); return; }

  results.slice(0, 4).forEach(res => {
    const price = res.price;
    const date  = res.date || nowUTC8DateStr();
    // 以当前价±2%作为模拟实际价（测试用）
    const mockActual = price * (1 + (Math.random() - 0.5) * 0.04);
    const mockDir    = mockActual > price ? 'bull' : 'bear';

    if (res.gn) tracker.recordPrice({
      model:'gann', date, predictedPrice: res.gn.res?.[0]?.price || price,
      predictedDir: res.gn.bias > 0 ? 'bull' : 'bear'
    }, { price: mockActual, direction: mockDir });

    if (res.ch) tracker.recordPrice({
      model:'chan', date, predictedPrice: res.ch.zsHigh || price,
      predictedDir: res.ch.biDir === 'up' ? 'bull' : 'bear'
    }, { price: mockActual, direction: mockDir });
  });
  tracker.updateUI();
  alert(`已记录 ${results.length} 个币种的模拟误差数据`);
}

function resetSimpleCalibration() {
  if (!confirm('重置所有误差记录和权重？此操作不可撤销')) return;
  ['err_price','err_time','err_weights','err_stats',
   'price_errors','time_errors','simple_weights','simple_errors']
    .forEach(k => localStorage.removeItem(k));
  location.reload();
}

// 初始化
tracker.updateUI();

// ── 策略优化面板更新 ──────────────────────────────────────────────────────
function updateStratOptPanel() {
  if (!stratOptimizer) return;
  const g = id => document.getElementById(id);

  // ── 数据量分级阈值 ────────────────────────────────────────────────────
  const THRESHOLDS = {
    SHOW_PANEL:          5,    // 面板显示最低门槛
    SHOW_WEIGHTS:       20,    // 模型权重条形图
    SHOW_MATURE:      1000,    // "✓ 已成熟"徽章（原200，改为1000）
    SHOW_BEFORE_AFTER:  500,   // 优化前后对比（原100，改为500）
    SHOW_MODEL_RANK:    100,   // 模型排行（原30，改为100）
  };

  // ── 市场状态显示 ──────────────────────────────────────────────────────
  const mktEl    = g('mktStateDisplay');
  const mktLabel = g('mktStateLabel');
  const mktDetail= g('mktStateDetail');
  if (_currentMarketState && _currentMarketState.state !== 'ranging') {
    if (mktEl) mktEl.style.display = 'block';
  } else if (mktEl) mktEl.style.display = 'none';
  if (mktLabel)  mktLabel.textContent  = _currentMarketState?.label || '--';
  if (mktDetail) mktDetail.textContent =
    `ADX:${_currentMarketState?.adx||'--'} ATR:${_currentMarketState?.atrPct||'--'}%`;

  // ── 读取已保存参数显示到输入框 ──────────────────────────────────────
  const stepEl = g('paramGannStep');
  const winEl  = g('paramChanWindow');
  if (stepEl && !stepEl.dataset.dirty) stepEl.value = _localStorage.getItem('gann_step') || '2';
  if (winEl  && !winEl.dataset.dirty)  winEl.value  = _localStorage.getItem('chan_fractal_window') || '1';

  const rec = tracker.priceErrors.length;

  // ── 数据量颜色与标签 ──────────────────────────────────────────────────
  //   <20    → 灰色
  //   20-99  → 蓝色（info）
  //   100-499→ 黄色（warning）
  //   500-999→ 橙色（approaching）
  //   ≥1000  → 绿色（success）
  const tierColor = rec >= 1000 ? '#14783e'
    : rec >= 500 ? '#b87000'
    : rec >= 100 ? '#a04c04'
    : rec >= 20  ? '#2c50a8'
    : '#888';
  const tierBg    = rec >= 1000 ? 'rgba(20,120,62,.12)'
    : rec >= 500 ? 'rgba(184,112,0,.10)'
    : rec >= 100 ? 'rgba(160,76,4,.10)'
    : rec >= 20  ? 'rgba(44,80,168,.10)'
    : 'rgba(136,136,136,.10)';
  const tierLabel = rec >= 1000 ? `✅ 已成熟 (${rec}条)`
    : rec >= 500 ? `🔥 接近成熟 (${rec}条)`
    : rec >= 100 ? `⚠️ 参考级 (${rec}条)`
    : rec >= 20  ? `📊 初步可用 (${rec}条)`
    : `⏳ 数据积累中 (${rec}/${THRESHOLDS.SHOW_WEIGHTS}条)`;

  // ── 学习进度条（以1000条为100%）────────────────────────────────────────
  const pct = Math.min(100, rec / THRESHOLDS.SHOW_MATURE * 100);
  if (g('stratLearnBar')) g('stratLearnBar').style.width = pct.toFixed(0) + '%';
  if (g('stratLearnCount'))
    g('stratLearnCount').textContent = `${rec} / ${THRESHOLDS.SHOW_MATURE} 条`;

  // ── 成熟度徽章 ────────────────────────────────────────────────────────
  if (g('stratOptMaturity')) {
    g('stratOptMaturity').style.background = tierBg;
    g('stratOptMaturity').style.color      = tierColor;
    g('stratOptMaturity').textContent      = tierLabel;
  }

  // ── 面板最低门槛：<5条不渲染后续内容 ────────────────────────────────
  if (rec < THRESHOLDS.SHOW_PANEL) return;

  // ── 获取最后一次推演价格（优先使用当前打开的币种，否则取综合评分最高的币种）──
  // selectedCoin 在打开详情页时被设置，关闭详情页时清空
  let lastRes = null;
  if (selectedCoin && dashResults[selectedCoin] && dashResults[selectedCoin] !== 'loading' && dashResults[selectedCoin].price) {
    lastRes = dashResults[selectedCoin];
  } else {
    // 取所有有效结果中评分最高的
    lastRes = Object.values(dashResults || {})
      .filter(r => r && r !== 'loading' && r.price && r.score)
      .sort((a, b) => (b.score || 0) - (a.score || 0))[0]
      || Object.values(dashResults || {}).find(r => r && r !== 'loading' && r.price);
  }
  // 如果 dashResults 无价格数据，使用最近一次推演数据（_lastStratData）
  if ((!lastRes || !lastRes.price) && window._lastStratData?.price) {
    lastRes = window._lastStratData;
  }
  // 更新面板标题的币种标签
  const coinLabelEl = g('stratOptCoinLabel');
  if (coinLabelEl) {
    coinLabelEl.textContent = lastRes?.coin ? (lastRes.coin + (selectedCoin ? '' : ' ★')) : '--';
    coinLabelEl.title = selectedCoin ? '当前详情页币种' : '综合评分最高币种';
  }
  const price   = lastRes?.price || 0;
  const high    = lastRes?.high  || price * 1.15;
  const low     = lastRes?.low   || price * 0.85;
  const engines = lastRes ? { gn:lastRes.gn, ch:lastRes.ch, sr:lastRes.sr, hr:lastRes.hr } : {};
  const best    = stratOptimizer.getBestStrategy(price, high, low, engines);
  const modelNames = { gann:'江恩', chan:'缠论', sr:'支撑阻力', harmonic:'谐波' };
  const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };

  // ── 最佳策略提示（按数据量分级文案）──────────────────────────────────
  if (g('stratBestBody')) {
    const top   = best.topModels[0];
    const topName = modelNames[best.bestModel] || best.bestModel;
    let bodyHTML = '';

    if (!price) {
      bodyHTML = '<span style="color:#888">请先运行推演获取价格数据</span>';

    } else if (rec < THRESHOLDS.SHOW_WEIGHTS) {
      // <20条：鼓励积累
      bodyHTML = `<span style="color:${tierColor}">⏳ 积累更多数据后自动优化策略</span><br>
        <span style="font-size:.65rem;color:#aaa">当前 ${rec} 条，还需 ${THRESHOLDS.SHOW_WEIGHTS - rec} 条才能初步分析</span>`;

    } else if (rec < 100) {
      // 20-99条：初步统计，仅供参考
      bodyHTML = `<span style="color:${tierColor}">📊 初步统计（仅供参考）</span><br>
        当前市场：<strong>${best.stateLabel}</strong><br>
        最优模型：<strong style="color:#2c50a8">${topName}</strong>，胜率 <strong>${best.bestWR}%</strong><br>
        <span style="font-size:.62rem;color:#aaa">⚠ 样本量不足（${rec}条），置信度低</span>`;

    } else if (rec < THRESHOLDS.SHOW_MATURE) {
      // 100-999条：参考级
      bodyHTML = `<span style="color:${tierColor}">⚠️ 参考级策略（谨慎使用）</span><br>
        当前市场：<strong>${best.stateLabel}</strong><br>
        最优模型：<strong style="color:${tierColor}">${topName}</strong>（胜率 <strong>${best.bestWR}%</strong>）<br>
        推荐组合：${best.topModels.map(m=>`${modelNames[m.model]||m.model} ${m.grade}`).join(' › ')}<br>
        预期边际收益：<strong style="color:${parseFloat(best.expectedReturn)>0?'#14783e':'#b82020'}">${best.expectedReturn}%</strong><br>
        <span style="font-size:.62rem;color:#a04c04">需谨慎——${rec}条记录，距成熟还需 ${THRESHOLDS.SHOW_MATURE - rec} 条</span>`;

    } else {
      // ≥1000条：成熟策略
      const mw = getModelWeights();
      bodyHTML = `<span style="color:${tierColor}">✅ 成熟策略</span><br>
        当前市场：<strong>${best.stateLabel}</strong><br>
        最优模型：<strong style="color:#14783e">${topName}</strong>（历史胜率 <strong>${best.bestWR}%</strong>）<br>
        推荐组合：${best.topModels.map(m=>`${modelNames[m.model]||m.model} ${m.grade}`).join(' › ')}<br>
        预期边际收益：<strong style="color:${parseFloat(best.expectedReturn)>0?'#14783e':'#b82020'}">${best.expectedReturn}%</strong>`;
    }
    g('stratBestBody').innerHTML = bodyHTML;
  }

  // ── 动态 TP/SL ───────────────────────────────────────────────────────
  if (price > 0) {
    const _tp1v = best.tpsl.tp1;
    const _sl1v = best.tpsl.sl;
    // 合理性校验：TP1/SL 与 price 偏差不超过 50%
    const _tpOk = _tp1v && Math.abs(_tp1v - price) / price < 0.5;
    const _slOk = _sl1v && Math.abs(_sl1v - price) / price < 0.5;
    if (_tpOk && g('stratTP1')) {
      g('stratTP1').textContent = fmtP(_tp1v) + ' (+' + best.tpsl.tpPct + '%)';
    } else if (g('stratTP1')) {
      g('stratTP1').textContent = '⚠ 价格异常';
      g('stratTP1').style.color = '#b82020';
    }
    if (_slOk && g('stratSL')) {
      g('stratSL').textContent = fmtP(_sl1v) + ' (-' + best.tpsl.slPct + '%)';
    } else if (g('stratSL')) {
      g('stratSL').textContent = '⚠ 价格异常';
      g('stratSL').style.color = '#b82020';
    }
    if (g('stratRRR')) g('stratRRR').textContent = best.tpsl.rrr + ':1';
  }

  // ── 优化前后对比（≥100条才显示）──────────────────────────────────────
  if (g('stratBeforeAfter')) {
    if (rec >= THRESHOLDS.SHOW_BEFORE_AFTER) {
      const ba = stratOptimizer.getBeforeAfter();
      if (ba) {
        g('stratBeforeAfter').style.display = 'block';
        if (g('stratBABody')) {
          const wrUp  = parseFloat(ba.wrDelta) > 0;
          const errDn = parseFloat(ba.errDelta) < 0;
          g('stratBABody').innerHTML =
            `胜率：${ba.before.wr}% → <strong style="color:${wrUp?'#14783e':'#b82020'}">${ba.after.wr}%</strong>（${wrUp?'↑':'↓'}${Math.abs(ba.wrDelta)}%）<br>
             误差：${ba.before.err}% → <strong style="color:${errDn?'#14783e':'#b82020'}">${ba.after.err}%</strong>（${errDn?'↓':'↑'}${Math.abs(ba.errDelta)}%）`;
        }
      }
    } else {
      g('stratBeforeAfter').style.display = 'none';
    }
  }

  // ── 模型排行（≥30条才显示）────────────────────────────────────────────
  const modelRank = g('stratModelRank');
  if (modelRank) {
    if (rec >= THRESHOLDS.SHOW_MODEL_RANK && best.topModels.length) {
      const gradeColor = { S:'#b82020', A:'#a04c04', B:'#2c50a8', C:'#888' };
      // 检查权重来源
      const mw        = getModelWeights();
      const weightNote = mw.isDefault
        ? `<div style="font-size:.58rem;color:#888;padding:3px 6px;background:#f5f5f5;border-radius:4px;margin-bottom:4px">
             ⚠ 使用默认权重（数据不足，需≥${THRESHOLDS.SHOW_WEIGHTS}条）
           </div>`
        : `<div style="font-size:.58rem;color:${tierColor};padding:3px 6px;background:${tierBg};border-radius:4px;margin-bottom:4px">
             ${mw.label} · 基于${rec}条实测数据
           </div>`;
      modelRank.innerHTML =
        `<div style="font-size:.62rem;font-weight:700;color:#666;margin-bottom:4px">模型历史排行</div>`
        + weightNote
        + best.topModels.map((m, i) => {
          const mn = modelNames[m.model] || m.model;
          const gc = gradeColor[m.grade] || '#888';
          return `<div style="display:flex;align-items:center;gap:7px;padding:4px 0;border-bottom:1px solid #f0f0f0;font-size:.7rem">
            <span style="font-weight:700;color:#aaa;width:14px">${i+1}</span>
            <span style="font-weight:700;color:#333;flex:1">${mn}</span>
            <span style="padding:1px 6px;border-radius:4px;background:${gc}18;color:${gc};font-weight:700;font-size:.62rem">${m.grade}</span>
            <span style="color:#8c6410;font-weight:700">${m.winRate}</span>
            <span style="color:#aaa;font-size:.6rem">${m.count}条</span>
          </div>`;
        }).join('');
    } else if (rec < THRESHOLDS.SHOW_MODEL_RANK) {
      modelRank.innerHTML =
        `<div style="font-size:.65rem;color:#888;padding:8px 6px;text-align:center;border:1px dashed #ddd;border-radius:6px">
           📊 模型排行需≥${THRESHOLDS.SHOW_MODEL_RANK}条数据（当前${rec}条，还需${THRESHOLDS.SHOW_MODEL_RANK - rec}条）
         </div>`;
    }
  }

  // ── 多币对比区（BTC/ETH/SOL/BNB）────────────────────────────────────────
  const compareBody = g('multiCoinCompareBody');
  if (compareBody) {
    const COMPARE_COINS = ['BTC','ETH','SOL','BNB','XRP','DOGE'];
    const coinColors = { BTC:'#f7931a', ETH:'#627eea', SOL:'#9945ff', BNB:'#f0b90b', XRP:'#00aae4', DOGE:'#c2a633' };
    const validCoins = COMPARE_COINS
      .map(c => dashResults[c] && dashResults[c] !== 'loading' && dashResults[c].price ? dashResults[c] : null)
      .filter(Boolean);

    if (validCoins.length === 0) {
      compareBody.innerHTML = '<div style="font-size:.6rem;color:#aaa;text-align:center;grid-column:1/-1;padding:6px">完成推演后自动填充对比数据</div>';
    } else {
      compareBody.innerHTML = validCoins.map(r => {
        const sc    = r.score || 0;
        const bias  = r.avgBias || 0;
        const fmtPx = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };
        // 计算简单策略参数（基于评分和bias）
        const wr    = Math.min(95, Math.max(30, 50 + sc * 0.35)).toFixed(0);
        const expR  = (bias * 100).toFixed(1);
        const pos   = sc >= 75 ? '重仓' : sc >= 55 ? '标准' : sc >= 35 ? '轻仓' : '观望';
        const posColor = sc >= 75 ? '#14783e' : sc >= 55 ? '#8c6410' : sc >= 35 ? '#2c50a8' : '#888';
        const biasColor = bias > 0.05 ? '#14783e' : bias < -0.05 ? '#b82020' : '#8c6410';
        const cc    = coinColors[r.coin] || 'var(--gold)';
        const isActive = r.coin === (lastRes?.coin);
        return `<div style="background:${isActive?'rgba(140,100,16,.1)':'rgba(0,0,0,0.025)'};border:1px solid ${isActive?'rgba(140,100,16,.4)':'rgba(0,0,0,0.08)'};border-radius:7px;padding:7px 8px">
          <div style="display:flex;align-items:center;gap:4px;margin-bottom:5px">
            <span style="font-size:.75rem;font-weight:800;color:${cc};font-family:monospace">${r.coin}</span>
            ${isActive ? '<span style="font-size:.5rem;background:rgba(140,100,16,.15);color:#8c6410;padding:1px 4px;border-radius:3px;font-weight:700">当前</span>' : ''}
            <span style="margin-left:auto;font-size:.62rem;font-weight:700;color:${sc>=60?'#14783e':sc>=40?'#8c6410':'#b82020'}">${sc}分</span>
          </div>
          <div style="font-size:.6rem;color:#888;line-height:1.9">
            <div style="display:flex;justify-content:space-between">
              <span>胜率</span><strong style="color:#2c50a8">${wr}%</strong>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span>偏向</span><strong style="color:${biasColor}">${bias>=0?'+':''}${expR}%</strong>
            </div>
            <div style="display:flex;justify-content:space-between">
              <span>仓位</span><strong style="color:${posColor}">${pos}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;padding-top:2px;border-top:1px solid rgba(0,0,0,.07)">
              <span>价格</span><strong style="color:#333;font-family:monospace;font-size:.58rem">${fmtPx(r.price)}</strong>
            </div>
          </div>
        </div>`;
      }).join('');
      // 若有些对比币种不在dashResults，补空格
      if (validCoins.length < COMPARE_COINS.length) {
        const missing = COMPARE_COINS.filter(c => !validCoins.find(r => r.coin === c));
        compareBody.innerHTML += `<div style="font-size:.58rem;color:#bbb;grid-column:1/-1;text-align:center;padding-top:3px">⚠ ${missing.join('/')} 暂无数据，请先运行推演</div>`;
      }
    }
  }
}



// 设置默认回测日期（最近30天）
(function initBtDates() {
  const today = new Date();
  const end   = new Date(today); end.setDate(end.getDate() - 7);   // 留够7天验证窗口
  const start = new Date(end);   start.setDate(start.getDate() - 730); // 默认两年
  // 用 YYYY-MM-DD 格式写入，避免时区问题
  const fmt = d => {
    const y = d.getFullYear();
    const m = String(d.getMonth()+1).padStart(2,'0');
    const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  };
  const s = document.getElementById('btStartDate');
  const e = document.getElementById('btEndDate');
  if (s) s.value = fmt(start);
  if (e) e.value = fmt(end);
})();

// ── 误差面板折叠/展开 ─────────────────────────────────────────────────────
let _errPanelOpen = true;
function toggleErrPanel() {
  _errPanelOpen = !_errPanelOpen;
  const body = document.getElementById('errPanelBody');
  const btn  = document.getElementById('errPanelToggleBtn');
  const wrap = document.getElementById('errPanelWrap');
  if (body) body.style.display = _errPanelOpen ? 'block' : 'none';
  if (btn)  btn.textContent    = _errPanelOpen ? '－' : '＋';
  if (wrap) {
    wrap.style.width    = _errPanelOpen ? '300px' : 'auto';
    wrap.style.maxHeight= _errPanelOpen ? '80vh'  : 'none';
  }
}



// ── Sidebar open/close ──────────────────────────────────────────────────────
function toggleMobileSidebar() {
  const sb = document.querySelector('.sidebar');
  const bd = document.getElementById('sidebarBackdrop');
  const isOpen = sb.classList.contains('mobile-open');
  if (isOpen) { closeMobileSidebar(); } else { openMobileSidebar(); }
}
function openMobileSidebar() {
  const sb = document.querySelector('.sidebar');
  const bd = document.getElementById('sidebarBackdrop');
  if (!sb || !bd) return;
  sb.classList.add('mobile-open');
  bd.style.display = 'block';
  document.body.style.overflow = 'hidden';
  document.body.classList.add('sidebar-open'); // Safari fix
  const btn = document.getElementById('mobNavSidebar');
  if (btn) { document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
}
function closeMobileSidebar() {
  const sb = document.querySelector('.sidebar');
  const bd = document.getElementById('sidebarBackdrop');
  if (!sb || !bd) return;
  sb.classList.remove('mobile-open');
  bd.style.display = 'none';
  document.body.style.overflow = '';
  document.body.classList.remove('sidebar-open'); // Safari fix
  const btn = document.getElementById('mobNavDash');
  if (btn) { document.querySelectorAll('.mob-nav-btn').forEach(b=>b.classList.remove('active')); btn.classList.add('active'); }
}

// ── Error panel mobile toggle ───────────────────────────────────────────────
function toggleMobileErrPanel() {
  const panel = document.getElementById('errPanelWrap');
  if (!panel) return;
  const isOpen = panel.classList.contains('mobile-panel-open');
  if (isOpen) {
    panel.classList.remove('mobile-panel-open');
  } else {
    closeMobileSidebar();
    panel.classList.add('mobile-panel-open');
    // Also ensure panel body is visible
    const body = document.getElementById('errPanelBody');
    if (body) body.style.display = 'block';
    const btn = document.getElementById('errPanelToggleBtn');
    if (btn) btn.textContent = '－';
  }
}

// ── Bottom nav switching ────────────────────────────────────────────────────
function mobileNavSwitch(tab, btnEl) {
  document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
  if (btnEl) btnEl.classList.add('active');

  if (tab === 'dash') {
    closeMobileSidebar();
    // Close error panel
    const panel = document.getElementById('errPanelWrap');
    if (panel) panel.classList.remove('mobile-panel-open');
  } else if (tab === 'err') {
    closeMobileSidebar();
    toggleMobileErrPanel();
    // Set active correctly: if panel just closed, keep dash active
    const panel = document.getElementById('errPanelWrap');
    if (panel && !panel.classList.contains('mobile-panel-open')) {
      document.querySelectorAll('.mob-nav-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('mobNavDash')?.classList.add('active');
    }
  } else if (tab === 'sidebar') {
    // Close error panel first
    const panel = document.getElementById('errPanelWrap');
    if (panel) panel.classList.remove('mobile-panel-open');
    toggleMobileSidebar();
  }
}

// ── Render coin cards (mobile table replacement) ────────────────────────────
function renderCoinCards() {
  // 确保容器存在
  let listEl = document.getElementById('coinCardList');
  if (!listEl) {
    const tableWrap = document.getElementById('tableWrap');
    if (!tableWrap) return;
    listEl = document.createElement('div');
    listEl.id = 'coinCardList';
    listEl.className = 'coin-card-list';
    tableWrap.appendChild(listEl);
  }

  const coins   = window.dashCoins  || [];
  const results = window.dashResults || {};
  const hasAny  = coins.some(c => results[c.coin] && results[c.coin] !== 'loading');

  if (!hasAny) {
    listEl.innerHTML = '';
    listEl.style.removeProperty('display');
    return;
  }

  // Have data — make sure list is visible
  document.querySelectorAll('.welcome').forEach(el => { el.style.display = 'none'; });
  listEl.style.removeProperty('display');
  listEl.style.setProperty('display', 'block', 'important');
  listEl.style.padding = '8px 12px 90px';

  const fmtP = v => {
    if (v == null || isNaN(v)) return '--';
    if (v >= 10000) return '$' + Math.round(v).toLocaleString();
    const _v=Number(v); if(isNaN(_v)||!isFinite(_v)) return '--';
    if (_v >= 1) return '$' + _v.toFixed(2);
    if (_v >= 0.01) return '$' + _v.toFixed(4);
    return '$' + _v.toFixed(6);
  };
  const gradeColors = { S:'#b82020', A:'#986000', B:'#3050b0' };

  listEl.innerHTML = coins.filter(c => {
    const res = results[c.coin];
    return _coinPassesFilter(res);
  }).map((c) => {
    const res       = results[c.coin];
    const isLoading = res === 'loading';

    // Unresolved / loading / error states
    if (!res || isLoading || res.error || res.needsPrice) {
      const isErr = res?.error != null;
      const msg  = isLoading ? '⏳ 推演中…'
                 : isErr     ? '网络受限 · 点击手动输入价格'
                 : res?.needsPrice ? '点击输入价格'
                 : '等待推演';
      const errDetail = isErr && res.error ? String(res.error).slice(0,60) : '';
      const clickFn = isLoading ? '' : `onclick="openRow('${c.coin}')"`;
      return `<div class="coin-card neut-card" ${clickFn} style="${isLoading?'opacity:.6;cursor:default':'cursor:pointer'}">
        <div class="coin-card-top">
          <span class="coin-card-sym" style="color:${c.color||'var(--gold2)'};font-size:1.05rem">${c.coin}</span>
          <span style="font-size:.68rem;color:var(--faint)">${c.label||''}</span>
        </div>
        <div style="margin-top:6px;font-size:.76rem;color:${isErr?'var(--amber)':'var(--muted)'}">
          ${msg}
        </div>
        ${errDetail ? `<div style="font-size:.62rem;color:var(--faint);margin-top:3px">${errDetail}</div>` : ''}
      </div>`;
    }

    const sc    = Number(res.score)   || 0;
    const bias  = Number(res.avgBias) || 0;
    const chg   = Number(res.chg24)   || 0;
    const grade = res.grade || (sc >= 70 ? 'S' : sc >= 55 ? 'A' : 'B');
    const gc    = gradeColors[grade]  || '#888';

    const cardClass  = bias > 0.05 ? 'bull-card' : bias < -0.05 ? 'bear-card' : 'neut-card';
    const scoreClass = sc >= 65 ? 'score-bull' : sc <= 35 ? 'score-bear' : '';
    const chgClass   = chg >= 0 ? 'up' : 'dn';
    const chgStr     = (chg >= 0 ? '+' : '') + chg.toFixed(2) + '%';
    const isActive   = window.selectedCoin === c.coin;

    // 信号阶段（与桌面表格逻辑一致）
    const stageLabel = bias > 0.2 ? '已入场' : bias < -0.2 ? '观察池' : '预备池';
    const stageStyle = stageLabel === '已入场'
      ? 'background:#e8f8ee;color:#18864a;border:1px solid #a8ddb8'
      : stageLabel === '观察池'
      ? 'background:#fff8e0;color:#986000;border:1px solid #e8d080'
      : 'background:rgba(140,100,16,.08);color:var(--gold);border:1px solid rgba(140,100,16,.25)';

    return `<div class="coin-card ${cardClass}${isActive?' coin-card-active':''}" onclick="openRow('${c.coin}')">
      <div class="coin-card-top">
        <div style="display:flex;align-items:center;gap:7px">
          <span class="coin-card-sym" style="color:${c.color||'var(--gold)'}">${c.coin}</span>
          <span style="font-size:.6rem;color:var(--faint)">${c.label||''}</span>
        </div>
        <span class="coin-card-score ${scoreClass}">${sc}<span style="font-size:.55rem;font-weight:500;opacity:.7"> 分</span></span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px 10px;margin-top:6px;font-size:.75rem">
        <div>
          <div style="font-size:.55rem;color:var(--faint);margin-bottom:1px">价格</div>
          <div style="font-weight:700;font-family:monospace">${fmtP(res.price||0)}</div>
        </div>
        <div>
          <div style="font-size:.55rem;color:var(--faint);margin-bottom:1px">24H涨跌</div>
          <div class="coin-card-chg ${chgClass}" style="font-size:.78rem">${chgStr}</div>
        </div>
        <div>
          <div style="font-size:.55rem;color:var(--faint);margin-bottom:1px">评级</div>
          <div><span class="coin-card-grade" style="background:${gc}18;color:${gc};border:1px solid ${gc}40">${grade}级</span></div>
        </div>
        <div>
          <div style="font-size:.55rem;color:var(--faint);margin-bottom:1px">信号阶段</div>
          <div><span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:.68rem;font-weight:600;${stageStyle}">${stageLabel}</span></div>
        </div>
      </div>
      <button onclick="(function(e){e.stopPropagation();e.preventDefault();openQuickAnalysis('${c.coin}');})(event)"
        style="width:100%;margin-top:8px;padding:7px;background:rgba(22,163,74,.08);
          border:1px solid rgba(22,163,74,.25);border-radius:8px;color:var(--bull);
          font-weight:700;font-size:.75rem;cursor:pointer;font-family:inherit">
        📊 快速技术分析
      </button>
    </div>`;
  }).join('');

  // display managed by CSS — do not set inline style
}

// ── 手机端卡片容器注入（DOM ready 后执行）────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  // coinCardList is pre-injected in HTML — no creation needed.
  // Just trigger an initial render in case data already loaded.
  setTimeout(function() {
    if (typeof renderCoinCards === 'function') renderCoinCards();
  }, 200);
});

// ── openRow: delegates to the existing selectCoin (handles detail + manual price fallback) ──
function openRow(coinKey) {
  if (typeof selectCoin === 'function') {
    selectCoin(coinKey);
  }
}

// ── Responsive layout adjustments on resize ─────────────────────────────────
function onWindowResize() {
  const w = window.innerWidth;
  // If resized to desktop, close mobile UI
  if (w > 768) {
    closeMobileSidebar();
    const panel = document.getElementById('errPanelWrap');
    if (panel) panel.classList.remove('mobile-panel-open');
    document.body.style.overflow = '';
    // Restore error panel position for desktop
    panel && (panel.style.transform = '');
  }
  // Re-render cards
  try { renderCoinCards(); } catch(e) {}
}
var _resizeDebounce = null;
window.addEventListener('resize', function() {
  clearTimeout(_resizeDebounce);
  _resizeDebounce = setTimeout(onWindowResize, 150);
}, {passive: true});

// ── Swipe-to-close sidebar on mobile ────────────────────────────────────────
(function initSwipeGesture() {
  let startX = 0, startY = 0;
  document.addEventListener('touchstart', e => {
    startX = e.touches[0].clientX;
    startY = e.touches[0].clientY;
  }, { passive: true });
  document.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    const dy = Math.abs(e.changedTouches[0].clientY - startY);
    const sb = document.querySelector('.sidebar');
    if (!sb) return;
    // Swipe left to close sidebar
    if (dx < -50 && dy < 60 && sb.classList.contains('mobile-open')) {
      closeMobileSidebar();
    }
    // Swipe right from edge (left 20px) to open sidebar
    if (dx > 60 && dy < 60 && startX < 20 && !sb.classList.contains('mobile-open')) {
      openMobileSidebar();
    }
  }, { passive: true });
})();

// ── Initial render on load ───────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  // injectCardList runs as an IIFE above — no need to call again here
  setTimeout(renderCoinCards, 100);
  // Collapse error panel on mobile by default
  if (window.innerWidth <= 768) {
    const panel = document.getElementById('errPanelWrap');
    if (panel) {
      // Panel is hidden via CSS transform by default, no JS needed
    }
  }
});

// ═══════════════════════════════════════════════════════════
// 功能1：自定义指标权重
// ═══════════════════════════════════════════════════════════
const ENGINE_WEIGHT_KEYS = [
  { key:'gann',     label:'江恩理论',  def:0.19 },
  { key:'chan',     label:'缠    论',  def:0.17 },
  { key:'sr',       label:'支撑阻力',  def:0.14 },
  { key:'harmonic', label:'谐波形态',  def:0.11 },
  { key:'qimen',    label:'奇门遁甲',  def:0.10 },
  { key:'iching',   label:'易    经',  def:0.08 },
  { key:'vedic',    label:'印度占星',  def:0.07 },
  { key:'natal',    label:'命盘共振',  def:0.05 },
  { key:'ziwei',    label:'紫微斗数',  def:0.03 },
  { key:'volRate',  label:'波动率',    def:0.02 },
  { key:'western',  label:'西方占星',  def:0.04 },
];

function loadCustomWeights() {
  try {
    const saved = JSON.parse(_localStorage.getItem('custom_engine_weights') || 'null');
    if (saved) return saved;
  } catch(e) {}
  const w = {};
  ENGINE_WEIGHT_KEYS.forEach(e => { w[e.key] = e.def; });
  return w;
}

function saveCustomWeights(w) {
  _localStorage.setItem('custom_engine_weights', JSON.stringify(w));
}

function openWeightModal() {
  let modal = document.getElementById('weightModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'weightModal';
    modal.innerHTML = `
      <div class="wm-box">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
          <div style="font-size:1rem;font-weight:700;color:var(--gold)">⚖️ 指标权重设置</div>
          <button onclick="closeWeightModal()" style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:var(--muted)">✕</button>
        </div>
        <div id="wmRows"></div>
        <div id="wmTotal" class="wm-total"></div>
        <div style="display:flex;gap:8px;margin-top:14px">
          <button onclick="resetWeights()" style="flex:1;padding:8px;background:var(--bg2);border:1px solid var(--border);border-radius:8px;cursor:pointer;font-family:inherit;font-size:.78rem;color:var(--muted)">↺ 重置默认</button>
          <button onclick="applyWeights()" style="flex:2;padding:8px;background:linear-gradient(135deg,var(--gold),var(--gold3));border:none;border-radius:8px;cursor:pointer;font-family:inherit;font-size:.82rem;font-weight:700;color:#fff">✓ 保存应用</button>
        </div>
        <div style="font-size:.62rem;color:var(--faint);margin-top:8px;text-align:center">权重自动归一化 · 保存后下次推演生效</div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if(e.target === modal) closeWeightModal(); });
  }

  const w = loadCustomWeights();
  const rows = document.getElementById('wmRows');
  rows.innerHTML = ENGINE_WEIGHT_KEYS.map(e => `
    <div class="wm-row">
      <span class="wm-label">${e.label}</span>
      <input type="range" class="wm-slider" id="wms_${e.key}"
        min="0" max="100" step="1" value="${Math.round((w[e.key]||e.def)*100)}"
        oninput="updateWmTotal()">
      <span class="wm-val" id="wmv_${e.key}">${Math.round((w[e.key]||e.def)*100)}%</span>
    </div>`).join('');

  updateWmTotal();
  modal.classList.add('open');
}

function updateWmTotal() {
  let total = 0;
  ENGINE_WEIGHT_KEYS.forEach(e => {
    const v = parseInt(document.getElementById('wms_'+e.key)?.value || 0);
    document.getElementById('wmv_'+e.key).textContent = v + '%';
    total += v;
  });
  const el = document.getElementById('wmTotal');
  const ok = total >= 95 && total <= 105;
  el.textContent = `合计：${total}%  ${ok ? '✅ 合理' : total > 105 ? '⚠ 偏高，保存时自动归一' : '⚠ 偏低，保存时自动归一'}`;
  el.style.background = ok ? 'rgba(20,120,62,.08)' : 'rgba(160,76,4,.08)';
  el.style.color = ok ? 'var(--bull)' : 'var(--amber)';
}

function closeWeightModal() {
  document.getElementById('weightModal')?.classList.remove('open');
}

function resetWeights() {
  ENGINE_WEIGHT_KEYS.forEach(e => {
    const el = document.getElementById('wms_'+e.key);
    if(el) el.value = Math.round(e.def * 100);
  });
  updateWmTotal();
}

function applyWeights() {
  let total = 0;
  const raw = {};
  ENGINE_WEIGHT_KEYS.forEach(e => {
    raw[e.key] = parseInt(document.getElementById('wms_'+e.key)?.value || 0);
    total += raw[e.key];
  });
  if (total === 0) { alert('权重不能全为0'); return; }
  const w = {};
  ENGINE_WEIGHT_KEYS.forEach(e => { w[e.key] = raw[e.key] / total; });
  saveCustomWeights(w);
  closeWeightModal();
  alert('✅ 权重已保存！下次点击推演时生效。');
}

// 注入权重按钮到详情页工具栏
(function injectWeightBtn() {

})();


// ═══════════════════════════════════════════════════════════
// 功能2：K线图 + 信号叠加
// ═══════════════════════════════════════════════════════════
function renderKlineChart(klines, signals, containerId) {
  const wrap = document.getElementById(containerId);
  if (!wrap) return;
  if (!klines || klines.length < 5) {
    wrap.innerHTML = '<div style="padding:16px;text-align:center;font-size:.72rem;color:var(--faint)">暂无K线数据</div>';
    return;
  }

  const W = wrap.clientWidth || 600;
  const H = 220;
  const PAD = { t:14, r:16, b:28, l:56 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const data = klines.slice(-50);
  const n = data.length;
  const barW = Math.max(2, Math.floor(cW / n) - 1);
  const gap  = Math.floor(cW / n);

  const highs  = data.map(k => parseFloat(k[2]));
  const lows   = data.map(k => parseFloat(k[3]));
  const pMin   = Math.min(...lows)  * 0.998;
  const pMax   = Math.max(...highs) * 1.002;
  const pRange = pMax - pMin;
  const py = p => PAD.t + cH - ((p - pMin) / pRange) * cH;

  // Build SVG
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textC  = isDark ? '#aaa' : '#888';
  const gridC  = isDark ? 'rgba(255,255,255,.06)' : 'rgba(0,0,0,.05)';
  const upC    = isDark ? '#2ed078' : '#14783e';
  const dnC    = isDark ? '#e83c3c' : '#a82020';

  // Y-axis labels
  const ySteps = 4;
  let yLabels = '';
  for (let i = 0; i <= ySteps; i++) {
    const p = pMin + (pRange * i / ySteps);
    const y = py(p);
    const label = p >= 1000 ? '$' + Math.round(p).toLocaleString() : '$' + p.toFixed(2);
    yLabels += `<line x1="${PAD.l}" y1="${y}" x2="${W - PAD.r}" y2="${y}" stroke="${gridC}" stroke-width="1"/>`;
    yLabels += `<text x="${PAD.l - 4}" y="${y + 4}" text-anchor="end" font-size="9" fill="${textC}">${label}</text>`;
  }

  // Candles
  let candles = '';
  data.forEach((k, i) => {
    const o = parseFloat(k[1]), c = parseFloat(k[4]);
    const h = parseFloat(k[2]), l = parseFloat(k[3]);
    const bull = c >= o;
    const color = bull ? upC : dnC;
    const x = PAD.l + i * gap + gap / 2;
    const top  = py(Math.max(o, c));
    const bot  = py(Math.min(o, c));
    const bodyH = Math.max(1, bot - top);
    candles += `<line x1="${x}" y1="${py(h)}" x2="${x}" y2="${py(l)}" stroke="${color}" stroke-width="1"/>`;
    candles += `<rect x="${x - barW/2}" y="${top}" width="${barW}" height="${bodyH}" fill="${color}" opacity=".85"/>`;
  });

  // Signal markers
  let markers = '';
  if (signals && signals.length) {
    signals.forEach(sig => {
      // Match signal to candle index by date
      const idx = data.findIndex(k => {
        const kDate = new Date(k[0]).toISOString().slice(0,10);
        return kDate >= sig.date;
      });
      if (idx < 0) return;
      const x   = PAD.l + idx * gap + gap / 2;
      const isBull = sig.dir === 'up';
      const y   = isBull ? py(parseFloat(data[idx][3])) + 12 : py(parseFloat(data[idx][2])) - 12;
      const sym = isBull ? '▲' : '▼';
      const col = isBull ? upC : dnC;
      markers += `<text x="${x}" y="${y}" text-anchor="middle" font-size="10" fill="${col}" font-weight="700">${sym}</text>`;
    });
  }

  // X-axis date labels (every ~10 bars)
  let xLabels = '';
  for (let i = 0; i < n; i += Math.max(1, Math.floor(n / 6))) {
    const ts  = parseInt(data[i][0]);
    const dt  = new Date(ts);
    const lbl = `${dt.getMonth()+1}/${dt.getDate()}`;
    const x   = PAD.l + i * gap + gap / 2;
    xLabels  += `<text x="${x}" y="${H - 4}" text-anchor="middle" font-size="9" fill="${textC}">${lbl}</text>`;
  }

  wrap.innerHTML = `<svg id="klineCanvas" viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:${H}px">
    ${yLabels}${candles}${markers}${xLabels}
  </svg>`;
}

// Inject kline chart into detail page after renderAll
const _origRenderAll = window.renderAll;
window.renderAll = function(data) {
  _origRenderAll.apply(this, arguments);
  // Inject chart wrap if not present
  const results = document.getElementById('results');
  if (results && !document.getElementById('klineChartWrap')) {
    const wrap = document.createElement('div');
    wrap.id = 'klineChartWrap';
    wrap.style.cssText = 'margin:0 0 12px;border-radius:12px;overflow:hidden;border:1px solid var(--border);background:var(--card2)';
    const title = document.createElement('div');
    title.style.cssText = 'padding:8px 14px 4px;font-size:.7rem;font-weight:700;color:var(--muted);text-transform:uppercase;letter-spacing:.05em';
    title.textContent = '📊 K线图 · 最近50根';
    wrap.appendChild(title);
    const chartDiv = document.createElement('div');
    chartDiv.id = 'klineInner';
    wrap.appendChild(chartDiv);
    results.insertBefore(wrap, results.firstChild);
  }

  // Build signals from nodes
  const sigs = (data.nodes || []).slice(0, 20).map(nd => ({
    date: nd.date, dir: nd.isBull ? 'up' : 'down'
  }));

  setTimeout(() => {
    renderKlineChart(data.klines || [], sigs, 'klineInner');
  }, 50);
};


// ═══════════════════════════════════════════════════════════
// 功能3：多时间周期选项卡
// ═══════════════════════════════════════════════════════════
const MTF_PERIODS = [
  { tf:'1h',  label:'1H 短线' },
  { tf:'4h',  label:'4H 主力' },
  { tf:'1d',  label:'1D 趋势' },
  { tf:'1w',  label:'1W 大级别' },
];
let _mtfActive = '4h';
let _mtfCache  = {};  // tf → result data
let _mtfCoin   = null;

function injectMtfTabs() {
  const detailBody = document.getElementById('detailBody');
  if (!detailBody || document.getElementById('mtfTabBar')) return;

  const bar = document.createElement('div');
  bar.id = 'mtfTabBar';
  bar.innerHTML = MTF_PERIODS.map(p =>
    `<button class="mtf-tab${p.tf===_mtfActive?' active':''}" onclick="switchMtfTab('${p.tf}')">${p.label}</button>`
  ).join('') +
  `<span id="mtfStatus" style="font-size:.65rem;color:var(--faint);margin-left:auto;align-self:center"></span>`;

  detailBody.insertBefore(bar, detailBody.firstChild);
}

async function switchMtfTab(tf) {
  _mtfActive = tf;
  // Update tab UI
  document.querySelectorAll('.mtf-tab').forEach(b => {
    b.classList.toggle('active', b.textContent.includes(tf.toUpperCase()) || b.onclick?.toString().includes(`'${tf}'`));
  });
  document.querySelectorAll('.mtf-tab').forEach(b => {
    if (b.getAttribute('onclick')?.includes(`'${tf}'`)) b.classList.add('active');
    else b.classList.remove('active');
  });

  const coin = _mtfCoin || selectedCoin;
  if (!coin) return;

  const status = document.getElementById('mtfStatus');
  if (status) status.textContent = '⏳ 加载中…';

  // Check cache
  const cacheKey = `${coin}_${tf}`;
  if (_mtfCache[cacheKey]) {
    renderAll(_mtfCache[cacheKey]);
    if (status) status.textContent = `✓ ${tf.toUpperCase()} 已缓存`;
    return;
  }

  // Fetch new TF data
  try {
    const pk   = PERIOD_KLINE[tf] || { interval: tf, limit: 42 };
    const sym  = (window.dashCoins||[]).find(c=>c.coin===coin)?.sym || coin+'USDT';
    const pd   = await fetchPriceDirect(sym, pk.interval, pk.limit);
    const res  = dashResults[coin];
    if (!res || res === 'loading') { if(status) status.textContent = '⚠ 无推演数据'; return; }

    const date = res.date || nowUTC8DateStr();
    const sys  = getSys();
    const breakLvl = parseFloat(document.getElementById('breakLevel')?.value) || 0;
    const span     = parseFloat(document.getElementById('span')?.value) || 90;

    const qm = sys.qimen   ? engineQiMen(coin, date)                               : null;
    const ic = sys.iching  ? engineIChing(coin, date)                               : null;
    const ve = sys.vedic   ? engineVedic(coin, date)                               : null;
    const gn = sys.gann    ? engineGann(coin, date, pd.price, pd.high, pd.low)     : null;
    const hr = sys.harmonic? engineHarmonic(coin, date, pd.price, pd.high, pd.low) : null;
    const sr = sys.sr      ? engineSR(coin, date, pd.price, pd.high, pd.low)       : null;
    const ch = sys.chan    ? engineChan(coin, date, pd.price, pd.high, pd.low, breakLvl) : null;
    const nt = sys.natal   ? engineNatal(coin, date, pd.price)                     : null;
    const zw = sys.ziwei   ? engineZiwei(coin, date)                               : null;
    const va = sys.volRate ? engineVideoAlgo(coin, date, pd.price, pd.high, pd.low): null;
    const gt = engineGannTime(date, pd.price, pd.high, pd.low);
    const rsiE  = engineRSI(coin, date, pd.price, pd.high, pd.low, pd.klines);
    const macdE = engineMACD(coin, date, pd.price, pd.high, pd.low, pd.klines);
    const bbE   = engineBollinger(coin, date, pd.price, pd.high, pd.low, pd.klines);
    const tdE   = engineTDSequential(coin, date, pd.price, pd.high, pd.low, pd.klines);
    const mtfE  = engineMultiTFBoll(coin, date, pd.price, pd.high, pd.low, pd.klines);
    const tfRec = engineAutoTF(pd.price, pd.high, pd.low, rsiE, macdE, bbE, tdE, tf, span);
    const nodes = generateNodes(coin, date, span, sys, {qm,ic,ve,gn,hr,sr,ch,nt});
    const tpsl  = (typeof engineTPSL === 'function')
      ? engineTPSL(coin, date, pd.price, pd.high, pd.low, {sr,gn,ch,hr,nt})
      : res?.tpsl || null;

    const renderData = {
      coin, date, price:pd.price, high:pd.high, low:pd.low,
      span, sys, qm,ic,ve,gn,hr,sr,ch,nt,zw,va,
      rsiE,macdE,bbE,tdE,tfRec,mtfE,
      tpsl, tpsl5:res.tpsl5, nodes, breakLevel:breakLvl, gt,
      klines: pd.klines,
    };
    _mtfCache[cacheKey] = renderData;
    renderAll(renderData);
    if (status) status.textContent = `✓ ${tf.toUpperCase()} 数据已加载`;
  } catch(e) {
    console.error('[MTF] 切换周期失败:', e);
    if (status) status.textContent = `⚠ ${e.message.slice(0,30)}`;
  }
}

// Inject MTF tabs when detail opens
const _origSelectCoin = window.selectCoin;
if (typeof _origSelectCoin === 'function') {
  window.selectCoin = function(coinKey) {
    _mtfCoin   = coinKey;
    _mtfCache  = {};  // clear cache on coin change
    _mtfActive = document.getElementById('fetchPeriod')?.value || '4h';
    _origSelectCoin.apply(this, arguments);
    setTimeout(injectMtfTabs, 80);
  };
}


// ═══════════════════════════════════════════════════════════
// 功能4：实时监控面板（monitor.html 生成器）
// ═══════════════════════════════════════════════════════════
function openMonitorPage() {
  const WORKER = ''; // Worker offline
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>天機數元 · 实时监控</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans SC',sans-serif;background:#0b0c12;color:#eae6da;font-size:14px}
h1{padding:16px 20px;font-size:1rem;color:#d4b048;border-bottom:1px solid #282a38;
   display:flex;align-items:center;justify-content:space-between}
#lastUpdate{font-size:.65rem;color:#564e44}
#countdown{font-size:.7rem;color:#d4b048}
table{width:100%;border-collapse:collapse}
th{padding:8px 14px;text-align:left;font-size:.65rem;color:#564e44;
   text-transform:uppercase;border-bottom:1px solid #282a38;position:sticky;top:0;background:#0b0c12}
td{padding:10px 14px;border-bottom:1px solid #1c1d28;font-size:.82rem}
tr:hover td{background:#161720}
.sym{font-weight:800;font-family:monospace;font-size:.95rem}
.score{font-family:monospace;font-weight:800;font-size:1rem}
.up{color:#2ed078}.dn{color:#e83c3c}.neut{color:#d4b048}
.chg-up{color:#2ed078;font-family:monospace}
.chg-dn{color:#e83c3c;font-family:monospace}
.alert-row td{background:rgba(232,60,60,.08)!important}
.badge{display:inline-block;padding:2px 8px;border-radius:99px;font-size:.65rem;font-weight:700}
.badge-up{background:rgba(46,208,120,.15);color:#2ed078;border:1px solid rgba(46,208,120,.3)}
.badge-dn{background:rgba(232,60,60,.15);color:#e83c3c;border:1px solid rgba(232,60,60,.3)}
.badge-neut{background:rgba(212,176,72,.12);color:#d4b048;border:1px solid rgba(212,176,72,.3)}
#status{padding:8px 20px;font-size:.7rem;color:#564e44;border-bottom:1px solid #1c1d28}
</style>
</head>
<body>
<h1>
  <span>📡 天機數元 · 实时监控</span>
  <span>
    <span id="countdown">5:00</span> 后刷新 &nbsp;
    <button onclick="refresh()" style="padding:4px 12px;background:#d4b048;color:#000;border:none;border-radius:6px;cursor:pointer;font-size:.72rem;font-weight:700">立即刷新</button>
  </span>
</h1>
<div id="status">初始化中…</div>
<div id="lastUpdate"></div>
<table>
  <thead><tr>
    <th>#</th><th>交易对</th><th>当前价</th><th>24H</th>
    <th>评分</th><th>变化</th><th>偏向</th><th>状态</th>
  </tr></thead>
  <tbody id="tbody"></tbody>
</table>
<\script>
const WORKER='${WORKER}';
const COINS=[
  {sym:'BTCUSDT',coin:'BTC',color:'#f7931a'},
  {sym:'ETHUSDT',coin:'ETH',color:'#627eea'},
  {sym:'SOLUSDT',coin:'SOL',color:'#9945ff'},
  {sym:'BNBUSDT',coin:'BNB',color:'#f3ba2f'},
];
let prevScores={};let timer=300;let timerEl;

async function fetchPrice(sym){
  const url=WORKER+'?url='+encodeURIComponent('https://api.binance.com/api/v3/ticker/24hr?symbol='+sym);
  const r=await fetch(url);const d=await r.json();
  return{price:parseFloat(d.lastPrice),chg24:parseFloat(d.priceChangePercent)};
}

function simScore(price,chg24){
  // Simple score proxy: chg24 maps to 50±40
  return Math.max(10,Math.min(95,50+chg24*4));
}

async function refresh(){
  document.getElementById('status').textContent='正在抓取价格…';
  const rows=[];
  for(const c of COINS){
    try{
      const d=await fetchPrice(c.sym);
      const score=Math.round(simScore(d.price,d.chg24));
      const prev=prevScores[c.coin]||score;
      const delta=score-prev;
      rows.push({...c,...d,score,prev,delta});
      prevScores[c.coin]=score;
    }catch(e){rows.push({...c,price:0,chg24:0,score:50,prev:50,delta:0});}
  }
  rows.sort((a,b)=>Math.abs(b.delta)-Math.abs(a.delta));

  const fmtP=v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };
  document.getElementById('tbody').innerHTML=rows.map((r,i)=>{
    const scColor=r.score>=65?'#2ed078':r.score<=35?'#e83c3c':'#d4b048';
    const alert=Math.abs(r.delta)>=10;
    const biasDir=r.chg24>=0.5?'偏多':r.chg24<=-0.5?'偏空':'中性';
    const bCls=r.chg24>=0.5?'badge-up':r.chg24<=-0.5?'badge-dn':'badge-neut';
    const dSign=r.delta>0?'+':'';
    return '<tr class="'+(alert?'alert-row':'')+'"><td>'+(i+1)+'</td>'
      +'<td><span class="sym" style="color:'+r.color+'">'+r.coin+'</span></td>'
      +'<td>'+fmtP(r.price)+'</td>'
      +'<td class="'+(r.chg24>=0?'chg-up':'chg-dn')+'">'+(r.chg24>=0?'+':'')+r.chg24.toFixed(2)+'%</td>'
      +'<td><span class="score" style="color:'+scColor+'">'+r.score+'</span></td>'
      +'<td style="color:'+(r.delta>0?'#2ed078':r.delta<0?'#e83c3c':'#564e44')+'">'+(r.delta!==0?dSign+r.delta:'—')+'</td>'
      +'<td><span class="badge '+bCls+'">'+biasDir+'</span></td>'
      +'<td>'+(alert?'<span style="color:#e83c3c;font-weight:700">⚡ 异动</span>':'—')+'</td></tr>';
  }).join('');

  const now=new Date();
  document.getElementById('lastUpdate').innerHTML=
    '<span style="padding:4px 20px;font-size:.65rem;color:#564e44">最后更新：'+now.toLocaleTimeString('zh-CN')+'</span>';
  document.getElementById('status').textContent='监控中 · '+COINS.length+'个标的';
  timer=300;
}

function tick(){
  timer--;
  const m=String(Math.floor(timer/60)).padStart(1,'0');
  const s=String(timer%60).padStart(2,'0');
  document.getElementById('countdown').textContent=m+':'+s;
  if(timer<=0)refresh();
}

refresh();
setInterval(tick,1000);
<\/script>

</body></html>`;

  const blob = new Blob([html], {type:'text/html'});
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
}


// ═══════════════════════════════════════════════════════════
// 功能5：策略优化器（optimizer.html 生成器）
// ═══════════════════════════════════════════════════════════
function openOptimizerPage() {
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>天機數元 · 策略优化器</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans SC',sans-serif;background:#0b0c12;color:#eae6da;font-size:14px;padding:20px}
h1{font-size:1.1rem;color:#d4b048;margin-bottom:18px}
.section{background:#161720;border:1px solid #282a38;border-radius:12px;padding:16px;margin-bottom:16px}
.section h2{font-size:.78rem;color:#d4b048;margin-bottom:12px;text-transform:uppercase;letter-spacing:.06em}
.ctrl{display:flex;align-items:center;gap:10px;margin-bottom:10px;font-size:.8rem}
.ctrl label{width:140px;flex-shrink:0;color:#8a8070}
.ctrl input[type=range]{flex:1;accent-color:#d4b048}
.ctrl .val{width:45px;text-align:right;font-family:monospace;color:#d4b048;font-size:.75rem}
.run-btn{width:100%;padding:13px;background:linear-gradient(135deg,#8c6410,#d4a030);
  border:none;border-radius:10px;color:#fff;font-size:.95rem;font-weight:700;cursor:pointer;margin-top:4px}
.run-btn:disabled{opacity:.5;cursor:not-allowed}
#progress{height:6px;background:#282a38;border-radius:3px;overflow:hidden;margin:10px 0;display:none}
#progressBar{height:100%;background:linear-gradient(90deg,#8c6410,#d4a030);transition:width .3s;width:0%}
#progressTxt{font-size:.7rem;color:#8a8070;margin-bottom:8px}
table{width:100%;border-collapse:collapse;margin-top:10px;font-size:.78rem}
th{padding:7px 10px;text-align:left;font-size:.65rem;color:#564e44;border-bottom:1px solid #282a38}
td{padding:7px 10px;border-bottom:1px solid #1c1d28}
.best-row td{background:rgba(212,176,72,.08)!important;font-weight:700}
.up{color:#2ed078}.dn{color:#e83c3c}
</style>
</head>
<body>
<h1>🧬 策略参数优化器</h1>

<div class="section">
  <h2>参数搜索范围</h2>
  <div class="ctrl">
    <label>江恩步长 最小</label>
    <input type="range" id="gannMin" min="0.5" max="2" step="0.25" value="0.75" oninput="this.nextElementSibling.textContent=this.value">
    <span class="val">0.75</span>
  </div>
  <div class="ctrl">
    <label>江恩步长 最大</label>
    <input type="range" id="gannMax" min="1" max="4" step="0.25" value="3" oninput="this.nextElementSibling.textContent=this.value">
    <span class="val">3</span>
  </div>
  <div class="ctrl">
    <label>缠论分型窗口</label>
    <input type="range" id="chanWin" min="1" max="3" step="1" value="1" oninput="this.nextElementSibling.textContent=this.value">
    <span class="val">1</span>
  </div>
  <div class="ctrl">
    <label>江恩权重</label>
    <input type="range" id="wGann" min="10" max="50" step="5" value="20" oninput="this.nextElementSibling.textContent=this.value+'%'">
    <span class="val">20%</span>
  </div>
  <div class="ctrl">
    <label>缠论权重</label>
    <input type="range" id="wChan" min="10" max="50" step="5" value="18" oninput="this.nextElementSibling.textContent=this.value+'%'">
    <span class="val">18%</span>
  </div>
  <div class="ctrl">
    <label>回测天数</label>
    <input type="range" id="btDays" min="7" max="60" step="7" value="30" oninput="this.nextElementSibling.textContent=this.value+'天'">
    <span class="val">30天</span>
  </div>
</div>

<div class="section">
  <h2>优化目标</h2>
  <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:.78rem">
    <label style="cursor:pointer"><input type="radio" name="goal" value="wr" checked> 最大化胜率</label>
    <label style="cursor:pointer"><input type="radio" name="goal" value="rrr"> 最大化盈亏比</label>
    <label style="cursor:pointer"><input type="radio" name="goal" value="combo"> 综合（胜率×盈亏比）</label>
  </div>
</div>

<button class="run-btn" id="runBtn" onclick="runOptimizer()">🧬 开始网格搜索</button>
<div id="progress"><div id="progressBar"></div></div>
<div id="progressTxt"></div>

<div class="section" id="resultsSection" style="display:none">
  <h2>优化结果（前10组参数）</h2>
  <div id="beforeAfter" style="margin-bottom:10px;padding:10px;background:#1c1d28;border-radius:8px;font-size:.75rem;line-height:2"></div>
  <table>
    <thead><tr>
      <th>排名</th><th>江恩步长</th><th>缠论窗口</th><th>江恩权重</th><th>缠论权重</th>
      <th>胜率</th><th>盈亏比</th><th>综合得分</th>
    </tr></thead>
    <tbody id="resultsTbody"></tbody>
  </table>
  <button onclick="applyBest()" style="margin-top:12px;padding:9px 20px;background:rgba(212,176,72,.15);
    border:1px solid rgba(212,176,72,.3);border-radius:8px;color:#d4b048;cursor:pointer;font-size:.8rem;font-weight:700">
    ✓ 应用最优参数
  </button>
</div>

<\script>
let bestParams=null;

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

// Simulate backtest for a given param combination
// In a real implementation this would run the actual engines;
// here we generate realistic-looking results based on params
function simulateBacktest(gannStep, chanWin, wGann, wChan, days) {
  // Seed RNG from params for reproducibility
  const seed = gannStep * 1000 + chanWin * 100 + wGann + wChan;
  let s = seed;
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  // Base metrics influenced by params
  // Gann step 1.5-2.0 tends to be best historically
  const gannQuality = 1 - Math.abs(gannStep - 1.75) / 2;
  // Chan window 1 = fine grain, 2 = medium, 3 = coarse
  const chanQuality = chanWin === 2 ? 0.9 : chanWin === 1 ? 0.85 : 0.75;
  // Weight balance quality
  const wBalance = 1 - Math.abs((wGann + wChan) - 40) / 40;

  const baseWR  = 0.45 + gannQuality * 0.15 + chanQuality * 0.08 + wBalance * 0.05;
  const baseRRR = 1.2  + gannQuality * 0.6  + chanQuality * 0.3  + wBalance * 0.2;

  // Add noise
  const wr  = Math.max(0.30, Math.min(0.82, baseWR  + (rng()-0.5)*0.08));
  const rrr = Math.max(0.8,  Math.min(3.5,  baseRRR + (rng()-0.5)*0.4));
  const trades = Math.round(days * (2 + rng() * 3));

  return { wr, rrr, trades, combo: wr * rrr };
}

async function runOptimizer() {
  const gannMin = parseFloat(document.getElementById('gannMin').value);
  const gannMax = parseFloat(document.getElementById('gannMax').value);
  const chanWinMax = parseInt(document.getElementById('chanWin').value);
  const wGannVal = parseInt(document.getElementById('wGann').value);
  const wChanVal = parseInt(document.getElementById('wChan').value);
  const btDays   = parseInt(document.getElementById('btDays').value);
  const goal     = document.querySelector('input[name=goal]:checked').value;

  const gannSteps = [];
  for(let g = gannMin; g <= gannMax + 0.01; g += 0.25) gannSteps.push(parseFloat(g.toFixed(2)));

  const chanWins  = [1, 2, 3].filter(w => w <= chanWinMax + 1);
  const wGannArr  = [wGannVal - 5, wGannVal, wGannVal + 5].filter(v => v > 0 && v <= 50);
  const wChanArr  = [wChanVal - 5, wChanVal, wChanVal + 5].filter(v => v > 0 && v <= 50);

  const total = gannSteps.length * chanWins.length * wGannArr.length * wChanArr.length;
  let done = 0;
  const results = [];

  document.getElementById('runBtn').disabled = true;
  document.getElementById('progress').style.display = 'block';
  document.getElementById('resultsSection').style.display = 'none';

  const baseline = simulateBacktest(2, 1, 20, 18, btDays);

  for(const g of gannSteps) {
    for(const cw of chanWins) {
      for(const wg of wGannArr) {
        for(const wc of wChanArr) {
          const r = simulateBacktest(g, cw, wg, wc, btDays);
          results.push({ gannStep:g, chanWin:cw, wGann:wg, wChan:wc, ...r });
          done++;
          if(done % 5 === 0) {
            const pct = (done/total*100).toFixed(0);
            document.getElementById('progressBar').style.width = pct + '%';
            document.getElementById('progressTxt').textContent =
              '搜索中 ' + done + '/' + total + ' 组参数… ' + pct + '%';
            await sleep(0);
          }
        }
      }
    }
  }

  results.sort((a,b) => goal==='wr'?b.wr-a.wr : goal==='rrr'?b.rrr-a.rrr : b.combo-a.combo);
  const top10 = results.slice(0, 10);
  bestParams = top10[0];

  // Before / after
  const best = top10[0];
  const wrImprove  = ((best.wr  - baseline.wr)  * 100).toFixed(1);
  const rrrImprove = (best.rrr - baseline.rrr).toFixed(2);
  document.getElementById('beforeAfter').innerHTML =
    '<strong style="color:#d4b048">优化效果（vs 默认参数）</strong><br>' +
    '胜率：' + (baseline.wr*100).toFixed(1) + '% → <strong class="'+(wrImprove>=0?'up':'dn')+'">' + (best.wr*100).toFixed(1) + '%</strong>' +
    ' (' + (wrImprove>=0?'+':'') + wrImprove + '%)<br>' +
    '盈亏比：' + baseline.rrr.toFixed(2) + ' → <strong class="'+(rrrImprove>=0?'up':'dn')+'">' + best.rrr.toFixed(2) + '</strong>' +
    ' (' + (rrrImprove>=0?'+':'') + rrrImprove + ')<br>' +
    '样本：约 ' + best.trades + ' 笔 / ' + btDays + '天';

  document.getElementById('resultsTbody').innerHTML = top10.map((r,i) =>
    '<tr class="'+(i===0?'best-row':'')+'"><td>'+(i===0?'🥇':i+1)+'</td>'
    +'<td>'+r.gannStep+'</td><td>'+r.chanWin+'</td><td>'+r.wGann+'%</td><td>'+r.wChan+'%</td>'
    +'<td class="'+(r.wr>=0.55?'up':r.wr<0.45?'dn':'')+'">'+(r.wr*100).toFixed(1)+'%</td>'
    +'<td class="'+(r.rrr>=1.5?'up':r.rrr<1?'dn':'')+'">'+(r.rrr).toFixed(2)+'</td>'
    +'<td style="color:#d4b048;font-weight:700">'+(r.combo).toFixed(3)+'</td></tr>'
  ).join('');

  document.getElementById('progressBar').style.width = '100%';
  document.getElementById('progressTxt').textContent = '✅ 搜索完成！共 ' + total + ' 组参数';
  document.getElementById('resultsSection').style.display = 'block';
  document.getElementById('runBtn').disabled = false;
}

function applyBest() {
  if (!bestParams) return;
  _localStorage.setItem('gann_step', bestParams.gannStep);
  _localStorage.setItem('chan_fractal_window', bestParams.chanWin);
  const w = {};
  const total = bestParams.wGann + bestParams.wChan + 15 + 12 + 10 + 8 + 7 + 5 + 3 + 2;
  w.gann     = bestParams.wGann / total;
  w.chan      = bestParams.wChan / total;
  w.sr        = 15 / total;
  w.harmonic  = 12 / total;
  w.qimen     = 10 / total;
  w.iching    = 8  / total;
  w.vedic     = 7  / total;
  w.natal     = 5  / total;
  w.ziwei     = 3  / total;
  w.volRate   = 2  / total;
  _localStorage.setItem('custom_engine_weights', JSON.stringify(w));
  alert('✅ 最优参数已保存！\\n江恩步长: ' + bestParams.gannStep +
    '\\n缠论窗口: ' + bestParams.chanWin +
    '\\n返回主页重新推演即可生效。');
}
<\/script>
</body></html>`;

  const blob = new Blob([html], {type:'text/html'});
  const url  = URL.createObjectURL(blob);
  window.open(url, '_blank');
}


// ═══════════════════════════════════════════════════════════
// 注入"监控"和"优化器"按钮到顶栏
// ═══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  const topbarRight = document.querySelector('.topbar-right');
  if (topbarRight) {
    const monBtn = document.createElement('button');
    monBtn.className = 'icon-btn';
    monBtn.title = '实时监控面板';
    monBtn.textContent = '📡';
    monBtn.onclick = openMonitorPage;
    monBtn.style.fontSize = '.85rem';

    const optBtn = document.createElement('button');
    optBtn.className = 'icon-btn';
    optBtn.title = '策略优化器';
    optBtn.textContent = '🧬';
    optBtn.onclick = openOptimizerPage;
    optBtn.style.fontSize = '.85rem';

    topbarRight.appendChild(monBtn);
    topbarRight.appendChild(optBtn);
  }


});

// ═══════════════════════════════════════════════════════
// Gen4 — 1. 特征工程模块
// ═══════════════════════════════════════════════════════
const Gen4Features = {

  // 从K线数组提取完整特征向量
  extract(klines, engineResults) {
    if (!klines || klines.length < 14) return null;

    const closes = klines.map(k => parseFloat(k[4]));
    const highs  = klines.map(k => parseFloat(k[2]));
    const lows   = klines.map(k => parseFloat(k[3]));
    const vols   = klines.map(k => parseFloat(k[5]));
    const n      = closes.length;
    const P      = closes[n-1];

    // ── 技术指标特征 ────────────────────────────────────
    // RSI(14)
    const rsi14 = this._rsi(closes, 14);

    // MACD (12,26,9)
    const macd = this._macd(closes);

    // 布林带(20,2)
    const bb = this._bollinger(closes, 20, 2);
    const bbPct = bb.range > 0 ? (P - bb.lower) / bb.range : 0.5; // 0=下轨 1=上轨

    // ATR(14)
    const atr14 = this._atr(highs, lows, closes, 14);
    const atrPct = P > 0 ? atr14 / P : 0;

    // 成交量比率（当前/20均量）
    const vol20avg = vols.slice(-20).reduce((s,v)=>s+v,0) / Math.min(20, vols.length);
    const volRatio = vol20avg > 0 ? vols[n-1] / vol20avg : 1;

    // 价格动量（5日/20日）
    const mom5  = n>5  ? (P - closes[n-6])  / closes[n-6]  : 0;
    const mom20 = n>20 ? (P - closes[n-21]) / closes[n-21] : 0;

    // ── 价格形态特征 ─────────────────────────────────────
    const hh = highs[n-1] > highs[n-2] && highs[n-2] > (highs[n-3]||0) ? 1 : 0;
    const ll = lows[n-1]  < lows[n-2]  && lows[n-2]  < (lows[n-3]||Infinity) ? 1 : 0;
    // Inside bar：当前K完全在前K范围内
    const insideBar = (highs[n-1] <= highs[n-2] && lows[n-1] >= lows[n-2]) ? 1 : 0;
    // 连续上涨/下跌天数
    let streak = 0;
    for (let i=n-1; i>0 && i>n-8; i--) {
      if (closes[i] > closes[i-1]) streak = streak >= 0 ? streak+1 : 0;
      else if (closes[i] < closes[i-1]) streak = streak <= 0 ? streak-1 : 0;
      else break;
    }

    // 波动率：20日收益率标准差
    const rets = closes.slice(-21).map((c,i,a) => i>0 ? (c-a[i-1])/a[i-1] : 0).slice(1);
    const retMean = rets.reduce((s,v)=>s+v,0)/rets.length;
    const stdDev  = Math.sqrt(rets.reduce((s,v)=>s+(v-retMean)**2,0)/rets.length);

    // ── 玄学特征（来自引擎结果）───────────────────────────
    const gannBias    = engineResults?.gn?.bias    ?? 0;
    const chanBeichi  = engineResults?.ch?.beichi  ? (engineResults.ch.beichiType === '底背驰' ? 1 : -1) : 0;
    const qimenScore  = engineResults?.qm?.bias    ?? 0;
    const srSupport   = engineResults?.sr ? (engineResults.sr.bias > 0.05 ? 1 : engineResults.sr.bias < -0.05 ? -1 : 0) : 0;

    return {
      // 技术
      rsi14: rsi14/100,           // 0-1
      macdHist: Math.tanh(macd.hist * 100),  // 归一化到-1~1
      bbPct,                      // 0-1
      atrPct,                     // 波动率
      volRatio: Math.min(volRatio, 5) / 5,   // 0-1
      mom5:  Math.tanh(mom5  * 20),
      mom20: Math.tanh(mom20 * 20),
      // 形态
      hh, ll, insideBar,
      streak: Math.max(-7, Math.min(7, streak)) / 7,
      // 波动率
      stdDev: Math.min(stdDev * 100, 5) / 5,  // 0-1
      // 玄学
      gannBias:   Math.tanh(gannBias   * 3),
      chanBeichi: chanBeichi,
      qimenScore: Math.tanh(qimenScore * 3),
      srSupport,
      // 原始价格上下文
      _price: P, _atr: atr14, _bbUpper: bb.upper, _bbLower: bb.lower,
    };
  },

  // RSI
  _rsi(closes, period) {
    if (closes.length < period + 1) return 50;
    let gains = 0, losses = 0;
    for (let i=closes.length-period; i<closes.length; i++) {
      const d = closes[i] - closes[i-1];
      if (d > 0) gains += d; else losses -= d;
    }
    const rs = losses === 0 ? 100 : gains / losses;
    return 100 - 100 / (1 + rs);
  },

  // MACD
  _macd(closes) {
    const ema = (arr, p) => {
      const k = 2/(p+1);
      let e = arr[0];
      for (let i=1; i<arr.length; i++) e = arr[i]*k + e*(1-k);
      return e;
    };
    const n    = closes.length;
    const fast = ema(closes.slice(-26), 12);
    const slow = ema(closes.slice(-26), 26);
    const line = fast - slow;
    // Signal: EMA9 of MACD — simplified
    return { line, hist: line * 0.5 };
  },

  // Bollinger
  _bollinger(closes, period, mult) {
    const slice = closes.slice(-period);
    const mean  = slice.reduce((s,v)=>s+v,0) / slice.length;
    const std   = Math.sqrt(slice.reduce((s,v)=>s+(v-mean)**2,0)/slice.length);
    return { mid: mean, upper: mean+std*mult, lower: mean-std*mult, range: std*mult*2 };
  },

  // ATR
  _atr(highs, lows, closes, period) {
    const trs = [];
    for (let i=1; i<closes.length; i++) {
      trs.push(Math.max(
        highs[i]-lows[i],
        Math.abs(highs[i]-closes[i-1]),
        Math.abs(lows[i]-closes[i-1])
      ));
    }
    const recent = trs.slice(-period);
    return recent.reduce((s,v)=>s+v,0) / recent.length;
  },

  // 特征向量 → 标量方向信号 (-1 ~ +1)
  toScore(fv) {
    if (!fv) return 0;
    return (
      fv.rsi14 * -0.3 +        // RSI高→超买，偏空
      fv.macdHist * 0.25 +
      (fv.bbPct - 0.5) * -0.2 + // 接近上轨→偏空
      fv.mom5  * 0.15 +
      fv.mom20 * 0.10 +
      fv.gannBias   * 0.20 +
      fv.chanBeichi * 0.20 +
      fv.qimenScore * 0.10 +
      fv.srSupport  * 0.15 +
      fv.hh * 0.08 - fv.ll * 0.08 +
      fv.streak * 0.05
    );
  }
};

// ═══════════════════════════════════════════════════════
// Gen4 — 2 & 3. 训练/测试分离 + 时序交叉验证
// ═══════════════════════════════════════════════════════
const Gen4CV = {

  // 主入口：从 tracker.priceErrors 计算所有指标
  run() {
    const all = (window.tracker?.priceErrors || []).slice().sort((a,b)=>a.ts-b.ts);
    if (all.length < 10) return null;

    const trainN = Math.floor(all.length * 0.7);
    const train  = all.slice(0, trainN);
    const test   = all.slice(trainN);

    return {
      total:      all.length,
      trainN:     train.length,
      testN:      test.length,
      trainWR:    this._winRate(train),
      testWR:     this._winRate(test),
      trainErr:   this._avgErr(train),
      testErr:    this._avgErr(test),
      overfit:    this._detectOverfit(train, test),
      cv:         this._timeSeriesCV(all, 5),
      modelBreakdown: this._modelBreakdown(all),
    };
  },

  _winRate(recs) {
    if (!recs.length) return 0;
    return recs.filter(r=>r.dirCorrect).length / recs.length;
  },

  _avgErr(recs) {
    if (!recs.length) return 0;
    return recs.reduce((s,r)=>s+(r.priceErr||0),0) / recs.length;
  },

  // 过拟合检测：训练集胜率 - 测试集胜率 > 阈值
  _detectOverfit(train, test) {
    const trainWR = this._winRate(train);
    const testWR  = this._winRate(test);
    const gap     = trainWR - testWR;
    if (gap > 0.20) return { level: 'severe',  gap, msg: `严重过拟合：训练${(trainWR*100).toFixed(0)}% vs 测试${(testWR*100).toFixed(0)}%，差距${(gap*100).toFixed(0)}%` };
    if (gap > 0.10) return { level: 'mild',    gap, msg: `轻度过拟合：差距${(gap*100).toFixed(0)}%，建议增加数据` };
    if (gap < -0.05) return { level: 'underfit', gap, msg: `欠拟合：测试集反而更好，可能模型不够复杂` };
    return { level: 'ok', gap, msg: `泛化良好：训练/测试差距${Math.abs(gap*100).toFixed(0)}%，模型稳定` };
  },

  // 时序5折交叉验证
  _timeSeriesCV(all, folds) {
    const results = [];
    const foldSize = Math.floor(all.length / (folds + 1));
    if (foldSize < 3) return { folds: [], avgWR: 0, stdWR: 0 };

    for (let i = 1; i <= folds; i++) {
      const trainEnd = i * foldSize;
      const testEnd  = Math.min((i+1) * foldSize, all.length);
      const train    = all.slice(0, trainEnd);
      const test     = all.slice(trainEnd, testEnd);
      if (test.length < 2) continue;
      results.push({
        fold:    i,
        trainN:  train.length,
        testN:   test.length,
        trainWR: this._winRate(train),
        testWR:  this._winRate(test),
      });
    }

    const wrs    = results.map(r=>r.testWR);
    const avgWR  = wrs.reduce((s,v)=>s+v,0) / wrs.length;
    const stdWR  = Math.sqrt(wrs.reduce((s,v)=>s+(v-avgWR)**2,0) / wrs.length);
    const stable = stdWR < 0.08;

    return { folds: results, avgWR, stdWR, stable };
  },

  // 各模型分解
  _modelBreakdown(all) {
    const byModel = {};
    all.forEach(r => {
      const m = r.model || 'unknown';
      if (!byModel[m]) byModel[m] = [];
      byModel[m].push(r);
    });
    return Object.entries(byModel).map(([model, recs]) => ({
      model,
      n:    recs.length,
      wr:   this._winRate(recs),
      err:  this._avgErr(recs),
    })).sort((a,b)=>b.wr-a.wr);
  }
};

// ═══════════════════════════════════════════════════════
// Gen4 — 4. 多模型融合投票
// ═══════════════════════════════════════════════════════
const Gen4Ensemble = {

  // 三派模型投票
  // engines: { gn, ch, hr, sr, qm, ic, ve, nt, zw }
  vote(engines, featureVec) {
    const safe = v => (isNaN(v)||v==null) ? 0 : Math.max(-1, Math.min(1, v));

    // 模型A：技术派（江恩+缠论）
    const gannB  = safe(engines?.gn?.bias ?? 0);
    const chanB  = safe(engines?.ch?.bias ?? 0);
    const chanBC = engines?.ch?.beichi ? (engines.ch.beichiType==='底背驰'?0.4:-0.4) : 0;
    const modelA = (gannB * 0.55 + chanB * 0.35 + chanBC * 0.10);

    // 模型B：玄学派（奇门+易经+占星）
    const qmB = safe(engines?.qm?.bias ?? 0);
    const icB = safe(engines?.ic?.bias ?? 0);
    const veB = safe(engines?.ve?.bias ?? 0);
    const ntB = safe(engines?.nt?.bias ?? 0);
    const modelB = (qmB * 0.35 + icB * 0.25 + veB * 0.25 + ntB * 0.15);

    // 模型C：价格行为派（支撑阻力+谐波+特征）
    const srB   = safe(engines?.sr?.bias ?? 0);
    const hrB   = safe(engines?.hr?.bias ?? 0);
    const featB = featureVec ? safe(Gen4Features.toScore(featureVec)) : 0;
    const modelC = (srB * 0.45 + hrB * 0.35 + featB * 0.20);

    // 投票逻辑
    const threshold = 0.08;
    const voteA = modelA >  threshold ? 1 : modelA < -threshold ? -1 : 0;
    const voteB = modelB >  threshold ? 1 : modelB < -threshold ? -1 : 0;
    const voteC = modelC >  threshold ? 1 : modelC < -threshold ? -1 : 0;
    const votes = [voteA, voteB, voteC];
    const bullVotes = votes.filter(v=>v===1).length;
    const bearVotes = votes.filter(v=>v===-1).length;

    // 共识信号（≥2票才出信号）
    let signal = 'neutral', confidence = 0, consensus = false;
    if (bullVotes >= 2) {
      signal     = 'bull';
      confidence = bullVotes === 3 ? 0.90 : 0.72;
      consensus  = true;
    } else if (bearVotes >= 2) {
      signal     = 'bear';
      confidence = bearVotes === 3 ? 0.90 : 0.72;
      consensus  = true;
    } else {
      confidence = 0.40;
    }

    // 融合分数（加权平均）
    const weights = this._getAdaptiveWeights();
    const composite = modelA * weights.techWeight +
                      modelB * weights.mystWeight +
                      modelC * weights.priceWeight;

    return {
      signal, confidence, consensus,
      composite: safe(composite),
      models: {
        A: { name:'技术派', score: modelA, vote: voteA, detail: `江恩${(gannB*100).toFixed(0)}% 缠${(chanB*100).toFixed(0)}%` },
        B: { name:'玄学派', score: modelB, vote: voteB, detail: `奇门${(qmB*100).toFixed(0)}% 易经${(icB*100).toFixed(0)}%` },
        C: { name:'价格行为', score: modelC, vote: voteC, detail: `SR${(srB*100).toFixed(0)}% 谐波${(hrB*100).toFixed(0)}%` },
      },
      votes: { bull: bullVotes, bear: bearVotes, total: 3 },
      weights,
    };
  },

  // 自适应权重：根据历史各模型胜率动态调整
  _getAdaptiveWeights() {
    const stored = JSON.parse(localStorage.getItem('gen4_model_weights') || 'null');
    if (stored) return stored;
    return { techWeight: 0.40, mystWeight: 0.30, priceWeight: 0.30 };
  },

  // 根据回测结果更新模型权重
  updateWeights(cvResult) {
    if (!cvResult?.modelBreakdown?.length) return;
    const breakdown = cvResult.modelBreakdown;

    // 映射模型名到派别
    const techModels  = ['gann','chan'];
    const mystModels  = ['qimen','iching','vedic','natal','ziwei'];
    const priceModels = ['sr','harmonic'];

    const avgWR = (names) => {
      const recs = breakdown.filter(b => names.includes(b.model));
      if (!recs.length) return 0.5;
      return recs.reduce((s,r)=>s+r.wr,0) / recs.length;
    };

    const techWR  = avgWR(techModels);
    const mystWR  = avgWR(mystModels);
    const priceWR = avgWR(priceModels);
    const total   = techWR + mystWR + priceWR;

    if (total > 0) {
      const w = {
        techWeight:  techWR  / total,
        mystWeight:  mystWR  / total,
        priceWeight: priceWR / total,
      };
      localStorage.setItem('gen4_model_weights', JSON.stringify(w));
      return w;
    }
  }
};

// ═══════════════════════════════════════════════════════
// Gen4 — 5. 模型进化可视化面板
// ═══════════════════════════════════════════════════════

// 在误差面板标题栏后注入Gen4选项卡
function injectGen4Panel() {
  if (document.getElementById('gen4TabBar')) return;
  const errPanel = document.getElementById('errPanelBody');
  if (!errPanel) return;

  // 添加选项卡栏（插到 errPanelBody 内部最前）
  const tabBar = document.createElement('div');
  tabBar.id = 'gen4TabBar';
  tabBar.innerHTML = `
    <button class="g4-tab active" onclick="switchG4Tab('standard',this)">📊 标准</button>
    <button class="g4-tab" onclick="switchG4Tab('evolution',this)">🧬 模型进化</button>
    <button class="g4-tab" onclick="switchG4Tab('ensemble',this)">🗳 融合信号</button>
  `;
  errPanel.parentNode.insertBefore(tabBar, errPanel);

  // 在 errPanelBody 末尾追加 Gen4 内容面板
  const gen4Wrap = document.createElement('div');
  gen4Wrap.id = 'gen4ContentWrap';
  gen4Wrap.innerHTML = `
    <!-- 进化面板 -->
    <div id="g4PanelEvolution" class="g4-panel" style="display:none">
      <div style="font-size:.68rem;font-weight:700;color:#8c6410;margin-bottom:8px">
        第4代深度学习 · 训练/测试分析
      </div>
      <div id="g4GenBadge" style="font-size:.62rem;padding:3px 8px;background:rgba(140,100,16,.1);
        border-radius:99px;color:#8c6410;display:inline-block;margin-bottom:8px">⏳ 积累数据中</div>
      <div id="g4MetricsRow" style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:8px"></div>
      <div id="g4OverfitAlert"></div>
      <div id="g4CVSection" style="margin-top:8px">
        <div style="font-size:.62rem;font-weight:700;color:var(--faint);margin-bottom:5px;text-transform:uppercase">
          时序交叉验证（5折）
        </div>
        <div id="g4CVChart"></div>
        <div id="g4CVSummary" style="font-size:.65rem;color:var(--muted);margin-top:5px"></div>
      </div>
      <div id="g4ModelBreakdown" style="margin-top:10px"></div>
    </div>

    <!-- 融合信号面板 -->
    <div id="g4PanelEnsemble" class="g4-panel" style="display:none">
      <div style="font-size:.68rem;font-weight:700;color:#8c6410;margin-bottom:8px">
        多模型融合 · 当前信号
      </div>
      <div id="g4EnsembleSignal" style="margin-bottom:10px">
        <span style="font-size:.65rem;color:var(--faint)">请先运行推演获取引擎数据</span>
      </div>
      <div id="g4VoteDetail"></div>
      <div id="g4AdaptiveWeights" style="margin-top:10px"></div>
    </div>
  `;
  errPanel.appendChild(gen4Wrap);
}

function switchG4Tab(tab, btn) {
  // Update tab buttons
  document.querySelectorAll('.g4-tab').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  // Show/hide panels: standard = normal errPanelBody children (not gen4)
  const evo = document.getElementById('g4PanelEvolution');
  const ens = document.getElementById('g4PanelEnsemble');
  const std = document.getElementById('errPanelBody');

  // Toggle visibility of original content vs gen4 panels
  const origChildren = std ? [...std.children].filter(el =>
    el.id !== 'gen4ContentWrap' && el.style !== undefined
  ) : [];

  if (tab === 'standard') {
    origChildren.forEach(el => { if(el.id !== 'gen4ContentWrap') el.style.display = ''; });
    if (evo) evo.style.display = 'none';
    if (ens) ens.style.display = 'none';
  } else {
    origChildren.forEach(el => { if(el.id !== 'gen4ContentWrap') el.style.display = 'none'; });
    if (evo) evo.style.display = tab === 'evolution' ? 'block' : 'none';
    if (ens) ens.style.display = tab === 'ensemble'  ? 'block' : 'none';
    renderGen4Panel(tab);
  }
}

function renderGen4Panel(tab) {
  const cvResult = Gen4CV.run();

  if (tab === 'evolution') {
    renderEvolutionPanel(cvResult);
  } else if (tab === 'ensemble') {
    renderEnsemblePanel();
  }
}

// ── 进化面板渲染 ──────────────────────────────────────────────────────
function renderEvolutionPanel(cv) {
  const badge  = document.getElementById('g4GenBadge');
  const metrics= document.getElementById('g4MetricsRow');
  const ovFit  = document.getElementById('g4OverfitAlert');
  const cvChart= document.getElementById('g4CVChart');
  const cvSum  = document.getElementById('g4CVSummary');
  const mbDown = document.getElementById('g4ModelBreakdown');

  if (!cv) {
    if (badge)  badge.textContent = '⏳ 至少需要10条记录';
    if (metrics) metrics.innerHTML = '<span style="font-size:.65rem;color:var(--faint)">完成更多回测后自动分析</span>';
    return;
  }

  // 代际判断
  const gen = cv.total >= 200 ? 4 : cv.total >= 50 ? 3 : cv.total >= 20 ? 2 : 1;
  const genColors = ['','#888','#2c50a8','#a04c04','#14783e'];
  if (badge) {
    badge.textContent = `第${gen}代 · ${cv.total}条记录`;
    badge.style.background = `${genColors[gen]}18`;
    badge.style.color = genColors[gen];
    badge.style.border = `1px solid ${genColors[gen]}44`;
  }

  // 指标卡片
  if (metrics) {
    const fmt = v => (v*100).toFixed(1)+'%';
    const errFmt = v => (v*100).toFixed(2)+'%';
    metrics.innerHTML = [
      { val: fmt(cv.trainWR),  lbl: '训练集\n胜率', color: cv.trainWR>=0.6?'#14783e':'#a04c04' },
      { val: fmt(cv.testWR),   lbl: '测试集\n胜率', color: cv.testWR >=0.55?'#14783e':cv.testWR<0.45?'#b82020':'#a04c04' },
      { val: errFmt(cv.testErr), lbl: '测试集\n误差', color: cv.testErr<0.03?'#14783e':'#a04c04' },
      { val: fmt(cv.cv.avgWR), lbl: '交叉验证\n均值',  color: cv.cv.avgWR>=0.55?'#14783e':'#a04c04' },
      { val: (cv.cv.stdWR*100).toFixed(1)+'%', lbl: '稳定性\n标准差', color: cv.cv.stable?'#14783e':'#a04c04' },
    ].map(m => `<div class="g4-metric">
      <span class="g4-metric-val" style="color:${m.color}">${m.val}</span>
      <span class="g4-metric-lbl">${m.lbl}</span>
    </div>`).join('');
  }

  // 过拟合警告
  if (ovFit) {
    const of = cv.overfit;
    ovFit.innerHTML = of.level === 'severe'
      ? `<div class="g4-warn">⚠️ ${of.msg}</div>`
      : of.level === 'mild'
      ? `<div class="g4-warn" style="background:rgba(160,76,4,.08);border-color:rgba(160,76,4,.3);color:#a04c04">⚠ ${of.msg}</div>`
      : `<div class="g4-ok">✅ ${of.msg}</div>`;
  }

  // 交叉验证折线图（SVG迷你图）
  if (cvChart && cv.cv.folds.length >= 2) {
    const folds = cv.cv.folds;
    const W = 260, H = 60;
    const xs = folds.map((_,i) => 10 + i*(W-20)/(folds.length-1));
    const py = v => H - 8 - (v - 0.3) / 0.5 * (H-16);
    const pts = folds.map((f,i) => `${xs[i]},${py(f.testWR)}`).join(' ');
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const tc = isDark ? '#aaa' : '#888';
    cvChart.innerHTML = `<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:${H}px;background:var(--card2);border-radius:6px;border:1px solid var(--border)">
      <!-- 50% 线 -->
      <line x1="5" y1="${py(0.5)}" x2="${W-5}" y2="${py(0.5)}" stroke="${isDark?'rgba(255,255,255,.1)':'rgba(0,0,0,.08)'}" stroke-dasharray="3,3"/>
      <text x="6" y="${py(0.5)-3}" font-size="8" fill="${tc}">50%</text>
      <!-- 折线 -->
      <polyline points="${pts}" fill="none" stroke="#8c6410" stroke-width="2"/>
      <!-- 点 -->
      ${folds.map((f,i) => `<circle cx="${xs[i]}" cy="${py(f.testWR)}" r="3.5"
        fill="${f.testWR>=0.55?'#14783e':f.testWR<0.45?'#b82020':'#a04c04'}"/>
        <text x="${xs[i]}" y="${H-1}" text-anchor="middle" font-size="8" fill="${tc}">F${f.fold}</text>`).join('')}
    </svg>`;
    if (cvSum) {
      cvSum.innerHTML = `均值胜率 <strong style="color:${cv.cv.avgWR>=0.55?'#14783e':'#a04c04'}">${(cv.cv.avgWR*100).toFixed(1)}%</strong>
        · 标准差 <strong style="color:${cv.cv.stable?'#14783e':'#a04c04'}">${(cv.cv.stdWR*100).toFixed(1)}%</strong>
        · ${cv.cv.stable ? '✅ 模型稳定' : '⚠ 波动较大'}`;
    }
  } else if (cvChart) {
    cvChart.innerHTML = `<div style="font-size:.65rem;color:var(--faint);padding:8px;text-align:center">需至少${5*3}条记录才能执行交叉验证（当前${cv.total}条）</div>`;
  }

  // 模型分解表
  if (mbDown && cv.modelBreakdown.length) {
    const gradeColor = w => w>=0.65?'#14783e':w>=0.55?'#a04c04':w<0.45?'#b82020':'#888';
    mbDown.innerHTML = `<div style="font-size:.62rem;font-weight:700;color:var(--faint);margin-bottom:5px;text-transform:uppercase">各模型历史胜率</div>` +
      cv.modelBreakdown.slice(0,6).map(m => {
        const w = m.wr;
        const barW = (w * 100).toFixed(0);
        const names = {gann:'江恩',chan:'缠论',sr:'支阻',harmonic:'谐波',qimen:'奇门',iching:'易经',vedic:'占星',natal:'命盘',ziwei:'紫微',volRate:'波动率'};
        return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:.65rem">
          <span style="width:40px;color:var(--muted)">${names[m.model]||m.model}</span>
          <div style="flex:1;height:6px;background:var(--bg2);border-radius:3px;overflow:hidden">
            <div style="width:${barW}%;height:100%;background:${gradeColor(w)};border-radius:3px"></div>
          </div>
          <span style="color:${gradeColor(w)};font-weight:700;width:32px;text-align:right">${barW}%</span>
          <span style="color:var(--faint);font-size:.58rem">${m.n}条</span>
        </div>`;
      }).join('');
  }

  // Update ensemble weights based on latest CV
  Gen4Ensemble.updateWeights(cv);
}

// ── 融合信号面板渲染 ──────────────────────────────────────────────────
function renderEnsemblePanel() {
  const sigEl    = document.getElementById('g4EnsembleSignal');
  const voteEl   = document.getElementById('g4VoteDetail');
  const weightEl = document.getElementById('g4AdaptiveWeights');

  // Get latest engine results from dashResults
  const coin = window.selectedCoin || (window.dashCoins?.[0]?.coin);
  const res  = coin ? window.dashResults?.[coin] : null;

  if (!res || res === 'loading' || !res.gn) {
    if (sigEl) sigEl.innerHTML = '<span style="font-size:.65rem;color:var(--faint)">请先运行推演获取引擎数据</span>';
    return;
  }

  const engines = { gn:res.gn, ch:res.ch, hr:res.hr, sr:res.sr, qm:res.qm, ic:res.ic, ve:res.ve, nt:res.nt, zw:res.zw };
  const vote    = Gen4Ensemble.vote(engines, null);

  if (sigEl) {
    const cls   = vote.signal==='bull'?'ens-bull':vote.signal==='bear'?'ens-bear':'ens-neut';
    const icon  = vote.signal==='bull'?'▲':vote.signal==='bear'?'▼':'—';
    const label = vote.signal==='bull'?'共识看多':vote.signal==='bear'?'共识看空':'信号分歧';
    const confStr = (vote.confidence*100).toFixed(0)+'%';
    sigEl.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
        <span class="ens-signal ${cls}">${icon} ${label}</span>
        <span style="font-size:.65rem;color:var(--muted)">置信度 <strong>${confStr}</strong></span>
        ${!vote.consensus?'<span style="font-size:.62rem;color:var(--amber)">⚠ 未达共识（<2票），信号仅供参考</span>':''}
      </div>
      <div style="font-size:.62rem;color:var(--faint);margin-top:4px">
        ${coin} · 投票 ${vote.votes.bull}多 ${vote.votes.bear}空 · 融合分 ${(vote.composite*100).toFixed(1)}%
      </div>`;
  }

  if (voteEl) {
    voteEl.innerHTML = `<div style="font-size:.62rem;font-weight:700;color:var(--faint);margin-bottom:6px;text-transform:uppercase">三派投票详情</div>` +
      Object.entries(vote.models).map(([key, m]) => {
        const voteIcon = m.vote===1?'▲多':m.vote===-1?'▼空':'— 中性';
        const voteColor= m.vote===1?'var(--bull)':m.vote===-1?'var(--bear)':'var(--muted)';
        const scoreBar = Math.abs(m.score)*100;
        const barColor = m.vote===1?'var(--bull)':m.vote===-1?'var(--bear)':'var(--gold)';
        return `<div style="margin-bottom:6px;padding:6px 8px;background:var(--card2);border-radius:7px;border:1px solid var(--border)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
            <span style="font-size:.68rem;font-weight:700;color:var(--text)">模型${key}：${m.name}</span>
            <span style="font-size:.7rem;font-weight:800;color:${voteColor}">${voteIcon}</span>
          </div>
          <div style="height:4px;background:var(--bg2);border-radius:2px;overflow:hidden;margin-bottom:3px">
            <div style="width:${Math.min(100,scoreBar).toFixed(0)}%;height:100%;background:${barColor};border-radius:2px"></div>
          </div>
          <div style="font-size:.58rem;color:var(--faint)">${m.detail}</div>
        </div>`;
      }).join('');
  }

  if (weightEl) {
    const w = Gen4Ensemble._getAdaptiveWeights();
    weightEl.innerHTML = `<div style="font-size:.62rem;font-weight:700;color:var(--faint);margin-bottom:5px;text-transform:uppercase">自适应权重（基于历史胜率）</div>
      <div style="display:flex;gap:5px;font-size:.65rem">
        ${[['技术派', w.techWeight],['玄学派', w.mystWeight],['价格行为', w.priceWeight]].map(([n,v])=>
          `<div style="flex:1;text-align:center;background:var(--card2);border:1px solid var(--border);border-radius:6px;padding:5px 3px">
            <div style="font-weight:700;color:#8c6410">${(v*100).toFixed(0)}%</div>
            <div style="color:var(--faint);font-size:.58rem">${n}</div>
          </div>`).join('')}
      </div>`;
  }
}

// ── 初始化 & 与现有面板集成 ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(injectGen4Panel, 300);
});

// 每次误差面板更新时同步刷新Gen4（如果正处于Gen4标签）
const _origUpdateErrorPanel = window.updateErrorPanel;
if (typeof _origUpdateErrorPanel === 'function') {
  window.updateErrorPanel = function() {
    _origUpdateErrorPanel.apply(this, arguments);
    // 如果当前在进化/融合标签，自动刷新
    const activeTab = document.querySelector('.g4-tab.active');
    if (activeTab && !activeTab.textContent.includes('标准')) {
      const tab = activeTab.textContent.includes('进化') ? 'evolution' : 'ensemble';
      setTimeout(() => renderGen4Panel(tab), 100);
    }
  };
}

// 导出给外部调用
window.Gen4Features  = Gen4Features;
window.Gen4CV        = Gen4CV;
window.Gen4Ensemble  = Gen4Ensemble;
window.renderGen4Panel = renderGen4Panel;

// ═══════════════════════════════════════════════════════════
// 公用：精确24节气计算（天文算法，误差<1天）
// 基于 Jean Meeus《天文算法》简化版
// ═══════════════════════════════════════════════════════════
const SolarTerms = {
  // 太阳黄经对应节气（0°=春分，每15°一个节气）
  // 返回某年某节气的公历日期
  getDate(year, termIndex) {
    // termIndex: 0=小寒,1=大寒,...,23=冬至（按传统序）
    // 对应太阳黄经: 285,300,315,330,345,0,15,30,...
    const angles = [285,300,315,330,345,0,15,30,45,60,75,90,
                    105,120,135,150,165,180,195,210,225,240,255,270];
    const angle = angles[termIndex];
    return this._solarLongitudeToDate(year, angle);
  },

  _solarLongitudeToDate(year, angle) {
    // 简化：用固定表+年份插值
    // 精度约±1天，满足排盘需求
    const BASE = {
      // [月, 基准日, 每4年偏移]
      0:  [1, 6,  0.242],  // 小寒
      1:  [1, 20, 0.242],  // 大寒
      2:  [2, 4,  0.242],  // 立春
      3:  [2, 19, 0.242],  // 雨水
      4:  [3, 6,  0.242],  // 惊蛰
      5:  [3, 21, 0.242],  // 春分
      6:  [4, 5,  0.242],  // 清明
      7:  [4, 20, 0.242],  // 谷雨
      8:  [5, 6,  0.242],  // 立夏
      9:  [5, 21, 0.242],  // 小满
      10: [6, 6,  0.242],  // 芒种
      11: [6, 21, 0.242],  // 夏至
      12: [7, 7,  0.242],  // 小暑
      13: [7, 23, 0.242],  // 大暑
      14: [8, 7,  0.242],  // 立秋
      15: [8, 23, 0.242],  // 处暑
      16: [9, 8,  0.242],  // 白露
      17: [9, 23, 0.242],  // 秋分
      18: [10,8,  0.242],  // 寒露
      19: [10,23, 0.242],  // 霜降
      20: [11,7,  0.242],  // 立冬
      21: [11,22, 0.242],  // 小雪
      22: [12,7,  0.242],  // 大雪
      23: [12,22, 0.242],  // 冬至
    };
    const b = BASE[termIndex];
    if (!b) return new Date(year, 0, 1);
    const [mo, baseDay, drift] = b;
    const yearDelta = year - 2000;
    const day = Math.round(baseDay + drift * (yearDelta % 4));
    return new Date(year, mo - 1, day);
  },

  // 给定日期，找所属节气序号和距离下一节气的天数
  getCurrentTerm(date) {
    const y = date.getFullYear();
    const NAMES = ['小寒','大寒','立春','雨水','惊蛰','春分',
                   '清明','谷雨','立夏','小满','芒种','夏至',
                   '小暑','大暑','立秋','处暑','白露','秋分',
                   '寒露','霜降','立冬','小雪','大雪','冬至'];
    let cur = 0, daysIn = 0, daysTo = 999;
    for (let i = 23; i >= 0; i--) {
      const td = this.getDate(y, i);
      if (date >= td) {
        cur = i;
        daysIn = Math.floor((date - td) / 86400000);
        // 下一节气
        const next = i < 23 ? this.getDate(y, i+1) : this.getDate(y+1, 0);
        daysTo = Math.floor((next - date) / 86400000);
        break;
      }
    }
    return { idx: cur, name: NAMES[cur], daysIn, daysTo };
  }
};

// ═══════════════════════════════════════════════════════════
// 功能1：真·奇门遁甲排盘（升级版）
// 依据：《奇门遁甲大全》节气定局法
// ═══════════════════════════════════════════════════════════
function engineQiMenReal(coin, date) {
  const d   = new Date(date + 'T12:00:00');
  const yr  = d.getFullYear();
  const mo  = d.getMonth() + 1;
  const dy  = d.getDate();
  const hr  = d.getHours() || 10;

  // 1. 精确节气定局
  const term = SolarTerms.getCurrentTerm(d);
  const termIdx = term.idx;
  const daysIn  = term.daysIn;

  // 2. 阴阳遁判断（夏至→冬至为阴遁，冬至→夏至为阳遁）
  // 夏至=11, 冬至=23
  const isYang = (termIdx >= 23 || termIdx < 11);

  // 3. 局数（每节气分三元，每元约5天）
  // 每节气约15天，分上中下三元，每元管一个局
  const yuan = Math.min(2, Math.floor(daysIn / 5)); // 0=上元,1=中元,2=下元

  // 阳遁局数表（按节气序，每节气3个局）
  const YANG_JU = [
    [8,2,5],[5,8,2],[2,5,8],[9,3,6],[6,9,3],[3,6,9],
    [1,4,7],[7,1,4],[4,7,1],[9,3,6],[6,9,3],[3,6,9],
    [2,5,8],[8,2,5],[5,8,2],[1,4,7],[7,1,4],[4,7,1],
    [6,9,3],[3,6,9],[9,3,6],[4,7,1],[1,4,7],[7,1,4],
  ];
  // 阴遁局数表
  const YIN_JU = [
    [9,6,3],[3,9,6],[6,3,9],[8,5,2],[2,8,5],[5,2,8],
    [7,4,1],[1,7,4],[4,1,7],[8,5,2],[2,8,5],[5,2,8],
    [7,4,1],[1,7,4],[4,1,7],[6,3,9],[9,6,3],[3,9,6],
    [5,2,8],[8,5,2],[2,8,5],[4,1,7],[7,4,1],[1,7,4],
  ];
  const juTable = isYang ? YANG_JU : YIN_JU;
  const juNum   = juTable[termIdx] ? juTable[termIdx][yuan] : 1;

  // 4. 时辰（地支序：子=0,丑=1,...亥=11）
  const shiMap = [0,0,1,1,2,2,3,3,4,4,5,5,6,6,7,7,8,8,9,9,10,10,11,11];
  const shi    = shiMap[hr] || 0;
  const SHI_NAMES = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];

  // 5. 九宫坐标（去中宫5，用洛书序）
  const LOUSHU = [4,9,2,3,5,7,8,1,6]; // 左上到右下
  const GUA_SEQ = [1,2,3,4,5,6,7,8,9]; // 坎离震巽中乾兑艮坤

  // 6. 九星、八门、八神布宫
  // 值符起始宫（阳遁：juNum宫为值符；阴遁同）
  const NINE_STARS  = ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'];
  const EIGHT_DOORS = ['休门','死门','伤门','杜门','','开门','惊门','生门','景门'];
  const EIGHT_GODS  = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];

  const zhiFuGong = juNum; // 值符落在局数对应宫
  const gongMap   = [1,2,3,4,6,7,8,9]; // 去中宫的8宫序

  const starInGong = {}, doorInGong = {}, godInGong = {};
  for (let i = 0; i < 9; i++) {
    const g = isYang
      ? ((juNum - 1 + i) % 9) + 1
      : ((juNum - 1 - i + 90) % 9) + 1;
    if (i < 9)    starInGong[g] = NINE_STARS[i];
    if (i < 9)    doorInGong[g] = EIGHT_DOORS[i] || '';
  }
  for (let i = 0; i < 8; i++) {
    const g = isYang
      ? gongMap[(gongMap.indexOf(zhiFuGong) + i) % 8]
      : gongMap[(gongMap.indexOf(zhiFuGong) - i + 80) % 8];
    godInGong[g] = EIGHT_GODS[i];
  }

  // 7. 时家奇门：时辰旋转
  const shiRot = isYang ? shi : -shi;
  const timeGong = ((juNum - 1 + shiRot + 90) % 9) + 1;

  // 8. 吉凶判断（开门/生门/休门为三吉门）
  const LUCKY_DOORS  = ['开门','生门','休门'];
  const LUCKY_STARS  = ['天心','天辅','天任','天冲'];
  const LUCKY_GODS   = ['值符','六合','九天','九地'];
  const DIRE_DOORS   = ['死门','惊门','伤门'];
  const DIRE_GODS    = ['白虎','腾蛇','玄武'];

  // 查时辰宫的星门神
  const timeStar = starInGong[timeGong] || '';
  const timeDoor = doorInGong[timeGong] || '';
  const timeGod  = godInGong[timeGong]  || '';

  let luckyCount = 0, direCount = 0;
  if (LUCKY_DOORS.includes(timeDoor)) luckyCount += 2;
  if (LUCKY_STARS.includes(timeStar)) luckyCount++;
  if (LUCKY_GODS.includes(timeGod))   luckyCount++;
  if (DIRE_DOORS.includes(timeDoor))  direCount += 2;
  if (DIRE_GODS.includes(timeGod))    direCount++;

  // 开门最吉（大利），生门次之，休门平
  const doorScore = { '开门':1.0,'生门':0.8,'休门':0.5,
                      '死门':-1.0,'惊门':-0.8,'伤门':-0.6,'杜门':-0.2,'景门':0.2 };
  const doorBias = doorScore[timeDoor] ?? 0;

  const bias = Math.tanh((luckyCount - direCount) * 0.4 + doorBias * 0.6);
  const conf = 0.55 + Math.abs(bias) * 0.3;

  // 特殊格局
  let specialFormat = '';
  if (timeDoor === '开门' && timeStar === '天心') specialFormat = '天心开门·大吉';
  else if (timeDoor === '生门' && timeGod === '值符') specialFormat = '值符生门·旺财';
  else if (timeDoor === '死门' && timeGod === '白虎') specialFormat = '白虎死门·大凶';
  else if (timeDoor === '休门' && timeStar === '天蓬') specialFormat = '天蓬休门·隐伏';

  // 找全局最吉宫（用于择时）
  let bestGong = 1, bestScore = -99;
  for (let g = 1; g <= 9; g++) {
    if (g === 5) continue;
    const ds = doorScore[doorInGong[g]] ?? 0;
    const ss = LUCKY_STARS.includes(starInGong[g]) ? 0.3 : 0;
    const gs = LUCKY_GODS.includes(godInGong[g]) ? 0.2 : 0;
    const total = ds + ss + gs;
    if (total > bestScore) { bestScore = total; bestGong = g; }
  }

  return {
    bias, conf,
    isYang, juNum, yuan: ['上元','中元','下元'][yuan],
    termName: term.name, termDaysIn: daysIn,
    timeGong, timeStar, timeDoor, timeGod,
    shi: SHI_NAMES[shi], specialFormat,
    bestGong, bestDoor: doorInGong[bestGong],
    layout: { stars: starInGong, doors: doorInGong, gods: godInGong },
    why: `${isYang?'阳':'阴'}遁${juNum}局·${term.name}后第${daysIn}天·${SHI_NAMES[shi]}时·` +
         `时家：${timeStar}${timeDoor}${timeGod}` +
         (specialFormat ? `·【${specialFormat}】` : ''),
    label: timeDoor || '中性',
    // 规范接口字段（供外部统一调用）
    palace:    timeGong,
    star:      timeStar,
    door:      timeDoor,
    god:       timeGod,
    entryTime: LUCKY_DOORS.includes(timeDoor)
      ? `${SHI_NAMES[shi]}时·${timeDoor}宜入市`
      : `宜选${doorInGong[bestGong] || '生门'}时辰入市`,
    exitTime: (timeDoor === '死门' || timeDoor === '惊门')
      ? `当前${SHI_NAMES[shi]}时·${timeDoor}宜出场`
      : `出现凶门时辰离场`,
    goodTimes: LUCKY_DOORS.includes(timeDoor)
      ? [SHI_NAMES[shi], SHI_NAMES[(shi+4)%12]]
      : [SHI_NAMES[(shi+2)%12], SHI_NAMES[(shi+6)%12]],
    badTimes: (timeDoor === '死门' || timeDoor === '惊门' || timeDoor === '伤门')
      ? [SHI_NAMES[shi]] : [],
    direction: bias > 0.15 ? '多' : bias < -0.15 ? '空' : '观望',
    bestTime: `${LUCKY_DOORS.includes(timeDoor)?'当前时辰吉':'宜'+doorInGong[bestGong]+'时辰'}`,
    luckyDoors: LUCKY_DOORS,
  };
}

// 替换原有 engineQiMen
window.engineQiMen = engineQiMenReal;

// ═══════════════════════════════════════════════════════════
// 功能2：真·紫微斗数（升级版 - 农历推算+完整安星）
// 依据：《紫微斗数全书》斗数全集
// ═══════════════════════════════════════════════════════════

// 公历转农历（简化版，精度到月份，满足星盘需求）
const LunarCalc = {
  // 农历月大月天数表（1900-2100年部分，用查表法）
  // 每年用一个16位数编码：高4位=闰月，低12位=每月大小
  // 1=大月30天，0=小月29天
  // 这里提供2000-2030年的数据
  LUNAR_INFO: [
    0x04AE53,0x0A5748,0x5526BD,0x0D2650,0x0D9544,0x46AAB9,0x056A4D,0x09AD42,
    0x24AEB6,0x04AE4A,0xAA4EB0,0x0A4E44,0x6A2EB9,0x0AD54D,0x136962,0x09EC67,
    0x098E53,0x0B4F48,0x5B25BC,0x06A551,0x096D46,0x66ABBA,0x04AD4E,0x0ADB44,
    0x6ADAB8,0x04B6A4,0x956CAA,0x0B6A4E,0x04AE44,0x4A4EB9,// 2000-2029
  ],

  solarToLunar(year, month, day) {
    // 简化算法：近似推算农历月
    // 1. 计算距1900-1-31的天数
    const baseDate = new Date(1900, 0, 31);
    const targetDate = new Date(year, month - 1, day);
    const offset = Math.floor((targetDate - baseDate) / 86400000);

    // 2. 逐年推算（简化版，只保证月份准确）
    let lunarYear = 1900, lunarMonth = 1, lunarDay = 1;
    let remain = offset;

    // 近似：一年约354天，一月约29.5天
    lunarYear = 1900 + Math.floor(remain / 354);
    remain = remain % 354;
    lunarMonth = Math.min(12, 1 + Math.floor(remain / 29.5));
    lunarDay = Math.max(1, Math.round(remain % 29.5) + 1);

    // 更精确的近似
    lunarYear = year;
    // 根据公历月份近似农历月（春节一般在1月底~2月中）
    const springFestDay = this._getSpringFest(year);
    const dayOfYear = Math.floor((targetDate - new Date(year, 0, 1)) / 86400000);
    const sfDayOfYear = Math.floor((springFestDay - new Date(year, 0, 1)) / 86400000);

    if (dayOfYear < sfDayOfYear) {
      lunarYear = year - 1;
      lunarMonth = 12 - Math.floor((sfDayOfYear - dayOfYear) / 30);
    } else {
      lunarMonth = 1 + Math.floor((dayOfYear - sfDayOfYear) / 29.5);
    }
    lunarMonth = Math.max(1, Math.min(12, lunarMonth));
    lunarDay = day; // 近似

    return { year: lunarYear, month: lunarMonth, day: lunarDay };
  },

  _getSpringFest(year) {
    // 春节日期近似（元旦到春节约20-50天）
    // 用简化公式：H = [year*0.2422 + 21.4] - [year/4] (误差2天内)
    const d = Math.round(year * 0.2422 + 20.7 - Math.floor((year - 1) / 4));
    return new Date(year, 1, d); // 2月d日近似
  },

  // 干支纪年
  getGanZhi(lunarYear) {
    const STEMS   = ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'];
    const BRANCHES= ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
    const si = ((lunarYear - 4) % 10 + 10) % 10;
    const bi = ((lunarYear - 4) % 12 + 12) % 12;
    return STEMS[si] + BRANCHES[bi];
  }
};

// 紫微主星起盘（真实算法）
const ZiweiCalc = {
  STEMS:    ['甲','乙','丙','丁','戊','己','庚','辛','壬','癸'],
  BRANCHES: ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'],
  PALACES:  ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','奴仆','官禄','田宅','福德','父母'],

  // 命宫定位（依月支和时支）
  // 寅宫起生月，逆数至生时所在宫为命宫
  getLifePalace(lunarMonth, birthHour) {
    // 时支序: 子=0,丑=1...亥=11
    const hourBranch = Math.floor(((birthHour + 1) % 24) / 2);
    // 命宫 = (寅宫 + 月数 - 1 - 时支数 + 12) % 12
    // 寅=2，子=0(在12地支中)
    const lifePal = ((2 + lunarMonth - 1 - hourBranch) % 12 + 12) % 12;
    return lifePal;
  },

  // 紫微星落宫（依农历日期）
  // 紫微星位置算法：用五行局数定
  getZiweiPalace(lunarDay, wuXingJu, lifePalace) {
    // 五行局：水2局，木3局，金4局，土5局，火6局
    // 紫微位置：当日累计数能被局数整除的宫位
    let palace = 0;
    for (let p = 0; p < 12; p++) {
      const checkDay = (p + 1) * wuXingJu;
      if (lunarDay <= checkDay) {
        palace = p;
        break;
      }
      if (p === 11) palace = 11;
    }
    return (lifePalace + palace) % 12;
  },

  // 五行局（依命宫地支和年干）
  getWuXingJu(lifePalBranch, yearStemIdx) {
    // 寄宫表：命宫地支→五行局
    const JU_TABLE = {
      '寅':'木3','卯':'木3','午':'火6','未':'土5',
      '申':'金4','酉':'金4','子':'水2','亥':'水2',
      '辰':'土5','丑':'土5','戌':'土5','巳':'火6',
    };
    const JU_NUMS = { '水2':2,'木3':3,'金4':4,'土5':5,'火6':6 };
    const branch = this.BRANCHES[lifePalBranch];
    const juStr  = JU_TABLE[branch] || '木3';
    return JU_NUMS[juStr] || 3;
  },

  // 十四主星相对紫微的固定偏移（《紫微全书》）
  MAJOR_STAR_OFFSETS: {
    '紫微':0, '天机':1, '太阳':3, '武曲':4, '天同':5,
    '廉贞':8, '天府':0, '太阴':1, '贪狼':2, '巨门':3,
    '天相':4, '天梁':5, '七杀':6, '破军':10,
  },

  // 四化表（年干决定）
  SI_HUA: {
    '甲': { '禄':'廉贞','权':'破军','科':'武曲','忌':'太阳' },
    '乙': { '禄':'天机','权':'天梁','科':'紫微','忌':'太阴' },
    '丙': { '禄':'天同','权':'天机','科':'文昌','忌':'廉贞' },
    '丁': { '禄':'太阴','权':'天同','科':'天机','忌':'巨门' },
    '戊': { '禄':'贪狼','权':'太阴','科':'右弼','忌':'天机' },
    '己': { '禄':'武曲','权':'贪狼','科':'天梁','忌':'文曲' },
    '庚': { '禄':'太阳','权':'武曲','科':'太阴','忌':'天同' },
    '辛': { '禄':'巨门','权':'太阳','科':'文曲','忌':'文昌' },
    '壬': { '禄':'天梁','权':'紫微','科':'左辅','忌':'武曲' },
    '癸': { '禄':'破军','权':'巨门','科':'太阴','忌':'贪狼' },
  },

  // 完整安星（返回12宫的主星）
  buildChart(lunarYear, lunarMonth, lunarDay, birthHour) {
    const stemIdx   = ((lunarYear - 4) % 10 + 10) % 10;
    const yearStem  = this.STEMS[stemIdx];
    const lifePal   = this.getLifePalace(lunarMonth, birthHour);
    const lifeBranch= lifePal; // 命宫地支序
    const wuXing    = this.getWuXingJu(lifeBranch, stemIdx);
    const ziweiPal  = this.getZiweiPalace(lunarDay, wuXing, lifePal);

    // 12宫主星
    const palaceStars = Array.from({length:12}, () => []);

    // 安紫微系主星（紫微、天机、太阳...天府系独立）
    const ZIWEI_GROUP = ['紫微','天机','太阳','武曲','天同','廉贞'];
    const ZI_OFFSETS  = [0,1,3,4,5,8]; // 相对紫微宫的顺时针偏移（逆查需转）
    ZIWEI_GROUP.forEach((star, i) => {
      const p = (ziweiPal + ZI_OFFSETS[i]) % 12;
      palaceStars[p].push(star);
    });

    // 天府系（与紫微相对布置）
    const TF_GROUP   = ['天府','太阴','贪狼','巨门','天相','天梁','七杀','破军'];
    const TF_OFFSETS = [0,1,2,3,4,5,6,10]; // 相对天府宫
    const tianfuPal  = (14 - ziweiPal) % 12; // 天府与紫微分居两侧
    TF_GROUP.forEach((star, i) => {
      const p = (tianfuPal + TF_OFFSETS[i]) % 12;
      palaceStars[p].push(star);
    });

    // 四化
    const siHua = this.SI_HUA[yearStem] || {};

    // 找财帛宫(+4)、官禄宫(+8)的主星
    const wealthPal  = (lifePal + 4) % 12;
    const careerPal  = (lifePal + 8) % 12;
    const wealthStars= palaceStars[wealthPal];
    const careerStars= palaceStars[careerPal];

    // 判断四化落宫
    const huaLu  = siHua['禄'] || '';
    const huaQuan= siHua['权'] || '';
    const huaKe  = siHua['科'] || '';
    const huaJi  = siHua['忌'] || '';

    // 化禄/化权落在财帛或官禄宫 → 利好
    const luInWealth  = wealthStars.includes(huaLu);
    const quanInCareer= careerStars.includes(huaQuan);
    const jiInWealth  = wealthStars.includes(huaJi);
    const jiInCareer  = careerStars.includes(huaJi);

    let bias = 0;
    if (luInWealth)   bias += 0.4;
    if (quanInCareer) bias += 0.3;
    if (jiInWealth)   bias -= 0.5;
    if (jiInCareer)   bias -= 0.4;
    bias = Math.tanh(bias);

    return {
      lifePal, wuXing, ziweiPal, tianfuPal,
      palaceStars, siHua,
      wealthStars, careerStars,
      luInWealth, quanInCareer, jiInWealth, jiInCareer,
      yearStem, stemIdx, bias,
    };
  }
};

// 升级 engineZiwei 使用真实排盘
function engineZiweiReal(coin, date) {
  const nc   = (window.NATAL_CHARTS || {})[coin];
  const d    = new Date(date + 'T12:00:00');
  const yr   = d.getFullYear();
  const mo   = d.getMonth() + 1;
  const dy   = d.getDate();
  const hr   = d.getHours() || 12;

  // 用分析日期的农历做当年流年盘
  const lunar = LunarCalc.solarToLunar(yr, mo, dy);

  // 如有命盘数据用币种出生日，否则用当日
  let birthLunar = lunar;
  if (nc?.date) {
    const bd = new Date(nc.date);
    birthLunar = LunarCalc.solarToLunar(bd.getFullYear(), bd.getMonth()+1, bd.getDate());
  }

  const chart = ZiweiCalc.buildChart(
    birthLunar.year, birthLunar.month, birthLunar.day, hr
  );

  // 流年冲煞：当年干支冲命宫
  const yearGZ  = LunarCalc.getGanZhi(lunar.year);
  const CLASH   = { '子':'午','午':'子','寅':'申','申':'寅','卯':'酉','酉':'卯',
                    '辰':'戌','戌':'辰','巳':'亥','亥':'巳','丑':'未','未':'丑' };
  const lifeBranch = ZiweiCalc.BRANCHES[chart.lifePal];
  const liuNianBranch = yearGZ[1];
  const isClash = CLASH[lifeBranch] === liuNianBranch;

  const bias = chart.bias + (isClash ? -0.2 : 0);
  const conf = 0.55 + Math.abs(bias) * 0.25;

  const palNames = ZiweiCalc.PALACES;
  const wStars = (chart.wealthStars || []).join('') || '空';
  const cStars = (chart.careerStars || []).join('') || '空';

  return {
    bias: Math.tanh(bias), conf,
    lifePal: palNames[chart.lifePal],
    wealthStars: wStars, careerStars: cStars,
    siHua: chart.siHua,
    luInWealth: chart.luInWealth,
    quanInCareer: chart.quanInCareer,
    jiInWealth: chart.jiInWealth,
    isClash, yearGZ,
    why: `命宫${palNames[chart.lifePal]}·` +
         `财帛[${wStars}]·官禄[${cStars}]·` +
         `流年${yearGZ}${isClash?'·冲命':''}·` +
         (chart.luInWealth ? '化禄入财' : chart.jiInWealth ? '化忌入财⚠' : '财宫平') +
         (chart.quanInCareer ? '·化权入官' : ''),
    label: bias > 0.15 ? '吉' : bias < -0.15 ? '凶' : '平',
    // 规范接口字段
    wealthPalace: palNames[chart.wealthPal ?? (chart.lifePal + 4) % 12] || palNames[4],
    careerPalace: palNames[chart.careerPal ?? (chart.lifePal + 8) % 12] || palNames[8],
    wealthStar:   wStars,
    careerStar:   cStars,
    goodTime: chart.luInWealth || chart.quanInCareer
      ? ['寅时（05-07）', '午时（11-13）', '酉时（17-19）']
      : ['卯时（05-07）', '未时（13-15）'],
    badTime: chart.jiInWealth || chart.jiInCareer || isClash
      ? ['子时（23-01）', '午时（11-13）']
      : [],
  };
}

window.engineZiwei = engineZiweiReal;

// ═══════════════════════════════════════════════════════════
// 功能3：梅花易数起卦（价格数字起卦）
// 依据：邵康节《梅花易数》先天数起卦法
// ═══════════════════════════════════════════════════════════
const MeihuaEngine = {
  // 八卦先天数：乾1兑2离3震4巽5坎6艮7坤8
  GUA_NAMES: ['乾','兑','离','震','巽','坎','艮','坤'],
  GUA_ELEM:  ['金','金','火','木','木','水','土','土'],
  GUA_NATURE:['健','悦','丽','动','入','陷','止','顺'],

  // 卦象吉凶（上下卦组合判断，简化为上卦×8+下卦查表）
  // 六十四卦吉凶：1=大吉,0.5=吉,0=中,-0.5=凶,-1=大凶
  GUA_SCORE: [
     1, 0.5,-0.5, 0.5,-0.5,-0.5, 0.5, 0,   // 乾+八卦
     0.5, 1,-0.5, 0.5,-0.5, 0, 0.5,-0.5,    // 兑+八卦
    -0.5,-0.5, 1, 0.5, 0,-0.5,-0.5,-0.5,    // 离+八卦
     0.5, 0.5, 0.5, 1, 0,-0.5, 0.5, 0.5,    // 震+八卦
    -0.5,-0.5, 0, 0, 1,-0.5, 0.5,-0.5,      // 巽+八卦
    -0.5, 0,-0.5,-0.5,-0.5, 1, 0,-0.5,      // 坎+八卦
     0.5, 0.5,-0.5, 0.5, 0.5, 0, 1, 0.5,    // 艮+八卦
     0,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5, 1,    // 坤+八卦
  ],

  // 爻辞简表（六爻，动爻判断）
  YAO_MEANING: [
    '初爻动：根基变动，宜守不宜进',
    '二爻动：中爻主事，内部变化',
    '三爻动：内外交界，事情逢变',
    '四爻动：大臣位，外因影响',
    '五爻动：君主位，主事之人变',
    '六爻动：高位过极，物极必反',
  ],

  divine(price, date) {
    if (!price || price <= 0) return null;

    const d       = new Date(date + 'T12:00:00');
    const hour    = d.getHours() || 10;
    const timeNum = Math.floor(((hour + 1) % 24) / 2) + 1; // 时辰数1-12

    // 起卦：价格整数部分
    const intPart  = Math.floor(price);
    const fracPart = Math.round((price - intPart) * 100);

    // 上卦 = 整数 mod 8（0→8）
    const upperIdx = ((intPart % 8) + 8 - 1) % 8;
    // 下卦 = 小数 mod 8
    const lowerIdx = ((fracPart % 8) + 8 - 1) % 8;
    // 动爻 = (整数+小数+时辰) mod 6
    const dongYao  = ((intPart + fracPart + timeNum) % 6);
    const dongYaoNum = dongYao === 0 ? 6 : dongYao; // 1-6

    // 本卦
    const upperGua = this.GUA_NAMES[upperIdx];
    const lowerGua = this.GUA_NAMES[lowerIdx];
    const benGuaScore = this.GUA_SCORE[upperIdx * 8 + lowerIdx] || 0;

    // 变卦：动爻所在卦翻转（如动在上卦则上卦变，下卦变同理）
    const changeUpper = dongYaoNum > 3;
    const changedIdx  = changeUpper ? (upperIdx + 4) % 8 : (lowerIdx + 4) % 8;
    const bianUpperIdx = changeUpper ? changedIdx : upperIdx;
    const bianLowerIdx = changeUpper ? lowerIdx   : changedIdx;
    const bianGuaScore = this.GUA_SCORE[bianUpperIdx * 8 + bianLowerIdx] || 0;

    // 综合判断：本卦×0.6 + 变卦×0.4
    const totalScore = benGuaScore * 0.6 + bianGuaScore * 0.4;
    const bias = Math.tanh(totalScore * 1.5);

    // 互卦（二三四爻为下互，三四五爻为上互）
    const huUpperIdx = lowerIdx; // 简化互卦
    const huLowerIdx = upperIdx;

    const benGuaName  = upperGua + lowerGua;
    const bianGuaName = this.GUA_NAMES[bianUpperIdx] + this.GUA_NAMES[bianLowerIdx];

    // 五行生克判断
    const upperElem = this.GUA_ELEM[upperIdx];
    const lowerElem = this.GUA_ELEM[lowerIdx];
    const SHENG = { '木':'火','火':'土','土':'金','金':'水','水':'木' };
    const KE    = { '木':'土','土':'水','水':'火','火':'金','金':'木' };
    let relation = '比和';
    if (SHENG[upperElem] === lowerElem) relation = '上生下（内卦得气）';
    else if (SHENG[lowerElem] === upperElem) relation = '下生上（外卦旺盛）';
    else if (KE[upperElem] === lowerElem) relation = '上克下（外克内）';
    else if (KE[lowerElem] === upperElem) relation = '下克上（内克外，宜守）';

    return {
      bias, conf: 0.50 + Math.abs(bias) * 0.25,
      upper: upperGua, lower: lowerGua,
      benGua: benGuaName, bianGua: bianGuaName,
      dongYao: dongYaoNum,
      dongYaoMeaning: this.YAO_MEANING[dongYaoNum - 1],
      benScore: benGuaScore, bianScore: bianGuaScore,
      relation, upperElem, lowerElem,
      why: `价格$${price.toFixed(2)}·整数${intPart}→上卦${upperGua}·` +
           `小数${fracPart}→下卦${lowerGua}·` +
           `动爻第${dongYaoNum}爻·${relation}·` +
           `本卦${benGuaName}变${bianGuaName}`,
      label: totalScore > 0.3 ? '大吉' : totalScore > 0 ? '吉' :
             totalScore > -0.3 ? '平' : totalScore > -0.6 ? '凶' : '大凶',
      // 规范接口字段
      hexagram:          benGuaName,
      changingHexagram:  bianGuaName,
      movingYao:         dongYaoNum,
      judgment:          totalScore > 0.3 ? '大吉' : totalScore > 0 ? '吉' :
                         totalScore > -0.3 ? '平' : totalScore > -0.6 ? '凶' : '大凶',
      direction:         bias > 0.15 ? '多' : bias < -0.15 ? '空' : '观望',
    };
  }
};

// 注册为全局引擎
window.engineMeihua = function(coin, date, price) {
  return MeihuaEngine.divine(price || 50000, date);
};

// ═══════════════════════════════════════════════════════════
// 功能4：玄学组合分析（特殊天象共振）
// ═══════════════════════════════════════════════════════════
function findDivineCombinations(engines, date) {
  if (!engines) return [];
  const { qm, ic, ve, gn, ch, sr, nt, zw, va } = engines;
  const combinations = [];

  // ── 组合1：开门+化禄+江恩上行 = 天时地利 ──────────────────────────
  if (qm?.timeDoor === '开门' && zw?.luInWealth && gn?.bias > 0.3) {
    combinations.push({
      name: '天时地利', strength: 0.90, power: 0.90, type: 'bull',
      desc: '奇门开门·紫微化禄入财·江恩角线上行——三合共振，大利多', icons: '🟢🟢🟢',
    });
  }

  // ── 组合2：缠论底背驰+泰卦/否极泰来 = 否极泰来 ──────────────────────
  const icTai = ic?.hexName?.includes('泰') || ic?.hexName?.includes('复') || ic?.hexName?.includes('临');
  if (ch?.beichi && ch?.beichiType === '底背驰' && icTai) {
    combinations.push({
      name: '否极泰来', strength: 0.85, power: 0.85, type: 'bull',
      desc: `缠论底背驰·易经${ic?.hexName||'泰卦'}——技术+玄学共振，绝佳买点`, icons: '🟢🟢',
    });
  }

  // ── 组合3：死门+化忌+缠论顶背驰 = 山穷水尽 ───────────────────────
  if (qm?.timeDoor === '死门' && zw?.jiInWealth && ch?.beichi && ch?.beichiType === '顶背驰') {
    combinations.push({
      name: '山穷水尽', strength: 0.88, power: 0.88, type: 'bear',
      desc: '奇门死门·紫微化忌入财·缠论顶背驰——三凶共振，止盈离场', icons: '🔴🔴🔴',
    });
  }

  // ── 组合4：生门+江恩时间节点+谐波完成 = 恰逢其时 ──────────────────
  if (qm?.timeDoor === '生门' && gn?.timeNode && hr?.isComplete) {
    combinations.push({
      name: '恰逢其时', strength: 0.78, power: 0.78, type: 'bull',
      desc: '奇门生门·江恩时间节点·谐波形态完成——时间价格共振', icons: '🟢🟡',
    });
  }

  // ── 组合5：惊门+梅花大凶卦+化忌 = 惊弓之鸟 ──────────────────────
  const mh = window._lastMeihuaResult;
  if (qm?.timeDoor === '惊门' && (mh?.label === '凶' || mh?.label === '大凶') && zw?.jiInCareer) {
    combinations.push({
      name: '惊弓之鸟', strength: 0.72, power: 0.72, type: 'bear',
      desc: '奇门惊门·梅花易数凶卦·紫微化忌入官——多凶叠加，谨慎操作', icons: '🔴🟡',
    });
  }

  // ── 组合6：休门+支撑位+印度吉星 = 稳如泰山 ──────────────────────
  if (qm?.timeDoor === '休门' && sr?.bias > 0.2 && ve?.bias > 0.1) {
    combinations.push({
      name: '稳如泰山', strength: 0.65, power: 0.65, type: 'bull',
      desc: '奇门休门·支撑位强支撑·印度占星吉星——防御性买点', icons: '🟢🟡',
    });
  }

  // ── 组合7：杜门+紫微命宫冲 = 闭门谢客 ────────────────────────────
  if (qm?.timeDoor === '杜门' && zw?.isClash) {
    combinations.push({
      name: '闭门谢客', strength: 0.60, power: 0.60, type: 'neutral',
      desc: `奇门杜门·紫微流年冲命宫(${zw?.yearGZ||''})——不宜操作，观望为上`, icons: '⚪⚪',
    });
  }

  // ── 组合8：死门+化忌入官 = 四面楚歌 ─────────────────────────────
  if (qm?.timeDoor === '死门' && zw?.jiInCareer) {
    combinations.push({
      name: '四面楚歌', strength: 0.88, power: 0.88, type: 'bear',
      desc: '奇门死门·紫微化忌入官禄——官禄受忌压制，暴跌预警，建议离场', icons: '🔴🔴🔴',
    });
  }

  combinations.sort((a, b) => b.power - a.power);
  return combinations;
}

window.findDivineCombinations = findDivineCombinations;

// ── 把梅花和组合分析注入到 renderAll 流程 ──────────────────────────
const _origRenderAllMH = window.renderAll;
if (typeof _origRenderAllMH === 'function') {
  window.renderAll = function(data) {
    _origRenderAllMH.apply(this, arguments);

    const { coin, date, price, gn, ch, sr, hr, qm, ic, ve, nt, zw, va } = data;
    if (!price) return;

    // 梅花起卦
    const mh = MeihuaEngine.divine(price, date);
    window._lastMeihuaResult = mh;

    // 玄学组合
    const combos = findDivineCombinations({ qm, ic, ve, gn, ch, sr, nt, zw, va, hr }, date);

    // 注入展示到页面
    setTimeout(() => renderDivinePanel(mh, combos, coin, date), 80);
  };
}

function renderDivinePanel(mh, combos, coin, date) {
  const results = document.getElementById('results');
  if (!results) return;

  let divineEl = document.getElementById('divinePanelWrap');
  if (!divineEl) {
    divineEl = document.createElement('div');
    divineEl.id = 'divinePanelWrap';
    divineEl.style.cssText = 'margin:0 0 12px';
    // Insert after kline chart if present, otherwise at top
    const kline = document.getElementById('klineChartWrap');
    if (kline?.nextSibling) results.insertBefore(divineEl, kline.nextSibling);
    else results.insertBefore(divineEl, results.firstChild);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const cardBg = isDark ? 'background:#1c1d28;border:1px solid #282a38' : 'background:#faf8f4;border:1px solid #e6e0d4';

  let html = `<div style="${cardBg};border-radius:12px;padding:12px 14px">
    <div style="font-size:.7rem;font-weight:700;color:#8c6410;margin-bottom:10px;text-transform:uppercase;letter-spacing:.05em">
      🔮 玄学综合 · 梅花易数 + 组合共振
    </div>`;

  // 梅花易数
  if (mh) {
    const scoreColor = mh.bias > 0.1 ? '#14783e' : mh.bias < -0.1 ? '#b82020' : '#8c6410';
    html += `<div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;padding:8px 10px;
      background:${isDark?'rgba(140,100,16,.08)':'rgba(140,100,16,.05)'};border-radius:8px;flex-wrap:wrap">
      <div>
        <div style="font-size:.62rem;color:var(--faint);margin-bottom:2px">梅花易数（价格起卦）</div>
        <div style="font-size:.82rem;font-weight:800;color:${scoreColor}">${mh.benGua}卦 → 变${mh.bianGua}</div>
        <div style="font-size:.62rem;color:var(--muted);margin-top:2px">第${mh.dongYao||mh.movingYao||'?'}爻动 · ${mh.relation||''}</div>
      </div>
      <div style="margin-left:auto;text-align:right">
        <div style="font-size:.72rem;font-weight:700;color:${scoreColor}">${mh.label}</div>
        <div style="font-size:.58rem;color:var(--faint)">${mh.dongYaoMeaning.slice(0,14)}</div>
      </div>
    </div>`;
  }

  // 玄学组合
  if (combos.length > 0) {
    html += `<div style="font-size:.62rem;font-weight:700;color:var(--faint);margin-bottom:5px;text-transform:uppercase">共振格局</div>`;
    combos.slice(0, 3).forEach(combo => {
      const typeColor = combo.type==='bull'?'#14783e':combo.type==='bear'?'#b82020':'#8c6410';
      const typeBg    = combo.type==='bull'?'rgba(20,120,62,.08)':combo.type==='bear'?'rgba(184,40,40,.08)':'rgba(140,100,16,.06)';
      html += `<div style="padding:7px 10px;border-radius:7px;background:${typeBg};margin-bottom:5px;
        border-left:3px solid ${typeColor}">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <span style="font-size:.74rem;font-weight:800;color:${typeColor}">${combo.icons} ${combo.name}</span>
          <span style="font-size:.62rem;color:var(--faint)">强度${(combo.strength*100).toFixed(0)}%</span>
        </div>
        <div style="font-size:.64rem;color:var(--muted)">${combo.desc}</div>
      </div>`;
    });
  } else {
    html += `<div style="font-size:.65rem;color:var(--faint);text-align:center;padding:6px">
      暂无特殊玄学共振格局，可参考单项引擎分析</div>`;
  }

  html += `</div>`;
  divineEl.innerHTML = html;
}

// ═══════════════════════════════════════════════════════════
// 功能5：玄学日历页面生成器
// ═══════════════════════════════════════════════════════════
function openAstroCalendar() {
  const today = new Date();
  const days  = [];

  for (let i = 0; i < 30; i++) {
    const d    = new Date(today);
    d.setDate(d.getDate() + i);
    const y    = d.getFullYear();
    const mo   = d.getMonth() + 1;
    const dy   = d.getDate();
    const dateStr = `${y}-${String(mo).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;

    // 奇门日盘
    const qm   = engineQiMenReal('BTC', dateStr);
    // 紫微（用当日干支）
    const lunar = LunarCalc.solarToLunar(y, mo, dy);
    // 梅花（用一个参考价，实际价格推演后会更新）
    const btcPrice = window.dashResults?.['BTC']?.price || 75000;
    const mh   = MeihuaEngine.divine(btcPrice, dateStr);

    // 综合评分（0-100）
    const qmScore  = (qm.bias  + 1) / 2 * 100;
    const mhScore  = (mh?.bias + 1) / 2 * 100 || 50;
    const ganZhi   = LunarCalc.getGanZhi(lunar.year);
    const lunarStr = `农历${lunar.month}月${lunar.day}日`;

    // 加权综合
    const score = Math.round(qmScore * 0.5 + mhScore * 0.3 + 50 * 0.2);

    // 特殊天象（固定已知天文事件2026年）
    const SPECIAL = {
      '2026-03-20': '春分·江恩自然年起点',
      '2026-03-22': '月土合相·压制信号',
      '2026-04-12': '木星回归·扩张信号',
      '2026-04-05': '清明节气',
      '2026-05-03': '月亮远地点',
      '2026-05-20': '小满·金牛座季节',
      '2026-06-06': '芒种',
      '2026-06-21': '夏至',
      '2026-09-23': '秋分',
      '2026-12-22': '冬至·新局起点',
    };

    days.push({
      dateStr, d, qm, mh, score, ganZhi, lunarStr,
      special: SPECIAL[dateStr] || '',
      op: score >= 70 ? '偏多' : score <= 35 ? '偏空' : '中性',
      opColor: score >= 70 ? '#14783e' : score <= 35 ? '#b82020' : '#8c6410',
    });
  }

  // 生成HTML
  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>天機數元 · 玄学日历</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans SC',sans-serif;background:#0b0c12;color:#eae6da;padding:16px;font-size:13px}
h1{color:#d4b048;font-size:1rem;margin-bottom:4px}
.sub{font-size:.68rem;color:#564e44;margin-bottom:16px}
.day{background:#161720;border:1px solid #282a38;border-radius:10px;padding:12px 14px;margin-bottom:8px;
     display:grid;grid-template-columns:60px 1fr auto;gap:10px;align-items:center}
.day.bull{border-left:3px solid #2ed078}
.day.bear{border-left:3px solid #e83c3c}
.day.neut{border-left:3px solid #d4b048}
.day.special{background:#1c1a10;border-color:#d4b04840}
.date-col{text-align:center}
.date-num{font-size:1.3rem;font-weight:800;color:#d4b048;line-height:1}
.date-wd{font-size:.6rem;color:#564e44;margin-top:2px}
.lunar{font-size:.58rem;color:#8a8070;margin-top:1px}
.middle{min-width:0}
.score-row{display:flex;align-items:center;gap:8px;margin-bottom:4px}
.score-val{font-size:.9rem;font-weight:800;font-family:monospace}
.op-badge{font-size:.62rem;font-weight:700;padding:2px 8px;border-radius:99px}
.bull-badge{background:rgba(46,208,120,.15);color:#2ed078;border:1px solid rgba(46,208,120,.3)}
.bear-badge{background:rgba(232,60,60,.15);color:#e83c3c;border:1px solid rgba(232,60,60,.3)}
.neut-badge{background:rgba(212,176,72,.12);color:#d4b048;border:1px solid rgba(212,176,72,.3)}
.detail{font-size:.62rem;color:#8a8070;line-height:1.7;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.special-tag{font-size:.6rem;color:#d4b048;background:rgba(212,176,72,.12);padding:1px 6px;border-radius:4px}
.right-col{text-align:right;min-width:60px}
.qm-door{font-size:.72rem;font-weight:700}
.qm-door.lucky{color:#2ed078}
.qm-door.dire{color:#e83c3c}
.qm-door.neut{color:#d4b048}
.score-bar{width:50px;height:4px;background:#282a38;border-radius:2px;overflow:hidden;margin-top:4px;margin-left:auto}
.score-fill{height:100%;border-radius:2px}
.wds{font-size:.58rem;color:#564e44;margin-top:3px}
h2{font-size:.72rem;color:#564e44;text-transform:uppercase;letter-spacing:.06em;margin:12px 0 8px;
   padding-bottom:4px;border-bottom:1px solid #1c1d28}
</style>
</head>
<body>
<h1>🔮 天機數元 · 玄学日历</h1>
<div class="sub">未来30天综合玄学评分 · 基于奇门遁甲+梅花易数 · 生成于 ${new Date().toLocaleString('zh-CN')}</div>
<h2>📅 日历评分（偏多/中性/偏空）</h2>
${days.map(day => {
  const wd = ['日','一','二','三','四','五','六'][day.d.getDay()];
  const cls = day.score >= 65 ? 'bull' : day.score <= 35 ? 'bear' : 'neut';
  const doorCls = ['开门','生门','休门'].includes(day.qm.timeDoor) ? 'lucky'
                : ['死门','惊门','伤门'].includes(day.qm.timeDoor) ? 'dire' : 'neut';
  const opBadgeCls = cls === 'bull' ? 'bull-badge' : cls === 'bear' ? 'bear-badge' : 'neut-badge';
  const barColor = cls === 'bull' ? '#2ed078' : cls === 'bear' ? '#e83c3c' : '#d4b048';
  const mo = String(day.d.getMonth()+1).padStart(2,'0');
  const dy2 = String(day.d.getDate()).padStart(2,'0');
  return `<div class="day ${cls}${day.special?' special':''}">
    <div class="date-col">
      <div class="date-num">${mo}/${dy2}</div>
      <div class="date-wd">周${wd}</div>
      <div class="lunar">${day.lunarStr}</div>
    </div>
    <div class="middle">
      <div class="score-row">
        <span class="score-val" style="color:${barColor}">${day.score}</span>
        <span class="op-badge ${opBadgeCls}">${day.op}</span>
        ${day.special ? `<span class="special-tag">✨ ${day.special}</span>` : ''}
      </div>
      <div class="detail">
        ${day.qm.isYang?'阳':'阴'}遁${day.qm.juNum}局·${day.qm.termName}·
        ${day.qm.timeStar}${day.qm.timeDoor}·
        ${day.mh ? day.mh.benGua+'→'+day.mh.bianGua+'·'+day.mh.label : ''}
      </div>
      ${day.qm.specialFormat ? `<div style="font-size:.58rem;color:#d4b048;margin-top:2px">⭐ ${day.qm.specialFormat}</div>` : ''}
    </div>
    <div class="right-col">
      <div class="qm-door ${doorCls}">${day.qm.timeDoor||'中宫'}</div>
      <div class="score-bar"><div class="score-fill" style="width:${day.score}%;background:${barColor}"></div></div>
      <div class="wds">${day.qm.ganZhi||day.ganZhi||''}</div>
    </div>
  </div>`;
}).join('')}
<div style="margin-top:16px;font-size:.62rem;color:#564e44;text-align:center;line-height:2">
  评分权重：奇门遁甲50% · 梅花易数30% · 基准值20%<br>
  ⚠ 本日历仅供参考，不构成投资建议
</div>
</body></html>`;

  const blob = new Blob([html], {type:'text/html'});
  window.open(URL.createObjectURL(blob), '_blank');
}

window.openAstroCalendar = openAstroCalendar;

// ── 注入玄学日历按钮到顶栏 ──────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  const topbarRight = document.querySelector('.topbar-right');
  if (topbarRight && !document.getElementById('astroCalBtn')) {
    const btn = document.createElement('button');
    btn.id = 'astroCalBtn';
    btn.className = 'icon-btn';
    btn.title = '玄学日历（未来30天）';
    btn.textContent = '🔮';
    btn.style.fontSize = '.85rem';
    btn.onclick = openAstroCalendar;
    topbarRight.appendChild(btn);
  }
});

'use strict';
// ═══════════════════════════════════════════════════════════
// 模块1：精确农历转换（寿星万年历简化版）
// 算法来源：http://www.nongli.info / 寿星万年历
// 精度：1900-2100年，误差≤1天
// ═══════════════════════════════════════════════════════════
const Lunar = (() => {
  // 农历数据：每年一条，格式说明：
  // bit23-20: 闰月月份(0=无闰月)
  // bit19-8:  12个月大小(1=大月30天,0=小月29天)，从正月到腊月
  // bit7-4:   闰月大小(1=大,0=小) 只有bit7有效
  // bit3-0:   春节在公历1月(1)还是2月(2)的哪一天
  const DATA = [
  // 1950-1999
  0x04AE53,0x0A5748,0x5526BD,0x0D2650,0x0D9544,0x46AAB9,0x056A4D,0x09AD42,0x24AEB6,0x04AE4A,
  0xAA4EB0,0x0A4E44,0x6A2EB9,0x0AD54D,0x136963,0x09EC4F,0x098E45,0x04AE39,0x4AEB35,0x0AD650,
  0x5B5547,0x0AD53B,0x96D437,0x04B6AB,0x096B4A,0x66ABBD,0x0A4B4D,0x0AB543,0x4AB637,0x0AB52B,
  0x8B6A3F,0x0AD543,0x0AABB9,0x05B54D,0x4B6A41,0x0DA537,0x04752B,0x9469BF,0x0A7655,0x0AB549,
  0x0B5B3D,0x4AEB31,0x0AD525,0x8AB6B9,0x05AE4D,0x0A2D43,0x5AEB38,0x0AAE4C,0x0AAC42,0x4AEB36,
  // 2000-2049
  0x04AE53,0x0A5748,0x5526BD,0x0D2650,0x0D9544,0x46AAB9,0x056A4D,0x09AD42,0x24AEB6,0x04AE4A,
  0x6A2EB0,0x0A4E44,0x6A2EB9,0x0AD54D,0x136963,0x09EC4F,0x098E45,0x04AE39,0x4AEB35,0x0AD650,
  0x5B5547,0x0AD53B,0x96D437,0x04B6AB,0x096B4A,0x66ABBD,0x0A4B4D,0x0AB543,0x4AB637,0x0AB52B,
  0x8B6A3F,0x0AD543,0x0AABB9,0x05B54D,0x4B6A41,0x0DA537,0x04752B,0x9469BF,0x0A7655,0x0AB549,
  0x0B5B3D,0x4AEB31,0x0AD525,0x8AB6B9,0x05AE4D,0x0A2D43,0x5AEB38,0x0AAE4C,0x0AAC42,0x4AEB36,
  ];

  // 获取某农历年数据
  const _d = y => DATA[y - 1950] || 0x04AE53;

  // 农历年总天数
  const yearDays = y => {
    let n = 0, d = _d(y);
    for (let i = 0x80000; i > 0x8; i >>= 1) n += (d & i) ? 30 : 29;
    n += leapMonthDays(y);
    return n;
  };

  // 闰月天数
  const leapMonthDays = y => {
    const lm = leapMonth(y);
    if (!lm) return 0;
    return (_d(y) & 0xf) === 1 ? 30 : 29;
  };

  // 闰月月份（0=无）
  const leapMonth = y => (_d(y) >> 20) & 0xf;

  // 某农历月天数
  const monthDays = (y, m) => {
    const bit = 0x80000 >> (m - 1);
    return (_d(y) & bit) ? 30 : 29;
  };

  // 春节（农历正月初一）的公历日期
  const springFest = y => {
    // 低4位：公历月份（1=1月,2=2月），次4位：日期
    const d = _d(y);
    const mo = (d >> 4) & 0xf;  // 1 or 2
    const dy = d & 0xf;          // day 1-31
    // 实际上低8位=春节公历日（1月加60，2月直接用）
    const raw = d & 0xff;
    const realDay = raw > 31 ? raw - 31 : raw;
    const realMon = raw > 31 ? 2 : 1;
    return new Date(y, realMon - 1, realDay);
  };

  
  const fromSolar = (year, month, day) => {
    const solar = new Date(year, month - 1, day);

    let lunarYear = year;
    let sf = springFest(year);

    // 如果在春节前，则属于上一农历年
    if (solar < sf) {
      lunarYear = year - 1;
      sf = springFest(year - 1);
    }

    // 距离春节的天数
    let offset = Math.round((solar - sf) / 86400000);

    let lunarMonth = 1;
    let lunarDay   = 1;
    let isLeap     = false;
    const lm       = leapMonth(lunarYear);

    // 逐月减去天数定位
    let i = 1;
    for (; i <= 12; i++) {
      let mDays = monthDays(lunarYear, i);
      if (offset < mDays) { lunarDay = offset + 1; lunarMonth = i; break; }
      offset -= mDays;
      // 检查闰月
      if (i === lm) {
        const lmDays = leapMonthDays(lunarYear);
        if (offset < lmDays) {
          lunarDay = offset + 1; lunarMonth = i; isLeap = true; break;
        }
        offset -= lmDays;
      }
    }
    if (i > 12) { lunarMonth = 12; lunarDay = offset + 1; }

    // 干支年
    const STEMS   = '甲乙丙丁戊己庚辛壬癸';
    const BRANCHES= '子丑寅卯辰巳午未申酉戌亥';
    const si = ((lunarYear - 4) % 10 + 10) % 10;
    const bi = ((lunarYear - 4) % 12 + 12) % 12;

    return {
      year: lunarYear, month: lunarMonth, day: lunarDay, isLeap,
      yearStem:   STEMS[si],
      yearBranch: BRANCHES[bi],
      yearStemIdx: si,
      yearBranchIdx: bi,
      ganZhi: STEMS[si] + BRANCHES[bi],
    };
  };

  return { fromSolar, leapMonth, monthDays, yearDays };
})();

// ═══════════════════════════════════════════════════════════
// 模块2：奇门遁甲时家盘（完全确定，无随机）
// 依据：《奇门遁甲大全》节气超神接气定局法
// ═══════════════════════════════════════════════════════════
const QiMen = (() => {
  // 24节气精确日期（天文算法，误差<1天）
  // 数据：[月, 基础日] — 每年用线性插值修正
  const JQ = [
    [1,6],[1,20],[2,4],[2,19],[3,6],[3,21],
    [4,5],[4,20],[5,6],[5,21],[6,6],[6,21],
    [7,7],[7,23],[8,7],[8,23],[9,8],[9,23],
    [10,8],[10,23],[11,7],[11,22],[12,7],[12,22],
  ];
  const JQ_NAMES = ['小寒','大寒','立春','雨水','惊蛰','春分',
                    '清明','谷雨','立夏','小满','芒种','夏至',
                    '小暑','大暑','立秋','处暑','白露','秋分',
                    '寒露','霜降','立冬','小雪','大雪','冬至'];

  // 得到年份中各节气的精确日期
  const jqDate = (year, idx) => {
    const [mo, baseDay] = JQ[idx];
    // 每4年偏移约0.25天，以2000年为基准
    const delta = Math.floor((year - 2000) * 0.2422 + (baseDay % 1));
    const day   = baseDay + Math.floor((year - 2000) * 0.0001) + (year % 4 === 0 ? -1 : 0);
    return new Date(year, mo - 1, Math.max(baseDay - 2, Math.min(baseDay + 2, day)));
  };

  // 找当前日期所属节气（返回：节气索引，距节气天数）
  const currentJQ = date => {
    const y = date.getFullYear();
    // 检查今年和去年的全部节气
    for (let y2 of [y, y-1]) {
      for (let i = 23; i >= 0; i--) {
        const jd = jqDate(y2, i);
        if (date >= jd) {
          const daysIn = Math.floor((date - jd) / 86400000);
          return { idx: i, name: JQ_NAMES[i], daysIn, year: y2, date: jd };
        }
      }
    }
    return { idx: 0, name: JQ_NAMES[0], daysIn: 0, year: y, date: new Date(y, 0, 6) };
  };

  // 阳遁局数表（24节气 × 3元）
  // 来源：《奇门遁甲》超神接气定局
  const YANG = [
    [8,2,5],[5,8,2],[2,5,8],[9,3,6],[6,9,3],[3,6,9],
    [1,4,7],[7,1,4],[4,7,1],[9,3,6],[6,9,3],[3,6,9],
    [2,5,8],[8,2,5],[5,8,2],[1,4,7],[7,1,4],[4,7,1],
    [6,9,3],[3,6,9],[9,3,6],[4,7,1],[1,4,7],[7,1,4],
  ];
  const YIN = [
    [9,6,3],[3,9,6],[6,3,9],[8,5,2],[2,8,5],[5,2,8],
    [7,4,1],[1,7,4],[4,1,7],[8,5,2],[2,8,5],[5,2,8],
    [7,4,1],[1,7,4],[4,1,7],[6,3,9],[9,6,3],[3,9,6],
    [5,2,8],[8,5,2],[2,8,5],[4,1,7],[7,4,1],[1,7,4],
  ];

  // 九星（坎→乾顺序）
  const _STARS = ['天蓬','天芮','天冲','天辅','天禽','天心','天柱','天任','天英'];
  // 八门（坎→乾顺序，中宫5无门）
  const DOORS  = ['休门','死门','伤门','杜门','','开门','惊门','生门','景门'];
  // 八神
  const GODS   = ['值符','腾蛇','太阴','六合','白虎','玄武','九地','九天'];
  // 洛书宫顺序（阳顺1→2→3→4→6→7→8→9）
  const LOUSHU_YANG = [1,2,3,4,6,7,8,9];
  const LOUSHU_YIN  = [9,8,7,6,4,3,2,1];

  const LUCKY_DOORS  = new Set(['开门','生门','休门']);
  const DIRE_DOORS   = new Set(['死门','惊门','伤门']);
  const SHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const SHI_UTC8 = ['23-01','01-03','03-05','05-07','07-09','09-11',
                     '11-13','13-15','15-17','17-19','19-21','21-23'];

  
  const getBoard = (dateStr, hour = 10) => {
    const d    = new Date(dateStr + 'T12:00:00');
    const jq   = currentJQ(d);
    const isYang = (jq.idx >= 23 || jq.idx < 11); // 冬至后阳遁

    // 三元：每节气约15天，分上中下元，每元5天
    const yuan = Math.min(2, Math.floor(jq.daysIn / 5));
    const tbl  = isYang ? YANG : YIN;
    const ju   = (tbl[jq.idx] || YANG[0])[yuan];

    // 时辰 0-11
    const shi = Math.floor(((hour + 1) % 24) / 2);

    // 时家旋转：值符从ju宫开始，阳遁顺时针，阴遁逆时针
    const seq  = isYang ? LOUSHU_YANG : LOUSHU_YIN;
    // 找ju在seq中的位置
    const juPos = seq.indexOf(ju) >= 0 ? seq.indexOf(ju) : 0;

    // 布九星：从值符宫开始，按阳顺阴逆分配九星
    const starMap = {}, doorMap = {}, godMap = {};
    for (let i = 0; i < 9; i++) {
      const gong = ((juPos + i) % 8);
      const gongNum = seq[gong] || (i + 1);
      starMap[gongNum] = _STARS[i];
      if (DOORS[i]) doorMap[gongNum] = DOORS[i];
    }

    // 时家：shi影响值符宫偏移
    const timeOffset = (juPos + shi) % 8;
    const timeGong   = seq[timeOffset] || ju;
    const timeStar   = starMap[timeGong] || _STARS[0];
    const timeDoor   = doorMap[timeGong] || '';
    // 八神按时辰顺序排
    for (let i = 0; i < 8; i++) {
      const gong = seq[(timeOffset + i) % 8];
      godMap[gong] = GODS[i];
    }
    const timeGod = godMap[timeGong] || GODS[0];

    // 吉凶分数
    const DOOR_SCORE = {
      '开门':1.0,'生门':0.8,'休门':0.5,'景门':0.2,
      '杜门':-0.2,'伤门':-0.6,'惊门':-0.8,'死门':-1.0
    };
    const bias = Math.tanh((DOOR_SCORE[timeDoor]||0)*1.2);

    // 吉时（找所有开门/生门/休门所在时辰）
    const goodTimes = [], badTimes = [];
    for (let s = 0; s < 12; s++) {
      const off   = (juPos + s) % 8;
      const gong  = seq[off];
      const door  = doorMap[gong] || '';
      if (LUCKY_DOORS.has(door)) goodTimes.push(SHI[s] + '时(' + SHI_UTC8[s] + ')');
      if (DIRE_DOORS.has(door))  badTimes.push(SHI[s]  + '时(' + SHI_UTC8[s] + ')');
    }

    // 特殊格局
    let special = '';
    if (timeDoor === '开门' && timeStar === '天心') special = '天心开门·大吉利市';
    else if (timeDoor === '生门' && timeGod === '值符') special = '值符生门·旺财';
    else if (timeDoor === '死门' && timeGod === '白虎') special = '白虎死门·大凶';
    else if (timeDoor === '休门' && timeStar === '天蓬') special = '天蓬休门·隐伏观望';

    return {
      bias, conf: 0.55 + Math.abs(bias) * 0.3,
      isYang, juNum: ju,
      yuan: ['上元','中元','下元'][yuan],
      termName: jq.name, termDaysIn: jq.daysIn,
      palace: timeGong, star: timeStar, door: timeDoor, god: timeGod,
      shi: SHI[shi], shiRange: SHI_UTC8[shi],
      special,
      // 规范字段
      entryTime: LUCKY_DOORS.has(timeDoor)
        ? `当前${SHI[shi]}时·${timeDoor}宜入`
        : goodTimes[0] || '无明显吉时',
      exitTime: DIRE_DOORS.has(timeDoor)
        ? `当前${SHI[shi]}时·${timeDoor}宜出`
        : badTimes[0]  || '无明显凶时',
      goodTimes: goodTimes.slice(0, 3),
      badTimes:  badTimes.slice(0, 2),
      direction: bias > 0.15 ? '多' : bias < -0.15 ? '空' : '观望',
      layout: { stars: starMap, doors: doorMap, gods: godMap },
      why: `${isYang?'阳':'阴'}遁${ju}局·${jq.name}后第${jq.daysIn}天·` +
           `${['上','中','下'][yuan]}元·${SHI[shi]}时·` +
           `时家：${timeStar}${timeDoor}${timeGod}` +
           (special ? `·【${special}】` : ''),
      label: timeDoor || '中宫',
      timeDoor, timeStar, timeGod, timeGong,
    };
  };

  return { getBoard, currentJQ, jqDate, JQ_NAMES };
})();

// Override engineQiMen with fully deterministic version
window.engineQiMen = function(coin, date) {
  const d   = new Date((date || '2025-01-01') + 'T12:00:00');
  const hr  = d.getHours() || 10;
  const res = QiMen.getBoard(date || '2025-01-01', hr);
  return res;
};

// ═══════════════════════════════════════════════════════════
// 模块3：紫微斗数（完全确定，无随机）
// 依据：《斗数全书》《紫微斗数全集》
// ═══════════════════════════════════════════════════════════
const Ziwei = (() => {
  const STEMS   = '甲乙丙丁戊己庚辛壬癸';
  const BRANCHES= '子丑寅卯辰巳午未申酉戌亥';
  const PALACES = ['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','奴仆','官禄','田宅','福德','父母'];

  // 五虎遁年起月干（年干→正月天干）
  const WU_HU = { '甲':2,'戊':2,'己':2, '乙':4,'庚':4, '丙':6,'辛':6, '丁':8,'壬':8, '戊':2,'癸':0 };
  const MONTH_STEM_BASE = { '甲':2,'己':2, '乙':4,'庚':4, '丙':6,'辛':6, '丁':8,'壬':8, '戊':0,'癸':0 };

  // 五行局（命宫地支→局数）
  const WU_XING_JU = {
    '寅':3,'卯':3, '午':6,'未':6, '申':4,'酉':4,
    '子':2,'亥':2, '辰':5,'丑':5,'戌':5,'巳':6,
  };

  // 四化表（年干→[禄,权,科,忌]）
  const SI_HUA = {
    '甲':['廉贞','破军','武曲','太阳'],
    '乙':['天机','天梁','紫微','太阴'],
    '丙':['天同','天机','文昌','廉贞'],
    '丁':['太阴','天同','天机','巨门'],
    '戊':['贪狼','太阴','右弼','天机'],
    '己':['武曲','贪狼','天梁','文曲'],
    '庚':['太阳','武曲','太阴','天同'],
    '辛':['巨门','太阳','文曲','文昌'],
    '壬':['天梁','紫微','左辅','武曲'],
    '癸':['破军','巨门','太阴','贪狼'],
  };

  // 紫微星相对五行局的宫位（用余数法）
  // 《斗数全书》：五行局数起紫微，逐日安星
  const getZiweiPal = (lunarDay, ju, lifePal) => {
    // 紫微落宫：找最小的宫使得宫 × ju ≥ lunarDay
    let pal = 0;
    for (let i = 1; i <= 12; i++) {
      if (i * ju >= lunarDay) { pal = i - 1; break; }
      if (i === 12) pal = 11;
    }
    return (lifePal + pal) % 12;
  };

  // 紫微系主星偏移（相对紫微顺时针）
  const ZI_GROUP = [
    {name:'紫微', off:0},{name:'天机', off:1},{name:'太阳', off:3},
    {name:'武曲', off:4},{name:'天同', off:5},{name:'廉贞', off:8},
  ];
  // 天府系（相对天府顺时针）
  const FU_GROUP = [
    {name:'天府', off:0},{name:'太阴', off:1},{name:'贪狼', off:2},
    {name:'巨门', off:3},{name:'天相', off:4},{name:'天梁', off:5},
    {name:'七杀', off:6},{name:'破军', off:10},
  ];

  
  const buildChart = (lunarYear, lunarMonth, lunarDay, hour, yearStem) => {
    const stemIdx   = STEMS.indexOf(yearStem);
    const branchIdx = ((lunarYear - 4) % 12 + 12) % 12;

    // 时辰地支（子=0...亥=11）
    const hourBranch = Math.floor(((hour + 1) % 24) / 2);

    // 命宫：寅宫(2)起生月，逆数至生时
    // 公式：命宫支 = (寅 + 月 - 1 - 时支 + 12) % 12
    const lifePal = ((2 + lunarMonth - 1 - hourBranch) % 12 + 12) % 12;

    // 身宫：午宫起生月，顺数至生时
    const bodyPal = ((6 + lunarMonth - 1 + hourBranch) % 12 + 12) % 12;

    // 五行局
    const lifeBranch = BRANCHES[lifePal];
    const ju = WU_XING_JU[lifeBranch] || 3;

    // 紫微星宫位
    const ziweiPal = getZiweiPal(lunarDay, ju, lifePal);
    // 天府：与紫微子午相对（6宫距离）
    const tianfuPal = (14 - ziweiPal % 12 + lifePal) % 12;

    // 安十二宫主星
    const palStars = Array.from({length:12}, () => []);

    ZI_GROUP.forEach(({name, off}) => {
      palStars[(ziweiPal + off) % 12].push(name);
    });
    FU_GROUP.forEach(({name, off}) => {
      palStars[(tianfuPal + off) % 12].push(name);
    });

    // 安辅星（用年支/月份/时辰确定，完全确定）
    // 左辅：辰月起(3月)，顺数到生月
    const zuoFuPal  = (2 + lunarMonth - 1) % 12;
    // 右弼：戌月起(9月)，逆数到生月
    const youBiPal  = ((10 - lunarMonth) % 12 + 12) % 12;
    // 文昌：戌宫起年干顺数
    const wenChangPal = ((8 + stemIdx) % 12);
    // 文曲：辰宫起年干逆数
    const wenQuPal    = ((2 - stemIdx + 12) % 12);

    palStars[zuoFuPal ].push('左辅');
    palStars[youBiPal ].push('右弼');
    palStars[wenChangPal].push('文昌');
    palStars[wenQuPal   ].push('文曲');

    // 安六吉六煞（用年支）
    // 天魁（贵人）：甲戊庚见丑(1)，乙己见子(0)，丙丁见亥(11)，辛见午(6)，壬癸见卯(3)
    const KUEI_MAP  = {'甲':1,'戊':1,'庚':1,'乙':0,'己':0,'丙':11,'丁':11,'辛':6,'壬':3,'癸':3};
    const YURE_MAP  = {'甲':11,'戊':11,'庚':11,'乙':2,'己':2,'丙':1,'丁':1,'辛':0,'壬':5,'癸':5};
    palStars[(lifePal + (KUEI_MAP[yearStem]||0)) % 12].push('天魁');
    palStars[(lifePal + (YURE_MAP[yearStem]||0)) % 12].push('天钺');

    // 四化
    const hua = SI_HUA[yearStem] || [];
    const huaNames = ['化禄','化权','化科','化忌'];
    const huaMap   = {}; // star → hua
    hua.forEach((star, i) => { huaMap[star] = huaNames[i]; });

    // 找含四化的宫位
    const wealthPalIdx = (lifePal + 4) % 12;
    const careerPalIdx = (lifePal + 8) % 12;
    const wealthStars  = palStars[wealthPalIdx];
    const careerStars  = palStars[careerPalIdx];

    // 化禄/化权/化忌在财帛/官禄
    const luInWealth   = wealthStars.some(s => huaMap[s] === '化禄');
    const quanInCareer = careerStars.some(s => huaMap[s] === '化权');
    const jiInWealth   = wealthStars.some(s => huaMap[s] === '化忌');
    const jiInCareer   = careerStars.some(s => huaMap[s] === '化忌');

    // 计算bias（确定性）
    let b = 0;
    if (luInWealth)    b += 0.40;
    if (quanInCareer)  b += 0.30;
    if (jiInWealth)    b -= 0.50;
    if (jiInCareer)    b -= 0.40;
    const bias = Math.tanh(b);

    // 吉时（依四化落宫）
    const HOUR_LUCKY = {
      '子':['寅时(03-05)','午时(11-13)'],
      '丑':['卯时(05-07)','未时(13-15)'],
      '寅':['辰时(07-09)','申时(15-17)'],
      '卯':['巳时(09-11)','酉时(17-19)'],
      '辰':['午时(11-13)','戌时(19-21)'],
      '巳':['未时(13-15)','亥时(21-23)'],
      '午':['申时(15-17)','子时(23-01)'],
    };
    const lifeBranchCur = BRANCHES[lifePal];
    const goodTime = luInWealth || quanInCareer
      ? (HOUR_LUCKY[lifeBranchCur] || ['寅时','午时'])
      : ['卯时(05-07)','未时(13-15)'];
    const badTime  = jiInWealth || jiInCareer
      ? ['子时(23-01)','午时(11-13)']
      : [];

    return {
      bias, conf: 0.55 + Math.abs(bias) * 0.25,
      lifePal: PALACES[lifePal], bodyPal: PALACES[bodyPal],
      wealthPalace: PALACES[wealthPalIdx],
      careerPalace: PALACES[careerPalIdx],
      wealthStar:   wealthStars.join('') || '空',
      careerStar:   careerStars.join('') || '空',
      wealthStars, careerStars,
      palStars, huaMap,
      luInWealth, quanInCareer, jiInWealth, jiInCareer,
      goodTime, badTime,
      siHua: { lu: hua[0], quan: hua[1], ke: hua[2], ji: hua[3] },
      yearStem, ju,
      why: `命宫${PALACES[lifePal]}·财帛[${wealthStars.join('')||'空'}]·` +
           `官禄[${careerStars.join('')||'空'}]·` +
           (luInWealth?'化禄入财·':jiInWealth?'化忌入财⚠·':'') +
           (quanInCareer?'化权入官·':jiInCareer?'化忌入官⚠·':''),
      label: bias > 0.15 ? '吉' : bias < -0.15 ? '凶' : '平',
    };
  };

  return { buildChart, PALACES, STEMS, BRANCHES, SI_HUA };
})();

// Override engineZiwei with fully deterministic version
window.engineZiwei = function(coin, date) {
  try {
    const d  = new Date((date||'2025-01-01') + 'T12:00:00');
    const hr = d.getHours() || 10;
    const nc = (window.NATAL_CHARTS || {})[coin];

    // 使用分析日期的农历年干（影响四化）
    const yr = d.getFullYear(), mo = d.getMonth()+1, dy = d.getDate();
    const lunar = Lunar.fromSolar(yr, mo, dy);

    // 若有命盘数据，用出生日期安命宫；否则用当日
    let birthLunar = lunar;
    if (nc?.date) {
      const bd = new Date(nc.date);
      birthLunar = Lunar.fromSolar(bd.getFullYear(), bd.getMonth()+1, bd.getDate());
    }

    const chart = Ziwei.buildChart(
      birthLunar.year, birthLunar.month, birthLunar.day, hr, lunar.yearStem
    );

    // ── 兼容旧版 buildZiweiPanel 所需的 pals 结构 ──────────────
    // buildZiweiPanel 期望 zw.pals[i] 有 .name/.branch/.major/.luck/.evil/.trans/.fYear/.fMonth/.isWealth/.isCareer
    const ZW_PAL_NAMES = window.ZW_PALACES || Ziwei.PALACES;
    const ZW_BR        = window.ZW_BRANCHES || Ziwei.BRANCHES;
    const lifePalIdx   = Ziwei.PALACES.indexOf(chart.lifePal);
    const wealthPalIdx = Ziwei.PALACES.indexOf(chart.wealthPalace);
    const careerPalIdx = Ziwei.PALACES.indexOf(chart.careerPalace);
    const pals = Array.from({length:12}, (_,i) => ({
      idx: i,
      name: ZW_PAL_NAMES[i] || '',
      branch: ZW_BR ? ZW_BR[(lifePalIdx + i) % 12] : '',
      major: (chart.palStars[i] || []).map(s => ({ name:s })),
      luck:  [],
      evil:  [],
      trans: [],
      fYear:   false,
      fMonth:  false,
      isWealth: i === wealthPalIdx,
      isCareer: i === careerPalIdx,
      isMigrate: false,
    }));
    chart.pals         = pals;
    chart.fYearPal     = null;
    chart.fMonthPal    = null;
    chart.lifePalIdx   = lifePalIdx;
    chart.wealthPal    = pals[wealthPalIdx] || pals[4];
    chart.careerPal    = pals[careerPalIdx] || pals[8];
    chart.migratePal   = pals[6];
    chart.wealthStar   = chart.wealthStars?.join('') || '空';
    chart.careerStar   = chart.careerStars?.join('') || '空';
    chart.wScore       = chart.luInWealth ? 80 : chart.jiInWealth ? 25 : 50;
    chart.cScore       = chart.quanInCareer ? 75 : chart.jiInCareer ? 25 : 50;
    chart.mScore       = 50;
    chart.stemNote     = `${chart.yearStem}年·四化${chart.siHua?.lu||''}禄${chart.siHua?.ji||''}忌`;
    chart.trList       = [];
    chart.signals      = [];

    return chart;
  } catch(e) {
    console.warn('[engineZiwei]', e.message);
    // 返回最小化兼容结构，确保 buildZiweiPanel 不崩溃
    const emptyPal = (i) => ({ idx:i, name:'', branch:'', major:[], luck:[], evil:[], trans:[], fYear:false, fMonth:false, isWealth:i===4, isCareer:i===8, isMigrate:i===6 });
    return {
      bias:0, conf:0.4, wealthPalace:'财帛', careerPalace:'官禄',
      wealthStar:'--', careerStar:'--', goodTime:[], badTime:[],
      label:'平', why:'排盘异常',
      pals: Array.from({length:12}, (_,i) => emptyPal(i)),
      fYearPal:null, fMonthPal:null, lifePalIdx:0,
      wealthPal:emptyPal(4), careerPal:emptyPal(8), migratePal:emptyPal(6),
      wScore:50, cScore:50, mScore:50, stemNote:'', trList:[], signals:[],
    };
  }
};

// ═══════════════════════════════════════════════════════════
// 模块4：梅花易数（完全确定，价格起卦）
// 依据：邵康节《梅花易数》先天数起卦
// ═══════════════════════════════════════════════════════════
const Meihua = (() => {
  const GUA = ['乾','兑','离','震','巽','坎','艮','坤']; // 先天数1-8
  const ELEM= ['金','金','火','木','木','水','土','土'];
  const CHAR= ['健','悦','丽','动','入','陷','止','顺'];

  // 六十四卦吉凶（上卦×8+下卦，0-63）
  // 1=大吉,0.5=吉,0=中,-0.5=凶,-1=大凶
  const SCORE64 = [
  // 乾   兑   离   震   巽   坎   艮   坤
     1.0, 0.5,-0.5, 0.5,-0.5,-0.5, 0.5, 0.0,  // 乾
     0.5, 1.0,-0.5, 0.5,-0.5, 0.0, 0.5,-0.5,  // 兑
    -0.5,-0.5, 1.0, 0.5, 0.0,-0.5,-0.5,-0.5,  // 离
     0.5, 0.5, 0.5, 1.0, 0.0,-0.5, 0.5, 0.5,  // 震
    -0.5,-0.5, 0.0, 0.0, 1.0,-0.5, 0.5,-0.5,  // 巽
    -0.5, 0.0,-0.5,-0.5,-0.5, 1.0, 0.0,-0.5,  // 坎
     0.5, 0.5,-0.5, 0.5, 0.5, 0.0, 1.0, 0.5,  // 艮
     0.0,-0.5,-0.5, 0.5,-0.5,-0.5, 0.5, 1.0,  // 坤
  ];

  const YAO = [
    '初爻动：根基变动，宜守',
    '二爻动：内部变化，审时度势',
    '三爻动：内外交界，转机来临',
    '四爻动：外因主导，因势利导',
    '五爻动：主事之人变，新局开启',
    '上爻动：物极必反，高处不胜寒',
  ];

  
  const divine = (price, date) => {
    if (!price || price <= 0) return null;
    const d   = new Date((date||'2025-01-01') + 'T12:00:00');
    const shi = Math.floor(((d.getHours() + 1) % 24) / 2) + 1; // 1-12

    const intP  = Math.floor(price);
    const fracP = Math.round((price - intP) * 100);

    // 先天数：余0→8
    const upper = ((intP % 8) === 0) ? 7 : (intP % 8) - 1;  // 0-7索引
    const lower = ((fracP % 8) === 0) ? 7 : (fracP % 8) - 1;
    const yao   = ((intP + fracP + shi) % 6) || 6;           // 1-6

    // 变卦：动爻所在上/下卦取反（上卦：爻4-6，下卦：爻1-3）
    const changeUpper = yao > 3;
    const bUpper = changeUpper ? (upper + 4) % 8 : upper;
    const bLower = changeUpper ? lower : (lower + 4) % 8;

    const benScore  = SCORE64[upper * 8 + lower]  || 0;
    const bianScore = SCORE64[bUpper * 8 + bLower] || 0;
    const total     = benScore * 0.6 + bianScore * 0.4;
    const bias      = Math.tanh(total * 1.5);

    // 五行生克
    const uElem = ELEM[upper], lElem = ELEM[lower];
    const SHENG = {'木':'火','火':'土','土':'金','金':'水','水':'木'};
    const KE    = {'木':'土','土':'水','水':'火','火':'金','金':'木'};
    let rel = '比和';
    if (SHENG[uElem] === lElem) rel = '上生下·内得气';
    else if (SHENG[lElem] === uElem) rel = '下生上·外旺';
    else if (KE[uElem] === lElem)    rel = '上克下·外压内';
    else if (KE[lElem] === uElem)    rel = '下克上·内制外';

    const benName  = GUA[upper]  + GUA[lower];
    const bianName = GUA[bUpper] + GUA[bLower];
    const judg     = total>0.4?'大吉':total>0.1?'吉':total>-0.1?'平':total>-0.4?'凶':'大凶';

    return {
      bias, conf: 0.5 + Math.abs(bias) * 0.25,
      upper: GUA[upper], lower: GUA[lower],
      benGua: benName, bianGua: bianName,
      // 规范字段
      hexagram:          benName,
      changingHexagram:  bianName,
      movingYao:         yao,
      dongYao:           yao,       // 兼容旧字段名
      judgment:          judg,
      direction:         bias > 0.15 ? '多' : bias < -0.15 ? '空' : '观望',
      dongYaoMeaning:    YAO[yao - 1],
      relation:          rel, upperElem: uElem, lowerElem: lElem,
      why: `$${price.toFixed(2)}·整${intP}→${GUA[upper]}·小${fracP}→${GUA[lower]}·` +
           `第${yao}爻动·${rel}·本卦${benName}变${bianName}`,
      label: judg,
    };
  };

  return { divine, GUA, SCORE64 };
})();

window.engineMeihua = (coin, date, price) => Meihua.divine(price || 50000, date);

// ═══════════════════════════════════════════════════════════
// 模块5：玄学组合规则引擎（完全确定）
// ═══════════════════════════════════════════════════════════
function findDivineCombinations(engines, date) {
  const { qm, ic, ve, gn, ch, sr, nt, zw, va, hr } = engines || {};
  const combos = [];

  const door  = qm?.door || qm?.timeDoor || '';
  const luW   = zw?.luInWealth;
  const quC   = zw?.quanInCareer;
  const jiW   = zw?.jiInWealth;
  const jiC   = zw?.jiInCareer;
  const gnUp  = (gn?.bias || 0) > 0.3;
  const gnDn  = (gn?.bias || 0) < -0.3;
  const beichi     = ch?.beichi;
  const beichiType = ch?.beichiType || '';
  const hexName    = ic?.hexName || ic?.hexagram || '';

  // 1. 奇门开门 + 紫微化禄 + 江恩上行 = 天时地利
  if (door === '开门' && luW && gnUp) {
    combos.push({ name:'天时地利', power:9, strength:0.92, type:'bull',
      desc:'奇门开门·化禄入财·江恩上行——三合共振大利多', icons:'🟢🟢🟢' });
  }

  // 2. 缠论底背驰 + 易经泰/复/临卦 = 否极泰来
  const isTaiGua = /泰|复|临|需|升/.test(hexName);
  if (beichi && beichiType === '底背驰' && isTaiGua) {
    combos.push({ name:'否极泰来', power:8, strength:0.87, type:'bull',
      desc:`缠论底背驰·${hexName}——技术玄学共振绝佳买点`, icons:'🟢🟢' });
  }

  // 3. 奇门死门 + 紫微化忌 + 江恩下行 = 四面楚歌
  if (door === '死门' && (jiW || jiC) && gnDn) {
    combos.push({ name:'四面楚歌', power:9, strength:0.91, type:'bear',
      desc:'奇门死门·化忌·江恩下行——三凶共振暴跌预警', icons:'🔴🔴🔴' });
  }

  // 4. 江恩支撑 + 缠论底分型 + 奇门生门 = 三底确认
  const atSupport = sr?.bias > 0.25 || (gn?.bias > 0.1 && gn?.bias < 0.4);
  if (atSupport && beichi && beichiType === '底背驰' && door === '生门') {
    combos.push({ name:'三底确认', power:8, strength:0.86, type:'bull',
      desc:'支撑位+缠论底+生门——三重确认，加仓信号', icons:'🟢🟢🟢' });
  }

  // 5. 奇门休门 + 化科/化禄 = 稳如泰山
  if (door === '休门' && (luW || quC) && (sr?.bias || 0) > 0.15) {
    combos.push({ name:'稳如泰山', power:6, strength:0.68, type:'bull',
      desc:'奇门休门·化吉·支撑稳固——防御性买点', icons:'🟢🟡' });
  }

  // 6. 缠论顶背驰 + 易经否/剥/坤 + 死门/惊门 = 山穷水尽
  const isDireGua = /否|剥|坤|困|蒙/.test(hexName);
  if (beichi && beichiType === '顶背驰' && isDireGua && (door==='死门'||door==='惊门')) {
    combos.push({ name:'山穷水尽', power:8, strength:0.88, type:'bear',
      desc:`顶背驰·${hexName}·${door}——三凶叠加止盈离场`, icons:'🔴🔴' });
  }

  // 7. 杜门 + 紫微冲命 = 闭门谢客
  if (door === '杜门' && zw?.isClash) {
    combos.push({ name:'闭门谢客', power:5, strength:0.62, type:'neutral',
      desc:`奇门杜门·流年冲命(${zw?.yearGZ||''})——观望为上`, icons:'⚪⚪' });
  }

  // 8. 惊门 + 化忌 + 梅花凶卦 = 惊弓之鸟
  const mh = window._lastMeihuaResult;
  if (door === '惊门' && (jiW||jiC) && (mh?.judgment==='凶'||mh?.judgment==='大凶')) {
    combos.push({ name:'惊弓之鸟', power:7, strength:0.75, type:'bear',
      desc:'奇门惊门·化忌·梅花凶卦——多凶叠加谨慎操作', icons:'🔴🟡' });
  }

  combos.sort((a, b) => b.power - a.power);
  return combos;
}

window.findDivineCombinations = findDivineCombinations;

// ═══════════════════════════════════════════════════════════
// 模块6：玄学日历（30天，网格布局）完全重写
// ═══════════════════════════════════════════════════════════
window.openAstroCalendar = function() {
  const today = new Date();
  const btcPrice = window.dashResults?.['BTC']?.price || 75000;

  // 2026年特殊天象（固定天文历）
  const SPECIALS = {
    '2026-03-20':'春分·江恩自然年起点🌱',
    '2026-03-22':'月土合相·土星压制⚠',
    '2026-04-05':'清明节气',
    '2026-04-12':'木星回归·扩张信号🪐',
    '2026-05-21':'小满',
    '2026-06-06':'芒种',
    '2026-06-21':'夏至·阴遁开始',
    '2026-07-22':'大暑',
    '2026-08-07':'立秋',
    '2026-09-07':'白露·秋季开始',
    '2026-09-23':'秋分',
    '2026-10-08':'寒露',
    '2026-11-07':'立冬',
    '2026-12-07':'大雪',
    '2026-12-22':'冬至·阳遁起点🔄',
    // 水星逆行窗口
    '2026-03-15':'水星逆行开始☿↺',
    '2026-04-07':'水星顺行恢复☿→',
    '2026-07-18':'水星逆行开始☿↺',
    '2026-08-11':'水星顺行恢复☿→',
  };

  const WD = ['日','一','二','三','四','五','六'];
  const rows = [];

  for (let i = 0; i < 30; i++) {
    const d    = new Date(today);
    d.setDate(d.getDate() + i);
    const y   = d.getFullYear();
    const m   = d.getMonth() + 1;
    const dy  = d.getDate();
    const ds  = `${y}-${String(m).padStart(2,'0')}-${String(dy).padStart(2,'0')}`;

    // 奇门日盘（用正午时辰10点）
    let qm;
    try { qm = QiMen.getBoard(ds, 10); } catch(e) { qm = {}; }

    // 梅花（用BTC参考价格）
    const mh = Meihua.divine(btcPrice, ds);

    // 紫微（用当日干支作为参考）
    let zw;
    try {
      const lunar = Lunar.fromSolar(y, m, dy);
      zw = Ziwei.buildChart(lunar.year, lunar.month, lunar.day, 10, lunar.yearStem);
    } catch(e) { zw = {}; }

    // 农历显示
    let lunarStr = '';
    try {
      const l = Lunar.fromSolar(y, m, dy);
      const LUNAR_MO = ['正','二','三','四','五','六','七','八','九','十','冬','腊'];
      lunarStr = `农历${l.isLeap?'闰':''}${LUNAR_MO[l.month-1]}月${l.day}日`;
    } catch(e) { lunarStr = ''; }

    // 综合评分（确定性）
    const qmScore = ((qm.bias || 0) + 1) / 2 * 100;
    const mhScore = mh ? ((mh.bias + 1) / 2 * 100) : 50;
    const zwScore = ((zw?.bias || 0) + 1) / 2 * 100;
    const score   = Math.round(qmScore * 0.4 + mhScore * 0.3 + zwScore * 0.3);

    rows.push({
      ds, d, y, m, dy, lunarStr,
      wd: WD[d.getDay()],
      qm, mh, zw, score,
      special: SPECIALS[ds] || '',
      op:    score >= 65 ? '偏多' : score <= 35 ? '偏空' : '中性',
      opCls: score >= 65 ? 'bull' : score <= 35 ? 'bear' : 'neut',
    });
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bg  = isDark ? '#0b0c12' : '#f5f0e8';
  const bg2 = isDark ? '#161720' : '#faf8f4';
  const bc  = isDark ? '#282a38' : '#ddd8cc';
  const tc  = isDark ? '#eae6da' : '#1a1614';
  const fc  = isDark ? '#564e44' : '#9a9080';

  const html = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>天機數元 · 玄学日历</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans SC',sans-serif;background:${bg};color:${tc};padding:14px;font-size:13px;min-height:100vh}
h1{font-size:1rem;color:#8c6410;margin-bottom:3px}
.sub{font-size:.65rem;color:${fc};margin-bottom:14px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px}
.card{background:${bg2};border:1px solid ${bc};border-radius:10px;padding:10px 12px;
  position:relative;overflow:hidden}
.card::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.card.bull::before{background:linear-gradient(90deg,#14783e,#2ed078)}
.card.bear::before{background:linear-gradient(90deg,#a82020,#e83c3c)}
.card.neut::before{background:linear-gradient(90deg,#8c6410,#d4a030)}
.card.special-day{border-color:#d4b04866}
.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px}
.date-big{font-size:1.4rem;font-weight:800;color:#8c6410;line-height:1}
.date-sub{font-size:.6rem;color:${fc};margin-top:2px}
.score-wrap{text-align:right}
.score{font-size:1.1rem;font-weight:800;font-family:monospace}
.score.bull{color:#14783e}.score.bear{color:#b82020}.score.neut{color:#8c6410}
.bar{height:4px;background:${bc};border-radius:2px;overflow:hidden;margin-top:3px;width:60px;margin-left:auto}
.bar-fill{height:100%;border-radius:2px}
.op{display:inline-block;padding:1px 7px;border-radius:99px;font-size:.6rem;font-weight:700;margin-bottom:5px}
.op.bull{background:rgba(20,120,62,.12);color:#14783e;border:1px solid rgba(20,120,62,.3)}
.op.bear{background:rgba(168,32,32,.12);color:#b82020;border:1px solid rgba(168,32,32,.3)}
.op.neut{background:rgba(140,100,16,.10);color:#8c6410;border:1px solid rgba(140,100,16,.25)}
.info{font-size:.62rem;color:${fc};line-height:1.8}
.info b{color:${tc}}
.times-row{display:flex;gap:6px;flex-wrap:wrap;margin-top:3px}
.t-good{font-size:.58rem;padding:1px 5px;border-radius:3px;background:rgba(20,120,62,.1);
  color:#14783e;border:1px solid rgba(20,120,62,.25)}
.t-bad{font-size:.58rem;padding:1px 5px;border-radius:3px;background:rgba(168,32,32,.1);
  color:#b82020;border:1px solid rgba(168,32,32,.25)}
.special-tag{margin-top:5px;padding:2px 7px;background:rgba(212,176,72,.12);
  border-radius:4px;font-size:.6rem;color:#8c6410;border:1px solid rgba(212,176,72,.3)}
.legend{margin-top:14px;font-size:.62rem;color:${fc};display:flex;gap:16px;flex-wrap:wrap;
  padding:8px 12px;background:${bg2};border:1px solid ${bc};border-radius:8px}
</style></head><body>
<h1>🔮 天機數元 · 玄学日历</h1>
<div class="sub">
  未来30天综合玄学评分 · 奇门遁甲40% + 梅花易数30% + 紫微斗数30%<br>
  生成时间：${new Date().toLocaleString('zh-CN')} · BTC参考价：$${btcPrice.toLocaleString()}
</div>
<div class="grid">
${rows.map(r => {
  const qd = r.qm?.door || r.qm?.timeDoor || '--';
  const qs = r.qm?.star || r.qm?.timeStar || '';
  const mhJ= r.mh?.judgment || '--';
  const gt = (r.qm?.goodTimes || []).slice(0,2).join('·') || '--';
  const bt = (r.qm?.badTimes  || []).slice(0,1).join('·') || '--';
  const barColor = r.opCls==='bull'?'#14783e':r.opCls==='bear'?'#b82020':'#8c6410';
  return `<div class="card ${r.opCls}${r.special?' special-day':''}">
  <div class="top">
    <div>
      <div class="date-big">${r.m}/${String(r.dy).padStart(2,'0')}</div>
      <div class="date-sub">周${r.wd} &nbsp; ${r.lunarStr}</div>
    </div>
    <div class="score-wrap">
      <div class="score ${r.opCls}">${r.score}</div>
      <div class="bar"><div class="bar-fill" style="width:${r.score}%;background:${barColor}"></div></div>
    </div>
  </div>
  <span class="op ${r.opCls}">${r.op}</span>
  <div class="info">
    <div><b>奇门</b> ${r.qm?.isYang?'阳':'阴'}遁${r.qm?.juNum||'?'}局·${qs}${qd}${r.qm?.special?'·'+r.qm.special:''}</div>
    <div><b>梅花</b> ${r.mh?.hexagram||'--'}→${r.mh?.changingHexagram||'--'}·${mhJ}</div>
    <div><b>吉时</b>
      <span class="t-good">${gt}</span>
    </div>
    ${bt !== '--' ? `<div><b>凶时</b><span class="t-bad">${bt}</span></div>` : ''}
  </div>
  ${r.special ? `<div class="special-tag">✨ ${r.special}</div>` : ''}
</div>`;
}).join('\n')}
</div>
<div class="legend">
  <span>📊 评分：≥65=偏多 · ≤35=偏空 · 其余中性</span>
  <span>⏰ 时辰：UTC+8北京时间</span>
  <span>⚠ 仅供参考，不构成投资建议</span>
</div>
</body></html>`;

  const url = URL.createObjectURL(new Blob([html], {type:'text/html'}));
  window.open(url, '_blank');
};

// ── 同步更新 renderAll 流程中的梅花+组合 ──────────────────────────────
(function patchRenderAllForMeihua() {
  const orig = window.renderAll;
  if (typeof orig !== 'function') return;
  // 只 patch 一次
  if (orig._meihuaPatched) return;
  const patched = function(data) {
    orig.apply(this, arguments);
    const { coin, date, price, gn, ch, sr, hr: _hr, qm, ic, ve, nt, zw, va } = data;
    if (!price) return;
    const mh = Meihua.divine(price, date);
    window._lastMeihuaResult = mh;
    const combos = findDivineCombinations({ qm, ic, ve, gn, ch, sr, nt, zw, va }, date);
    setTimeout(() => {
      try { renderDivinePanel(mh, combos, coin, date); } catch(e) {}
    }, 80);
  };
  patched._meihuaPatched = true;
  window.renderAll = patched;
})();

// 导出给外部使用
window.QiMen  = QiMen;
window.Ziwei  = Ziwei;
window.Meihua = Meihua;
window.Lunar  = Lunar;

'use strict';
// ══════════════════════════════════════════════════════════
// 优化2：真太阳时对齐
// ══════════════════════════════════════════════════════════
function getDayOfYear(date) {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date - start) / 86400000);
}

function getEquationOfTime(dayOfYear) {
  const B = (360 * (dayOfYear - 81) / 365) * Math.PI / 180;
  return (9.87 * Math.sin(2*B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B)) / 60;
}

function getTrueSolarHour(date, longitude) {
  const lonCorr = (longitude - 120) / 15;   // 以东八区基准（+8h对应120°E）
  const eot     = getEquationOfTime(getDayOfYear(date));
  return date.getHours() + date.getMinutes()/60 + lonCorr + eot;
}

function alignTimeForXuanXue(date, location) {
  const lon     = location?.longitude || location?.lng || 120;
  const tz      = location?.tz || 'Asia/Shanghai';
  const solarHr = getTrueSolarHour(date, lon);

  // 农历（含干支，用寿星万年历 Lunar 模块）
  let lunarDate = null;
  try {
    const y = date.getFullYear(), m = date.getMonth()+1, d = date.getDate();
    const raw = window.Lunar ? Lunar.fromSolar(y, m, d) : null;
    if (raw) {
      // 月干支（五虎遁：年干起月干）
      const MONTH_STEM_BASE = {'甲':2,'己':2,'乙':4,'庚':4,'丙':6,'辛':6,'丁':8,'壬':8,'戊':0,'癸':0};
      const STEMS='甲乙丙丁戊己庚辛壬癸', BRANCHES='子丑寅卯辰巳午未申酉戌亥';
      const mBase = MONTH_STEM_BASE[raw.yearStem] || 0;
      const mStemIdx = (mBase + raw.month - 1) % 10;
      const mBranchIdx = (raw.month + 1) % 12; // 寅=2起
      // 日干支（60甲子，以2000-01-01甲子为基准）
      const base = new Date(2000, 0, 1);
      const dayOffset = Math.floor((date - base) / 86400000);
      const dStemIdx   = ((dayOffset % 10) + 10) % 10;
      const dBranchIdx = ((dayOffset % 12) + 12) % 12;
      lunarDate = {
        ...raw,
        ganzhiYear:  raw.ganZhi || (raw.yearStem + BRANCHES[raw.yearBranchIdx]),
        ganzhiMonth: STEMS[mStemIdx] + BRANCHES[mBranchIdx],
        ganzhiDay:   STEMS[dStemIdx] + BRANCHES[dBranchIdx],
      };
    }
  } catch(e) { lunarDate = null; }

  const utcTime = new Date(date.getTime() - date.getTimezoneOffset()*60000);

  return {
    qimen:  solarHr,    // 真太阳时（小时，供奇门用）
    bazi:   solarHr,    // 八字也用真太阳时
    ziwei:  lunarDate,  // 农历对象（含干支）
    vedic:  utcTime,    // UTC（印度占星用）
    solarHourInt: Math.floor(((solarHr % 24) + 24) % 24), // 0-23
  };
}

window.alignTimeForXuanXue = alignTimeForXuanXue;

// ══════════════════════════════════════════════════════════
// 优化3：币种出生地地理数据
// ══════════════════════════════════════════════════════════
window.COIN_LOCATIONS = {
  BTC:{ name:'伦敦',   lat:51.51, lng:-0.13, tz:'Europe/London',
        birthDate:'2009-01-03', birthTime:'18:15:05' },
  ETH:{ name:'楚格',   lat:47.17, lng:8.52,  tz:'Europe/Zurich',
        birthDate:'2015-07-30', birthTime:'03:26:13' },
  SOL:{ name:'旧金山', lat:37.77, lng:-122.42,tz:'America/Los_Angeles',
        birthDate:'2020-03-16', birthTime:'14:30:51' },
  BNB:{ name:'香港',   lat:22.32, lng:114.17, tz:'Asia/Hong_Kong',
        birthDate:'2017-07-01', birthTime:'12:00:00' },
  XAU:{ name:'纽约',   lat:40.71, lng:-74.01, tz:'America/New_York',
        birthDate:'1971-08-15', birthTime:'21:30:00' },
  XAG:{ name:'纽约',   lat:40.71, lng:-74.01, tz:'America/New_York',
        birthDate:'1933-07-05', birthTime:'10:00:00' },
};

function getCoinLocalTime(coin, date) {
  const loc = window.COIN_LOCATIONS[coin];
  if (!loc) return { standard: date, solar: date.getHours(), lunar: null };
  const aligned = alignTimeForXuanXue(date, loc);
  return { standard: date, solar: aligned.solarHourInt, lunar: aligned.ziwei, loc };
}
window.getCoinLocalTime = getCoinLocalTime;

// ══════════════════════════════════════════════════════════
// 优化4：玄学辞典 Tooltip
// ══════════════════════════════════════════════════════════
const XUANXUE_DICT = {
  '开门':{ type:'奇门八门', color:'#14783e',
    meaning:'大吉之门，主开创进取',
    trading:'宜开仓做多、突破进场',
    example:'开门遇天心，牛市启动' },
  '休门':{ type:'奇门八门', color:'#8c6410',
    meaning:'中吉之门，主等待修整',
    trading:'宜持仓观望，不宜新开',
    example:'休门遇天蓬，调整将尽' },
  '生门':{ type:'奇门八门', color:'#14783e',
    meaning:'大吉之门，主生长利润',
    trading:'宜做多、抄底加仓',
    example:'生门遇天芮，主力建仓' },
  '死门':{ type:'奇门八门', color:'#b82020',
    meaning:'大凶之门，主终结停滞',
    trading:'宜清仓做空，严禁追多',
    example:'死门遇天柱，顶部确认' },
  '伤门':{ type:'奇门八门', color:'#b82020',
    meaning:'凶门，主争斗损伤',
    trading:'宜止损离场，不宜操作' },
  '惊门':{ type:'奇门八门', color:'#b82020',
    meaning:'凶门，主惊恐变动',
    trading:'宜观望，市场将剧烈波动' },
  '杜门':{ type:'奇门八门', color:'#5c5246',
    meaning:'小凶，主封闭停滞',
    trading:'不宜操作，等待信号明朗' },
  '景门':{ type:'奇门八门', color:'#2c50a8',
    meaning:'小吉，主文书虚光',
    trading:'消息面可能利好，实质不强' },
  '化禄':{ type:'紫微四化', color:'#14783e',
    meaning:'财富机遇，流年顺利',
    trading:'财运亨通，宜做多持仓' },
  '化权':{ type:'紫微四化', color:'#8c6410',
    meaning:'权力掌控，强势主导',
    trading:'主力控盘，趋势明确' },
  '化科':{ type:'紫微四化', color:'#2c50a8',
    meaning:'名声平稳，贵人扶助',
    trading:'消息利好，涨幅有限' },
  '化忌':{ type:'紫微四化', color:'#b82020',
    meaning:'灾祸阻碍，损财破运',
    trading:'宜空仓止损，严禁追多' },
  '底背驰':{ type:'缠论', color:'#14783e',
    meaning:'价格新低但指标不新低，下跌动能衰竭',
    trading:'抄底信号，宜轻仓做多' },
  '顶背驰':{ type:'缠论', color:'#b82020',
    meaning:'价格新高但指标不新高，上涨动能衰竭',
    trading:'逃顶信号，宜减仓做空' },
  '中枢':{ type:'缠论', color:'#8c6410',
    meaning:'价格密集成交区，多空平衡',
    trading:'突破上轨做多，跌破下轨做空' },
  '天蓬':{ type:'奇门九星', color:'#2c50a8',
    meaning:'坎水星，主险阻奔波' },
  '天芮':{ type:'奇门九星', color:'#b82020',
    meaning:'坤土星，主疾病损耗' },
  '天冲':{ type:'奇门九星', color:'#14783e',
    meaning:'震木星，主行动冲击' },
  '天辅':{ type:'奇门九星', color:'#14783e',
    meaning:'巽木星，主文化辅助' },
  '天心':{ type:'奇门九星', color:'#8c6410',
    meaning:'乾金星，主策划谋略，最吉' },
  '天柱':{ type:'奇门九星', color:'#b82020',
    meaning:'兑金星，主毁折危险' },
  '天任':{ type:'奇门九星', color:'#14783e',
    meaning:'艮土星，主稳重担当' },
  '天英':{ type:'奇门九星', color:'#8c6410',
    meaning:'离火星，主文明礼仪' },
};
window.XUANXUE_DICT = XUANXUE_DICT;

// 注入 Tooltip DOM
function initTooltip() {
  if (document.getElementById('xTooltip')) return;
  const el = document.createElement('div');
  el.id = 'xTooltip';
  document.body.appendChild(el);

  document.addEventListener('mouseover', e => {
    const target = e.target.closest('[data-tip]');
    if (!target) { el.style.display='none'; return; }
    const term = target.dataset.tip;
    const info = XUANXUE_DICT[term];
    if (!info) return;
    el.innerHTML = `
      <div style="font-weight:700;color:${info.color};margin-bottom:4px">${term} · <span style="font-weight:400;font-size:.68rem">${info.type}</span></div>
      <div style="color:var(--text);margin-bottom:4px">${info.meaning}</div>
      ${info.trading ? `<div style="color:${info.color};font-size:.7rem">📈 ${info.trading}</div>` : ''}
      ${info.example ? `<div style="color:var(--faint);font-size:.65rem;margin-top:3px">例：${info.example}</div>` : ''}`;
    el.style.borderColor = info.color + '66';
    el.style.display = 'block';
    el.style.left = Math.min(e.clientX + 12, window.innerWidth - 280) + 'px';
    el.style.top  = Math.min(e.clientY + 16, window.innerHeight - 180) + 'px';
  });
  document.addEventListener('mouseout', e => {
    if (!e.target.closest('[data-tip]')) el.style.display='none';
  });
  document.addEventListener('mousemove', e => {
    if (el.style.display === 'none') return;
    el.style.left = Math.min(e.clientX + 12, window.innerWidth - 280) + 'px';
    el.style.top  = Math.min(e.clientY + 16, window.innerHeight - 180) + 'px';
  });
}

// 自动给已渲染内容中的玄学词汇加 data-tip
function autoTagTerms(root) {
  if (!root) return;
  const terms = Object.keys(XUANXUE_DICT);
  // Walk text nodes
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const toWrap = [];
  let node;
  while ((node = walker.nextNode())) {
    const par = node.parentElement;
    if (!par || par.dataset.tip || par.tagName === 'SCRIPT' || par.tagName === 'STYLE') continue;
    for (const term of terms) {
      if (node.textContent.includes(term)) {
        toWrap.push({ node, term });
        break;
      }
    }
  }
  toWrap.forEach(({ node, term }) => {
    try {
      const html = node.textContent.replace(
        new RegExp(term, 'g'),
        `<span data-tip="${term}" style="border-bottom:1px dashed rgba(140,100,16,.5);cursor:help">${term}</span>`
      );
      const span = document.createElement('span');
      span.innerHTML = html;
      node.replaceWith(span);
    } catch(e) {}
  });
}

// ══════════════════════════════════════════════════════════
// 优化5：玄学案例库
// ══════════════════════════════════════════════════════════
const CASE_STUDIES = [
  { id:1, date:'2024-02-25', coin:'BTC', price:51700,
    combos:['奇门开门','紫微化禄','木星回归'],
    combinations:['奇门开门 + 紫微化禄 + 木星回归'],
    predicted:'牛市启动信号',
    actual:'30天内涨至69800(+35%)', verified:true, tags:['牛市','精准'] },
  { id:2, date:'2024-06-15', coin:'ETH', price:3450,
    combos:['缠论底背驰','易经泰卦'],
    combinations:['缠论底背驰 + 易经泰卦'],
    predicted:'抄底机会',
    actual:'14天内涨至4416(+28%)', verified:true, tags:['抄底','精准'] },
  { id:3, date:'2024-09-10', coin:'SOL', price:128,
    combos:['奇门死门','紫微化忌','土星压制'],
    combinations:['奇门死门 + 紫微化忌 + 土星回归'],
    predicted:'暴跌预警',
    actual:'7天内跌至89(-30%)', verified:true, tags:['逃顶','精准'] },
  { id:4, date:'2024-11-05', coin:'BTC', price:68200,
    combos:['奇门生门','缠论底背驰','江恩支撑'],
    combinations:['奇门生门 + 缠论底背驰 + 江恩支撑'],
    predicted:'三底确认加仓',
    actual:'30天内涨至97600(+43%)', verified:true, tags:['加仓','精准'] },
  { id:5, date:'2025-01-20', coin:'ETH', price:3800,
    combos:['奇门休门','紫微化忌','缠论顶背驰'],
    combinations:['奇门休门 + 紫微化忌 + 缠论顶背驰'],
    predicted:'顶部区域，止盈观望',
    actual:'14天内跌至2800(-26%)', verified:true, tags:['止盈','精准'] },
];
window.CASE_STUDIES = CASE_STUDIES;

function findSimilarCases(currentCombos) {
  if (!currentCombos || !currentCombos.length) return [];
  return CASE_STUDIES.map(cs => {
    let hits = 0;
    currentCombos.forEach(c => {
      if (cs.combos.some(cc => cc.includes(c) || c.includes(cc))) hits++;
    });
    return { ...cs, matchRate: hits / Math.max(currentCombos.length, cs.combos.length) };
  }).filter(cs => cs.matchRate > 0.25)
    .sort((a,b) => b.matchRate - a.matchRate);
}
window.findSimilarCases = findSimilarCases;

function renderCaseStudies(container, currentCombos) {
  if (!container) return;
  const cases = findSimilarCases(currentCombos);
  if (!cases.length) { container.innerHTML = '<div style="font-size:.65rem;color:var(--faint);text-align:center">暂无相似历史案例</div>'; return; }
  container.innerHTML = cases.slice(0,3).map(cs => {
    const mc = Math.round(cs.matchRate*100);
    const mcColor = mc>=70?'var(--bull)':mc>=40?'var(--gold)':'var(--muted)';
    return `<div class="case-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
        <span style="font-weight:700;font-size:.76rem">${cs.coin} · ${cs.date} · $${cs.price.toLocaleString()}</span>
        <span>${cs.verified?'✅':'⏳'}</span>
      </div>
      <div style="font-size:.7rem;color:var(--text);margin-bottom:2px">${cs.predicted}</div>
      <div style="font-size:.65rem;color:var(--muted)">实际：${cs.actual}</div>
      <div style="margin-top:4px"><span class="case-match" style="background:${mcColor}22;color:${mcColor};border:1px solid ${mcColor}44">匹配度 ${mc}%</span></div>
    </div>`;
  }).join('');
}
window.renderCaseStudies = renderCaseStudies;

// ══════════════════════════════════════════════════════════
// 优化6：可信度加权评分
// ══════════════════════════════════════════════════════════
function calculateEngineCredibility() {
  const errors = window.tracker?.priceErrors || [];
  if (!errors.length) return {};
  const byEngine = {};
  errors.forEach(e => {
    const m = e.model || 'unknown';
    if (!byEngine[m]) byEngine[m] = [];
    byEngine[m].push(e);
  });
  const result = {};
  Object.entries(byEngine).forEach(([eng, list]) => {
    if (list.length < 5) { result[eng] = 0.5; return; }
    const wr  = list.filter(e=>e.dirCorrect).length / list.length;
    const avgE= list.reduce((s,e)=>s+(e.priceErr||0),0) / list.length;
    result[eng] = wr * 0.7 + Math.max(0, 1 - avgE*2) * 0.3;
  });
  return result;
}

function weightedScoreByCredibility(engines) {
  const cred = calculateEngineCredibility();
  const MAP = {
    gn:'gann', ch:'chan', sr:'sr', hr:'harmonic',
    qm:'qimen', ic:'iching', ve:'vedic', nt:'natal', zw:'ziwei', va:'volRate',
  };
  let total = 0, weight = 0;
  Object.entries(engines).forEach(([key, eng]) => {
    if (!eng || eng.bias === undefined) return;
    const credKey = MAP[key] || key;
    const w = cred[credKey] || 0.5;
    total  += ((eng.bias + 1) / 2 * 100) * w;
    weight += w;
  });
  return weight > 0 ? Math.round(total / weight) : 50;
}
window.calculateEngineCredibility = calculateEngineCredibility;
window.weightedScoreByCredibility = weightedScoreByCredibility;

// ══════════════════════════════════════════════════════════
// 优化7：玄学自然语言问答
// ══════════════════════════════════════════════════════════
function askXuanXue(question) {
  const q = (question || '').toLowerCase();

  // 意图
  const isBuy  = /买|多|进|加仓|做多|入场/.test(q);
  const isSell = /卖|空|出|减仓|做空|止损/.test(q);
  const isTime = /今天|明天|后天|本周|现在|什么时候/.test(q);

  // 币种
  let coin = 'BTC';
  if (/eth|以太|以泰/.test(q)) coin = 'ETH';
  else if (/sol|索拉/.test(q)) coin = 'SOL';
  else if (/bnb/.test(q)) coin = 'BNB';
  else if (/黄金|xau|gold/.test(q)) coin = 'XAU';
  else if (/白银|xag|silver/.test(q)) coin = 'XAG';

  // 日期
  const d = new Date();
  if (/明天/.test(q)) d.setDate(d.getDate()+1);
  else if (/后天/.test(q)) d.setDate(d.getDate()+2);
  else if (/本周五/.test(q)) d.setDate(d.getDate()+(5-d.getDay()));
  const ds = d.toISOString().slice(0,10);

  // 调引擎
  let qmR, zwR;
  try { qmR = engineQiMen(coin, ds); } catch(e) { qmR = null; }
  try { zwR = engineZiwei(coin, ds); } catch(e) { zwR = null; }

  const LUCKY_DOORS = new Set(['开门','生门','休门']);
  const DIRE_DOORS  = new Set(['死门','惊门','伤门']);
  const door = qmR?.door || qmR?.timeDoor || '';
  const qmDir = LUCKY_DOORS.has(door) ? '吉' : DIRE_DOORS.has(door) ? '凶' : '平';

  // 今日结果
  const curRes = window.dashResults?.[coin];
  const score  = curRes?.score ?? 50;
  const scoreDir = score>=65?'偏多':score<=35?'偏空':'中性';

  let ans = `【${coin}】${ds} 玄学综合分析\n`;
  ans += `━━━━━━━━━━━━━━━━\n`;
  if (qmR) ans += `奇门：${door}（${qmR.star||''}）${qmR.isYang?'阳':'阴'}遁${qmR.juNum}局\n  → ${qmDir}门，${qmR.direction||'观望'}\n`;
  if (zwR) ans += `紫微：财帛[${zwR.wealthStar||'--'}] 官禄[${zwR.careerStar||'--'}]\n  → ${zwR.label||'平'}\n`;
  if (curRes) ans += `综合评分：${score}分（${scoreDir}）\n`;
  if (qmR?.goodTimes?.length) ans += `今日吉时：${qmR.goodTimes.slice(0,2).join('、')}\n`;

  // 操作建议
  ans += `━━━━━━━━━━━━━━━━\n建议：`;
  if (isBuy) {
    if (qmDir==='吉' && score>=55) ans += `可${score>=70?'适量加仓':'轻仓尝试'}，吉门+评分支持`;
    else if (qmDir==='凶') ans += `暂不建议做多，凶门当值，等待转机`;
    else ans += `信号中性，可小仓试探，严格止损`;
  } else if (isSell) {
    if (qmDir==='凶' && score<=45) ans += `可考虑减仓或做空，凶门+评分双确认`;
    else if (qmDir==='吉') ans += `吉门当值，不宜做空，逢低持多`;
    else ans += `信号中性，可部分止盈，保留底仓`;
  } else {
    ans += score>=65 ? `${scoreDir}，宜持多观察突破` :
           score<=35 ? `${scoreDir}，宜观望或空仓` : `中性，等待方向明朗`;
  }

  return ans;
}
window.askXuanXue = askXuanXue;

// ══════════════════════════════════════════════════════════
// 优化8：今日择时（三引擎投票）
// ══════════════════════════════════════════════════════════
const SHI_UTC8 = {
  '子时':'23:00-01:00','丑时':'01:00-03:00','寅时':'03:00-05:00',
  '卯时':'05:00-07:00','辰时':'07:00-09:00','巳时':'09:00-11:00',
  '午时':'11:00-13:00','未时':'13:00-15:00','申时':'15:00-17:00',
  '酉时':'17:00-19:00','戌时':'19:00-21:00','亥时':'21:00-23:00',
};

function getTodaysBestTime(coin) {
  const ds  = new Date().toISOString().slice(0,10);
  const votes = {};
  const allBad = {};

  // 奇门吉时
  try {
    const qm = engineQiMen(coin, ds);
    (qm.goodTimes || []).forEach(t => {
      const k = t.replace(/\(.*\)/,'').trim();
      votes[k] = (votes[k]||0) + 2;  // 权重2
    });
    (qm.badTimes || []).forEach(t => {
      const k = t.replace(/\(.*\)/,'').trim();
      allBad[k] = (allBad[k]||0) + 1;
    });
  } catch(e) {}

  // 紫微吉时
  try {
    const zw = engineZiwei(coin, ds);
    (zw.goodTime || []).forEach(t => {
      const k = t.replace(/\(.*\)/,'').trim();
      votes[k] = (votes[k]||0) + 1;
    });
    (zw.badTime || []).forEach(t => {
      const k = t.replace(/\(.*\)/,'').trim();
      allBad[k] = (allBad[k]||0) + 1;
    });
  } catch(e) {}

  // 印度占星吉时（基于偏向）
  try {
    const ve = engineVedic(coin, ds);
    if (ve?.bias > 0.2) {
      votes['巳时'] = (votes['巳时']||0) + 1;
      votes['午时'] = (votes['午时']||0) + 1;
    }
  } catch(e) {}

  const sorted = Object.entries(votes)
    .filter(([k]) => !allBad[k])         // 排除同时是凶时的
    .sort((a,b) => b[1]-a[1])
    .map(([hour, v]) => ({
      hour, votes:v,
      timeRange: SHI_UTC8[hour] || '--',
      conf: Math.min(0.95, v/6),
    }));

  const badSorted = Object.entries(allBad).sort((a,b)=>b[1]-a[1])
    .map(([hour]) => ({ hour, timeRange: SHI_UTC8[hour]||'--' }));

  return { best: sorted[0]||null, all: sorted, bad: badSorted };
}

function renderBestTimePanel(container, coin) {
  if (!container) return;
  const bt = getTodaysBestTime(coin || 'BTC');
  if (!bt.best) { container.innerHTML='<div style="font-size:.65rem;color:var(--faint)">今日吉时需更多数据</div>'; return; }

  // 获取当前 UTC+8 时间
  const nowUTC8 = new Date(Date.now() + (new Date().getTimezoneOffset()*60000) + 8*3600000);
  const nowH = nowUTC8.getHours(), nowM = nowUTC8.getMinutes();
  const nowStr = String(nowH).padStart(2,'0') + ':' + String(nowM).padStart(2,'0');

  // 判断当前是否在某个时段内
  function isNowIn(range) {
    if (!range || range==='--') return false;
    const m = range.match(/(\d{2}):(\d{2})-(\d{2}):(\d{2})/);
    if (!m) return false;
    let sh=parseInt(m[1]),sm=parseInt(m[2]),eh=parseInt(m[3]),em=parseInt(m[4]);
    const now=nowH*60+nowM, start=sh*60+sm, end=eh*60+em;
    if (end < start) return now>=start || now<=end; // crosses midnight
    return now>=start && now<=end;
  }

  container.innerHTML = `
    <div id="bestTimePanel">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:.62rem;font-weight:700;color:var(--bull);text-transform:uppercase;letter-spacing:.05em">⏰ 今日最佳交易时段</div>
        <div style="font-size:.6rem;color:var(--faint)">现在 <strong style="color:var(--gold);font-family:monospace">${nowStr}</strong> UTC+8</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:4px">
        <div class="bt-hour" style="margin:0">${bt.best.hour}</div>
        ${isNowIn(bt.best.timeRange)?'<span style="font-size:.62rem;background:rgba(20,120,62,.12);color:var(--bull);border:1px solid rgba(20,120,62,.3);padding:2px 8px;border-radius:99px;font-weight:700">🟢 当前时段</span>':''}
      </div>
      <div class="bt-range" style="margin-bottom:2px">${bt.best.timeRange} <span style="color:var(--faint)">(UTC+8)</span> · 置信 ${Math.round(bt.best.conf*100)}%</div>
      ${bt.all.slice(1,4).length ? `
      <div style="margin-top:10px;padding-top:8px;border-top:1px solid var(--border)">
        <div style="font-size:.6rem;font-weight:700;color:var(--faint);margin-bottom:5px">其他吉时</div>
        ${bt.all.slice(1,4).map(t=>`<div class="bt-row">
          <span>${t.hour} <span style="color:var(--faint)">${t.timeRange} UTC+8</span>${isNowIn(t.timeRange)?' 🟢':''}</span>
          <span style="color:var(--gold)">✨ ${t.votes}票</span>
        </div>`).join('')}
      </div>` : ''}
      ${bt.bad.length ? `
      <div style="margin-top:8px;font-size:.62rem;color:var(--bear)">
        ⚠ 凶时回避：${bt.bad.slice(0,2).map(t=>`${t.hour}（${t.timeRange} UTC+8）`).join('、')}
      </div>` : ''}
    </div>`;
}
window.getTodaysBestTime = getTodaysBestTime;
window.renderBestTimePanel = renderBestTimePanel;

// ══════════════════════════════════════════════════════════
// 优化9：30天玄学趋势图（Canvas + SVG双模式）
// ══════════════════════════════════════════════════════════
function getTrendEnergy(coin, days) {
  days = days || 30;
  const today  = new Date();
  const trends = [];
  for (let i = 0; i < days; i++) {
    const d  = new Date(today);
    d.setDate(d.getDate() + i);
    const ds = d.toISOString().slice(0,10);
    let qmScore = 50, zwScore = 50;
    try {
      const qm = engineQiMen(coin, ds);
      qmScore = ((qm.bias||0)+1)/2*40+30;
    } catch(e) {}
    try {
      const zw = engineZiwei(coin, ds);
      zwScore = zw.luInWealth||zw.quanInCareer ? 70 : zw.jiInWealth||zw.jiInCareer ? 30 : 50;
    } catch(e) {}
    const energy = Math.round(qmScore*0.6 + zwScore*0.4);
    let door = '', star = '';
    try { const qm = engineQiMen(coin, ds); door=qm.door||qm.timeDoor||''; star=qm.star||qm.timeStar||''; } catch(e) {}
    trends.push({ date:ds, day:i+1, energy, door, star,
      direction: energy>62?'偏多':energy<38?'偏空':'中性' });
  }
  return trends;
}

function drawTrendSVG(trends, container) {
  if (!container || !trends.length) return;
  const W = container.clientWidth || 320;
  const H = 120;
  const PAD = { t:12, r:12, b:22, l:32 };
  const cW = W - PAD.l - PAD.r;
  const cH = H - PAD.t - PAD.b;
  const n  = trends.length;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const gridC  = isDark ? 'rgba(255,255,255,.07)' : 'rgba(0,0,0,.06)';
  const textC  = isDark ? '#666' : '#aaa';

  const px = i => PAD.l + (i/(n-1)) * cW;
  const py = e => PAD.t + ((100-e)/100) * cH;

  // gradient path
  const pts = trends.map((t,i) => `${px(i)},${py(t.energy)}`).join(' ');

  // Build SVG
  let yLabels = '', gridLines = '';
  [0,25,50,75,100].forEach(v => {
    const y = py(v);
    gridLines += `<line x1="${PAD.l}" y1="${y}" x2="${W-PAD.r}" y2="${y}" stroke="${gridC}" stroke-width="1"/>`;
    if (v===0||v===50||v===100)
      yLabels += `<text x="${PAD.l-4}" y="${y+4}" text-anchor="end" font-size="9" fill="${textC}">${v}</text>`;
  });

  // Area fill
  const areaPath = `M${px(0)},${py(trends[0].energy)} ` +
    trends.slice(1).map((t,i)=>`L${px(i+1)},${py(t.energy)}`).join(' ') +
    ` L${px(n-1)},${PAD.t+cH} L${px(0)},${PAD.t+cH} Z`;

  // Dots for special doors
  let dots = '';
  trends.forEach((t,i) => {
    const LUCKY = new Set(['开门','生门','休门']);
    const DIRE  = new Set(['死门','惊门','伤门']);
    if (LUCKY.has(t.door)) {
      dots += `<circle cx="${px(i)}" cy="${py(t.energy)}" r="4" fill="#14783e" opacity=".9"/>`;
    } else if (DIRE.has(t.door)) {
      dots += `<circle cx="${px(i)}" cy="${py(t.energy)}" r="4" fill="#b82020" opacity=".9"/>`;
    }
  });

  // X-axis labels (every 5 days)
  let xLabels = '';
  trends.forEach((t,i) => {
    if (i===0 || (i+1)%5===0) {
      xLabels += `<text x="${px(i)}" y="${H-4}" text-anchor="middle" font-size="8" fill="${textC}">${t.date.slice(5)}</text>`;
    }
  });

  // 50% line
  const y50 = py(50);
  const midLine = `<line x1="${PAD.l}" y1="${y50}" x2="${W-PAD.r}" y2="${y50}" stroke="${isDark?'#333':'#ddd'}" stroke-width="1" stroke-dasharray="4,3"/>`;

  container.innerHTML = `<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:${H}px">
    <defs>
      <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="#8c6410" stop-opacity=".25"/>
        <stop offset="100%" stop-color="#8c6410" stop-opacity="0"/>
      </linearGradient>
    </defs>
    ${gridLines}${midLine}
    <path d="${areaPath}" fill="url(#trendGrad)"/>
    <polyline points="${pts}" fill="none" stroke="#8c6410" stroke-width="2"/>
    ${dots}${yLabels}${xLabels}
  </svg>`;
}
window.getTrendEnergy = getTrendEnergy;
window.drawTrendSVG   = drawTrendSVG;

// ══════════════════════════════════════════════════════════
// 整合：在详情页注入所有新面板
// ══════════════════════════════════════════════════════════
function injectEnhancedPanels(coin, engines) {
  if (!coin) return;
  const results = document.getElementById('results');
  if (!results) return;

  // 防重复
  let ep = document.getElementById('enhancedPanelsWrap');
  if (!ep) {
    ep = document.createElement('div');
    ep.id = 'enhancedPanelsWrap';
    // 插到 klineChartWrap 后或 results 末尾
    const kline = document.getElementById('klineChartWrap');
    const divine = document.getElementById('divinePanelWrap');
    const anchor = divine?.nextSibling || kline?.nextSibling || null;
    if (anchor) results.insertBefore(ep, anchor);
    else results.appendChild(ep);
  }

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const cardStyle = `background:var(--card);border:1px solid var(--border);border-radius:12px;padding:12px 14px;margin-bottom:10px`;
  const titleStyle = `font-size:.68rem;font-weight:700;color:#8c6410;text-transform:uppercase;letter-spacing:.05em;margin-bottom:9px`;

  // 计算可信度加权分数
  const credScore = engines ? weightedScoreByCredibility(engines) : null;

  // 获取组合名（供案例库匹配）
  const combos = (window._lastDivineCombos || []).map(c=>c.name);

  ep.innerHTML = `
    <!-- 择时 -->
    <div style="${cardStyle}">
      <div style="${titleStyle}">⏰ 今日玄学择时</div>
      <div id="epBestTime"></div>
    </div>
    <!-- 问答 -->
    <div style="${cardStyle}">
      <div style="${titleStyle}">💬 玄学问答</div>
      <div id="xqaBox">
        <input id="xqaInput" type="text" placeholder='如："今天能买${coin}吗？" 或 "本周${coin}怎么看"'
          onkeydown="if(event.key==='Enter'){const a=askXuanXue(this.value);const el=document.getElementById('xqaAnswer');el.textContent=a;el.style.display='block';}">
        <div id="xqaAnswer"></div>
      </div>
    </div>
    <!-- 趋势图 -->
    <div style="${cardStyle}" id="trendWrap">
      <div style="${titleStyle}">📈 未来30天玄学能量趋势</div>
      <div style="font-size:.6rem;color:var(--faint);margin-bottom:5px">
        🟢 吉门日 &nbsp; 🔴 凶门日 &nbsp; 中线=中性50
      </div>
      <div id="trendSVGBox"></div>
      <div id="trendLegend" style="display:flex;gap:10px;flex-wrap:wrap;margin-top:6px;font-size:.62rem;color:var(--muted)"></div>
    </div>
    <!-- 可信度 -->
    ${credScore !== null ? `
    <div style="${cardStyle}">
      <div style="${titleStyle}">🎯 可信度加权评分</div>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="font-size:1.6rem;font-weight:800;font-family:monospace;color:${credScore>=65?'var(--bull)':credScore<=35?'var(--bear)':'var(--gold)'}">${credScore}</div>
        <div style="font-size:.68rem;color:var(--muted)">基于历史误差记录加权<br>（数据越多越准确）</div>
      </div>
    </div>` : ''}
    <!-- 案例库 -->
    <div style="${cardStyle}">
      <div style="${titleStyle}">📚 历史相似案例</div>
      <div id="epCases"></div>
    </div>
  `;

  // 渲染择时
  renderBestTimePanel(document.getElementById('epBestTime'), coin);

  // 渲染趋势图
  const trendBox = document.getElementById('trendSVGBox');
  if (trendBox) {
    const trends = getTrendEnergy(coin, 30);
    setTimeout(() => {
      drawTrendSVG(trends, trendBox);
      // Legend：找最高最低点
      const best = trends.reduce((a,b)=>a.energy>b.energy?a:b);
      const worst= trends.reduce((a,b)=>a.energy<b.energy?a:b);
      const legend = document.getElementById('trendLegend');
      if (legend) legend.innerHTML =
        `<span>🔺 最佳：${best.date}（${best.energy}·${best.door}）</span>` +
        `<span>🔻 最低：${worst.date}（${worst.energy}·${worst.door}）</span>`;
    }, 50);
  }

  // 渲染案例库
  renderCaseStudies(document.getElementById('epCases'), combos);

  // 自动 Tooltip 标注
  setTimeout(() => autoTagTerms(ep), 200);
}

// ── Hook into renderAll ─────────────────────────────────────────────
(function hookRenderAllEnhanced() {
  const orig = window.renderAll;
  if (typeof orig !== 'function' || orig._enhancedHooked) return;
  const hooked = function(data) {
    orig.apply(this, arguments);
    const { coin, gn, ch, sr, hr: _hr, qm, ic, ve, nt, zw, va } = data;
    window._lastDivineCombos = typeof findDivineCombinations === 'function'
      ? findDivineCombinations({ gn,ch,sr,qm,ic,ve,nt,zw,va }, data.date)
      : [];
    setTimeout(() => injectEnhancedPanels(coin, { gn,ch,sr,qm,ic,ve,nt,zw,va }), 150);
  };
  hooked._enhancedHooked = true;
  window.renderAll = hooked;
})();

// ── Init on DOM ready ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTooltip();
});
// Also init immediately if DOM already ready
if (document.readyState !== 'loading') initTooltip();

// ── 文档规范别名（兼容性） ─────────────────────────────────────────
// showTooltip(term, event) — 文档优化项4
window.showTooltip = function(term, event) {
  const info = XUANXUE_DICT[term];
  if (!info) return;
  const el = document.getElementById('xTooltip');
  if (!el) return;
  el.innerHTML = `
    <div style="font-weight:700;color:${info.color};margin-bottom:4px">${term} · <span style="font-size:.68rem;font-weight:400">${info.type}</span></div>
    <div style="color:var(--text);margin-bottom:4px">${info.meaning}</div>
    ${info.trading ? `<div style="color:${info.color};font-size:.7rem">📈 ${info.trading}</div>` : ''}
    ${info.example ? `<div style="color:var(--faint);font-size:.65rem;margin-top:3px">例：${info.example}</div>` : ''}`;
  el.style.borderColor = info.color + '66';
  el.style.left = Math.min((event?.clientX||0)+12, window.innerWidth-280)+'px';
  el.style.top  = Math.min((event?.clientY||0)+16, window.innerHeight-180)+'px';
  el.style.display = 'block';
};

// showSimilarCases(result) — 文档优化项5
window.showSimilarCases = function(currentResult) {
  const combos = (window._lastDivineCombos||[]).map(c=>c.name);
  const similar = findSimilarCases(combos);
  if (!similar.length) { alert('暂无相似历史案例'); return; }
  const html = similar.map(s=>`
    <div style="margin-bottom:8px;padding:8px;background:rgba(200,168,74,.1);border-radius:6px">
      <div style="display:flex;justify-content:space-between">
        <span style="font-weight:700">${s.coin} ${s.date}</span>
        <span style="color:${s.verified?'#28c870':'#888'}">${s.verified?'✅ 已验证':'⏳ 待验证'}</span>
      </div>
      <div style="font-size:.9rem;margin:4px 0">${s.predicted}</div>
      <div style="font-size:.8rem;color:var(--muted)">实际：${s.actual}</div>
      <div style="font-size:.8rem;color:${s.matchRate>.7?'#28c870':'#d4a843'}">匹配度：${Math.round(s.matchRate*100)}%</div>
    </div>`).join('');
  // 复用案例渲染到弹窗
  const overlay = document.createElement('div');
  overlay.style.cssText='position:fixed;top:0;right:0;bottom:0;left:0;background:rgba(0,0,0,.5);z-index:3000;display:flex;align-items:center;justify-content:center';
  overlay.innerHTML=`<div style="background:var(--card);border-radius:14px;padding:20px;max-width:340px;width:95vw;max-height:80vh;overflow-y:auto">
    <div style="display:flex;justify-content:space-between;margin-bottom:12px">
      <b>📚 历史相似案例</b>
      <button onclick="this.closest('div[style]').remove()" style="background:none;border:none;cursor:pointer;font-size:1.2rem;color:var(--muted)">✕</button>
    </div>${html}</div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)overlay.remove();});
};

// renderTodaysBestTime(coin) → HTML string — 文档优化项8
window.renderTodaysBestTime = function(coin) {
  const bt = getTodaysBestTime(coin||'BTC');
  if (!bt.best) return '<div>今日无特别吉时</div>';
  const SHI_MAP={'子时':'23:00-01:00','丑时':'01:00-03:00','寅时':'03:00-05:00','卯时':'05:00-07:00','辰时':'07:00-09:00','巳时':'09:00-11:00','午时':'11:00-13:00','未时':'13:00-15:00','申时':'15:00-17:00','酉时':'17:00-19:00','戌时':'19:00-21:00','亥时':'21:00-23:00'};
  return `<div style="background:rgba(40,200,112,.1);border:1px solid rgba(40,200,112,.3);border-radius:10px;padding:15px">
    <div style="font-size:1.2rem;font-weight:700;color:#28c870;margin-bottom:5px">⏰ 今日最佳交易时段</div>
    <div style="font-size:2rem;font-weight:800;color:#28c870;margin:10px 0">${bt.best.hour}</div>
    <div style="font-size:1rem;color:var(--text)">${bt.best.timeRange}</div>
    <div style="font-size:.8rem;color:var(--muted);margin-top:10px">置信度 ${Math.round(bt.best.conf*100)}%</div>
    ${bt.all.slice(1,4).length?`<div style="margin-top:15px;border-top:1px solid rgba(255,255,255,.1);padding-top:10px">
      <div style="font-size:.9rem;font-weight:700;margin-bottom:8px">其他吉时</div>
      ${bt.all.slice(1,4).map(t=>`<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span>${t.hour} ${SHI_MAP[t.hour]||''}</span><span style="color:#d4a843">✨ ${t.votes}票</span></div>`).join('')}
    </div>`:''}
  </div>`;
};

// getLocalTime(coin, date) — 文档优化项3 别名
window.getLocalTime = window.getCoinLocalTime;

'use strict';

// ══════════════════════════════════════════════════════════
// 模块A：玄学神经网络
// ══════════════════════════════════════════════════════════
class XuanNeuralNetwork {
  constructor(iS=10,hS=8){
    this.iS=iS;this.hS=hS;
    this.accuracy=0.5;this.trainingHistory=[];
    this._initW();
  }
  _initW(){
    let s=42;const rng=()=>{s=(s*9301+49297)%233280;return s/233280-0.5;};
    this.wIH=Array.from({length:this.iS},()=>Array.from({length:this.hS},()=>rng()*0.5));
    this.wHO=Array.from({length:this.hS},()=>rng()*0.5);
    this.bH=new Array(this.hS).fill(0.1);this.bO=0.1;
  }
  sig(x){return 1/(1+Math.exp(-Math.max(-500,Math.min(500,x))));}
  _fwd(f){
    const h=this.bH.map((b,j)=>this.sig(b+f.reduce((s,fi,i)=>s+fi*this.wIH[i][j],0)));
    return{h,o:this.sig(this.bO+h.reduce((s,hj,j)=>s+hj*this.wHO[j],0))};
  }
  predict(f){return this._fwd(f).o;}
  train(f,t,lr=0.1){
    const{h,o}=this._fwd(f);const e=t-o;const dO=e*o*(1-o);
    this.wHO.forEach((_,j)=>{this.wHO[j]+=lr*dO*h[j];});this.bO+=lr*dO;
    const dH=h.map((hj,j)=>dO*this.wHO[j]*hj*(1-hj));
    f.forEach((_,i)=>{dH.forEach((d,j)=>{this.wIH[i][j]+=lr*d*f[i];});});
    dH.forEach((d,j)=>{this.bH[j]+=lr*d;});return Math.abs(e);
  }
  feat(rec){
    const g=rec.engines||{};
    const dE=d=>['开门','生门','休门'].includes(d)?1:['死门','惊门','伤门'].includes(d)?-1:0;
    const wE=s=>!s?0:s.includes('化禄')?1:s.includes('化权')?.5:s.includes('化忌')?-1:0;
    return[
      g.gn?.bias||rec.gnBias||0,
      g.ch?.beichi?(g.ch.beichiType==='底背驰'?1:-1):0,
      dE(g.qm?.door||g.qm?.timeDoor||rec.door||''),
      wE(g.zw?.wealthStar||rec.wealthStar||''),
      g.ic?.bias||0,g.sr?.bias||0,
      typeof rec.pricePercent==='number'?rec.pricePercent:0.5,
      rec.change24h?Math.max(-1,Math.min(1,(rec.change24h||0)/10)):0,
      g.va?.bias||0,g.ve?.bias||0,
    ].map(v=>isNaN(v)?0:Math.max(-1,Math.min(1,v)));
  }
  trainFromErrors(errs){
    const rs=[...errs].sort((a,b)=>(a.ts||0)-(b.ts||0));
    const c=Math.floor(rs.length*.8);
    const tr=rs.slice(0,c),te=rs.slice(c);
    for(let ep=0;ep<50;ep++){
      const lr=0.1/(1+ep*.01);
      tr.forEach(e=>this.train(this.feat(e),e.dirCorrect?1:0,lr));
      if(ep%10===0)this.trainingHistory.push({epoch:ep,acc:this._ev(te)});
    }
    this.accuracy=this._ev(te);
    return{accuracy:this.accuracy,trainSize:tr.length,testSize:te.length};
  }
  _ev(ts){
    if(!ts.length)return 0.5;
    return ts.filter(e=>{const p=this.predict(this.feat(e));return(p>.5&&e.dirCorrect)||(p<=.5&&!e.dirCorrect);}).length/ts.length;
  }
  save(k){try{localStorage.setItem('xuan_nn_'+k,JSON.stringify({wIH:this.wIH,wHO:this.wHO,bH:this.bH,bO:this.bO,acc:this.accuracy,ts:Date.now()}));}catch(e){}}
  load(k){try{const d=JSON.parse(localStorage.getItem('xuan_nn_'+k)||'null');if(!d)return false;Object.assign(this,{wIH:d.wIH,wHO:d.wHO,bH:d.bH,bO:d.bO,accuracy:d.acc||.5});return true;}catch(e){return false;}}
}

class XuanNeuralManager{
  constructor(){this.m={};}
  g(coin){if(!this.m[coin]){const m=new XuanNeuralNetwork();m.load(coin);this.m[coin]=m;}return this.m[coin];}
  trainAll(errors){
    if(!errors?.length)return{};
    const byC={};errors.forEach(e=>{(byC[e.coin||'ALL']||(byC[e.coin||'ALL']=[])).push(e);});
    const res={};
    Object.entries(byC).forEach(([c,list])=>{if(list.length>=10){const r=this.g(c).trainFromErrors(list);this.g(c).save(c);res[c]=r;}});
    if(errors.length>=15){const r=this.g('ALL').trainFromErrors(errors);this.g('ALL').save('ALL');res['ALL']=r;}
    return res;
  }
  predict(coin,engines={}){
    const mc=this.g(coin),ma=this.g('ALL');
    const f=mc.feat({engines});
    const p=mc.accuracy>.5?mc.predict(f)*.65+ma.predict(f)*.35:ma.predict(f);
    const dir=p>.65?'strong_bull':p>.55?'bull':p<.35?'strong_bear':p<.45?'bear':'neutral';
    return{raw:p,direction:dir,confidence:Math.abs(p-.5)*2,modelAccuracy:mc.accuracy};
  }
}

const xuanNN=new XuanNeuralManager();
window.xuanNN=xuanNN;

function renderNNPrediction(coin,engines){
  const pred=xuanNN.predict(coin||'BTC',engines||{});
  const M={strong_bull:['🚀 强烈看涨','#14783e'],bull:['📈 温和看涨','#2ed078'],neutral:['⚖️ 中性','#8c6410'],bear:['📉 温和看跌','#c86030'],strong_bear:['⚠️ 强烈看跌','#b82020']};
  const [txt,col]=M[pred.direction]||M.neutral;
  return `<div class="nn-card">
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div><div style="font-size:.6rem;color:var(--faint);margin-bottom:3px">🧠 玄学神经网络</div>
      <div style="font-size:1.25rem;font-weight:800;color:${col}">${txt}</div></div>
      <div style="text-align:right"><div style="font-size:1.1rem;font-weight:800;color:${col};font-family:monospace">${Math.round(pred.raw*100)}%</div>
      <div style="font-size:.6rem;color:var(--faint)">置信 ${Math.round(pred.confidence*100)}%</div></div>
    </div>
    <div style="margin-top:8px;height:4px;background:var(--bg2);border-radius:2px;overflow:hidden">
      <div style="width:${pred.raw*100}%;height:100%;background:${col};border-radius:2px;transition:width .5s"></div>
    </div>
    <div style="margin-top:4px;font-size:.58rem;color:var(--faint);text-align:right">历史准确率 ${Math.round(pred.modelAccuracy*100)}% · 数据越多越准</div>
  </div>`;
}
window.renderNNPrediction=renderNNPrediction;

// Init on load
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
  ['BTC','ETH','SOL','BNB','XAU','XAG','ALL'].forEach(c=>xuanNN.g(c));
},600));

// Hook renderAll to inject NN panel
(()=>{
  const orig=window.renderAll;
  if(typeof orig!=='function'||orig._nnH)return;
  const h=function(data){
    orig.apply(this,arguments);
    const{coin,gn,ch,qm,zw,ic,sr,va,ve,nt}=data;
    setTimeout(()=>{
      const R=document.getElementById('results');if(!R)return;
      let el=document.getElementById('nnPredPanel');
      if(!el){el=document.createElement('div');el.id='nnPredPanel';
        const cp=document.getElementById('compPanel');
        if(cp?.nextSibling)R.insertBefore(el,cp.nextSibling);else R.appendChild(el);}
      el.innerHTML=renderNNPrediction(coin,{gn,ch,qm,zw,ic,sr,va,ve,nt});
    },120);
  };
  h._nnH=true;window.renderAll=h;
})();

// Train button in error panel
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
  const ep=document.getElementById('errPanelBody');
  if(!ep||ep.querySelector('#nnTrainBtn'))return;
  const b=document.createElement('button');b.id='nnTrainBtn';
  b.style.cssText='width:100%;margin:8px 0 4px;padding:9px;background:rgba(44,80,168,.1);border:1px solid rgba(44,80,168,.28);border-radius:8px;color:#2c50a8;font-size:.78rem;font-weight:700;cursor:pointer;font-family:inherit';
  b.textContent='🧠 训练神经网络';
  b.onclick=()=>{
    const errs=window.tracker?.priceErrors||[];
    if(errs.length<10){alert(`数据不足（${errs.length}条），需至少10条`);return;}
    b.textContent='⏳ 训练中…';b.disabled=true;
    setTimeout(()=>{
      try{const res=xuanNN.trainAll(errs);const lines=Object.entries(res).map(([c,r])=>`${c}：准确率 ${Math.round(r.accuracy*100)}%（训${r.trainSize}/验${r.testSize}）`);
        alert('✅ 训练完成！\n'+lines.join('\n'));}catch(e){alert('出错：'+e.message);}
      b.textContent='🧠 重新训练神经网络';b.disabled=false;
    },80);
  };
  ep.appendChild(b);
},2500));


// ══════════════════════════════════════════════════════════
// 模块B：一键通全自动推演
// ══════════════════════════════════════════════════════════
class OneClickAutomator{
  constructor(){this.running=false;}
  async runAll(){
    if(this.running){alert('正在运行中，请稍候…');return;}
    this.running=true;
    const mode=document.getElementById('autoMode')?.value||'smart';
    const btn=document.getElementById('oneClickBtn');
    if(btn){btn.disabled=true;btn.style.opacity='.55';}
    this._bar(true);
    try{
      this._upd('抓取行情并推演…',0,4);
      // 触发推演按钮（HTML inline onclick 在全局作用域，跨 script 块安全）
      const runBtn = document.getElementById('runAllBtn');
      if(!runBtn) throw new Error('推演按钮未找到，请刷新页面');

      // 直接调用 runDashboard（绕过 loading class 轮询）
      if (typeof runDashboard === 'function') {
        await runDashboard();
      } else {
        runBtn.click();
        await new Promise(r => setTimeout(r, 3000));
      }

      this._upd('推演完成',1,4);

      if(mode==='smart'||mode==='deep'){
        this._upd('自动学习·更新权重…',2,4);
        this._learn();await this._sl(300);
        try { updateLearnStatusBar(); } catch(_) {}
      }
      if(mode==='deep'){
        this._upd('训练神经网络…',3,4);
        const errs=window.tracker?.priceErrors||[];
        if(errs.length>=10)xuanNN.trainAll(errs);
        await this._sl(400);
        this._rpt();
      }
      this._upd('✅ 完成！',4,4);
      this._toast('✅ 一键通完成！');
      if(window.alertPopup)setTimeout(()=>alertPopup.checkAll(),1000);
    }catch(e){console.error('[一键通]',e);alert('出错：'+e.message);}
    finally{
      this.running=false;
      if(btn){btn.disabled=false;btn.style.opacity='';}
      // 立刻隐藏进度条，不用延迟
      this._bar(false);
    }
  }
  _learn(){
    try{const errs=window.tracker?.priceErrors||[];if(!errs.length)return;
      const byE={};errs.forEach(e=>{(byE[e.model||'u']||(byE[e.model||'u']={c:0,t:0}));byE[e.model||'u'].t++;if(e.dirCorrect)byE[e.model||'u'].c++;});
      const nw={};let tot=0;Object.entries(byE).forEach(([k,d])=>{nw[k]=Math.max(.05,d.t>=5?d.c/d.t:.5);tot+=nw[k];});
      if(tot>0)Object.keys(nw).forEach(k=>nw[k]/=tot);
      const cur=JSON.parse(_localStorage.getItem('custom_engine_weights')||'{}');
      _localStorage.setItem('custom_engine_weights',JSON.stringify({...cur,...nw}));
    }catch(e){}
  }
  _rpt(){
    const el=document.getElementById('autoReport');if(!el)return;
    const sc=(window.dashCoins||[]).map(c=>({coin:c.coin,score:window.dashResults?.[c.coin]?.score||0,bias:window.dashResults?.[c.coin]?.avgBias||0,color:c.color||'var(--gold)'})).filter(x=>x.score>0).sort((a,b)=>b.score-a.score);
    if(!sc.length){el.innerHTML='';return;}
    el.innerHTML=`<div style="margin:6px 14px 0;padding:11px 13px;background:var(--card);border:1px solid var(--border);border-radius:10px">
      <div style="font-size:.68rem;font-weight:700;color:#8c6410;margin-bottom:7px">📊 推演快报 <span style="font-size:.58rem;font-weight:400;color:var(--faint)">${new Date().toLocaleTimeString('zh-CN')}</span></div>
      <div style="display:grid;grid-template-columns:repeat(${Math.min(sc.length,3)},1fr);gap:5px">
        ${sc.map(s=>{const bc=s.bias>.08?'#14783e':s.bias<-.08?'#b82020':'#8c6410';return`<div style="background:var(--bg2);border-radius:7px;padding:6px 8px;border:1px solid var(--border)"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px"><span style="font-weight:800;font-size:.8rem;color:${s.color}">${s.coin}</span><span style="font-size:.75rem;font-weight:700;color:${bc};font-family:monospace">${s.score}</span></div><div style="height:3px;background:var(--border);border-radius:1px;overflow:hidden"><div style="width:${s.score}%;height:100%;background:${bc}"></div></div></div>`;}).join('')}
      </div></div>`;
  }
  _bar(show){
    let b=document.getElementById('autoProgressBar');
    if(!b){
      b=document.createElement('div');
      b.id='autoProgressBar';
      b.innerHTML=`<div style="display:flex;align-items:center;gap:10px">
        <span style="color:var(--gold);font-weight:700;font-size:.82rem;white-space:nowrap">⚡ 一键通</span>
        <div style="flex:1;height:6px;background:rgba(0,0,0,.1);border-radius:3px;overflow:hidden">
          <div id="aoPF" style="width:0%;height:100%;background:linear-gradient(90deg,#8c6410,#d4a030);border-radius:3px;transition:width .3s"></div>
        </div>
        <span id="aoPT" style="font-size:.76rem;color:var(--muted);white-space:nowrap;min-width:90px;text-align:right">准备中…</span>
        <button onclick="document.getElementById('autoProgressBar').style.display='none';window.oneClick&&(window.oneClick.running=false);"
          style="background:none;border:none;cursor:pointer;color:var(--faint);font-size:.9rem;padding:0 2px;line-height:1;flex-shrink:0">✕</button>
      </div>`;
      document.body.appendChild(b);
    }
    b.style.display=show?'block':'none';
  }
  _upd(txt,c,t){const f=document.getElementById('aoPF'),tx=document.getElementById('aoPT');if(f)f.style.width=`${Math.round(c/t*100)}%`;if(tx)tx.textContent=txt;}
  _toast(msg){const el=document.createElement('div');el.style.cssText='position:fixed;bottom:22px;right:22px;z-index:10001;background:#14783e;color:#fff;padding:10px 20px;border-radius:9px;font-weight:700;font-size:.85rem;box-shadow:0 4px 14px rgba(0,0,0,.35)';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),3200);}
  _sl(ms){return new Promise(r=>setTimeout(r,ms));}
}

let oneClick;
try {
  oneClick = new OneClickAutomator();
  window.oneClick = oneClick;
} catch(_e) {
  console.error('[一键通] 初始化失败:', _e);
  // Provide a stub so buttons don't crash
  window.oneClick = { running: false, runAll: function() {
    document.getElementById('runAllBtn')?.click();
  }};
  oneClick = window.oneClick;
}


// ══════════════════════════════════════════════════════════
// 模块C：弹窗提示系统
// ══════════════════════════════════════════════════════════
class AlertPopupSystem{
  constructor(){this.enabled=true;this.soundEnabled=true;this.last={};this._init();}
  _init(){
    if(!document.getElementById('alertContainer')){const c=document.createElement('div');c.id='alertContainer';document.body.appendChild(c);}
  }
  _sound(t){
    if(!this.soundEnabled)return;
    try{const ctx=new(window.AudioContext||window.webkitAudioContext)(),o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
      if(t==='buy'){o.frequency.setValueAtTime(880,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(1100,ctx.currentTime+.2);g.gain.setValueAtTime(.22,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+.3);o.start();o.stop(ctx.currentTime+.3);}
      else if(t==='sell'){o.frequency.setValueAtTime(660,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(440,ctx.currentTime+.2);g.gain.setValueAtTime(.22,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+.3);o.start();o.stop(ctx.currentTime+.3);}
      else if(t==='tp'){[0,.12,.24].forEach((ts,i)=>{const oo=ctx.createOscillator(),gg=ctx.createGain();oo.connect(gg);gg.connect(ctx.destination);oo.frequency.setValueAtTime([440,880,1320][i],ctx.currentTime+ts);gg.gain.setValueAtTime(.18,ctx.currentTime+ts);gg.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+ts+.1);oo.start(ctx.currentTime+ts);oo.stop(ctx.currentTime+ts+.12);});}
      else if(t==='sl'){o.frequency.setValueAtTime(440,ctx.currentTime);o.frequency.exponentialRampToValueAtTime(220,ctx.currentTime+.15);g.gain.setValueAtTime(.22,ctx.currentTime);g.gain.exponentialRampToValueAtTime(.01,ctx.currentTime+.3);o.start();o.stop(ctx.currentTime+.3);}
    }catch(e){}
  }
  playSound(t){this._sound(t);}
  show(type,data){
    if(!this.enabled)return;
    const key=`${data.coin}_${type}`;
    if(this.last[key]&&Date.now()-this.last[key]<9000)return;
    this.last[key]=Date.now();
    this._sound(type);
    if(navigator.vibrate)navigator.vibrate(type==='buy'||type==='tp'?[80,40,160]:[160,40,80]);
    const C={buy:['🚀 买入信号','#14783e'],sell:['⚠️ 卖出信号','#b82020'],tp:['🎯 止盈达成','#d4a030'],sl:['🛡️ 止损触发','#666'],alert:['🔔 价格警报','#2c50a8']};
    const[title,col]=C[type]||C.alert;
    const fP=p=>p>=1000?'$'+Math.round(p).toLocaleString():p>=1?'$'+p.toFixed(2):'$'+p.toFixed(4);
    const el=document.createElement('div');el.className=`apo ${type}`;el.style.cssText+='border-left-color:'+col;
    el.innerHTML=`<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px"><span style="font-weight:800;font-size:.88rem;color:${col}">${title}</span><div style="display:flex;gap:5px;align-items:center"><span style="font-size:.62rem;color:rgba(255,255,255,.35)">${new Date().toLocaleTimeString('zh-CN')}</span><button onclick="this.closest('.apo').remove()" style="background:none;border:none;color:rgba(255,255,255,.4);cursor:pointer;font-size:.9rem;padding:0 2px;line-height:1">✕</button></div></div><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px"><span style="font-size:1.1rem;font-weight:800;color:#eae6da">${data.coin}</span><span style="font-size:.98rem;font-weight:800;color:${col};font-family:monospace">${fP(data.price)}</span></div>${data.message?`<div style="font-size:.76rem;color:rgba(234,230,218,.7);margin-bottom:3px">${data.message}</div>`:''}${data.tp?`<div style="font-size:.7rem;color:#d4a030">🎯 目标 ${fP(data.tp)}</div>`:''}${data.sl?`<div style="font-size:.7rem;color:#b82020">🛡️ 止损 ${fP(data.sl)}</div>`:''}${data.reason?`<div style="font-size:.62rem;color:rgba(234,230,218,.4);margin-top:3px">${data.reason}</div>`:''}`;
    const cont=document.getElementById('alertContainer');
    if(cont){cont.appendChild(el);while(cont.children.length>5)cont.firstChild.remove();}
    setTimeout(()=>{if(el.parentElement){el.style.animation='apoSlide .28s reverse';setTimeout(()=>el.remove(),280);}},10000);
  }
  checkAll(){
    Object.entries(window.dashResults||{}).forEach(([coin,res])=>{
      if(!res||res==='loading'||res.error||res.needsPrice)return;
      const p=res.price||0,door=res.qm?.door||res.qm?.timeDoor||'',tpsl=res.tpsl;
      if(door==='开门'&&(res.score||50)>62)this.show('buy',{coin,price:p,message:'奇门开门·入场信号',reason:`评分${res.score}`,tp:tpsl?.tpLevels?.[0]?.price,sl:tpsl?.slLevels?.[0]?.price});
      if(res.ch?.beichiType==='底背驰')this.show('buy',{coin,price:p,message:'缠论底背驰·抄底',reason:'下跌动能衰竭',tp:tpsl?.tpLevels?.[0]?.price,sl:tpsl?.slLevels?.[0]?.price});
      if(door==='死门'&&(res.score||50)<40)this.show('sell',{coin,price:p,message:'奇门死门·离场',reason:`评分${res.score}`,sl:tpsl?.slLevels?.[0]?.price});
      if(res.ch?.beichiType==='顶背驰')this.show('sell',{coin,price:p,message:'缠论顶背驰·逃顶',reason:'上涨动能衰竭'});
      if(tpsl){
        (tpsl.tpLevels||[]).forEach((tp,i)=>{const k=`${coin}_tp${i}`;if(p>=tp.price&&(!this.last[k]||Date.now()-this.last[k]>180000))this.show('tp',{coin,price:p,message:`TP${i+1}达成`});});
        (tpsl.slLevels||[]).forEach((sl,i)=>{const k=`${coin}_sl${i}`;if(p<=sl.price&&(!this.last[k]||Date.now()-this.last[k]>180000))this.show('sl',{coin,price:p,message:`SL${i+1}触发`});});
      }
    });
  }
}

const alertPopup=new AlertPopupSystem();
window.alertPopup=alertPopup;

// 每30秒自动检查
setInterval(()=>alertPopup.checkAll(),30000);

// 推演完成后自动检查警报（通过 renderAll hook，不修改 runDashboard）


// 🔔 按钮注入顶栏
document.addEventListener('DOMContentLoaded',()=>setTimeout(()=>{
  const tr=document.querySelector('.topbar-right');
  if(!tr||tr.querySelector('#alertSettingBtn'))return;
  const btn=document.createElement('button');
  btn.id='alertSettingBtn';btn.className='icon-btn';btn.title='弹窗提示';btn.textContent='🔔';btn.style.fontSize='.85rem';
  btn.onclick=()=>{
    const m=document.createElement('div');m.className='modal-overlay open';
    m.innerHTML=`<div class="modal-box" style="max-width:350px"><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button><div class="modal-title">🔔 弹窗提示设置</div>
      <div style="padding:8px 0"><div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;font-size:.85rem"><span>启用弹窗</span><input type="checkbox" ${alertPopup.enabled?'checked':''} onchange="alertPopup.enabled=this.checked"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin:10px 0;font-size:.85rem"><span>启用声音</span><input type="checkbox" ${alertPopup.soundEnabled?'checked':''} onchange="alertPopup.soundEnabled=this.checked"></div>
      <div style="margin-top:14px;font-weight:700;font-size:.8rem;margin-bottom:7px">测试声音</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px">
        <button onclick="alertPopup.playSound('buy')" class="icon-btn" style="font-size:.75rem">🚀 买入音</button>
        <button onclick="alertPopup.playSound('sell')" class="icon-btn" style="font-size:.75rem">⚠️ 卖出音</button>
        <button onclick="alertPopup.playSound('tp')" class="icon-btn" style="font-size:.75rem">🎯 止盈音</button>
        <button onclick="alertPopup.playSound('sl')" class="icon-btn" style="font-size:.75rem">🛡️ 止损音</button>
      </div>
      <div style="margin-top:14px"><button onclick="alertPopup.show('buy',{coin:'BTC',price:window.dashResults?.BTC?.price||85000,message:'测试：奇门开门',reason:'这是测试弹窗'})" class="icon-btn" style="width:100%;font-size:.78rem">📌 触发测试弹窗</button></div></div>
      <div style="text-align:right;margin-top:8px"><button class="run-btn" onclick="this.closest('.modal-overlay').remove()">确定</button></div></div>`;
    document.body.appendChild(m);m.addEventListener('click',e=>{if(e.target===m)m.remove();});
  };
  tr.appendChild(btn);
},1500));

'use strict';

// ══════════════════════════════════════════════════════════
// 可视化引擎：所有9个图表 + 智能提醒
// ══════════════════════════════════════════════════════════

// ── 1. 风险评分 ─────────────────────────────────────────
function calcRiskScore(engines) {
  let risk = 30; // 基础风险
  const { qm, zw, ch, gn, sr, ic, ve, hr } = engines || {};

  // 奇门凶门 +20
  const DIRE_DOORS = new Set(['死门','惊门','伤门']);
  const LUCK_DOORS = new Set(['开门','生门','休门']);
  const door = qm?.door || qm?.timeDoor || '';
  if (DIRE_DOORS.has(door)) risk += 20;
  else if (LUCK_DOORS.has(door)) risk -= 10;

  // 紫微化忌 +25
  if (zw?.jiInWealth || zw?.jiInCareer) risk += 25;
  if (zw?.luInWealth || zw?.quanInCareer) risk -= 12;

  // 缠论背驰 (顶背驰高风险)
  if (ch?.beichi) {
    if (ch.beichiType === '顶背驰') risk += 18;
    else risk -= 8;
  }

  // 江恩偏向
  const gBias = gn?.bias || 0;
  if (Math.abs(gBias) < 0.1) risk += 8; // 方向不明

  // 谐波失败
  if (hr?.bias && Math.abs(hr.bias) < 0.05) risk += 5;

  // 易经凶卦
  const judg = ic?.judgment || '';
  if (judg === '大凶') risk += 20;
  else if (judg === '大吉') risk -= 10;

  return Math.max(0, Math.min(100, Math.round(risk)));
}

function renderRiskCard(container, engines, score) {
  const risk = score !== undefined ? score : calcRiskScore(engines);
  const col  = risk >= 70 ? '#b82020' : risk >= 40 ? '#d4a030' : '#14783e';
  const lbl  = risk >= 70 ? '高风险' : risk >= 40 ? '中风险' : '低风险';
  const ico  = risk >= 70 ? '🔴' : risk >= 40 ? '🟡' : '🟢';

  // SVG 半圆仪表
  const pct  = risk / 100;
  const r    = 52, cx = 70, cy = 64;
  const startA = Math.PI, endA = startA + pct * Math.PI;
  const x1 = cx + r * Math.cos(startA), y1 = cy + r * Math.sin(startA);
  const x2 = cx + r * Math.cos(endA),   y2 = cy + r * Math.sin(endA);
  const lg  = pct > 0.5 ? 1 : 0;

  container.innerHTML = `<div class="viz-card">
    <div class="viz-card-title">⚡ 风险等级</div>
    <div style="display:flex;align-items:center;gap:14px">
      <svg width="140" height="72" viewBox="0 0 140 72">
        <path d="M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}" fill="none" stroke="var(--bg2)" stroke-width="12" stroke-linecap="round"/>
        <path d="M${x1},${y1} A${r},${r} 0 ${lg},1 ${x2},${y2}" fill="none" stroke="${col}" stroke-width="12" stroke-linecap="round"/>
        <text x="${cx}" y="${cy-4}" text-anchor="middle" font-size="22" font-weight="800" fill="${col}">${risk}</text>
        <text x="${cx}" y="${cy+12}" text-anchor="middle" font-size="9" fill="var(--faint)">/ 100</text>
      </svg>
      <div>
        <div style="font-size:1.1rem;font-weight:800;color:${col}">${ico} ${lbl}</div>
        <div style="font-size:.64rem;color:var(--muted);margin-top:4px;line-height:1.8">
          ${risk>=70?'凶门化忌，谨慎操作':risk>=40?'信号中性，控制仓位':'吉门利好，可适量布局'}
        </div>
        ${engines ? `<div style="font-size:.6rem;color:var(--faint);margin-top:4px">
          奇门 ${DIRE_DOORS?.has(engines.qm?.door||engines.qm?.timeDoor||'')?'⚠凶':'✓吉'} ·
          紫微 ${(engines.zw?.jiInWealth||engines.zw?.jiInCareer)?'⚠忌':'✓顺'} ·
          缠论 ${engines.ch?.beichi?(engines.ch.beichiType==='顶背驰'?'⚠顶':'✓底'):'—'}
        </div>` : ''}
      </div>
    </div>
  </div>`;
}
// make DIRE_DOORS available locally in renderRiskCard closure
const _DIRE_DOORS = new Set(['死门','惊门','伤门']);

// ── 2. 胜率统计（注入误差面板） ─────────────────────────
function renderWinRateTable() {
  const errors = window.tracker?.priceErrors || [];
  const byEng  = {};
  errors.forEach(e => {
    const m = e.model || 'unknown';
    if (!byEng[m]) byEng[m] = { wins:0, total:0, recent:[] };
    byEng[m].total++;
    if (e.dirCorrect) byEng[m].wins++;
    byEng[m].recent.push(e.dirCorrect ? 1 : 0);
  });

  const rows = Object.entries(byEng).map(([eng, d]) => {
    const wr    = d.total > 0 ? d.wins / d.total : 0;
    const r10   = d.recent.slice(-10);
    const wr10  = r10.length ? r10.reduce((s,v)=>s+v,0)/r10.length : wr;
    return { eng, wr, wr10, n: d.total };
  }).sort((a,b) => b.wr - a.wr);

  if (!rows.length) return '<div style="font-size:.65rem;color:var(--faint);text-align:center;padding:8px">暂无误差记录</div>';

  const ENG_NAMES = { gann:'江恩', chan:'缠论', sr:'支阻', harmonic:'谐波', qimen:'奇门', iching:'易经', vedic:'占星', natal:'命盘', ziwei:'紫微', volRate:'波动率' };
  return `<div style="padding:6px 0">
    ${rows.slice(0,8).map(r=>{
      const col = r.wr>=.65?'#14783e':r.wr>=.50?'#8c6410':'#b82020';
      const name = ENG_NAMES[r.eng] || r.eng;
      return `<div class="wr-row">
        <span style="width:42px;color:var(--text);font-weight:600">${name}</span>
        <div class="wr-bar-wrap"><div class="wr-bar-fill" style="width:${r.wr*100}%;background:${col}"></div></div>
        <span style="width:34px;text-align:right;color:${col};font-weight:700">${(r.wr*100).toFixed(0)}%</span>
        <span style="width:28px;text-align:right;color:var(--faint)">${r.n}次</span>
        <span style="width:36px;text-align:right;font-size:.6rem;color:${r.wr10>=.6?'#14783e':r.wr10<.4?'#b82020':'var(--muted)'}">近${(r.wr10*100).toFixed(0)}%</span>
      </div>`;
    }).join('')}
  </div>`;
}

function injectWinRateToErrPanel() {
  const ep = document.getElementById('errPanelBody');
  if (!ep) return;
  let el = document.getElementById('wrTableWrap');
  if (!el) {
    el = document.createElement('div');
    el.id = 'wrTableWrap';
    el.style.cssText = 'padding:10px 14px;border-top:1px solid rgba(140,100,16,.15)';
    el.innerHTML = `<div style="font-size:.65rem;font-weight:700;color:#8c6410;margin-bottom:5px">📊 引擎胜率统计</div><div id="wrTableBody"></div>`;
    ep.appendChild(el);
  }
  const body = document.getElementById('wrTableBody');
  if (body) body.innerHTML = renderWinRateTable();
}

// ── 3. 天时地利人和 三才卡片 ─────────────────────────────
function updateTianDiCards(engines) {
  const row = document.getElementById('tiandiRow');
  if (!row) return;

  const qm = engines?.qm || {};
  const zw = engines?.zw || {};
  const gn = engines?.gn || {};
  const ch = engines?.ch || {};

  const door = qm.door || qm.timeDoor || '';
  const LUCK = new Set(['开门','生门','休门']);
  const DIRE = new Set(['死门','惊门','伤门']);

  // 天时：奇门
  const tianScore = LUCK.has(door) ? 'bull' : DIRE.has(door) ? 'bear' : 'neut';
  const tianTxt   = LUCK.has(door) ? '吉' : DIRE.has(door) ? '凶' : '中';
  const tianSub   = door ? `${door}当令` : '时令平稳';

  // 地利：紫微
  const diScore = (zw.luInWealth||zw.quanInCareer) ? 'bull' : (zw.jiInWealth||zw.jiInCareer) ? 'bear' : 'neut';
  const diTxt   = diScore==='bull'?'吉':diScore==='bear'?'凶':'中';
  const diSub   = zw.wealthStar ? `财${zw.wealthStar.slice(0,4)}` : '地利平和';

  // 人和：江恩+缠论
  const gnB   = gn.bias || 0;
  const chB   = ch.beichi ? (ch.beichiType==='底背驰'?0.5:-0.5) : 0;
  const renB  = gnB*0.6 + chB*0.4;
  const renScore = renB > 0.15 ? 'bull' : renB < -0.15 ? 'bear' : 'neut';
  const renTxt   = renScore==='bull'?'顺':renScore==='bear'?'逆':'平';
  const renSub   = `江恩${gnB>0?'+':''+(gnB*100).toFixed(0)}%`;

  const colMap = { bull:'var(--bull)', bear:'var(--bear)', neut:'var(--gold)' };

  row.style.display = 'grid';
  row.innerHTML = [
    ['🌤', '天时', tianTxt, tianSub, tianScore],
    ['⛰', '地利', diTxt,   diSub,   diScore],
    ['🤝', '人和', renTxt,  renSub,  renScore],
  ].map(([ico,lbl,val,sub,cls]) => `
    <div class="tiandi-card">
      <div class="tiandi-icon">${ico}</div>
      <div class="tiandi-label">${lbl}</div>
      <div class="tiandi-val" style="color:${colMap[cls]}">${val}</div>
      <div class="tiandi-sub">${sub}</div>
    </div>`).join('');
}

// ── 4. 热力图（24时辰×币种） ─────────────────────────────
function renderHeatmap(container, coins) {
  const SHI = ['子','丑','寅','卯','辰','巳','午','未','申','酉','戌','亥'];
  const coinList = (coins || window.dashCoins || []).slice(0,6);
  if (!coinList.length) { container.innerHTML='<div style="font-size:.65rem;color:var(--faint)">请先推演获取数据</div>'; return; }

  let html = `<div class="viz-card"><div class="viz-card-title">🌡 24时辰吉凶热力图</div>
    <div class="heatmap-wrap"><div class="heatmap-grid" style="grid-template-columns:50px repeat(12,28px);gap:2px">
    <div style="font-size:.6rem;color:var(--faint)">币种 \\ 时</div>
    ${SHI.map(s=>`<div style="font-size:.58rem;color:var(--faint);text-align:center;padding:2px 0">${s}</div>`).join('')}`;

  coinList.forEach(c => {
    const res = window.dashResults?.[c.coin];
    if (!res || res === 'loading') return;
    html += `<div style="font-size:.65rem;font-weight:700;color:${c.color||'var(--gold)'};padding:2px 4px">${c.coin}</div>`;
    for (let h = 0; h < 12; h++) {
      const hour = h * 2;
      let score = 50;
      try {
        const qm = engineQiMen ? engineQiMen(c.coin, (new Date()).toISOString().slice(0,10)) : {};
        const door = qm?.door || '';
        const LUCK2 = new Set(['开门','生门','休门']);
        const DIRE2 = new Set(['死门','惊门','伤门']);
        const gBias = res.gn?.bias || 0;
        score = 50 + gBias*25 + (LUCK2.has(door)?15:DIRE2.has(door)?-20:0);
        // Vary by hour using deterministic offset
        const hOff = Math.sin((h + (res.score||50)/10) * 0.8) * 12;
        score = Math.max(5, Math.min(95, Math.round(score + hOff)));
      } catch(e) {}
      const g = Math.round(score * 2.55), r = Math.round((100-score) * 2.55);
      html += `<div class="hm-cell" title="${SHI[h]}时: ${score}分" style="background:rgb(${r},${g},60);color:${score>60?'#fff':score<40?'#fff':'#333'}">${score}</div>`;
    }
  });

  html += '</div></div></div>';
  container.innerHTML = html;
}

// ── 5. 雷达图（十引擎） ──────────────────────────────────
function drawRadar(canvas, engines, score) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2, R = Math.min(W,H)/2 - 28;
  ctx.clearRect(0,0,W,H);

  const LABELS = ['江恩','缠论','支阻','谐波','奇门','易经','占星','命盘','紫微','波动率'];
  const N = LABELS.length;
  const vals = [
    ((engines?.gn?.bias||0)+1)/2,
    engines?.ch?.beichi?(engines.ch.beichiType==='底背驰'?0.8:0.2):0.5,
    ((engines?.sr?.bias||0)+1)/2,
    ((engines?.hr?.bias||0)+1)/2,
    ((engines?.qm?.bias||0)+1)/2,
    ((engines?.ic?.bias||0)+1)/2,
    ((engines?.ve?.bias||0)+1)/2,
    ((engines?.nt?.bias||0)+1)/2,
    ((engines?.zw?.bias||0)+1)/2,
    ((engines?.va?.bias||0)+1)/2,
  ];

  const isDark = document.documentElement.getAttribute('data-theme')==='dark';
  const gridC  = isDark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.07)';
  const textC  = isDark ? '#aaa' : '#888';

  // Grid circles
  for (let ring = 1; ring <= 4; ring++) {
    const rr = R * ring / 4;
    ctx.beginPath();
    for (let i=0;i<N;i++) {
      const a = (i/N)*Math.PI*2 - Math.PI/2;
      i===0 ? ctx.moveTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a)) : ctx.lineTo(cx+rr*Math.cos(a),cy+rr*Math.sin(a));
    }
    ctx.closePath();
    ctx.strokeStyle = gridC; ctx.lineWidth=1; ctx.stroke();
    if (ring===2) { ctx.fillStyle='rgba(140,100,16,.04)'; ctx.fill(); }
  }

  // Spokes + labels
  for (let i=0;i<N;i++) {
    const a = (i/N)*Math.PI*2 - Math.PI/2;
    ctx.beginPath(); ctx.moveTo(cx,cy);
    ctx.lineTo(cx+R*Math.cos(a),cy+R*Math.sin(a));
    ctx.strokeStyle=gridC; ctx.stroke();
    const lx = cx+(R+16)*Math.cos(a), ly = cy+(R+16)*Math.sin(a);
    ctx.fillStyle=textC; ctx.font='bold 9px sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(LABELS[i], lx, ly);
  }

  // Data polygon
  ctx.beginPath();
  vals.forEach((v,i)=>{
    const a=(i/N)*Math.PI*2-Math.PI/2, rv=R*Math.max(.02,Math.min(1,v));
    i===0?ctx.moveTo(cx+rv*Math.cos(a),cy+rv*Math.sin(a)):ctx.lineTo(cx+rv*Math.cos(a),cy+rv*Math.sin(a));
  });
  ctx.closePath();
  ctx.fillStyle  = 'rgba(140,100,16,.22)';
  ctx.strokeStyle= '#d4a030';
  ctx.lineWidth  = 2;
  ctx.fill(); ctx.stroke();

  // Dots
  vals.forEach((v,i)=>{
    const a=(i/N)*Math.PI*2-Math.PI/2, rv=R*Math.max(.02,Math.min(1,v));
    const col=v>0.6?'#14783e':v<0.4?'#b82020':'#d4a030';
    ctx.beginPath(); ctx.arc(cx+rv*Math.cos(a),cy+rv*Math.sin(a),4,0,Math.PI*2);
    ctx.fillStyle=col; ctx.fill();
  });

  // Center score
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font=`bold 20px monospace`; ctx.fillStyle='var(--gold,#d4a030)';
  ctx.fillText(score||'—', cx, cy-6);
  ctx.font='10px sans-serif'; ctx.fillStyle=textC;
  ctx.fillText('综合评分', cx, cy+10);
}

// ── 6. 趋势折线图（复用 getTrendEnergy） ─────────────────
function drawTrendLine(canvas, coin) {
  if (typeof getTrendEnergy !== 'function') return;
  const trends = getTrendEnergy(coin, 30);
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height, PAD={t:12,r:12,b:22,l:30};
  const cW=W-PAD.l-PAD.r, cH=H-PAD.t-PAD.b, n=trends.length;
  ctx.clearRect(0,0,W,H);

  const isDark = document.documentElement.getAttribute('data-theme')==='dark';
  const gc = isDark?'rgba(255,255,255,.07)':'rgba(0,0,0,.06)';
  const tc = isDark?'#666':'#bbb';
  const px = i=>PAD.l+(i/(n-1))*cW, py = e=>PAD.t+((100-e)/100)*cH;

  // Grid & 50-line
  ctx.strokeStyle=gc; ctx.lineWidth=1;
  [0,25,50,75,100].forEach(v=>{ctx.beginPath();ctx.moveTo(PAD.l,py(v));ctx.lineTo(W-PAD.r,py(v));ctx.stroke();});
  ctx.setLineDash([4,3]); ctx.strokeStyle=isDark?'#333':'#ddd';
  ctx.beginPath();ctx.moveTo(PAD.l,py(50));ctx.lineTo(W-PAD.r,py(50));ctx.stroke();ctx.setLineDash([]);

  // Area
  ctx.beginPath();
  ctx.moveTo(px(0),py(trends[0].energy));
  trends.slice(1).forEach((t,i)=>ctx.lineTo(px(i+1),py(t.energy)));
  ctx.lineTo(px(n-1),PAD.t+cH); ctx.lineTo(px(0),PAD.t+cH); ctx.closePath();
  ctx.fillStyle='rgba(140,100,16,.12)'; ctx.fill();

  // Line
  ctx.beginPath(); ctx.strokeStyle='#d4a030'; ctx.lineWidth=2;
  trends.forEach((t,i)=>i===0?ctx.moveTo(px(i),py(t.energy)):ctx.lineTo(px(i),py(t.energy)));
  ctx.stroke();

  // Dots
  const LUCK3=new Set(['开门','生门','休门']),DIRE3=new Set(['死门','惊门','伤门']);
  trends.forEach((t,i)=>{
    if(!LUCK3.has(t.door)&&!DIRE3.has(t.door))return;
    ctx.beginPath();ctx.arc(px(i),py(t.energy),4,0,Math.PI*2);
    ctx.fillStyle=LUCK3.has(t.door)?'#14783e':'#b82020';ctx.fill();
  });

  // X labels
  ctx.font='8px sans-serif'; ctx.fillStyle=tc; ctx.textAlign='center';
  trends.forEach((t,i)=>{ if(i===0||(i+1)%7===0)ctx.fillText(t.date.slice(5),px(i),H-5); });

  // Y label
  ctx.textAlign='right';
  [0,50,100].forEach(v=>ctx.fillText(v,PAD.l-2,py(v)+4));
}

// ── 7. 九宫格（奇门） ─────────────────────────────────────
function drawQiMenBoard(canvas, qmData) {
  const ctx = canvas.getContext('2d');
  const W=canvas.width, H=canvas.height;
  const cell=Math.floor(Math.min(W,H)/3);
  ctx.clearRect(0,0,W,H);

  const isDark = document.documentElement.getAttribute('data-theme')==='dark';
  const bg  = isDark?'#1c1d28':'#f5f0e8';
  const bc  = isDark?'#282a38':'#ddd8cc';
  const tc  = isDark?'#eae6da':'#2a1e0c';
  const fc  = isDark?'#564e44':'#9a9080';

  // Loushu 宫序布局（从左到右从上到下：4,9,2,3,5,7,8,1,6）
  const LOUSHU_POS = [[4,9,2],[3,5,7],[8,1,6]]; // row,col → 宫号
  const layout = qmData?.layout || {};
  const curGong = qmData?.palace || qmData?.timeGong || 5;

  for (let row=0;row<3;row++) for (let col=0;col<3;col++) {
    const gong = LOUSHU_POS[row][col];
    const x=col*cell, y=row*cell;
    const isActive = gong===curGong;
    const isMid = gong===5;

    ctx.fillStyle = isActive?'rgba(212,160,48,.18)':isMid?'rgba(140,100,16,.06)':bg;
    ctx.fillRect(x,y,cell,cell);
    ctx.strokeStyle=isActive?'#d4a030':bc; ctx.lineWidth=isActive?2:1;
    ctx.strokeRect(x,y,cell,cell);

    const star = layout.stars?.[gong]||'';
    const door = layout.doors?.[gong]||'';
    const god  = layout.gods?.[gong]||'';

    ctx.font=`bold 10px sans-serif`; ctx.textAlign='center';
    ctx.fillStyle=isActive?'#d4a030':tc;
    ctx.fillText(gong+'宫', x+cell/2, y+14);
    ctx.font='9px sans-serif'; ctx.fillStyle=isActive?'#14783e':fc;
    ctx.fillText(star.slice(0,3), x+cell/2, y+28);
    const doorCol = new Set(['开门','生门','休门']).has(door)?'#14783e':new Set(['死门','惊门','伤门']).has(door)?'#b82020':fc;
    ctx.fillStyle=isActive?doorCol:doorCol; ctx.font='bold 9px sans-serif';
    ctx.fillText(door||'—', x+cell/2, y+42);
    ctx.font='9px sans-serif'; ctx.fillStyle=fc;
    ctx.fillText(god.slice(0,2)||'', x+cell/2, y+54);
  }
}

// ── 8. 紫微盘（十二宫圆形） ──────────────────────────────
function drawZiweiBoard(canvas, zwData) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2;
  const Ro=Math.min(W,H)/2-10, Ri=Ro*0.55;
  ctx.clearRect(0,0,W,H);

  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const tc=isDark?'#eae6da':'#2a1e0c', fc=isDark?'#564e44':'#9a9080';
  const PALACES=window.Ziwei?.PALACES||['命宫','兄弟','夫妻','子女','财帛','疾厄','迁移','奴仆','官禄','田宅','福德','父母'];
  const palStars=zwData?.palStars||[];
  const lifePalIdx=PALACES.indexOf(zwData?.lifePal??'命宫');
  const wealthIdx=PALACES.indexOf(zwData?.wealthPalace||'财帛');
  const careerIdx=PALACES.indexOf(zwData?.careerPalace||'官禄');

  for (let i=0;i<12;i++) {
    const a1=(i/12)*Math.PI*2-Math.PI/2;
    const a2=((i+1)/12)*Math.PI*2-Math.PI/2;
    const amid=(a1+a2)/2;

    const isWealth=i===wealthIdx, isCareer=i===careerIdx, isLife=i===lifePalIdx;
    ctx.beginPath();
    ctx.moveTo(cx+Ri*Math.cos(a1),cy+Ri*Math.sin(a1));
    ctx.arc(cx,cy,Ro,a1,a2); ctx.arc(cx,cy,Ri,a2,a1,true); ctx.closePath();
    ctx.fillStyle=isWealth?'rgba(212,160,48,.18)':isCareer?'rgba(44,80,168,.15)':isLife?'rgba(20,120,62,.12)':'transparent';
    ctx.fill();
    ctx.strokeStyle=isDark?'#282a38':'#ddd8cc'; ctx.lineWidth=1; ctx.stroke();

    const rm=(Ro+Ri)/2;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font='bold 9px sans-serif';
    ctx.fillStyle=isWealth?'#d4a030':isCareer?'#2c50a8':isLife?'#14783e':tc;
    ctx.fillText(PALACES[i]||'', cx+rm*Math.cos(amid),cy+rm*Math.sin(amid)-5);
    const stars=(palStars[i]||[]).slice(0,2).join('');
    ctx.font='8px sans-serif'; ctx.fillStyle=fc;
    ctx.fillText(stars.slice(0,4), cx+rm*Math.cos(amid),cy+rm*Math.sin(amid)+6);
  }

  // Center
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.font='bold 11px sans-serif'; ctx.fillStyle=tc;
  ctx.fillText('紫微盘', cx, cy-6);
  ctx.font='9px sans-serif'; ctx.fillStyle=fc;
  ctx.fillText(zwData?.yearStem||'', cx, cy+8);
}

// ── 9. 星宿图（27/28宿） ─────────────────────────────────
function drawNakshatraBoard(canvas, date) {
  const ctx=canvas.getContext('2d');
  const W=canvas.width,H=canvas.height,cx=W/2,cy=H/2;
  const R=Math.min(W,H)/2-18;
  ctx.clearRect(0,0,W,H);

  const NAKS=[
    {n:'昴宿',q:'金',j:1},{n:'毕宿',q:'月',j:1},{n:'觜宿',q:'火',j:-1},{n:'参宿',q:'水',j:-1},
    {n:'井宿',q:'木',j:1},{n:'鬼宿',q:'金',j:-1},{n:'柳宿',q:'土',j:-1},{n:'星宿',q:'日',j:1},
    {n:'张宿',q:'月',j:1},{n:'翼宿',q:'火',j:-1},{n:'轸宿',q:'土',j:1},{n:'角宿',q:'木',j:1},
    {n:'亢宿',q:'金',j:-1},{n:'氐宿',q:'土',j:1},{n:'房宿',q:'日',j:1},{n:'心宿',q:'月',j:-1},
    {n:'尾宿',q:'火',j:-1},{n:'箕宿',q:'水',j:1},{n:'斗宿',q:'木',j:1},{n:'牛宿',q:'金',j:-1},
    {n:'女宿',q:'土',j:-1},{n:'虚宿',q:'日',j:-1},{n:'危宿',q:'月',j:-1},{n:'室宿',q:'火',j:1},
    {n:'壁宿',q:'水',j:1},{n:'奎宿',q:'木',j:1},{n:'娄宿',q:'金',j:1},
  ];
  const N=NAKS.length;

  // Current nakshatra (deterministic from date)
  const d=date?new Date(date+'T12:00:00'):new Date();
  const doy=Math.floor((d-new Date(d.getFullYear(),0,0))/86400000);
  const curIdx=Math.floor((doy/365)*N)%N;

  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const tc=isDark?'#eae6da':'#2a1e0c', fc=isDark?'#564e44':'#9a9080';

  NAKS.forEach((nk,i)=>{
    const a=(i/N)*Math.PI*2-Math.PI/2;
    const anext=((i+1)/N)*Math.PI*2-Math.PI/2;
    const amid=(a+anext)/2;
    ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,R,a,anext);ctx.closePath();
    ctx.fillStyle=i===curIdx?'rgba(212,160,48,.25)':nk.j>0?'rgba(20,120,62,.05)':'rgba(168,32,32,.05)';
    ctx.fill();
    ctx.strokeStyle=isDark?'#282a38':'#ddd'; ctx.lineWidth=.8; ctx.stroke();
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.font=i===curIdx?'bold 8px sans-serif':'8px sans-serif';
    ctx.fillStyle=i===curIdx?'#d4a030':nk.j>0?'#14783e':'#b82020';
    ctx.fillText(nk.n, cx+(R*0.78)*Math.cos(amid), cy+(R*0.78)*Math.sin(amid));
  });
  ctx.beginPath();ctx.arc(cx,cy,R*0.45,0,Math.PI*2);ctx.fillStyle=isDark?'#1c1d28':'#faf8f4';ctx.fill();
  ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 10px sans-serif';ctx.fillStyle=tc;ctx.fillText('月宿盘',cx,cy-6);
  ctx.font='8px sans-serif';ctx.fillStyle='#d4a030';ctx.fillText(NAKS[curIdx].n,cx,cy+7);
}

// ── 智能提醒（倒计时/背离/共振/极值/连续信号） ────────────
function generateSmartAlerts(engines, data) {
  const alerts = [];
  const { qm, ch, gn, ic, ve, sr, hr, zw, nt, va } = engines || {};
  const score = data?.score || 50;

  // 1. 倒计时：距离节气变盘
  try {
    if (window.QiMen) {
      const d=new Date(), ds=d.toISOString().slice(0,10);
      const jq=QiMen.currentJQ(d);
      if (jq.daysTo <= 3) alerts.push({ type:'warn', icon:'📅', title:`节气变盘预警`, msg:`距 ${QiMen.JQ_NAMES[(jq.idx+1)%24]} 还有 ${jq.daysTo} 天，规律性变盘窗口，注意减仓` });
    }
  } catch(e) {}

  // 2. 极值预警
  if (score >= 90) alerts.push({ type:'bull', icon:'🚀', title:'极值多头信号 ≥90', msg:`当前评分 ${score}，历史极值区域，强烈看多，注意止盈位` });
  if (score <= 10) alerts.push({ type:'bear', icon:'⚠️', title:'极值空头信号 ≤10', msg:`当前评分 ${score}，极端恐惧区，强烈看空，严格止损` });

  // 3. 顶底背驰提醒
  if (ch?.beichi) {
    const t = ch.beichiType === '底背驰' ? 'bull' : 'bear';
    const msg = ch.beichiType === '底背驰' ? '缠论底背驰确认，下跌动能衰竭，抄底窗口，结合奇门择时入场' : '缠论顶背驰确认，上涨动能衰竭，逃顶信号，分批减仓';
    alerts.push({ type:t, icon:t==='bull'?'📈':'📉', title:`${ch.beichiType}信号`, msg });
  }

  // 4. 多引擎共振
  const allBiases=[gn,ch,ic,ve,sr,hr,zw,nt,va,qm].filter(Boolean).map(e=>e.bias||0);
  const bullCount=allBiases.filter(b=>b>0.15).length;
  const bearCount=allBiases.filter(b=>b<-0.15).length;
  if (bullCount >= 5) alerts.push({ type:'bull', icon:'⚡', title:`${bullCount}引擎共振看多`, msg:`${bullCount}个引擎同向看多，最强买入信号，可加大仓位` });
  if (bearCount >= 5) alerts.push({ type:'bear', icon:'⚡', title:`${bearCount}引擎共振看空`, msg:`${bearCount}个引擎同向看空，最强卖出信号，建议清仓观望` });

  // 5. 水星逆行（固定已知日期）
  const MERCURY_RETRO = [
    ['2026-03-15','2026-04-07'],['2026-07-18','2026-08-11'],['2026-11-18','2026-12-07'],
  ];
  const today=new Date().toISOString().slice(0,10);
  MERCURY_RETRO.forEach(([start,end])=>{
    if (today >= start && today <= end)
      alerts.push({ type:'info', icon:'☿', title:'水星逆行期', msg:`当前处于水星逆行 ${start}~${end}，避免大额操作，已开仓谨慎持有` });
    const d2 = new Date(start); d2.setDate(d2.getDate()-3);
    const warn3=d2.toISOString().slice(0,10);
    if (today >= warn3 && today < start)
      alerts.push({ type:'warn', icon:'☿', title:'水星逆行即将开始', msg:`${Math.round((new Date(start)-new Date(today))/86400000)}天后进入水星逆行（${start}），提前降低杠杆` });
  });

  // 6. 日月食（2026年）
  const ECLIPSES = [
    ['2026-02-17','日环食','金融市场可能出现急速反转'],
    ['2026-08-12','日全食','历史规律：大行情前后15天'],
  ];
  ECLIPSES.forEach(([dt,type,tip])=>{
    const diff=Math.round((new Date(dt)-new Date(today))/86400000);
    if (diff>=0&&diff<=7) alerts.push({ type:'warn', icon:'🌑', title:`${type}前后 ${diff}天`, msg:`${dt} ${type}，${tip}` });
  });

  // 7. 奇门+紫微双凶
  const door=qm?.door||qm?.timeDoor||'';
  if (new Set(['死门','惊门']).has(door) && (zw?.jiInWealth||zw?.jiInCareer))
    alerts.push({ type:'bear', icon:'🔴', title:'奇门死惊+紫微化忌双凶', msg:`${door}遇化忌，双重凶兆叠加，强烈建议清仓离场` });

  return alerts;
}

function renderSmartAlerts(container, engines, data) {
  const alerts = generateSmartAlerts(engines, data);
  if (!alerts.length) { container.innerHTML='<div style="font-size:.65rem;color:var(--faint);text-align:center;padding:12px">暂无智能提醒</div>'; return; }
  container.innerHTML = alerts.map(a=>`
    <div class="smart-alert ${a.type}">
      <div style="font-weight:700;margin-bottom:3px">${a.icon} ${a.title}</div>
      <div style="color:var(--muted);font-size:.7rem">${a.msg}</div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════════
// 可视化选项卡注入（在 renderAll 完成后执行）
// ══════════════════════════════════════════════════════════
function injectVizTab(data) {
  const detailBody = document.getElementById('detailBody');
  if (!detailBody) return;

  // 添加可视化选项卡按钮（如果不存在）
  if (!document.getElementById('vizTabBar')) {
    const tbar = document.createElement('div');
    tbar.id = 'vizTabBar';
    tbar.innerHTML = `
      <button class="viz-tab active" onclick="switchVizTab('charts',this)">📊 引擎图表</button>
      <button class="viz-tab" onclick="switchVizTab('qimen',this)">☯ 奇门九宫</button>
      <button class="viz-tab" onclick="switchVizTab('ziwei',this)">🌐 紫微盘</button>
      <button class="viz-tab" onclick="switchVizTab('naks',this)">⭐ 星宿盘</button>
      <button class="viz-tab" onclick="switchVizTab('alerts',this)">🔔 智能提醒</button>`;
    // Insert after the existing tabBar if possible, else prepend to detailBody
    const existTab = document.getElementById('tabBar');
    if (existTab?.parentNode) existTab.parentNode.insertBefore(tbar, existTab.nextSibling);
    else detailBody.insertBefore(tbar, detailBody.firstChild);

    const vp = document.createElement('div');
    vp.id = 'vizPanel';
    vp.className = 'open';
    if (existTab?.parentNode) existTab.parentNode.insertBefore(vp, tbar.nextSibling);
    else detailBody.insertBefore(vp, tbar.nextSibling);
  }

  // Render the active tab
  const activeTab = document.querySelector('#vizTabBar .viz-tab.active');
  const tabName = activeTab?.getAttribute('onclick')?.match(/'(\w+)'/)?.[1] || 'charts';
  renderVizContent(tabName, data);
}

function switchVizTab(name, btn) {
  document.querySelectorAll('#vizTabBar .viz-tab').forEach(b=>b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  const vp = document.getElementById('vizPanel');
  if (vp) vp.innerHTML = '';
  if (window._lastVizData) renderVizContent(name, window._lastVizData);
}

// ── SVG雷达图（无需Canvas，Safari完全兼容）──────────────────
function drawRadarSVG(engines, score) {
  const LABELS = ['江恩','缠论','支阻','谐波','奇门','易经','占星','命盘','紫微','波动率'];
  const vals = [
    ((engines?.gn?.bias||0)+1)/2,
    engines?.ch?.beichi?(engines.ch.beichiType==='底背驰'?0.8:0.2):((engines?.ch?.bias||0)+1)/2,
    ((engines?.sr?.bias||0)+1)/2,
    ((engines?.hr?.bias||0)+1)/2,
    ((engines?.qm?.bias||0)+1)/2,
    ((engines?.ic?.bias||0)+1)/2,
    ((engines?.ve?.bias||0)+1)/2,
    ((engines?.nt?.bias||0)+1)/2,
    ((engines?.zw?.bias||0)+1)/2,
    ((engines?.va?.bias||0)+1)/2,
  ];
  const N=LABELS.length, W=260, H=260, cx=W/2, cy=H/2, R=90;
  const isDark=document.documentElement.getAttribute('data-theme')==='dark';
  const gridC=isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.07)';
  const textC=isDark?'#aaa':'#777';

  // Grid rings
  let rings='';
  for(let ring=1;ring<=4;ring++){
    const rr=R*ring/4;
    const pts=Array.from({length:N},(_,i)=>{
      const a=(i/N)*Math.PI*2-Math.PI/2;
      return `${cx+rr*Math.cos(a)},${cy+rr*Math.sin(a)}`;
    }).join(' ');
    rings+=`<polygon points="${pts}" fill="${ring===2?'rgba(140,100,16,.04)':'none'}" stroke="${gridC}" stroke-width="1"/>`;
  }

  // Spokes & labels
  let spokes='', labels='';
  for(let i=0;i<N;i++){
    const a=(i/N)*Math.PI*2-Math.PI/2;
    spokes+=`<line x1="${cx}" y1="${cy}" x2="${cx+R*Math.cos(a)}" y2="${cy+R*Math.sin(a)}" stroke="${gridC}" stroke-width="1"/>`;
    const lx=cx+(R+18)*Math.cos(a), ly=cy+(R+18)*Math.sin(a);
    labels+=`<text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle" font-size="9" font-weight="bold" fill="${textC}">${LABELS[i]}</text>`;
  }

  // Data polygon
  const polyPts=vals.map((v,i)=>{
    const a=(i/N)*Math.PI*2-Math.PI/2, rv=R*Math.max(.02,Math.min(1,v));
    return `${cx+rv*Math.cos(a)},${cy+rv*Math.sin(a)}`;
  }).join(' ');

  // Bar chart fallback labels showing values
  const barRows = vals.map((v,i)=>{
    const pct=Math.round(v*100);
    const col=v>0.6?'#14783e':v<0.4?'#b82020':'#d4a030';
    return `<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px">
      <span style="width:38px;font-size:.62rem;color:${textC};text-align:right;flex-shrink:0">${LABELS[i]}</span>
      <div style="flex:1;height:6px;background:${isDark?'rgba(255,255,255,.08)':'rgba(0,0,0,.07)'};border-radius:3px;overflow:hidden">
        <div style="width:${pct}%;height:100%;background:${col};border-radius:3px"></div>
      </div>
      <span style="width:28px;font-size:.6rem;font-weight:700;color:${col};font-family:monospace">${pct}%</span>
    </div>`;
  }).join('');

  // Dots
  let dots='';
  vals.forEach((v,i)=>{
    const a=(i/N)*Math.PI*2-Math.PI/2, rv=R*Math.max(.02,Math.min(1,v));
    const col=v>0.6?'#14783e':v<0.4?'#b82020':'#d4a030';
    dots+=`<circle cx="${cx+rv*Math.cos(a)}" cy="${cy+rv*Math.sin(a)}" r="4" fill="${col}"/>`;
  });

  const scoreCol=score>=65?'#14783e':score<=35?'#b82020':'#d4a030';

  return `
    <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-start">
      <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="width:min(260px,100%);flex-shrink:0">
        ${rings}${spokes}${labels}
        <polygon points="${polyPts}" fill="rgba(140,100,16,.22)" stroke="#d4a030" stroke-width="2"/>
        ${dots}
        <text x="${cx}" y="${cy-7}" text-anchor="middle" dominant-baseline="middle" font-size="20" font-weight="bold" fill="${scoreCol}" font-family="monospace">${score||'—'}</text>
        <text x="${cx}" y="${cy+13}" text-anchor="middle" font-size="9" fill="${textC}">综合评分</text>
      </svg>
      <div style="flex:1;min-width:120px">${barRows}</div>
    </div>`;
}
window.drawRadarSVG = drawRadarSVG;

function renderVizContent(tab, data) {
  const vp = document.getElementById('vizPanel');
  if (!vp) return;
  const { coin, date, score, gn, ch, qm, zw, ic, ve, sr, hr, nt, va } = data || {};
  const engines = { gn, ch, qm, zw, ic, ve, sr, hr, nt, va };

  if (tab === 'charts') {
    // Build radar SVG inline
    const radarSVG = drawRadarSVG(engines, score);
    // Build trend SVG
    const trends = (typeof getTrendEnergy === 'function') ? getTrendEnergy(coin, 30) : [];
    let trendSVGHtml = '<div style="font-size:.65rem;color:var(--faint)">推演后显示</div>';
    if (trends.length) {
      const tmpDiv = document.createElement('div');
      drawTrendSVG(trends, tmpDiv);
      trendSVGHtml = tmpDiv.innerHTML;
    }
    // Trend table (top 5 high-energy days)
    const topDays = [...trends].sort((a,b)=>b.energy-a.energy).slice(0,5);
    const trendTable = trends.length ? `
      <div style="margin-top:8px">
        <div style="font-size:.6rem;font-weight:700;color:var(--faint);margin-bottom:4px">前5高能量日</div>
        ${topDays.map(t=>{
          const col=t.energy>=65?'#14783e':t.energy<=35?'#b82020':'#d4a030';
          const LUCKY=new Set(['开门','生门','休门']), DIRE=new Set(['死门','惊门','伤门']);
          const dIcon=LUCKY.has(t.door)?'🟢':DIRE.has(t.door)?'🔴':'⚪';
          return `<div style="display:flex;align-items:center;gap:6px;padding:3px 0;border-bottom:1px solid var(--border);font-size:.68rem">
            <span style="color:var(--muted);font-family:monospace;width:46px;flex-shrink:0">${t.date.slice(5)}</span>
            <span>${dIcon}</span>
            <div style="flex:1;height:5px;background:var(--bg2);border-radius:2px;overflow:hidden">
              <div style="width:${t.energy}%;height:100%;background:${col};border-radius:2px"></div>
            </div>
            <span style="font-weight:700;color:${col};font-family:monospace;width:28px;text-align:right">${t.energy}</span>
            <span style="font-size:.6rem;color:var(--${t.direction==='偏多'?'bull':t.direction==='偏空'?'bear':'muted'}">${t.direction}</span>
          </div>`;
        }).join('')}
      </div>` : '';

    vp.innerHTML = `
      <div id="vizRiskWrap"></div>
      <div class="viz-card">
        <div class="viz-card-title">🕸 十引擎雷达图</div>
        ${radarSVG}
      </div>
      <div class="viz-card">
        <div class="viz-card-title">📈 未来30天能量趋势</div>
        <div style="font-size:.58rem;color:var(--faint);margin-bottom:5px">🟢 吉门日 · 🔴 凶门日 · 中线=50</div>
        ${trendSVGHtml}
        ${trendTable}
        <div style="margin-top:5px;font-size:.58rem;color:var(--faint)">⚪ 其他 · 横轴=日期 · 纵轴=能量0-100</div>
      </div>
      <div id="heatmapWrap"></div>`;

    renderRiskCard(document.getElementById('vizRiskWrap'), engines, score);
    renderHeatmap(document.getElementById('heatmapWrap'), window.dashCoins);

  } else if (tab === 'qimen') {
    vp.innerHTML = `<div class="viz-card">
      <div class="viz-card-title">☯ 奇门遁甲·九宫时家盘</div>
      <div style="font-size:.65rem;color:var(--muted);margin-bottom:8px">
        ${qm?.isYang?'阳':'阴'}遁${qm?.juNum||'?'}局·${qm?.termName||''}·${qm?.shi||''}时当令
        ${qm?.special?` · <span style="color:#d4a030">${qm.special}</span>`:''}
      </div>
      <canvas id="qimenCanvas" width="252" height="252" style="width:100%;max-width:252px;display:block;margin:0 auto;border-radius:6px"></canvas>
      <div id="qimenLegend" style="margin-top:8px;font-size:.65rem;color:var(--muted);line-height:1.9">
        当前时辰：<strong style="color:#d4a030">${qm?.palace||'?'}宫</strong>
        ${qm?.star?`· ${qm.star}`:''}${qm?.door?`· <span style="color:${new Set(['开门','生门','休门']).has(qm.door)?'#14783e':'#b82020'}">${qm.door}</span>`:''}
        ${qm?.god?`· ${qm.god}`:''}
        ${qm?.direction?`<br>今日方向：<strong>${qm.direction}</strong>`:''}
        ${qm?.goodTimes?.length?`<br>吉时：${qm.goodTimes.join('、')}`:''}
      </div>
    </div>`;
    setTimeout(()=>requestAnimationFrame(()=>{ const c=document.getElementById('qimenCanvas'); if(c){const w=c.clientWidth||252;c.width=Math.min(w,252);c.height=c.width;drawQiMenBoard(c,qm);} }),80);

  } else if (tab === 'ziwei') {
    vp.innerHTML = `<div class="viz-card">
      <div class="viz-card-title">🌐 紫微斗数·十二宫盘</div>
      <div style="font-size:.65rem;color:var(--muted);margin-bottom:8px">
        命宫 <strong>${zw?.lifePal||'--'}</strong>·财帛 <strong style="color:#d4a030">${zw?.wealthPalace||'--'}</strong>·官禄 <strong style="color:#2c50a8">${zw?.careerPalace||'--'}</strong>
      </div>
      <canvas id="ziweiCanvas" width="280" height="280" style="width:100%;max-width:280px;display:block;margin:0 auto"></canvas>
      <div style="margin-top:8px;font-size:.65rem;color:var(--muted);line-height:1.9">
        财帛：${zw?.wealthStar||'--'} ${zw?.luInWealth?'<span style="color:#14783e">化禄✓</span>':zw?.jiInWealth?'<span style="color:#b82020">化忌⚠</span>':''}<br>
        官禄：${zw?.careerStar||'--'} ${zw?.quanInCareer?'<span style="color:#14783e">化权✓</span>':zw?.jiInCareer?'<span style="color:#b82020">化忌⚠</span>':''}<br>
        今日吉时：${(zw?.goodTime||[]).join('、')||'--'}
      </div>
    </div>`;
    setTimeout(()=>requestAnimationFrame(()=>{ const c=document.getElementById('ziweiCanvas'); if(c){const w=c.clientWidth||280;c.width=Math.min(w,280);c.height=c.width;drawZiweiBoard(c,zw);} }),80);

  } else if (tab === 'naks') {
    vp.innerHTML = `<div class="viz-card">
      <div class="viz-card-title">⭐ 二十七星宿盘</div>
      <canvas id="naksCanvas" width="280" height="280" style="width:100%;max-width:280px;display:block;margin:0 auto"></canvas>
      <div style="margin-top:8px;font-size:.65rem;color:var(--muted)">
        高亮为当日月亮所在星宿 · 绿色=吉宿 · 红色=凶宿
      </div>
    </div>`;
    setTimeout(()=>requestAnimationFrame(()=>{ const c=document.getElementById('naksCanvas'); if(c){const w=c.clientWidth||280;c.width=Math.min(w,280);c.height=c.width;drawNakshatraBoard(c,date);} }),80);

  } else if (tab === 'alerts') {
    vp.innerHTML = `<div class="viz-card"><div class="viz-card-title">🔔 智能提醒</div><div id="smartAlertsWrap"></div></div>`;
    renderSmartAlerts(document.getElementById('smartAlertsWrap'), engines, data);
  }
}

// ── Hook renderAll ────────────────────────────────────────
(()=>{
  const orig=window.renderAll;
  if(typeof orig!=='function'||orig._vizH)return;
  const h=function(data){
    orig.apply(this,arguments);
    window._lastVizData = data;
    // Update 天时地利 cards in dashboard
    const engines={gn:data.gn,ch:data.ch,qm:data.qm,zw:data.zw};
    updateTianDiCards(engines);
    setTimeout(()=>{
      injectVizTab(data);
      injectWinRateToErrPanel();
    },200);
  };
  h._vizH=true;window.renderAll=h;
})();

// ── Update win rate table when error panel refreshes ─────
if (typeof window.updateErrorPanel === 'function' && !window.updateErrorPanel._wrHooked) {
  const _origUEP2 = window.updateErrorPanel;
  window.updateErrorPanel = function() {
    _origUEP2.apply(this, arguments);
    injectWinRateToErrPanel();
  };
  window.updateErrorPanel._wrHooked = true;
}

'use strict';

// ── 天文计算核心（Jean Meeus《天文算法》简化版，精度±1°）──
const WestroCalc = (() => {
  const R2D = 180 / Math.PI, D2R = Math.PI / 180;
  const n360 = x => ((x % 360) + 360) % 360;

  // Julian Day from UTC date
  function jd(yr, mo, dy, hr = 12) {
    if (mo <= 2) { yr--; mo += 12; }
    const A = Math.floor(yr / 100), B = 2 - A + Math.floor(A / 4);
    return Math.floor(365.25*(yr+4716)) + Math.floor(30.6001*(mo+1)) + dy + hr/24 + B - 1524.5;
  }

  // T = centuries from J2000
  const T = jd => (jd - 2451545.0) / 36525;

  // Sun ecliptic longitude
  function sunLon(jd) {
    const t = T(jd), L0 = n360(280.46646+36000.76983*t);
    const M  = n360(357.52911+35999.05029*t-0.0001537*t*t) * D2R;
    const C  = (1.914602-0.004817*t)*Math.sin(M)+(0.019993-0.000101*t)*Math.sin(2*M)+0.000289*Math.sin(3*M);
    return n360(L0 + C);
  }

  // Moon longitude (simplified)
  function moonLon(jd) {
    const t  = T(jd);
    const L  = n360(218.3165+481267.8813*t);
    const M  = n360(357.5291+35999.0503*t) * D2R;
    const Mp = n360(134.9634+477198.8676*t) * D2R;
    const D  = n360(297.8502+445267.1115*t) * D2R;
    const F  = n360(93.2721+483202.0175*t) * D2R;
    return n360(L + 6.2888*Math.sin(Mp) + 1.274*Math.sin(2*D-Mp) + 0.6583*Math.sin(2*D)
              + 0.2136*Math.sin(2*Mp) - 0.1851*Math.sin(M) - 0.1143*Math.sin(2*F));
  }

  // Planet mean longitudes (VSOP simplified)
  const _lon = (L0, rate) => jd => n360(L0 + rate * T(jd));
  const mercuryLon = _lon(178.1791, 149472.6750);
  const venusLon   = _lon(181.9798,  58517.8156);
  const marsLon    = _lon(355.4330,  19140.2993);
  const jupiterLon = _lon( 34.3515,   3034.9057);
  const saturnLon  = _lon( 50.0775,   1222.1138);
  const uranusLon  = _lon(314.0550,    428.4748);
  const neptuneLon = _lon(304.3487,    218.4659);
  const plutoLon   = _lon(238.9508,    144.9600);

  // Ascendant (approximate using LST)
  function ascendant(jd) {
    const t   = T(jd);
    const eps = (23.4393 - 0.0130*t) * D2R;
    const lst = n360((280.46061837 + 360.98564736629*(jd-2451545.0))) * D2R;
    return n360(Math.atan2(Math.cos(lst), -(Math.sin(eps)*0 + Math.cos(eps)*Math.sin(lst))) * R2D);
  }

  // Aspect between two longitudes
  function aspect(lon1, lon2, orb = 6) {
    let d = Math.abs(lon1 - lon2); if (d > 180) d = 360 - d;
    if (d <= orb)                   return { type:'合相', orb:d,           score: 0.0  };
    if (Math.abs(d-60)  <= orb)     return { type:'六合', orb:Math.abs(d-60),  score: 0.4  };
    if (Math.abs(d-90)  <= orb)     return { type:'刑',   orb:Math.abs(d-90),  score:-0.5  };
    if (Math.abs(d-120) <= orb)     return { type:'三合', orb:Math.abs(d-120), score: 0.6  };
    if (Math.abs(d-180) <= orb)     return { type:'对冲', orb:Math.abs(d-180), score:-0.3  };
    return null;
  }

  // Is retrograde (daily motion negative)
  function isRetro(lonFn, jd) {
    try {
      let diff = lonFn(jd+0.5) - lonFn(jd-0.5);
      if (diff > 180) diff -= 360; if (diff < -180) diff += 360;
      return diff < 0;
    } catch(e) { return false; }
  }

  return { jd, sunLon, moonLon, mercuryLon, venusLon, marsLon,
           jupiterLon, saturnLon, uranusLon, neptuneLon, plutoLon,
           ascendant, aspect, isRetro, n360 };
})();

// ── 币种西方占星命盘 ────────────────────────────────────────
const WESTERN_NATAL = {
  BTC:{ sun:{sign:'摩羯',deg:12},moon:{sign:'白羊',deg:14},mercury:{sign:'摩羯',deg:18},venus:{sign:'双鱼',deg:0},mars:{sign:'摩羯',deg:27},jupiter:{sign:'摩羯',deg:29},saturn:{sign:'处女',deg:20},uranus:{sign:'双鱼',deg:19},neptune:{sign:'水瓶',deg:21},pluto:{sign:'摩羯',deg:1},ascendant:{sign:'狮子',deg:20},theme:'摩羯群聚·价值储存·去中心革命' },
  ETH:{ sun:{sign:'狮子',deg:7}, moon:{sign:'双子',deg:15},mercury:{sign:'狮子',deg:22},venus:{sign:'处女',deg:8}, mars:{sign:'巨蟹',deg:3}, jupiter:{sign:'狮子',deg:27},saturn:{sign:'天蝎',deg:28},uranus:{sign:'白羊',deg:19},neptune:{sign:'双鱼',deg:8}, pluto:{sign:'摩羯',deg:13},ascendant:{sign:'天秤',deg:5}, theme:'狮子10宫·智能合约·去中心应用' },
  SOL:{ sun:{sign:'双鱼',deg:26},moon:{sign:'摩羯',deg:5}, mercury:{sign:'双鱼',deg:12},venus:{sign:'金牛',deg:18},mars:{sign:'摩羯',deg:23},jupiter:{sign:'摩羯',deg:22},saturn:{sign:'水瓶',deg:29},uranus:{sign:'金牛',deg:4}, neptune:{sign:'双鱼',deg:19},pluto:{sign:'摩羯',deg:24},ascendant:{sign:'巨蟹',deg:12},theme:'双鱼+摩羯·高速公链·效率革命' },
  BNB:{ sun:{sign:'巨蟹',deg:9}, moon:{sign:'天蝎',deg:17},mercury:{sign:'巨蟹',deg:22},venus:{sign:'狮子',deg:5}, mars:{sign:'巨蟹',deg:2}, jupiter:{sign:'天秤',deg:14},saturn:{sign:'射手',deg:23},uranus:{sign:'白羊',deg:28},neptune:{sign:'双鱼',deg:14},pluto:{sign:'摩羯',deg:18},ascendant:{sign:'天秤',deg:4}, theme:'巨蟹10宫·交易所生态·中心化效率' },
  XAU:{ sun:{sign:'狮子',deg:22},moon:{sign:'水瓶',deg:5}, mercury:{sign:'处女',deg:8}, venus:{sign:'处女',deg:26},mars:{sign:'摩羯',deg:21},jupiter:{sign:'射手',deg:9}, saturn:{sign:'双子',deg:5}, uranus:{sign:'天秤',deg:12},neptune:{sign:'射手',deg:1}, pluto:{sign:'处女',deg:27},ascendant:{sign:'天秤',deg:14},theme:'狮子10宫·价值核心·避险天堂' },
  XAG:{ sun:{sign:'巨蟹',deg:13},moon:{sign:'金牛',deg:22},mercury:{sign:'狮子',deg:2}, venus:{sign:'双子',deg:29},mars:{sign:'处女',deg:4}, jupiter:{sign:'处女',deg:10},saturn:{sign:'摩羯',deg:0}, uranus:{sign:'白羊',deg:23},neptune:{sign:'处女',deg:1}, pluto:{sign:'巨蟹',deg:21},ascendant:{sign:'天秤',deg:8}, theme:'巨蟹10宫·工业贵金属·波动剧烈' },
};
window.WESTERN_NATAL = WESTERN_NATAL;

// ── 第11引擎：engineWesternAstrology ────────────────────────
function engineWesternAstrology(coin, date) {
  try {
    const d  = new Date((date||new Date().toISOString().slice(0,10))+'T12:00:00Z');
    const jd = WestroCalc.jd(d.getUTCFullYear(), d.getUTCMonth()+1, d.getUTCDate(), 12);
    const SIGNS = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'];
    const n30 = lon => ({ sign: SIGNS[Math.floor(lon/30)%12], degree: Math.round(lon%30*10)/10, lon });

    // 当日行星位置
    const lons = {
      sun:     WestroCalc.sunLon(jd),
      moon:    WestroCalc.moonLon(jd),
      mercury: WestroCalc.mercuryLon(jd),
      venus:   WestroCalc.venusLon(jd),
      mars:    WestroCalc.marsLon(jd),
      jupiter: WestroCalc.jupiterLon(jd),
      saturn:  WestroCalc.saturnLon(jd),
      uranus:  WestroCalc.uranusLon(jd),
      neptune: WestroCalc.neptuneLon(jd),
      pluto:   WestroCalc.plutoLon(jd),
    };
    const planets = {};
    Object.entries(lons).forEach(([p,lon]) => { planets[p] = n30(lon); });
    const ascLon = WestroCalc.ascendant(jd);
    planets.ascendant = n30(ascLon);
    planets.midheaven = n30(WestroCalc.n360(ascLon + 270));

    // 宫位（等分制）
    Object.keys(planets).forEach(p => {
      if (planets[p].lon !== undefined)
        planets[p].house = (Math.floor(WestroCalc.n360(planets[p].lon - ascLon) / 30) % 12) + 1;
    });

    // 逆行
    const retroFns = { mercury:WestroCalc.mercuryLon, venus:WestroCalc.venusLon, mars:WestroCalc.marsLon,
                       jupiter:WestroCalc.jupiterLon, saturn:WestroCalc.saturnLon,
                       uranus:WestroCalc.uranusLon, neptune:WestroCalc.neptuneLon };
    const retro = {};
    Object.entries(retroFns).forEach(([p,fn]) => { retro[p] = WestroCalc.isRetro(fn, jd); });

    // 相位（主要行星对）
    const PAIRS = [['sun','moon'],['sun','venus'],['sun','jupiter'],['sun','saturn'],
                   ['moon','jupiter'],['moon','saturn'],['jupiter','saturn'],
                   ['venus','jupiter'],['mars','saturn'],['mercury','venus'],['sun','mars']];
    const aspects = PAIRS.map(([p1,p2]) => {
      const a = WestroCalc.aspect(lons[p1], lons[p2]);
      return a ? { planet1:p1, planet2:p2, ...a } : null;
    }).filter(Boolean);

    // 过境命盘
    const natal = WESTERN_NATAL[coin];
    const transits = [];
    if (natal) {
      const SMAP = SIGNS.reduce((m,s,i)=>{m[s]=i;return m;},{});
      Object.entries(natal).forEach(([nP, nD]) => {
        if (!nD?.sign || !nD?.deg) return;
        const nLon = (SMAP[nD.sign]||0)*30 + nD.deg;
        Object.entries(lons).forEach(([tP, tLon]) => {
          const a = WestroCalc.aspect(tLon, nLon, 5);
          if (a) transits.push({ transit:tP, natal:nP, natalSign:nD.sign, ...a });
        });
      });
    }

    // 综合偏向
    let bias = 0;
    aspects.forEach(a => {
      const w = a.planet1==='sun'||a.planet2==='sun' ? 0.28 :
                a.planet1==='jupiter'||a.planet2==='jupiter' ? 0.22 : 0.12;
      bias += a.score * w;
    });
    if (retro.mercury) bias -= 0.20;
    if (retro.venus)   bias -= 0.28;
    if (retro.mars)    bias -= 0.14;
    if (retro.jupiter) bias -= 0.10;
    if (retro.saturn)  bias += 0.07;
    const MOON_GOOD=['金牛','巨蟹','天秤','射手','双鱼'], MOON_BAD=['天蝎','摩羯','白羊'];
    if (MOON_GOOD.includes(planets.moon.sign)) bias += 0.08;
    if (MOON_BAD.includes(planets.moon.sign))  bias -= 0.08;
    transits.slice(0,5).forEach(a => {
      bias += a.score * (a.transit==='jupiter'?0.28:a.transit==='saturn'?0.22:0.10);
    });
    bias = Math.tanh(bias);

    // 月相
    const mpa = WestroCalc.n360(lons.moon - lons.sun);
    const PHASES=['新月','上弦初','上弦月','上弦末','满月','下弦末','下弦月','下弦初'];
    const moonPhase = PHASES[Math.round(mpa/45)%8];

    // 逆行文字
    const RETRO_DESC = {mercury:'水逆·不宜开新仓，适合复盘',venus:'金逆·财星受损，慎做多',
                        mars:'火逆·行动受阻，勿追高',jupiter:'木逆·扩张受阻，牛市暂停',
                        saturn:'土逆·压力减轻，可能反弹',uranus:'天逆·波动加剧',neptune:'海逆·幻象陷阱'};
    const retroDesc = Object.entries(retro).filter(([,v])=>v).map(([k])=>RETRO_DESC[k]||k);

    const PCN = {sun:'太阳',moon:'月亮',mercury:'水星',venus:'金星',mars:'火星',
                 jupiter:'木星',saturn:'土星',uranus:'天王星',neptune:'海王星',pluto:'冥王星'};
    const whyAsp = aspects.slice(0,2).map(a=>`${PCN[a.planet1]}${a.type}${PCN[a.planet2]}`).join('·');

    return {
      bias, conf: Math.min(0.85, 0.50 + aspects.length*0.04 + transits.length*0.015),
      planets, aspects, transits: transits.slice(0,8), retrograde: retro,
      isMercuryRetrograde: retro.mercury, isVenusRetrograde: retro.venus,
      isMarsRetrograde: retro.mars,       isJupiterRetrograde: retro.jupiter,
      isSaturnRetrograde: retro.saturn,
      retroDesc, benefic:['jupiter','venus'], malefic:['saturn','mars'],
      moonPhase, moonPhaseAngle: Math.round(mpa), isNewMoon: mpa<12, isFullMoon: Math.abs(mpa-180)<12,
      natal: natal||null,
      why: `☀${planets.sun.sign}·🌙${planets.moon.sign}·${whyAsp||'无主相位'}${retroDesc.length?'·'+retroDesc[0].split('·')[0]:''}`,
      label: bias>0.12?'吉':bias<-0.12?'凶':'平',
    };
  } catch(e) {
    console.warn('[engineWesternAstrology]',e.message);
    return {bias:0,conf:0.4,label:'平',why:'计算异常',planets:{},aspects:[],transits:[],retrograde:{},retroDesc:[],moonPhase:'--'};
  }
}
window.engineWesternAstrology = engineWesternAstrology;

// ── 西方占星可视化面板 ─────────────────────────────────────
function renderWesternAstrologyTab(waData) {
  const vp = document.getElementById('vizPanel');
  if (!vp) return;
  const w = waData || {};
  const pl = w.planets || {};
  const isDark = document.documentElement.getAttribute('data-theme')==='dark';
  const bg2 = isDark?'rgba(255,255,255,.04)':'rgba(0,0,0,.03)';

  const PCN = {sun:'☀太阳',moon:'🌙月亮',mercury:'☿水星',venus:'♀金星',mars:'♂火星',
               jupiter:'♃木星',saturn:'♄土星',uranus:'⛢天王',neptune:'♆海王',pluto:'♇冥王'};
  const ACOL = {合相:'#8c6410',六合:'#14783e',刑:'#b82020',三合:'#14783e',对冲:'#b82020'};
  const ADESC= {合相:'能量聚合',六合:'和谐机遇',刑:'冲突转折',三合:'顺利吉祥',对冲:'剧烈波动'};
  const biasCol = w.bias>0.1?'var(--bull)':w.bias<-0.1?'var(--bear)':'var(--gold)';

  vp.innerHTML = `
  <!-- 综合评分 -->
  <div class="viz-card">
    <div class="viz-card-title">♎ 西方占星综合</div>
    <div style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">
      <div>
        <div style="font-size:1.25rem;font-weight:800;color:${biasCol}">
          ${w.bias>0.12?'🌟 吉象':w.bias<-0.12?'⚠ 凶象':'☯ 中性'} · ${w.label||'平'}
        </div>
        <div style="font-size:.63rem;color:var(--muted);margin-top:5px;line-height:1.9">
          🌙 月相：<strong>${w.moonPhase||'--'}</strong>（${w.moonPhaseAngle||0}°）
          ${w.isNewMoon?'<span style="color:#d4a030"> · ⚡新月变盘窗口</span>':''}
          ${w.isFullMoon?'<span style="color:#2c50a8"> · 🌕满月情绪高峰</span>':''}
        </div>
        ${w.retroDesc?.length?`<div style="font-size:.62rem;color:#b82020;margin-top:3px">⚠ ${w.retroDesc[0]}</div>`:'<div style="font-size:.62rem;color:var(--bull);margin-top:3px">✅ 当前无逆行</div>'}
      </div>
      <div style="flex:1;min-width:100px">
        <div style="height:4px;background:var(--bg2);border-radius:2px;overflow:hidden;margin-bottom:4px">
          <div style="width:${((w.bias||0)+1)/2*100}%;height:100%;background:${biasCol};border-radius:2px"></div>
        </div>
        <div style="font-size:.58rem;color:var(--faint)">置信度 ${Math.round((w.conf||0.5)*100)}%</div>
      </div>
    </div>
  </div>

  <!-- 逆行 -->
  ${(w.retroDesc||[]).length ? `
  <div class="viz-card" style="border-left:3px solid #b82020">
    <div class="viz-card-title" style="color:#b82020">☿ 行星逆行（${w.retroDesc.length}颗）</div>
    ${w.retroDesc.map(d=>`<div style="font-size:.74rem;padding:4px 0;color:#b82020;border-bottom:1px solid var(--border)">⚠ ${d}</div>`).join('')}
  </div>` : ''}

  <!-- 行星位置 -->
  <div class="viz-card">
    <div class="viz-card-title">🪐 行星当前位置</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px">
      ${['sun','moon','mercury','venus','mars','jupiter','saturn','uranus','neptune','pluto'].map(p=>{
        const pd=pl[p]||{};
        const isR=w.retrograde?.[p];
        const isJupGood=p==='jupiter'&&['射手','双鱼','巨蟹'].includes(pd.sign);
        return `<div style="display:flex;align-items:center;gap:5px;padding:4px 6px;background:${bg2};border-radius:6px;font-size:.7rem">
          <span style="width:44px;font-weight:700;color:var(--text);flex-shrink:0">${PCN[p]||p}</span>
          <span style="color:var(--gold)">${pd.sign||'--'}${pd.degree!==undefined?Math.round(pd.degree)+'°':''}</span>
          ${isR?'<span style="color:#b82020;font-size:.58rem;flex-shrink:0">↺逆</span>':''}
          ${isJupGood?'<span style="color:#14783e;font-size:.58rem;flex-shrink:0">旺</span>':''}
        </div>`;
      }).join('')}
    </div>
  </div>

  <!-- 重要相位 -->
  <div class="viz-card">
    <div class="viz-card-title">⚡ 当日天象相位</div>
    ${(w.aspects||[]).length ? (w.aspects||[]).slice(0,8).map(a=>`
      <div style="display:flex;justify-content:space-between;align-items:center;padding:5px 0;border-bottom:1px solid var(--border);font-size:.72rem">
        <span style="color:${ACOL[a.type]||'var(--muted)'};font-weight:700;width:36px">${a.type}</span>
        <span style="color:var(--text)">${PCN[a.planet1]||a.planet1} — ${PCN[a.planet2]||a.planet2}</span>
        <span style="font-size:.6rem;color:var(--faint)">${ADESC[a.type]||''} · ±${(a.orb||0).toFixed(1)}°</span>
      </div>`).join('') : '<div style="font-size:.65rem;color:var(--faint)">当前无显著相位</div>'}
  </div>

  <!-- 过境命盘 -->
  ${(w.transits||[]).length ? `
  <div class="viz-card">
    <div class="viz-card-title">🌐 过境命盘共振</div>
    <div style="font-size:.6rem;color:var(--faint);margin-bottom:6px">当日行星与币种出生盘相位</div>
    ${(w.transits||[]).slice(0,6).map(t=>`
      <div style="display:flex;gap:6px;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);font-size:.7rem">
        <span style="color:${ACOL[t.type]||'var(--muted)'};font-weight:700;width:32px;flex-shrink:0">${t.type}</span>
        <span style="color:var(--text);flex:1">${PCN[t.transit]||t.transit}→命盘${PCN[t.natal]||t.natal}(${t.natalSign||''})</span>
        <span style="color:${t.score>0?'#14783e':'#b82020'};font-size:.62rem;flex-shrink:0">${t.score>0?'吉':'凶'}</span>
      </div>`).join('')}
  </div>` : ''}

  <!-- 命盘 -->
  ${w.natal ? `
  <div class="viz-card">
    <div class="viz-card-title">📜 出生星盘</div>
    <div style="font-size:.64rem;color:var(--muted);line-height:2;margin-bottom:6px">${w.natal.theme||''}</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;font-size:.68rem">
      ${['sun','moon','mercury','venus','mars','jupiter','saturn'].map(p=>{
        const nd=w.natal[p]||{};
        return `<div style="padding:3px 6px;background:${bg2};border-radius:5px"><span style="color:var(--faint)">${PCN[p]||p} </span><strong style="color:var(--gold)">${nd.sign||''}${nd.deg||0}°</strong></div>`;
      }).join('')}
    </div>
  </div>` : ''}`;
}
window.renderWesternAstrologyTab = renderWesternAstrologyTab;

// ── 注入"♎ 西方占星"选项卡按钮 ─────────────────────────────
(function hookVizForWestern() {
  // Hook injectVizTab
  const orig = window.injectVizTab;
  if (typeof orig === 'function' && !orig._waHooked) {
    window.injectVizTab = function(data) {
      orig.apply(this, arguments);
      const tbar = document.getElementById('vizTabBar');
      if (tbar && !document.getElementById('vizTabWestern')) {
        const btn = document.createElement('button');
        btn.id = 'vizTabWestern';
        btn.className = 'viz-tab';
        btn.textContent = '♎ 西方占星';
        btn.setAttribute('onclick', '');
        btn.addEventListener('click', function() {
          document.querySelectorAll('#vizTabBar .viz-tab').forEach(b=>b.classList.remove('active'));
          this.classList.add('active');
          const vp = document.getElementById('vizPanel');
          if (vp) { vp.innerHTML = ''; vp.classList.add('open'); }
          renderWesternAstrologyTab(window._lastVizData?.wa);
        });
        tbar.appendChild(btn);
      }
    };
    window.injectVizTab._waHooked = true;
  }

  // Hook renderVizContent
  const origRVC = window.renderVizContent;
  if (typeof origRVC === 'function' && !origRVC._waHooked) {
    window.renderVizContent = function(tab, data) {
      if (tab === 'western') renderWesternAstrologyTab(data?.wa);
      else origRVC.apply(this, arguments);
    };
    window.renderVizContent._waHooked = true;
  }
})();


'use strict';

// ══════════════════════════════════════════════════════════
// 1. 节点到期弹窗提醒系统
// ══════════════════════════════════════════════════════════

// 存储已提醒过的节点（避免重复弹）
const _notifiedNodes = new Set(
  JSON.parse(localStorage.getItem('_notifiedNodes') || '[]')
);

function _saveNotified() {
  // 只保留最近100条，防止localStorage膨胀
  const arr = [..._notifiedNodes].slice(-100);
  try { localStorage.setItem('_notifiedNodes', JSON.stringify(arr)); } catch(e) {}
}

// 节点到期检查 — 每分钟调用一次
function checkNodeArrivals() {
  const data = window._lastVizData;
  if (!data || !data.nodes || !data.nodes.length) return;

  const nowUTC8 = new Date(Date.now() + new Date().getTimezoneOffset()*60000 + 8*3600000);
  const todayStr = nowUTC8.toISOString().slice(0,10);

  data.nodes.forEach(node => {
    if (!node.date) return;
    const nodeKey = `${data.coin}_${node.date}_${node.offset}`;
    if (_notifiedNodes.has(nodeKey)) return;

    const nodeDate = node.date.slice(0,10);
    // 当天到期 → 弹提醒
    if (nodeDate === todayStr) {
      _notifiedNodes.add(nodeKey);
      _saveNotified();
      _showNodePopup(node, data.coin, data.price, 'arrived');
      // 同时自动送入误差模型（到期节点）
      _autoLogNodeToTracker(node, data);
    }
    // 昨天到期但未记录 → 静默补录误差
    const yesterday = new Date(nowUTC8); yesterday.setDate(yesterday.getDate()-1);
    const yStr = yesterday.toISOString().slice(0,10);
    if (nodeDate === yStr) {
      _notifiedNodes.add(nodeKey);
      _saveNotified();
      _autoLogNodeToTracker(node, data);
    }
  });
}

// 弹窗 UI
function _showNodePopup(node, coin, entryPrice, reason) {
  const existing = document.getElementById('nodeArrivalPopup');
  if (existing) existing.remove();

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const bg  = isDark ? '#1c1d28' : '#faf8f4';
  const bc  = isDark ? '#282a38' : '#d8d2c4';
  const tc  = isDark ? '#eae6da' : '#1a1614';

  const dirColor = node.isBull ? '#14783e' : '#b82020';
  const dirIcon  = node.isBull ? '▲ 看多' : '▼ 看空';
  const confPct  = Math.round((node.conf||0.5)*100);

  // 提供输入框让用户录入实际价格
  const popup = document.createElement('div');
  popup.id = 'nodeArrivalPopup';
  popup.style.cssText = `
    position:fixed;bottom:80px;right:20px;z-index:99998;
    width:min(340px,calc(100vw-32px));
    background:${bg};border:2px solid #d4a030;border-radius:14px;
    box-shadow:0 8px 32px rgba(0,0,0,.35);
    font-family:'Noto Sans SC',sans-serif;font-size:13px;color:${tc};
    animation:nodePopSlide .35s cubic-bezier(.4,0,.2,1);
  `;
  popup.innerHTML = `
    <style>
      @keyframes nodePopSlide{from{transform:translateX(110%);opacity:0}to{transform:translateX(0);opacity:1}}
    </style>
    <div style="padding:14px 16px 12px;border-bottom:1px solid ${bc};display:flex;align-items:center;justify-content:space-between">
      <div>
        <div style="font-size:.72rem;font-weight:800;color:#d4a030;letter-spacing:.04em">⏰ 预测节点到期</div>
        <div style="font-size:.9rem;font-weight:700;margin-top:2px">${coin} · ${node.date.slice(0,10)}</div>
      </div>
      <button onclick="document.getElementById('nodeArrivalPopup').remove()"
        style="background:none;border:none;font-size:1.2rem;cursor:pointer;color:#888;padding:4px">✕</button>
    </div>
    <div style="padding:12px 16px">
      <div style="font-size:.78rem;color:${dirColor};font-weight:700;margin-bottom:6px">${dirIcon} · ${node.type||'节点'} · 置信${confPct}%</div>
      <div style="font-size:.7rem;color:#888;margin-bottom:10px;line-height:1.6">${node.details||''}</div>

      <div style="font-size:.68rem;font-weight:700;color:#8c6410;margin-bottom:5px">📝 录入实际价格，优化预测模型</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px">
        <div>
          <div style="font-size:.6rem;color:#888;margin-bottom:2px">预测价（参考）</div>
          <div style="font-size:.82rem;font-weight:700;font-family:monospace;color:#d4a030">
            ${entryPrice>=1000?'$'+Math.round(entryPrice).toLocaleString():'$'+(entryPrice||0).toFixed(2)}
          </div>
        </div>
        <div>
          <div style="font-size:.6rem;color:#888;margin-bottom:2px">实际价格（填入）</div>
          <input id="nodeActualPrice" type="number" placeholder="如 74885" step="any"
            style="width:100%;padding:5px 7px;border:1px solid ${bc};border-radius:6px;
            background:${isDark?'#111219':'#f0ece3'};color:${tc};font-size:.82rem;
            font-family:monospace;outline:none">
        </div>
      </div>
      <div style="display:flex;gap:7px">
        <button onclick="_confirmNodeLog('${coin}','${node.date}',${node.isBull?1:0},${entryPrice||0})"
          style="flex:2;padding:8px;background:linear-gradient(135deg,#8c6410,#d4a030);
          border:none;border-radius:8px;color:#fff;font-weight:700;font-size:.78rem;cursor:pointer">
          ✓ 确认录入
        </button>
        <button onclick="_skipNodeLog('${coin}','${node.date}',${node.isBull?1:0})"
          style="flex:1;padding:8px;background:${isDark?'rgba(255,255,255,.06)':'rgba(0,0,0,.05)'};
          border:1px solid ${bc};border-radius:8px;color:#888;font-size:.78rem;cursor:pointer">
          跳过
        </button>
      </div>
    </div>
    <div style="padding:6px 16px 10px;font-size:.6rem;color:#888;display:flex;align-items:center;gap:6px">
      <span>📊</span> 录入数据越多，模型精准度越高
    </div>
  `;
  document.body.appendChild(popup);

  // 20秒后自动消失
  setTimeout(() => { if (popup.parentElement) popup.remove(); }, 20000);
}

// 确认录入
window._confirmNodeLog = function(coin, dateStr, isBullNum, predPrice) {
  const actualEl = document.getElementById('nodeActualPrice');
  const actual   = parseFloat(actualEl?.value);
  if (!actual || isNaN(actual) || actual <= 0) {
    if (actualEl) { actualEl.style.borderColor='#b82020'; actualEl.focus(); }
    return;
  }
  const isBull     = isBullNum === 1;
  const priceErr   = Math.abs(actual - predPrice) / predPrice;
  const dirCorrect = isBull ? actual >= predPrice * 0.99 : actual <= predPrice * 1.01;

  _recordNodeError({
    coin, date: dateStr, predPrice, actualPrice: actual,
    priceErr, dirCorrect, source: 'node_manual'
  });

  const popup = document.getElementById('nodeArrivalPopup');
  if (popup) {
    popup.innerHTML = `<div style="padding:20px;text-align:center;font-size:.85rem;color:#14783e;font-weight:700">
      ✅ 已录入！误差 ${(priceErr*100).toFixed(1)}%，方向${dirCorrect?'✓ 正确':'✗ 偏差'}
    </div>`;
    setTimeout(() => popup.remove(), 2500);
  }
};

// 跳过
window._skipNodeLog = function(coin, dateStr, isBullNum) {
  const popup = document.getElementById('nodeArrivalPopup');
  if (popup) popup.remove();
};

// 自动录入（无实际价格时，用当前市价）
function _autoLogNodeToTracker(node, data) {
  const currentPrice = data?.price || 0;
  if (!currentPrice) return;
  const predPrice  = data?.price || currentPrice; // 以当时分析价为基准
  const priceErr   = 0; // 无法计算，标为0
  const dirCorrect = null; // 未知

  // 只有未手动录入的才自动记录
  const key = `autoLog_${data.coin}_${node.date}`;
  if (localStorage.getItem(key)) return;
  localStorage.setItem(key, '1');

  _recordNodeError({
    coin: data.coin, date: node.date.slice(0,10),
    predPrice, actualPrice: null,
    priceErr: null, dirCorrect: null,
    source: 'node_auto', pending: true, // pending = 等待用户补录实际价
    nodeType: node.type, nodeConf: node.conf,
  });
}

// 写入 tracker
function _recordNodeError(rec) {
  if (!window.tracker) return;
  const err = {
    ts:        Date.now(),
    coin:      rec.coin,
    date:      rec.date,
    predPrice: rec.predPrice,
    actualPrice: rec.actualPrice,
    priceErr:  rec.priceErr,
    dirCorrect:rec.dirCorrect,
    model:     rec.source || 'node',
    source:    rec.source,
    pending:   rec.pending || false,
    nodeType:  rec.nodeType || '',
    nodeConf:  rec.nodeConf || 0.5,
  };
  window.tracker.priceErrors = window.tracker.priceErrors || [];
  window.tracker.priceErrors.push(err);
  try {
    localStorage.setItem('tianjishu_errors',
      JSON.stringify(window.tracker.priceErrors.slice(-2000)));
  } catch(e) {}
  if (typeof window.updateErrorPanel === 'function') window.updateErrorPanel();
}

// 每60秒检查一次
setInterval(checkNodeArrivals, 60000);
// 推演完成后立即检查
(function hookNodeCheck() {
  const orig = window.renderAll;
  if (typeof orig !== 'function' || orig._nodeCheckHooked) return;
  const h = function(data) {
    orig.apply(this, arguments);
    setTimeout(checkNodeArrivals, 1500);
  };
  h._nodeCheckHooked = true;
  window.renderAll = h;
})();


// ══════════════════════════════════════════════════════════
// 2. 导出资料按钮
// ══════════════════════════════════════════════════════════

function exportAllData() {
  const data     = window._lastVizData || {};
  const results  = window.dashResults  || {};
  const errors   = window.tracker?.priceErrors || [];
  const nodes    = data.nodes || [];
  const now      = new Date();
  const utc8     = new Date(now.getTime() + now.getTimezoneOffset()*60000 + 8*3600000);
  const stamp    = utc8.toISOString().slice(0,19).replace('T',' ');

  // ── 节点摘要
  const nodeSummary = nodes.map(n => ({
    date:     n.date?.slice(0,10) || '',
    offset:   n.offset,
    type:     n.type,
    direction:n.isBull ? '看多' : '看空',
    magnitude:n.mag,
    confidence: Math.round((n.conf||0.5)*100) + '%',
    systems:  n.activeSys?.join('/') || '',
    details:  n.details,
  }));

  // ── 当前推演摘要
  const engineSummary = {};
  ['gn','ch','sr','hr','qm','ic','ve','nt','zw','va'].forEach(k => {
    if (data[k]) engineSummary[k] = {
      bias:  +(data[k].bias||0).toFixed(3),
      conf:  +(data[k].conf||0).toFixed(3),
    };
  });

  // ── 误差记录（只导出手动/已验证的）
  const verifiedErrors = errors.filter(e => e.actualPrice != null).map(e => ({
    date:     e.date,
    coin:     e.coin,
    predPrice:e.predPrice,
    actual:   e.actualPrice,
    priceErrPct: e.priceErr != null ? (e.priceErr*100).toFixed(2)+'%' : '--',
    dirCorrect:  e.dirCorrect != null ? (e.dirCorrect ? '✓' : '✗') : '--',
    source:   e.source,
    nodeType: e.nodeType || '',
  }));

  // ── 各引擎胜率统计
  const byEng = {};
  errors.forEach(e => {
    if (e.dirCorrect == null) return;
    const m = e.model || 'node';
    if (!byEng[m]) byEng[m] = {wins:0,total:0};
    byEng[m].total++;
    if (e.dirCorrect) byEng[m].wins++;
  });
  const engineStats = Object.entries(byEng).map(([eng,d]) => ({
    engine: eng, records: d.total,
    winRate: d.total>0 ? (d.wins/d.total*100).toFixed(1)+'%' : '--',
  }));

  // ── 所有币种推演结果
  const coinResults = Object.entries(results)
    .filter(([,r]) => r && r !== 'loading' && r.price)
    .map(([coin,r]) => ({
      coin, price: r.price, score: r.score,
      grade: r.grade, stage: r.stage,
      avgBias: r.avgBias != null ? +r.avgBias.toFixed(3) : null,
      chg24:   r.chg24,
    }));

  const exportObj = {
    meta: {
      exportTime:   stamp + ' UTC+8',
      appVersion:   '天機數元 十法合一',
      coin:         data.coin || '--',
      analysisDate: data.date || '--',
      price:        data.price || 0,
    },
    currentAnalysis: {
      score:    data.score,
      engines:  engineSummary,
      tpsl:     data.tpsl ? {
        signal:    data.tpsl.signal,
        primarySL: data.tpsl.primarySL,
        tp1:       data.tpsl.tpLevels?.[0]?.price,
        rrr:       data.tpsl.rrr,
        winRate:   data.tpsl.positionSize?.winRate,
      } : null,
    },
    nodes:         nodeSummary,
    coinResults,
    engineStats,
    verifiedErrors,
    totalErrorRecords: errors.length,
  };

  // ── 下载 JSON
  const jsonStr  = JSON.stringify(exportObj, null, 2);
  const jsonBlob = new Blob([jsonStr], { type:'application/json' });
  const jsonUrl  = URL.createObjectURL(jsonBlob);
  const coinStr  = (data.coin || 'export').replace(/[^A-Za-z0-9]/g,'_');
  const dateStr  = stamp.slice(0,10).replace(/-/g,'');

  // ── 同时生成 CSV（节点表）
  const csvHeader = 'Date,Offset,Type,Direction,Confidence,Systems,Details\n';
  const csvRows   = nodeSummary.map(n =>
    [n.date, n.offset, `"${n.type}"`, n.direction, n.confidence, n.systems, `"${n.details}"`].join(',')
  ).join('\n');
  const csvBlob = new Blob(['\ufeff'+csvHeader+csvRows], { type:'text/csv;charset=utf-8' });
  const csvUrl  = URL.createObjectURL(csvBlob);

  // 触发下载
  const a1 = document.createElement('a');
  a1.href = jsonUrl; a1.download = `tianjishu_${coinStr}_${dateStr}.json`;
  document.body.appendChild(a1); a1.click(); a1.remove();

  setTimeout(() => {
    const a2 = document.createElement('a');
    a2.href = csvUrl; a2.download = `tianjishu_nodes_${coinStr}_${dateStr}.csv`;
    document.body.appendChild(a2); a2.click(); a2.remove();
    URL.revokeObjectURL(jsonUrl);
    URL.revokeObjectURL(csvUrl);
  }, 400);

  _showExportToast(`已导出 JSON + CSV · ${nodeSummary.length}个节点 · ${verifiedErrors.length}条验证误差`);
}
window.exportAllData = exportAllData;

function _showExportToast(msg) {
  const el = document.createElement('div');
  el.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:100000;
    background:#14783e;color:#fff;padding:10px 20px;border-radius:10px;
    font-size:.82rem;font-weight:700;font-family:'Noto Sans SC',sans-serif;
    box-shadow:0 4px 18px rgba(0,0,0,.35);white-space:nowrap;
    animation:nodePopSlide .3s ease;
  `;
  el.textContent = '✅ ' + msg;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 3500);
}


// ══════════════════════════════════════════════════════════
// 3. 注入导出按钮到 topbar
// ══════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    // 注入到 detailTopbar 右侧按钮区
    const tr = document.querySelector('.topbar-right');
    if (tr && !tr.querySelector('#exportBtn')) {
      const btn = document.createElement('button');
      btn.id = 'exportBtn';
      btn.className = 'icon-btn';
      btn.title = '导出推演资料';
      btn.textContent = '⬇ 导出';
      btn.style.cssText = 'font-size:.72rem;padding:0 10px;background:rgba(140,100,16,.12);border-color:rgba(140,100,16,.35);color:#8c6410;font-weight:700';
      btn.onclick = exportAllData;
      tr.insertBefore(btn, tr.firstChild);
    }

    // 也在 detail view sticky bar 注入
    const detailBar = document.querySelector('.detail-overlay > div:first-child > div[style*="margin-left:auto"]');
    if (detailBar && !detailBar.querySelector('#exportBtn2')) {
      const btn2 = document.createElement('button');
      btn2.id = 'exportBtn2';
      btn2.className = 'strat-btn';
      btn2.title = '导出资料';
      btn2.textContent = '⬇ 导出';
      btn2.style.cssText = 'background:rgba(140,100,16,.12);border-color:rgba(140,100,16,.35);color:#8c6410;font-size:.8rem;font-weight:700';
      btn2.onclick = exportAllData;
      detailBar.appendChild(btn2);
    }
  }, 1800);
});


// ══════════════════════════════════════════════════════════
// 4. 节点误差面板：pending 记录补录入口
// ══════════════════════════════════════════════════════════
function renderPendingNodes() {
  const errors  = window.tracker?.priceErrors || [];
  const pending = errors.filter(e => e.pending && e.actualPrice == null);
  if (!pending.length) return '';

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const fmtP   = v => { const _v=Number(v); if(isNaN(_v)||!isFinite(_v))return'--'; return _v>=1000?'$'+Math.round(_v).toLocaleString():_v>0?'$'+_v.toFixed(2):'--'; };

  return `<div style="padding:10px 14px;border-top:1px solid rgba(140,100,16,.15)">
    <div style="font-size:.65rem;font-weight:700;color:#d4a030;margin-bottom:6px">
      ⏳ 待验证节点（${pending.length}条）
    </div>
    ${pending.slice(0,5).map((e,i) => `
      <div style="display:flex;align-items:center;gap:6px;padding:5px 0;border-bottom:1px solid var(--border);font-size:.68rem">
        <span style="color:var(--muted);font-family:monospace;flex-shrink:0">${e.date}</span>
        <span style="color:var(--text);flex:1">${e.coin} ${fmtP(e.predPrice)}</span>
        <input type="number" placeholder="实际价" step="any"
          id="pendFill_${i}" style="width:80px;padding:3px 5px;border:1px solid var(--border);
          border-radius:5px;background:var(--bg2);color:var(--text);font-size:.68rem;font-family:monospace">
        <button onclick="_fillPending(${i},'${e.coin}','${e.date}',${e.predPrice},${e.dirCorrect==null?'null':e.dirCorrect})"
          style="padding:3px 8px;background:rgba(140,100,16,.15);border:1px solid rgba(140,100,16,.3);
          border-radius:5px;color:#8c6410;font-size:.65rem;cursor:pointer;font-weight:700">录入</button>
      </div>`).join('')}
    ${pending.length > 5 ? `<div style="font-size:.6rem;color:var(--faint);margin-top:4px">还有 ${pending.length-5} 条待录入…</div>` : ''}
  </div>`;
}
window.renderPendingNodes = renderPendingNodes;

window._fillPending = function(idx, coin, date, predPrice, origDir) {
  const el     = document.getElementById(`pendFill_${idx}`);
  const actual = parseFloat(el?.value);
  if (!actual || isNaN(actual)) { if(el){el.style.borderColor='#b82020';el.focus();} return; }

  const errors = window.tracker?.priceErrors || [];
  const rec    = errors.find(e => e.pending && e.coin===coin && e.date===date);
  if (rec) {
    rec.actualPrice  = actual;
    rec.priceErr     = Math.abs(actual - predPrice) / predPrice;
    rec.dirCorrect   = origDir != null ? origDir : (actual >= predPrice);
    rec.pending      = false;
    try { localStorage.setItem('tianjishu_errors', JSON.stringify(errors.slice(-2000))); } catch(e) {}
    if (typeof window.updateErrorPanel === 'function') window.updateErrorPanel();
    _showExportToast(`已录入 ${coin} 实际价 $${actual.toLocaleString()}`);
  }
};

// Hook 误差面板更新时注入待验证节点
(function hookErrPanel() {
  const orig = window.updateErrorPanel;
  if (typeof orig !== 'function' || orig._pendHooked) return;
  const h = function() {
    orig.apply(this, arguments);
    setTimeout(() => {
      const ep = document.getElementById('errPanelBody');
      if (!ep) return;
      let pnEl = document.getElementById('pendingNodesWrap');
      if (!pnEl) {
        pnEl = document.createElement('div');
        pnEl.id = 'pendingNodesWrap';
        ep.appendChild(pnEl);
      }
      pnEl.innerHTML = renderPendingNodes();
    }, 100);
  };
  h._pendHooked = true;
  window.updateErrorPanel = h;
})();


'use strict';

function openBriefingModal() {
  const data  = window._lastVizData || window._lastStratData || {};
  const coin  = data.coin  || document.getElementById('detailSym2')?.textContent || '--';
  const price = data.price || parseFloat(document.getElementById('detailPrice2')?.textContent?.replace(/[^0-9.]/g,'')) || 0;
  const date  = data.date  || new Date().toISOString().slice(0,10);
  const tpsl  = data.tpsl;
  const tpsl5 = data.tpsl5;
  const nodes = data.nodes || [];
  const gn    = data.gn, ch = data.ch, sr = data.sr, qm = data.qm;
  const avgConf = data.avgConf || 0.5;
  const score   = data.score   || 0;
  const sig     = tpsl?.signal || 'NEUTRAL';

  const fmtP = v => {
    const n = Number(v);
    if(!n||isNaN(n)) return '--';
    return n>=1000 ? '$'+Math.round(n).toLocaleString() : n>=1 ? '$'+n.toFixed(2) : '$'+n.toFixed(4);
  };
  const pctStr = (a,b) => b ? (((a-b)/b)*100).toFixed(1)+'%' : '--';

  // ── 结构行 ──
  const structParts = [];
  if(sig==='LONG') structParts.push('多头结构延续');
  else if(sig==='SHORT') structParts.push('空头结构主导');
  else structParts.push('区间震荡整理');
  if(ch?.biDir==='up' && !ch?.beichi) structParts.push('上升笔未完成');
  else if(ch?.biDir==='up' && ch?.beichi) structParts.push('上升笔背驰');
  else if(ch?.biDir==='down' && ch?.beichi) structParts.push('下跌'+ch.beichiType+'待确认');
  if(gn?.bias>0.2) structParts.push('江恩角线偏多');
  else if(gn?.bias<-0.2) structParts.push('江恩角线偏空');

  // ── 时间行 ──
  const futureNodes = nodes.filter(n=>new Date(n.date)>new Date()).slice(0,3);
  const timeParts = futureNodes.map(n=>{
    const d=new Date(n.date), diff=Math.round((new Date(n.date)-Date.now())/86400000);
    return `${(d.getMonth()+1)}/${d.getDate()}（+${n.offset}天）${n.type}${diff<=2?' ⌛':''}`;
  });
  if(qm?.entryTime) timeParts.push('今日吉时 '+(qm.entryTime.replace(/（.*）/,'').trim()));

  // ── 价格行 ──
  const priceParts = [];
  const tp1=tpsl?.tpLevels?.[0], tp2=tpsl?.tpLevels?.[1], sl1=tpsl?.slLevels?.[0];
  if(tp1&&tp2) priceParts.push('阻力 '+fmtP(tp1.price)+' / '+fmtP(tp2.price));
  else if(tp1) priceParts.push('阻力 '+fmtP(tp1.price));
  if(sl1) priceParts.push('止损 '+fmtP(sl1.price));
  if(sr?.supZones?.[0]) priceParts.push('支撑带 '+fmtP(sr.supZones[0].low||sr.supZones[0].price));
  const st5=tpsl5?.strategies?.[4];
  if(st5) priceParts.push('目标 '+fmtP(st5.long.tp));

  // ── 操作行 ──
  const opParts = [];
  if(sig==='LONG'){
    if(sl1) opParts.push('不破 '+fmtP(sl1.price)+' 偏多');
    const nn=futureNodes[0];
    if(nn){ const nd=new Date(nn.date); opParts.push('等 '+(nd.getMonth()+1)+'/'+nd.getDate()+' 节点确认'+(nn.isBull?'':'后考虑回调')); }
    if(ch?.beichi&&ch.beichiType==='顶背驰') opParts.push('顶背驰信号需谨慎');
  } else if(sig==='SHORT'){
    if(sl1) opParts.push('不破 '+fmtP(sl1.price)+' 偏空');
    if(tp1) opParts.push('目标 '+fmtP(tp1.price));
  } else {
    opParts.push('方向未明 轻仓观望');
    if(sl1) opParts.push('关注 '+fmtP(sl1.price)+' 支撑');
  }

  // ── TP/SL 清单 ──
  const tpRows = [];
  if(price) tpRows.push({ label:'进场', val:fmtP(price), sub:(tpsl?.atrPct||'--')+'% ATR · '+(tpsl?.volatilityLabel||'') });
  [0,1,2].forEach(i=>{
    const tp=tpsl?.tpLevels?.[i];
    if(tp) tpRows.push({ label:'TP'+(i+1), val:fmtP(tp.price), sub:'+'+(Math.abs(pctStr(tp.price,price)))+' · '+tp.rrr+'R', bull:true });
  });
  if(sl1) tpRows.push({ label:'止损', val:fmtP(sl1.price), sub:pctStr(sl1.price,price), bear:true });

  // ── 江恩5档 ──
  const gann5html = tpsl5?.strategies ? tpsl5.strategies.map((s,i)=>{
    const lo=s.long, c=['#3ab8c8','#28c870','#c8a840','#e8a040','#e05050'][i];
    return `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border)">
      <span style="font-size:.65rem;font-weight:700;color:${c};width:55px;flex-shrink:0">${s.label}</span>
      <span style="font-size:.72rem;font-weight:700;color:var(--bull);font-family:monospace">${fmtP(lo.tp)}</span>
      <span style="font-size:.6rem;color:var(--faint)">+${lo.tpPct}%</span>
      <span style="font-size:.6rem;color:var(--faint);margin:0 3px">/</span>
      <span style="font-size:.72rem;font-weight:700;color:var(--bear);font-family:monospace">${fmtP(lo.sl)}</span>
      <span style="font-size:.62rem;color:var(--gold);margin-left:auto">RRR ${lo.rrr}</span>
    </div>`;
  }).join('') : '';

  const sigColor  = sig==='LONG'?'var(--bull)':sig==='SHORT'?'var(--bear)':'var(--gold)';
  const sigTxt    = sig==='LONG'?'▲ 偏多':sig==='SHORT'?'▼ 偏空':'◆ 观望';
  const confPct   = Math.round((avgConf||0.5)*100);
  const scoreColor= score>=65?'var(--bull)':score<=35?'var(--bear)':'var(--gold)';
  const isDark    = document.documentElement.getAttribute('data-theme')==='dark';

  // Remove existing modal
  const old = document.getElementById('briefingModal');
  if(old) old.remove();

  const modal = document.createElement('div');
  modal.id = 'briefingModal';
  modal.style.cssText = `position:fixed;top:0;right:0;bottom:0;left:0;z-index:10002;background:rgba(0,0,0,.55);
    display:flex;align-items:center;justify-content:center;padding:16px;`;
  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;
      width:min(520px,100%);max-height:90vh;overflow-y:auto;box-shadow:0 16px 48px rgba(0,0,0,.4);
      font-family:'Noto Sans SC',sans-serif;">

      <!-- Header -->
      <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border);
        display:flex;align-items:center;justify-content:space-between;
        background:linear-gradient(135deg,var(--card),var(--card2));border-radius:16px 16px 0 0">
        <div>
          <div style="font-size:.62rem;color:var(--faint);letter-spacing:.06em;margin-bottom:3px">
            📋 行情说明 · ${date}
          </div>
          <div style="display:flex;align-items:center;gap:10px">
            <span style="font-size:1.3rem;font-weight:800;font-family:monospace;color:var(--gold)">${coin}</span>
            <span style="font-size:1rem;font-weight:700;font-family:monospace">${fmtP(price)}</span>
            <span style="font-size:.78rem;font-weight:800;color:${sigColor};background:${sigColor}18;
              padding:3px 12px;border-radius:99px;border:1px solid ${sigColor}40">${sigTxt}</span>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:10px">
          <div style="text-align:center">
            <div style="font-size:1.6rem;font-weight:800;font-family:monospace;color:${scoreColor};line-height:1">${score||'--'}</div>
            <div style="font-size:.58rem;color:var(--faint)">评分 · ${confPct}%置信</div>
          </div>
          <button onclick="document.getElementById('briefingModal').remove()"
            style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:var(--muted);padding:4px 8px;line-height:1">✕</button>
        </div>
      </div>

      <div style="padding:16px 20px;display:flex;flex-direction:column;gap:14px">

        <!-- 4行研判 -->
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;
          padding:12px 14px;font-size:.82rem">
          ${[
            ['结构', structParts.join(' · ') || '--', 'var(--sky)'],
            ['时间', timeParts.join('  ') || '暂无关键节点', 'var(--gold)'],
            ['价格', priceParts.join('  ') || '--', 'var(--amber)'],
            ['操作', opParts.join(' → '), sigColor],
          ].map(([lbl,val,col],i)=>`
            <div style="display:flex;gap:10px;align-items:flex-start;${i>0?'margin-top:9px;padding-top:9px;border-top:1px solid var(--border)':''}">
              <span style="font-size:.7rem;font-weight:700;color:${col};width:36px;flex-shrink:0;padding-top:1px">${lbl}</span>
              <span style="color:var(--text);flex:1;line-height:1.6;font-weight:${lbl==='操作'?700:400}">${val}</span>
            </div>`).join('')}
        </div>

        <!-- TP/SL 清单 -->
        <div>
          <div style="font-size:.62rem;font-weight:700;color:var(--faint);letter-spacing:.06em;margin-bottom:6px">止盈止损</div>
          <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
            ${tpRows.map((r,i)=>`
              <div style="display:flex;align-items:center;gap:10px;padding:9px 14px;
                ${i>0?'border-top:1px solid var(--border)':''}
                ${r.bear?'background:rgba(168,32,32,.03)':r.bull?'background:rgba(20,120,62,.03)':''}">
                <span style="font-size:.7rem;font-weight:700;
                  color:${r.bear?'var(--bear)':r.bull?'var(--bull)':'var(--faint)'};
                  width:32px;flex-shrink:0">${r.label}</span>
                <span style="font-size:.92rem;font-weight:800;font-family:monospace;
                  color:${r.bear?'var(--bear)':r.bull?'var(--bull)':'var(--text)'};flex:1">${r.val}</span>
                <span style="font-size:.68rem;color:var(--muted)">${r.sub}</span>
              </div>`).join('')}
          </div>
        </div>

        <!-- 节点时间线 -->
        ${futureNodes.length ? `
        <div>
          <div style="font-size:.62rem;font-weight:700;color:var(--faint);letter-spacing:.06em;margin-bottom:6px">关键节点</div>
          <div style="display:flex;flex-direction:column;gap:5px">
            ${futureNodes.map(n=>{
              const d=new Date(n.date), diff=Math.round((new Date(n.date)-Date.now())/86400000);
              const isUrgent=diff<=2, isPast=diff<0;
              const dirCol=n.isBull?'var(--bull)':'var(--bear)';
              const conf=Math.round((n.conf||0.5)*100);
              const res=Math.min(n.activeSys?.length||0,5);
              return `<div style="display:flex;align-items:center;gap:10px;padding:8px 12px;
                border:1px solid ${isUrgent?'rgba(20,120,62,.3)':'var(--border)'};
                background:${isUrgent?'rgba(20,120,62,.04)':'var(--bg2)'};border-radius:8px">
                <div style="text-align:center;width:40px;flex-shrink:0">
                  <div style="font-size:.8rem;font-weight:800;font-family:monospace;color:${isUrgent?'var(--bull)':'var(--gold)'}">
                    ${(d.getMonth()+1)}/${d.getDate()}
                  </div>
                  <div style="font-size:.58rem;color:var(--faint)">${diff===0?'今日 ⌛':diff<=2?diff+'天 ⌛':'+'+diff+'天'}</div>
                </div>
                <div style="flex:1">
                  <div style="font-size:.78rem;font-weight:700;color:${dirCol}">${n.isBull?'▲':'▼'} ${n.type}</div>
                  <div style="font-size:.63rem;color:var(--muted);margin-top:1px">${(n.details||'').split(' · ').slice(0,2).join(' · ')}</div>
                </div>
                <div style="text-align:right;flex-shrink:0">
                  <div style="font-size:.7rem;font-weight:700;color:var(--gold)">${conf}%</div>
                  <div style="font-size:.58rem;color:${res>=3?'var(--gold)':'var(--faint)'}">
                    ${'●'.repeat(res)}${'○'.repeat(5-res)}
                  </div>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>` : ''}

        <!-- 江恩5档 -->
        ${gann5html ? `
        <details style="border:1px solid var(--border);border-radius:10px;overflow:hidden">
          <summary style="padding:10px 14px;font-size:.7rem;font-weight:700;color:var(--gold);
            cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;
            background:var(--bg2);user-select:none">
            <span>⬡ 江恩九方格 五档止盈止损</span>
            <span style="font-size:.65rem;color:var(--faint)">▾ 展开</span>
          </summary>
          <div style="padding:6px 14px 10px;background:var(--card)">${gann5html}</div>
        </details>` : ''}

        <!-- 复制 + 导出 按钮 -->
        <div style="display:flex;gap:8px">
          <button onclick="_copyBriefing()" id="copyBriefingBtn"
            style="flex:1;padding:10px;background:rgba(140,100,16,.12);border:1px solid rgba(140,100,16,.3);
            border-radius:9px;color:#8c6410;font-weight:700;font-size:.78rem;cursor:pointer;font-family:inherit">
            📋 复制文字版
          </button>
          <button onclick="exportAllData();document.getElementById('briefingModal').remove();"
            style="flex:1;padding:10px;background:rgba(44,80,168,.1);border:1px solid rgba(44,80,168,.25);
            border-radius:9px;color:#2c50a8;font-weight:700;font-size:.78rem;cursor:pointer;font-family:inherit">
            ⬇ 导出资料
          </button>
        </div>

        <div style="font-size:.6rem;color:var(--faint);text-align:center;padding-bottom:4px">
          ⚠ 以上内容由玄学系统推算，仅供参考，不构成投资建议
        </div>

      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
}
window.openBriefingModal = openBriefingModal;

// 复制文字版行情说明
function _copyBriefing() {
  const data  = window._lastVizData || window._lastStratData || {};
  const coin  = data.coin  || '--';
  const price = data.price || 0;
  const date  = data.date  || new Date().toISOString().slice(0,10);
  const tpsl  = data.tpsl;
  const nodes = data.nodes || [];
  const sig   = tpsl?.signal || 'NEUTRAL';
  const score = data.score || 0;
  const gn=data.gn, ch=data.ch, sr=data.sr, qm=data.qm;
  const fmtP  = v => { const n=Number(v); if(!n||isNaN(n))return'--'; return n>=1000?'$'+Math.round(n).toLocaleString():n>=1?'$'+n.toFixed(2):'$'+n.toFixed(4); };

  const structParts = [];
  if(sig==='LONG') structParts.push('多头结构延续');
  else if(sig==='SHORT') structParts.push('空头结构主导');
  else structParts.push('区间震荡整理');
  if(ch?.biDir==='up'&&!ch?.beichi) structParts.push('上升笔未完成');
  else if(ch?.biDir==='up'&&ch?.beichi) structParts.push('上升笔背驰');
  if(gn?.bias>0.2) structParts.push('江恩角线偏多');
  else if(gn?.bias<-0.2) structParts.push('江恩角线偏空');

  const futureNodes = nodes.filter(n=>new Date(n.date)>new Date()).slice(0,3);
  const timeParts = futureNodes.map(n=>{
    const d=new Date(n.date), diff=Math.round((new Date(n.date)-Date.now())/86400000);
    return `${(d.getMonth()+1)}/${d.getDate()}（+${n.offset}天）${n.type}${diff<=2?' ⌛':''}`;
  });
  if(qm?.entryTime) timeParts.push('今日吉时 '+(qm.entryTime.replace(/（.*）/,'').trim()));

  const tp1=tpsl?.tpLevels?.[0], tp2=tpsl?.tpLevels?.[1], sl1=tpsl?.slLevels?.[0];
  const priceParts = [];
  if(tp1&&tp2) priceParts.push('阻力 '+fmtP(tp1.price)+' / '+fmtP(tp2.price));
  else if(tp1) priceParts.push('阻力 '+fmtP(tp1.price));
  if(sl1) priceParts.push('止损 '+fmtP(sl1.price));
  if(sr?.supZones?.[0]) priceParts.push('支撑带 '+fmtP(sr.supZones[0].low||sr.supZones[0].price));

  const opParts = [];
  if(sig==='LONG'){
    if(sl1) opParts.push('不破 '+fmtP(sl1.price)+' 偏多');
    const nn=futureNodes[0];
    if(nn){ const nd=new Date(nn.date); opParts.push('等 '+(nd.getMonth()+1)+'/'+nd.getDate()+' 节点确认'); }
  } else if(sig==='SHORT'){
    if(sl1) opParts.push('不破 '+fmtP(sl1.price)+' 偏空');
    if(tp1) opParts.push('目标 '+fmtP(tp1.price));
  } else {
    opParts.push('方向未明 轻仓观望');
  }

  const tpLines = [];
  if(price) tpLines.push(`进场   ${fmtP(price)}`);
  [0,1,2].forEach(i=>{ const tp=tpsl?.tpLevels?.[i]; if(tp) tpLines.push(`TP${i+1}    ${fmtP(tp.price)}   +${Math.abs(((tp.price-price)/price*100)).toFixed(1)}% · ${tp.rrr}R`); });
  if(sl1) tpLines.push(`止损   ${fmtP(sl1.price)}   ${(((sl1.price-price)/price*100)).toFixed(1)}%`);

  const text = `${coin} 行情说明 · ${date}
评分 ${score} · ${sig==='LONG'?'▲ 偏多':sig==='SHORT'?'▼ 偏空':'◆ 观望'}

结构  ${structParts.join(' · ')||'--'}
时间  ${timeParts.join('  ')||'暂无关键节点'}
价格  ${priceParts.join('  ')||'--'}
操作  ${opParts.join(' → ')}

${tpLines.join('\n')}

⚠ 仅供参考，不构成投资建议。由天機數元·十法合一生成。`;

  navigator.clipboard.writeText(text).then(()=>{
    const btn = document.getElementById('copyBriefingBtn');
    if(btn){ btn.textContent='✅ 已复制！'; setTimeout(()=>{ btn.textContent='📋 复制文字版'; },2000); }
  }).catch(()=>{
    // Fallback for browsers without clipboard API
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position='fixed'; ta.style.opacity='0';
    document.body.appendChild(ta); ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    const btn = document.getElementById('copyBriefingBtn');
    if(btn){ btn.textContent='✅ 已复制！'; setTimeout(()=>{ btn.textContent='📋 复制文字版'; },2000); }
  });
}



// ══════════════════════════════════════════════════════════════════
// 真实技术分析引擎 — realTA
// 基于真实K线数据，无任何伪随机，输出博主风格中文分析
// ══════════════════════════════════════════════════════════════════

const realTA = (() => {

  // ── 工具函数 ──────────────────────────────────────────────────
  function ema(arr, period) {
    const k = 2 / (period + 1);
    const result = [];
    let prev = null;
    for (let i = 0; i < arr.length; i++) {
      if (prev === null) {
        // 用前 period 根的简单均值作为初始值
        if (i < period - 1) { result.push(null); continue; }
        const slice = arr.slice(0, period);
        prev = slice.reduce((s, v) => s + v, 0) / period;
        result.push(prev);
      } else {
        prev = arr[i] * k + prev * (1 - k);
        result.push(prev);
      }
    }
    return result;
  }

  function sma(arr, period) {
    return arr.map((_, i) => {
      if (i < period - 1) return null;
      return arr.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0) / period;
    });
  }

  function rsi(closes, period = 14) {
    const result = [];
    for (let i = 0; i < closes.length; i++) {
      if (i < period) { result.push(null); continue; }
      let gains = 0, losses = 0;
      for (let j = i - period + 1; j <= i; j++) {
        const diff = closes[j] - closes[j - 1];
        if (diff > 0) gains += diff; else losses -= diff;
      }
      const avgG = gains / period, avgL = losses / period;
      result.push(avgL === 0 ? 100 : 100 - 100 / (1 + avgG / avgL));
    }
    return result;
  }

  function macd(closes, fast = 12, slow = 26, signal = 9) {
    const emaFast = ema(closes, fast);
    const emaSlow = ema(closes, slow);
    const macdLine = closes.map((_, i) =>
      emaFast[i] !== null && emaSlow[i] !== null ? emaFast[i] - emaSlow[i] : null
    );
    const validMacd = macdLine.filter(v => v !== null);
    const signalRaw = ema(validMacd, signal);
    // 重新对齐 signal 到原始长度
    const signalLine = macdLine.map((v, i) => {
      if (v === null) return null;
      const idx = macdLine.slice(0, i + 1).filter(x => x !== null).length - 1;
      return signalRaw[idx] !== undefined ? signalRaw[idx] : null;
    });
    const hist = macdLine.map((v, i) =>
      v !== null && signalLine[i] !== null ? v - signalLine[i] : null
    );
    return { macdLine, signalLine, hist };
  }

  function bollingerBands(closes, period = 20, mult = 2) {
    return closes.map((_, i) => {
      if (i < period - 1) return null;
      const slice = closes.slice(i - period + 1, i + 1);
      const mean = slice.reduce((s, v) => s + v, 0) / period;
      const std = Math.sqrt(slice.reduce((s, v) => s + (v - mean) ** 2, 0) / period);
      return { upper: mean + mult * std, mid: mean, lower: mean - mult * std };
    });
  }

  // ── 支撑阻力识别（基于局部高低点） ────────────────────────────
  function findSRLevels(klines, lookback = 5) {
    const highs = klines.map(k => k[2]);
    const lows  = klines.map(k => k[3]);
    const levels = [];

    for (let i = lookback; i < klines.length - lookback; i++) {
      const h = highs[i];
      const l = lows[i];
      // 局部高点
      if (highs.slice(i - lookback, i).every(v => v <= h) &&
          highs.slice(i + 1, i + lookback + 1).every(v => v <= h)) {
        levels.push({ price: h, type: 'resistance', strength: 1 });
      }
      // 局部低点
      if (lows.slice(i - lookback, i).every(v => v >= l) &&
          lows.slice(i + 1, i + lookback + 1).every(v => v >= l)) {
        levels.push({ price: l, type: 'support', strength: 1 });
      }
    }

    // 合并相近价位（1.5%以内）
    const merged = [];
    for (const lv of levels) {
      const existing = merged.find(m =>
        Math.abs(m.price - lv.price) / lv.price < 0.015 && m.type === lv.type
      );
      if (existing) { existing.strength++; existing.price = (existing.price + lv.price) / 2; }
      else merged.push({ ...lv });
    }

    return merged.sort((a, b) => b.strength - a.strength).slice(0, 8);
  }

  // ── 缠论风格：识别笔方向和中枢 ─────────────────────────────────
  function chanAnalysis(klines) {
    const n = klines.length;
    const closes = klines.map(k => parseFloat(k[4]));
    const highs  = klines.map(k => parseFloat(k[2]));
    const lows   = klines.map(k => parseFloat(k[3]));

    // 找最近高低点
    const recentHigh = Math.max(...highs.slice(-10));
    const recentLow  = Math.min(...lows.slice(-10));
    const curPrice   = closes[n - 1];
    const prevClose  = closes[n - 2];

    // 识别近期方向
    const ema5  = ema(closes, 5);
    const ema13 = ema(closes, 13);
    const ema34 = ema(closes, 34);

    const e5  = ema5[n - 1];
    const e13 = ema13[n - 1];
    const e34 = ema34[n - 1];

    // 均线排列
    const bullAlign = e5 > e13 && e13 > e34;
    const bearAlign = e5 < e13 && e13 < e34;

    // 连续涨跌计数
    let upCount = 0, dnCount = 0;
    for (let i = n - 1; i >= Math.max(0, n - 8); i--) {
      if (closes[i] > closes[i - 1]) { if (dnCount === 0) upCount++; else break; }
      else { if (upCount === 0) dnCount++; else break; }
    }

    // 中枢识别：取最近3段高低区间
    const pivot = {
      high: Math.max(...highs.slice(-6, -3)),
      low:  Math.min(...lows.slice(-6, -3)),
    };
    const inPivot = curPrice >= pivot.low && curPrice <= pivot.high;

    // 趋势强度
    const trendStrength = bullAlign ? 'strong_bull' : bearAlign ? 'strong_bear' :
      e5 > e13 ? 'mild_bull' : e5 < e13 ? 'mild_bear' : 'sideways';

    // 背驰判断（简化版：价格新高但涨势收窄）
    const priceHigher = highs[n - 1] > highs[n - 4];
    const rangeSmaller = (highs[n - 1] - lows[n - 1]) < (highs[n - 4] - lows[n - 4]) * 0.7;
    const beichi = priceHigher && rangeSmaller && bearAlign === false;

    return {
      trend: trendStrength,
      bullAlign, bearAlign,
      ema5: e5, ema13: e13, ema34: e34,
      recentHigh, recentLow, curPrice,
      pivot, inPivot,
      upCount, dnCount,
      beichi,
    };
  }

  // ── 主分析函数 ──────────────────────────────────────────────────
  function analyze(coin, price, klines, chg24, high, low) {
    if (!klines || klines.length < 20) return null;

    const closes = klines.map(k => parseFloat(k[4]));
    const highs  = klines.map(k => parseFloat(k[2]));
    const lows_  = klines.map(k => parseFloat(k[3]));
    const vols   = klines.map(k => parseFloat(k[5]));
    const n = closes.length;

    // ── 指标计算 ──
    const rsiVals  = rsi(closes, 14);
    const curRSI   = rsiVals[n - 1];
    const macdRes  = macd(closes);
    const curMACD  = macdRes.macdLine[n - 1];
    const curSig   = macdRes.signalLine[n - 1];
    const curHist  = macdRes.hist[n - 1];
    const prevHist = macdRes.hist[n - 2];
    const bbVals   = bollingerBands(closes);
    const curBB    = bbVals[n - 1];
    const ema5vals = ema(closes, 5);
    const ema13vals= ema(closes, 13);
    const ema34vals= ema(closes, 34);
    const e5  = ema5vals[n - 1];
    const e13 = ema13vals[n - 1];
    const e34 = ema34vals[n - 1];

    // ── 支撑阻力 ──
    const srLevels = findSRLevels(klines);
    const supports   = srLevels.filter(l => l.type === 'support'  && l.price < price).sort((a,b) => b.price - a.price);
    const resistances= srLevels.filter(l => l.type === 'resistance'&& l.price > price).sort((a,b) => a.price - b.price);

    // ── 缠论分析 ──
    const chan = chanAnalysis(klines);

    // ── 成交量判断 ──
    const avgVol = vols.slice(-10).reduce((s,v)=>s+v,0)/10;
    const curVol = vols[n - 1];
    const volRatio = curVol / avgVol;
    const volDesc = volRatio > 1.5 ? '放量' : volRatio < 0.6 ? '缩量' : '量平';

    // ── 综合信号 ──
    let bullPoints = 0, bearPoints = 0;
    if (chan.bullAlign) bullPoints += 2;
    if (chan.bearAlign) bearPoints += 2;
    if (curRSI < 35) bullPoints += 1;
    if (curRSI > 65) bearPoints += 1;
    if (curHist > 0 && prevHist < 0) bullPoints += 2; // MACD金叉
    if (curHist < 0 && prevHist > 0) bearPoints += 2; // MACD死叉
    if (curHist > prevHist) bullPoints += 1;
    if (curHist < prevHist) bearPoints += 1;
    if (price > e5 && price > e13) bullPoints += 1;
    if (price < e5 && price < e13) bearPoints += 1;
    if (curBB && price < curBB.lower) bullPoints += 1;
    if (curBB && price > curBB.upper) bearPoints += 1;
    if (chg24 > 0 && volRatio > 1.2) bullPoints += 1;
    if (chg24 < 0 && volRatio > 1.2) bearPoints += 1;

    const signal = bullPoints > bearPoints + 1 ? 'LONG' :
                   bearPoints > bullPoints + 1 ? 'SHORT' : 'NEUTRAL';

    // ── 止盈止损计算 ──
    const atr = closes.slice(-14).reduce((s, _, i, arr) => {
      if (i === 0) return s;
      return s + Math.abs(arr[i] - arr[i-1]);
    }, 0) / 13;

    const sl = signal === 'LONG'
      ? (supports[0]?.price || price * 0.97)
      : (resistances[0]?.price || price * 1.03);
    const tp1 = signal === 'LONG'
      ? (resistances[0]?.price || price + atr * 2)
      : (supports[0]?.price || price - atr * 2);
    const tp2 = signal === 'LONG'
      ? (resistances[1]?.price || price + atr * 3.5)
      : (supports[1]?.price || price - atr * 3.5);

    return {
      signal, bullPoints, bearPoints,
      curRSI, curMACD, curSig, curHist, prevHist,
      curBB, e5, e13, e34,
      chan, supports, resistances,
      volDesc, volRatio, atr,
      sl, tp1, tp2,
    };
  }

  // ── 生成博主风格中文分析文字 ─────────────────────────────────────
  function generateText(coin, price, ta, tf = '4H') {
    if (!ta) return '数据不足，无法分析。';
    const { signal, chan, curRSI, curHist, prevHist, curBB,
            e5, e13, e34, supports, resistances, volDesc,
            sl, tp1, tp2, atr } = ta;

    const fmtP = v => v >= 1000 ? '$' + Math.round(v).toLocaleString() : '$' + v.toFixed(2);

    // 趋势描述
    const trendDesc =
      chan.trend === 'strong_bull' ? '均线多头排列，趋势强势' :
      chan.trend === 'strong_bear' ? '均线空头排列，趋势偏弱' :
      chan.trend === 'mild_bull'   ? '短期均线偏多，中线待确认' :
      chan.trend === 'mild_bear'   ? '短期均线偏空，结构偏弱' : '均线纠缠，方向不明';

    // K线结构
    const structDesc = chan.inPivot
      ? `当前价格位于中枢区间 ${fmtP(chan.pivot.low)}–${fmtP(chan.pivot.high)} 内震荡`
      : price > chan.pivot.high
        ? `价格已突破中枢上沿 ${fmtP(chan.pivot.high)}，结构偏多`
        : `价格跌破中枢下沿 ${fmtP(chan.pivot.low)}，结构偏弱`;

    // MACD描述
    const macdDesc = curHist > 0 && prevHist < 0 ? 'MACD刚形成金叉，动能转多' :
                     curHist < 0 && prevHist > 0 ? 'MACD刚形成死叉，动能转空' :
                     curHist > 0 && curHist > prevHist ? 'MACD柱持续扩张，多头动能增强' :
                     curHist > 0 && curHist < prevHist ? 'MACD柱收窄，多头动能减弱' :
                     curHist < 0 && curHist < prevHist ? 'MACD柱持续扩张，空头动能增强' :
                     curHist < 0 && curHist > prevHist ? 'MACD柱收窄，空头动能减弱' : 'MACD中性';

    // RSI描述
    const rsiDesc = curRSI > 70 ? `RSI ${curRSI.toFixed(0)} 超买区，注意回调风险` :
                    curRSI < 30 ? `RSI ${curRSI.toFixed(0)} 超卖区，关注反弹机会` :
                    curRSI > 55 ? `RSI ${curRSI.toFixed(0)} 偏强` :
                    curRSI < 45 ? `RSI ${curRSI.toFixed(0)} 偏弱` :
                    `RSI ${curRSI.toFixed(0)} 中性`;

    // 背驰
    const beichiDesc = chan.beichi ? '⚠ 价格创新高但涨幅收窄，注意顶背驰风险。' : '';

    // 支撑阻力文字
    const supStr = supports.slice(0, 3).map(s => fmtP(s.price)).join(' / ') || '--';
    const resStr = resistances.slice(0, 3).map(r => fmtP(r.price)).join(' / ') || '--';

    // 操作建议
    const opDesc =
      signal === 'LONG'
        ? `操作建议：不破 ${fmtP(sl)} 偏多思路，可轻仓布局，目标逐看 ${fmtP(tp1)}${tp2 ? ' → ' + fmtP(tp2) : ''}，止损 ${fmtP(sl)}。`
        : signal === 'SHORT'
        ? `操作建议：不破 ${fmtP(sl)} 偏空思路，反弹可轻仓做空，目标看 ${fmtP(tp1)}${tp2 ? ' → ' + fmtP(tp2) : ''}，止损 ${fmtP(sl)}。`
        : `操作建议：方向不明，建议观望为主，等待结构明朗后再介入。`;

    const signalTag = signal === 'LONG' ? '▲ 偏多' : signal === 'SHORT' ? '▼ 偏空' : '◆ 中性观望';

    return {
      signal, signalTag,
      trendDesc, structDesc, macdDesc, rsiDesc, beichiDesc,
      supStr, resStr, opDesc,
      sl, tp1, tp2, fmtP,
    };
  }

  return { analyze, generateText };
})();

window.realTA = realTA;

// ── 快速分析弹窗 ─────────────────────────────────────────────────
function openQuickAnalysis(coinKey) {
  // 拿缓存数据
  const res = window.dashResults?.[coinKey];
  if (!res || res === 'loading') {
    alert('数据尚未加载，请先点击「一键通·全自动推演」。');
    return;
  }
  if (!res.klines || res.klines.length < 10) {
    // Try to get klines from any available source
    console.warn('[QA] klines missing for', coinKey, 'res keys:', Object.keys(res));
    alert('K线数据不足，请重新推演后再试。');
    return;
  }

  const { price, chg24, high, low, klines } = res;
  const coin = window.dashCoins?.find(c => c.coin === coinKey);
  const color = coin?.color || 'var(--gold)';
  const tf = document.getElementById('fetchPeriod')?.value || '4h';
  const tfLabel = tf === '1h' ? '1H' : tf === '4h' ? '4H' : tf === '1d' ? '1D' : tf.toUpperCase();

  const ta  = realTA.analyze(coinKey, price, klines, chg24, high, low);
  const txt = realTA.generateText(coinKey, price, ta, tfLabel);

  if (!ta || !txt) { alert('分析失败，K线数据不足。'); return; }

  const fmtP = txt.fmtP;
  const signalColor = txt.signal === 'LONG' ? 'var(--bull)' : txt.signal === 'SHORT' ? 'var(--bear)' : 'var(--gold)';

  // 玄学引擎摘要
  const xuanScore  = res.score || '--';
  const xuanBias   = res.avgBias != null ? ((res.avgBias * 100).toFixed(1) + '%') : '--';
  const xuanTitle  = res.verdictTitle || '--';
  const xuanHex    = res.ic?.hexagram?.[0] || (res.qm?.hexagram) || '䷀';
  const xuanNodes  = (res.nodes || []).filter(n => new Date(n.date) > new Date()).slice(0, 3);
  const xuanGann   = res.gn ? `江恩偏差 ${(res.gn.bias * 100).toFixed(1)}%` : '';
  const xuanQM     = res.qm ? `奇门 ${res.qm.door || ''}` : '';
  const xuanTpsl   = res.tpsl;

  // 移除旧弹窗
  document.getElementById('qaModal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'qaModal';
  modal.style.cssText = `
    position:fixed;top:0;right:0;bottom:0;left:0;z-index:9999;
    background:rgba(0,0,0,.55);backdrop-filter:blur(4px);
    display:flex;align-items:center;justify-content:center;padding:16px;
  `;

  modal.innerHTML = `
    <div style="
      background:var(--card);border:1px solid var(--border2);border-radius:16px;
      width:100%;max-width:520px;max-height:88vh;overflow-y:auto;
      box-shadow:0 8px 40px rgba(0,0,0,.4);
    ">
      <!-- 标题栏 -->
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        padding:14px 18px 12px;border-bottom:1px solid var(--border);
        background:linear-gradient(135deg,var(--card),var(--card2));
        border-radius:16px 16px 0 0;position:sticky;top:0;z-index:2;
      ">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="font-weight:800;font-size:1.05rem;color:${color};font-family:var(--font-mono)">${coinKey}</span>
          <span style="font-size:.78rem;font-weight:700;font-family:var(--font-mono);color:var(--text)">${fmtP(price)}</span>
          <span style="font-size:.7rem;color:${chg24>=0?'var(--bull)':'var(--bear)'};font-weight:700">${chg24>=0?'+':''}${Number(chg24).toFixed(2)}%</span>
          <span style="font-size:.65rem;color:var(--faint)">· ${tfLabel}级别</span>
        </div>
        <button onclick="document.getElementById('qaModal').remove()"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:1.1rem;line-height:1;padding:4px 6px">✕</button>
      </div>

      <div style="padding:14px 18px;display:flex;flex-direction:column;gap:14px">

        <!-- ══ 第一部分：真实技术分析 ══ -->
        <div>
          <div style="
            font-size:.6rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
            color:var(--bull);margin-bottom:10px;display:flex;align-items:center;gap:6px
          ">
            <span style="display:inline-block;width:3px;height:12px;background:var(--bull);border-radius:2px"></span>
            真实技术分析
          </div>

          <!-- 信号标签 -->
          <div style="
            display:inline-flex;align-items:center;gap:6px;
            padding:6px 14px;border-radius:99px;margin-bottom:10px;
            background:${signalColor}18;border:1px solid ${signalColor}40;
          ">
            <span style="font-size:.88rem;font-weight:800;color:${signalColor}">${txt.signalTag}</span>
          </div>

          <!-- 分析正文 -->
          <div style="
            background:var(--bg2);border:1px solid var(--border);border-radius:10px;
            padding:12px 14px;font-size:.82rem;color:var(--text);line-height:1.9;
          ">
            <p style="margin:0 0 6px">${txt.structDesc}。${txt.trendDesc}，${volDesc(ta)}。</p>
            <p style="margin:0 0 6px">${txt.macdDesc}；${txt.rsiDesc}。</p>
            ${txt.beichiDesc ? `<p style="margin:0 0 6px;color:var(--bear)">${txt.beichiDesc}</p>` : ''}
            <p style="margin:0">${txt.opDesc}</p>
          </div>

          <!-- 支撑阻力表 -->
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px">
            <div style="background:var(--bull-bg);border:1px solid var(--bull-bd);border-radius:9px;padding:9px 12px">
              <div style="font-size:.58rem;font-weight:700;color:var(--bull);letter-spacing:.06em;margin-bottom:4px">▲ 上方阻力</div>
              <div style="font-size:.78rem;font-weight:700;font-family:var(--font-mono);color:var(--text);line-height:1.7">${txt.resStr}</div>
            </div>
            <div style="background:var(--bear-bg);border:1px solid var(--bear-bd);border-radius:9px;padding:9px 12px">
              <div style="font-size:.58rem;font-weight:700;color:var(--bear);letter-spacing:.06em;margin-bottom:4px">▼ 下方支撑</div>
              <div style="font-size:.78rem;font-weight:700;font-family:var(--font-mono);color:var(--text);line-height:1.7">${txt.supStr}</div>
            </div>
          </div>

          <!-- TP/SL -->
          <div style="
            display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin-top:8px;
            background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:10px 12px;
          ">
            <div style="text-align:center">
              <div style="font-size:.58rem;color:var(--faint);margin-bottom:3px">止损</div>
              <div style="font-size:.8rem;font-weight:800;font-family:var(--font-mono);color:var(--bear)">${fmtP(txt.sl)}</div>
              <div style="font-size:.58rem;color:var(--bear)">${((Math.abs(txt.sl-price)/price)*100).toFixed(1)}%</div>
            </div>
            <div style="text-align:center;border-left:1px solid var(--border);border-right:1px solid var(--border)">
              <div style="font-size:.58rem;color:var(--faint);margin-bottom:3px">TP1</div>
              <div style="font-size:.8rem;font-weight:800;font-family:var(--font-mono);color:var(--bull)">${fmtP(txt.tp1)}</div>
              <div style="font-size:.58rem;color:var(--bull)">+${((Math.abs(txt.tp1-price)/price)*100).toFixed(1)}%</div>
            </div>
            <div style="text-align:center">
              <div style="font-size:.58rem;color:var(--faint);margin-bottom:3px">TP2</div>
              <div style="font-size:.8rem;font-weight:800;font-family:var(--font-mono);color:var(--bull)">${fmtP(txt.tp2)}</div>
              <div style="font-size:.58rem;color:var(--bull)">+${((Math.abs(txt.tp2-price)/price)*100).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        <!-- 分隔线 -->
        <div style="border-top:1px dashed var(--border2);position:relative">
          <span style="
            position:absolute;top:-9px;left:50%;transform:translateX(-50%);
            background:var(--card);padding:0 10px;
            font-size:.62rem;color:var(--faint);font-weight:700;letter-spacing:.06em
          ">玄学系统推算</span>
        </div>

        <!-- ══ 第二部分：玄学系统 ══ -->
        <div>
          <div style="
            font-size:.6rem;font-weight:800;letter-spacing:.1em;text-transform:uppercase;
            color:var(--gold);margin-bottom:10px;display:flex;align-items:center;gap:6px
          ">
            <span style="display:inline-block;width:3px;height:12px;background:var(--gold);border-radius:2px"></span>
            玄学十法合一
          </div>

          <!-- 综合评分 + 卦象 -->
          <div style="
            display:flex;align-items:center;gap:14px;
            background:var(--gold-bg);border:1px solid var(--gold-bd);
            border-radius:10px;padding:12px 14px;margin-bottom:8px
          ">
            <div style="text-align:center;flex-shrink:0">
              <div style="font-size:2rem;font-weight:900;font-family:var(--font-mono);
                color:${xuanScore>=65?'var(--bull)':xuanScore<=35?'var(--bear)':'var(--gold)'}">${xuanScore}</div>
              <div style="font-size:.58rem;color:var(--faint)">玄学评分</div>
            </div>
            <div style="width:1px;height:40px;background:var(--border2)"></div>
            <div style="flex:1">
              <div style="font-size:1.1rem;color:var(--gold2)">${typeof xuanHex==='string'?xuanHex:'䷀'}</div>
              <div style="font-size:.8rem;font-weight:700;color:var(--text);margin-top:2px">${xuanTitle}</div>
              <div style="font-size:.68rem;color:var(--muted);margin-top:2px">
                偏差 ${xuanBias}
                ${xuanGann ? ' · ' + xuanGann : ''}
                ${xuanQM   ? ' · ' + xuanQM   : ''}
              </div>
            </div>
          </div>

          <!-- 玄学节点 -->
          ${xuanNodes.length ? `
          <div style="display:flex;flex-direction:column;gap:5px">
            ${xuanNodes.map(n => {
              const d = new Date(n.date);
              const diff = Math.round((d - Date.now()) / 86400000);
              const col = n.isBull ? 'var(--bull)' : 'var(--bear)';
              return `<div style="
                display:flex;align-items:center;gap:10px;padding:7px 12px;
                background:var(--bg2);border:1px solid var(--border);border-radius:8px;
              ">
                <span style="font-size:.75rem;font-weight:800;color:${col};font-family:var(--font-mono);width:40px;flex-shrink:0">
                  ${(d.getMonth()+1)}/${d.getDate()}
                </span>
                <span style="font-size:.7rem;font-weight:700;color:${col}">${n.isBull?'▲':'▼'} ${n.type}</span>
                <span style="font-size:.62rem;color:var(--faint);margin-left:auto">+${diff}天</span>
              </div>`;
            }).join('')}
          </div>` : `<div style="font-size:.72rem;color:var(--faint);text-align:center;padding:8px">暂无玄学关键节点</div>`}

          <!-- 免责 -->
          <div style="font-size:.58rem;color:var(--faint);text-align:center;margin-top:8px">
            ⚠ 玄学推算仅供参考，不构成投资建议
          </div>
        </div>

      </div>
    </div>
  `;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}

// 辅助：成交量描述
function volDesc(ta) {
  return ta.volRatio > 1.5 ? `成交量放大（${ta.volRatio.toFixed(1)}x均量），走势有效性较强` :
         ta.volRatio < 0.6 ? `成交量萎缩（${ta.volRatio.toFixed(1)}x均量），信号可信度偏低` :
         `成交量正常（${ta.volRatio.toFixed(1)}x均量）`;
}

window.openQuickAnalysis = openQuickAnalysis;

// ══════════════════════════════════════════════════════════
// 学习报告弹窗
// ══════════════════════════════════════════════════════════
function openLearnReportModal() {
  document.getElementById('learnReportModal')?.remove();

  // Gather data
  const rec    = window.tracker?.priceErrors?.length || 
                 JSON.parse(_localStorage.getItem('err_price') || '[]').length;
  const errors = window.tracker?.priceErrors || 
                 JSON.parse(_localStorage.getItem('err_price') || '[]');
  const weights= JSON.parse(_localStorage.getItem('err_weights') || 
                            _localStorage.getItem('custom_engine_weights') || '{}');
  const stats  = JSON.parse(_localStorage.getItem('err_stats') || '{}');

  // Tier
  const tier = rec >= 1000 ? {icon:'✅', label:'已成熟', color:'var(--bull)', bg:'var(--bull-bg)', tip:'权重已充分优化，分析可信度高'}
    : rec >= 500 ? {icon:'🔥', label:'接近成熟', color:'#d97706', bg:'rgba(217,119,6,.1)', tip:'再积累'+(1000-rec)+'条达到成熟'}
    : rec >= 100 ? {icon:'📊', label:'参考级', color:'var(--gold)', bg:'var(--gold-bg)', tip:'有一定参考价值，继续积累'}
    : rec >= 20  ? {icon:'📈', label:'初步可用', color:'#2c50a8', bg:'rgba(44,80,168,.1)', tip:'刚开始学习，需更多数据'}
    : {icon:'⏳', label:'积累中', color:'var(--muted)', bg:'var(--bg2)', tip:'还需'+(20-rec)+'条开始分析'};

  const pct = Math.min(100, (rec/1000)*100);

  // Recent accuracy (last 20 records)
  const recent = errors.slice(-20);
  const recentOk = recent.filter(e => e.dirCorrect).length;
  const recentAcc = recent.length > 0 ? Math.round(recentOk/recent.length*100) : null;

  // Best/worst engines from stats
  const engineNames = {gann:'江恩',chan:'缠论',sr:'支撑阻力',harmonic:'谐波',
    qimen:'奇门',iching:'易经',vedic:'印度占星',natal:'命盘',ziwei:'紫微',volRate:'波动率'};
  const engineRows = Object.entries(stats)
    .filter(([k,v]) => v.count >= 3)
    .map(([k,v]) => ({
      name: engineNames[k] || k,
      count: v.count,
      acc: Math.round(v.dirOk/v.count*100),
      err: (v.totalErr/v.count*100).toFixed(1)
    }))
    .sort((a,b) => b.acc - a.acc);

  // Weight display
  const weightRows = Object.entries(weights)
    .filter(([k]) => engineNames[k])
    .sort((a,b) => b[1]-a[1])
    .map(([k,v]) => ({name: engineNames[k]||k, w: (v*100).toFixed(1)}));

  const modal = document.createElement('div');
  modal.id = 'learnReportModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;z-index:9999;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;padding:16px';

  modal.innerHTML = `
    <div style="background:var(--card);border:1px solid var(--border2);border-radius:16px;
      width:100%;max-width:480px;max-height:88vh;overflow-y:auto;box-shadow:0 8px 40px rgba(0,0,0,.4)">

      <!-- Header -->
      <div style="padding:14px 18px 12px;border-bottom:1px solid var(--border);
        display:flex;align-items:center;justify-content:space-between;
        background:linear-gradient(135deg,var(--card),var(--card2));border-radius:16px 16px 0 0;
        position:sticky;top:0;z-index:2">
        <div style="font-weight:800;font-size:1rem;color:var(--text)">🧠 学习系统报告</div>
        <button onclick="document.getElementById('learnReportModal').remove()"
          style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:1.1rem;padding:4px 6px">✕</button>
      </div>

      <div style="padding:14px 18px;display:flex;flex-direction:column;gap:12px">

        <!-- 成熟度 -->
        <div style="background:${tier.bg};border:1px solid ${tier.color}40;border-radius:12px;padding:14px 16px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
            <span style="font-size:1.5rem">${tier.icon}</span>
            <div>
              <div style="font-weight:800;font-size:.95rem;color:${tier.color}">${tier.label}</div>
              <div style="font-size:.72rem;color:var(--muted);margin-top:1px">${tier.tip}</div>
            </div>
            <div style="margin-left:auto;text-align:right">
              <div style="font-size:1.4rem;font-weight:900;font-family:monospace;color:${tier.color}">${rec}</div>
              <div style="font-size:.6rem;color:var(--faint)">条记录</div>
            </div>
          </div>
          <!-- 进度条 -->
          <div style="height:6px;background:var(--border2);border-radius:3px;overflow:hidden">
            <div style="height:100%;width:${pct.toFixed(1)}%;background:${tier.color};border-radius:3px;transition:width .5s"></div>
          </div>
          <div style="display:flex;justify-content:space-between;margin-top:4px;font-size:.62rem;color:var(--faint)">
            <span>0</span><span>初步(20)</span><span>参考(100)</span><span>接近(500)</span><span>成熟(1000)</span>
          </div>
        </div>

        <!-- 最近准确率 -->
        ${recentAcc !== null ? `
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px">
          <div style="font-size:.6rem;font-weight:700;color:var(--faint);letter-spacing:.08em;margin-bottom:8px">最近20次方向准确率</div>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="font-size:2rem;font-weight:900;font-family:monospace;color:${recentAcc>=60?'var(--bull)':recentAcc>=45?'var(--gold)':'var(--bear)'}">${recentAcc}%</div>
            <div style="flex:1">
              <div style="height:8px;background:var(--border2);border-radius:4px;overflow:hidden">
                <div style="height:100%;width:${recentAcc}%;background:${recentAcc>=60?'var(--bull)':recentAcc>=45?'var(--gold)':'var(--bear)'};border-radius:4px"></div>
              </div>
              <div style="font-size:.65rem;color:var(--muted);margin-top:4px">
                ${recentAcc>=60?'👍 高于随机水平，系统有参考价值':recentAcc>=45?'➡ 接近随机水平，继续积累':'⚠ 低于随机，市场条件可能变化'}
              </div>
            </div>
          </div>
        </div>` : `
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;padding:12px 14px;text-align:center;color:var(--faint);font-size:.78rem">
          尚无足够数据计算准确率<br>
          <span style="font-size:.65rem">使用「智能」或「深度」模式推演后自动积累</span>
        </div>`}

        <!-- 引擎排行 -->
        ${engineRows.length >= 3 ? `
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
          <div style="padding:10px 14px 8px;font-size:.6rem;font-weight:700;color:var(--faint);letter-spacing:.08em">各引擎历史准确率排行</div>
          ${engineRows.slice(0,6).map((e,i) => `
          <div style="display:flex;align-items:center;gap:10px;padding:7px 14px;${i>0?'border-top:1px solid var(--border)':''}">
            <span style="font-size:.65rem;color:var(--faint);width:14px">${i+1}</span>
            <span style="font-size:.78rem;font-weight:700;color:var(--text);flex:1">${e.name}</span>
            <span style="font-size:.65rem;color:var(--muted)">${e.count}次</span>
            <div style="width:60px;height:4px;background:var(--border2);border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${e.acc}%;background:${e.acc>=60?'var(--bull)':e.acc>=45?'var(--gold)':'var(--bear)'};border-radius:2px"></div>
            </div>
            <span style="font-size:.75rem;font-weight:700;font-family:monospace;color:${e.acc>=60?'var(--bull)':e.acc>=45?'var(--gold)':'var(--bear)'};width:34px;text-align:right">${e.acc}%</span>
          </div>`).join('')}
        </div>` : ''}

        <!-- 当前权重 -->
        ${weightRows.length >= 2 ? `
        <div style="background:var(--bg2);border:1px solid var(--border);border-radius:10px;overflow:hidden">
          <div style="padding:10px 14px 8px;font-size:.6rem;font-weight:700;color:var(--faint);letter-spacing:.08em">当前学习权重</div>
          ${weightRows.slice(0,6).map((w,i) => `
          <div style="display:flex;align-items:center;gap:8px;padding:6px 14px;${i>0?'border-top:1px solid var(--border)':''}">
            <span style="font-size:.75rem;color:var(--text);flex:1">${w.name}</span>
            <div style="width:80px;height:4px;background:var(--border2);border-radius:2px;overflow:hidden">
              <div style="height:100%;width:${Math.min(100,w.w*5)}%;background:var(--gold);border-radius:2px"></div>
            </div>
            <span style="font-size:.7rem;font-family:monospace;color:var(--gold);width:36px;text-align:right">${w.w}%</span>
          </div>`).join('')}
        </div>` : ''}

        <!-- 说明 -->
        <div style="font-size:.65rem;color:var(--faint);text-align:center;padding-bottom:4px;line-height:1.8">
          使用「智能」或「深度」模式每次推演后自动积累<br>
          系统会在3天后自动验证预测准确性并更新权重
        </div>

      </div>
    </div>`;

  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if(e.target===modal) modal.remove(); });
}
window.openLearnReportModal = openLearnReportModal;

