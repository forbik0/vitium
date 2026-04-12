document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('gallery-track');
    const carouselContainer = document.querySelector('.instagram-carousel');
    const nextBtn = document.getElementById('btn-next');
    const prevBtn = document.getElementById('btn-prev');
    
    if (!track) return;

    // 1. Příprava a míchání
    const items = Array.from(track.children);
    const originalItemCount = items.length;

    for (let i = originalItemCount - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    track.innerHTML = '';
    items.forEach(item => track.appendChild(item.cloneNode(true)));
    items.forEach(item => track.appendChild(item.cloneNode(true)));

    // 2. Nastavení
    const itemWidth = 420; 
    const trackWidth = originalItemCount * itemWidth;
    
    let isPaused = false;
    let speed = 0.5; 
    let currentX = 0; 
    let targetX = 0;

    // --- PROMĚNNÉ PRO DOTYK ---
    let isDragging = false;
    let startX = 0;
    let initialTargetX = 0;

    // 3. Animační smyčka
    function animate() {
        if (!isPaused && !isDragging) {
            targetX -= speed; 
        }

        if (targetX <= -trackWidth) {
            targetX += trackWidth;
            currentX += trackWidth; 
        } else if (targetX > 0) {
            targetX -= trackWidth;
            currentX -= trackWidth;
        }

        // Lerp (plynulost) - při tahání prstem (isDragging) zvýšíme citlivost
        const easing = isDragging ? 0.25 : 0.08;
        currentX += (targetX - currentX) * easing;

        track.style.transform = `translateX(${currentX}px)`;
        requestAnimationFrame(animate);
    }

    requestAnimationFrame(animate);

    // 4. EVENTY

    // Pozastavení myší jen pro desktop (zařízení s kurzorem)
    carouselContainer.addEventListener('mouseenter', (e) => {
        if (window.matchMedia("(pointer: fine)").matches) isPaused = true;
    });
    carouselContainer.addEventListener('mouseleave', () => isPaused = false);

    // KLIKNUTÍ NA TLAČÍTKA
    const skipAmount = window.innerWidth * 0.8;
    nextBtn?.addEventListener('click', () => targetX -= skipAmount);
    prevBtn?.addEventListener('click', () => targetX += skipAmount);

    // --- DOTYKOVÉ OVLÁDÁNÍ (SWIPE) ---
    carouselContainer.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].pageX;
        initialTargetX = targetX;
    }, { passive: true });

    carouselContainer.addEventListener('touchmove', (e) => {
        if (!isDragging) return;
        const currentTouchX = e.touches[0].pageX;
        const diff = currentTouchX - startX;
        // Posouváme cíl podle pohybu prstu
        targetX = initialTargetX + diff;
    }, { passive: true });

    carouselContainer.addEventListener('touchend', () => {
        isDragging = false;
        // Po puštění prstu animace plynule naváže tam, kde skončila
    });
});