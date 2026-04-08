const API_PUBLIC_URL = 'https://api.vitium.art';
const API_ADMIN_URL = 'https://api-admin.vitium.art';

let allReservations = []; // Zde budou uloženy všechny rezervace z API
let eventsData = [];      // Zde budou představení

const btnAddEvent = document.getElementById('btn-add-event');
const btnSyncEvents = document.getElementById('btn-sync-events');
const eventsTableBody = document.getElementById('events-table-body');
const resTableBody = document.getElementById('reservations-table-body');
const syncStatus = document.getElementById('sync-status');
const modal = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');

document.addEventListener('DOMContentLoaded', async () => {
    await fetchEvents();
    await fetchAllReservations(); // Načteme je hned do paměti pro rychlé filtrování
});

// === DATA FETCHING ===

async function fetchEvents() {
    try {
        const response = await fetch(`${API_PUBLIC_URL}/events`);
        const dbEvents = await response.json();
        
        eventsData = dbEvents.map(e => {
            const [datePart, timePart] = e.scheduled_at.split('T');
            return {
                id: e.id,
                title: e.title,
                type: e.genre,
                venue: e.venue,
                date: datePart,
                time: timePart ? timePart.substring(0, 5) : '19:00',
                price: e.price,
                ticket_link: e.ticket_link
            };
        });
        renderEvents();
    } catch (error) {
        console.error("Chyba při načítání představení:", error);
    }
}

async function fetchAllReservations() {
    try {
        const response = await fetch(`${API_ADMIN_URL}/reservations`, { credentials: 'include' });
        if (response.ok) {
            allReservations = await response.json();
        }
    } catch (error) {
        console.error("Nelze načíst rezervace:", error);
    }
}

// === RENDERING PŘEDSTAVENÍ ===

function renderEvents() {
    const tbody = document.getElementById('events-table-body');
    tbody.innerHTML = '';

    eventsData.forEach(e => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${e.date} <strong>${e.time}</strong></td>
            <td><strong>${e.title}</strong><br><small>${e.type}</small></td>
            <td>${e.venue}</td>
            <td>${e.price} Kč</td>
            <td>
                <button class="btn-small btn-edit" style="background-color: var(--color-primary); color: white;" onclick="showReservationsFor(${e.id}, '${e.title}')">Zobrazit rezervace</button>
                <button class="btn-small btn-edit" onclick="openModal('edit', ${e.id})">Upravit</button>
                <button class="btn-small btn-delete" onclick="deleteEvent(${e.id})">Smazat</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// === FILTROVÁNÍ REZERVACÍ ===

function showReservationsFor(eventId, eventTitle) {
    const section = document.getElementById('reservations-section');
    const tbody = document.getElementById('reservations-table-body');
    const title = document.getElementById('res-detail-title');
    const summary = document.getElementById('res-summary');

    // Filtrujeme lokální data
    const filtered = allReservations.filter(r => r.event_id === eventId);
    const totalTickets = filtered.reduce((sum, r) => sum + r.count, 0);

    title.innerText = `Rezervace pro: ${eventTitle}`;
    section.style.display = 'block';
    tbody.innerHTML = '';

    if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;">Žádné rezervace pro toto představení.</td></tr>';
        summary.innerText = '';
    } else {
        filtered.forEach(res => {
            const dateStr = new Date(res.created_at).toLocaleString('cs-CZ');
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td><strong>${res.name}</strong></td>
                <td><a href="mailto:${res.email}">${res.email}</a></td>
                <td style="text-align:center;">${res.count}</td>
                <td style="font-size: 0.85rem;">${res.note || '-'}</td>
                <td>${dateStr}</td>
                <td><button class="btn-small btn-delete" onclick="deleteReservation(${res.id}, ${eventId}, '${eventTitle}')">Smazat</button></td>
            `;
            tbody.appendChild(tr);
        });
        summary.innerText = `Celkem rezervováno: ${totalTickets} lístků`;
    }

    // Scroll k tabulce rezervací
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === MAZÁNÍ REZERVACE ===

async function deleteReservation(id, eventId, eventTitle) {
    if (!confirm('Opravdu chcete smazat tuto rezervaci?')) return;

    try {
        const response = await fetch(`${API_ADMIN_URL}/delete-reservation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
            credentials: 'include'
        });
        
        if (response.ok) {
            // Aktualizujeme lokální data a překreslíme
            allReservations = allReservations.filter(r => r.id !== id);
            showReservationsFor(eventId, eventTitle);
        }
    } catch (error) {
        alert("Chyba při mazání: " + error.message);
    }
}

// === PŘEDSTAVENÍ (Přes veřejné API) ===
async function fetchEvents() {
    try {
        // Tady používáme veřejné API, protože seznam lístků nepotřebuje admin práva pro čtení
        const response = await fetch(`${API_PUBLIC_URL}/events`);
        if (!response.ok) throw new Error('Nelze načíst představení');
        const dbEvents = await response.json();
        
        eventsData = dbEvents.map(e => {
            const [datePart, timePart] = e.scheduled_at.split('T');
            return {
                id: e.id,
                title: e.title,
                type: e.genre,
                venue: e.venue,
                date: datePart,
                time: timePart ? timePart.substring(0, 5) : '19:00',
                price: e.price,
                ticket_link: e.ticket_link
            };
        });
        
        renderEvents();
    } catch (error) {
        eventsTableBody.innerHTML = `<tr><td colspan="8" style="color:red; text-align:center;">Chyba: ${error.message}</td></tr>`;
    }
}

function renderEvents() {
    eventsTableBody.innerHTML = '';
    if (eventsData.length === 0) {
        eventsTableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Žádná představení. Přidejte nové.</td></tr>';
        return;
    }

    eventsData.forEach(e => {
        const tr = document.createElement('tr');
        if(e.isNew) tr.style.backgroundColor = 'rgba(238, 184, 78, 0.1)'; 

        tr.innerHTML = `
            <td>${e.id}</td>
            <td><strong>${e.title}</strong></td>
            <td>${e.type}</td>
            <td>${e.venue}</td>
            <td>${e.date} ${e.time}</td>
            <td>${e.price} Kč</td>
            <td>${e.ticket_link === 'own' ? 'Vlastní form' : (e.ticket_link || 'Skryto')}</td>
            <td>
                <button class="btn-small btn-edit" onclick="openModal('edit', ${e.id})">Upravit</button>
                <button class="btn-small btn-delete" onclick="deleteEvent(${e.id})">Smazat</button>
            </td>
        `;
        eventsTableBody.appendChild(tr);
    });
}

// === MODÁLNÍ OKNO A LOKÁLNÍ EDITACE ===
btnAddEvent.onclick = () => openModal('add');
closeModalBtn.onclick = () => modal.style.display = 'none';
window.onclick = (e) => { if (e.target == modal) modal.style.display = 'none'; }

function openModal(mode, eventId = null) {
    modal.style.display = 'block';
    const formTitle = document.getElementById('modal-title');
    
    if (mode === 'add') {
        formTitle.textContent = 'Přidat nové představení';
        eventForm.reset();
        document.getElementById('event-id').value = '';
    } else {
        formTitle.textContent = 'Upravit představení';
        const ev = eventsData.find(e => e.id == eventId);
        if (ev) {
            document.getElementById('event-id').value = ev.id;
            document.getElementById('event-title').value = ev.title;
            document.getElementById('event-genre').value = ev.type;
            document.getElementById('event-venue').value = ev.venue;
            document.getElementById('event-date').value = ev.date;
            document.getElementById('event-time').value = ev.time;
            document.getElementById('event-price').value = ev.price;
            document.getElementById('event-ticket-link').value = ev.ticket_link || '';
        }
    }
}

eventForm.onsubmit = (e) => {
    e.preventDefault();
    
    const idVal = document.getElementById('event-id').value;
    const isNew = idVal === '';
    const newId = isNew ? Date.now() : parseInt(idVal); 
    
    const eventObj = {
        id: newId,
        title: document.getElementById('event-title').value,
        type: document.getElementById('event-genre').value,
        venue: document.getElementById('event-venue').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        price: parseFloat(document.getElementById('event-price').value),
        ticket_link: document.getElementById('event-ticket-link').value,
        isNew: isNew
    };

    if (isNew) {
        eventsData.push(eventObj);
    } else {
        const index = eventsData.findIndex(e => e.id == newId);
        if (index > -1) eventsData[index] = eventObj;
    }

    renderEvents();
    modal.style.display = 'none';
    syncStatus.innerHTML = '<span style="color: #e74c3c;">Máte neuložené změny! Nezapomeňte kliknout na "Uložit změny".</span>';
};

function deleteEvent(id) {
    if (!confirm('Opravdu chcete toto představení odebrat z tabulky? Změna se projeví na webu až po uložení.')) return;
    eventsData = eventsData.filter(e => e.id != id);
    renderEvents();
    syncStatus.innerHTML = '<span style="color: #e74c3c;">Máte neuložené změny! Nezapomeňte kliknout na "Uložit změny".</span>';
}

// === SYNCHRONIZACE NA CLOUDFLARE WORKER (Přes chráněné ADMIN API) ===
btnSyncEvents.onclick = async () => {
    btnSyncEvents.disabled = true;
    btnSyncEvents.innerText = 'Ukládám...';
    syncStatus.innerHTML = '';

    try {
        const response = await fetch(`${API_ADMIN_URL}/sync-events`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(eventsData),
            credentials: 'include' // Změň na 'include' pro CF Access cookies
        });

        if (!response.ok) {
            throw new Error('Přístup odepřen nebo chyba serveru. Jste přihlášeni?');
        }

        const result = await response.json();

        if (result.success) {
            syncStatus.innerHTML = `<span style="color: green;">Změny byly úspěšně uloženy a nahrány na server! (Synchronizováno: ${result.synced}, Smazáno: ${result.deleted})</span>`;
            await fetchEvents();
        } else {
            throw new Error(result.error || 'Neznámá chyba při synchronizaci.');
        }
    } catch (error) {
        syncStatus.innerHTML = `<span style="color: red;">Chyba při ukládání: ${error.message}</span>`;
    } finally {
        btnSyncEvents.disabled = false;
        btnSyncEvents.innerText = 'Uložit změny (Sync na server)';
    }
};