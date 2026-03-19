// data.js — 天機數元 · 玄学引擎数据与算法核心
// 所有常量、天盘数据、引擎函数均在此文件
// 由 index.html 通过 <script src="data.js"> 引入

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

  // Counter animation
  let cur = 0;
  const numEl = document.getElementById('scoreNum');
  const iv = setInterval(() => {
    cur = Math.min(cur + 2, score);
    if (numEl) {
      numEl.textContent = cur;
      numEl.style.color = scoreColor;
    }
    if (cur >= score) clearInterval(iv);
  }, 18);

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
  tabDefs.forEach((t,i) => {
    const div = document.createElement('div');
    div.className = 'tab-panel' + (i===0?' active':'');
    div.id = 'tp-'+t.id;
    if(typeof panels[t.id] === 'string') div.innerHTML = panels[t.id];
    else if(panels[t.id]) div.appendChild(panels[t.id]);
    content.appendChild(div);
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
  if(panel) panel.classList.add('active');
}

// ═══════════════════════════════════════════════
// ═══════════════════════════════════════════════
// AUTO FETCH PRICE FROM BINANCE (无需token)
// ═══════════════════════════════════════════════
