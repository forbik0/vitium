// Načítání dat o představeních
let performances = {};

async function loadPerformances() {
    try {
        const response = await fetch('data/performances.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        // Konverze pole na objekt s ID jako klíč
        data.forEach(perf => {
            performances[perf.id] = perf;
        });
    } catch (error) {
        console.error('Chyba při načítání představení:', error);
    }
}

// Funkce pro formátování data
function formatDate(dateString) {
    const date = new Date(dateString + 'T00:00:00');
    const months = ['ledna', 'února', 'března', 'dubna', 'května', 'června', 'července', 'srpna', 'září', 'října', 'listopadu', 'prosince'];
    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    return `${day}. ${month} ${year}`;
}

// Načtení query parametrů
function getQueryParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

// Vykreslení formuláře pro rezervaci
function renderTicketsForm() {
    const performanceId = getQueryParam('id') || getQueryParam('date');
    const performance = performances[performanceId];

    const container = document.getElementById('tickets-form-container');
    const errorContainer = document.getElementById('error-container');

    if (!performance) {
        container.innerHTML = '';
        errorContainer.innerHTML = `
            <div class="error-message">
                <p><strong>Chyba:</strong> Představení nenalezeno. Prosím, <a href="index.html#vystoupeni">vyberte představení ze seznamu</a>.</p>
            </div>
        `;
        return;
    }

    const formattedDate = formatDate(performance.date);
    const totalPrice = performance.price; // cena za vstupenku

    container.innerHTML = `
        <div class="performance-details-box">
            <h2>${performance.title}</h2>
            <div class="detail-item">
                <div class="detail-label">Datum a čas</div>
                <div class="detail-value">${formattedDate} (${performance.time})</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Místo</div>
                <div class="detail-value">${performance.venue}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Žánr</div>
                <div class="detail-value">${performance.type}</div>
            </div>
            <div class="detail-item">
                <div class="detail-label">Cena za vstupenku</div>
                <div class="price-highlight">${performance.price} Kč</div>
            </div>
        </div>

        <div class="reservation-form-box">
            <h2>Rezervace vstupenek</h2>
            <form id="reservation-form">
                <div class="form-group">
                    <label for="name">Vaše jméno *</label>
                    <input type="text" id="name" name="name" placeholder="Zadejte své jméno" minlength="2" maxlength="100" required>
                </div>

                <div class="form-group">
                    <label for="email">Email *</label>
                    <input type="email" id="email" name="email" placeholder="Váš e-mail" maxlength="255" required>
                </div>

                <div class="form-group">
                    <div class="ticket-quantity">
                        <div>
                            <label for="quantity">Počet vstupenek *</label>
                            <select id="quantity" name="quantity" required>
                                <option value="">- Vyberte počet -</option>
                                <option value="1">1 vstupenka</option>
                                <option value="2">2 vstupenky</option>
                                <option value="3">3 vstupenky</option>
                                <option value="4">4 vstupenky</option>
                                <option value="5">5 vstupenek</option>
                                <option value="6">6 vstupenek</option>
                            </select>
                        </div>
                        <div class="quantity-info">
                            <div id="total-price-display">Celkem: 0 Kč</div>
                        </div>
                    </div>
                </div>

                <div class="form-group">
                    <label for="notes">Poznámka (volitelné)</label>
                    <input type="text" id="notes" name="notes" placeholder="Speciální požadavky, sdělení...">
                </div>

                <button type="submit" class="submit-btn-tickets">Zaslat rezervaci</button>
                <div id="form-status" class="form-status"></div>
            </form>
        </div>
    `;

    // Event listener pro dynamické počítání ceny
    const quantitySelect = document.getElementById('quantity');
    const totalPriceDisplay = document.getElementById('total-price-display');

    if (quantitySelect) {
        quantitySelect.addEventListener('change', function() {
            if (this.value) {
                const total = performance.price * parseInt(this.value);
                totalPriceDisplay.textContent = `Celkem: ${total} Kč`;
            } else {
                totalPriceDisplay.textContent = 'Celkem: 0 Kč';
            }
        });
    }

    // Event listener pro odeslání formuláře
    const form = document.getElementById('reservation-form');
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
}

// Obsluha formuláře
async function handleFormSubmit(e) {
    e.preventDefault();

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const quantity = parseInt(document.getElementById('quantity').value);
    const notes = document.getElementById('notes').value.trim();
    const performanceId = getQueryParam('id') || getQueryParam('date');
    const performance = performances[performanceId];

    // Validace
    if (!name || !email || !quantity) {
        showFormStatus('Prosím, vyplňte všechna povinná pole.', 'error');
        return;
    }

    if (quantity < 1 || quantity > 6) {
        showFormStatus('Počet vstupenek musí být mezi 1 a 6.', 'error');
        return;
    }

    // Příprava dat pro API
    const reservationData = {
        performance_id: performanceId,
        performance_title: performance.title,
        performance_date: performance.date,
        performance_time: performance.time,
        venue: performance.venue,
        name: name,
        email: email,
        quantity: quantity,
        total_price: performance.price * quantity,
        notes: notes || null,
        created_at: new Date().toISOString()
    };

    console.log('Odesílání rezervace:', reservationData);

    // TODO: Zaslání na API
    // Zatím jen simulujeme úspěšnou odpověď
    showFormStatus('Vaše rezervace byla úspěšně zaslána! Brzy se vám ozveme.', 'success');
    document.getElementById('reservation-form').reset();
    document.getElementById('total-price-display').textContent = 'Celkem: 0 Kč';

    // Pozdější implementace API volání:
    // try {
    //     const response = await fetch('/api/reservations', {
    //         method: 'POST',
    //         headers: {
    //             'Content-Type': 'application/json',
    //         },
    //         body: JSON.stringify(reservationData)
    //     });
    //
    //     if (!response.ok) {
    //         throw new Error(`Chyba serveru: ${response.status}`);
    //     }
    //
    //     const result = await response.json();
    //     showFormStatus('Vaše rezervace byla úspěšně zaslána! Brzy se vám ozveme.', 'success');
    //     document.getElementById('reservation-form').reset();
    //     document.getElementById('total-price-display').textContent = 'Celkem: 0 Kč';
    // } catch (error) {
    //     console.error('Chyba při odesílání formuláře:', error);
    //     showFormStatus('Došlo k chybě. Prosím, zkuste to později nebo nás kontaktujte.', 'error');
    // }
}

// Zobrazení zprávy o stavu formuláře
function showFormStatus(message, type) {
    const statusElement = document.getElementById('form-status');
    statusElement.textContent = message;
    statusElement.className = `form-status ${type}`;

    // Automaticky skrýt zprávu o chybě po 5 sekundách
    if (type === 'error') {
        setTimeout(() => {
            statusElement.style.display = 'none';
        }, 5000);
    }
}

// Inicializace
document.addEventListener('DOMContentLoaded', async () => {
    await loadPerformances();
    renderTicketsForm();
});
