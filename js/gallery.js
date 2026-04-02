document.addEventListener('DOMContentLoaded', () => {
    const track = document.getElementById('gallery-track');

    if (!track) return;
    
    // Volitelné: Můžeš zde v budoucnu přidat načítání fotek přes API
    // Prozatím JS jen kontroluje, že se animace resetuje správně
    
    track.addEventListener('mouseenter', () => {
        track.style.animationPlayState = 'paused';
    });

    track.addEventListener('mouseleave', () => {
        track.style.animationPlayState = 'running';
    });

    // 1. Načtení elementů z HTML do pole
    const items = Array.from(track.children);

    // 2. Fisher-Yates Shuffle algoritmus (zamíchání pole)
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }

    // 3. Vyčištění tracku a vložení zamíchaných fotek
    track.innerHTML = '';
    
    // Vložíme zamíchané fotky
    items.forEach(item => track.appendChild(item.cloneNode(true)));
    
    // 4. Duplikace pro nekonečný efekt (přidáme je ještě jednou na konec)
    items.forEach(item => track.appendChild(item.cloneNode(true)));

    // 5. Dynamický výpočet šířky a vzdálenosti pro CSS animaci
    const itemCount = items.length;
    const itemWidth = 420; // 400px + 20px mezera
    track.style.width = `${itemWidth * itemCount * 2}px`;
    track.style.setProperty('--scroll-dist', `-${itemWidth * itemCount}px`);
});