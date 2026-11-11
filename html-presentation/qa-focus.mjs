import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const browser=await chromium.launch({channel:'msedge',headless:true});const checks=[],errors=[];
try{
for(const width of [1440,360])for(const [mode,id,first,screen] of [['adult','adult','continue','lessons'],['kids','learning','start','map']]){
 const p=await browser.newPage({viewport:{width,height:900},reducedMotion:'no-preference'});p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});await p.goto(`http://127.0.0.1:4173/#${id}`);await p.waitForTimeout(300);
 const scene=p.locator(`[data-demo=${mode}]`);await scene.getByRole('button',{name:'Смотреть демонстрацию',exact:true}).click();await scene.locator(`[data-action=${first}]`).click();assert.equal(await scene.getAttribute('data-playing'),'false');assert.equal(await scene.locator('.phone').getAttribute('data-screen'),screen);assert.equal(await scene.locator('.app-body').evaluate(e=>document.activeElement===e),true);
 const before=await p.locator('.section-position').innerText();await p.keyboard.press('ArrowRight');await p.waitForTimeout(150);assert.equal(await p.locator('.section-position').innerText(),before);checks.push(`${width} ${mode}: manual action cancels auto, focus survives screen change, arrow stays in app`);
 await scene.getByRole('button',{name:'Повторить с начала'}).click();await p.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(120);assert.equal(await scene.getAttribute('data-playing'),'false');checks.push(`${width} ${mode}: hidden-tab event cancels autoplay`);await p.close();
}
assert.deepEqual(errors,[]);const report=JSON.parse(await fs.readFile('audit/browser-results.json','utf8'));report.checks.push(...checks);report.status='PASS';report.errors.push(...errors);await fs.writeFile('audit/browser-results.json',JSON.stringify(report,null,2));await fs.writeFile('audit/focus-results.json',JSON.stringify({status:'PASS',checks,errors},null,2));console.log(checks.map(x=>'PASS '+x).join('\n'));
}catch(e){console.error(e);process.exitCode=1}finally{await browser.close()}
