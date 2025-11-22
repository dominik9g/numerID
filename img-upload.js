// img-upload.js - CELÝ SOUBOR

document.addEventListener("DOMContentLoaded", () => {
    const imagePanel = document.getElementById('image-panel');
    const previewImg = document.getElementById('preview-img');

    /**
     * Vymaže všechny inputy, výsledky kontroly A VÝŘEZ.
     */
    function clearAllInputs() {
        document.querySelectorAll(".card input[type='text']").forEach(input => {
            input.value = '';
        });
        document.querySelectorAll(".mrz-result").forEach(resultDiv => {
            resultDiv.innerHTML = '';
            resultDiv.classList.remove('show');
        });

        // Vyčištění starého výřezu
        const cropContainer = document.getElementById('mrz-crop-container');
        if (cropContainer) {
            cropContainer.innerHTML = '';
            cropContainer.style.display = 'none';
        }
    }

    document.querySelectorAll(".card").forEach(card=>{
        // 1. Logika tlačítka KONTROLA (Beze změn)
        const btnKontrola = card.querySelector(".kontrola-btn");
        const resultDiv = card.querySelector(".mrz-result");
        
        if(btnKontrola) {
            btnKontrola.addEventListener("click",()=>{
                // Zajištění, že se inputy berou ze správné karty
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
        
        // 2. Logika tlačítka OCR (Slouží jen pro nahrání souboru)
        const btnOcr = card.querySelector(".ocr-btn");
        const inputOcr = card.querySelector(".ocr-input"); 

        if (btnOcr && inputOcr) {
            
            btnOcr.addEventListener('click', () => {
                inputOcr.click(); 
            });

            // Logika nahrávání souboru přes inputOcr change event
            inputOcr.addEventListener('change', (e) => {
                if(e.target.files && e.target.files[0]) {
                    const reader = new FileReader();
                    
                    reader.onload = function(event) {
                        previewImg.src = event.target.result;
                        imagePanel.hidden = false;
                        
                        clearAllInputs(); // VYMAŽE staré výsledky

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