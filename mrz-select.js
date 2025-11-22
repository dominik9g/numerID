// mrz-select.js - CELÝ SOUBOR

let isSelecting = false;
let startX, startY;
let selectionRect;
let mrzHost;
let previewImg;
// Globální proměnná pro kontejner (bude se hledat i dynamicky pro jistotu)
let cropContainer; 

document.addEventListener('DOMContentLoaded', () => {
    mrzHost = document.getElementById('mrz-host');
    previewImg = document.getElementById('preview-img');
    cropContainer = document.getElementById('mrz-crop-container');
    
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

// 5. Ukončení výběru, vytvoření výřezu 1:1
function endSelection() {
    if (!isSelecting) return;
    isSelecting = false;

    // Bezpečnostní pojistka: Zkusíme element najít znovu, pokud proměnná není nastavená
    if (!cropContainer) {
        cropContainer = document.getElementById('mrz-crop-container');
    }
    
    if (!cropContainer) {
        console.error("CHYBA: Element #mrz-crop-container nebyl v DOMu nalezen!");
        return;
    }

    // Získání rozměrů výběru (v pixelech na obrazovce)
    const selectionWidth = parseFloat(selectionRect.style.width);
    const selectionHeight = parseFloat(selectionRect.style.height);
    const selectionLeft = parseFloat(selectionRect.style.left);
    const selectionTop = parseFloat(selectionRect.style.top);

    // Pokud je výběr příliš malý, ignorujeme
    if (selectionWidth < 5 || selectionHeight < 5) return;

    // --- VÝPOČET PRO VÝŘEZ 1:1 ---
    const imgOffsetLeft = previewImg.offsetLeft;
    const imgOffsetTop = previewImg.offsetTop;

    const relativeX = selectionLeft - imgOffsetLeft;
    const relativeY = selectionTop - imgOffsetTop;

    // Poměr zvětšení/zmenšení (Natural size vs Displayed size)
    const scaleX = previewImg.naturalWidth / previewImg.width;
    const scaleY = previewImg.naturalHeight / previewImg.height;

    // Přepočet na skutečné souřadnice originálního obrázku (1:1)
    const realX = relativeX * scaleX;
    const realY = relativeY * scaleY;
    const realW = selectionWidth * scaleX;
    const realH = selectionHeight * scaleY;

    // Vytvoření Canvasu pro výřez
    const canvas = document.createElement('canvas');
    canvas.width = realW;
    canvas.height = realH;
    const ctx = canvas.getContext('2d');

    // Vykreslení výřezu
    ctx.drawImage(
        previewImg, 
        realX, realY, realW, realH, 
        0, 0, realW, realH          
    );

    // Zobrazení výsledku
    cropContainer.innerHTML = ''; // Vyčistit předchozí
    cropContainer.appendChild(canvas);
    cropContainer.style.display = 'block'; // Zviditelnit kontejner

    console.log('--- Výřez vytvořen a vložen do stránky ---');
    console.log(`Reálně (1:1): ${realX.toFixed(0)}x${realY.toFixed(0)}, Rozměr: ${realW.toFixed(0)}x${realH.toFixed(0)}`);
}