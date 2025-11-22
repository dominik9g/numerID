// img-upload.js - CELÝ SOUBOR

document.addEventListener("DOMContentLoaded", () => {
    const imagePanel = document.getElementById('image-panel');
    const previewImg = document.getElementById('preview-img');

    /**
     * Vymaže všechny inputy a výsledky kontroly v sekcích.
     */
    function clearAllInputs() {
        document.querySelectorAll(".card input[type='text']").forEach(input => {
            input.value = '';
        });
        document.querySelectorAll(".mrz-result").forEach(resultDiv => {
            resultDiv.innerHTML = '';
            resultDiv.classList.remove('show');
        });
    }

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
        
        
        // 2. Logika tlačítka OCR (Slouží jen pro nahrání souboru)
        const btnOcr = card.querySelector(".ocr-btn");
        const inputOcr = card.querySelector(".ocr-input"); 

        if (btnOcr && inputOcr) {
            
            btnOcr.addEventListener('click', () => {
                const isImageLoaded = previewImg.src.startsWith('data:'); 
                
                if (!isImageLoaded) {
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
                        
                        // --- ŘEŠENÍ RESETU ---
                        clearAllInputs(); // VYMAŽE staré výsledky v polích

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
