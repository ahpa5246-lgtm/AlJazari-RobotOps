import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { escapeHtml, groupSites, comparisonRows, toggleComparison } from '../public/fleet-view.js';

test('fleet presentation escapes untrusted identity text', () => {
  assert.equal(escapeHtml('<img title="x" onerror=\'y\'>&'), '&lt;img title=&quot;x&quot; onerror=&#39;y&#39;&gt;&amp;');
  assert.equal(escapeHtml(null), '');
});

test('atlas groups sites using the full tenant identity without inventing coordinates', () => {
  const a = { organizationId:'a', clientId:'c', siteId:'s', siteName:'Site', clientName:'Client', id:'1' };
  const b = {...a, organizationId:'b', id:'2'};
  const sites = groupSites([a,b,{...a,id:'3'}]);
  assert.equal(sites.length, 2);
  assert.deepEqual(sites[0].robots.map(r=>r.id), ['1','3']);
  assert.equal(sites[0].robots[0], a);
  assert.equal('position' in sites[0], false);
});

test('comparison toggles immutably and never selects more than two robots', () => {
  const initial = ['a'];
  const two = toggleComparison(initial,'b');
  assert.deepEqual(initial,['a']);
  assert.deepEqual(two,['a','b']);
  assert.deepEqual(toggleComparison(two,'c'),two);
  assert.deepEqual(toggleComparison(two,'a'),['b']);
});

test('comparison preserves observed readings and excludes unsupported or nonfinite signals', () => {
  const robot={capabilities:{battery:true,network:true,motors:true},health:{overall:71},telemetry:{batteryPercentage:42,networkLatency:81,motorCurrent:3.6,motorTemperature:46,observedAt:'2026-09-08T00:00:00.000Z'},operationalState:'working'};
  const other={...robot,capabilities:{battery:false,network:true,motors:false},telemetry:{...robot.telemetry,networkLatency:NaN},health:{overall:null}};
  const rows=comparisonRows([robot,other]);
  assert.deepEqual(rows[1].values,['42%',null]);
  assert.deepEqual(rows[2].values,['81 ms',null]);
  assert.deepEqual(rows[3].values,['3.6 A',null]);
  assert.deepEqual(rows[4].values,['46 °C',null]);
  assert.deepEqual(rows[0].values,['71 / 100',null]);
  assert.equal(rows[6].values[0],robot.telemetry.observedAt);
});

test('static UI contract preserves semantic order, safety labels and motion fallback', () => {
  const html=readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
  const css=readFileSync(new URL('../public/studio.css',import.meta.url),'utf8');
  const app=readFileSync(new URL('../public/app.js',import.meta.url),'utf8');
  assert.match(html,/SIMULATED DATA/);
  assert.match(html,/<dialog[^>]*aria-label=/);
  assert.match(html,/role="alert"/);
  const ids=['mission-title','specimen-title','topology-title','evidence-title','fleet-title','mission-analytics-title'];
  const positions=ids.map(id=>html.indexOf(`aria-labelledby="${id}"`));
  assert.deepEqual([...positions].sort((a,b)=>a-b),positions);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.match(css,/:focus-visible/);
  assert.match(css,/max-width:760px/);
  assert.match(css,/\[dir=rtl\]/);
  assert.match(html,/class="hero-route-signature"/);
  assert.match(css,/Night Dispatch Studio/);
  const pastelCss=readFileSync(new URL('../public/pastel-orbit.css',import.meta.url),'utf8');
  assert.match(pastelCss,/Pastel Route Orbit/);
  assert.match(html,/class="pastel-orbit"/);
  assert.match(html,/class="route-pass route-pass--rear"/);
  assert.match(pastelCss,/@media\(prefers-reduced-motion:reduce\)/);
  assert.match(css,/prefers-reduced-motion:reduce/);
  assert.doesNotMatch(html,/figma\.com\/api\/mcp\/asset/);
  assert.match(app,/window.confirm\(t\('confirmFault'\)\)/);
  assert.match(app,/document.hidden/);
  assert.match(app,/scope="row"/);
});

test('initial frontend assets stay under the 150 KiB raw and 45 KiB gzip budgets', () => {
  const assets=['index.html','styles.css','studio.css','pastel-orbit.css','app.js','fleet-view.js'].map(name=>readFileSync(new URL(`../public/${name}`,import.meta.url)));
  assert.ok(assets.reduce((n,b)=>n+b.length,0)<150*1024);
  assert.ok(assets.reduce((n,b)=>n+gzipSync(b).length,0)<45*1024);
});
