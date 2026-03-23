

(function(global) {
'use strict';

if (global._QUANT_LOADED) { return; }
global._QUANT_LOADED = true;

const _o=k=>parseFloat(k[1]!==undefined?k[1]:k.o);
const _h=k=>parseFloat(k[2]!==undefined?k[2]:k.h);
const _l=k=>parseFloat(k[3]!==undefined?k[3]:k.l);
const _c=k=>parseFloat(k[4]!==undefined?k[4]:k.c);
const _v=k=>parseFloat(k[5]!==undefined?k[5]:k.v||0);
const _t=k=>parseInt(k[0]!==undefined?k[0]:k.t||k.ms||0);

function norm(kl) {
  if (!kl||!kl.length) return [];
  return kl.map(k=>({o:_o(k),h:_h(k),l:_l(k),c:_c(k),v:_v(k),t:_t(k)}));
}

function calcMA(p,n){const o=new Array(p.length).fill(null);for(let i=n-1;i<p.length;i++){let s=0;for(let j=0;j<n;j++)s+=p[i-j];o[i]=s/n;}return o;}
function calcEMA(p,n){const k=2/(n+1);let e=p[0];const o=[e];for(let i=1;i<p.length;i++){e=p[i]*k+e*(1-k);o.push(e);}return o;}
function calcRSIArr(p,n=14){if(p.length<n+1)return new Array(p.length).fill(null);let ag=0,al=0;for(let i=1;i<=n;i++){const d=p[i]-p[i-1];d>0?ag+=d:al-=d;}ag/=n;al/=n;const o=new Array(n).fill(null);o.push(al===0?100:100-100/(1+ag/al));for(let i=n+1;i<p.length;i++){const d=p[i]-p[i-1];ag=(ag*(n-1)+Math.max(d,0))/n;al=(al*(n-1)+Math.max(-d,0))/n;o.push(al===0?100:100-100/(1+ag/al));}return o;}
function calcRSI(p,n=14){const a=calcRSIArr(p,n).filter(v=>v!==null);return a.length?a[a.length-1]:50;}
function calcATR(kl,n=14){if(!kl||kl.length<n+1)return 0;const trs=kl.slice(1).map((k,i)=>Math.max(k.h-k.l,Math.abs(k.h-kl[i].c),Math.abs(k.l-kl[i].c)));return trs.slice(-n).reduce((a,b)=>a+b,0)/n;}
function calcBB(p,n=20,m=2){const last=p.length-1;if(last<n-1)return{upper:0,lower:0,mid:0,pos:0.5,std:0};const sl=p.slice(last-n+1,last+1),mean=sl.reduce((a,b)=>a+b,0)/n,std=Math.sqrt(sl.reduce((s,v)=>s+(v-mean)**2,0)/n);const upper=mean+m*std,lower=mean-m*std;return{upper,lower,mid:mean,pos:upper===lower?0.5:(p[last]-lower)/(upper-lower),std};}
function calcStdDev(arr){const m=arr.reduce((a,b)=>a+b,0)/arr.length;return Math.sqrt(arr.reduce((s,v)=>s+(v-m)**2,0)/arr.length);}

function calcMACDFull(p) {
  const e12=calcEMA(p,12),e26=calcEMA(p,26);
  const macdLine=p.map((_,i)=>e12[i]!==null&&e26[i]!==null?e12[i]-e26[i]:null);
  const vals=macdLine.filter(v=>v!==null);
  const k=2/10;let sig=vals[0];const sArr=[sig];
  for(let i=1;i<vals.length;i++){sig=vals[i]*k+sig*(1-k);sArr.push(sig);}
  let si=0;
  const signal=macdLine.map(v=>v!==null?sArr[si++]:null);
  const hist=macdLine.map((v,i)=>v!==null&&signal[i]!==null?v-signal[i]:null);
  const lastH=hist.filter(v=>v!==null).slice(-1)[0]||0;
  const lastM=vals[vals.length-1]||0,lastS=sArr[sArr.length-1]||0;
  let bullDiv=false,bearDiv=false;
  try {
    const win=Math.min(60,p.length),rp=p.slice(-win),rh=hist.filter(v=>v!==null).slice(-win);
    if(rh.length>=10){
      let p1i=-1,p2i=-1,p1v=Infinity,p2v=Infinity;
      for(let i=5;i<rp.length-3;i++){if(rp[i]<rp[i-1]&&rp[i]<rp[i-2]&&rp[i]<rp[i+1]&&rp[i]<rp[i+2]){if(rp[i]<p1v){p2v=p1v;p2i=p1i;p1v=rp[i];p1i=i;}}}
      if(p1i>0&&p2i>0&&p1i!==p2i){
        const li=Math.max(p1i,p2i),ei=Math.min(p1i,p2i);
        const lh2=rh[Math.min(li,rh.length-1)]||0,eh2=rh[Math.min(ei,rh.length-1)]||0;
        if(rp[li]<rp[ei]&&lh2>eh2&&lastH<0)bullDiv=true;
        if(rp[li]>rp[ei]&&lh2<eh2&&lastH>0)bearDiv=true;
      }
    }
  }catch(_){}
  return{macd:lastM,signal:lastS,hist:lastH,bullDiv,bearDiv,histArr:hist,macdLine};
}

function calcADX(kl,n=14){
  if(!kl||kl.length<n*2+2)return{adx:20,pdi:0,ndi:0,trending:false,strong:false,ranging:true};
  try{
    const tr=[],pdm=[],ndm=[];
    for(let i=1;i<kl.length;i++){
      const hi=kl[i].h,lo=kl[i].l,phc=kl[i-1].c;
      tr.push(Math.max(hi-lo,Math.abs(hi-phc),Math.abs(lo-phc)));
      const up=hi-kl[i-1].h,dn=kl[i-1].l-lo;
      pdm.push(up>dn&&up>0?up:0);ndm.push(dn>up&&dn>0?dn:0);
    }
    const ws=(arr,p)=>{let s=arr.slice(0,p).reduce((a,b)=>a+b,0);const o=[s];for(let i=p;i<arr.length;i++){s=s-s/p+arr[i];o.push(s);}return o;};
    const sTR=ws(tr,n),sPDM=ws(pdm,n),sNDM=ws(ndm,n);
    const dxArr=sTR.map((t,i)=>{if(t===0)return 0;const pdi=sPDM[i]/t*100,ndi=sNDM[i]/t*100,sum=pdi+ndi;return sum===0?0:Math.abs(pdi-ndi)/sum*100;});
    const adxArr=ws(dxArr,n);
    const adx=adxArr[adxArr.length-1]||20;
    const pdi=sTR[sTR.length-1]>0?sPDM[sPDM.length-1]/sTR[sTR.length-1]*100:0;
    const ndi=sTR[sTR.length-1]>0?sNDM[sNDM.length-1]/sTR[sTR.length-1]*100:0;
    return{adx,pdi,ndi,trending:adx>22,strong:adx>35,ranging:adx<18};
  }catch(e){return{adx:20,pdi:0,ndi:0,trending:false,strong:false,ranging:true};}
}

function calcSupertrend(kl,mult=3,atrP=10){
  if(!kl||kl.length<atrP+2)return{signal:'neutral',value:0,bull:false,bear:false};
  try{
    const atr=calcATR(kl,atrP)||kl[kl.length-1].c*0.02;
    let upBand=(kl[kl.length-1].h+kl[kl.length-1].l)/2+mult*atr;
    let dnBand=(kl[kl.length-1].h+kl[kl.length-1].l)/2-mult*atr;
    let trend=1;
    for(let i=Math.max(1,kl.length-15);i<kl.length;i++){
      const hl2=(kl[i].h+kl[i].l)/2,newUp=hl2+mult*atr,newDn=hl2-mult*atr;
      if(newDn>dnBand||(kl[i-1]&&kl[i-1].c<dnBand))dnBand=newDn;
      if(newUp<upBand||(kl[i-1]&&kl[i-1].c>upBand))upBand=newUp;
      if(kl[i].c>upBand)trend=1;else if(kl[i].c<dnBand)trend=-1;
    }
    return{signal:trend===1?'bull':'bear',bull:trend===1,bear:trend===-1,support:dnBand,resistance:upBand,value:trend===1?dnBand:upBand};
  }catch(e){return{signal:'neutral',value:0,bull:false,bear:false};}
}

function calcIchimoku(kl){
  if(!kl||kl.length<52)return null;
  try{
    const midpt=(n,i)=>{const sl=kl.slice(Math.max(0,i-n+1),i+1);return(Math.max(...sl.map(k=>k.h))+Math.min(...sl.map(k=>k.l)))/2;};
    const n=kl.length-1;
    const tenkan=midpt(9,n),kijun=midpt(26,n);
    const senkouA=(tenkan+kijun)/2,senkouB=midpt(52,n);
    const price=kl[n].c,chikou=kl[Math.max(0,n-26)]?.c||kl[0].c;
    const cloudBull=senkouA>senkouB,aboveCloud=price>Math.max(senkouA,senkouB),belowCloud=price<Math.min(senkouA,senkouB);
    const tkBull=tenkan>kijun,chikouBull=price>chikou;
    const fullBull=aboveCloud&&tkBull&&chikouBull&&cloudBull,fullBear=belowCloud&&!tkBull&&!chikouBull&&!cloudBull;
    return{tenkan,kijun,senkouA,senkouB,cloudBull,aboveCloud,belowCloud,inCloud:!aboveCloud&&!belowCloud,tkBull,chikouBull,fullBull,fullBear,score:(aboveCloud?1.5:belowCloud?-1.5:0)+(tkBull?0.8:-0.8)+(chikouBull?0.5:-0.5)};
  }catch(e){return null;}
}

function calcVegas(kl){
  if(!kl||kl.length<170)return null;
  const p=kl.map(k=>k.c),n=p.length;
  const e144=calcEMA(p,144),e169=calcEMA(p,169);
  const v144=e144[n-1],v169=e169[n-1];if(!v144||!v169)return null;
  const price=p[n-1];
  return{e144:v144,e169:v169,above:price>Math.max(v144,v169),below:price<Math.min(v144,v169),inside:price>=Math.min(v144,v169)&&price<=Math.max(v144,v169),bullCross:v144>v169,midpoint:(v144+v169)/2};
}

function calcOBV(kl){
  if(!kl||kl.length<10)return{obvTrend:0,obvDiv:false,obv:0,score:0};
  let obv=0;const arr=[0];
  for(let i=1;i<kl.length;i++){if(kl[i].c>kl[i-1].c)obv+=kl[i].v;else if(kl[i].c<kl[i-1].c)obv-=kl[i].v;arr.push(obv);}
  const n=arr.length,lb=Math.min(20,Math.floor(n/3));
  const obvTrend=arr[n-1]>arr[n-1-lb]?1:-1,priceTrend=kl[n-1].c>kl[n-1-lb]?.c?1:-1;
  const obvDiv=obvTrend!==priceTrend;
  const obvMA10=arr.slice(-10).reduce((a,b)=>a+b,0)/Math.min(10,n);
  let score=0;
  if(obvTrend===1&&arr[n-1]>obvMA10)score=0.8;else if(obvTrend===-1&&arr[n-1]<obvMA10)score=-0.8;
  if(obvDiv)score+=(obvTrend===1?1.5:-1.5);
  return{obvTrend,obvDiv,obv:arr[n-1],score,obvArr:arr};
}

function calcCVD(kl){
  if(!kl||kl.length<5)return{cvd:0,cvdTrend:0,bullishDelta:false,diverging:false};
  let cvd=0;const arr=[];
  for(const k of kl){const body=k.c-k.o,range=k.h-k.l||1;const bV=body>0?k.v*(body/range):k.v*0.3,bR=body<0?k.v*(-body/range):k.v*0.3;cvd+=bV-bR;arr.push(cvd);}
  const n=arr.length,cvdTrend=arr[n-1]>arr[Math.max(0,n-10)]?1:-1,priceTrend=kl[n-1].c>kl[Math.max(0,n-10)].c?1:-1;
  return{cvd:arr[n-1],cvdTrend,bullishDelta:cvdTrend===1,diverging:cvdTrend!==priceTrend,cvdArr:arr};
}

function calcHV(p,n=20){
  if(!p||p.length<n+1)return{hv:0,expanding:false,contracting:false,ratio:1};
  const logR=[];for(let i=1;i<p.length;i++){if(p[i]>0&&p[i-1]>0)logR.push(Math.log(p[i]/p[i-1]));}
  if(logR.length<n)return{hv:0,expanding:false,contracting:false,ratio:1};
  const recent=logR.slice(-n),mean=recent.reduce((a,b)=>a+b,0)/n;
  const hv=Math.sqrt(recent.reduce((s,r)=>s+(r-mean)**2,0)/n*252)*100;
  const older=logR.slice(-n*2,-n);
  let hvOld=hv;
  if(older.length>=n){const m2=older.reduce((a,b)=>a+b,0)/older.length;hvOld=Math.sqrt(older.reduce((s,r)=>s+(r-m2)**2,0)/older.length*252)*100;}
  return{hv,expanding:hv>hvOld*1.1,contracting:hv<hvOld*0.9,ratio:hvOld>0?hv/hvOld:1};
}

function findSwings(kl,lb=3){
  const n=kl.length,peaks=[],troughs=[];
  if(n<lb*2+2)return{peaks,troughs};
  for(let i=lb;i<n-lb;i++){
    let isPeak=true,isTr=true;
    for(let j=1;j<=lb;j++){if(kl[i].h<=kl[i-j].h||kl[i].h<=kl[i+j].h)isPeak=false;if(kl[i].l>=kl[i-j].l||kl[i].l>=kl[i+j].l)isTr=false;}
    if(isPeak)peaks.push({idx:i,price:kl[i].h,t:kl[i].t});
    if(isTr)troughs.push({idx:i,price:kl[i].l,t:kl[i].t});
  }
  return{peaks,troughs};
}
function calcMktStr(kl){
  if(!kl||kl.length<30)return{bias:'neutral',bosScore:0,structureScore:0,hhhl:false,lllh:false};
  try{
    const{peaks,troughs}=findSwings(kl.slice(-80),3);
    if(peaks.length<2||troughs.length<2)return{bias:'neutral',bosScore:0,structureScore:0,hhhl:false,lllh:false};
    const price=kl[kl.length-1].c,lp=peaks[peaks.length-1],pp=peaks[peaks.length-2],lt=troughs[troughs.length-1],pt=troughs[troughs.length-2];
    const hhhl=lp.price>pp.price&&lt.price>pt.price,lllh=lp.price<pp.price&&lt.price<pt.price;
    const bullBOS=price>lp.price,bearBOS=price<lt.price,bullCHoCH=lllh&&price>lp.price,bearCHoCH=hhhl&&price<lt.price;
    const bias=hhhl?'bull':lllh?'bear':'neutral';
    return{hhhl,lllh,bullBOS,bearBOS,bullCHoCH,bearCHoCH,bias,lastSwingHigh:lp.price,lastSwingLow:lt.price,bosScore:bullBOS?1.5:bearBOS?-1.5:0,structureScore:(hhhl?1.2:lllh?-1.2:0)+(bullCHoCH?1.0:bearCHoCH?-1.0:0)};
  }catch(e){return{bias:'neutral',bosScore:0,structureScore:0,hhhl:false,lllh:false};}
}

function calcStochRSI(kl,rP=14,sP=14){
  if(!kl||kl.length<rP+sP+5)return{k:50,d:50,bullCross:false,bearCross:false};
  const p=kl.map(k=>k.c),rsiA=calcRSIArr(p,rP).filter(v=>v!==null);
  if(rsiA.length<sP)return{k:50,d:50,bullCross:false,bearCross:false};
  const win=rsiA.slice(-sP),mn=Math.min(...win),mx=Math.max(...win);
  const k=mx===mn?50:(rsiA[rsiA.length-1]-mn)/(mx-mn)*100;
  let prevK=k;
  if(rsiA.length>sP){const w2=rsiA.slice(-sP-1,-1),mn2=Math.min(...w2),mx2=Math.max(...w2);prevK=mx2===mn2?50:(rsiA[rsiA.length-2]-mn2)/(mx2-mn2)*100;}
  return{k,d:(k+prevK)/2,bullCross:prevK<20&&k>=20,bearCross:prevK>80&&k<=80};
}

function calcCandles(kl){
  if(!kl||kl.length<5)return{patterns:[],score:0,hasBull:false,hasBear:false};
  const patterns=[];let score=0;
  const c=kl[kl.length-1],p=kl[kl.length-2],p2=kl[kl.length-3];
  const cB=Math.abs(c.c-c.o),cR=c.h-c.l||0.001,cU=c.h-Math.max(c.c,c.o),cL=Math.min(c.c,c.o)-c.l,bull=c.c>c.o;
  if(cB>0&&cL>cB*2&&cU<cB*0.5){patterns.push({n:'🔨锤子线',bull:true});score+=1.2;}
  if(cB>0&&cU>cB*2&&cL<cB*0.5){patterns.push({n:'💫流星线',bull:false});score-=1.2;}
  if(cR>0&&cB/cR<0.1){patterns.push({n:'✚十字星',bull:null});}
  if(p.c<p.o&&bull&&c.o<p.c&&c.c>p.o){patterns.push({n:'🟢多头吞没',bull:true});score+=1.5;}
  if(p.c>p.o&&!bull&&c.o>p.c&&c.c<p.o){patterns.push({n:'🔴空头吞没',bull:false});score-=1.5;}
  if(p2&&p2.c<p2.o&&Math.abs(p.c-p.o)<(p2.o-p2.c)*0.3&&bull&&c.c>(p2.o+p2.c)/2){patterns.push({n:'🌅晨星',bull:true});score+=2.0;}
  if(p2&&p2.c>p2.o&&Math.abs(p.c-p.o)<(p2.c-p2.o)*0.3&&!bull&&c.c<(p2.o+p2.c)/2){patterns.push({n:'🌆暮星',bull:false});score-=2.0;}
  if(cL>cR*0.6&&cB<cR*0.25){patterns.push({n:'📌下影针',bull:true});score+=0.8;}
  if(cU>cR*0.6&&cB<cR*0.25){patterns.push({n:'📌上影针',bull:false});score-=0.8;}
  return{patterns,score,hasBull:score>0,hasBear:score<0};
}

function calcVolProfile(kl){
  if(!kl||kl.length<20)return{poc:0,vah:0,val:0,avg:0,lastVol:0,ratio:1};
  const recent=kl.slice(-20),avg=recent.reduce((a,k)=>a+k.v,0)/recent.length,lv=kl[kl.length-1].v;
  const profKL=kl.slice(-60).filter(k=>k.h>k.l&&k.v>0);
  let poc=0,vah=0,val_p=0;
  if(profKL.length>=10){
    const pMin=Math.min(...profKL.map(k=>k.l)),pMax=Math.max(...profKL.map(k=>k.h));
    const range=pMax-pMin,B=24,bs=range/B||1;const buckets=new Array(B).fill(0);
    profKL.forEach(k=>{const lo=Math.max(0,Math.floor((k.l-pMin)/bs)),hi=Math.min(B-1,Math.floor((k.h-pMin)/bs));const frac=bs/(k.h-k.l||bs);for(let b=lo;b<=hi;b++)buckets[b]+=k.v*frac;});
    const mxV=Math.max(...buckets),pocIdx=buckets.indexOf(mxV);poc=pMin+pocIdx*bs+bs/2;
    const total=buckets.reduce((a,b)=>a+b,0);let vaVol=mxV,vahIdx=pocIdx,valIdx=pocIdx;
    while(vaVol<total*0.70&&(vahIdx<B-1||valIdx>0)){const up=vahIdx<B-1?buckets[vahIdx+1]:0,dn=valIdx>0?buckets[valIdx-1]:0;if(up>=dn&&vahIdx<B-1){vahIdx++;vaVol+=up;}else if(valIdx>0){valIdx--;vaVol+=dn;}else break;}
    vah=pMin+(vahIdx+1)*bs;val_p=pMin+valIdx*bs;
  }
  return{poc,vah,val:val_p,avg,lastVol:lv,ratio:avg>0?lv/avg:1};
}

function calcMTF(klMap){
  const tfs=['15m','1h','4h','1d'];let bullCount=0,bearCount=0,total=0;const details=[];
  for(const tf of tfs){
    const kl=klMap[tf];if(!kl||kl.length<55)continue;
    const p=kl.map(k=>k.c).filter(v=>v>0),n=p.length;if(n<55)continue;
    const ma20=calcMA(p,20)[n-1],ma55=calcMA(p,55)[n-1];if(!ma20||!ma55)continue;
    const bull=ma20>ma55;bull?bullCount++:bearCount++;total++;details.push({tf,bull});
  }
  if(!total)return{alignment:0,score:0,bullCount:0,bearCount:0,details:[],fullyAligned:false,partiallyAligned:false,total:0};
  const alignment=(bullCount-bearCount)/total;
  return{alignment,score:alignment*1.8,bullCount,bearCount,total,details,fullyAligned:Math.abs(alignment)>0.9,partiallyAligned:Math.abs(alignment)>0.5};
}

function calcVWAP(kl){
  if(!kl||kl.length<5)return 0;
  const day=kl.slice(-24),tpv=day.reduce((s,k)=>s+(k.h+k.l+k.c)/3*k.v,0),vol=day.reduce((s,k)=>s+k.v,0);
  return vol>0?tpv/vol:kl[kl.length-1].c;
}

function calcConviction(a){
  const{isBull,rsi,macd,mktStr,adx,supertrend,vegas,obv,cvd,mtf,hv,candles,ichimoku,tr1d,tr1w,fundingMeta}=a;
  const pillars=[],weaknesses=[];

  const htfStrong=isBull?(tr1d>0&&tr1w>0):(tr1d<0&&tr1w<0);
  const htfAgrees=isBull?(tr1d>0||tr1w>0):(tr1d<0||tr1w<0);
  if(htfStrong)pillars.push({name:'HTF双线顺势',detail:`日+周${isBull?'多头':'空头'}`,weight:20});
  else if(htfAgrees)pillars.push({name:'HTF单线顺势',detail:`大趋势${isBull?'多头':'空头'}`,weight:12});
  else weaknesses.push({name:'HTF逆势',detail:'日/周趋势相反',severity:'high'});

  if(isBull&&mktStr?.hhhl)pillars.push({name:'HH/HL多头结构',detail:'高低点持续抬升',weight:15});
  else if(!isBull&&mktStr?.lllh)pillars.push({name:'LL/LH空头结构',detail:'高低点持续下移',weight:15});
  else if(isBull&&mktStr?.bullCHoCH)pillars.push({name:'CHoCH多头转换',detail:'结构从空转多',weight:10});
  else if(!isBull&&mktStr?.bearCHoCH)pillars.push({name:'CHoCH空头转换',detail:'结构从多转空',weight:10});
  else weaknesses.push({name:'结构不清晰',detail:'无明显HH/HL或LL/LH',severity:'medium'});

  if(isBull&&macd?.bullDiv)pillars.push({name:'MACD底背驰',detail:'空头力竭，反转信号',weight:18});
  else if(!isBull&&macd?.bearDiv)pillars.push({name:'MACD顶背驰',detail:'多头力竭，顶部信号',weight:18});
  else if(isBull&&macd?.hist>0)pillars.push({name:'MACD多头动能',detail:'柱状图为正',weight:8});
  else if(!isBull&&macd?.hist<0)pillars.push({name:'MACD空头动能',detail:'柱状图为负',weight:8});
  else weaknesses.push({name:'MACD逆势',detail:'动能方向相反',severity:'medium'});

  if(isBull&&vegas?.above)pillars.push({name:'Vegas通道上方',detail:'EMA144/169共同支撑',weight:10});
  else if(!isBull&&vegas?.below)pillars.push({name:'Vegas通道下方',detail:'EMA144/169共同压制',weight:10});
  else if(vegas)weaknesses.push({name:'Vegas逆势',detail:'价格不在有利通道',severity:'low'});

  if(ichimoku){
    if(isBull&&ichimoku.fullBull)pillars.push({name:'Ichimoku全多共振',detail:'云上+TK多+Chikou多',weight:12});
    else if(!isBull&&ichimoku.fullBear)pillars.push({name:'Ichimoku全空共振',detail:'云下+TK空+Chikou空',weight:12});
    else if(isBull&&ichimoku.aboveCloud)pillars.push({name:'云上运行',detail:'价格高于云层',weight:6});
    else if(!isBull&&ichimoku.belowCloud)pillars.push({name:'云下运行',detail:'价格低于云层',weight:6});
  }

  if(isBull&&supertrend?.bull)pillars.push({name:'Supertrend多头',detail:`支撑@${supertrend.value?.toFixed?.(2)||''}`,weight:8});
  else if(!isBull&&supertrend?.bear)pillars.push({name:'Supertrend空头',detail:'下方支撑被破',weight:8});
  else weaknesses.push({name:'Supertrend逆势',detail:'趋势方向相反',severity:'low'});

  if(isBull&&obv?.obvTrend===1)pillars.push({name:'OBV量能流入',detail:'筹码净流入',weight:8});
  else if(!isBull&&obv?.obvTrend===-1)pillars.push({name:'OBV量能流出',detail:'筹码净流出',weight:8});
  else weaknesses.push({name:'OBV量价背离',detail:'量能方向不支持',severity:'low'});
  if(isBull&&cvd?.bullishDelta)pillars.push({name:'CVD买盘主导',detail:'Taker买压大于卖压',weight:6});
  else if(!isBull&&!cvd?.bullishDelta)pillars.push({name:'CVD卖盘主导',detail:'Taker卖压大于买压',weight:6});

  if(isBull&&rsi<35)pillars.push({name:'RSI超卖区域',detail:`RSI ${rsi.toFixed(0)} < 35`,weight:10});
  else if(!isBull&&rsi>65)pillars.push({name:'RSI超买区域',detail:`RSI ${rsi.toFixed(0)} > 65`,weight:10});
  else if(isBull&&rsi>68)weaknesses.push({name:'RSI超买做多',detail:'超买区间追多风险高',severity:'medium'});
  else if(!isBull&&rsi<32)weaknesses.push({name:'RSI超卖做空',detail:'超卖区间做空风险高',severity:'medium'});

  if(adx?.strong)pillars.push({name:'ADX强趋势',detail:`ADX ${adx.adx?.toFixed(0)||''} > 35`,weight:8});
  else if(adx?.ranging)weaknesses.push({name:'ADX震荡市',detail:'无明显趋势，慎追',severity:'low'});

  if(mtf?.fullyAligned){
    if(isBull&&mtf.alignment>0)pillars.push({name:'MTF全框架多头共振',detail:`${mtf.bullCount}/${mtf.total}时框看多`,weight:15});
    else if(!isBull&&mtf.alignment<0)pillars.push({name:'MTF全框架空头共振',detail:`${mtf.bearCount}/${mtf.total}时框看空`,weight:15});
  }else if(mtf?.partiallyAligned){
    if(isBull&&mtf.alignment>0)pillars.push({name:'MTF多数看多',detail:'多数时框一致',weight:8});
    else if(!isBull&&mtf.alignment<0)pillars.push({name:'MTF多数看空',detail:'多数时框一致',weight:8});
  }else if(mtf?.total>0){
    weaknesses.push({name:'MTF信号分歧',detail:'各时框方向不一致',severity:'medium'});
  }

  if(candles?.patterns?.length){
    const match=candles.patterns.filter(p=>isBull?p.bull===true:p.bull===false);
    if(match.length)pillars.push({name:match.map(p=>p.n).join('·'),detail:'K线形态确认',weight:6});
  }

  if(fundingMeta){
    if(isBull&&fundingMeta.extremeShort)pillars.push({name:'资金费率空头极端',detail:`空头大量支付 ${fundingMeta.rate?.toFixed(4)}%，挤仓风险`,weight:10});
    else if(!isBull&&fundingMeta.extremeLong)pillars.push({name:'资金费率多头极端',detail:`多头大量支付 ${fundingMeta.rate?.toFixed(4)}%，爆仓风险`,weight:10});
    else if(isBull&&fundingMeta.rate<0)pillars.push({name:'资金费率偏空',detail:'空头支付，利好做多',weight:6});
    else if(!isBull&&fundingMeta.rate>0.05)weaknesses.push({name:'资金费率多头拥挤',detail:'空头爆仓风险反升',severity:'low'});
  }

  const totalW=pillars.reduce((s,p)=>s+p.weight,0);
  const weakSev=weaknesses.filter(w=>w.severity==='high').length*15+weaknesses.filter(w=>w.severity==='medium').length*8+weaknesses.filter(w=>w.severity==='low').length*3;
  const score=Math.max(0,Math.min(100,totalW-weakSev));
  const grade=score>=65?'A':score>=45?'B':score>=25?'C':'D';
  const gradeColor=grade==='A'?'var(--green)':grade==='B'?'var(--gold)':grade==='C'?'var(--amber)':'var(--red)';
  const gradeLabel=grade==='A'?'高确信入场':grade==='B'?'中等确信':grade==='C'?'低确信':grade==='D'?'不建议入场':'--';
  return{pillars,weaknesses,convictionScore:score,grade,gradeColor,gradeLabel,totalW,weakSev};
}

function analyze(kl, sym, klMap, fundingMeta) {
  if (!kl||kl.length<30) return null;
  const kn=norm(kl);
  const prices=kn.map(k=>k.c),n=prices.length;

  const rsi      = calcRSI(prices);
  const macd     = calcMACDFull(prices);
  const bb       = calcBB(prices);
  const adx      = calcADX(kn);
  const atr      = calcATR(kn);
  const stoch    = calcStochRSI(kn);
  const supertrend = calcSupertrend(kn);
  const ichimoku = calcIchimoku(kn);
  const vegas    = calcVegas(kn);
  const obv      = calcOBV(kn);
  const cvd      = calcCVD(kn);
  const hv       = calcHV(prices);
  const mktStr   = calcMktStr(kn);
  const candles  = calcCandles(kn);
  const volProf  = calcVolProfile(kn);
  const vwap     = calcVWAP(kn);
  const ma20v    = calcMA(prices,20)[n-1];
  const ma55v    = calcMA(prices,55)[n-1];
  const ma200v   = calcMA(prices,200)[n-1];

  let mtf = {alignment:0,score:0,fullyAligned:false,partiallyAligned:false,details:[],bullCount:0,bearCount:0,total:0};
  if (klMap) {
    const normMap={};
    for(const tf of Object.keys(klMap)) normMap[tf]=norm(klMap[tf]);
    mtf = calcMTF(normMap);
  }

  let tr1d=0,tr1w=0;
  if(klMap?.['1d']){const p=norm(klMap['1d']).map(k=>k.c);const m20=calcMA(p,20)[p.length-1],m55=calcMA(p,55)[p.length-1];if(m20&&m55)tr1d=m20>m55?1:-1;}
  if(klMap?.['1w']){const p=norm(klMap['1w']).map(k=>k.c);const m10=calcMA(p,10)[p.length-1];if(m10)tr1w=p[p.length-1]>m10?1:-1;}

  if(!fundingMeta&&global.S?.fundingMeta&&sym){
    const key=sym.includes('USDT')?sym:sym+'USDT';
    fundingMeta=global.S.fundingMeta[key]||null;
  }

  let score=0;const sigs=[];
  if(rsi<30){score+=1.8;sigs.push({l:`RSI ${rsi.toFixed(0)} 超卖`,c:'sig-bull'});}
  else if(rsi<40){score+=0.8;sigs.push({l:`RSI ${rsi.toFixed(0)} 偏低`,c:'sig-bull'});}
  else if(rsi>70){score-=1.8;sigs.push({l:`RSI ${rsi.toFixed(0)} 超买`,c:'sig-bear'});}
  else if(rsi>60){score-=0.8;sigs.push({l:`RSI ${rsi.toFixed(0)} 偏高`,c:'sig-bear'});}

  if(macd.bullDiv){score+=2.2;sigs.push({l:'MACD底背驰',c:'sig-bull'});}
  else if(macd.bearDiv){score-=2.2;sigs.push({l:'MACD顶背驰',c:'sig-bear'});}
  else if(macd.hist>0){score+=0.7;sigs.push({l:'MACD多头',c:'sig-bull'});}
  else{score-=0.7;sigs.push({l:'MACD空头',c:'sig-bear'});}

  if(stoch.bullCross){score+=1.5;sigs.push({l:'StochRSI超卖金叉',c:'sig-bull'});}
  else if(stoch.bearCross){score-=1.5;sigs.push({l:'StochRSI超买死叉',c:'sig-bear'});}

  if(bb.pos<0.1){score+=1.2;sigs.push({l:'BB下轨支撑',c:'sig-bull'});}
  else if(bb.pos>0.9){score-=1.2;sigs.push({l:'BB上轨压力',c:'sig-bear'});}

  if(adx.trending&&adx.pdi>adx.ndi){score+=0.9;sigs.push({l:`ADX${adx.adx.toFixed(0)}多头`,c:'sig-bull'});}
  else if(adx.trending&&adx.ndi>adx.pdi){score-=0.9;sigs.push({l:`ADX${adx.adx.toFixed(0)}空头`,c:'sig-bear'});}

  if(supertrend.bull){score+=1.0;sigs.push({l:'Supertrend多头',c:'sig-bull'});}
  else if(supertrend.bear){score-=1.0;sigs.push({l:'Supertrend空头',c:'sig-bear'});}

  if(ichimoku){
    score+=ichimoku.score*0.6;
    if(ichimoku.fullBull)sigs.push({l:'Ichimoku全多',c:'sig-bull'});
    else if(ichimoku.fullBear)sigs.push({l:'Ichimoku全空',c:'sig-bear'});
    else if(ichimoku.aboveCloud)sigs.push({l:'云上运行',c:'sig-bull'});
    else if(ichimoku.belowCloud)sigs.push({l:'云下运行',c:'sig-bear'});
  }
  if(vegas){
    if(vegas.above){score+=1.2;sigs.push({l:'Vegas通道上方',c:'sig-vegas'});}
    else if(vegas.below){score-=1.2;sigs.push({l:'Vegas通道下方',c:'sig-bear'});}
    if(vegas.bullCross){score+=0.5;sigs.push({l:'Vegas多头交叉',c:'sig-vegas'});}
  }

  score+=(mktStr.bosScore||0)*0.8+(mktStr.structureScore||0)*0.6;
  if(mktStr.bullCHoCH)sigs.push({l:'CHoCH多转',c:'sig-bull'});
  else if(mktStr.bearCHoCH)sigs.push({l:'CHoCH空转',c:'sig-bear'});
  else if(mktStr.hhhl)sigs.push({l:'HH/HL多头结构',c:'sig-bull'});
  else if(mktStr.lllh)sigs.push({l:'LL/LH空头结构',c:'sig-bear'});

  score+=(obv.score||0)*0.9;
  if(obv.obvDiv&&obv.obvTrend===1)sigs.push({l:'OBV背驰↑',c:'sig-bull'});
  else if(obv.obvDiv)sigs.push({l:'OBV背驰↓',c:'sig-bear'});
  else if(obv.obvTrend===1)sigs.push({l:'OBV流入',c:'sig-bull'});
  else sigs.push({l:'OBV流出',c:'sig-bear'});

  if(cvd.bullishDelta){score+=0.7;sigs.push({l:'CVD买盘主导',c:'sig-bull'});}
  else{score-=0.7;sigs.push({l:'CVD卖盘主导',c:'sig-bear'});}
  if(cvd.diverging)sigs.push({l:'CVD量价背驰',c:'sig-neut'});

  score+=mtf.score;
  if(mtf.fullyAligned&&mtf.alignment>0)sigs.push({l:'MTF全多共振',c:'sig-bull'});
  else if(mtf.fullyAligned&&mtf.alignment<0)sigs.push({l:'MTF全空共振',c:'sig-bear'});

  if(tr1d>0){score+=1.0;sigs.push({l:'日线多头',c:'sig-bull'});}
  else if(tr1d<0){score-=1.0;sigs.push({l:'日线空头',c:'sig-bear'});}
  if(tr1w>0){score+=0.9;sigs.push({l:'周线多头',c:'sig-bull'});}
  else if(tr1w<0){score-=0.9;sigs.push({l:'周线空头',c:'sig-bear'});}

  if(Math.abs(candles.score)>0.5){score+=candles.score*0.8;candles.patterns.forEach(p=>sigs.push({l:p.n,c:p.bull?'sig-bull':p.bull===false?'sig-bear':'sig-neut'}));}

  if(fundingMeta){
    if(fundingMeta.extremeShort){score+=1.5;sigs.push({l:'资金费率空头极端',c:'sig-bull'});}
    else if(fundingMeta.extremeLong){score-=1.5;sigs.push({l:'资金费率多头极端',c:'sig-bear'});}
    else if(fundingMeta.rate<-0.01){score+=0.6;sigs.push({l:`资金费率-${Math.abs(fundingMeta.rate).toFixed(3)}%`,c:'sig-bull'});}
    else if(fundingMeta.rate>0.05){score-=0.4;sigs.push({l:`资金费率+${fundingMeta.rate.toFixed(3)}%`,c:'sig-bear'});}
  }

  if(volProf.ratio>2.0){score*=1.12;sigs.push({l:'超大量确认',c:'sig-bull'});}
  else if(volProf.ratio>1.6)score*=1.06;
  else if(volProf.ratio<0.4){score*=0.88;sigs.push({l:'量能萎缩',c:'sig-neut'});}

  const bS=sigs.filter(s=>s.c==='sig-bull').length,rS=sigs.filter(s=>s.c==='sig-bear').length;
  const tot=bS+rS||1,conflictRatio=Math.min(bS,rS)/tot;
  const penalty=conflictRatio>0.4?1-(conflictRatio-0.4)*1.5:1.0;

  const isBull=score>=0;
  const price=prices[n-1];

  const absS=Math.abs(score),base=50*(1-Math.exp(-absS*0.38)),raw=Math.round(28+base);
  const conf=Math.min(90,Math.max(22,Math.round(raw*Math.max(0.6,penalty))));

  const atrM=conf>=60?3.5:conf>=40?2.5:1.8;
  const tp1=isBull?price+atr*atrM:price-atr*atrM;
  const tp2=isBull?price+atr*atrM*1.8:price-atr*atrM*1.8;
  const sl1=isBull?price-atr*(conf>=60?1.8:1.5):price+atr*(conf>=60?1.8:1.5);
  const rrNum=atr>0?parseFloat((Math.abs(tp1-price)/Math.abs(sl1-price)).toFixed(2)):2;

  const conviction=calcConviction({isBull,rsi,macd,mktStr,adx,supertrend,vegas,obv,cvd,mtf,hv,candles,ichimoku,tr1d,tr1w,fundingMeta});

  const vwapBull=price>vwap;
  const entryType=conf>=65?'market':conf>=45?'limit':'wait';
  const nearestSupport=mktStr.lastSwingLow||sl1,nearestResist=mktStr.lastSwingHigh||tp1;

  return {
    isBull,score:parseFloat(score.toFixed(2)),conf,conflictRatio,
    price,ma20v,ma55v,ma200v,atr,vwap,vwapBull,entryType,nearestSupport,nearestResist,
    rsi,macd,bb,adx,stoch,supertrend,ichimoku,vegas,obv,cvd,hv,mktStr,candles,volProf,mtf,
    tr1d,tr1w,tp1,tp2,sl1,rr:rrNum,conviction,sigs,sym,fundingMeta,
    bS,rS
  };
}

function fmtP(v){if(!v||isNaN(v))return'--';if(v>=10000)return'$'+Math.round(v).toLocaleString();if(v>=1)return'$'+v.toFixed(2);return'$'+v.toFixed(4);}
function fmtPct(v,ref){if(!ref||ref<=0)return'--';const p=(v-ref)/ref*100;return(p>=0?'+':'')+p.toFixed(2)+'%';}
function fmtPctRaw(p){return(p>=0?'+':'')+p.toFixed(2)+'%';}

async function fetchFundingRate(sym) {
  try {
    const s=sym.includes('USDT')?sym:sym+'USDT';
    const r=await Promise.race([fetch(`https://fapi.binance.com/fapi/v1/fundingRate?symbol=${s}&limit=8`),new Promise((_,rj)=>setTimeout(()=>rj(new Error('timeout')),5000))]);
    const d=await r.json();
    if(!Array.isArray(d)||!d.length)return null;
    const rates=d.map(x=>parseFloat(x.fundingRate||0)*100);
    const rate=rates[rates.length-1];
    const fundingTrend=rates.length>=3?rates[rates.length-1]-rates[rates.length-3]:0;
    const avgRate=rates.reduce((a,b)=>a+b,0)/rates.length;
    const meta={rate,avg:avgRate,trend:fundingTrend,crowded:Math.abs(rate)>0.08,extremeLong:rate>0.1,extremeShort:rate<-0.05,rates};
    if(global.S){global.S.fundingMeta=global.S.fundingMeta||{};global.S.fundingMeta[s]=meta;}
    return meta;
  }catch(e){return null;}
}

async function fetchOpenInterest(sym) {
  try {
    const s=sym.includes('USDT')?sym:sym+'USDT';
    const r=await Promise.race([fetch(`https://fapi.binance.com/fapi/v1/openInterest?symbol=${s}`),new Promise((_,rj)=>setTimeout(()=>rj(new Error('timeout')),5000))]);
    const d=await r.json();
    if(!d.openInterest)return null;
    const oi=parseFloat(d.openInterest);
    if(global.S){global.S.openInterest=global.S.openInterest||{};global.S.openInterest[s]=oi;}
    return oi;
  }catch(e){return null;}
}

function renderQuantPanel(res) {
  const el=document.getElementById('mbody-quant');
  if(!el||!res)return;
  if(!el.classList.contains('open'))el.classList.add('open');

  const{isBull,score,conf,rsi,macd,adx,stoch,supertrend,ichimoku,vegas,obv,cvd,hv,mktStr,candles,volProf,mtf,
    tr1d,tr1w,bb,price,ma20v,ma55v,ma200v,vwap,vwapBull,tp1,tp2,sl1,rr,conviction,sigs,conflictRatio,atr,
    fundingMeta,entryType,nearestSupport,nearestResist,bS,rS}=res;

  const gc=isBull?'var(--green)':'var(--red)';
  const gBg=isBull?'var(--green-bg)':'var(--red-bg)';
  const gBd=isBull?'var(--green-bd)':'var(--red-bd)';
  const cc=conf>=60?'var(--green)':conf>=40?'var(--amber)':'var(--red)';
  const cv=conviction||{grade:'C',gradeColor:'var(--amber)',gradeLabel:'--',pillars:[],weaknesses:[],convictionScore:0};
  const grd=cv.gradeColor||'var(--muted)';

  const allTFs=['15m','1h','4h','1d'];
  let tfArrHTML='';
  if(mtf.details&&mtf.details.length){
    tfArrHTML=allTFs.map(tf=>{
      const d=mtf.details.find(x=>x.tf===tf);
      if(!d)return`<span style="font-size:10px;padding:2px 7px;border-radius:3px;background:var(--bg3);color:var(--dim)">${tf}</span>`;
      return`<span style="font-size:10px;padding:2px 7px;border-radius:3px;font-weight:700;background:${d.bull?'var(--green-bg)':'var(--red-bg)'};color:${d.bull?'var(--green)':'var(--red)'};border:1px solid ${d.bull?'var(--green-bd)':'var(--red-bd)'}">${tf}${d.bull?'▲':'▼'}</span>`;
    }).join('');
  }

  function row(k,v,c=''){return`<div class="mod-row"><span class="mod-row-k">${k}</span><span class="mod-row-v"${c?` style="color:${c}"`:''}>${v}</span></div>`;}
  function sb(s){
    const C=s.c==='sig-bull'?'var(--green)':s.c==='sig-bear'?'var(--red)':s.c==='sig-vegas'?'var(--cyan)':s.c==='sig-chan'?'var(--teal)':'var(--muted)';
    const Bg=s.c==='sig-bull'?'var(--green-bg)':s.c==='sig-bear'?'var(--red-bg)':s.c==='sig-vegas'?'rgba(10,88,112,.08)':'rgba(0,0,0,.04)';
    return`<span style="font-size:10px;padding:2px 7px;border-radius:10px;background:${Bg};color:${C};border:1px solid ${C}22;white-space:nowrap">${s.l}</span>`;
  }

  const actionBorder=isBull?'var(--green)':'var(--red)';
  const entryLabel=entryType==='market'?'💫 市价立即入场':entryType==='limit'?'📋 限价等待':'⏳ 观察等待';
  const entryColor=entryType==='market'?'var(--green)':entryType==='limit'?'var(--blue)':'var(--amber)';

  el.innerHTML=`
<div style="font-size:12px;font-family:inherit">

<!-- ══ VERDICT CARD（FINCH风格） ══ -->
<div style="border:2px solid ${actionBorder}22;border-radius:12px;background:${isBull?'rgba(26,107,58,0.05)':'rgba(160,20,32,0.05)'};margin-bottom:10px;overflow:hidden">

  <!-- Header: direction + confidence -->
  <div style="padding:14px 16px 11px;display:flex;align-items:flex-start;justify-content:space-between;border-bottom:1px solid ${actionBorder}18">
    <div>
      <div style="font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;margin-bottom:5px">☯ 天機數元 量化裁决</div>
      <div style="font-size:22px;font-weight:700;color:${gc};line-height:1">${isBull?'▲ 做多 LONG':'▼ 做空 SHORT'}</div>
      <div style="display:flex;align-items:center;gap:8px;margin-top:5px;flex-wrap:wrap">
        <span style="font-size:11px;color:var(--muted)">评分 <strong style="color:${gc}">${score>0?'+':''}${score}</strong></span>
        <span style="font-size:11px;color:var(--muted)">·</span>
        <span style="font-size:11px;font-weight:700;color:${entryColor}">${entryLabel}</span>
        ${conflictRatio>0.4?`<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:rgba(128,80,0,0.1);color:var(--amber);border:1px solid rgba(128,80,0,0.3)">⚠ 信号分歧 ${(conflictRatio*100).toFixed(0)}%</span>`:''}
      </div>
    </div>
    <div style="text-align:right;flex-shrink:0">
      <div style="font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">置信度</div>
      <div style="font-size:32px;font-weight:700;color:${cc};line-height:1">${conf}%</div>
      <div style="height:4px;background:var(--bg3);border-radius:2px;margin-top:5px;width:80px;overflow:hidden;margin-left:auto">
        <div style="height:100%;width:${conf}%;background:${cc};border-radius:2px;transition:width .6s"></div>
      </div>
      <div style="font-size:10px;font-weight:700;color:${grd};margin-top:4px">${cv.grade} · ${cv.gradeLabel}</div>
    </div>
  </div>

  <!-- TP/SL + R:R -->
  <div style="padding:12px 16px;border-bottom:1px solid ${actionBorder}12">
    <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;margin-bottom:8px">
      <div style="background:var(--green-bg);border:1px solid var(--green-bd);border-radius:6px;padding:9px 11px">
        <div style="font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px">TP1</div>
        <div style="font-size:14px;font-weight:700;color:var(--green)">${fmtP(tp1)}</div>
        <div style="font-size:10px;color:var(--green)">${fmtPct(tp1,price)}</div>
      </div>
      <div style="background:var(--green-bg);border:1px solid var(--green-bd);border-radius:6px;padding:9px 11px">
        <div style="font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px">TP2</div>
        <div style="font-size:14px;font-weight:700;color:var(--green)">${fmtP(tp2)}</div>
        <div style="font-size:10px;color:var(--green)">${fmtPct(tp2,price)}</div>
      </div>
      <div style="background:var(--red-bg);border:1px solid var(--red-bd);border-radius:6px;padding:9px 11px">
        <div style="font-size:9px;color:var(--muted);letter-spacing:1px;text-transform:uppercase;margin-bottom:2px">SL</div>
        <div style="font-size:14px;font-weight:700;color:var(--red)">${fmtP(sl1)}</div>
        <div style="font-size:10px;color:var(--red)">${fmtPct(sl1,price)}</div>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center;font-size:11px;color:var(--muted)">
      <span>R:R <strong style="color:${rr>=2?'var(--green)':rr>=1.5?'var(--amber)':'var(--red)'};font-size:14px">${rr}</strong></span>
      <span>支撑 <strong style="color:var(--green)">${fmtP(nearestSupport)}</strong></span>
      <span>阻力 <strong style="color:var(--red)">${fmtP(nearestResist)}</strong></span>
      <span>VWAP <strong style="color:${vwapBull?'var(--green)':'var(--red)'}">${fmtP(vwap)} ${vwapBull?'↑':'↓'}</strong></span>
    </div>
  </div>

  <!-- 多时框一致性 -->
  ${tfArrHTML?`<div style="padding:10px 16px;border-bottom:1px solid ${actionBorder}12">
    <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:6px">多时框一致性 MTF Alignment</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:5px">${tfArrHTML}</div>
    <div style="display:flex;align-items:center;gap:8px">
      <div style="flex:1;height:4px;background:var(--bg3);border-radius:2px;overflow:hidden">
        <div style="width:${Math.round(Math.max(0,(mtf.alignment+1)/2*100))}%;height:100%;background:${mtf.alignment>0?'var(--green)':'var(--red)'};border-radius:2px;transition:width .6s"></div>
      </div>
      <span style="font-size:11px;font-weight:700;color:${mtf.alignment>0?'var(--green)':'var(--red)'}">${mtf.fullyAligned?(mtf.alignment>0?'全多共振':'全空共振'):mtf.partiallyAligned?(mtf.alignment>0?'多数看多':'多数看空'):'信号分歧'}</span>
    </div>
  </div>`:''}

  <!-- 信号标签 -->
  <div style="padding:10px 16px">
    <div style="font-size:9px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:6px">信号矩阵 · ${bS||0}多/${rS||0}空</div>
    <div style="display:flex;flex-wrap:wrap;gap:4px">${sigs.slice(0,16).map(sb).join('')}</div>
  </div>
</div>

<!-- ══ SNAP GRID — 核心指标快照 ══ -->
<div style="font-size:10px;letter-spacing:2px;color:var(--muted);text-transform:uppercase;padding-bottom:7px;border-bottom:1px solid var(--line);margin-bottom:9px">技术快照 Technical Snapshot</div>
<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:var(--line);border:1px solid var(--line2);border-radius:5px;overflow:hidden;margin-bottom:12px;box-shadow:var(--shadow)">
  <div style="background:var(--card);padding:10px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:3px">RSI 14</div>
    <div style="font-size:14px;font-weight:700;color:${rsi<30?'var(--green)':rsi>70?'var(--red)':'var(--bright)'}">${rsi.toFixed(1)}</div>
    <div style="font-size:10px;color:var(--muted)">${rsi<30?'超卖':rsi>70?'超买':rsi<50?'偏低':'偏高'}</div>
  </div>
  <div style="background:var(--card);padding:10px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:3px">MACD Hist</div>
    <div style="font-size:14px;font-weight:700;color:${macd.hist>0?'var(--green)':'var(--red)'}">${(macd.hist>0?'+':'')+macd.hist.toFixed(4)}</div>
    <div style="font-size:10px;color:var(--muted)">${macd.bullDiv?'底背驰':macd.bearDiv?'顶背驰':macd.hist>0?'多头':'空头'}</div>
  </div>
  <div style="background:var(--card);padding:10px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:3px">Stoch RSI</div>
    <div style="font-size:14px;font-weight:700;color:${stoch.k<20?'var(--green)':stoch.k>80?'var(--red)':'var(--bright)'}">${stoch.k.toFixed(1)}</div>
    <div style="font-size:10px;color:var(--muted)">${stoch.bullCross?'金叉':stoch.bearCross?'死叉':stoch.k<20?'超卖':stoch.k>80?'超买':'中性'}</div>
  </div>
  <div style="background:var(--card);padding:10px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:3px">ADX</div>
    <div style="font-size:14px;font-weight:700;color:${adx.strong?'var(--green)':adx.ranging?'var(--dim)':'var(--gold)'}">${adx.adx.toFixed(1)}</div>
    <div style="font-size:10px;color:var(--muted)">${adx.strong?'强趋势':adx.ranging?'震荡市':'中等'}</div>
  </div>
  <div style="background:var(--card);padding:10px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:3px">BB 位置</div>
    <div style="font-size:14px;font-weight:700;color:${bb.pos<0.15?'var(--green)':bb.pos>0.85?'var(--red)':'var(--bright)'}">${(bb.pos*100).toFixed(0)}%</div>
    <div style="font-size:10px;color:var(--muted)">${bb.pos<0.15?'下轨':bb.pos>0.85?'上轨':'中间'}</div>
  </div>
  <div style="background:var(--card);padding:10px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:3px">MA20/55</div>
    <div style="font-size:14px;font-weight:700;color:${price>ma20v?'var(--green)':'var(--red)'}">${fmtP(ma20v)}</div>
    <div style="font-size:10px;color:${price>ma55v?'var(--green)':'var(--red)'}">55: ${fmtP(ma55v)}</div>
  </div>
  <div style="background:var(--card);padding:10px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:3px">HV20</div>
    <div style="font-size:14px;font-weight:700;color:${hv.expanding?'var(--amber)':hv.contracting?'var(--green)':'var(--bright)'}">${hv.hv?.toFixed(1)||0}%</div>
    <div style="font-size:10px;color:var(--muted)">${hv.expanding?'⬆扩张':hv.contracting?'⬇收缩':'稳定'}</div>
  </div>
  <div style="background:var(--card);padding:10px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:3px">Vol Ratio</div>
    <div style="font-size:14px;font-weight:700;color:${volProf.ratio>1.5?'var(--green)':volProf.ratio<0.5?'var(--red)':'var(--bright)'}">${volProf.ratio.toFixed(2)}×</div>
    <div style="font-size:10px;color:var(--muted)">${volProf.ratio>1.5?'放量':volProf.ratio<0.5?'缩量':'正常'}</div>
  </div>
</div>

<!-- ══ 高级模块组 ══ -->
<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:10px">
  <!-- Supertrend -->
  <div style="background:${supertrend.bull?'var(--green-bg)':'var(--red-bg)'};border:1px solid ${supertrend.bull?'var(--green-bd)':'var(--red-bd)'};border-radius:6px;padding:9px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:2px">⚡ Supertrend</div>
    <div style="font-size:13px;font-weight:700;color:${supertrend.bull?'var(--green)':'var(--red)'}">${supertrend.bull?'多头 Bull':'空头 Bear'}</div>
    <div style="font-size:10px;color:var(--muted)">${supertrend.bull?'支撑':'压力'} ${fmtP(supertrend.value)}</div>
  </div>
  <!-- Market Structure -->
  <div style="background:${mktStr.bias==='bull'?'var(--green-bg)':mktStr.bias==='bear'?'var(--red-bg)':'var(--bg1)'};border:1px solid ${mktStr.bias==='bull'?'var(--green-bd)':mktStr.bias==='bear'?'var(--red-bd)':'var(--line2)'};border-radius:6px;padding:9px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:2px">🏗 市场结构 BOS/CHoCH</div>
    <div style="font-size:12px;font-weight:700;color:${mktStr.bias==='bull'?'var(--green)':mktStr.bias==='bear'?'var(--red)':'var(--muted)'}">${mktStr.bullCHoCH?'CHoCH↑反转':mktStr.bearCHoCH?'CHoCH↓反转':mktStr.hhhl?'HH/HL多头':mktStr.lllh?'LL/LH空头':'结构中性'}</div>
    <div style="font-size:10px;color:var(--muted)">BOS ${mktStr.bullBOS?'↑突破':mktStr.bearBOS?'↓跌破':'待定'}</div>
  </div>
  <!-- OBV + CVD -->
  <div style="background:var(--bg1);border:1px solid var(--line2);border-radius:6px;padding:9px 11px">
    <div style="font-size:10px;color:var(--muted);margin-bottom:2px">📦 OBV · CVD 量能</div>
    <div style="font-size:12px;font-weight:700;color:${obv.obvTrend===1?'var(--green)':'var(--red)'}">OBV ${obv.obvTrend===1?'↑流入':'↓流出'}${obv.obvDiv?' ⚡背驰':''}</div>
    <div style="font-size:10px;color:${cvd.bullishDelta?'var(--green)':'var(--red)'}">CVD ${cvd.bullishDelta?'买盘主导':'卖盘主导'}${cvd.diverging?' 背驰':''}</div>
  </div>
  <!-- Vegas -->
  ${vegas?`<div style="background:${vegas.above?'rgba(10,88,112,0.08)':vegas.below?'var(--red-bg)':'var(--bg1)'};border:1px solid ${vegas.above?'var(--cyan)':vegas.below?'var(--red-bd)':'var(--line2)'};border-radius:6px;padding:9px 11px">
    <div style="font-size:10px;color:var(--cyan);margin-bottom:2px">🌊 Vegas EMA144/169</div>
    <div style="font-size:12px;font-weight:700;color:${vegas.above?'var(--cyan)':vegas.below?'var(--red)':'var(--amber)'}">${vegas.above?'通道上方':vegas.below?'通道下方':'通道内部'}</div>
    <div style="font-size:10px;color:var(--muted)">${vegas.bullCross?'多头交叉':'空头交叉'} · ${fmtP(vegas.midpoint)}</div>
  </div>`:`<div style="background:var(--bg1);border:1px solid var(--line2);border-radius:6px;padding:9px 11px"><div style="font-size:10px;color:var(--muted);margin-bottom:2px">🌊 Vegas EMA144/169</div><div style="font-size:11px;color:var(--dim)">需要170+根K线</div></div>`}
</div>

<!-- ══ Ichimoku ══ -->
${ichimoku?`<div style="background:var(--bg1);border:1px solid var(--line2);border-radius:6px;padding:10px 12px;margin-bottom:9px">
  <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">🌸 Ichimoku 一目均衡</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px">
    <div style="text-align:center;padding:5px;background:${ichimoku.aboveCloud?'var(--green-bg)':ichimoku.belowCloud?'var(--red-bg)':'var(--bg2)'};border-radius:4px">
      <div style="font-size:9px;color:var(--muted)">云层位置</div>
      <div style="font-size:12px;font-weight:700;color:${ichimoku.aboveCloud?'var(--green)':ichimoku.belowCloud?'var(--red)':'var(--amber)'}">${ichimoku.aboveCloud?'云上':ichimoku.belowCloud?'云下':'云内'}</div>
    </div>
    <div style="text-align:center;padding:5px;background:${ichimoku.tkBull?'var(--green-bg)':'var(--red-bg)'};border-radius:4px">
      <div style="font-size:9px;color:var(--muted)">转/基线</div>
      <div style="font-size:12px;font-weight:700;color:${ichimoku.tkBull?'var(--green)':'var(--red)'}">${ichimoku.tkBull?'多头':'空头'}</div>
    </div>
    <div style="text-align:center;padding:5px;background:${ichimoku.cloudBull?'var(--green-bg)':'var(--red-bg)'};border-radius:4px">
      <div style="font-size:9px;color:var(--muted)">云色</div>
      <div style="font-size:12px;font-weight:700;color:${ichimoku.cloudBull?'var(--green)':'var(--red)'}">${ichimoku.cloudBull?'多云':'空云'}</div>
    </div>
  </div>
  ${(ichimoku.fullBull||ichimoku.fullBear)?`<div style="margin-top:7px;padding:5px 8px;background:${ichimoku.fullBull?'var(--green-bg)':'var(--red-bg)'};border-radius:4px;font-size:11px;font-weight:700;color:${ichimoku.fullBull?'var(--green)':'var(--red)'}">⚡ ${ichimoku.fullBull?'Ichimoku全多头共振！':'Ichimoku全空头共振！'}</div>`:''}
</div>`:'' }

<!-- ══ 资金费率模块（新增）══ -->
${fundingMeta?`<div style="background:${fundingMeta.extremeLong||fundingMeta.extremeShort?'rgba(128,80,0,0.06)':'var(--bg1)'};border:1px solid ${fundingMeta.extremeLong||fundingMeta.extremeShort?'rgba(128,80,0,0.3)':'var(--line2)'};border-radius:6px;padding:10px 12px;margin-bottom:9px">
  <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px">💰 资金费率 Funding Rate</div>
  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px">
    <div>
      <div style="font-size:16px;font-weight:700;color:${fundingMeta.rate>0?'var(--red)':'var(--green)'}">${(fundingMeta.rate>0?'+':'')+fundingMeta.rate.toFixed(4)}%</div>
      <div style="font-size:10px;color:var(--muted)">8小时费率 · 7日均 ${(fundingMeta.avg>0?'+':'')+fundingMeta.avg.toFixed(4)}%</div>
    </div>
    <div style="text-align:right">
      ${fundingMeta.extremeLong?`<div style="font-size:11px;font-weight:700;color:var(--red);padding:3px 8px;background:var(--red-bg);border:1px solid var(--red-bd);border-radius:4px">⚠ 多头极拥挤</div>`:''}
      ${fundingMeta.extremeShort?`<div style="font-size:11px;font-weight:700;color:var(--green);padding:3px 8px;background:var(--green-bg);border:1px solid var(--green-bd);border-radius:4px">⚡ 空头极拥挤</div>`:''}
      ${fundingMeta.crowded&&!fundingMeta.extremeLong&&!fundingMeta.extremeShort?`<div style="font-size:11px;font-weight:700;color:var(--amber);padding:3px 8px;background:rgba(128,80,0,0.08);border:1px solid rgba(128,80,0,0.3);border-radius:4px">△ 单边拥挤</div>`:''}
    </div>
  </div>
  <div style="font-size:11px;color:var(--muted);line-height:1.7">${fundingMeta.extremeShort?'空头大量支付，存在空头挤仓风险，利好做多':fundingMeta.extremeLong?'多头大量支付，存在多头爆仓风险，利好做空':fundingMeta.rate<0?'费率为负，空头支付，小幅利好做多':'费率正常，多头支付，无明显偏向'}</div>
</div>`:'' }

<!-- ══ 置信度柱子评分（FINCH核心）══ -->
${cv.pillars&&cv.pillars.length?`
<div style="background:${cv.grade==='A'?'rgba(26,107,58,0.05)':cv.grade==='B'?'rgba(139,105,20,0.05)':cv.grade==='C'?'rgba(128,80,0,0.05)':'rgba(160,20,32,0.05)'};border:2px solid ${grd}44;border-radius:10px;margin-bottom:10px;overflow:hidden">
  <!-- Header -->
  <div style="padding:11px 14px;border-bottom:1px solid ${grd}22;display:flex;align-items:center;justify-content:space-between">
    <div>
      <div style="font-size:10px;letter-spacing:1.5px;color:var(--muted);text-transform:uppercase;margin-bottom:2px">🏛 入场论据强度 Conviction</div>
      <div style="font-size:11px;color:var(--muted)">${cv.pillars.length}根支撑柱 · ${cv.weaknesses.length}个弱点</div>
    </div>
    <div style="text-align:center;flex-shrink:0">
      <div style="font-size:38px;font-weight:900;color:${grd};line-height:1">${cv.grade}</div>
      <div style="font-size:10px;font-weight:700;color:${grd}">${cv.gradeLabel}</div>
    </div>
  </div>
  <!-- Score bar -->
  <div style="padding:9px 14px;border-bottom:1px solid ${grd}18">
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:10px;color:var(--muted)">0</span>
      <div style="flex:1;height:8px;background:var(--bg3);border-radius:4px;overflow:hidden;position:relative">
        <div style="position:absolute;left:30%;top:0;width:1px;height:100%;background:rgba(0,0,0,.1)"></div>
        <div style="position:absolute;left:60%;top:0;width:1px;height:100%;background:rgba(0,0,0,.1)"></div>
        <div style="height:100%;border-radius:4px;background:${grd};width:${cv.convictionScore}%;transition:width .8s ease"></div>
      </div>
      <span style="font-size:14px;font-weight:700;color:${grd};width:30px">${cv.convictionScore}</span>
    </div>
  </div>
  <!-- Pillars -->
  <div style="padding:9px 14px">
    ${cv.pillars.slice(0,6).map(p=>`<div style="display:flex;align-items:center;gap:6px;padding:3px 0"><div style="width:7px;height:7px;border-radius:50%;background:var(--green);flex-shrink:0"></div><div style="flex:1;min-width:0"><div style="font-size:10px;font-weight:700;color:var(--text)">${p.name}</div><div style="font-size:9px;color:var(--muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${p.detail||''}</div></div><div style="font-size:9px;font-weight:700;color:var(--green);flex-shrink:0">+${p.weight}</div></div>`).join('')}
    ${cv.weaknesses.slice(0,3).map(w=>`<div style="display:flex;align-items:center;gap:6px;padding:3px 0"><div style="width:7px;height:7px;border-radius:50%;background:${w.severity==='high'?'var(--red)':'var(--amber)'};flex-shrink:0"></div><div style="flex:1;min-width:0"><div style="font-size:10px;font-weight:700;color:${w.severity==='high'?'var(--red)':'var(--amber)'}">${w.name}</div><div style="font-size:9px;color:var(--muted)">${w.detail||''}</div></div><div style="font-size:9px;color:${w.severity==='high'?'var(--red)':'var(--amber)'}">⚠</div></div>`).join('')}
  </div>
</div>`:'' }

<!-- ══ K线形态 ══ -->
${candles.patterns.length?`<div style="background:var(--bg1);border:1px solid var(--line2);border-radius:6px;padding:9px 12px;margin-bottom:9px">
  <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px">🕯 K线形态</div>
  <div style="display:flex;flex-wrap:wrap;gap:4px">${candles.patterns.map(p=>`<span style="font-size:10px;padding:2px 8px;border-radius:4px;background:${p.bull?'var(--green-bg)':p.bull===false?'var(--red-bg)':'var(--bg2)'};color:${p.bull?'var(--green)':p.bull===false?'var(--red)':'var(--muted)'};border:1px solid ${p.bull?'var(--green-bd)':p.bull===false?'var(--red-bd)':'var(--line2)'}">${p.n}</span>`).join('')}</div>
</div>`:''}

<!-- ══ Volume Profile POC ══ -->
${volProf.poc>0?`<div style="background:var(--bg1);border:1px solid var(--line2);border-radius:6px;padding:9px 12px;margin-bottom:9px">
  <div style="font-size:10px;color:var(--muted);letter-spacing:2px;text-transform:uppercase;margin-bottom:5px">📦 Volume Profile</div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px">
    <div style="text-align:center"><div style="font-size:9px;color:var(--muted)">POC</div><div style="font-size:12px;font-weight:700;color:var(--gold)">${fmtP(volProf.poc)}</div></div>
    <div style="text-align:center"><div style="font-size:9px;color:var(--muted)">VAH</div><div style="font-size:12px;font-weight:700;color:var(--red)">${fmtP(volProf.vah)}</div></div>
    <div style="text-align:center"><div style="font-size:9px;color:var(--muted)">VAL</div><div style="font-size:12px;font-weight:700;color:var(--green)">${fmtP(volProf.val)}</div></div>
  </div>
  <div style="font-size:10px;color:var(--muted);margin-top:4px">量比 ${volProf.ratio.toFixed(2)}× 均值 · ${volProf.ratio>1.5?'放量确认':'量能一般'}</div>
</div>`:''}

<div style="font-size:10px;color:var(--dim);text-align:center;padding:6px 0">⚠ 量化分析仅供参考，不构成投资建议</div>
</div>`;
}

// ════════════════════════════════════════════════════════════════
// §21  与 xuanxue.js 集成 — patch renderAll + toggleMod
// ════════════════════════════════════════════════════════════════
function patchXuanxue() {
  if (global._QE_PATCHED) return;
  global._QE_PATCHED = true;

  // ── patch renderAll ──
  const origRenderAll = global.renderAll;
  global.renderAll = async function(data) {
    if (origRenderAll) await origRenderAll.apply(this, arguments);
    try {
      if (!data) return;
      let kl = data.klines || data.kl || (data.allKlines && data.allKlines['4h']);
      if (!kl || kl.length < 30) return;

      let klMap = null;
      if (data.allKlines) klMap = data.allKlines;
      else if (global.S?.klines) {
        klMap = {};
        const sym = data.coin || global.S?.sym || '';
        for (const tf of ['15m','1h','4h','1d','1w']) {
          const d = global.S.klines[sym+tf];
          if (d && d.length) klMap[tf] = d;
        }
      }

      // 获取资金费率（异步，非阻塞）
      const sym = data.coin || global.S?.sym || '';
      let fundingMeta = null;
      if (sym) {
        fetchFundingRate(sym).then(fm => {
          if (fm) {
            fundingMeta = fm;
            const existing = global._QE_LAST;
            if (existing) {
              existing.fundingMeta = fm;
              renderQuantPanel(existing);
              updateTopbar(existing);
            }
          }
        }).catch(()=>{});
        fetchOpenInterest(sym).catch(()=>{});
      }

      const result = analyze(kl, sym, klMap, fundingMeta);
      if (!result) return;
      global._QE_LAST = result;
      renderQuantPanel(result);
      updateTopbar(result);
      updateModuleBadge(result);
      updateRightPanelModules(result);
      // Fire event-driven callback (replaces 1200ms polling in index.html)
      if (typeof global._onQEResult === 'function') global._onQEResult(result);
    } catch(e) { console.warn('[QuantEngine v3]', e); }
  };

  // ── toggleMod ──
  const origToggleMod = global.toggleMod;
  if (origToggleMod) {
    global.toggleMod = function(id) {
      origToggleMod.apply(this, arguments);
      if (id === 'quant' && global._QE_LAST) renderQuantPanel(global._QE_LAST);
    };
  } else {
    global.toggleMod = function(id) {
      const body  = document.getElementById('mbody-'+id);
      const arrow = document.getElementById('marr-'+id);
      if (!body) return;
      const open = body.classList.toggle('open');
      if (arrow) { arrow.textContent=open?'⌄':'›'; arrow.classList.toggle('open',open); }
      if (id==='quant' && open && global._QE_LAST) renderQuantPanel(global._QE_LAST);
    };
  }

  console.log('%c[QuantEngine v3.0]%c 已挂载到 天機數元\n  ✅ BOS/CHoCH · CVD · OBV · Supertrend · Ichimoku · Vegas\n  ✅ 置信度柱子 Grade A-D · 资金费率 · OI · FINCH Verdict Card', 'color:#8B6914;font-weight:700','color:#888');
}

// ════════════════════════════════════════════════════════════════
// §22  更新顶栏信号（FINCH finch-bar 兼容）
// ════════════════════════════════════════════════════════════════
function updateTopbar(res) {
  try {
    const iB=res.isBull,gc=iB?'var(--green)':'var(--red)';
    const set=(id,val,clr)=>{const e=document.getElementById(id);if(e){e.textContent=val;if(clr)e.style.color=clr;}};
    set('fb-signal-dir', iB?'▲ 多头':'▼ 空头', gc);
    set('fb-signal-conf', res.conf+'%', gc);
    set('fb-signal-rr', res.rr+'×', 'var(--gold)');
    set('fb-signal-entry', res.price?'$'+Math.round(res.price).toLocaleString():'--', 'var(--bright)');
    // 新版 info-bar IDs
    set('tbDirVal', iB?'▲ 多头':'▼ 空头', gc);
    set('tbConfVal', res.conf+'%', gc);
    set('tbRRVal', res.rr+'×', 'var(--gold)');
    // 更新 bias badge
    const bb=document.getElementById('biasBadge');
    if(bb){
      bb.textContent=`${iB?'▲ 做多':'▼ 做空'} · ${res.conf}% 置信度 · ${res.conviction?.grade||'--'}`;
      bb.style.background=iB?'rgba(26,107,58,0.08)':'rgba(160,20,32,0.08)';
      bb.style.color=iB?'var(--green)':'var(--red)';
      bb.style.border=`1px solid ${iB?'var(--green-bd)':'var(--red-bd)'}`;
    }
  } catch(_) {}
}

// ════════════════════════════════════════════════════════════════
// §23  更新右侧模块卡片徽章（个别模块显示实时信号）
// ════════════════════════════════════════════════════════════════
function updateModuleBadge(res) {
  try {
    const set=(id,val,clr)=>{const e=document.getElementById(id);if(e){e.textContent=val;if(clr)e.style.color=clr;}};
    // 量化主模块
    set('msig-quant', `${res.isBull?'▲':'▼'} ${res.conf}% · ${res.conviction?.grade||'--'}`, res.isBull?'var(--green)':'var(--red)');
    // 技术指标模块
    const rsiC=res.rsi<30?'var(--green)':res.rsi>70?'var(--red)':'var(--muted)';
    set('msig-tech', `RSI ${res.rsi.toFixed(0)}`, rsiC);
    set('t-rsi', res.rsi.toFixed(1), rsiC);
    set('t-stoch', res.stoch.k.toFixed(1), res.stoch.k<20?'var(--green)':res.stoch.k>80?'var(--red)':'');
    set('t-macd', (res.macd.hist>0?'+':'')+res.macd.hist.toFixed(5), res.macd.hist>0?'var(--green)':'var(--red)');
    set('t-bb', (res.bb.pos*100).toFixed(0)+'%', res.bb.pos<0.15?'var(--green)':res.bb.pos>0.85?'var(--red)':'');
    set('t-ma20', res.ma20v?fmtP(res.ma20v):'--', res.price>res.ma20v?'var(--green)':'var(--red)');
    set('t-ma55', res.ma55v?fmtP(res.ma55v):'--', res.price>res.ma55v?'var(--green)':'var(--red)');
    set('t-ma200', res.ma200v?fmtP(res.ma200v):'--', res.price>res.ma200v?'var(--green)':'var(--red)');
    set('t-trend', res.adx.strong?(res.adx.pdi>res.adx.ndi?'↑强多头趋势':'↓强空头趋势'):(res.adx.ranging?'横盘震荡':'弱趋势'), res.adx.strong?(res.adx.pdi>res.adx.ndi?'var(--green)':'var(--red)'):'var(--muted)');
    set('t-vol', res.volProf.ratio.toFixed(2)+'× 均值', res.volProf.ratio>1.5?'var(--green)':res.volProf.ratio<0.5?'var(--red)':'');
    // Vegas 模块
    if(res.vegas){
      set('msig-vegas', res.vegas.above?'↑通道上方':res.vegas.below?'↓通道下方':'通道内部', res.vegas.above?'var(--cyan)':res.vegas.below?'var(--red)':'var(--amber)');
      const vPanel=document.getElementById('vegasPanel');
      if(vPanel)vPanel.innerHTML=`
        <div class="mod-row"><span class="mod-row-k">位置</span><span class="mod-row-v" style="color:${res.vegas.above?'var(--cyan)':res.vegas.below?'var(--red)':'var(--amber)'}">${res.vegas.above?'✅ 通道上方':res.vegas.below?'❌ 通道下方':'⚠ 通道内部'}</span></div>
        <div class="mod-row"><span class="mod-row-k">EMA 144</span><span class="mod-row-v">${fmtP(res.vegas.e144)}</span></div>
        <div class="mod-row"><span class="mod-row-k">EMA 169</span><span class="mod-row-v">${fmtP(res.vegas.e169)}</span></div>
        <div class="mod-row"><span class="mod-row-k">交叉</span><span class="mod-row-v" style="color:${res.vegas.bullCross?'var(--green)':'var(--red)'}">${res.vegas.bullCross?'多头交叉':'空头交叉'}</span></div>`;
    }
  } catch(_) {}
}

// ════════════════════════════════════════════════════════════════
// §24  更新右侧模块数据（Technicals, Fib, Vegas 等）
// ════════════════════════════════════════════════════════════════
function updateRightPanelModules(res) {
  try {
    // 更新综合研判快照 summaryBody
    const sb=document.getElementById('summaryBody');
    if(sb&&res){
      const gc=res.isBull?'var(--green)':'var(--red)';
      const cc=res.conf>=60?'var(--green)':res.conf>=40?'var(--amber)':'var(--red)';
      sb.innerHTML=`
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">
        <div style="font-size:18px;font-weight:700;color:${gc}">${res.isBull?'▲ 做多 LONG':'▼ 做空 SHORT'}</div>
        <div style="text-align:right">
          <div style="font-size:22px;font-weight:700;color:${cc}">${res.conf}%</div>
          <div style="font-size:10px;color:var(--muted)">置信度</div>
        </div>
      </div>
      <div style="height:3px;background:var(--bg3);border-radius:2px;overflow:hidden;margin-bottom:8px">
        <div style="height:100%;width:${res.conf}%;background:${cc};border-radius:2px;transition:width .6s"></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;font-size:10px">
        <div style="text-align:center;padding:5px;background:var(--bg2);border-radius:4px">
          <div style="color:var(--muted)">评分</div>
          <div style="font-weight:700;color:${gc}">${res.score>0?'+':''}${res.score}</div>
        </div>
        <div style="text-align:center;padding:5px;background:var(--bg2);border-radius:4px">
          <div style="color:var(--muted)">R:R</div>
          <div style="font-weight:700;color:${res.rr>=2?'var(--green)':'var(--amber)'}">${res.rr}×</div>
        </div>
        <div style="text-align:center;padding:5px;background:var(--bg2);border-radius:4px">
          <div style="color:var(--muted)">等级</div>
          <div style="font-weight:700;color:${res.conviction?.gradeColor||'var(--muted)'}">${res.conviction?.grade||'--'}</div>
        </div>
      </div>`;
    }
  } catch(_) {}
}

// ════════════════════════════════════════════════════════════════
// §25  CSS 注入（补充必要样式）
// ════════════════════════════════════════════════════════════════
function injectCSS() {
  if (document.getElementById('qe-v3-css')) return;
  const s=document.createElement('style');
  s.id='qe-v3-css';
  s.textContent=`
.mod-card-body{max-height:0;overflow:hidden;padding:0 14px;background:var(--bg);transition:max-height .28s cubic-bezier(.4,0,.2,1),padding .18s ease,border-top-width .18s ease;will-change:max-height;contain:layout style;border-top:0 solid var(--line);}
.mod-card-body.open{max-height:4000px;padding:11px 14px 15px;border-top-width:1px;}
.mod-card-arrow.open{transform:rotate(90deg);}
.mod-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--line);font-size:12px;}
.mod-row:last-child{border:none;}
.mod-row-k{color:var(--muted);font-size:11px;}
.mod-row-v{font-weight:700;font-variant-numeric:tabular-nums;font-size:12px;}
  `;
  document.head.appendChild(s);
}

// ════════════════════════════════════════════════════════════════
// §26  公共 API 暴露
// ════════════════════════════════════════════════════════════════
global.QE = {
  analyze, renderQuantPanel, fetchFundingRate, fetchOpenInterest,
  calcADX, calcSupertrend, calcIchimoku, calcVegas, calcOBV, calcCVD,
  calcMktStr, calcMTF, calcConviction, calcMACDFull, calcATR, calcBB,
  calcRSI, calcHV, calcCandles, calcVolProfile, calcStochRSI, norm
};
global.runQuantEngine = async (kl, sym, klMap) => {
  const kn=norm(kl||[]);
  return kn.length>=30 ? analyze(kn, sym||'', klMap) : null;
};

// ════════════════════════════════════════════════════════════════
// §27  初始化
// ════════════════════════════════════════════════════════════════
if (document.readyState==='loading') {
  document.addEventListener('DOMContentLoaded', ()=>{ injectCSS(); patchXuanxue(); });
} else {
  injectCSS(); setTimeout(patchXuanxue, 100);
}

})(window);
