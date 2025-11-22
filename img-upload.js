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
                    // Předpokládá funkci validateID z MRZ-calc.js
                    output = validateID(inputs).html; 
                } else if(inputs.length === 2) {
                    // Předpokládá funkci validatePassport z MRZ-calc.js
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
                
                // Kontrolujeme, zda je obrázek vizuálně nahrán a zda je vybraná MRZ zóna
                const isImageLoaded = previewImg.src && !previewImg.src.startsWith(''); // Zabraňuje prázdnému stringu
                const isMRZSelected = !!window.MRZ;
                
                // --- DIAGNOSTICKÝ LOG START ---
                console.log('--- OCR CLICK DIAGNOSTICS ---');
                console.log('  isImageLoaded:', isImageLoaded, ' (src:', previewImg.src ? 'OK' : 'EMPTY', ')');
                console.log('  isMRZSelected:', isMRZSelected);
                // --- DIAGNOSTICKÝ LOG END ---
                
                // Zkontrolujeme, zda jsou splněny obě podmínky pro spuštění OCR
                if (isImageLoaded && isMRZSelected) {
                    console.log('  TRIGGERING: runOCR (Cesta B)');
                    // runOCR je definováno v OCR-MRZ.js
                    await runOCR(card); 
                } else {
                    console.log('  TRIGGERING: File dialog (Cesta A)');
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
                        
                        // Zde je nutné provést kontrolu existence elementu
                        const selectionRect = document.getElementById('selection-rect');
                        if (selectionRect) {
                            selectionRect.style.display = 'none';
                        }
                    }
                    
                    reader.readAsDataURL(e.target.files[0]);
                }
                e.target.value = ''; // Reset inputu pro možnost nahrání stejného souboru
            });
        }
    });
});
