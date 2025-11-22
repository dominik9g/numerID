// MRZ-calc.js

function charValue(c) {
  if (!c) return 0;
  if (c >= '0' && c <= '9') return c.charCodeAt(0) - 48;
  if (c >= 'A' && c <= 'Z') return c.charCodeAt(0) - 55;
  if (c === '<') return 0;
  return 0;
}

function calcMRZDigit(str) {
  const weights = [7,3,1];
  let sum = 0;
  for (let i=0;i<str.length;i++){sum += charValue(str[i])*weights[i%3];}
  return (sum % 10).toString();
}

function padRight(str,len){
  str=str||"";
  if(str.length>=len) return str.slice(0,len);
  return str + '<'.repeat(len-str.length);
}

function formatDateYYMMDD(yymmdd,mode='birth'){
  if(!/^\d{6}$/.test(yymmdd)) return yymmdd;
  const yy=parseInt(yymmdd.slice(0,2),10);
  const mm=yymmdd.slice(2,4);
  const dd=yymmdd.slice(4,6);
  const now=new Date();
  const currentYY=now.getFullYear()%100;
  let year;
  
  if (mode === 'birth') {
    // 00-aktuální rok (např. 25) = 20xx
    // aktuální rok+1 (např. 26)-99 = 19xx
    year = yy <= currentYY ? 2000 + yy : 1900 + yy;
  } else {
    // Pro Expiraci: Dnes se bere jako rok 20xx
    year = 2000 + yy; 
  }

  // Zkontroluje, zda datum MM/DD je platné pro daný rok
  const dateObj = new Date(year, mm - 1, dd);
  if (dateObj.getFullYear() !== year || dateObj.getMonth() + 1 !== mm || dateObj.getDate() !== dd) {
    return `${yymmdd} (Neplatné datum)`;
  }
  
  return `${year}-${mm}-${dd}`;
}

// --- Validace Cestovního Pasu (2 řádky, 44 znaků) ---
function validatePassport(lines){
  const [l1,l2]=lines;
  if(l1.length!==44 || l2.length!==44) return {ok:false, html:"❌ Pas musí mít 2 řádky po 44 znacích."};

  const passportNum = l2.substring(0, 9);
  const passportCD = l2[9];
  const dob = l2.substring(13, 19);
  const dobCD = l2[19];
  const exp = l2.substring(21, 27);
  const expCD = l2[27];
  const personal = l2.substring(28, 43); 
  const personalCD = l2[43];
  
  const compositeStr = passportNum + passportCD + dob + dobCD + exp + expCD + personal;
  const compCD = l2[43]; 
  
  let ok = true;
  let out="<b>Výsledky kontroly Cestovního pasu:</b>";

  out+=`Číslo pasu: ${passportNum} Kontrola: ${calcMRZDigit(passportNum)===passportCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(passportNum)!==passportCD) ok=false;
  
  out+=`Datum narození: ${formatDateYYMMDD(dob,'birth')} Kontrola: ${calcMRZDigit(dob)===dobCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(dob)!==dobCD) ok=false;
  
  out+=`Platnost do: ${formatDateYYMMDD(exp,'expiry')} Kontrola: ${calcMRZDigit(exp)===expCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(exp)!==expCD) ok=false;

  // Finalní kontrolní číslice je pro Pas L2[43]
  out+=`Osobní číslo (případně): ${personal.replace(/</g,'').trim()} Kontrola: ${calcMRZDigit(personal)===personalCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(personal)!==personalCD) ok=false;

  out += `Finalní kontrolní číslice (vše: ${compositeStr.length} znaků): ${calcMRZDigit(compositeStr)===compCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(compositeStr)!==compCD) ok=false;

  return {ok:ok, html:out};
}

// --- Validace OP (3 řádky, 30 znaků) ---
function validateID(lines){
  const [l1,l2,l3]=lines;
  if(l1.length!==30 || l2.length!==30 || l3.length!==30) return {ok:false, html:"❌ OP musí mít 3 řádky po 30 znacích."};

  const docnum=l1.substring(5,14), docCD=l1[14];
  const dob=l2.substring(0,6), dobCD=l2[6];
  const exp=l2.substring(8,14), expCD=l2[14];
  const personal=l2.substring(18,29); 
  // Pro výpočet Composite CD se Osobní číslo doplní znaky '<' na délku 11
  const composite=padRight(docnum,9)+docCD+dob+dobCD+exp+expCD+padRight(personal,11); 
  const compositeCD=l2[29];

  let ok = true;
  let out="<b>Výsledky kontroly OP/NPT/PPP:</b>";
  const personalTrimmed = personal.replace(/</g,'').trim();
  if(personalTrimmed) out+=`Osobní číslo: ${personalTrimmed}\n`;
  
  out+=`Číslo dokladu: ${docnum} Kontrola: ${calcMRZDigit(docnum)===docCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(docnum)!==docCD) ok=false;

  out+=`Datum narození: ${formatDateYYMMDD(dob,'birth')} Kontrola: ${calcMRZDigit(dob)===dobCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(dob)!==dobCD) ok=false;

  out+=`Platnost do: ${formatDateYYMMDD(exp,'expiry')} Kontrola: ${calcMRZDigit(exp)===expCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(exp)!==expCD) ok=false;

  out += `Finalní kontrolní číslice (vše: ${composite.length} znaků): ${calcMRZDigit(composite)===compositeCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`+"\n";
  if(calcMRZDigit(composite)!==compositeCD) ok=false;

  return {ok:ok, html:out};
}