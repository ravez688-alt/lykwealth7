// data.js — 天機數元 · 玄学引擎核心
// 包含：所有常量、天盘数据、十大引擎算法、市场分类
// 必须在 xuanxue.js 之前加载

// ═══════════════════════════════════════════════
// GLOBAL SAFETY: patch toFixed to never throw on undefined/NaN
// ═══════════════════════════════════════════════
(function() {
  const _origToFixed = Number.prototype.toFixed;
  Number.prototype.toFixed = function(digits) {
    if (isNaN(this) || !isFinite(this)) return '0';
    return _origToFixed.call(this, digits);
  };
  window._sf = function(v, d) {
    const n = Number(v);
    if (isNaN(n) || !isFinite(n)) return '0';
    return n.toFixed(d || 0);
  };
  window._n = function(v, fallback) {
    const n = Number(v);
    return (isNaN(n) || !isFinite(n)) ? (fallback || 0) : n;
  };
  // Safe price formatter — handles null/undefined/NaN without throwing
  window._fmtP = function(v) {
    const n = Number(v);
    if (isNaN(n) || !isFinite(n) || n === 0) return '--';
    if (n >= 10000) return '$' + Math.round(n).toLocaleString();
    if (n >= 1)     return '$' + n.toFixed(2);
    if (n >= 0.01)  return '$' + n.toFixed(4);
    return '$' + n.toFixed(6);
  };
})();







// ═══════════════════════════════════════════════
// BG CANVAS
// ═══════════════════════════════════════════════
(function() {
  const c = document.getElementById('bgCanvas');
  if (!c) return; // bgCanvas not present in this UI
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

    // gradient
    const g = ctx.createRadialGradient(W*.3,H*.4,0,W*.3,H*.4,W*.7);
    g.addColorStop(0,'rgba(10,6,30,0.9)');
    g.addColorStop(1,'rgba(2,2,14,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0,0,W,H);

    // grid
    ctx.strokeStyle = 'rgba(200,168,74,0.03)';
    ctx.lineWidth = 1;
    for(let x=0;x<W;x+=64) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
    for(let y=0;y<H;y+=64) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    // stars
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

  window.addEventListener('resize', resize);
  resize(); draw();
})();

// ═══════════════════════════════════════════════
// UTILS
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
// DATA CONSTANTS
// ═══════════════════════════════════════════════
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

// ═══════════════════════════════════════════════
// BIRTH CHART DATABASE (出生命盘)
// ═══════════════════════════════════════════════
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
    gann_sq: 3 // sqrt(9) = 3, 2009年
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
  // ── COMMODITIES ──
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
    gann_price_sq: 35 // 1974年黄金约$175，约sqrt=13，方格约169
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

// ── NATAL RESONANCE ENGINE (命盘共振分析) ──
function engineNatal(coin, date) {
  // 优先用 dashCoins 里配置的 natalKey（如 XAU→GOLD, XAG→SILVER）
  const coinConf  = (window.dashCoins || []).find(c => c.coin === coin);
  const lookupKey = coinConf?.natalKey || coin;
  const nc = NATAL_CHARTS[lookupKey];
  if(!nc) return null;

  const targetDate = new Date(date);
  const birthDate  = new Date(nc.date);

  // Age of asset in years
  const ageYears = (targetDate - birthDate) / (365.25 * 24 * 3600 * 1000);
  const ageDays  = (targetDate - birthDate) / (24 * 3600 * 1000);

  // Jupiter return (every ~11.86 years)
  const jupCycle  = 11.86;
  const jupPhase  = (ageYears % jupCycle) / jupCycle;
  const jupReturn = Math.abs(jupPhase - Math.round(jupPhase)) < 0.08;

  // Saturn return (every ~29.5 years)
  const satCycle  = 29.5;
  const satPhase  = (ageYears % satCycle) / satCycle;
  const satReturn = Math.abs(satPhase - Math.round(satPhase)) < 0.06;

  // Saturn square (every ~7.375 years)
  const satSqPhase = (ageYears % (satCycle/4)) / (satCycle/4);
  const satSquare  = Math.abs(satSqPhase - Math.round(satSqPhase)) < 0.1;

  // Progressed Sun (1 day = 1 year in secondary progressions)
  const progSunDeg = (ageYears * 1) % 360; // ~1 deg/yr
  const progSunSign = ['白羊','金牛','双子','巨蟹','狮子','处女','天秤','天蝎','射手','摩羯','水瓶','双鱼'][Math.floor(progSunDeg/30)];

  // Halving cycle for BTC (if applicable)
  let halvingEffect = '';
  if(nc.halving_dates) {
    nc.halving_dates.forEach(hd => {
      const hdDate = new Date(hd);
      const diff = Math.abs((targetDate - hdDate) / (24*3600*1000));
      if(diff < 180) halvingEffect = diff < 30 ? '当前处于减半窗口期！' : '减半后效应期';
    });
  }

  // Solar arc (same as progressed sun speed)
  const solarArcDeg = ageYears % 360;

  // Seed number (Gann square of birth year)
  const birthYear = birthDate.getFullYear();
  const gannSeedSq = Math.sqrt(birthYear);
  const currentSq  = Math.sqrt(targetDate.getFullYear());
  const gannYearArc = (currentSq - gannSeedSq) * (currentSq - gannSeedSq);

  // Resonance strength
  const r = rng(seed(date,coin,8888));
  let resonance = 0.4 + r()*0.3;
  if(jupReturn) resonance += 0.2;
  if(satReturn) resonance += 0.15;
  if(satSquare) resonance += 0.1;
  if(halvingEffect) resonance += 0.15;
  resonance = Math.min(1, resonance);

  // Bias from natal planets
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

// Harmonic patterns
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

// Fibonacci ratios
const FIBS = [0.236, 0.382, 0.5, 0.618, 0.786, 1.0, 1.272, 1.414, 1.618, 2.0, 2.618];

// ═══════════════════════════════════════════════
// ENGINES
// ═══════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
// 奇门遁甲引擎 — 真实局数推算（无随机数）
// 算法：① 节气定阴阳遁 ② 旬首定局数 ③ 时辰定值符宫
//       ④ 九星/八门/八神顺逆布宫 ⑤ 门神星属性定吉凶偏向
// ══════════════════════════════════════════════════════════════════
function engineQiMen(coin, date) {
  const d = new Date(date);
  const yr = d.getFullYear();
  const mo = d.getMonth() + 1;
  const dy = d.getDate();
  const hr = d.getHours() || 12;

  // 24节气近似日期 [月, 日]
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

  // 找当前所属节气序号
  let jqIdx = 0;
  for (let i = 0; i < 24; i++) {
    const [jqMo, jqDy] = JIEQI_DATES[i];
    if (mo > jqMo || (mo === jqMo && dy >= jqDy)) jqIdx = i;
  }

  // 阳遁（冬至→夏至）/ 阴遁（夏至→冬至）
  const isYang = (jqIdx >= 23 || jqIdx < 11);

  // 局数1-9：每节气管3局，旬（上/中/下）决定偏移
  const dayOffset = Math.floor((dy - 1) / 10) % 3;
  const juNum = ((jqIdx % 3) * 3 + dayOffset) % 9 + 1;

  // 时辰序号（子=0…亥=11）
  const shiIdx = Math.floor(((hr + 1) % 24) / 2);

  // 值符宫（阳遁顺转，阴遁逆转）
  const zhiFuGong = isYang
    ? ((juNum - 1 + shiIdx) % 9) + 1
    : ((9 - (juNum - 1 + shiIdx) % 9) % 9) + 1;

  // 八门/九星/八神入宫（去掉5中宫）
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

  // 年干支
  const stemIdx   = ((yr - 4) % 10 + 10) % 10;
  const branchIdx = ((yr - 4) % 12 + 12) % 12;
  const stem      = STEMS[stemIdx];
  const branch    = BRANCHES[branchIdx];
  const bagua     = BAGUA[zhiFuGong % 8];

  // 吉凶判断（门→神→星叠加，阳/阴遁微调）
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

  // ── 奇门专属：进出时机（职责：时间窗口，不预测价格）────────────────────
  const SHICHEN      = ['子时','丑时','寅时','卯时','辰时','巳时','午时','未时','申时','酉时','戌时','亥时'];
  const SHICHEN_UTC8 = ['07:00','09:00','11:00','13:00','15:00','17:00','19:00','21:00','23:00','01:00','03:00','05:00']; // UTC+8
  // 吉门→对应入市时辰索引；凶门→对应出市时辰索引
  const ENTRY_MAP = { '开门':8,'生门':2,'休门':0,'景门':6 };
  const EXIT_MAP  = { '死门':6,'惊门':9,'伤门':3,'杜门':4 };
  const entryShiIdx = (ENTRY_MAP[door] !== undefined) ? ENTRY_MAP[door] : (zhiFuGong + 2) % 12;
  const exitShiIdx  = (EXIT_MAP[door]  !== undefined) ? EXIT_MAP[door]  : (zhiFuGong + 8) % 12;
  const goodTimes   = [SHICHEN[entryShiIdx], SHICHEN[(entryShiIdx + 4) % 12]];
  const badTimes    = [SHICHEN[exitShiIdx]];
  const entryTime   = SHICHEN[entryShiIdx]  + '（≈' + SHICHEN_UTC8[entryShiIdx]  + ' UTC+8）';
  const exitTime    = SHICHEN[exitShiIdx]   + '（≈' + SHICHEN_UTC8[exitShiIdx]   + ' UTC+8）';
  // 奇门方向：多/空/观望（供时间轴显示，不参与价格综合计算）
  const direction   = bias > 0.3 ? '多' : bias < -0.3 ? '空' : '观望';

  return {
    // 兼容字段（旧UI继续正常工作）
    palace, star, door, god, stem, branch, bagua, bias, conf, format,
    isYang, juNum, jieqi: JIEQI_NAMES[jqIdx], zhiFuGong,
    // 奇门专属：时间窗口字段
    entryTime,    // 吉门入市时辰
    exitTime,     // 凶门出市时辰
    goodTimes,    // 今日吉时列表
    badTimes,     // 今日凶时列表
    direction,    // 综合方向：多/空/观望
    confidence: conf,
  };
}

// ══════════════════════════════════════════════════════════════════
// 易经引擎 — 数字卦法（年月日时起卦，无随机数）
// 算法：① (年+月+日) mod 8 → 上卦  ② (年+月+日+时) mod 8 → 下卦
//       ③ 查六十四卦表 ④ (年+月+日+时) mod 6 + 1 → 动爻
//       ⑤ 动爻取反 → 变卦  ⑥ 卦象吉凶 + 月份 → 偏向
// ══════════════════════════════════════════════════════════════════
function engineIChing(coin, date) {
  const d   = new Date(date);
  const yr  = d.getFullYear();
  const mo  = d.getMonth() + 1;
  const dy  = d.getDate();
  const hr  = d.getHours() || 12;
  const shi = Math.floor(((hr + 1) % 24) / 2); // 时辰 0-11

  // 上卦、下卦（先天八卦序：乾兑离震巽坎艮坤 → 0-7）
  const upperIdx = ((yr + mo + dy) % 8 + 8) % 8;
  const lowerIdx = ((yr + mo + dy + shi) % 8 + 8) % 8;
  const XIAN_BAGUA = ['☰乾','☱兑','☲离','☳震','☴巽','☵坎','☶艮','☷坤'];
  const XIAN_TIAN  = ['乾','兑','离','震','巽','坎','艮','坤'];
  const upper = XIAN_BAGUA[upperIdx];
  const lower = XIAN_BAGUA[lowerIdx];

  // 六十四卦索引表（行=下卦，列=上卦，先天序）
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

  // 动爻 1-6
  const line = ((yr + mo + dy + shi) % 6) + 1;

  // 变卦（动爻位取反）
  const rhexIdx = Math.min(63, hexIdx ^ (1 << (line - 1)));
  const rhex    = HEXAGRAMS[rhexIdx];

  // 吉凶卦集合
  const BULL_HEX = new Set([0,13,10,12,33,34,15,41,45,48,14,17,16]);
  const BEAR_HEX = new Set([1,11,38,46,29,44,22,35,55,47,39,23,63]);

  let bias = 0;
  if (BULL_HEX.has(hexIdx))  bias += 0.50;
  if (BEAR_HEX.has(hexIdx))  bias -= 0.50;
  if (BULL_HEX.has(rhexIdx)) bias += 0.20;
  if (BEAR_HEX.has(rhexIdx)) bias -= 0.20;

  // 动爻位置修正
  if (line === 1 || line === 6) bias *= 1.25;  // 初上爻：变化剧烈
  if (line === 2 || line === 5) bias *= 0.80;  // 二五中正：趋于平和

  // 月份消息卦修正（农历近似）
  const MONTH_BIAS = [0.2,0.1,0.15,0.2,0.1,0.3,-0.1,-0.15,-0.2,-0.1,-0.2,-0.3];
  bias += (MONTH_BIAS[mo - 1] || 0) * 0.3;
  bias = Math.max(-1, Math.min(1, bias));

  const strongHex = BULL_HEX.has(hexIdx) || BEAR_HEX.has(hexIdx);
  const conf      = strongHex ? 0.65 + Math.min(0.25, Math.abs(bias) * 0.35) : 0.45;
  const judgment  = bias > 0.35 ? '大吉' : bias > 0.1 ? '小吉' : bias < -0.35 ? '大凶' : bias < -0.1 ? '小凶' : '平';

  // ── 易经专属：趋势周期（职责：周期判断，不预测价格）──────────────────
  // 趋势方向：由卦象阴阳属性决定
  const trend = bias > 0.2 ? '上升' : bias < -0.2 ? '下跌' : '震荡';
  // 变化在第几天：动爻位置 × 月份系数（阴阳爻理论：初爻当日，上爻一月）
  const CHANGE_DAYS = [1, 3, 7, 14, 21, 30];
  const changeDay  = CHANGE_DAYS[line - 1] || line;
  // 卦象描述
  const hexName    = hex[1] + '卦';
  const changeHex  = rhex[1] + '卦';

  return {
    // 兼容字段（旧UI继续正常工作）
    hex, line, rhex, upper, lower, bias, conf, judgment,
    hexIdx, rhexIdx, upperName: XIAN_TIAN[upperIdx], lowerName: XIAN_TIAN[lowerIdx],
    // 易经专属：趋势周期字段
    trend,        // 卦象趋势：上升/下跌/震荡
    changeDay,    // 动爻预示变化在第几天后出现
    hexagram: hexName,     // 本卦名称
    changingHex: changeHex, // 变卦名称
    confidence: conf,
  };
}

// ══════════════════════════════════════════════════════════════════
// 印度占星引擎 — 行星周期（职责：大周期判断，不预测价格）
// 已保留原始逻辑；新增专属字段：cycle / energy / planet
// ══════════════════════════════════════════════════════════════════
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

  // ── 印度占星专属：大周期字段（职责：宏观周期，不预测具体价格）──────
  // 周期判断：由大运（dasha）主导行星决定
  const EXPAND_PLANETS = ['木星','金星','太阳','月亮'];
  const CONTRACT_PLANETS = ['土星','罗睺','计都','火星'];
  const cycle = EXPAND_PLANETS.includes(dasha) ? '扩张' :
                CONTRACT_PLANETS.includes(dasha) ? '收缩' : '过渡';
  // 能量值 0-100（由偏向映射）
  const energy = Math.round((bias + 1) / 2 * 100);
  // 主导行星（大运星）
  const planet = dasha;
  // 周期说明
  const cycleNote = cycle === '扩张'
    ? `${dasha}大运·扩张期，趋势性行情偏多，可顺势持有`
    : cycle === '收缩'
    ? `${dasha}大运·收缩期，回调风险增大，注意止损`
    : `${dasha}大运·过渡期，方向尚不明朗，轻仓观望`;

  return {
    // 兼容字段（旧UI继续正常工作）
    asc, moon, lord, trans, dasha, antar, yoga, rasi, bias, conf,
    // 印度占星专属：大周期字段
    cycle,      // 周期类型：扩张/收缩/过渡
    energy,     // 能量值 0-100
    planet,     // 主导行星（大运）
    cycleNote,  // 周期说明文字
    confidence: conf,
  };
}

// ════════════════════════════════════════════════════════════════════════
// 江恩引擎 v2 ── Square of Nine + Angles + Price Multiples
// ════════════════════════════════════════════════════════════════════════

// ── 1. 江恩九方格 (Square of Nine) ──────────────────────────────────────
// 数字在螺旋方格中的角度：angle = sqrt(n) * 180 (deg), mod 360
// 给定价格 P，找同一角度线上（相差 360° 整数倍）的其他价格
function gannSquareOfNine(price, extendLevels = 8) {
  const sqP   = Math.sqrt(price);
  const angle = (sqP % 2) * 180;               // 0–360° position on the spiral

  const levels = [];
  // Walk outward: same angle = sqP ± n*2 → price = (sqP ± n*2)²
  // n*2 because one full revolution of the square = increment of 2 in sqrt space
  for (let n = -extendLevels; n <= extendLevels; n++) {
    if (n === 0) continue;
    const gannStep = parseFloat(localStorage.getItem('gann_step') || '2');
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

  // Cardinal angles (0°/90°/180°/270°) on adjacent rings — extra confluence
  // These are the "cross" prices on the Square of Nine
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

// ── 2. 江恩角度线 (Gann Angles) ─────────────────────────────────────────
// 以底部价格 base 为原点，计算 t 天后各角度线的动态价位
// 角度比率（price units per time unit）：
//   1×8 = 82.5°, 1×4 = 75°, 1×3 ≈ 71.6°, 1×2 = 63.4°, 1×1 = 45°,
//   2×1 = 26.6°, 3×1 ≈ 18.4°, 4×1 = 14.0°, 8×1 = 7.1°
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
  // "Scale factor" for the 1×1 line: sqrt(basePrice) gives natural price unit
  // so Δprice per day = ratio * scale
  const scale = Math.sqrt(basePrice);

  return GANN_ANGLE_RATIOS.map(a => {
    const priceAtT = basePrice + a.ratio * scale * daysFromBase;
    const pct      = ((priceAtT - targetPrice) / targetPrice * 100).toFixed(2);
    const isAbove  = priceAtT > targetPrice;
    const dist     = Math.abs(priceAtT - targetPrice);
    const proximity= (1 - Math.min(1, dist / targetPrice)).toFixed(3); // closeness 0–1
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

// ── 3. 江恩价格倍数目标 (Price Multiples) ───────────────────────────────
// 用前高前低乘以江恩比率推算目标价
// 江恩比率：1/8, 1/4, 3/8, 1/2, 5/8, 2/3, 3/4, 1, 4/3, 3/2, 2, 3, 4, 8
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
    // From high
    const fromH = high * m.mult;
    if (fromH > 0) targets.push({
      price:   Math.round(fromH * 100) / 100,
      source:  '前高' + m.label,
      mult:    m.mult,
      isAbove: fromH > currentPrice,
      pct:     parseFloat(((fromH - currentPrice) / (currentPrice||1) * 100).toFixed(2)),
    });
    // From low
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

// ── Full Gann Engine (replaces old engineGann) ───────────────────────────
// ════════════════════════════════════════════════════════════════════════
// 市场状态分类器
// 根据K线历史数据计算ADX/ATR/均线排列，返回当前市场状态
// 状态: trending_up | trending_down | ranging | high_volatility
// ════════════════════════════════════════════════════════════════════════
function classifyMarketState(klines) {
  // klines: Binance K线数组 [[open_time, open, high, low, close, volume, ...], ...]
  // 至少需要20根K线
  if (!klines || klines.length < 20) {
    return { state: 'ranging', label: '震荡市', atr: 0, adx: 0, trend: 0 };
  }

  const closes = klines.map(k => parseFloat(k[4]));
  const highs  = klines.map(k => parseFloat(k[2]));
  const lows   = klines.map(k => parseFloat(k[3]));
  const n      = closes.length;

  // ── 1. ATR（Average True Range）波动率 ──────────────────────────────
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
  const atrPct = atr / closes[n-1] * 100;  // ATR 占价格百分比

  // ── 2. ADX（趋势强度）简化计算 ───────────────────────────────────────
  const dmPlusList  = [], dmMinusList = [];
  for (let i = 1; i < n; i++) {
    const upMove   = highs[i]  - highs[i-1];
    const downMove = lows[i-1] - lows[i];
    dmPlusList.push( upMove   > downMove && upMove   > 0 ? upMove   : 0);
    dmMinusList.push(downMove > upMove   && downMove > 0 ? downMove : 0);
  }
  // Smooth DM+, DM-, ATR over 14 periods
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

  // ── 3. 均线排列（5/20/60 EMA）─────────────────────────────────────────
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

  // 多头排列: 价格 > EMA5 > EMA20 > EMA60
  const bullAlign = price > e5 && e5 > e20 && e20 > e60;
  // 空头排列: 价格 < EMA5 < EMA20 < EMA60
  const bearAlign = price < e5 && e5 < e20 && e20 < e60;
  // 趋势方向
  const trend = e5 > e20 ? 1 : -1;  // +1 上升趋势, -1 下降趋势

  // ── 4. 综合判断市场状态 ─────────────────────────────────────────────
  let state, label;
  if (atrPct > 5) {
    // ATR > 5%：高波动
    state = 'high_volatility';
    label = '高波动';
  } else if (adx > 25 && bullAlign) {
    // ADX > 25 + 多头排列：上升趋势
    state = 'trending_up';
    label = '上升趋势';
  } else if (adx > 25 && bearAlign) {
    // ADX > 25 + 空头排列：下降趋势
    state = 'trending_down';
    label = '下降趋势';
  } else {
    // ADX < 25：震荡市
    state = 'ranging';
    label = '震荡市';
  }

  return { state, label, atrPct: atrPct.toFixed(2), adx: adx.toFixed(1), trend,
           bullAlign, bearAlign, e5, e20, e60 };
}

// ── 状态感知权重管理 ──────────────────────────────────────────────────────
// 每种市场状态有独立的模型权重
const DEFAULT_WEIGHTS_BY_STATE = {
  trending_up:     { gann: 0.40, chan: 0.30, sr: 0.20, harmonic: 0.10 },
  trending_down:   { gann: 0.35, chan: 0.35, sr: 0.20, harmonic: 0.10 },
  ranging:         { gann: 0.25, chan: 0.25, sr: 0.35, harmonic: 0.15 },
  high_volatility: { gann: 0.20, chan: 0.20, sr: 0.30, harmonic: 0.30 },
};

function getWeightsByState(state) {
  // 从 localStorage 读取该状态的学习权重，否则用默认值
  const stored = localStorage.getItem('weights_' + state);
  const base   = DEFAULT_WEIGHTS_BY_STATE[state] || DEFAULT_WEIGHTS_BY_STATE.ranging;
  if (!stored) return { ...base };
  try {
    const parsed = JSON.parse(stored);
    // 合并存储的权重（归一化）
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

// 当前推演的市场状态（由 runDashboard 设置，供其他函数读取）
let _currentMarketState = { state: 'ranging', label: '震荡市' };

// ── 江恩步长最优化（通过历史误差找最优 step）─────────────────────────────
// 测试 step 值范围 [1.0, 3.0]，找使预测误差最小的步长
// historyData: [{ date, price, actualPrice3d }] 至少10条
function calculateOptimalStep(historyData) {
  if (!historyData || historyData.length < 5) {
    return parseFloat(localStorage.getItem('gann_step') || '2');
  }
  let bestStep = 2, bestErr = Infinity;
  for (let step = 1.0; step <= 3.5; step += 0.25) {
    let totalErr = 0;
    historyData.forEach(({ price, actualPrice3d }) => {
      if (!price || !actualPrice3d) return;
      const sqP  = Math.sqrt(price);
      // 最近上方方格位
      const next = Math.pow(sqP + step, 2);
      const err  = Math.abs(next - actualPrice3d) / actualPrice3d;
      totalErr  += err;
    });
    const avgErr = totalErr / historyData.length;
    if (avgErr < bestErr) { bestErr = avgErr; bestStep = step; }
  }
  console.log(`最优江恩步长: ${bestStep}（误差 ${(bestErr*100).toFixed(2)}%）`);
  localStorage.setItem('gann_step', bestStep.toString());
  return bestStep;
}

// ── 缠论分型窗口最优化 ────────────────────────────────────────────────────
function calculateOptimalFractalWindow(historyData) {
  if (!historyData || historyData.length < 5) {
    return parseInt(localStorage.getItem('chan_fractal_window') || '1');
  }
  // 窗口 1-3：较小窗口敏感但多噪声，较大窗口稳定但滞后
  // 用方向准确率评估
  let bestW = 1, bestAcc = 0;
  for (let w = 1; w <= 3; w++) {
    let correct = 0;
    historyData.forEach(({ date, coin, price, high, low, actualDir }) => {
      if (!price) return;
      // 临时存储窗口值
      localStorage.setItem('chan_fractal_window', w.toString());
      const ch  = engineChan(coin || 'BTC', date || '2024-01-01', price, high || price*1.1, low || price*0.9, 0);
      const dir = ch.biDir === 'up' ? 'bull' : 'bear';
      if (dir === actualDir) correct++;
    });
    const acc = correct / historyData.length;
    if (acc > bestAcc) { bestAcc = acc; bestW = w; }
  }
  console.log(`最优缠论分型窗口: ${bestW}（方向准确率 ${(bestAcc*100).toFixed(1)}%）`);
  localStorage.setItem('chan_fractal_window', bestW.toString());
  return bestW;
}

// ── 从误差记录中提取历史数据，批量运行参数优化 ───────────────────────────
function runParamOptimization() {
  const errors = JSON.parse(localStorage.getItem('err_price') || '[]');
  if (errors.length < 5) {
    alert('需要至少5条误差记录才能运行参数优化\n请先完成历史回测');
    return;
  }
  // 构建优化用数据：{ price, actualPrice3d, date }
  const histData = errors
    .filter(e => e.predicted && e.actual)
    .map(e => ({
      date:          e.date,
      price:         e.predicted,  // 预测时的价格（接近入场价）
      actualPrice3d: e.actual,
      actualDir:     e.actual > e.predicted ? 'bull' : 'bear',
    }));

  const bestStep = calculateOptimalStep(histData);
  const bestWin  = calculateOptimalFractalWindow(histData);

  // 更新面板显示
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
  
  // ========== 真正的江恩九方格 ==========
  const sqrtP = Math.sqrt(P);
  const angle = (sqrtP % 2) * 180; // 当前在螺旋上的角度（0-360°）
  
  // 计算关键支撑阻力位（同一角度线上的价格）
  const levels = [];
  for (let n = -8; n <= 8; n++) {
    if (n === 0) continue;
    // gannStep: 九方格步长。默认=2（标准一圈），可通过误差回测优化
    // 从 localStorage 读取，允许手动/自动校准
    const gannStep    = parseFloat(localStorage.getItem('gann_step') || '2');
    const sqrtLevel   = sqrtP + n * gannStep; // 参数化步长
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
  
  // 按距离当前价格排序
  levels.sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct));
  
  // ========== 江恩角度线 ==========
  const scale = Math.sqrt(L); // 价格单位
  // 从起点到目标日的天数
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
  
  // ========== 计算偏向 ==========
  // 角度线位置判断
  const aboveAngles = angles.filter(a => a.isAbove).length;
  const angleBias = (aboveAngles / angles.length) * 2 - 1; // -1 到 1
  
  // 九方格最近位置判断
  const nearestAbove = levels.find(l => l.isAbove);
  const nearestBelow = levels.find(l => !l.isAbove);
  let squareBias = 0;
  if (nearestAbove && nearestBelow) {
    const distToAbove = Math.abs(nearestAbove.pct);
    const distToBelow = Math.abs(nearestBelow.pct);
    squareBias = (distToBelow - distToAbove) / (distToAbove + distToBelow);
  }
  
  // 综合偏向（角度线60% + 九方格40%）
  const bias = angleBias * 0.6 + squareBias * 0.4;
  
  // ========== 置信度计算 ==========
  // 基于价格在方格中的位置和角度线距离
  const nearestLevel = levels[0];
  const nearestAngle = angles.sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct))[0];
  
  const levelConf = nearestLevel ? Math.max(0, 0.7 - Math.abs(nearestLevel.pct) / 20) : 0.5;
  const angleConf = nearestAngle ? Math.max(0, 0.7 - Math.abs(nearestAngle.pct) / 20) : 0.5;
  
  const confidence = Math.min(0.95, (levelConf + angleConf) / 2);
  
  // 最接近当前价的角度线（用于 UI 显示）
  const sortedAngles   = [...angles].sort((a, b) => Math.abs(a.pct) - Math.abs(b.pct));
  const closestAngle   = sortedAngles[0];

  // s9 Cardinal levels（九方格四正位：0°/90°/180°/270°）
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

  // 价格倍数目标（前高前低 × 江恩比率）
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
    // ── 核心字段 ──
    sqrtP:       sqrtP.toFixed(4),
    sqP:         sqrtP.toFixed(4),   // 别名（buildGannPanel 用 gn.sqP）
    angle:       angle.toFixed(1),
    levels:      levels.slice(0, 16),
    angles,
    P, H, L,
    daysFromBase,
    multiples,          // 价格倍数目标
    cardinalLevels,     // 四正位（顶层兼容）
    // ── 兼容字段（buildGannPanel / drawGannCanvas 所需）──
    activeAng:   closestAngle?.deg ?? 45,
    cycAngle:    angle.toFixed(1),
    cycle:       daysFromBase,
    res:         levels.filter(l =>  l.isAbove).slice(0, 5),
    sup:         levels.filter(l => !l.isAbove).slice(0, 5),
    // s9：完整九方格摘要（含 cardinalLevels）
    s9: {
      sqP:           sqrtP.toFixed(4),
      angle:         angle.toFixed(1),
      levels:        levels.slice(0, 8),
      cardinalLevels: cardinalLevels.slice(0, 24),
    },

    // ── 区间输出（Layer 4：从点到区间）─────────────────────────────────
    // 支撑区间：最近两个支撑位之间的价格带
    supportZone: (() => {
      const sups = levels.filter(l => !l.isAbove).slice(0, 2);
      if (sups.length >= 2) return { low: sups[1].price, high: sups[0].price };
      if (sups.length === 1) return { low: sups[0].price * 0.995, high: sups[0].price };
      return null;
    })(),
    // 阻力区间：最近两个阻力位之间的价格带
    resistanceZone: (() => {
      const ress = levels.filter(l => l.isAbove).slice(0, 2);
      if (ress.length >= 2) return { low: ress[0].price, high: ress[1].price };
      if (ress.length === 1) return { low: ress[0].price, high: ress[0].price * 1.005 };
      return null;
    })(),
    // 入场区间（当前价附近±1个步长内）
    entryZone: (() => {
      const gStep = parseFloat(localStorage.getItem('gann_step') || '2');
      const sqP   = Math.sqrt(P);
      return {
        low:  Math.round(Math.pow(sqP - gStep * 0.5, 2) * 100) / 100,
        high: Math.round(Math.pow(sqP + gStep * 0.5, 2) * 100) / 100,
      };
    })(),
  };
}
// ── 江恩时间价格目标自动推算引擎 ────────────────────────────────────────
// 全自动：根据当前价/高低点/基准日期推算角度线目标、目标日期、修正目标
function engineGannTime(date, price, high, low) {
  const P  = price || 50000;
  const H  = high  || P * 1.15;
  const L  = low   || P * 0.85;
  const baseD = new Date(date);

  const range = H - L;                          // 波动幅度
  const rangePct = range / L;                   // 幅度百分比

  // ── 1. 角度线强弱判断（基于价格位置，不用平方根角度）──────────────────
  // 当前价在高低点区间的相对位置
  const posInRange = (P - L) / range;           // 0=前低，1=前高，>1=突破前高

  // 角度线强弱：看当前价相对于前高的位置
  // 完好：价格高于前高的80% → 仍在强势区
  // 偏弱：价格在前高50%-80% → 走弱
  // 失效：价格低于前高50% → 已跌破
  const angleStrength =
    P >= H * 0.92 ? 'intact' :
    P >= H * 0.80 ? 'fading' : 'weak';

  const angleLabel =
    angleStrength === 'intact' ? '角度线完好 · 目标有效' :
    angleStrength === 'fading' ? '角度线偏弱 · 目标下修' :
                                 '已跌破角度线 · 原目标失效';

  // ── 2. 原目标 AT（强势1×1角度线，前高×1.272黄金扩展）──────────────────
  // 限制：目标价不能超过当前价的 50%（单波段不现实）
  const AT_raw = Math.round(H * 1.272);
  const AT = Math.min(AT_raw, Math.round(P * 1.50));

  // ── 3. 修正目标 AR（跌破后按走势强弱下修）──────────────────────────────
  const AR_raw =
    angleStrength === 'intact' ? AT :
    angleStrength === 'fading' ? Math.round(H * 1.05) :
                                 Math.round(H * 1.00);
  // 修正目标同样限制在当前价 ±40% 内
  const AR = Math.min(AR_raw, Math.round(P * 1.40));

  // ── 4. 目标日期（合理范围：14-365天）────────────────────────────────────
  // 幅度越大需要越多时间；同时按目标与当前价的距离校正
  // 每涨10%约需30天（保守估算）
  const pctToTarget = Math.abs(AR - P) / P;
  const baseDays = Math.round((pctToTarget / 0.10) * 30);
  const multiplier = angleStrength === 'intact' ? 1.0 : angleStrength === 'fading' ? 1.5 : 2.0;
  // 最少14天（不可能明天就到），最多365天
  const daysToTarget = Math.min(365, Math.max(14, Math.round(baseDays * multiplier)));

  const targetD = new Date(baseD);
  targetD.setDate(targetD.getDate() + daysToTarget);

  // ── 5. 关键时间节点（按黄金比例切分）──────────────────────────────────
  const keyRatios = [0.25, 0.5, 0.618, 0.786, 1.0];
  const keyDays = keyRatios.map(r => Math.max(1, Math.round(daysToTarget * r)));

  const keyNodes = keyDays.map(d => {
    const dt = new Date(baseD);
    dt.setDate(dt.getDate() + d);
    // 线性插值价格（从当前价到修正目标）
    const projPrice = Math.round(P + (AR - P) * (d / daysToTarget));
    return { days: d, date: dt, price: projPrice };
  });

  // ── 6. 次高点（背驰后回落幅度约3-6%）──────────────────────────────────
  const subHighA = Math.round(AR * 0.97);
  const subHighB = Math.round(AR * 0.94);

  const gapFromOriginal = ((AT - P) / P * 100).toFixed(1);
  const gapFromRevised  = ((AR - P) / P * 100).toFixed(1);

  // ── 7. 推演路径 ──────────────────────────────────────────────────────────
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

  // ── Bear target: project downward from current low ──
  const AB = Math.round(L - (H - L) * 0.382);   // 下行目标：前低再跌38.2%幅度

  return {
    P, H, L, AT, AR, AB,
    daysToTarget, targetD,
    angleStrength, angleLabel,
    rangePct: ((rangePct||0) * 100).toFixed(1),
    gapFromOriginal, gapFromRevised,
    scenario, subHighA, subHighB,
    dailyGain: ((AR - P) / (daysToTarget||1)).toFixed(0),
    keyNodes,
    // legacy fields for display
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
    const completion = r2()*0.4 + 0.55; // 55-95% complete

    // Points
    const X = bullish ? L : H;
    const A = bullish ? H : L;
    const B = bullish ? A - range*h.xab : A + range*h.xab;
    const C = bullish ? B + range*h.abc : B - range*h.abc;
    const D = bullish ? B - range*h.bcd*0.3 : B + range*h.bcd*0.3; // target
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

  // Psychological / round number levels
  const mag = P >= 10000 ? 1000 : P >= 1000 ? 100 : P >= 100 ? 10 : P >= 10 ? 1 : 0.1;
  const base = Math.round(P / mag) * mag;
  for(let i=-10; i<=10; i++) {
    if(i===0) continue;
    const lp = base + i*mag;
    if(lp > 0 && Math.abs(lp-P)/P > 0.003)
      levels.push({ price:+lp.toFixed(4), type:lp>P?'res':'sup', method:'心理价位', strength:0.45+r()*0.3 });
  }

  // Gann square levels (江恩方格)
  const sqP = Math.sqrt(P);
  for(let i=-6; i<=6; i++) {
    if(i===0) continue;
    const lp = Math.pow(sqP + i*0.5, 2);
    if(lp > 0 && Math.abs(lp-P)/P > 0.003)
      levels.push({ price:Math.round(lp*100)/100, type:lp>P?'res':'sup', method:'江恩方格', strength:0.55+r()*0.3 });
  }

  // Swing high/low derived levels
  if(H > P) levels.push({ price:Math.round(H), type:'res', method:'近期高点', strength:0.75 });
  if(L < P) levels.push({ price:Math.round(L), type:'sup', method:'近期低点', strength:0.75 });
  // Mid-range
  const mid = Math.round((H+L)/2);
  if(mid > P) levels.push({ price:mid, type:'res', method:'区间中轴', strength:0.5+r()*0.2 });
  if(mid < P) levels.push({ price:mid, type:'sup', method:'区间中轴', strength:0.5+r()*0.2 });

  // Deduplicate
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

  // ── 区间聚合：将相近的支撑/阻力位合并成区间 ───────────────────────
  // 阈值：价格差 < 1.5% 的视为同一区间
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
    // 区间输出（Layer 4：从点到区间）
    supZones,   // 支撑区间列表 [{low, high, mid, strength}]
    resZones,   // 阻力区间列表
    // 最优入场区间（最近支撑区间 ~ 当前价）
    entryZone: supZones[0]
      ? { low: supZones[0].low, high: Math.min(P, supZones[0].high * 1.005) }
      : null,
  };
}

// ═══════════════════════════════════════════════
// TP / SL ENGINE (止盈 / 止损推算)
// ═══════════════════════════════════════════════
function engineTPSL(coin, date, price, high, low, engines) {
  const P = Number(price) || 50000;
  const H = Number(high)  || P * 1.15;
  const L = Number(low)   || P * 0.85;
  const { sr, gn, ch, hr, nt } = engines || {};

  // ── 1. ATR计算（真实波幅百分比）─────────────────────────────────────
  const atrAbs = H - L;
  const atrPct = atrAbs / P;            // 小数形式，如 0.035 = 3.5%
  const atrPctStr = (atrPct * 100).toFixed(1) + '%';

  // ── 2. 动态倍数（根据波动率自动调整）────────────────────────────────
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

  // ── 3. 方向判断（与原有逻辑一致）────────────────────────────────────
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

  // ── 4. 五档止盈计算 ──────────────────────────────────────────────────
  // 基础ATR倍数梯度
  const TP_MULTS    = [1.5, 2.0, 2.5, 3.0, tpMult];
  const TP_LABELS   = ['TP1 保守', 'TP2 稳健', 'TP3 均衡', 'TP4 进取', 'TP5 终极'];
  const TP_SOURCES  = ['ATR×1.5', 'ATR×2.0', 'ATR×2.5', 'ATR×3.0', `ATR×${tpMult}(${volatilityLabel})`];

  // 江恩阻力位（供TP取较大值）
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

  // 做多：TP = max(ATR×mult, 下一个阻力位)；做空反向
  const tpLevelsRaw = TP_MULTS.map((m, i) => {
    const atrTarget = isShort
      ? P * (1 - atrPct * m)
      : P * (1 + atrPct * m);
    // 取与关键位的较优值（做多取较大，做空取较小）
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

  // ── 5. 止损计算 ──────────────────────────────────────────────────────
  // SL = min(ATR×slMult, 下一个支撑位) 取更紧的
  const atrSL = isShort
    ? P * (1 + atrPct * slMult)
    : P * (1 - atrPct * slMult);

  let slPrice = atrSL;
  if (!isShort && gannSupport.length) {
    const nearSup = gannSupport[0];
    // 取较小的（更紧的止损保护资金）
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

  // ── 6. 加入RRR到TP层 ────────────────────────────────────────────────
  const tpWithRRR = tpLevelsRaw.map(tp => {
    const reward = Math.abs(tp.price - P);
    const rrr    = risk > 0 ? (reward / risk).toFixed(2) : '∞';
    const pct    = ((reward / P) * 100).toFixed(2);
    return { ...tp, reward: smartR(reward), rrr, pct };
  });

  // 首要TP做RRR汇总
  const primaryRRR = risk > 0 ? (Math.abs(tpLevelsRaw[4].price - P) / risk).toFixed(2) : '∞';

  // ── 7. 凯利公式建议仓位 ─────────────────────────────────────────────
  const errors = window.tracker?.priceErrors || [];
  const recentN = Math.min(50, errors.length);
  const recent  = errors.slice(-recentN);
  const wins    = recent.filter(e=>e.dirCorrect).length;
  const p_win   = recentN > 5 ? wins / recentN : 0.55;  // 默认55%
  const p_lose  = 1 - p_win;
  const b       = parseFloat(primaryRRR) || 2.0;         // 盈亏比
  const kelly_f = (p_win * b - p_lose) / b;
  // 半凯利，最大25%
  const positionPct = Math.max(0, Math.min(25, Math.round(kelly_f * 0.5 * 100)));

  // ── 8. 入场区间 ──────────────────────────────────────────────────────
  const entryZone = isShort
    ? { low: smartR(P * 0.998), high: smartR(P * 1.015) }
    : { low: smartR(P * 0.985), high: smartR(P * 1.002) };

  return {
    // 原有兼容字段
    P, tpLevels: tpWithRRR, slLevels, primarySL,
    risk: smartR(risk), atrPct: (atrPct*100).toFixed(1), atrAbs: smartR(atrAbs),
    avgBias, signal, isShort, entryZone,
    weightCalibrated: (window.tracker?.priceErrors?.length || 0) >= 10,

    // 新增规范字段（符合需求文档格式）
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
// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// GANN TP/SL ENGINE — 五档江恩九方格止盈止损
// 以江恩九方格 (Square of Nine) 六大角度位为唯一锚点
// ═══════════════════════════════════════════════

// 计算给定基准价 P 的江恩九方格关键位
function gannS9Levels(P) {
  const sqP = Math.sqrt(P);
  const levels = [];
  // 每整圈 = +2 in √P space；关键分割角：45°=0.25圈, 90°=0.5, 135°=0.75, 180°=1.0, 360°=2.0
  const angFracs = [0.25, 0.5, 0.75, 1.0, 1.5, 2.0, 3.0];
  angFracs.forEach(f => {
    const up   = Math.round(Math.pow(sqP + f * 2, 2));
    const down = Math.round(Math.pow(Math.max(sqP - f * 2, 0.01), 2));
    levels.push({ up, down, label: `${Math.round(f*360)}°`, frac: f });
  });
  return levels;
}


// 核心：以任意价格 baseP 为当前价，计算 5 档 TP/SL
// baseP 可以是当前价，也可以是节点预测价 — 这样每节点不同
function calcGannFibTPSL(baseP, H, L, engines, isLong) {
  const P = baseP;

  const { gn, ch, sr } = engines || {};

  // ── 江恩九方格角度位 ──
  const s9 = gannS9Levels(P);
  const s9Up   = s9.map(l => ({ price: l.up,   label: '江恩' + l.label, src:'gann' })).filter(v => v.price > P).sort((a,b) => a.price - b.price);
  const s9Down = s9.map(l => ({ price: l.down,  label: '江恩' + l.label, src:'gann' })).filter(v => v.price < P).sort((a,b) => b.price - a.price);

  // ── 江恩引擎额外角度线 ──
  const gnUp   = gn && gn.levels ? gn.levels.filter(l => l.price > P).slice(0,6).map(l => ({ price: l.price, label: '江恩角度线', src:'gann' })) : [];
  const gnDown = gn && gn.levels ? gn.levels.filter(l => l.price < P).slice(-6).map(l => ({ price: l.price, label: '江恩角度线', src:'gann' })) : [];

  // ── 缠论中枢 + 背驰价位 ──
  const chanUp = [], chanDown = [];
  if (ch) {
    // 中枢上沿作为压力（TP候选），中枢下沿作为支撑（SL候选）
    if (ch.zsHigh && ch.zsHigh > P) chanUp.push({ price: ch.zsHigh, label: '缠论中枢上沿', src:'chan' });
    if (ch.zsLow  && ch.zsLow  < P) chanDown.push({ price: ch.zsLow, label: '缠论中枢下沿', src:'chan' });
    // 背驰目标价：顶背驰→做空TP；底背驰→做多TP
    if (ch.beichi && ch.beichiType === '顶背驰' && ch.zsHigh) {
      const beiTarget = smartRound(ch.zsHigh * 0.9); // 顶背驰下跌目标
      if (beiTarget < P) chanDown.push({ price: beiTarget, label: '缠论顶背驰目标', src:'chan' });
    }
    if (ch.beichi && ch.beichiType === '底背驰' && ch.zsLow) {
      const beiTarget = smartRound(ch.zsLow * 1.15); // 底背驰反弹目标
      if (beiTarget > P) chanUp.push({ price: beiTarget, label: '缠论底背驰目标', src:'chan' });
    }
    // 买卖点价位
    if (ch.bspDir === '买点' && ch.zsHigh && ch.zsHigh > P)
      chanUp.push({ price: ch.zsHigh, label: '缠论买点目标位', src:'chan' });
    if (ch.bspDir === '卖点' && ch.zsLow && ch.zsLow < P)
      chanDown.push({ price: ch.zsLow, label: '缠论卖点目标位', src:'chan' });
  }

  // ── 斐波那契回撤（大波段）──
  const fibUp = [], fibDown = [];
  if (H && L && H > L) {
    const range = H - L;
    // 上方斐波: 低点+38.2%, +50%, +61.8%
    [0.382, 0.500, 0.618, 1.000].forEach(r => {
      const fp = smartRound(L + range * r);
      if (fp > P) fibUp.push({ price: fp, label: `斐波${Math.round(r*100)}%`, src:'fib' });
      else if (fp < P) fibDown.push({ price: fp, label: `斐波${Math.round(r*100)}%`, src:'fib' });
    });
  }

  // ── 合并所有候选，去重，正确排序 ──
  // allUp: 升序 (nearest above first → TP1最近, TP5最远)
  // allDown: 降序 (nearest below first → SL1最近, SL5最远)
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
      .sort((a,b) => b.price - a.price)  // descending: nearest below first
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
  // 使用误差校正权重（与 engineTPSL 保持一致）
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

  // 计算 LONG / SHORT 两套策略（基于当前价 P）
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

  // 江恩九方格总览（供 UI 展示）
  const s9Overview = gannS9Levels(P);

  return { signal, avgBias, strategies, s9Overview, P, H, L };
}

// ══════════════════════════════════════════════════════════════════
// 缠论引擎 — 顶底分型·笔·中枢·背驰（全确定性，无随机数）
// 算法：① 日期特征生成确定性K线序列（三角波+趋势）
//       ② 合并包含K线 ③ 识别顶底分型 ④ 交替分型形成笔
//       ⑤ 三笔重叠区识别中枢 ⑥ 同向笔幅度比较检测背驰
//       ⑦ 中枢位置+笔方向+背驰信号 → 综合偏向
// ══════════════════════════════════════════════════════════════════
function engineChan(coin, date, price, high, low, breakLevel) {
  const P = price || 50000;
  const H = high  || P * 1.15;
  const L = low   || P * 0.85;

  // ── 1. 确定性K线序列（三角波模拟，无随机数）────────────────────
  const d = new Date(date);
  const dayOfYear = Math.floor((d - new Date(d.getFullYear(), 0, 0)) / 86400000);
  // 确定性趋势种子（仅依赖日期）
  const trendSeed     = ((dayOfYear * 17 + d.getFullYear() * 7) % 100) / 100;
  const range         = H - L;
  const volatility    = range * 0.018;
  const trendStrength = (trendSeed - 0.5) * 0.8;

  const klines = [];
  let basePrice = L + range * trendSeed;

  for (let i = 0; i < 100; i++) {
    // 双周期三角波（完全确定性）
    const cycle1 = Math.cos(i * Math.PI / 8) * volatility * 1.5;
    const cycle2 = Math.cos(i * Math.PI / 3) * volatility * 0.8;
    const trend  = trendStrength * volatility * (i / 50);

    const close   = basePrice + cycle1 + cycle2 + trend;
    const open    = basePrice;
    const bodyH   = Math.max(open, close);
    const bodyL   = Math.min(open, close);
    // 影线长度由索引奇偶确定（无随机）
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

  // ── 2. 合并包含K线 ─────────────────────────────────────────────
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

  // ── 3. 识别顶底分型 ────────────────────────────────────────────
  // fractalWindow: 顶底分型确认窗口，默认=1（左右各1根K线）
  // 值越大要求越严格（需要更多K线确认），减少假信号但更滞后
  const fractalWindow = parseInt(localStorage.getItem('chan_fractal_window') || '1');
  const tops = [], bottoms = [];
  for (let i = fractalWindow; i < merged.length - fractalWindow; i++) {
    const cu = merged[i];
    // 顶分型：中间K线高点 > 左右 fractalWindow 根K线的所有高点
    let isTop = true, isBot = true;
    for (let w = 1; w <= fractalWindow; w++) {
      if (cu.high <= merged[i-w].high || cu.high <= merged[i+w].high) isTop = false;
      if (cu.low  >= merged[i-w].low  || cu.low  >= merged[i+w].low)  isBot = false;
    }
    if (isTop) tops.push({ index: i, price: cu.high, type: 'top' });
    if (isBot) bottoms.push({ index: i, price: cu.low, type: 'bottom' });
  }

  // ── 4. 分型交替 → 笔 ───────────────────────────────────────────
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

  // ── 5. 中枢（最近三笔的重叠区间）────────────────────────────────
  let zsHigh = null, zsLow = null;
  if (pens.length >= 3) {
    const last3  = pens.slice(-3);
    const penHighs = last3.map(p => Math.max(p.startPrice, p.endPrice));
    const penLows  = last3.map(p => Math.min(p.startPrice, p.endPrice));
    zsHigh = Math.min(...penHighs);
    zsLow  = Math.max(...penLows);
    if (zsLow >= zsHigh) { zsHigh = null; zsLow = null; }
  }

  // ── 6. 背驰检测 ────────────────────────────────────────────────
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

  // ── 7. 偏向计算 ────────────────────────────────────────────────
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


// ════════════════════════════════════════════════════════════════════════════
// 江恩×缠论协同引擎 v2 — 基于真实K线数据
// 数据来源：fetchKlines() 返回的真实OHLCV K线
// 五大核心计算：
//   ① 江恩斐波关键位（高低区间×0.382/0.5/0.618/0.786）
//   ② 江恩bias（偏离20日均线百分比）
//   ③ 缠论中枢边界（从ch引擎结果取，同时用K线验证）
//   ④ 缠论bias（偏离中枢中轨百分比）
//   ⑤ MACD背驰检测（顶背离/底背离，强度0-1）
// 评级逻辑：
//   S = 超强信号（背驰+方向共振）
//   A = 价格共振+方向共振
//   B = 单一共振（价格或方向）
//   C = 仅有背驰
//   N/A = 数据不足
// ════════════════════════════════════════════════════════════════════════════

// ── 辅助：从K线提取收盘/高/低价序列 ──────────────────────────────────────
function _klineCloses(klines) { return klines.map(k => parseFloat(k[4] !== undefined ? k[4] : k.c)); }
function _klineHighs(klines)  { return klines.map(k => parseFloat(k[2] !== undefined ? k[2] : k.h)); }
function _klineLows(klines)   { return klines.map(k => parseFloat(k[3] !== undefined ? k[3] : k.l)); }

// ── 辅助：EMA计算 ──────────────────────────────────────────────────────────
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

// ── 辅助：MA计算 ───────────────────────────────────────────────────────────
function _calcMA(values, period) {
  if (!values || values.length < period) return [];
  const result = new Array(period - 1).fill(null);
  for (let i = period - 1; i < values.length; i++) {
    const sum = values.slice(i - period + 1, i + 1).reduce((s, v) => s + v, 0);
    result.push(sum / period);
  }
  return result;
}

// ── ① MACD计算（标准EMA12/26/9）──────────────────────────────────────────
function _calculateMACD(klines) {
  const closes = _klineCloses(klines);
  if (closes.length < 35) return null;

  const ema12 = _calcEMA(closes, 12);
  const ema26 = _calcEMA(closes, 26);

  const dif = ema12.map((v, i) => (v !== null && ema26[i] !== null) ? v - ema26[i] : null);
  const validDif = dif.filter(v => v !== null);
  const dea = _calcEMA(validDif, 9);

  // 重建完整DEA（前面填null）
  const deaFull = new Array(dif.length - dea.length).fill(null).concat(dea);
  const macd = dif.map((v, i) => (v !== null && deaFull[i] !== null) ? (v - deaFull[i]) * 2 : null);

  return { dif, dea: deaFull, macd, closes };
}

// ── ② 背驰检测 ────────────────────────────────────────────────────────────
// 顶背离：价格创新高，但MACD(DIF)没创新高 → 看跌信号
// 底背离：价格创新低，但MACD(DIF)没创新低 → 看涨信号
function _detectDivergence(klines) {
  const macdData = _calculateMACD(klines);
  if (!macdData) return { hasDivergence: false, type: null, strength: 0, detail: '数据不足' };

  const { dif, closes } = macdData;
  const highs = _klineHighs(klines);
  const lows  = _klineLows(klines);

  // 只看最近40根K线
  const N = Math.min(40, klines.length);
  const recentDif    = dif.slice(-N).filter(v => v !== null);
  const recentCloses = closes.slice(-N);
  const recentHighs  = highs.slice(-N);
  const recentLows   = lows.slice(-N);

  if (recentDif.length < 10) return { hasDivergence: false, type: null, strength: 0, detail: '近期数据不足' };

  // 找近期局部高点（前后各3根K线）
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

  // 顶背离：最近两个高点，价格更高但DIF更低
  let bearDivStrength = 0;
  if (priceHighs.length >= 2) {
    const h1 = priceHighs[priceHighs.length - 2];
    const h2 = priceHighs[priceHighs.length - 1];
    if (h2.price > h1.price && h2.dif < h1.dif) {
      // 强度 = DIF下降幅度 相对于 DIF绝对值
      const difDrop = Math.abs(h2.dif - h1.dif);
      const difBase = Math.max(Math.abs(h1.dif), 0.0001);
      bearDivStrength = Math.min(1, difDrop / difBase * 0.8);
    }
  }

  // 底背离：最近两个低点，价格更低但DIF更高
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

// ── 主函数：engineGannChanSynergy ─────────────────────────────────────────
function engineGannChanSynergy(gn, ch, price, klines) {
  // ── 数据不足处理 ──────────────────────────────────────────────────────
  const N_MIN = 60;
  if (!klines || klines.length < N_MIN) {
    return {
      hasResonance: false, rating: 'N/A',
      details: { priceResonance: { exists: false }, directionResonance: { exists: false },
                 divergence: { exists: false, type: null, strength: 0 }, superSignal: false },
      message: `K线数据不足（需≥${N_MIN}根，当前${klines ? klines.length : 0}根），无法进行协同分析`,
      // Legacy fields for panel rendering compatibility
      signals: [], priceResonances: [], overallScore: 0, grade: 'C',
      gradeLabel: '数据不足', synergyDir: 'neutral', hasSynergy: false, strongSignal: false,
    };
  }

  const P = price || (gn && gn.P) || parseFloat(klines[klines.length-1][4] || klines[klines.length-1].c || 0);
  if (!P) return null;

  // ── ① 江恩关键位（真实高低价）─────────────────────────────────────────
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

  // 加入江恩引擎已计算的阻力/支撑位
  if (gn && gn.res) gn.res.slice(0, 4).forEach(r => gannLevels.push({ price: r.price, label: r.source || '江恩阻力' }));
  if (gn && gn.sup) gn.sup.slice(0, 4).forEach(s => gannLevels.push({ price: s.price, label: s.source || '江恩支撑' }));

  // ── ② 江恩bias（偏离20日均线）───────────────────────────────────────────
  const closes = _klineCloses(klines);
  const MA20arr = _calcMA(closes, 20);
  const ma20 = MA20arr[MA20arr.length - 1];
  const gannBias = ma20 ? ((P - ma20) / ma20 * 100) : 0;

  // ── ③ 缠论中枢边界（优先用ch引擎结果，辅以K线验证）──────────────────────
  let chanZoneTop = ch && ch.zsHigh ? ch.zsHigh : null;
  let chanZoneBot = ch && ch.zsLow  ? ch.zsLow  : null;
  let chanZoneMid = (chanZoneTop && chanZoneBot) ? (chanZoneTop + chanZoneBot) / 2 : null;

  // 若ch中枢无效，用最近20根K线的区间中值作为近似中枢
  if (!chanZoneTop || !chanZoneBot) {
    const recent20H = Math.max(..._klineHighs(klines.slice(-20)));
    const recent20L = Math.min(..._klineLows(klines.slice(-20)));
    chanZoneTop = recent20H;
    chanZoneBot = recent20L;
    chanZoneMid = (recent20H + recent20L) / 2;
  }

  // 缠论中枢边界列表（供价格共振匹配）
  const chanLevels = [
    { price: chanZoneTop, label: '缠论中枢上轨' },
    { price: chanZoneBot, label: '缠论中枢下轨' },
    { price: chanZoneMid, label: '缠论中枢中轨' },
  ];
  // 加入末笔端点
  if (ch && ch.pens && ch.pens.length) {
    const lp = ch.pens[ch.pens.length - 1];
    if (lp.endPrice)   chanLevels.push({ price: lp.endPrice,   label: '缠论末笔端点' });
    if (lp.startPrice) chanLevels.push({ price: lp.startPrice, label: '缠论末笔起点' });
  }

  // ── ④ 缠论bias（偏离中枢中轨）──────────────────────────────────────────
  const chanBias = chanZoneMid ? ((P - chanZoneMid) / chanZoneMid * 100) : 0;

  // ── ⑤ MACD背驰检测（真实K线）───────────────────────────────────────────
  const divergence = _detectDivergence(klines);

  // ══════════════════════════════════════════════════════════════
  // 判断逻辑
  // ══════════════════════════════════════════════════════════════

  // 价格共振：江恩关键位 与 缠论中枢边界 差距<2%
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

  // 方向共振：江恩bias与缠论bias同号（同正=多，同负=空）
  const hasDirectionResonance = (gannBias * chanBias) > 0;
  const dirBull = gannBias > 0 && chanBias > 0;

  // 超强信号：背驰 + 方向共振
  const divergenceBull = divergence.type === 'bullish';
  const divergenceBear = divergence.type === 'bearish';
  const superSignal = divergence.hasDivergence && hasDirectionResonance
    && ((divergenceBull && dirBull) || (divergenceBear && !dirBull));

  // ── 评级 ──────────────────────────────────────────────────────────────
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

  // ── 生成信号列表（供UI渲染）──────────────────────────────────────────
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

  // 中枢突破信号
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

  // ── 综合评分（供进度条显示）──────────────────────────────────────────
  const scoreMap = { S: 0.92, A: 0.75, B: 0.55, C: 0.30 };
  const overallScore = scoreMap[rating] || 0.3;
  const synergyDir = superSignal
    ? (divergenceBull ? 'bull' : 'bear')
    : hasDirectionResonance
      ? (dirBull ? 'bull' : 'bear')
      : 'neutral';

  // ── UTC+8 时间标注 ──────────────────────────────────────────────────
  const analysisTime = typeof toUTC8Str === 'function' ? toUTC8Str(new Date()) : new Date().toLocaleString('zh-CN');

  const message = signals.length > 0
    ? signals[0].text
    : `江恩bias ${gannBias.toFixed(1)}%，缠论bias ${chanBias.toFixed(1)}%，暂无明确共振信号`;

  return {
    // 新版结构化输出
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
    // Legacy UI compatibility fields
    signals,
    priceResonances: priceResonances.slice(0, 4),
    overallScore,
    grade: rating,
    gradeLabel,
    synergyDir,
    hasSynergy: signals.length > 0,
    strongSignal: rating === 'S' || rating === 'A',
    // Debug data
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

// ══════════════════════════════════════════════════════════════════════════════
// SignalEnhancer 模块 v1.0
// 包含三大子系统：
//   ① ZhongshuValidator  — 缠论中枢稳定性验证（成交量+时间+价格三重校验）
//   ② GannDynamicEngine  — 江恩角度线动态计算（时间价格双维度）
//   ③ SignalBacktester   — 信号历史胜率统计（轻量级本地回测）
// 整合为 SignalEnhancer 主类，输出增强信号+可视化建议
// 性能：全程 klines.slice(-N) 避免全量扫描，缓存复用中间结果
// 时间：所有输出统一 UTC+8（Asia/Shanghai）
// ══════════════════════════════════════════════════════════════════════════════

// ── UTC+8 辅助（与全局工具对齐）─────────────────────────────────────────────
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

// ── 共用：K线字段兼容（Binance数组 或 {o,h,l,c,v} 对象）──────────────────
function _o(k)  { return parseFloat(k[1]  !== undefined ? k[1]  : k.o); }
function _h(k)  { return parseFloat(k[2]  !== undefined ? k[2]  : k.h); }
function _l(k)  { return parseFloat(k[3]  !== undefined ? k[3]  : k.l); }
function _c(k)  { return parseFloat(k[4]  !== undefined ? k[4]  : k.c); }
function _v(k)  { return parseFloat(k[5]  !== undefined ? k[5]  : k.v || 0); }
function _ts(k) { return parseInt (k[0]   !== undefined ? k[0]  : k.t || k.ms || 0); }

// ── 共用：简单统计工具 ────────────────────────────────────────────────────
function _mean(arr)   { return arr.length ? arr.reduce((s,v) => s+v, 0) / arr.length : 0; }
function _std(arr)    {
  if (arr.length < 2) return 0;
  const m = _mean(arr);
  return Math.sqrt(arr.reduce((s,v) => s + (v-m)**2, 0) / arr.length);
}
function _clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ══════════════════════════════════════════════════════════════════════════════
// ① ZhongshuValidator — 缠论中枢稳定性验证
// ══════════════════════════════════════════════════════════════════════════════
class ZhongshuValidator {
  static cache = new Map();  // key: `${top}_${bottom}_${klines.length}`

  constructor(klines) {
    this.klines = klines || [];
  }

  // ── 清理过期缓存（保留最近50条）──────────────────────────────────────────
  static _trimCache() {
    if (ZhongshuValidator.cache.size > 50) {
      const keys = [...ZhongshuValidator.cache.keys()].slice(0, 20);
      keys.forEach(k => ZhongshuValidator.cache.delete(k));
    }
  }

  // ── 主验证入口 ─────────────────────────────────────────────────────────
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

    // ── 三重校验 ────────────────────────────────────────────────────────
    const volCheck   = this.checkVolume(zhongshu);
    const timeCheck  = this.checkTime(zhongshu);
    const priceCheck = this.checkPrice(zhongshu);

    // 成交量校验（权重 0.35）
    if (volCheck.pass) {
      scores.push(0.35 * volCheck.score);
      reasons.push(`✓ 成交量：中枢内缩量比 ${(volCheck.ratio * 100).toFixed(0)}%（有效）`);
    } else {
      scores.push(0.35 * 0.2);
      reasons.push(`△ 成交量：缩量不明显（比率 ${(volCheck.ratio * 100).toFixed(0)}%）`);
    }

    // 时间校验（权重 0.30）
    if (timeCheck.pass) {
      scores.push(0.30 * timeCheck.score);
      reasons.push(`✓ 时间结构：${timeCheck.barCount}根K线形成（≥最低${timeCheck.minRequired}根）`);
    } else {
      scores.push(0.30 * 0.1);
      reasons.push(`✗ 时间结构不足：仅${timeCheck.barCount}根（需≥${timeCheck.minRequired}根）`);
    }

    // 价格校验（权重 0.35）
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

  // ── ① 成交量校验：中枢内应缩量 ────────────────────────────────────────
  // 原理：价格震荡整理时，多空分歧减少 → 成交量萎缩
  // 判断：中枢区间内平均成交量 < 前后区间平均成交量 × 0.8
  checkVolume(zhongshu) {
    const klines = this.klines;
    if (klines.length < 20) {
      return { pass: false, score: 0.3, ratio: 0.5, reason: '数据不足' };
    }

    const top    = zhongshu.top;
    const bottom = zhongshu.bottom;

    // 找出"在中枢区间内"的K线（close在top/bottom之间）
    const inZS  = klines.filter(k => { const c = _c(k); return c >= bottom && c <= top; });
    const outZS = klines.filter(k => { const c = _c(k); return c < bottom || c > top; });

    if (inZS.length < 3 || outZS.length < 3) {
      return { pass: false, score: 0.3, ratio: 0.5, reason: '中枢内K线不足' };
    }

    const volIn  = _mean(inZS.map(_v));
    const volOut = _mean(outZS.map(_v));

    if (volOut === 0) return { pass: false, score: 0.3, ratio: 1, reason: '成交量数据异常' };

    const ratio = volIn / volOut;  // <1 表示缩量
    const pass  = ratio < 0.85;
    // 得分：ratio越小越好，0.3~1.0线性映射
    const score = _clamp(1 - (ratio - 0.3) / 0.7, 0.1, 1.0);

    return {
      pass, score: parseFloat(score.toFixed(3)),
      ratio: parseFloat(ratio.toFixed(3)),
      volIn: parseFloat(volIn.toFixed(0)),
      volOut: parseFloat(volOut.toFixed(0)),
      reason: pass ? `中枢内缩量（比率${(ratio*100).toFixed(0)}%）` : `成交量未有效收缩（比率${(ratio*100).toFixed(0)}%）`,
    };
  }

  // ── ② 时间校验：中枢至少需要3笔 ────────────────────────────────────────
  // 3笔 = 上升笔+下降笔+上升笔（或反向），在时间上至少需要 minRequired 根K线
  // 规则：K线周期越大，所需根数越少（日线3根 vs 1h线24根）
  checkTime(zhongshu) {
    const klines = this.klines;
    const top    = zhongshu.top;
    const bottom = zhongshu.bottom;
    if (!top || !bottom || klines.length < 5) {
      return { pass: false, score: 0, barCount: 0, minRequired: 9, reason: '数据不足' };
    }

    // 估算K线周期（用相邻时间戳差值）
    let msPerBar = 14400000; // 默认4H
    if (klines.length >= 2) {
      const t1 = _ts(klines[klines.length - 1]);
      const t2 = _ts(klines[klines.length - 2]);
      if (t1 > t2) msPerBar = t1 - t2;
    }
    const hoursPerBar = msPerBar / 3600000;
    // 最低根数：每笔至少3根K线，3笔=9根；日线放宽到5根
    const minRequired = hoursPerBar >= 24 ? 5 : hoursPerBar >= 4 ? 9 : 18;

    // 统计价格在中枢区间内经历的K线数
    let barCount = 0, inBlock = false;
    for (const k of klines) {
      const c = _c(k);
      if (c >= bottom * 0.995 && c <= top * 1.005) {
        barCount++;
        inBlock = true;
      } else if (inBlock) {
        // 允许短暂突破后回归（不超过3根）
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

  // ── ③ 价格校验：上下沿清晰度 ────────────────────────────────────────────
  // 清晰度 = 价格有效触及上下沿的次数 / 理论需要次数
  // 有效触及：K线high触及top ±0.5% 或 low触及bottom ±0.5%
  checkPrice(zhongshu) {
    const klines = this.klines;
    const top    = zhongshu.top;
    const bottom = zhongshu.bottom;
    if (!top || !bottom) {
      return { pass: false, score: 0, clarity: 0, reason: '价格数据缺失' };
    }

    const tol = 0.005; // 0.5% 容忍误差
    let topTouches = 0, botTouches = 0;
    let topBreaks = 0, botBreaks = 0;

    for (const k of klines) {
      const h = _h(k), l = _l(k), c = _c(k);
      // 触及
      if (h >= top * (1 - tol) && h <= top * (1 + tol * 3))  topTouches++;
      if (l <= bottom * (1 + tol) && l >= bottom * (1 - tol * 3)) botTouches++;
      // 有效突破（收盘价突破）
      if (c > top * (1 + tol))    topBreaks++;
      if (c < bottom * (1 - tol)) botBreaks++;
    }

    // 有效中枢：上下沿各至少被触及1次
    const touchScore  = _clamp((Math.min(topTouches, 3) + Math.min(botTouches, 3)) / 6, 0, 1);
    // 突破后能回归中枢加分（说明边界有支撑/阻力），过多突破不确认则减分
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

// ══════════════════════════════════════════════════════════════════════════════
// ② GannDynamicEngine — 江恩角度线动态计算
// ══════════════════════════════════════════════════════════════════════════════
class GannDynamicEngine {
  constructor(klines) {
    this.klines = klines || [];
    this._cache = {};
  }

  // ── 计算江恩箱（Gann Box）────────────────────────────────────────────────
  // 核心：将价格幅度与时间幅度统一为同一比例
  // 公式：1×1线斜率 = 价格范围 / 时间范围（单位：美元/根K线）
  calculateGannBox(n = 60) {
    const k = this.klines.slice(-n);
    if (k.length < 10) return null;

    const highs   = k.map(_h);
    const lows    = k.map(_l);
    const rangeH  = Math.max(...highs);
    const rangeL  = Math.min(...lows);
    const priceRange = rangeH - rangeL;
    const timeRange  = k.length;  // 根数

    // 1×1角度：每根K线价格变动 = priceRange / timeRange
    const unitPrice = priceRange / timeRange;

    // ATR用于波动率感知
    const atr = this._calcATR(k, 14);
    const volatilityFactor = atr > 0 ? atr / (priceRange / timeRange) : 1;

    return {
      rangeH: parseFloat(rangeH.toFixed(2)),
      rangeL: parseFloat(rangeL.toFixed(2)),
      priceRange: parseFloat(priceRange.toFixed(2)),
      timeRange,
      unitPrice: parseFloat(unitPrice.toFixed(4)),
      // 三条基础角度线斜率（单位：$每根K线）
      angle1x1: parseFloat(unitPrice.toFixed(4)),        // 45° 均衡线
      angle2x1: parseFloat((unitPrice * 2).toFixed(4)),  // 陡峭（强趋势）
      angle1x2: parseFloat((unitPrice * 0.5).toFixed(4)),// 平缓（弱趋势）
      angle3x1: parseFloat((unitPrice * 3).toFixed(4)),  // 极强趋势
      angle1x3: parseFloat((unitPrice / 3).toFixed(4)),  // 极弱趋势
      atr: parseFloat(atr.toFixed(2)),
      volatilityFactor: parseFloat(volatilityFactor.toFixed(3)),
    };
  }

  // ── ATR计算（真实波幅均值）───────────────────────────────────────────────
  _calcATR(klines, period = 14) {
    if (klines.length < period + 1) return _mean(klines.map(k => _h(k) - _l(k)));
    const trs = [];
    for (let i = 1; i < klines.length; i++) {
      const h = _h(klines[i]), l = _l(klines[i]), pc = _c(klines[i-1]);
      trs.push(Math.max(h - l, Math.abs(h - pc), Math.abs(l - pc)));
    }
    return _mean(trs.slice(-period));
  }

  // ── 动态调整角度（波动率自适应）──────────────────────────────────────────
  // 波动率大时角度变陡 → 用 volatilityFactor 缩放 unitPrice
  getDynamicAngles() {
    const box = this.calculateGannBox();
    if (!box) return null;

    // 波动率因子修正：ATR / (priceRange/timeRange) 反映当前 vs 历史波动比
    const vf  = _clamp(box.volatilityFactor, 0.5, 3.0);
    const adj = box.unitPrice * vf;  // 动态调整后的单位价格

    // 当前价（最后收盘）
    const curPrice = _c(this.klines[this.klines.length - 1]);

    return {
      baseAngle: parseFloat(adj.toFixed(4)),
      volatilityFactor: parseFloat(vf.toFixed(3)),
      // 上行角度线（从最低点出发）
      up: {
        '1x1': { slope: adj,       label: '1×1上行（均衡）',   color: '#d4a843' },
        '2x1': { slope: adj * 2,   label: '2×1上行（强势）',   color: '#28c870' },
        '3x1': { slope: adj * 3,   label: '3×1上行（极强）',   color: '#38a8e0' },
        '1x2': { slope: adj * 0.5, label: '1×2上行（弱势）',   color: '#888888' },
      },
      // 下行角度线（从最高点出发，斜率为负）
      down: {
        '1x1': { slope: -adj,       label: '1×1下行（均衡）',   color: '#e04848' },
        '2x1': { slope: -adj * 2,   label: '2×1下行（强压）',   color: '#e08030' },
        '1x2': { slope: -adj * 0.5, label: '1×2下行（弱压）',   color: '#c0c0c0' },
      },
      // 当前价格处于哪个角度通道
      currentChannel: this._identifyChannel(curPrice, box, adj),
    };
  }

  // ── 识别当前价格所在角度通道 ─────────────────────────────────────────────
  _identifyChannel(price, box, adj) {
    const mid = (box.rangeH + box.rangeL) / 2;
    const pos = (price - box.rangeL) / box.priceRange;  // 0=低点,1=高点

    if (pos > 0.786) return { label: '3×1强势区（顶部风险）', strength: 'overbought', color: '#e04848' };
    if (pos > 0.618) return { label: '2×1上行通道（强势）',   strength: 'strong_up',  color: '#28c870' };
    if (pos > 0.500) return { label: '1×1均衡偏多',          strength: 'slight_up',  color: '#d4a843' };
    if (pos > 0.382) return { label: '1×1均衡偏空',          strength: 'slight_dn',  color: '#e08030' };
    if (pos > 0.236) return { label: '1×2下行通道（弱势）',   strength: 'weak_dn',    color: '#c0c0c0' };
    return            { label: '3×1强势空区（底部机会）',     strength: 'oversold',   color: '#38a8e0' };
  }

  // ── 关键位+时间窗口（带时间因子）─────────────────────────────────────────
  // 核心：将江恩角度线投影到未来K线，得到"预计在第X根K线触及价格P"
  // 时间映射：每格角度线 = msPerBar毫秒，映射到 UTC+8 时间
  getKeyLevelsWithTime() {
    const box    = this.calculateGannBox();
    const angles = this.getDynamicAngles();
    if (!box || !angles) return [];

    const klines = this.klines;
    if (klines.length < 5) return [];

    // 估算K线周期
    const lastTs   = _ts(klines[klines.length - 1]);
    const prevTs   = _ts(klines[klines.length - 2]);
    const msPerBar = lastTs > prevTs ? lastTs - prevTs : 14400000;
    const hPerBar  = msPerBar / 3600000;

    const curPrice = _c(klines[klines.length - 1]);
    const results  = [];

    // 从高/低点分别延伸几条角度线，计算它们在未来1~8根K线的价位
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
        // 计算这条线与当前价格相交的时间（反解barOffset）
        const barOffset = slope > 0 ? (curPrice - pivot.price) / slope : 0;

        // 向前延伸1~6根K线
        for (let b = 1; b <= 6; b++) {
          const futurePrice = pivot.dir === 'up'
            ? pivot.price + slope * (barOffset + b)
            : pivot.price - slope * (barOffset + b);

          if (futurePrice <= 0) continue;

          // 时间窗口：第b根K线的起止时间
          const startMs = lastTs + (b - 1) * msPerBar;
          const endMs   = lastTs + b * msPerBar;
          const startD  = new Date(startMs);
          const endD    = new Date(endMs);
          const startH  = parseInt(_utc8Str(startD).slice(11, 13)) || 0;
          const endH    = (startH + Math.ceil(hPerBar)) % 24;

          // 只保留价格在当前价 ±15% 范围内的预测
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

    // 去重（价格相差<0.3%视为同位），按距当前价格排序
    const deduped = [];
    results.sort((a,b) => a.diffPct - b.diffPct).forEach(r => {
      if (!deduped.some(d => Math.abs(d.price - r.price) / (curPrice||1) < 0.003)) {
        deduped.push(r);
      }
    });

    return deduped.slice(0, 8);
  }

  // ── 角度线可视化数据（返回SVG/Canvas所需的点集）────────────────────────
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

    // 从最低点出发的上行角度线
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

    // 从最高点出发的下行角度线
    const highIdx  = allH.indexOf(Math.max(...allH));
    const highPrice = allH[highIdx];
    [angles.down['1x1'], angles.down['2x1']].forEach(ang => {
      const pts = [];
      for (let b = 0; b <= futureN + (n - highIdx); b++) {
        const price = highPrice + ang.slope * b; // slope是负数
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

// ══════════════════════════════════════════════════════════════════════════════
// ③ SignalBacktester — 信号历史胜率统计
// ══════════════════════════════════════════════════════════════════════════════
class SignalBacktester {
  constructor(klines) {
    this.klines = klines || [];
    this._cache = {};
  }

  // ── 回测历史信号 ─────────────────────────────────────────────────────────
  // 思路：在K线中重新运行轻量级信号检测，统计每次信号后N根K线的涨跌幅
  // signalType: 'macd_divergence_bull' | 'macd_divergence_bear' | 'zhongshu_break' | 'direction_resonance'
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
    const WIN  = 5; // 局部极值窗口

    // 滑动窗口扫描：每次用前N根K线检测信号，然后看后holdBars根的表现
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

    // 统计（多空信号方向相反）
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

  // ── 信号检测器工厂 ───────────────────────────────────────────────────────
  _getSignalDetector(type) {
    const detectors = {
      // MACD底背离检测（取最后20根）
      'macd_divergence_bull': (klines) => {
        if (klines.length < 35) return false;
        const closes = klines.map(_c);
        const lows   = klines.map(_l);
        const dif    = this._quickDIF(closes);
        if (!dif || dif.length < 10) return false;
        const recentL   = lows.slice(-20);
        const recentDIF = dif.slice(-20);
        // 最后一根低点 < 倒数10根内的低点，但DIF更高
        const minL10   = Math.min(...recentL.slice(-10));
        const minL20   = Math.min(...recentL.slice(0, 10));
        const difEnd   = recentDIF[recentDIF.length - 1];
        const difMid   = _mean(recentDIF.slice(0, 10).filter(v => v != null));
        return minL10 < minL20 * 0.998 && difEnd > difMid * 1.05;
      },
      // MACD顶背离
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
      // 方向共振（江恩+缠论bias同号）
      'direction_resonance': (klines) => {
        if (klines.length < 25) return false;
        const closes = klines.map(_c);
        const ma20   = _mean(closes.slice(-20));
        const last   = closes[closes.length - 1];
        const bias   = (last - ma20) / ma20 * 100;
        // 简化：价格偏离MA20超过±1%时认为有方向共振信号
        return Math.abs(bias) > 1;
      },
      // 中枢突破
      'zhongshu_break': (klines) => {
        if (klines.length < 20) return false;
        const closes = klines.map(_c);
        const high   = Math.max(...klines.slice(-20).map(_h));
        const low    = Math.min(...klines.slice(-20).map(_l));
        const mid    = (high + low) / 2;
        const range  = (high - low) * 0.382; // 近似中枢区间
        const last   = closes[closes.length - 1];
        // 最后价格突破了中枢范围
        return last > mid + range || last < mid - range;
      },
    };
    return detectors[type] || null;
  }

  // ── 快速DIF计算（12/26 EMA差）───────────────────────────────────────────
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

  // ── 实时信号置信度 ───────────────────────────────────────────────────────
  getConfidence(currentSignal) {
    if (!currentSignal) return { confidence: 50, rating: 'C', similarHistory: 0, similarWinRate: 'N/A' };

    const signalType = this._mapSignalType(currentSignal);
    const bt = this.backtest(signalType);

    const winRateNum = parseFloat(bt.winRate) || 50;
    const conf = _clamp(
      winRateNum * 0.6 +               // 历史胜率权重60%
      Math.min(bt.totalSignals, 20) / 20 * 100 * 0.2 + // 样本量权重20%
      Math.min(bt.sharpeRatio * 20, 40) * 0.2,          // 夏普权重20%
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

  // ── 信号类型映射 ─────────────────────────────────────────────────────────
  _mapSignalType(signal) {
    const type = (signal.type || signal.signalType || '').toLowerCase();
    if (type.includes('背驰') && (type.includes('底') || type.includes('bull'))) return 'macd_divergence_bull';
    if (type.includes('背驰') && (type.includes('顶') || type.includes('bear'))) return 'macd_divergence_bear';
    if (type.includes('方向') || type.includes('resonance'))                      return 'direction_resonance';
    if (type.includes('中枢') || type.includes('突破'))                           return 'zhongshu_break';
    return 'direction_resonance';  // 默认
  }

  // ── 风险提示 ─────────────────────────────────────────────────────────────
  getRiskWarning(signal, currentPrice) {
    if (!signal || !currentPrice) return null;
    const atr = this._calcLocalATR();
    const isBull = signal.bull !== false;
    // 止损：1.5倍ATR
    const slDist  = atr * 1.5;
    const tpDist  = atr * 2.5;  // 目标：2.5倍ATR（RRR ≈ 1.67）
    const sl = isBull ? currentPrice - slDist : currentPrice + slDist;
    const tp = isBull ? currentPrice + tpDist : currentPrice - tpDist;
    const rrr = (tpDist / slDist).toFixed(2);

    const bt = this.backtest(this._mapSignalType(signal));
    const winRateNum = parseFloat(bt.winRate) || 50;
    // Kelly公式：f* = (bp - q) / b，b = RRR，p=胜率，q=1-p
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

  // ── 本地ATR计算 ──────────────────────────────────────────────────────────
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

// ══════════════════════════════════════════════════════════════════════════════
// 主类：SignalEnhancer
// ══════════════════════════════════════════════════════════════════════════════
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

  // ── 主方法：增强原始信号 ──────────────────────────────────────────────────
  enhanceSignal(rawSignal) {
    if (!rawSignal) return null;

    const cacheKey = JSON.stringify({ type: rawSignal.type, rating: rawSignal.rating });
    if (this._enhanceCache.has(cacheKey)) return this._enhanceCache.get(cacheKey);

    // ── 新功能 A: 黑天鹅检测（最先运行，触发则直接返回 X 级）──────────────
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

    // 当前价格
    const curPrice = _c(this.klines[this.klines.length - 1]);

    // ── 新功能 B: 成交额过滤（先于一切评级计算）──────────────────────────────
    const volFilter = this._checkVolumeFilter();

    // ── 新功能 C: 假信号过滤器 ──────────────────────────────────────────────
    const fakeFilter = this._detectFakeSignal(rawSignal);

    // ── 1. 中枢置信度验证 ──────────────────────────────────────────────────
    const zhongshu = rawSignal.zhongshu || rawSignal.chanZone || {
      top:    rawSignal.details?.priceResonance?.chanZone || curPrice * 1.05,
      bottom: curPrice * 0.95,
    };
    zhongshu.mid = zhongshu.mid || (zhongshu.top + zhongshu.bottom) / 2;
    const zhongshuConf = this.zhongshuValidator.validate(zhongshu);

    // ── 2. GannDynamicEngine：完整整合 ────────────────────────────────────
    // 2a. 计算江恩箱（价格通道参数，含ATR和波动率因子）
    const gannBox    = this.gannEngine.calculateGannBox();

    // 2b. 动态角度线（波动率自适应，含当前通道识别）
    const gannAngles = this.gannEngine.getDynamicAngles();

    // 2c. 带时间窗口的关键位（将角度线投影到未来K线，输出UTC+8时间）
    const gannLevels = this.gannEngine.getKeyLevelsWithTime();

    // 2d. 角度线可视化数据（Canvas/SVG点集，供图表叠加）
    const angleViz   = this.gannEngine.getAngleLines();

    // 2e. 信号方向过滤：做多信号保留支撑位，做空信号保留阻力位
    const isBullSignal = rawSignal.bull !== false
      && (rawSignal.synergyDir === 'bull' || (rawSignal.details?.directionResonance?.gannBias > 0));
    const filteredLevels = gannLevels.filter(l =>
      isBullSignal ? !l.isAbove : l.isAbove   // 多信号取支撑，空信号取阻力
    );
    // 若过滤后为空则使用全部（无法判断方向时）
    const relevantLevels = filteredLevels.length > 0 ? filteredLevels : gannLevels;

    // 2f. 最近的有效关键位（距离当前价 ≤ 5%）
    const nearestGann = relevantLevels.find(l => l.diffPct <= 5) || gannLevels[0] || null;
    const timeWindow  = nearestGann ? nearestGann.timeWindow : _utc8TimeStr(0, 4);

    // 2g. 江恩位与中枢是否共振（价差 < 1.5%，提升置信度）
    const gannChanResonant = gannLevels.some(gl =>
      Math.abs(gl.price - zhongshu.top)    / (curPrice || 1) * 100 < 1.5 ||
      Math.abs(gl.price - zhongshu.bottom) / (curPrice || 1) * 100 < 1.5
    );

    // ── 3. 历史胜率 ───────────────────────────────────────────────────────
    const histConf  = this.backtester.getConfidence(rawSignal);
    const riskWarn  = this.backtester.getRiskWarning(rawSignal, curPrice);

    // ── 4. 综合置信度（四因子加权）────────────────────────────────────────
    // 原始评级 30% + 历史胜率 30% + 中枢置信度 25% + 江恩共振加成 15%
    const ratingScore  = { S:100, A:80, B:60, C:40, 'N/A':30 };
    const baseScore    = ratingScore[rawSignal.rating || 'C'] || 40;
    const gannBonus    = gannChanResonant ? 100 : (nearestGann && nearestGann.diffPct <= 3 ? 70 : 40);
    const finalConf    = Math.round(
      baseScore            * 0.30 +
      histConf.confidence  * 0.30 +
      zhongshuConf.confidence * 100 * 0.25 +
      gannBonus            * 0.15
    );

    // ── 5. 风险等级（综合置信度 + 江恩通道位置）───────────────────────────
    const channelStr = gannAngles?.currentChannel?.strength || 'ranging';
    const channelRisk = { overbought: 1, oversold: 0, strong_up: 0, strong_dn: 1,
                          slight_up: 0, slight_dn: 0 }[channelStr] ?? 0;
    const riskLevel = (finalConf >= 75 && !channelRisk && !volFilter.filtered && !fakeFilter.isFake) ? '低'
                    : finalConf >= 55 ? '中' : '高';

    // ── 新功能 D: 多周期评级合并 ────────────────────────────────────────────
    // 注意：此步依赖外部传入的 multiTFRatings（由调用方异步预置），若未传入则跳过
    const mtfRatings   = rawSignal._multiTFRatings || null;
    const mtfResult    = mtfRatings ? this._mergeMultiTFRatings(rawSignal.rating, mtfRatings) : null;

    // ── 新功能 E: 自动资金管理引擎 ──────────────────────────────────────────
    const moneyMgmt = this._calcMoneyManagement(rawSignal, finalConf, riskWarn);

    // ── 6. 可视化（含角度线点集 + 止损目标HTML）──────────────────────────
    const viz = this._buildVizSuggestion(
      rawSignal, riskWarn, relevantLevels, gannAngles, gannBox, angleViz, curPrice
    );

    // ── 7. 组装增强信号（完整输出格式）──────────────────────────────────
    const enhanced = {
      // 原始信号完整保留
      ...rawSignal,

      // 核心增强字段
      confidence:      finalConf,
      confidenceLabel: finalConf >= 80 ? '高置信' : finalConf >= 60 ? '中置信' : '低置信',
      riskLevel,
      timeWindow,          // 最近江恩关键位的UTC+8时间窗口
      analysisTime:    _utc8Str(_utc8Now()),

      // 中枢验证
      zhongshuValidation: {
        isValid:    zhongshuConf.isValid,
        confidence: zhongshuConf.confidence,
        reasons:    zhongshuConf.reasons,
        volCheck:   zhongshuConf.volCheck   || null,
        timeCheck:  zhongshuConf.timeCheck  || null,
        priceCheck: zhongshuConf.priceCheck || null,
      },

      // 江恩动态引擎完整输出
      gannDynamic: {
        keyLevels:       relevantLevels,           // 方向过滤后的关键位（带timeWindow）
        allLevels:       gannLevels,               // 全部关键位（不过滤）
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
        gannChanResonant,                          // 江恩位与缠论中枢是否共振
        angleLines:      angleViz?.lines  || [],   // Canvas画线数据
        canvasInfo:      angleViz ? {
          w: angleViz.canvasW, h: angleViz.canvasH,
          minP: angleViz.minP,  maxP: angleViz.maxP,
          currentBarIdx: angleViz.currentBarIdx,
        } : null,
        // 角度简报（文字）
        summary: this._buildGannSummary(gannBox, gannAngles, nearestGann, isBullSignal),
      },

      // 历史回测
      history: {
        confidence:   histConf.confidence,
        rating:       histConf.rating,
        totalSignals: histConf.similarHistory,
        winRate:      histConf.similarWinRate,
        avgReturn:    histConf.avgReturn,
        sharpeRatio:  histConf.sharpeRatio,
      },

      // 止损/止盈（ATR驱动 → 资金管理引擎覆盖）
      suggestStopLoss:  riskWarn ? riskWarn.stopLoss      : null,
      suggestTarget:    riskWarn ? riskWarn.takeProfit     : null,
      suggestStopPct:   riskWarn ? riskWarn.stopLossPct    : null,
      suggestTargetPct: riskWarn ? riskWarn.takeProfitPct  : null,
      rrr:              riskWarn ? riskWarn.rrr             : null,
      // 资金管理引擎覆盖仓位
      suggestPosition:  moneyMgmt.suggestPosition,

      // 新功能输出
      volumeFilter:  volFilter,
      fakeFilter:    fakeFilter,
      blackSwan:     swanResult,
      multiTF:       mtfResult,
      moneyManagement: moneyMgmt,

      // 可视化（注入新功能摘要卡）
      visualization: {
        ...viz,
        htmlSummary: viz.htmlSummary
          + this._buildFiltersHTML(volFilter, fakeFilter, mtfResult, moneyMgmt),
      },
    };

    this._enhanceCache.set(cacheKey, enhanced);
    return enhanced;
  }

  // ── 江恩动态摘要（自然语言描述）──────────────────────────────────────────
  _buildGannSummary(box, angles, nearestLevel, isBull) {
    if (!box || !angles) return '江恩数据不足';
    const ch  = angles.currentChannel;
    const vf  = box.volatilityFactor;
    const atr = box.atr;
    const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n))return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():'$'+_n.toFixed(2); };

    let s = '';
    // 通道状态
    if (ch) s += `当前处于「${ch.label}」`;
    // 波动率状态
    s += vf > 1.5 ? '，波动率偏高（角度线变陡）'
       : vf < 0.7 ? '，波动率偏低（角度线平缓）'
       : '，波动率正常';
    // 最近关键位
    if (nearestLevel) {
      s += `。最近关键位 ${fmtP(nearestLevel.price)}（${nearestLevel.isAbove ? '上方阻力' : '下方支撑'}）`
        + `，预计触及时间窗口 ${nearestLevel.timeWindow}`;
    }
    // 方向建议
    s += isBull ? '。ATR=' + fmtP(atr) + '，关注支撑位企稳入场机会'
                : '。ATR=' + fmtP(atr) + '，关注阻力位回落做空机会';
    return s;
  }

  // ── 可视化建议（含角度线点集）────────────────────────────────────────────
  _buildVizSuggestion(signal, riskWarn, gannLevels, gannAngles, gannBox, angleViz, curPrice) {
    const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n)||_n===0)return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };
    const lines = [];

    // 当前价格线
    lines.push({ type:'price', price:curPrice, color:'#d4a843',
      label:`当前价 ${fmtP(curPrice)}`, dash:false, width:2 });

    // 止损/目标线
    if (riskWarn) {
      lines.push({ type:'sl', price:riskWarn.stopLoss, color:'#e04848',
        label:`⛔ 止损 ${fmtP(riskWarn.stopLoss)} (-${riskWarn.stopLossPct}%)`, dash:true, width:1.5 });
      lines.push({ type:'tp', price:riskWarn.takeProfit, color:'#28c870',
        label:`🎯 目标 ${fmtP(riskWarn.takeProfit)} (+${riskWarn.takeProfitPct}%)`, dash:true, width:1.5 });
    }

    // 江恩关键位水平线（带时间窗口，按距离排序取前5）
    gannLevels.slice(0, 5).forEach(l => {
      const isSupport = !l.isAbove;
      lines.push({ type:'gann', price:l.price,
        color: isSupport ? '#2060a0' : '#a04020',
        label:`${l.label} ${fmtP(l.price)} ⏰${l.timeWindow}`,
        dash:true, width:1, timeWindow:l.timeWindow, isAbove:l.isAbove });
    });

    // 中枢区间带（若有效）
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

  // ── 可视化HTML（完整版，含角度线简报+时间窗口表+止损目标卡）────────────
  _buildVizHTML(lines, channelNote, riskWarn, gannLevels, gannBox, gannAngles, curPrice) {
    const fmtP = v => { const _n=Number(v); if(isNaN(_n)||!isFinite(_n)||_n===0)return'--'; return _n>=1000?'$'+Math.round(_n).toLocaleString():_n>=1?'$'+_n.toFixed(2):'$'+_n.toFixed(4); };

    let html = '<div style="margin-top:12px;border-top:1px solid var(--border);padding-top:12px">'
      + '<div style="font-size:.65rem;font-weight:700;color:var(--faint);letter-spacing:.08em;text-transform:uppercase;margin-bottom:8px">'
      + '🎯 可视化：止损/目标 · 江恩角度线 · 时间窗口</div>';

    // ── 止损/目标/盈亏比/建议仓位 四格卡 ──
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
    } catch(e) { /* 忽略单个失败 */ }
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
