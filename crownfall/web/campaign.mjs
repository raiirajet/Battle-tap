// GDD v1.1 pp. 41–45. Rewards are never transferred between Kingdom and Campaign.
export const chapters=['Die Überlebenden','Das erste Banner','Schatten der Krone','Das zerbrochene Reich','Das Vermächtnis'];
export const missions=`C101|Das neue Banner|Karte erkunden, 2 Arbeiter zuweisen|30 H, 30 EP
C102|Wasser des Tals|Brunnen errichten und 80 % Bedarf decken|50 S
C103|Brot für alle|3 Min. positive Nahrungsbilanz|100 N
C104|Ein sicheres Dach|15 Wohnplätze, 1 Ansiedlung|60 H
C105|Die alte Strasse|10 Wegfelder und Scout-Ziel erreichen|50 G
C106|Grenzposten|Milizlager, zwei Milizen, Posten erkunden|50 G, 10 I
C107|Die Banditen|Lager besiegen oder 80 G zahlen|70 G, 15 I
C108|Gründungsrat|Rathausberatung, 30 W, Urkunde|Gründerbanner, Kapitel II
C201|Ein neuer Morgen|Zeitalter II erreichen|100 H, 100 N
C202|Handwerk|Schmiede und Werkzeugrezept abschliessen|50 E
C203|Kornspeicher|Getreide, Mühle, Bäckerei in Betrieb|150 N
C204|Offener Markt|100 Einheiten lokal handeln|100 G
C205|Das Buch der Wege|K04 forschen, eine Mine erkunden|80 W
C206|Die Gesandte|Maera treffen, neutralen Handel vereinbaren|30 I
C207|Stadtwache|Wachturm und 4 Einheiten ausbilden|100 S
C208|Das erste Banner|50 Pop., Schule, Markt, Vertrag|Wappenrahmen, Kapitel III
C301|Krönung|Zeitalter III erreichen|200 G
C302|Eid der Häuser|P08 erforschen, Nachfolge vorbereiten|100 I
C303|Die freie Stadt|Verhältnis zu NPC +60 erreichen|80 I
C304|Der Grenzkonflikt|Versorgte Armee zum Kontrollpunkt führen|200 N
C305|Die vergessene Bibliothek|Expedition mit Gelehrtem abschliessen|Relikt, 150 W
C306|Handelsbrücke|Eine Fernroute, 3 Lieferungen|150 G
C307|Zweites Zuhause|Zweite Provinz friedlich oder militärisch gründen|200 H, 200 S
C308|Das Siegel der Krone|Erstes Kampagnenvermächtnis freischalten|Kapitel IV, Siegel
C401|Aufbruch ins Imperium|Zeitalter IV erreichen|300 G
C402|Das Netz der Städte|3 funktionierende Provinzen|500 N
C403|Eisen und Stein|Belagerungswerkstatt, 1 Gerät bauen|150 E
C404|Der Pass von Kharadon|Zwei strategische Punkte kontrollieren|200 I
C405|Eine fragile Allianz|Zwei NPC-Verträge gleichzeitig aktiv|150 I
C406|Der lange Winter|Einen Winter mit Gesundheit ≥70 beenden|200 G, 200 W
C407|Der Rat der Erben|Mit Garran verhandeln oder KI-Gefecht gewinnen|Epische Ausrüstung
C408|Das verlorene Archiv|Kaiserliche Ruine abschliessen|Kapitel V, Relikt
C501|Zeitalter der Erinnerung|Zeitalter V erreichen|500 G
C502|Das alte Geheimnis|3 unterschiedliche Ruinen erkunden|3 Fragmente
C503|Die Entscheidung|Archiv offenlegen oder regional verwalten|Chronikpfad, 300 I
C504|Eine neue Ordnung|Drei Provinzen stabil, 2 Verträge aktiv|500 N
C505|Der letzte Feldzug|Festung sichern und Versorgung 15 Min. halten|Legendäres Relikt
C506|Das Weltwunder|Phase 1–3 eines Weltwunders abschliessen|1 000 Prestige
C507|Die neue Generation|Nachfolge und 3 aktive Vermächtnisse|Dynastiebanner
C508|Eryndors Zukunft|Rat vereinen, Friedens- oder Schutzweg abschliessen|Kampagnenabzeichen, freies Endgame`.split('\n').map(l=>{const[id,name,goal,reward]=l.split('|');return{id,name,goal,reward}});
const checks={
 C101:s=>s.cameraUsed&&s.buildings.reduce((n,b)=>n+b.workers,0)>=2,
 C102:s=>has(s,'well')&&s.waterCoverage>=.8,
 C103:s=>s.positiveFood>=180,
 C104:s=>s.peakCapacity>=15&&s.recruited>=1,
 C105:s=>s.roads.length>=10&&s.explored,
 C106:s=>has(s,'camp')&&s.units.filter(u=>u.type==='militia').length>=2&&s.explored,
 C107:s=>s.won||s.negotiated,
 C108:s=>s.reward&&s.r.W>=30&&s.buildings.some(b=>b.type==='town'&&b.workers>0),
 C201:s=>s.age>=2,
 C202:s=>has(s,'smith')&&s.produced.tool>=1,
 C203:s=>s.produced.grain>=1&&s.produced.flour>=1&&s.produced.bakery>=1&&has(s,'mill')&&has(s,'bakery'),
 C204:s=>s.localTrade>=100,
 C205:s=>s.tech.includes('K04')&&s.discovered.includes(1),
 C206:s=>s.stats.DIP>=1,
 C207:s=>has(s,'tower')&&s.trained>=4,
 C208:s=>s.pop+s.units.length>=50&&has(s,'school')&&has(s,'market')&&s.stats.DIP>=1,
 C301:s=>s.age>=3,
 C302:s=>s.tech.includes('P08')&&s.pop>=50,
 C303:s=>s.relation>=60,
 C401:s=>s.age>=4,
 C403:s=>has(s,'siege')&&s.units.some(u=>['ram','catapult','trebuchet'].includes(u.type)),
 C501:s=>s.age>=5
};
const has=(s,type)=>s.buildings.some(b=>b.type===type&&b.left===0);
const rewards={C101:{H:30},C102:{S:50},C103:{N:100},C104:{H:60},C105:{G:50},C106:{G:50,I:10},C107:{G:70,I:15},C108:{},C201:{H:100,N:100},C202:{E:50},C203:{N:150},C204:{G:100},C205:{W:80},C206:{I:30},C207:{S:100},C208:{},C301:{G:200},C302:{I:100},C303:{I:80},C401:{G:300},C403:{E:150},C501:{G:500}};
export function missionStatus(s,m){if(s.campaignDone.includes(m.id))return 'complete';if(missions.find(x=>!s.campaignDone.includes(x.id))?.id!==m.id)return 'locked';if(!checks[m.id])return 'unimplemented';return checks[m.id](s)?'ready':'active';}
export function claimMission(s,id,limit){if(s.mode!=='campaign')return false;const m=missions.find(x=>x.id===id);if(!m||missionStatus(s,m)!=='ready')return false;const r=rewards[id];if(Object.entries(r).some(([k,v])=>s.r[k]+v>limit(s,k)))return false;for(const[k,v]of Object.entries(r))s.r[k]+=v;s.campaignDone.push(id);if(id==='C101')s.campaignXP+=30;s.chronicle.push(id+' · '+m.name);return true;}
