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
export type Screen='home'|'lessons'|'name'|'meaning'|'quiz'|'feedback'|'result'|'review'|'progress'|'favorites'|'start'|'map'|'location'|'story'|'reward'|'collection';
export type State={screen:Screen;resume:Screen;selected:number|null;correct:boolean;complete:boolean;favorite:boolean;notice:string};
export type Action={type:'go';screen:Screen}|{type:'select';answer:number}|{type:'check'}|{type:'retry'}|{type:'finish'}|{type:'favorite'}|{type:'reset';mode:Mode}|{type:'continue'}|{type:'notice';text:string};
export const initial=(mode:Mode):State=>({screen:mode==='kids'?'start':'home',resume:mode==='kids'?'start':'lessons',selected:null,correct:false,complete:false,favorite:false,notice:''});
const learning:Screen[]=['lessons','name','meaning','quiz','feedback','result','review','location','story','reward'];
export function reducer(s:State,a:Action):State {
 switch(a.type){
  case 'go': return {...s,screen:a.screen,resume:learning.includes(a.screen)?a.screen:s.resume,notice:''};
  case 'select': return {...s,selected:a.answer};
  case 'check': return s.selected===null?s:{...s,screen:'feedback',resume:'feedback',correct:s.selected===0};
  case 'retry':return {...s,screen:'quiz',resume:'quiz',selected:null,correct:false};
  case 'finish': return {...s,complete:true,screen:'result',resume:'result'};
  case 'favorite':return {...s,favorite:!s.favorite};
  case 'reset':return initial(a.mode);
  case 'continue':return {...s,screen:s.resume,notice:''};
  case 'notice':return {...s,notice:a.text};
 }
}
export const sectionIds=['cover','problem','learning','two-worlds','adult','international','approach','sustainability','outreach','roadmap','team','support'];
export const sectionNames=['Обложка','Проблема','Учебный путь','Два режима','Взрослый режим','Масштаб','Подход','Устойчивость','Продвижение','Roadmap','Команда','Поддержка'];
