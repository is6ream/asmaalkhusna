import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const url=process.env.QA_URL||'http://127.0.0.1:5174/';
const browser=await chromium.launch({channel:'msedge',headless:true});
const report={url,date:new Date().toISOString(),browser:await browser.version(),checks:[],errors:[],screenshots:[]};
const ids=['cover','problem','learning','two-worlds','adult','international','approach','sustainability','outreach','roadmap','team','support'];
const sizes=[[1440,900],[1920,1080],[390,844],[360,800]];
const check=(name)=>{report.checks.push(name);console.log('PASS',name)};
async function screenshot(locator,path){await locator.screenshot({path:`screenshots/${path}`,animations:'disabled'});report.screenshots.push(path)}
try{
for(const [width,height] of sizes){
 const page=await browser.newPage({viewport:{width,height},reducedMotion:'reduce'});
 page.on('pageerror',e=>report.errors.push(e.message));page.on('console',m=>{if(m.type()==='error')report.errors.push(m.text())});
 await page.goto(url);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
 for(const id of ids){await page.evaluate(id=>document.getElementById(id).scrollIntoView({behavior:'instant'}),id);await page.waitForTimeout(70);
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,`${width} ${id}: horizontal overflow`);
  await screenshot(page.locator(`#${id}`),`${width}-${id}.png`);
 }
 check(`${width}x${height}: all 12 sections, no horizontal overflow, section screenshots`);
 await page.goto(`${url}#adult`);await page.waitForTimeout(250);assert.equal(await page.locator('.section-position').innerText(),'05 / 12');check(`${width}: direct link adult`);
 const adult=page.locator('[data-demo=adult]'),phone=adult.locator('.phone');
 const click=async(action)=>adult.locator(`[data-action="${action}"]`).click();
 const state=async screen=>assert.equal(await phone.getAttribute('data-screen'),screen);
 await state('home');await click('continue');await state('lessons');await click('lesson');await state('name');
 await adult.getByRole('button',{name:'Добавить в избранное',exact:true}).click();
 await adult.getByRole('button',{name:'Избранное',exact:true}).click();await state('favorites');assert.match(await phone.innerText(),/Ар-Рахман/);
 await adult.getByRole('button',{name:'Удалить из избранного',exact:true}).first().click();assert.match(await phone.innerText(),/Сохраните имя/);
 await adult.getByRole('button',{name:'Открыть карточку имени'}).click();
 await adult.getByRole('button',{name:'Добавить в избранное',exact:true}).click();
 await adult.getByRole('button',{name:'Главная',exact:true}).click();await click('continue');await state('name');
 if(width===1440||width===390)await screenshot(phone,`${width}-adult-name.png`);
 await click('meaning');await state('meaning');assert.match(await phone.innerText(),/экспертная проверка/);await click('quiz');await click('answer-1');await click('check');await state('feedback');assert.match(await phone.innerText(),/Попробуйте ещё/);await click('retry');await click('answer-0');
 if(width===1440||width===390)await screenshot(phone,`${width}-adult-selected.png`);
 await click('check');await click('finish');await state('result');
 if(width===1440||width===390)await screenshot(phone,`${width}-adult-result.png`);
 await click('result-next');await state('review');await click('progress');await state('progress');assert.match(await phone.innerText(),/1\s*из 99 имён/);
 if(width===1440||width===390)await screenshot(phone,`${width}-adult-progress.png`);
 await adult.getByRole('button',{name:'Увеличить демонстрацию'}).click();assert.equal(await adult.getAttribute('aria-modal'),'true');await page.keyboard.press('Escape');assert.equal(await adult.getAttribute('aria-modal'),null);assert.equal(await adult.locator('.enlarge').evaluate(el=>document.activeElement===el),true);
 await adult.getByRole('button',{name:'Сбросить демонстрацию и прогресс'}).click();await state('home');assert.match(await phone.innerText(),/0 \/ 99/);
 await phone.getByRole('button',{name:'Продолжить',exact:false}).focus();await page.waitForTimeout(100);const before=await page.locator('.section-position').innerText();await page.keyboard.press('ArrowRight');assert.equal(await page.locator('.section-position').innerText(),before);
 check(`${width}: adult full flow, error/retry, favorites add/remove, resume, result/progress, modal return/focus, reset, keyboard isolation`);
 await page.goto(`${url}#learning`);await page.waitForTimeout(250);
 const kids=page.locator('[data-demo=kids]'),kp=kids.locator('.phone');const kc=async a=>kids.locator(`[data-action="${a}"]`).click();
 await kc('start');await kc('location');await kc('child-name');await kc('meaning');await kc('quiz');assert.equal(await kp.getAttribute('data-screen'),'story');
 if(width===1440||width===390)await screenshot(kp,`${width}-kids-story.png`);
 await kc('child-quiz');await kc('answer-2');await kc('check');assert.match(await kp.innerText(),/Давай подумаем ещё/);await kc('retry');await kc('answer-0');await kc('check');await kc('finish');await kc('result-next');
 if(width===1440||width===390)await screenshot(kp,`${width}-kids-reward.png`);
 await kc('map');assert.match(await kp.innerText(),/Пройдено · повторить/);assert.match(await kp.innerText(),/1 имя в коллекции/);
 if(width===1440||width===390)await screenshot(kp,`${width}-kids-updated-map.png`);
 await kids.getByRole('button',{name:'Река открытий: следующая локация'}).click();assert.match(await kp.innerText(),/Её урок будет в полной версии/);
 await kids.getByRole('button',{name:'Коллекция',exact:true}).click();assert.match(await kp.innerText(),/Ар-Рахман/);
 if(width===1440||width===390)await screenshot(kp,`${width}-kids-collection.png`);
 await kids.getByRole('button',{name:'Сбросить демонстрацию и прогресс'}).click();assert.equal(await kp.getAttribute('data-screen'),'start');
 await kids.getByRole('button',{name:'Следующий шаг'}).click();assert.equal(await kp.getAttribute('data-screen'),'map');assert.equal(await kids.getAttribute('data-playing'),'false');
 check(`${width}: kids full flow, error/retry, reward, updated map/unlock explanation, collection, reset, reduced-motion step`);
 await page.close();
}
// Accelerated clock verifies the actual timer/reducer path, not a second implementation.
let page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'no-preference'});
page.on('pageerror',e=>report.errors.push(e.message));await page.clock.install();
for(const [mode,id,end] of [['adult','adult','progress'],['kids','learning','map']]){
 await page.goto(`${url}#${id}`);await page.clock.runFor(400);const scene=page.locator(`[data-demo=${mode}]`);await scene.getByRole('button',{name:'Смотреть демонстрацию',exact:true}).click();
 for(let i=0;i<17;i++){await page.clock.runFor(7100);if(await scene.getAttribute('data-playing')==='false')break}
 assert.equal(await scene.locator('.phone').getAttribute('data-screen'),end);assert.equal(await scene.getAttribute('data-playing'),'false');check(`${mode}: autoplay completed via shared reducer`);
 await scene.getByRole('button',{name:'Повторить с начала'}).click();await page.clock.runFor(5500);await scene.getByRole('button',{name:'Пауза',exact:true}).click();const paused=await scene.locator('.phone').getAttribute('data-screen');await page.clock.runFor(10000);assert.equal(await scene.locator('.phone').getAttribute('data-screen'),paused);check(`${mode}: pause stable`);
 await scene.getByRole('button',{name:'Смотреть демонстрацию',exact:true}).click();await page.evaluate(()=>document.getElementById('international').scrollIntoView({behavior:'instant'}));await page.waitForTimeout(150);await page.clock.runFor(1000);assert.equal(await scene.getAttribute('data-playing'),'false');const stopped=await scene.locator('.phone').getAttribute('data-screen');await page.clock.runFor(10000);assert.equal(await scene.locator('.phone').getAttribute('data-screen'),stopped);check(`${mode}: leaving section cancels autoplay`);
}
await page.close();page=await browser.newPage({viewport:{width:1440,height:900},reducedMotion:'reduce'});page.on('pageerror',e=>report.errors.push(e.message));
await page.goto(url);await page.waitForTimeout(300);await page.getByRole('button',{name:'Полноэкранный режим',exact:true}).click();assert.equal(await page.evaluate(()=>!!document.fullscreenElement),true);await page.getByRole('button',{name:'Выйти из полноэкранного режима',exact:true}).click();assert.equal(await page.evaluate(()=>!!document.fullscreenElement),false);check('Native fullscreen enter/exit');
await page.locator('body').click({position:{x:10,y:500}});await page.keyboard.press('ArrowRight');await page.waitForTimeout(200);assert.match(await page.locator('.section-position').innerText(),/^02/);check('Presentation arrow navigation');
await page.goto(`${url}#adult`);await page.waitForTimeout(300);await page.addStyleTag({content:'html{font-size:200%} .app-body p{font-size:22px} .app-title{font-size:34px}'});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);await screenshot(page.locator('[data-demo=adult]'),'large-text-adult.png');check('Large text reflow without horizontal overflow');
await page.close();assert.deepEqual(report.errors,[]);check('No browser console errors or page exceptions');report.status='PASS';
}catch(error){report.status='FAIL';report.failure=String(error.stack||error);console.error(error);process.exitCode=1}
finally{await fs.writeFile('audit/browser-results.json',JSON.stringify(report,null,2));await browser.close()}
