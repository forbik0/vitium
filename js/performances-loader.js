// performances-loader.js

// Global filter function
function applyPerformanceFilter(filterValue = 'future') {
    const performanceItems = document.querySelectorAll('.performance-item');
    const performancesList = document.getElementById('performances-list');
    
    // Get today's date at midnight
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayString = today.getFullYear() + '-' + 
                        String(today.getMonth() + 1).padStart(2, '0') + '-' + 
                        String(today.getDate()).padStart(2, '0');

    let visibleCount = 0;

    performanceItems.forEach(item => {
        const dateAttr = item.getAttribute('data-date');
        const performanceDate = dateAttr; // Format: YYYY-MM-DD
        
        let shouldShow = false;
        
        if (filterValue === 'future') {
            // Show performances where date >= today
            shouldShow = performanceDate >= todayString;
            // Show ticket button for future performances
            item.classList.remove('hide-action');
        } else if (filterValue === 'past') {
            // Show performances where date < today
            shouldShow = performanceDate < todayString;
            // Hide ticket button for past performances
            item.classList.add('hide-action');
        }
        
        if (shouldShow) {
            item.style.display = 'grid';
            item.style.animation = 'fadeInUp 0.3s ease-out';
            visibleCount++;
        } else {
            item.style.display = 'none';
        }
    });

    // Show or hide "no performances" message
    let noPerformancesMsg = document.getElementById('no-performances-message');
    if (visibleCount === 0) {
        if (!noPerformancesMsg) {
            noPerformancesMsg = document.createElement('p');
            noPerformancesMsg.id = 'no-performances-message';
            noPerformancesMsg.textContent = 'Nejsou naplánována žádná vystoupení.';
            noPerformancesMsg.style.textAlign = 'center';
            noPerformancesMsg.style.padding = '2rem';
            noPerformancesMsg.style.color = '#666';
            performancesList.appendChild(noPerformancesMsg);
        }
    } else {
        if (noPerformancesMsg) {
            noPerformancesMsg.remove();
        }
    }
}

async function loadAndRenderPerformances() {
    try {
        const response = await fetch(`${CONFIG.API_PUBLIC_URL}/events`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const performances = await response.json();
        
        const performancesList = document.getElementById('performances-list');
        if (!performancesList) return;

        if(performances.length === 0) {
            performancesList.innerHTML = '<p>Momentálně nemáme naplánovaná žádná představení.</p>';
            return;
        }
        
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
        
        // Apply filter after rendering performances
        applyPerformanceFilter('future');
        
    } catch (error) {
        console.error('Chyba při načítání představení z API:', error);
        const performancesList = document.getElementById('performances-list');
        if (performancesList) {
            performancesList.innerHTML = '<p>Momentálně nemáme naplánovaná žádná představení.</p>';
        }
    }
}

document.addEventListener('DOMContentLoaded', loadAndRenderPerformances);