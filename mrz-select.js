// mrz-select.js

let MRZ = null; // Globální proměnná pro uložení souřadnic
let isSelecting = false;
let startX, startY;
let selectionRect;
let mrzHost;
let previewImg;

document.addEventListener('DOMContentLoaded', () => {
    mrzHost = document.getElementById('mrz-host');
    previewImg = document.getElementById('preview-img');
    
    if (!mrzHost) {
        console.error("Chyba: Element s ID 'mrz-host' nebyl nalezen. Zkontrolujte index.html.");
        return;
    }

    // 1. Vytvoření selekčního rámečku
    selectionRect = document.createElement('div');
    selectionRect.id = 'selection-rect';
    mrzHost.appendChild(selectionRect); 

    // 2. Přidání posluchačů událostí
    mrzHost.addEventListener('mousedown', startSelection);
    mrzHost.addEventListener('mousemove', resizeSelection);
    document.addEventListener('mouseup', endSelection); 
});

// Zjištění souřadnic (relativně k mrzHost)
function getCoords(e) {
    const rect = mrzHost.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Omezení souřadnic na hranice hostitele
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    return { x, y };
}

// 3. Začátek výběru
function startSelection(e) {
    if (e.target !== previewImg && e.target !== mrzHost) return;
    
    isSelecting = true;
    const coords = getCoords(e);
    startX = coords.x;
    startY = coords.y;

    selectionRect.style.left = startX + 'px';
    selectionRect.style.top = startY + 'px';
    selectionRect.style.width = '0';
    selectionRect.style.height = '0';
    selectionRect.style.display = 'block';
    
    e.preventDefault();
}

// 4. Kreslení výběru
function resizeSelection(e) {
    if (!isSelecting) return;

    const coords = getCoords(e);
    const currentX = coords.x;
    const currentY = coords.y;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);
    const left = Math.min(startX, currentX);
    const top = Math.min(startY, currentY);

    selectionRect.style.left = left + 'px';
    selectionRect.style.top = top + 'px';
    selectionRect.style.width = width + 'px';
    selectionRect.style.height = height + 'px';
}

// 5. Ukončení výběru, uložení souřadnic A AUTOMATICKÉ SPUŠTĚNÍ OCR
function endSelection() {
    if (!isSelecting) return;
    isSelecting = false;

    // ... (Výpočet a uložení MRZ souřadnic) ...
    const imageRect = previewImg.getBoundingClientRect();
    const hostRect = mrzHost.getBoundingClientRect();

    const selectionLeft = parseFloat(selectionRect.style.left);
    const selectionTop = parseFloat(selectionRect.style.top);
    const selectionWidth = parseFloat(selectionRect.style.width);
    const selectionHeight = parseFloat(selectionRect.style.height);

    const imgOffsetX = imageRect.left - hostRect.left;
    const imgOffsetY = imageRect.top - hostRect.top;
    const imgDisplayWidth = imageRect.width;
    const imgDisplayHeight = imageRect.height;

    const relativeX = (selectionLeft - imgOffsetX) / imgDisplayWidth;
    const relativeY = (selectionTop - imgOffsetY) / imgDisplayHeight;
    const relativeW = selectionWidth / imgDisplayWidth;
    const relativeH = selectionHeight / imgDisplayHeight;

    // Uložení finálních souřadnic
    MRZ = {
        x: Math.max(0, relativeX).toFixed(4),
        y: Math.max(0, relativeY).toFixed(4),
        w: relativeW.toFixed(4),
        h: relativeH.toFixed(4)
    };
    
    console.log('--- MRZ Zóna vybrána ---');
    console.log('MRZ (normalizované souřadnice):', MRZ);
    console.log('Souřadnice jsou uloženy v globální proměnné MRZ.');

    // --- NOVÁ LOGIKA: AUTOMATICKÉ SPUŠTĚNÍ OCR ---
    if (typeof runOCR === 'function') {
        const isImageReady = (previewImg.src && previewImg.src.startsWith('data:'));
        
        // Kontrolujeme, že máme Data URL a že výběr není nulový
        if (isImageReady && parseFloat(MRZ.w) > 0 && parseFloat(MRZ.h) > 0) { 
            console.log('Detekováno uvolnění myši. Automaticky spouštím OCR pro všechny dostupné sekce.');
            
            // Spustit OCR pro všechny MRZ karty na stránce
            document.querySelectorAll(".card").forEach(card => {
                runOCR(card); 
            });

        } else {
            console.warn('Obrázek není připraven nebo výběr je neplatný. OCR nespouštím.');
        }
    } else {
        console.error('Funkce runOCR není definována. Zkontrolujte, zda je skript OCR-MRZ.js načten.');
    }
}
