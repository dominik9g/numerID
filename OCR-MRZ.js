// OCR-MRZ.js

/**
 * Předzpracuje text získaný z Tesseractu do formátu MRZ řádků.
 * Odstraňuje nepovolené znaky a nahrazuje mezery znakem '<'.
 * @param {string} text - Syrový text z Tesseractu.
 * @returns {string[]} Pole vyčištěných MRZ řádků.
 */
function processOCRText(text) {
    if (!text) return [];
    
    // 1. Vyčistíme text od nepovolených znaků (povoleno: 0-9, A-Z, <, ., newline)
    const cleanedText = text.replace(/[^0-9A-Z<.\n]/g, '').trim();

    // 2. Rozdělíme na řádky a filtrujeme prázdné řádky
    let lines = cleanedText.split('\n').filter(line => line.length > 0);

    // 3. Nahradíme všechny mezery znakem '<' (standardní korekce MRZ OCR chyb)
    lines = lines.map(line => line.trim().replace(/ /g, '<'));
    
    return lines;
}

/**
 * Spustí Tesseract OCR na vybrané zóně a naplní input pole v dané sekci.
 * Používá custom trénovací data 'mrz.traineddata.gz' ze stejné složky.
 * @param {HTMLElement} card - Element karty (rodič pro inputy a tlačítka).
 */
async function runOCR(card) {
    const previewImg = document.getElementById('preview-img');
    
    // Globální proměnná MRZ je definována v mrz-select.js
    if (!previewImg.src || !window.MRZ) {
        alert('CHYBA: Nejprve nahrajte obrázek a vyberte MRZ zónu.');
        return;
    }

    const btnOcr = card.querySelector(".ocr-btn");
    // Získání počtu řádků ze speciálního atributu, který je definován v index.html
    const mrzLines = parseInt(card.getAttribute('data-mrz-lines') || '3');
    const inputFields = card.querySelectorAll('input[type="text"]');
    
    // Vizuální zpětná vazba
    btnOcr.textContent = 'ČTENÍ...';
    btnOcr.disabled = true;

    try {
        // Inicializace workeru Tesseract pro jazyk 'mrz'
        const worker = await Tesseract.createWorker('mrz', 1, {
            langPath: './', // Tesseract bude hledat mrz.traineddata.gz v aktuální složce
        });
        
        // Získání přirozené velikosti obrázku pro výpočet pixelových souřadnic
        const naturalW = previewImg.naturalWidth;
        const naturalH = previewImg.naturalHeight;
        
        // Převod normalizovaných souřadnic (0-1) na pixelové
        const rectangle = {
            left: Math.round(naturalW * window.MRZ.x),
            top: Math.round(naturalH * window.MRZ.y),
            width: Math.round(naturalW * window.MRZ.w),
            height: Math.round(naturalH * window.MRZ.h),
        };

        // Spuštění rozpoznávání na vybrané zóně (omezené na rectangle)
        const { data: { text } } = await worker.recognize(previewImg, { rectangle });
        
        await worker.terminate();

        // Zpracování textu
        const lines = processOCRText(text);

        // Naplnění inputů
        for (let i = 0; i < mrzLines; i++) {
            if (inputFields[i]) {
                // Získání maximální délky z placeholderu (např. "(30 znaků)")
                const maxLengthMatch = inputFields[i].placeholder.match(/\((\d+)/);
                const maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : 44;
                
                // Naplníme input a omezíme délku na maximum
                inputFields[i].value = (lines[i] || '').substring(0, maxLength);
            }
        }
        
    } catch (error) {
        console.error('OCR Error:', error);
        alert('Chyba při zpracování OCR. Zkuste znovu. Zkontrolujte, zda je soubor "mrz.traineddata.gz" ve správné složce.');
    } finally {
        btnOcr.textContent = 'OCR';
        btnOcr.disabled = false;
    }
}