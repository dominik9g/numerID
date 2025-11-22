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
 */
async function runOCR(card) {
    const previewImg = document.getElementById('preview-img');
    
    // Zpřísněná kontrola: Tuto chybu by nyní neměl skript mrz-select.js dopustit.
    if (!window.MRZ || !previewImg.src.startsWith('data:')) {
        console.error('OCR-MRZ.js ERROR: runOCR byla zavolána, ale chybí validní Data URL obrázku nebo MRZ zóna.');
        return;
    }

    const btnOcr = card.querySelector(".ocr-btn");
    const mrzLines = parseInt(card.getAttribute('data-mrz-lines') || '3');
    const inputFields = card.querySelectorAll('input[type="text"]');
    
    // Vizuální zpětná vazba
    btnOcr.textContent = 'ČTENÍ...';
    btnOcr.disabled = true;
    
    console.log('--- OCR Start ---');
    console.log('1. Zpracování pro MRZ zónu:', window.MRZ);
    
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
            left: Math.round(naturalW * parseFloat(window.MRZ.x)),
            top: Math.round(naturalH * parseFloat(window.MRZ.y)),
            width: Math.round(naturalW * parseFloat(window.MRZ.w)),
            height: Math.round(naturalH * parseFloat(window.MRZ.h)),
        };

        console.log('4. Spouštění recognice na pixelových souřadnicích:', rectangle);

        const { data: { text } } = await worker.recognize(previewImg, { rectangle });
        
        console.log('5. Recognice dokončena. Syrový text:', text);

        const lines = processOCRText(text);

        for (let i = 0; i < mrzLines; i++) {
            if (inputFields[i]) {
                const maxLengthMatch = inputFields[i].placeholder.match(/\((\d+)/);
                const maxLength = maxLengthMatch ? parseInt(maxLengthMatch[1]) : 44;
                
                inputFields[i].value = (lines[i] || '').substring(0, maxLength);
            }
        }
        
        console.log('6. Inputy naplněny. OCR Success.');

    } catch (error) {
        console.error('OCR CRITICAL ERROR: Zpracování Tesseractu selhalo.', error);
        alert('Chyba při zpracování OCR. Zkuste znovu.');
    } finally {
        if (worker) {
            await worker.terminate();
        }
        btnOcr.textContent = 'OCR';
        btnOcr.disabled = false;
        console.log('--- OCR End ---');
    }
}
