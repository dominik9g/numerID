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
  if(mode==='birth'){year=(yy>currentYY)?1900+yy:2000+yy;}
  else{year=(yy<70)?2000+yy:1900+yy;}
  return `${dd}.${mm}.${year}`;
}

const countryCodes = {
  "CZE":"Czech Republic"
};

// --- Validace PAS ---
function validatePassport(lines){
  const [l1,l2] = lines;
  if(l1.length !== 44 || l2.length !== 44)
    return {ok:false, html:"❌ Pas má mít 2 řádky po 44 znacích."};

  const issuingCountryCode = l1.substring(2,5);
  const docNum = l2.substring(0,9);
  const docCD  = l2[9];
  const nationalityCode = l2.substring(10,13);
  const dob = l2.substring(13,19);
  const dobCD = l2[19];
  const sex = l2[20];
  const exp = l2.substring(21,27);
  const expCD = l2[27];
  const personalRaw = l2.substring(28,42);
  const personalCD = l2[42];
  const compCD = l2[43];
  const compositeStr = l2.substring(0,10) + l2.substring(13,20) + l2.substring(21,43);

  let out = "<b>Výsledky kontroly pasu:</b>";
  out += `Osobní číslo (rč): ${personalRaw.replace(/</g,'')}\n`;
  out += `Vydavatel: ${countryCodes[issuingCountryCode]||"Neznámý"} (${issuingCountryCode}) ` +
          ((issuingCountryCode in countryCodes)?"<span class='ok'>✔ OK</span>\n":"<span class='bad'>❌NOK</span>\n");
  out += `Číslo pasu: ${docNum.replace(/<+$/,'')} ` + 
          (calcMRZDigit(padRight(docNum,9))===docCD ? "<span class='ok'>✔ OK</span>\n" : "<span class='bad'>❌NOK</span>\n");
  out += `Národnost: ${countryCodes[nationalityCode]||"Neznámý"} (${nationalityCode}) ` + 
          ((nationalityCode in countryCodes)?"<span class='ok'>✔ OK</span>\n":"<span class='bad'>❌NOK</span>\n");
  out += `Datum narození: ${formatDateYYMMDD(dob,'birth')} ` + 
          (calcMRZDigit(dob)===dobCD ? "<span class='ok'>✔ OK</span>\n" : "<span class='bad'>❌NOK</span>\n");
  out += `Datum expirace: ${formatDateYYMMDD(exp,'expiry')} ` + 
          (calcMRZDigit(exp)===expCD ? "<span class='ok'>✔ OK</span>\n" : "<span class='bad'>❌NOK</span>\n");
  
  out += `Kontrolní číslice z čísla dokladu: ${calcMRZDigit(padRight(docNum,9))===docCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}\n`;
  out += `Kontrolní číslice z data narození: ${calcMRZDigit(dob)===dobCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}\n`;
  out += `Kontrolní číslice z data expirace: ${calcMRZDigit(exp)===expCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}\n`;
  out += `Kontrolní číslice z osobního čísla: ${calcMRZDigit(padRight(personalRaw,14))===personalCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}\n`;
  out += `Finalní kontrolní číslice: ${calcMRZDigit(compositeStr)===compCD ? "<span class='ok'>✔ OK</span>" : "<span class='bad'>❌NOK</span>"}`;

  return {ok:true, html:out};
}

// --- Validace OP ---
function validateID(lines){
  const [l1,l2,l3]=lines;
  if(l1.length!==30 || l2.length!==30 || l3.length!==30) return {ok:false, html:"❌ OP musí mít 3 řádky po 30 znacích."};

  const docnum=l1.substring(5,14), docCD=l1[14];
  const dob=l2.substring(0,6), dobCD=l2[6];
  const exp=l2.substring(8,14), expCD=l2[14];
  const personal=l2.substring(18,29); 
  const composite=padRight(docnum,9)+docCD+dob+dobCD+exp+expCD+padRight(personal,11);
  const compositeCD=l2[29];

  let out="<b>Výsledky kontroly OP/NPT/PPP:</b>";
  const personalTrimmed = personal.replace(/</g,'').trim();
  if(personalTrimmed) out+="Osobní číslo: "+personalTrimmed+"\n";
  
  out+="Číslo dokladu: "+docnum+" "+(calcMRZDigit(padRight(docnum,9))===docCD?"<span class='ok'>✔ OK</span>\n":"<span class='bad'>❌NOK</span>\n");
  out+="Datum narození: "+formatDateYYMMDD(dob,'birth')+" "+(calcMRZDigit(dob)===dobCD?"<span class='ok'>✔ OK</span>\n":"<span class='bad'>❌NOK</span>\n");
  out+="Datum expirace: "+formatDateYYMMDD(exp,'expiry')+" "+(calcMRZDigit(exp)===expCD?"<span class='ok'>✔ OK</span>\n":"<span class='bad'>❌NOK</span>\n");
  out+="Kontrolní číslice: "+(calcMRZDigit(composite)===compositeCD?"<span class='ok'>✔ OK</span>":"<span class='bad'>❌NOK</span>");
  
  return {ok:true, html:out};
}

// --- Event Listeners ---
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".card").forEach(card=>{
    const btn = card.querySelector(".kontrola-btn");
    if(!btn) return;
    const resultDiv = card.querySelector(".mrz-result");

    btn.addEventListener("click",()=>{
      const inputs = [...card.querySelectorAll("input")].map(i=>i.value.trim().toUpperCase());
      let output;
      
      if(inputs.length === 3) {
        output = validateID(inputs).html;
      } else if(inputs.length === 2) {
        output = validatePassport(inputs).html;
      } else {
        output = "❌ Neplatný počet řádků.";
      }
      
      resultDiv.innerHTML = output;
      resultDiv.classList.add('show');
    });
  });

  document.querySelectorAll('.insert-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      const input = btn.previousElementSibling;
      if(input && input.tagName === 'INPUT'){
        input.value += '<';
        input.focus();
      }
    });
  });
});