// Načítání a vykreslování představení
async function loadAndRenderPerformances() {
    try {
        const response = await fetch('data/performances.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const performances = await response.json();
        
        const performancesList = document.getElementById('performances-list');
        if (!performancesList) return;
        
        performancesList.innerHTML = performances.map(perf => {
            const date = new Date(perf.date + 'T00:00:00');
            const day = date.getDate();
            const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
            const monthName = months[date.getMonth()];
            
            return `
                <div class="performance-item" data-date="${perf.date}">
                    <div class="performance-date">
                        <span class="date-day">${day}</span>
                        <span class="date-month">${monthName}</span>
                    </div>
                    <div class="performance-details">
                        <h3 class="performance-title">${perf.title}</h3>
                        <p class="performance-venue">${perf.venue}</p>
                        <p class="performance-time">${perf.time}</p>
                    </div>
                    <div class="performance-action">
                        <a href="tickets.html?id=${perf.id}" class="ticket-btn">Vstupenky</a>
                    </div>
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Chyba při načítání představení:', error);
    }
}

// Inicializace při načtení DOM
document.addEventListener('DOMContentLoaded', loadAndRenderPerformances);
