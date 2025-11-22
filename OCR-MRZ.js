// OCR-MRZ.js - FINÁLNÍ VERZE S VYNUCENOU ABSOLUTNÍ CESTOU
//
// ABSOLUTNÍ CESTA NA NETLIFY
const ABSOLUTE_TESSDATA_PATH = 'https://numerid.netlify.app/tessdata/';
// Doporučujeme zkusit NE-GZIPPED verzi
const TRAINED_DATA_FILE = 'mrz.traineddata'; 
// Pokud by to selhalo, zkuste: const TRAINED_DATA_FILE = 'mrz.traineddata.gz';


/**
 * Předzpracuje text získaný z Tesseractu do formátu MRZ řádků.
 */
function processOCRText(text) {
    if (!text) return [];
    
    // Povoluje pouze 0-9, A-Z, <, ., newline
    const cleanedText = text.replace(/[^0-9A-Z<.\n]/g, '').trim();
    let lines = cleanedText.split('\n').filter(line => line.length > 0);
    // Nahrazuje mezery znakem '<'
    lines = lines.map(line => line.trim().replace(/ /g, '<'));
    
    return lines;
}

// Funkce pro centrální signalizaci (nutná pro synchronizaci tlačítek v mrz-select.js)
if (typeof signalOcrEnd !== 'function') {
    window.signalOcrEnd = () => { /* Dummy */ };
}


/**
 * Spustí Tesseract OCR na vybrané zóně a naplní input pole.
 * @param {HTMLElement} card - Element karty.
 * @param {Object} mrzCoords - PŘEDANÉ souřadnice MRZ (x, y, w, h).
 */
async function runOCR(card, mrzCoords) { 
    const previewImg = document.getElementById('preview-img');
    
    if (!mrzCoords) { 
        console.error('OCR-MRZ.js ERROR: runOCR byla zavolána, ale chybí PŘEDANÉ MRZ souřadnice.');
        if (typeof signalOcrEnd === 'function') { signalOcrEnd(); }
        return;
    }

    const btnOcr = card.querySelector(".ocr-btn");
    const expectedLines = parseInt(card.getAttribute('data-mrz-lines') || '3'); 
    const inputFields = card.querySelectorAll('input[type="text"]');
    
    console.log('--- OCR Start ---');
    console.log(`1. Zpracování pro MRZ zónu (předané): ${expectedLines} řádků`, mrzCoords);
    
    let worker = null; 

    try {
        
        console.log(`2. Inicializace Tesseract Workeru z ABSOLUTNÍ CESTY: ${ABSOLUTE_TESSDATA_PATH}`);
        
        // Vytvoříme Worker S jazykem 'mrz' a ABSOLUTNÍMI CESTAMI
        worker = await Tesseract.createWorker('mrz', 1, {
            // Cesty ke Workeru a WASM jádru
            workerPath: ABSOLUTE_TESSDATA_PATH + 'worker.min.js', 
            corePath: ABSOLUTE_TESSDATA_PATH + 'tesseract-core-simd-lstm.wasm.js', 
            workerBlobURL: false, // Pro self-hosting
            
            // Nastavuje prefix, kde se traineddata soubory hledají
            langPath: ABSOLUTE_TESSDATA_PATH, 
            
            // Použijeme preload k vynucení stažení souboru (pro jistotu)
            preload: [ABSOLUTE_TESSDATA_PATH + TRAINED_DATA_FILE],
            
            logger: m => console.log('TESSERACT LOG:', m) 
        });
        
        console.log('3. Worker a data úspěšně inicializovány. Použita ABSOLUTNÍ CESTA.');
        
        // --- Logika OCR ---
        
        const naturalW = previewImg.naturalWidth;
        const naturalH = previewImg.naturalHeight;
        
        const rectangle = {
            left: Math.round(naturalW * parseFloat(mrzCoords.x)), 
            top: Math.round(naturalH * parseFloat(mrzCoords.y)),
            width: Math.round(naturalW * parseFloat(mrzCoords.w)),
            height: Math.round(naturalH * parseFloat(mrzCoords.h)),
        };

        console.log('4. Spouštění recognice na pixelových souřadnicích:', rectangle);

        const { data: { text } } = await worker.recognize(previewImg, { rectangle });
        
        console.log('5. Recognice dokončena. Syrový text:', text);

        const lines = processOCRText(text);
        const actualLines = lines.length; 

        // --- ŘEŠENÍ KONTAMINACE ---
        
        if (actualLines === 0) {
            console.warn(`OCR result for card (lines: ${expectedLines}) was empty.`);
        } else if (actualLines !== expectedLines) {
            console.warn(`OCR result mismatch for card (expected: ${expectedLines}, actual: ${actualLines}). Skipping fill to avoid cross-contamination.`);
        } else {
            // Pouze pokud se shoduje počet řádků, propíšeme data
            for (let i = 0; i < expectedLines; i++) {
                if (inputFields[i]) {
                    const maxLengthMatch = inputFields[i].placeholder.match(/\((\d+)/);
                    const maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : 44;
                    
                    inputFields[i].value = (lines[i] || '').substring(0, maxLength);
                }
            }
            console.log('6. Inputy naplněny. OCR Success.');
        }
        
    } catch (error) {
        // Zde můžeme konečně vidět, co se děje, pokud ABSOLUTNÍ CESTA selže
        let errorMessage = 'Zpracování Tesseractu selhalo.';
        if (error.message.includes('initialization failed')) {
             errorMessage = 'Inicializace Tesseractu selhala. Pravděpodobný problém s MIME typem, CORS nebo fyzickou nedostupností souborů na hostingu.';
        }
        console.error('OCR CRITICAL ERROR:', errorMessage, error.message, error);
        alert('Kritická chyba při OCR. Zkontrolujte konzoli pro detailní TESSERACT LOG.');
        
    } finally {
        btnOcr.textContent = 'OCR'; 

        if (worker) {
            await worker.terminate();
        }
        
        if (typeof signalOcrEnd === 'function') {
            signalOcrEnd();
        }
        
        console.log('--- OCR End ---');
    }
}
