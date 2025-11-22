document.addEventListener("DOMContentLoaded", () => {
  // Elementy pro náhled obrázku
  const imagePanel = document.getElementById('image-panel');
  const previewImg = document.getElementById('preview-img');

  document.querySelectorAll(".card").forEach(card=>{
    // 1. Logika tlačítka KONTROLA
    const btnKontrola = card.querySelector(".kontrola-btn");
    const resultDiv = card.querySelector(".mrz-result");

    if(btnKontrola) {
      btnKontrola.addEventListener("click",()=>{
        const inputs = [...card.querySelectorAll("input[type='text']")].map(i=>i.value.trim().toUpperCase());
        let output;
        
        // Volání čistých funkcí z MRZ-calc.js
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
    }

    // 2. Logika tlačítka OCR (File Picker)
    const btnOcr = card.querySelector(".ocr-btn");
    const inputOcr = card.querySelector(".ocr-input");

    if(btnOcr && inputOcr) {
      // Kliknutí na tlačítko otevře systémový výběr souboru
      btnOcr.addEventListener('click', () => {
        inputOcr.click();
      });

      // Po výběru souboru
      inputOcr.addEventListener('change', (e) => {
        if(e.target.files && e.target.files[0]) {
          const reader = new FileReader();
          
          reader.onload = function(event) {
            previewImg.src = event.target.result;
            imagePanel.hidden = false; // Zobrazí levý panel
          }
          
          reader.readAsDataURL(e.target.files[0]);
        }
        // Reset inputu, aby šlo nahrát stejný soubor znovu
        e.target.value = '';
      });
    }
  });

  // 3. Logika vkládání šipek
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