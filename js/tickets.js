// tickets.js

// Načítání dat o představeních
let performances = {};

async function loadPerformances() {
    try {
        // Načtení dat z API
        const response = await fetch('https://api.vitium.art/events');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        // Vyčistíme stará data a naplníme novými z API
        performances = {};
        data.forEach(perf => {
            const dateObj = new Date(perf.scheduled_at);
            
            // Mapujeme data z DB na klíče, které používá zbytek JS
            performances[perf.id] = {
                id: perf.id,
                title: perf.title,
                venue: perf.venue,
                price: perf.price || 0,
                genre: perf.genre || 'Divadlo', 
                date: perf.scheduled_at.split('T')[0],
                time: dateObj.toLocaleTimeString('cs-CZ', { hour: '2-digit', minute: '2-digit' }),
                remaining_count: perf.remaining_count
            };
        });

    } catch (error) {
        console.error('Chyba při načítání dat pro rezervace:', error);
        showFormStatus('Nepodařilo se načíst seznam představení.', 'error');
    }
}

// Funkce pro formátování data (pro zobrazení uživateli)
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
    return `${date.getDate()}. ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function renderTicketsForm() {
    const performanceId = getQueryParam('id');
    const performance = performances[performanceId];

    const container = document.getElementById('tickets-form-container');
    const errorContainer = document.getElementById('error-container');

    if (!performance) {
        if (container) container.innerHTML = '';
        if (errorContainer) {
            errorContainer.innerHTML = `<div class="error-message"><p>Představení nenalezeno.</p></div>`;
        }
        return;
    }

    // 1. Logika pro omezení počtu vstupenek
    const maxTicketsAllowed = 6; // tvůj strop na jednu rezervaci
    const availableCapacity = performance.remaining_count ?? 0;
    const realLimit = Math.min(maxTicketsAllowed, availableCapacity);

    // 2. Generování možností pro select
    let optionsHtml = '<option value="">- Vyberte počet -</option>';
    if (availableCapacity > 0) {
        for (let i = 1; i <= realLimit; i++) {
            const word = i === 1 ? 'vstupenka' : (i < 5 ? 'vstupenky' : 'vstupenek');
            optionsHtml += `<option value="${i}">${i} ${word}</option>`;
        }
    }

    // 3. Status kapacity (barevné odlišení)
    let capacityStatus = '';
    if (availableCapacity <= 0) {
        capacityStatus = '<span class="capacity-tag sold-out">Vyprodáno</span>';
    } else if (availableCapacity < 10) {
        capacityStatus = `<span class="capacity-tag low-capacity">Posledních ${availableCapacity} míst!</span>`;
    } else {
        capacityStatus = `<span class="capacity-tag">Volná místa: ${availableCapacity}</span>`;
    }

    container.innerHTML = `
        <div class="performance-details-box">
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <h2>${performance.title}</h2>
                ${capacityStatus}
            </div>
            <div class="detail-item">
                <div class="detail-label">Datum a čas</div>
                <div class="detail-value">${formatDate(performance.date)} (${performance.time})</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Místo</div>
                <div class="detail-value">${performance.venue}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Žánr</div>
                <div class="detail-value">${performance.genre}</div> </div>
            <div class="detail-item">
                <div class="detail-label">Cena za vstupenku</div>
                <div class="price-highlight">${performance.price} Kč</div>
            </div>
        </div>

        <div class="reservation-form-box">
            <h2>Rezervace vstupenek</h2>
            ${availableCapacity > 0 ? `
                <form id="reservation-form">
                    <div class="form-group">
                        <label for="name">Vaše jméno *</label>
                        <input type="text" id="name" name="name" placeholder="Zadejte své jméno" required>
                    </div>

                    <div class="form-group">
                        <label for="email">Email *</label>
                        <input type="email" id="email" name="email" placeholder="Váš e-mail" required>
                    </div>

                    <div class="form-group">
                        <div class="ticket-quantity">
                            <div>
                                <label for="quantity">Počet vstupenek *</label>
                                <select id="quantity" name="quantity" required>
                                    ${optionsHtml}
                                </select>
                            </div>
                            <div class="quantity-info">
                                <div id="total-price-display">Celkem: 0 Kč</div>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="notes">Poznámka (volitelné)</label>
                        <input type="text" id="notes" name="notes" placeholder="Speciální požadavky...">
                    </div>

                    <div class="cf-turnstile" data-sitekey="0x4AAAAAACzHMOJk9QoTm_Pq"></div>

                    <button type="submit" id="submit-btn" class="submit-btn-tickets">Zaslat rezervaci</button>
                    <div id="form-status" class="form-status"></div>
                </form>
            ` : `
                <div class="sold-out-notice">
                    <p>Omlouváme se, ale toto představení je již plně obsazeno.</p>
                    <a href="index.html#vystoupeni" class="ticket-btn">Zpět na program</a>
                </div>
            `}
        </div>
    `;

    // Event listenery (přepočet ceny a submit)
    if (availableCapacity > 0) {
        document.getElementById('quantity').addEventListener('change', function() {
            const total = performance.price * parseInt(this.value || 0);
            document.getElementById('total-price-display').textContent = `Celkem: ${total} Kč`;
        });
        document.getElementById('reservation-form').addEventListener('submit', handleFormSubmit);
    }
}

async function handleFormSubmit(e) {
    e.preventDefault();
    
    const statusElement = document.getElementById('form-status');
    const submitBtn = document.getElementById('submit-btn');
    
    // 1. Získání Turnstile tokenu
    const turnstileResponse = document.querySelector('[name="cf-turnstile-response"]').value;

    const performanceId = getQueryParam('id');
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const notes = document.getElementById('notes').value.trim();

    // Příprava dat přesně tak, jak je očekává tvůj Worker
    const reservationData = {
        event_id: performanceId,
        name: name,
        email: email,
        count: quantity,
        note: notes,
        template_token: turnstileResponse // Token pro ověření ve Workeru
    };

    // Vizuální zpětná vazba
    submitBtn.disabled = true;
    submitBtn.innerText = 'Odesílám...';
    statusElement.style.display = 'block';

    try {
        const response = await fetch('https://api.vitium.art/reserve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(reservationData)
        });

        const result = await response.json();

        if (response.ok) {
            showFormStatus(`Rezervace úspěšná! ${result.message}`, 'success');
            e.target.reset();
            document.getElementById('total-price-display').textContent = 'Celkem: 0 Kč';
            if (typeof turnstile !== 'undefined') turnstile.reset();
        } else {
            // Pokud Worker vrátí chybu (např. vyprodáno)
            throw new Error(result.error || 'Chyba při odesílání rezervace.');
        }
    } catch (error) {
        showFormStatus(error.message, 'error');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerText = 'Zaslat rezervaci';
    }
}

function showFormStatus(message, type) {
    const statusElement = document.getElementById('form-status');
    statusElement.style.display = 'block';
    statusElement.textContent = message;
    statusElement.className = `form-status ${type}`;
}

// Spuštění
document.addEventListener('DOMContentLoaded', async () => {
    await loadPerformances();
    renderTicketsForm();
});