// GDD 1.1 pp. 13–24, 34–35. Data and implemented mechanics are distinct.
const nums=s=>s.split(',').map(Number);
const cost=(keys,s)=>Object.fromEntries(nums(s).map((n,i)=>[keys[i],n]).filter(([,n])=>n));
export const buildings=Object.fromEntries(`town|Rathaus|1|4,4|250,150,0,0|90|1200|2
house|Wohnhaus|1|2,2|60,15,0,0|25|240|0
storage|Lagerhaus|1|3,2|100,50,0,0|45|450|2
yard|Bauhof|2|3,3|150,60,40,0|60|480|4
market|Marktplatz|2|3,3|200,80,80,0|90|500|2
bank|Bankhaus|3|3,3|250,180,150,0|120|750|2
court|Gerichtshaus|3|3,3|220,200,100,0|100|650|2
embassy|Botschaft|3|3,3|200,150,150,0|110|600|2
palace|Palast|4|5,5|800,1400,1000,100|300|3000|4
province|Provinzverwaltung|3|4,4|400,350,200,0|180|1100|2
wood|Holzfällerlager|1|2,2|50,10,0,0|25|220|4
stone|Steinbruch|1|3,2|70,0,0,0|35|300|4
farm|Bauernhof|1|3,3|70,0,0,0|35|250|4
hunt|Jägerhütte|1|2,2|50,10,0,0|25|220|3
fish|Fischerhütte|1|2,2|65,10,0,0|30|220|3
well|Brunnen|1|1,1|25,40,0,0|25|180|0
sawmill|Sägewerk|2|3,2|140,50,30,0|60|380|3
forester|Försterei|2|2,2|100,30,30,0|45|280|2
iron|Eisenmine|2|3,3|120,80,40,0|60|420|4
gold|Goldmine|2|3,3|130,100,50,0|75|450|4
mill|Mühle|2|2,2|130,60,40,0|60|360|2
bakery|Bäckerei|2|2,2|120,50,30,0|50|300|2
ranch|Viehzucht|2|3,3|120,40,40,0|60|350|3
smith|Schmiede|2|3,2|160,100,60,0|75|450|3
weaver|Weberei|3|2,2|150,60,50,0|65|350|2
tanner|Gerberei|3|2,2|140,60,50,0|65|350|2
horse|Pferdezucht|3|4,3|240,80,120,0|100|500|3
armor|Rüstungswerkstatt|3|3,3|220,150,100,20|100|600|3
trade|Handelskontor|3|3,3|300,150,150,0|120|650|3
port|Hafen|3|4,3|350,160,120,0|120|800|4
shipyard|Werft|4|4,4|550,250,250,40|180|1200|4
luxury|Luxusmanufaktur|4|3,3|300,220,180,20|150|750|3
caravan|Karawanenhof|2|3,3|160,50,60,0|75|400|3
camp|Milizlager|1|3,2|100,40,20,0|45|450|0
barracks|Kaserne|2|3,3|180,80,50,0|60|650|0
range|Schiessplatz|2|3,3|160,60,40,0|60|500|0
tower|Wachturm|2|2,2|120,100,30,0|60|600|2
palisade|Palisade|2|1,1|15,0,0,0|8|180|0
stable|Stall|3|3,3|220,100,100,0|90|700|0
arsenal|Waffenlager|3|3,2|180,120,60,0|75|550|2
wall|Steinmauer|3|1,1|5,35,0,0|12|600|0
gate|Stadttor|3|2,1|60,100,40,0|45|900|0
castle|Burg|3|5,5|650,1000,350,60|240|2400|2
siege|Belagerungswerkstatt|4|4,3|400,200,200,80|150|1000|3
fort|Festung|4|5,5|850,1600,600,120|300|3500|4
guard|Garde-Akademie|5|4,4|700,850,750,150|240|1600|3
fire|Feuerstelle|1|1,1|20,10,0,0|15|100|0
tavern|Taverne|2|3,2|150,70,60,0|60|400|2
school|Schule|2|3,2|150,80,80,0|75|400|3
clinic|Heilerhaus|2|3,2|140,80,60,0|65|420|2
bath|Badehaus|3|3,3|180,180,100,0|100|600|2
temple|Tempelhalle|3|3,3|200,240,150,0|120|800|2
library|Bibliothek|3|3,3|220,160,150,0|120|650|4
academy|Akademie / Universität|4|4,4|450,400,350,20|180|1100|5
theatre|Theater / Denkmal|4|4,3|400,300,250,0|150|900|2
wonder|Weltwunder|5|8,8|15000,25000,20000,8000|1800|8000|4`.split('\n').map((line,i)=>{const[k,name,age,size,c,t,hp,jobs]=line.split('|');return[k,{id:'B'+String(i+1).padStart(2,'0'),name,age:+age,size:nums(size),cost:cost('HSGE',c),time:+t,hp:+hp,jobs:+jobs}]}));
export const technologies=Object.fromEntries(`W01|Forstwirtschaft|1|20,10,30,0,0|30||Holzproduktion +10 %
W02|Vorratskörbe|1|20,15,20,0,0|40||Träger +5 Kapazität
W03|Fruchtwechsel|2|50,30,50,0,0|60||Feldproduktion +15 %
W04|Steinwerkzeuge|2|60,35,0,50,0|60|W01|Stein +10 %
W05|Radtransport|2|70,45,60,0,0|75|W02|Karren +20 % Kapazität
W06|Wasserführung|3|100,80,60,60,0|120|W03|Brunnenleistung +20 %
W07|Ofentechnik|3|120,90,60,0,20|120|W03|Bäckereizyklus −10 %
W08|Erzaufbereitung|3|150,100,0,60,30|150|W04|Eisenproduktion +15 %
W09|Fernlogistik|4|220,180,120,0,0|180|W05|Transporttempo +15 %
W10|Standardmasse|4|250,200,0,60,40|200|W08|Werkzeugkosten E −10 %
W11|Agrarwissen|5|400,350,200,0,0|300|W06,W07|Feldproduktion +15 %
W12|Handwerksverbund|5|450,400,100,100,100|360|W09,W10|Verarbeitungszyklen −10 %
M01|Milizdrill|1|25,15,20,0,0|40||Miliz Ausbildungszeit −10 %
M02|Wachsamkeit|1|25,15,0,0,0|40||Scout Sicht +1
M03|Eisenverarbeitung|2|60,40,0,0,20|60|M01|Waffen und schwere Infanterie
M04|Bogenschnitzerei|2|60,40,50,0,0|70|M01|Bogenschaden +5 %
M05|Schildformation|2|70,50,0,0,10|80|M01|Schildwall
M06|Stalltraining|3|120,90,0,0,20|120|M03|Kavallerietempo +8 %
M07|Panzerplatten|3|150,100,0,0,50|150|M03|Schwere Rüstung +10 %
M08|Feldmedizin|3|130,100,0,0,0|120|M05|Feldheiler +15 %
M09|Belagerungslehre|4|240,180,100,0,40|180|M07|Belagerung Angriff +10 %
M10|Offiziersschule|4|250,200,0,0,0|200|M06,M08|Moralregeneration +20 %
M11|Gardedrill|5|450,380,0,0,80|300|M10|Königsgarde
M12|Verbundtaktik|5|450,400,0,0,60|360|M09,M10|Formation Wechselzeit −25 %
B01|Holzverbindungen|1|25,15,40,0,0|40||Holzgebäude LP +10 %
B02|Fundamentplan|1|25,15,0,30,0|40||Bauzeit −5 %
B03|Kieswege|2|50,30,20,40,0|60|B02|Kiesstrasse
B04|Werkstattplanung|2|60,40,40,0,0|60|B01|Bauhof +2 Aufträge
B05|Brückenbau|2|80,45,50,50,0|75|B02|Brücken
B06|Steinarchitektur|3|120,90,0,80,0|120|B02|Gebäude-LP +15 %
B07|Pflasterung|3|130,100,0,80,0|120|B03|Pflasterstrasse
B08|Torbaukunst|3|150,120,40,80,20|150|B06|Tor-LP +15 %
B09|Hebewerke|4|220,180,100,60,20|180|B04|Bauzeit −10 %
B10|Reichsstrassen|4|250,200,60,100,0|200|B07|Reichsstrasse
B11|Grossstatik|5|400,350,120,200,60|300|B06,B09|Weltwunder
B12|Erhaltungskunst|5|450,400,0,150,40|360|B08,B09|Reparaturkosten −15 %
K01|Schreibtafeln|1|25,10,20,0,0|30||Berater Wissen +10 %
K02|Heilkräuter|1|25,15,0,0,0|40||Medizin +5 Gesundheit
K03|Schulordnung|2|50,30,30,0,0|60|K01|Schule Wissen +10 %
K04|Kartenkunde|2|60,40,20,0,0|60|K01|Expedition Zeit −10 %
K05|Hygiene|2|70,50,0,30,0|75|K02|Gesundheit +5
K06|Archivierung|3|110,85,40,0,0|120|K03|Bibliothek Wissen +10 %
K07|Feldforschung|3|130,100,0,0,0|120|K04|Expedition EP +10 %
K08|Arzneikunde|3|150,120,0,0,0|150|K05|Medizinzyklus −15 %
K09|Akademische Lehre|4|220,180,0,80,0|180|K06|Wissen +15 %
K10|Ingenieurwissenschaft|4|250,200,50,50,40|200|K06|Belagerungsbauzeit −10 %
K11|Universitätsrecht|5|400,350,0,100,0|300|K09|Universitätsausbau
K12|Offene Archive|5|450,400,0,0,0|360|K07,K11|Forschungszeit −15 %
P01|Gemeinderat|1|20,10,0,0,0|30||Kultur +3
P02|Wegerecht|1|20,15,10,0,0|40||Durchmarschkosten −10 %
P03|Handelsrecht|2|50,30,0,0,0|60|P02|Marktspread −2 Prozentpunkte
P04|Bürgerregister|2|60,40,0,0,0|60|P01|Ansiedlungszeit −10 %
P05|Vertragsordnung|2|70,45,0,0,0|75|P02|Nichtangriffspakte
P06|Diplomatisches Protokoll|3|120,90,0,0,0|120|P05|Bündnisse
P07|Zollverwaltung|3|130,100,0,0,0|120|P03|Fernhandelsertrag +5 %
P08|Erbfolgegesetz|3|150,120,0,0,0|150|P01|Dynastiewechsel
P09|Provinzrecht|4|220,180,0,0,0|180|P06|4 Provinzen
P10|Friedensordnung|4|250,200,0,0,0|200|P06|Vertragseinflusskosten −15 %
P11|Reichsversammlung|5|400,350,0,0,0|300|P09|6 Provinzen
P12|Kulturpatronat|5|450,400,0,0,0|360|P08,P10|Kultur +8`.split('\n').map(line=>{const[id,name,age,c,t,req,effect]=line.split('|');return[id,{id,name,age:+age,cost:cost('GWHSE',c),time:+t,req:req?req.split(','):[],effect}]}));
export const units=Object.fromEntries(`militia|Miliz|1|45,10,0,0|20|80,12,3|1,2.6,1.8|1|camp
scout|Scout|1|50,0,20,0|25|65,6,1|1,4,2|1|camp
sword|Schwert|2|65,0,30,20|30|120,22,12|1,2.7,1.8|1|barracks
spear|Speer|2|55,25,15,10|25|110,18,8|1.5,2.6,2|1|barracks
bow|Bogen|2|50,40,20,0|30|75,20,2|7,2.8,2.4|1|range
shield|Schildwache|3|80,20,45,35|40|180,14,20|1,2,2|1|barracks
crossbow|Armbrust|3|65,45,50,15|40|90,30,5|8,2.3,3.2|1|range
cavalry|Leichte Kavallerie|3|100,0,50,15|45|150,26,10|1,4.5,2.2|1|stable
knight|Ritter|3|150,0,100,60|60|240,40,24|1,3.7,2.8|2|stable
healer|Feldheiler|3|70,0,80,0|40|90,0,2|5,2.7,3|1|clinic
ram|Rammbock|4|0,220,60,40|75|450,65,25|1,1.3,4|3|siege
catapult|Katapult|4|0,350,120,60|90|200,75,8|12,1.5,5|3|siege
trebuchet|Tribok|4|0,500,200,100|120|250,100,10|16,1,7|3|siege
royal|Königsgarde|5|200,0,180,120|90|300,44,28|1,2.4,2.3|2|guard
crown|Kronengarde|3|95,10,55,35|45|185,17,20|1,2.2,2.2|1|castle
ranger|Waldläufer|3|75,45,45,0|40|90,23,4|8,3.2,2.5|1|castle
ironwatch|Eisenwächter|3|100,15,55,45|50|220,16,28|1,1.8,2.5|2|castle
sunrider|Sonnenreiter|3|110,0,65,20|50|160,29,12|1,4.7,2.4|1|castle
tide|Gezeitenwache|3|75,30,30,15|35|140,20,12|1.5,2.6,2.1|1|castle
frost|Frostwache|3|90,10,45,25|40|160,24,15|1,2.5,2.1|1|castle
fishing|Fischerboot|3|0,80,20,0|45|150,0,2|0,3,0|1|port
merchant|Handelsschiff|4|0,250,100,20|90|400,0,10|0,3.3,0|2|shipyard
patrol|Patrouillenschiff|4|0,350,160,50|120|550,36,15|9,3.5,3.5|4|shipyard
cart|Versorgungskarren|2|0,70,20,0|35|120,0,2|0,3,0|1|caravan`.split('\n').map((line,i)=>{const[k,name,age,c,t,stats,motion,pop,site]=line.split('|');const[hp,atk,armor]=nums(stats),[range,speed,interval]=nums(motion);return[k,{id:'U'+String(i+1).padStart(2,'0'),name,age:+age,cost:cost('NHGE',c),time:+t,hp,atk,armor,range,speed,interval,pop:+pop,site}]}));
export const heroes=Object.fromEntries(`Aldric Valen|Elara Voss|Kriegsherr|620|24|2.5
Lyra Dorn|Kael Fen|Waldläufer|450|22|3.5
Bram Kessel|Mira Stein|Baumeister|560|18|2.6
Oren Thal|Neria Aster|Gelehrter|420|12|2.7
Maera Venn|Sami Rayan|Diplomat|460|14|2.9
Sera Lumen|Tovan Reed|Heiler|480|10|2.8`.split('\n').flatMap(line=>{const[a,b,role,hp,atk,speed]=line.split('|');return[a,b].map(name=>[name,{role,hp:+hp,atk:+atk,speed:+speed}])}));
export const ages=[null,null,{pop:15,cost:{H:300,S:150,N:400,G:100,W:30},time:120},{pop:50,cost:{H:800,S:600,N:1500,G:600,W:300},time:300},{pop:110,cost:{H:2500,S:1800,N:4000,G:2000,W:1200},time:600},{pop:200,cost:{H:6000,S:5000,N:10000,G:8000,W:4000},time:1200}];
export const achievementThresholds={AUF:[1,5,10,25,50,100,150,200,300,500],WIR:[100,500,1000,2500,5000,10000,25000,50000,75000,100000],BEV:[8,15,25,40,60,80,100,150,200,250],FOR:[1,3,5,10,15,20,30,40,50,60],HAN:[1,5,10,20,30,50,75,100,150,250],MIL:[1,3,5,10,15,20,25,50,75,100],VER:[1,3,5,10,15,20,25,50,75,100],ERK:[1,3,5,10,15,20,25,35,50,75],DYN:[1,2,3,4,5,6,7,8,9,10],DIP:[1,3,5,10,15,20,30,40,50,75],PVP:[1,3,5,10,20,30,50,75,100,200],END:[1,2,3,4,5,6,7,8,9,10]};
export const implementedTech=new Set('W01 W03 W04 W06 W07 W08 W10 W11 W12 M01 M03 M04 M07 M08 M09 M11 B02 B03 B07 B09 B10 K01 K02 K03 K04 K05 K06 K08 K09 K12 P01 P03 P04 P05 P08 P12'.split(' '));
