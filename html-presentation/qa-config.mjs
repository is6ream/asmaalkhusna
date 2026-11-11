import ts from 'typescript';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const original=JSON.parse(await fs.readFile('../VARIABLES.json','utf8'));
const source=await fs.readFile('src/model.ts','utf8');
let variant=0;
async function load(config){const code=source.replace("import variables from '../../VARIABLES.json';",`const variables=${JSON.stringify(config)};`);const js=ts.transpileModule(code,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;return import(`data:text/javascript;base64,${Buffer.from(js+`\n// ${variant++}`).toString('base64')}`)}
const base=await load(original);assert.equal(base.developerCost,original.finance.developer_monthly_rate*original.finance.developer_months);assert.equal(base.totalMonths,original.roadmap.stages.reduce((s,x)=>s+x.months,0));
const changed=structuredClone(original);changed.finance.developer_monthly_rate=123456;changed.finance.developer_months=4;changed.finance.design=22000;changed.finance.developer_total_calculated=-999;changed.roadmap.total_months_calculated=-999;changed.roadmap.stages[0].months=5;const m=await load(changed);assert.equal(m.developerCost,493824);assert.equal(m.knownSum,515824);assert.equal(m.totalMonths,15);assert.equal(m.roadmap[1].start,6);assert.equal(m.roadmap.at(-1).end,15);assert.equal(m.incomplete,true);assert.equal(m.money(null),'Уточняется');
const unknown=structuredClone(original);unknown.finance.developer_monthly_rate=null;const u=await load(unknown);assert.equal(u.developerCost,null);assert.equal(u.knownSum,null);
await fs.writeFile('audit/config-results.json',JSON.stringify({status:'PASS',checks:['Source model responds to changed rate and months','Known items sum distinct from full budget','Sequential roadmap intervals and total recomputed','Stale calculated fields ignored','Unknown developer cost and completely unknown sum stay null','Root VARIABLES.json unchanged; test variants in memory only']},null,2));console.log('PASS configuration source, recalculation, unknowns');
