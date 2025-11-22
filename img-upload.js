// img-upload.js

document.addEventListener("DOMContentLoaded", () => {
    // Elementy pro náhled obrázku
    const imagePanel = document.getElementById('image-panel');
    const previewImg = document.getElementById('preview-img');

    document.querySelectorAll(".card").forEach(card=>{
        // 1. Logika tlačítka KONTROLA a VKLÁDACÍ TLAČÍTKA (Beze změn)
        const btnKontrola = card.querySelector(".kontrola-btn");
        const resultDiv = card.querySelector(".mrz-result");
        
        if(btnKontrola) {
            btnKontrola.addEventListener("click",()=>{
                const inputs = [...card.querySelectorAll("input[type='text']")].map(i=>i.value.trim().toUpperCase());
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
        }
        
        document.querySelectorAll('.insert-btn').forEach(btn=>{
            btn.addEventListener('click', ()=>{
                const input = btn.previousElementSibling;
                if(input && input.tagName === 'INPUT'){
                    input.value += '<';
                    input.focus();
                }
            });
        });
        
        
        // 2. Logika tlačítka OCR (Spouštění OCR nebo dialogu)
        const btnOcr = card.querySelector(".ocr-btn");
        const inputOcr = card.querySelector(".ocr-input"); 

        if (btnOcr && inputOcr) {
            
            btnOcr.addEventListener('click', async () => {
                
                // OPRAVENÁ LOGIKA: Kontrolujeme, zda src obsahuje Data URL
                const isImageLoaded = previewImg.src.startsWith('data:'); 
                const isMRZSelected = !!window.MRZ;
                
                // --- DIAGNOSTICKÝ LOG START ---
                console.log('--- OCR CLICK DIAGNOSTICS ---');
                console.log('  isImageLoaded:', isImageLoaded, ' (src starts with data:? ' + previewImg.src.startsWith('data:') + ')');
                console.log('  isMRZSelected:', isMRZSelected);
                // --- DIAGNOSTICKÝ LOG END ---
                
                // Zkontrolujeme, zda jsou splněny obě podmínky pro spuštění OCR
                if (isImageLoaded && isMRZSelected) {
                    console.log('  TRIGGERING: runOCR (Cesta B)');
                    await runOCR(card); 
                } else {
                    console.log('  TRIGGERING: File dialog (Cesta A) - Chyba: Chybí MRZ zóna nebo Data URL obrázku.');
                    inputOcr.click(); 
                }
            });

            // Logika nahrávání souboru přes inputOcr change event
            inputOcr.addEventListener('change', (e) => {
                if(e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = function(event) {
                        previewImg.src = event.target.result;
                        imagePanel.hidden = false;
                        
                        // Po nahrání nového obrázku zrušíme starou selekci
                        window.MRZ = null; 
                        
                        const selectionRect = document.getElementById('selection-rect');
                        if (selectionRect) {
                            selectionRect.style.display = 'none';
                        }
                    }
                    
                    reader.readAsDataURL(e.target.files[0]);
                }
                e.target.value = '';
            });
        }
    });
});
