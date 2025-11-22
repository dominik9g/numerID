// OCR-MRZ.js - KRITICKÁ VERZE: MANUÁLNÍ STAŽENÍ A VLOŽENÍ DAT DO WORKER FS

// ABSOLUTNÍ CESTA NA NETLIFY (Potvrzeno uživatelem)
const ABSOLUTE_TESSDATA_PATH = 'https://numerid.netlify.app/tessdata/';
const TRAINED_DATA_FILE = 'mrz.traineddata'; // Zkusme standardní soubor

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
    
    console.log('--- OCR Start (Nuclear) ---');
    
    let worker = null; 
    let trainedData = null;

    try {
        // !!! KROK 1: MANUÁLNÍ STAŽENÍ DAT PŘED VŠÍM OSTATNÍM !!!
        const dataUrl = ABSOLUTE_TESSDATA_PATH + TRAINED_DATA_FILE;
        console.log('2.1. Spouštění manuálního stahování Trained Data z:', dataUrl);
        
        const dataResponse = await fetch(dataUrl);
        if (!dataResponse.ok) {
            // Zde uvidíte přesnou chybu, pokud je problém s MIME typem/CORS/404
            throw new Error(`Chyba při stahování ${TRAINED_DATA_FILE}. Kód: ${dataResponse.status}`);
        }
        trainedData = await dataResponse.arrayBuffer();
        console.log(`2.2. Trained Data (${TRAINED_DATA_FILE}) úspěšně stažena a připravena (ArrayBuffer). Velikost: ${trainedData.byteLength} bytů.`);
        
        
        // !!! KROK 2: INICIALIZACE WORKERU A PŘÍMÉ VLOŽENÍ DAT DO JEHO SOUBOROVÉHO SYSTÉMU !!!
        console.log('3. Inicializace Tesseract Workeru a přímé vložení ArrayBufferu.');
        
        worker = await Tesseract.createWorker('mrz', 1, {
            // Musíme Tesseractu stále říct, kde má hledat Worker a Core, ale data mu dáme ručně
            workerPath: ABSOLUTE_TESSDATA_PATH + 'worker.min.js', 
            corePath: ABSOLUTE_TESSDATA_PATH + 'tesseract-core-simd-lstm.wasm.js', 
            workerBlobURL: false, 
            
            // langPath je ignorován, ale držíme ho pro jistotu
            langPath: ABSOLUTE_TESSDATA_PATH, 
            
            // !!! PŘÍMÁ INJEKCE DAT DO WORKER FS !!!
            // Tímto přinutíme Worker, aby si data načetl z ArrayBufferu pod názvem, který očekává ('mrz.traineddata'),
            // čímž obejdeme jeho chybnou interní logiku stahování.
            data: {
                [TRAINED_DATA_FILE]: trainedData // Vloží ArrayBuffer pod správné jméno souboru
            },
            
            // Už nepoužíváme `preload`, protože stahujeme ručně
            
            logger: m => console.log('TESSERACT LOG:', m) 
        });
        
        console.log('4. Worker a data úspěšně inicializovány. Data vložena ručně.');
        
        // --- Zbytek logiky OCR (beze změn) ---
        
        const naturalW = previewImg.naturalWidth;
        const naturalH = previewImg.naturalHeight;
        
        const rectangle = {
            left: Math.round(naturalW * parseFloat(mrzCoords.x)), 
            top: Math.round(naturalH * parseFloat(mrzCoords.y)),
            width: Math.round(naturalW * parseFloat(mrzCoords.w)),
            height: Math.round(naturalH * parseFloat(mrzCoords.h)),
        };

        console.log('5. Spouštění recognice na pixelových souřadnicích:', rectangle);

        const { data: { text } } = await worker.recognize(previewImg, { rectangle });
        
        console.log('6. Recognice dokončena. Syrový text:', text);

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
            console.log('7. Inputy naplněny. OCR Success.');
        }
        
    } catch (error) {
        let errorMessage = 'Zpracování Tesseractu selhalo.';
        if (error.message.includes('initialization failed') || error.message.includes('Chyba při stahování')) {
             errorMessage = 'KRITICKÁ chyba inicializace. Data nebyla nalezena nebo se je nepodařilo ručně stáhnout (MIME typ/CORS).';
        }
        console.error('OCR CRITICAL ERROR:', errorMessage, error.message, error);
        alert('Kritická chyba při OCR. Zkontrolujte konzoli pro detailní TESSERACT LOG. Pravděpodobně je nutné změnit TRAINED_DATA_FILE na .gz.');
        
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
