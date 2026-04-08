// performances-loader.js

async function loadAndRenderPerformances() {
    try {
        const response = await fetch('https://api.vitium.art/events');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const performances = await response.json();
        
        const performancesList = document.getElementById('performances-list');
        if (!performancesList) return;
        
        performancesList.innerHTML = performances.map(perf => {
            // Datum chodí z API ve formátu "2026-06-08T19:00"
            const fullDate = new Date(perf.scheduled_at);
            
            // Získání dne a měsíce pro kalendářovou ikonku
            const day = fullDate.getDate();
            const months = ['Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen', 'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'];
            const monthName = months[fullDate.getMonth()];
            
            // Formát času (HH:MM)
            const time = fullDate.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' });
            
            // Vytažení čistého data (YYYY-MM-DD) pro atribut data-date (důležité pro případné filtrování)
            const dateOnly = perf.scheduled_at.split('T')[0];

            var ticketHtml = "";
            // Kontrola kapacity a odkazu na vstupenky
            if (perf.ticket_link && perf.remaining_count > 0) {
                var ticketLink = perf.ticket_link === 'own' ? `tickets.html?id=${perf.id}` : perf.ticket_link;
                ticketHtml = `
                    <div class="performance-action">
                        <a href="${ticketLink}" class="ticket-btn">Vstupenky</a>
                    </div>
                `;
            } else if (perf.remaining_count <= 0) {
                ticketHtml = `<div class="performance-action"><span class="sold-out">Vyprodáno</span></div>`;
            }

            return `
                <div class="performance-item" data-date="${dateOnly}">
                    <div class="performance-date">
                        <span class="date-day">${day}</span>
                        <span class="date-month">${monthName}</span>
                    </div>
                    <div class="performance-details">
                        <h3 class="performance-title">${perf.title}</h3>
                        <p class="performance-genre" style="font-size: 0.9em; color: #666; margin-bottom: 4px;">${perf.genre}</p>
                        <p class="performance-venue">${perf.venue}</p>
                        <p class="performance-time">${time}</p>
                    </div>
                    ${ticketHtml}
                </div>
            `;
        }).join('');
        
    } catch (error) {
        console.error('Chyba při načítání představení z API:', error);
        const performancesList = document.getElementById('performances-list');
        if (performancesList) {
            performancesList.innerHTML = '<p>Momentálně nemáme naplánovaná žádná představení.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadAndRenderPerformances);