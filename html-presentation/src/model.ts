import variables from '../../VARIABLES.json';
export {variables};
const f=variables.finance as Record<'developer_monthly_rate'|'developer_months'|'design'|'qa'|'legal'|'infrastructure'|'marketing'|'support'|'reserve'|'total_budget',number|null>&{currency:string};
export const money=(n:number|null)=>n===null?'Уточняется':new Intl.NumberFormat('ru-RU',{style:'currency',currency:f.currency,maximumFractionDigits:0}).format(n);
export const developerCost=typeof f.developer_monthly_rate==='number'&&typeof f.developer_months==='number'&&Number.isFinite(f.developer_monthly_rate)&&Number.isFinite(f.developer_months)?f.developer_monthly_rate*f.developer_months:null;
export const costKeys=['design','qa','legal','infrastructure','marketing','support','reserve'] as const;
export const costLabels=['Дизайн','QA и тестирование','Юридическая подготовка','Инфраструктура','Продвижение','Сопровождение','Резерв'];
const knownValues=[developerCost,...costKeys.map(k=>f[k])].filter((n):n is number=>typeof n==='number'&&Number.isFinite(n));
export const knownSum=knownValues.length?knownValues.reduce((sum,n)=>sum+n,0):null;
export const incomplete=developerCost===null||costKeys.some(k=>f[k]===null);
let cursor=1;
export const roadmap=variables.roadmap.stages.map(s=>{const start=cursor;cursor+=s.months;return {...s,start,end:cursor-1};});
export const totalMonths=roadmap.reduce((sum,s)=>sum+s.months,0);
export type Mode='adult'|'kids';
export type Screen='home'|'lessons'|'name'|'meaning'|'quiz'|'feedback'|'result'|'review'|'progress'|'favorites'|'start'|'map'|'location'|'story'|'reward'|'collection'|'card';
export type State={mode:Mode;screen:Screen;resume:Screen;history:Screen[];context:Screen;started:boolean;pending:boolean;selected:number|null;correct:boolean;complete:boolean;favorite:boolean;notice:string;revealed:boolean;reviewed:boolean;reviewDone:boolean};
export type Action={type:'go';screen:Screen}|{type:'select';answer:number}|{type:'check'}|{type:'retry'}|{type:'finish'}|{type:'favorite'}|{type:'reset';mode:Mode}|{type:'continue'}|{type:'back'}|{type:'lesson';restart?:boolean}|{type:'reveal'}|{type:'reviewed'}|{type:'notice';text:string};
export const initial=(mode:Mode):State=>({mode,screen:mode==='kids'?'start':'home',resume:mode==='kids'?'location':'name',history:[],context:mode==='kids'?'map':'home',started:false,pending:false,selected:null,correct:false,complete:false,favorite:false,notice:'',revealed:false,reviewed:false,reviewDone:false});
const learning:Screen[]=['location','name','meaning','story','quiz','feedback'];
const roots:Screen[]=['home','lessons','review','progress','favorites','map','collection','start'];
const allowed=(mode:Mode):Screen[]=>mode==='kids'?['start','map','location','name','meaning','story','quiz','feedback','result','reward','collection','card']:['home','lessons','name','meaning','quiz','feedback','result','review','progress','favorites','card'];
function move(s:State,screen:Screen):State {
 if(!allowed(s.mode).includes(screen))return s;
 if(screen==='reward'&&!s.complete||screen==='result'&&!s.complete||screen==='card'&&s.mode==='kids'&&!s.complete)return s;
 const root=roots.includes(screen);
 return {...s,screen,history:root?[]:[...s.history,s.screen].slice(-16),context:root?screen:learning.includes(screen)?s.mode==='kids'?'map':'lessons':s.context,notice:'',...(learning.includes(screen)?{started:true,pending:true,resume:screen}:{}),...(screen==='review'?{revealed:false,reviewDone:false}:{})};
}
export function reducer(s:State,a:Action):State {
 switch(a.type){
  case 'go':return move(s,a.screen);
  case 'back':{const screen=s.history.at(-1)||s.context;return {...s,screen,history:s.history.slice(0,-1),notice:'',context:roots.includes(screen)?screen:s.context,...(learning.includes(screen)?{resume:screen,pending:true}:{})};}
  case 'lesson':return move(a.restart?{...s,selected:null,correct:false}:s,a.restart?(s.mode==='kids'?'location':'name'):s.started?s.resume:s.mode==='kids'?'location':'name');
  case 'select':return s.screen==='quiz'&&Number.isInteger(a.answer)&&a.answer>=0&&a.answer<=2?{...s,selected:a.answer,correct:false}:s;
  case 'check':return s.screen!=='quiz'||s.selected===null?s:move({...s,correct:s.selected===0},'feedback');
  case 'retry':return s.screen==='feedback'?{...s,screen:'quiz',resume:'quiz',history:s.history.slice(0,-1),selected:null,correct:false}:s;
  case 'finish':return s.screen==='feedback'&&s.correct?move({...s,complete:true,pending:false},'result'):s;
  case 'favorite':return s.mode==='adult'?{...s,favorite:!s.favorite}:s;
  case 'reset':return initial(a.mode);
  case 'continue':return s.pending?move(s,s.resume):s.complete?move(s,s.mode==='kids'?'location':'review'):move(s,s.resume);
  case 'reveal':return s.screen==='review'&&s.complete?{...s,revealed:true}:s;
  case 'reviewed':return s.screen==='review'&&s.complete&&s.revealed?{...s,reviewed:true,reviewDone:true}:s;
  case 'notice':return {...s,notice:a.text};
 }
}
export const storageKey=(mode:Mode)=>`asma-demo-v2-${mode}`;
export function restore(mode:Mode,raw:string|null):State {
 if(!raw)return initial(mode);
 try{
 const data=JSON.parse(raw),s=data.state;
 if(data.version!==2||!s||s.mode!==mode||!allowed(mode).includes(s.screen)||(!learning.includes(s.resume)||!allowed(mode).includes(s.resume))||(!allowed(mode).includes(s.context)||!roots.includes(s.context))||!Array.isArray(s.history)||s.history.length>16||!s.history.every((x:Screen)=>allowed(mode).includes(x)))return initial(mode);
 if(!['started','pending','correct','complete','favorite','revealed','reviewed','reviewDone'].every(k=>typeof s[k]==='boolean')||!(s.selected===null||Number.isInteger(s.selected)&&s.selected>=0&&s.selected<=2))return initial(mode);
 if(s.correct&&s.selected!==0||s.complete&&!s.started||s.pending&&!s.started||s.reviewed&&!s.complete||s.reviewDone&&(!s.complete||!s.revealed)||(['result','reward'].includes(s.screen)||mode==='kids'&&s.screen==='card')&&!s.complete||['quiz','feedback','name','meaning','story','location'].includes(s.screen)&&!s.started||s.screen==='feedback'&&(s.selected===null||s.correct!==(s.selected===0)))return initial(mode);
 return {...initial(mode),...s,notice:''};
 }catch{return initial(mode)}
}
export const serialize=(s:State)=>JSON.stringify({version:2,state:{...s,notice:''}});
export const sectionIds=['cover','problem','learning','two-worlds','adult','international','approach','sustainability','outreach','roadmap','team','support'];
export const sectionNames=['Обложка','Задача проекта','Детский режим','Два режима','Взрослый режим','Другие языки и рынки','Подход к обучению','Добровольная поддержка','Продвижение','Дорожная карта','Команда','Следующий шаг'];
