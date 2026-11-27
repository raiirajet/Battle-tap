
import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch({headless:true,args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{const context=await browser.newContext({viewport:{width:411,height:897},isMobile:true,hasTouch:true}),page=await context.newPage(),url='http://127.0.0.1:4173/';const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.accept('Offline test'));await page.goto(url);await page.locator('#guideSkip').click();await page.locator('#new').click();await page.locator('[data-template="studio"]').click();await page.locator('[data-wall]').first().waitFor();await page.locator('#menu').click();await page.locator('[data-act="checkProject"]').click();await page.locator('[data-close]').click();await page.locator('#back').click();await page.waitForFunction(()=>document.querySelector('#saveIndicator')?.dataset.state==='ok');await page.evaluate(async()=>{await navigator.serviceWorker.ready});await page.waitForFunction(()=>!!navigator.serviceWorker.controller);await context.setOffline(true);await page.reload();await page.locator('[data-open]').first().click();await page.locator('[data-wall]').first().waitFor();await page.locator('[data-mode="3d"]').click();await page.locator('#scene canvas').waitFor();await page.locator('[data-mode="2d"]').click();await page.locator('#back').click();await page.waitForFunction(()=>document.querySelector('#saveIndicator')?.dataset.state==='ok');await context.setOffline(false);await page.reload();await page.locator('[data-open]').first().waitFor();const second=await context.newPage();await second.goto(url);await second.locator('[data-open]').first().waitFor();await page.locator('[data-copy]').first().click();await page.waitForFunction(()=>document.querySelector('#saveIndicator')?.dataset.state==='ok');await second.locator('[data-copy]').first().click();await second.waitForFunction(()=>document.querySelector('#saveIndicator')?.dataset.state==='error');await page.reload();assert.equal(await page.locator('[data-open]').count(),2);await second.close();
// Valley D3: actual mobile UI, save and load. Seed a controlled position to avoid
// timing-dependent joystick navigation during CI software-rendered WebGL.
await page.locator('#valleyEntry').click();
await page.locator('#vScene canvas').waitFor();
await page.locator('#vName').fill('Valley D3 smoke');
await page.locator('#vCreate').click();
await page.locator('#vStartLife').click();
await page.locator('#vWalkCamera').click();assert.match(await page.locator('#vWalkCamera').textContent(),/Ich/);await page.locator('#vWalkCamera').click();assert.match(await page.locator('#vWalkCamera').textContent(),/Oben/);await page.locator('#vWalkCamera').click();await page.locator('#vRun').click();assert.match(await page.locator('#vRun').textContent(),/Gehen/);await page.locator('#vRun').click();await page.locator('#vJump').click();
await page.locator('#vDashboard').click();await page.locator('#vGraphics').click();assert.match(await page.locator('#vEconomyInfo').textContent(),/Grafikprofil/);await page.locator('#vEconomyActions button').filter({hasText:'Niedrig'}).click();await page.locator('#vDashboard').click();await page.locator('#vNav').click();await page.locator('#vEconomyActions button').filter({hasText:'Markt'}).click();await page.locator('#vMiniMap').waitFor();assert.match(await page.locator('#vNavInfo').textContent(),/Luftlinie/);await page.locator('#vDashboard').click();await page.locator('#vFamily').click();assert.match(await page.locator('#vEconomyInfo').textContent(),/0 Haushaltsmitglieder/);assert.ok(await page.locator('#vEconomyActions button').filter({hasText:'Katze adoptieren'}).isDisabled());await page.locator('#vEconomyClose').click();
await page.locator('#vDashboard').click();await page.locator('#vJobs').click();assert.match(await page.locator('#vEconomyInfo').textContent(),/Tagesziel 0\/3/);assert.equal(await page.locator('#vEconomyActions button').count(),5);await page.locator('#vEconomyClose').click();
await page.locator('#vDashboard').click();await page.locator('#vWeather').click();assert.match(await page.locator('#vEconomyInfo').textContent(),/Frühling/);await page.locator('#vEconomyClose').click();
await page.locator('#vDashboard').click();await page.locator('#vPeople').click();
assert.equal(await page.locator('.vResidentRow').count(),6);
await page.locator('#vEconomyClose').click();
await page.locator('#vDashboard').click();await page.locator('#vInventory').click();
assert.match(await page.locator('#vEconomyInfo').textContent(),/0\/12/);
await page.locator('#vEconomyClose').click();
await page.locator('#vDashboard').click();await page.locator('#vDashBuild').click();
await page.locator('#vOwned').waitFor();
await page.locator('#vBack').click();
await page.locator('#valleyEntry').waitFor();
await page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('homecraft-valley',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('saves','readwrite'),store=tx.objectStore('saves'),all=store.getAll();all.onsuccess=()=>{const s=all.result.find(x=>x.name==='Valley D3 smoke');if(!s?.life){tx.abort();return} s.life.needs.minute=600;s.life.checkpoint={buildingRevision:0,state:{x:288,z:346,height:0,level:null}};store.put(s)};tx.oncomplete=()=>{db.close();resolve()};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error||new Error('Valley fixture failed'))}}}));
await page.locator('#valleyEntry').click();
await page.locator('#vSaves option').nth(1).waitFor({state:'attached'});
await page.locator('#vSaves').selectOption({index:1});
await page.locator('#vLoad').click();
await page.locator('#vStartLife').click();
await page.locator('#vTalk').click();
assert.match(await page.locator('#vEconomyTitle').textContent(),/Lea/);
await page.locator('#vEconomyActions button').filter({hasText:'Unterhalten'}).click();
await page.waitForFunction(()=>document.querySelector('#vLifeNotice')?.textContent.includes('Bekanntschaft mit Lea gespeichert'));
await page.locator('#vDashboard').click();await page.locator('#vPeople').click();
assert.match(await page.locator('.vResidentRow').filter({hasText:'Lea'}).textContent(),/8\/100/);
await page.locator('#vEconomyClose').click();
await page.locator('#vDashboard').click();await page.locator('#vDashBuild').click();
await page.locator('#vOwned').waitFor();
await page.locator('#vBack').click();
await page.locator('#valleyEntry').waitFor();
// D5: purchase via UI, enter, exit and persist. Position fixture is local to test.
await page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('homecraft-valley',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('saves','readwrite'),store=tx.objectStore('saves'),all=store.getAll();all.onsuccess=()=>{const s=all.result.find(x=>x.name==='Valley D3 smoke');if(!s?.life){tx.abort();return}s.life.checkpoint={buildingRevision:0,state:{x:329,z:316,height:0,level:null}};store.put(s)};tx.oncomplete=()=>{db.close();resolve()};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error||new Error('D5 fixture failed'))}}}));
await page.locator('#valleyEntry').click();await page.locator('#vSaves option').nth(1).waitFor({state:'attached'});await page.locator('#vSaves').selectOption({index:1});await page.locator('#vLoad').click();await page.locator('#vStartLife').click();await page.locator('#vDashboard').click();await page.locator('#vCar').click();await page.locator('#vEconomyActions button').filter({hasText:'Valley City kaufen'}).click();await page.locator('#vDrive').waitFor();await page.locator('#vDrive').click();await page.locator('#vCarHud').waitFor();assert.match(await page.locator('#vCarHud').textContent(),/20.0\/35 L/);await page.locator('#vCarCamera').click();assert.match(await page.locator('#vCarCamera').textContent(),/frei/);await page.locator('#vDrive').click();await page.locator('#vCarHud').waitFor({state:'hidden'});await page.locator('#vDashboard').click();await page.locator('#vDashBuild').click();await page.locator('#vOwned').waitFor();assert.match(await page.locator('#vBalance').textContent(),/18.500|18’500|18'500/);await page.locator('#vBack').click();await page.locator('#valleyEntry').waitFor();
// D6: persisted job acceptance and first working station; no immediate income.
await page.evaluate(()=>new Promise((resolve,reject)=>{const req=indexedDB.open('homecraft-valley',1);req.onerror=()=>reject(req.error);req.onsuccess=()=>{const db=req.result,tx=db.transaction('saves','readwrite'),store=tx.objectStore('saves'),all=store.getAll();all.onsuccess=()=>{const s=all.result.find(x=>x.name==='Valley D3 smoke');if(!s?.life){tx.abort();return}s.life.needs.minute=600;s.life.checkpoint={buildingRevision:0,state:{x:296,z:306.6,height:0,level:null}};store.put(s)};tx.oncomplete=()=>{db.close();resolve()};tx.onabort=tx.onerror=()=>{db.close();reject(tx.error||new Error('D6 fixture failed'))}}}));
await page.locator('#valleyEntry').click();await page.locator('#vSaves option').nth(1).waitFor({state:'attached'});await page.locator('#vSaves').selectOption({index:1});await page.locator('#vLoad').click();await page.locator('#vStartLife').click();
await page.locator('#vTrade').click();await page.locator('#vEconomyActions button').filter({hasText:'Mechaniker starten'}).click();await page.locator('#vJobStep').waitFor();await page.locator('#vJobStep').click();await page.locator('#vEconomyActions button').filter({hasText:'Fehler prüfen'}).click();
await page.waitForFunction(()=>document.querySelector('#vJobHud')?.textContent.includes('2/3'));await page.locator('#vDashboard').click();await page.locator('#vDashBuild').click();await page.locator('#vOwned').waitFor();assert.match(await page.locator('#vBalance').textContent(),/18.500|18’500|18'500/);await page.locator('#vBack').click();await page.locator('#valleyEntry').waitFor();
await page.locator('#valleyEntry').click();await page.locator('#vSaves option').nth(1).waitFor({state:'attached'});await page.locator('#vSaves').selectOption({index:1});await page.locator('#vLoad').click();await page.locator('#vStartLife').click();assert.match(await page.locator('#vJobHud').textContent(),/2\/3/);await page.locator('#vDashboard').click();await page.locator('#vJobs').click();await page.locator('#vEconomyActions button').filter({hasText:'Auftrag abbrechen'}).click();await page.locator('#vJobHud').waitFor({state:'hidden'});await page.locator('#vDashboard').click();await page.locator('#vDashBuild').click();await page.locator('#vOwned').waitFor();await page.locator('#vBack').click();await page.locator('#valleyEntry').waitFor();
// Dashboard layout, character editor and one-time gift on a fresh save.
await page.setViewportSize({width:900,height:420});await page.locator('#valleyEntry').click();await page.locator('#vName').fill('Starter smoke');await page.locator('#vCreate').click();await page.locator('#vOpenStartDashboard').click();await page.locator('#vCharacter').click();await page.locator('#vHideAvatar').check();await page.locator('#vCharacterDone').click();await page.locator('#vDashboard').click();await page.locator('#vStarter').click();await page.locator('#vEconomyActions button').filter({hasText:'Kostenlos erhalten'}).click();await page.waitForFunction(()=>document.querySelector('#vLifeNotice')?.textContent.includes('Starterpaket erhalten'));await page.locator('#vDashboard').click();assert.ok(await page.locator('#vStarterCard').isHidden());assert.match(await page.locator('#vDashStats').textContent(),/30.000|30’000|30'000/);assert.match(await page.locator('#vDashStats').textContent(),/Valley City/);await page.locator('#vDashboardClose').click();assert.ok(await page.locator('#vCharacter').isHidden());const joystick=await page.locator('#vJoystick').boundingBox();assert.ok(joystick.y+joystick.height<=420);await page.locator('#vDashboard').click();await page.locator('#vDashBuild').click();await page.locator('#vOwned').waitFor();await page.locator('#vBack').click();await page.locator('#valleyEntry').waitFor();
// Audio feedback follows the persisted mixer settings. The browser verifies that
// the Web Audio context runs. The device and its speaker require a manual test.
await page.locator('#valleyEntry').click();
const starterSave=page.locator('#vSaves option').filter({hasText:'Starter smoke'});
await starterSave.waitFor({state:'attached'});
await page.locator('#vSaves').selectOption(await starterSave.getAttribute('value'));
await page.locator('#vLoad').click();
await page.locator('#vOpenStartDashboard').click();
await page.locator('#vProperty').click();
assert.match(await page.locator('#vEconomyActions').textContent(),/Valley City.*nur du darfst einsteigen/);
await page.locator('#vEconomyDashboard').click();
await page.locator('#vSound').click();
const testTone=page.getByRole('button',{name:'Testton abspielen'});
const soundStatus=page.locator('#vSoundStatus');
const soundEnabled=page.getByRole('checkbox',{name:'Sound aktiv',exact:true});
const effectsEnabled=page.getByRole('checkbox',{name:'Spielgeräusche',exact:true});
for(const [control,message] of [[soundEnabled,'Aktiviere «Sound aktiv»'],[effectsEnabled,'Aktiviere «Spielgeräusche»']]){
  await control.uncheck();
  await testTone.click();
  await soundStatus.filter({hasText:message}).waitFor();
  await control.check();
}
await testTone.click();
await soundStatus.filter({hasText:'Testton wird abgespielt'}).waitFor();
await page.locator('#vEconomyDashboard').click();
await page.locator('#vDashBuild').click();
await page.locator('#vOwned').waitFor();
await page.locator('#vBack').click();
await page.locator('#valleyEntry').waitFor();
// Unified RC23: direct editor transfer, placement, persistence, renovation copy.
await page.setViewportSize({width:900,height:700});await page.locator('#plannerEntry').click();await page.locator('[data-open]').first().click();
await page.locator('#menu').click();await page.locator('[data-act="valleyDirect"]').click();await page.locator('#vName').fill('Unified house smoke');await page.locator('#vMode').selectOption('sandbox');await page.locator('#vCreate').click();await page.locator('#vOwned').waitFor();
assert.notEqual(await page.locator('#vDesign').inputValue(),'');await page.locator('#vPreviewHouse').click();await page.locator('#vPlacement').waitFor();assert.match(await page.locator('#vHouseCheck').textContent(),/Platzierung gültig/);await page.locator('#vPlaceHouse').click();await page.waitForFunction(()=>document.querySelector('#vMessage')?.textContent.includes('Hausrevision 1 gespeichert'));assert.match(await page.locator('#vHouseCurrent').textContent(),/Hausrevision 1/);
// Reopen a placed home at known walkable positions to exercise the door and cutaway.
const valleyHome='Unified house smoke';
for(const [local,expected] of [[{x:4.5,z:5.65},'Draussen'],[{x:1,z:3.6},'Erdgeschoss']]){
  await page.locator('#vBack').click();
  await page.locator('#valleyEntry').waitFor();
  await page.evaluate(({name,local})=>new Promise((resolve,reject)=>{
    const open=indexedDB.open('homecraft-valley',1);
    open.onerror=()=>reject(open.error);
    open.onsuccess=()=>{
      const db=open.result,tx=db.transaction('saves','readwrite'),store=tx.objectStore('saves'),all=store.getAll();
      all.onsuccess=()=>{
        const save=all.result.find(s=>s.name===name),house=save?.building;
        if(!house){tx.abort();return}
        const {x,z,rotation}=house.transform,angle=rotation*Math.PI/180;
        const dx=local.x-house.design.origin.x,dz=local.z-house.design.origin.z;
        const state={x:x+dx*Math.cos(angle)-dz*Math.sin(angle),z:z+dx*Math.sin(angle)+dz*Math.cos(angle),height:0,level:house.design.source.levels[0].id};
        save.life={revision:1,...save.life,checkpoint:{buildingRevision:house.revision,state}};
        store.put(save);
      };
      tx.oncomplete=()=>{db.close();resolve()};
      tx.onabort=tx.onerror=()=>{db.close();reject(tx.error||new Error('Placed home fixture failed'))};
    };
  }),{name:valleyHome,local});
  await page.locator('#valleyEntry').click();
  const saveOption=page.locator('#vSaves option').filter({hasText:valleyHome});
  await saveOption.waitFor({state:'attached'});
  await page.locator('#vSaves').selectOption(await saveOption.getAttribute('value'));
  await page.locator('#vLoad').click();
  await page.locator('#vStartLife').click();
  await page.locator('#vLifeLocation').filter({hasText:expected}).waitFor();
  if(expected==='Draussen'){
    await page.locator('#vInteract').filter({hasText:'Tür öffnen'}).click();
    await page.locator('#vLifeNotice').filter({hasText:'Tür geöffnet.'}).waitFor();
    await page.locator('#vInteract').filter({hasText:'Tür schliessen'}).click();
    await page.locator('#vLifeNotice').filter({hasText:'Tür geschlossen.'}).waitFor();
  }
  await page.locator('#vDashboard').click();
  await page.locator('#vDashBuild').click();
  await page.locator('#vOwned').waitFor();
}
await page.locator('#vRenovate').click();await page.locator('#name').waitFor();assert.match(await page.locator('#name').textContent(),/Umbau/);await page.locator('#back').click();await page.locator('#valleyEntry').waitFor();assert.equal(await page.locator('[data-open]').count(),3);
assert.deepEqual(errors,[]);console.log('Mobile viewport, offline PWA, persistence and stale-tab conflict passed')}finally{await browser.close()}
