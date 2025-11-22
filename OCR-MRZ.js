// OCR-MRZ.js

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

/**
 * Spustí Tesseract OCR na vybrané zóně a naplní input pole.
 * @param {HTMLElement} card - Element karty.
 * @param {Object} mrzCoords - PŘEDANÉ souřadnice MRZ (x, y, w, h).
 */
async function runOCR(card, mrzCoords) { 
    const previewImg = document.getElementById('preview-img');
    
    if (!mrzCoords) { 
        console.error('OCR-MRZ.js ERROR: runOCR byla zavolána, ale chybí PŘEDANÉ MRZ souřadnice.');
        return;
    }

    const btnOcr = card.querySelector(".ocr-btn");
    // Zjistíme, kolik řádků má karta očekávat (2 nebo 3)
    const expectedLines = parseInt(card.getAttribute('data-mrz-lines') || '3'); 
    const inputFields = card.querySelectorAll('input[type="text"]');
    
    // Vizuální zpětná vazba
    btnOcr.textContent = 'ČTENÍ...';
    btnOcr.disabled = true;
    
    console.log('--- OCR Start ---');
    console.log(`1. Zpracování pro MRZ zónu (předané): ${expectedLines} řádků`, mrzCoords);
    
    let worker = null; 

    try {
        const cdnPath = 'https://cdn.jsdelivr.net/gh/dominik9g/numerID/';

        console.log(`2. Inicializace Tesseract Workeru s mrz.traineddata.gz z CDN: ${cdnPath}`);
        
        worker = await Tesseract.createWorker('mrz', 1, {
            langPath: cdnPath,
        });
        
        console.log('3. Worker úspěšně inicializován.');
        
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
        console.error('OCR CRITICAL ERROR: Zpracování Tesseractu selhalo.', error);
        alert('Chyba při zpracování OCR. Zkuste znovu.');
    } finally {
        if (worker) {
            await worker.terminate();
        }
        // Zajištění reaktivace tlačítka v případě chyby/dokončení, ale pouze pro text, ne pro disabled stav
        // Tlačítko se resetuje při nahrání nové fotky v img-upload.js
        btnOcr.textContent = 'OCR';
        console.log('--- OCR End ---');
    }
}
