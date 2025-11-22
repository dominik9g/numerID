// Globální proměnná pro uložení výsledných MRZ souřadnic
let MRZ = null;

let isSelecting = false;
let startX, startY;
let selectionRect;
let mrzHost;
let previewImg;

document.addEventListener('DOMContentLoaded', () => {
    mrzHost = document.getElementById('mrz-host');
    previewImg = document.getElementById('preview-img');
    
    // 1. Vytvoření selekčního rámečku
    selectionRect = document.createElement('div');
    selectionRect.id = 'selection-rect';
    mrzHost.appendChild(selectionRect); 

    // 2. Přidání posluchačů událostí
    mrzHost.addEventListener('mousedown', startSelection);
    mrzHost.addEventListener('mousemove', resizeSelection);
    document.addEventListener('mouseup', endSelection); // Na document pro bezpečné ukončení, i když myš opustí panel
});

// Zjištění souřadnic (relativně k mrzHost)
function getCoords(e) {
    const rect = mrzHost.getBoundingClientRect();
    let x = e.clientX - rect.left;
    let y = e.clientY - rect.top;
    
    // Omezení souřadnic na hranice hostitele (zajišťuje, že se rámeček nedá táhnout mimo)
    x = Math.max(0, Math.min(x, rect.width));
    y = Math.max(0, Math.min(y, rect.height));

    return { x, y };
}

// 3. Začátek výběru
function startSelection(e) {
    // Kontrola, zda se kliklo přímo na obrázek (nebo do prázdna)
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

// 5. Ukončení výběru a uložení souřadnic
function endSelection() {
    if (!isSelecting) return;
    isSelecting = false;

    // Musíme získat souřadnice ZOBRAZENÉHO obrázku, protože rámeček je relativní k hostiteli (mrzHost).
    const imageRect = previewImg.getBoundingClientRect();
    const hostRect = mrzHost.getBoundingClientRect();

    const selectionLeft = parseFloat(selectionRect.style.left);
    const selectionTop = parseFloat(selectionRect.style.top);
    const selectionWidth = parseFloat(selectionRect.style.width);
    const selectionHeight = parseFloat(selectionRect.style.height);

    // Výpočet offsetu obrázku uvnitř hostitele (kvůli object-fit: contain)
    const imgOffsetX = imageRect.left - hostRect.left;
    const imgOffsetY = imageRect.top - hostRect.top;
    const imgDisplayWidth = imageRect.width;
    const imgDisplayHeight = imageRect.height;
    
    // Normalizace souřadnic (0 až 1) vzhledem k ZOBRAZENÉ velikosti obrázku
    const relativeX = (selectionLeft - imgOffsetX) / imgDisplayWidth;
    const relativeY = (selectionTop - imgOffsetY) / imgDisplayHeight;
    const relativeW = selectionWidth / imgDisplayWidth;
    const relativeH = selectionHeight / imgDisplayHeight;

    // Uložení výsledných souřadnic do globální proměnné MRZ
    MRZ = {
        x: Math.max(0, relativeX).toFixed(4), // Oříznutí záporných hodnot na 0
        y: Math.max(0, relativeY).toFixed(4),
        w: relativeW.toFixed(4),
        h: relativeH.toFixed(4)
    };
    
    // Zobrazíme pro kontrolu, kde se nachází MRZ zóna (v konzoli)
    console.log('--- MRZ Zóna vybrána ---');
    console.log('MRZ (normalizované souřadnice):', MRZ);
    console.log('Souřadnice jsou uloženy v globální proměnné MRZ.');
}