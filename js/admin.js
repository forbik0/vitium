// const API_PUBLIC_URL = 'https://api.vitium.art';
// const API_ADMIN_URL = 'https://api-admin.vitium.art';

let allReservations = []; // Zde budou uloženy všechny rezervace z API
let eventsData = [];      // Zde budou představení
let lastEventId = null;   // Zapamatovat si poslední zobrazenou akci
let lastEventTitle = null;
let lastEventDate = null;

const btnAddEvent = document.getElementById('btn-add-event');
const btnSyncEvents = document.getElementById('btn-sync-events');
const eventsTableBody = document.getElementById('events-table-body');
const resTableBody = document.getElementById('reservations-table-body');
const syncStatus = document.getElementById('sync-status');
const modal = document.getElementById('event-modal');
const eventForm = document.getElementById('event-form');
const closeModalBtn = document.querySelector('.close-modal');
const ticketSelect = document.getElementById('event-ticket-link');
const customTicketInput = document.getElementById('event-ticket-custom-val');

document.addEventListener('DOMContentLoaded', async () => {
    await fetchEvents();
    await fetchAllReservations(); // Načteme je hned do paměti pro rychlé filtrování
    
    // Refresh button pro rezervace
    const btnRefresh = document.getElementById('btn-refresh-reservations');
    if (btnRefresh) {
        btnRefresh.addEventListener('click', async () => {
            btnRefresh.disabled = true;
            btnRefresh.innerText = 'Obnova...';
            await fetchAllReservations();
            // Znovu zobrazit rezervace pro poslední vybranou akci
            if (lastEventId) {
                showReservationsFor(lastEventId, lastEventTitle, lastEventDate);
            }
            btnRefresh.disabled = false;
            btnRefresh.innerText = 'Obnovit';
        });
    }
    
    // Print button pro rezervace
    const btnPrint = document.getElementById('btn-print-reservations');
    if (btnPrint) {
        btnPrint.addEventListener('click', () => {
            printReservations();
        });
    }
});

ticketSelect.onchange = () => {
    customTicketInput.disabled = (ticketSelect.value !== 'custom');
};

// === DATA FETCHING ===

async function fetchEvents() {
    try {
        const response = await fetch(`${CONFIG.API_PUBLIC_URL}/events`);
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
                total_capacity: e.total_capacity,
                ticket_link: e.ticket_link,
                remaining_count: e.remaining_count,
            };
        });
        renderEvents();
    } catch (error) {
        console.error("Chyba při načítání představení:", error);
    }
}

async function fetchAllReservations() {
    try {
        console.log('Načítám rezervace z API...');
        const response = await fetch(`${CONFIG.API_ADMIN_URL}/reservations`, { credentials: 'include' });
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
            throw new Error('API nevrátilo pole rezervací');
        }
        
        allReservations = data;
        
        // Aktualizovat status
        // const status = syncStatus;
        // if (status) {
        //     if (allReservations.length === 0) {
        //         status.innerHTML = '<span style="color: #666;">Žádné rezervace v systému.</span>';
        //     } else {
        //         status.innerHTML = `<span style="color: #27ae60;">✓ Rezervace načteny (${allReservations.length})</span>`;
        //         setTimeout(() => { status.innerHTML = ''; }, 3000);
        //     }
        // }
        
    } catch (error) {
        console.error("Chyba při načítání rezervací:", error);
        allReservations = [];
        
        // Zobrazit chybu uživateli
        const status = syncStatus;
        if (status) {
            status.innerHTML = `<span style="color: #e74c3c;">Chyba: ${error.message}</span>`;
        }
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
            <td style="text-align:center;">${e.remaining_count} / ${e.total_capacity}</td>
            <td>${e.price} Kč</td>
            <td>
                <button class="btn-small btn-edit" style="background-color: var(--color-primary); color: white;" onclick="showReservationsFor(${e.id}, '${e.title}', '${e.date}')">Zobrazit rezervace</button>
                <button class="btn-small btn-edit" onclick="openModal('edit', ${e.id})">Upravit</button>
                <button class="btn-small btn-delete" onclick="deleteEvent(${e.id})">Smazat</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// === FILTROVÁNÍ REZERVACÍ ===

function showReservationsFor(eventId, eventTitle, eventDate) {
    const section = document.getElementById('reservations-section');
    const tbody = document.getElementById('reservations-table-body');
    const title = document.getElementById('res-detail-title');
    const summary = document.getElementById('res-summary');

    // Zapamatovat si poslední výběr
    lastEventId = eventId;
    lastEventTitle = eventTitle;
    lastEventDate = eventDate;

    // Filtrujeme lokální data
    const filtered = allReservations.filter(r => r.event_id === eventId);
    const totalTickets = filtered.reduce((sum, r) => sum + r.ticket_count, 0);

    title.innerText = `Rezervace pro: ${eventTitle} (${eventDate})`;
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
                <td><strong>${res.customer_name}</strong></td>
                <td><a href="mailto:${res.customer_email}">${res.customer_email}</a></td>
                <td style="text-align:center;">${res.ticket_count}</td>
                <td style="font-size: 0.85rem;">${res.note || '-'}</td>
                <td>${dateStr}</td>
                <td><button class="btn-small btn-delete" onclick="deleteReservation(${res.id}, ${eventId}, '${eventTitle}', '${eventDate}')">Smazat</button></td>
            `;
            tbody.appendChild(tr);
        });
        summary.innerText = `Celkem rezervováno: ${totalTickets} lístků`;
    }

    // Scroll k tabulce rezervací
    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === MAZÁNÍ REZERVACE ===

async function deleteReservation(id, eventId, eventTitle, eventDate) {
    if (!confirm('Opravdu chcete smazat tuto rezervaci?')) return;

    try {
        const response = await fetch(`${CONFIG.API_ADMIN_URL}/delete-reservation`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id }),
            credentials: 'include'
        });
        
        if (response.ok) {
            // Aktualizujeme lokální data a překreslíme
            allReservations = allReservations.filter(r => r.id !== id);
            showReservationsFor(eventId, eventTitle, eventDate);
        }
    } catch (error) {
        alert("Chyba při mazání: " + error.message);
    }
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
            document.getElementById('event-capacity').value = ev.total_capacity || 50;

            if (ev.ticket_link === 'own' || ev.ticket_link === '') {
                ticketSelect.value = ev.ticket_link;
                customTicketInput.disabled = true;
            } else {
                ticketSelect.value = 'custom';
                customTicketInput.value = ev.ticket_link;
                customTicketInput.disabled = false;
            }
        }
    }
}

eventForm.onsubmit = (e) => {
    e.preventDefault();
    
    const idVal = document.getElementById('event-id').value;
    const isNew = idVal === '';
    const newId = isNew ? Date.now() : parseInt(idVal); 
    const ticketLinkValue = ticketSelect.value === 'custom' ? customTicketInput.value : ticketSelect.value;
    
    const eventObj = {
        id: newId,
        title: document.getElementById('event-title').value,
        type: document.getElementById('event-genre').value,
        venue: document.getElementById('event-venue').value,
        date: document.getElementById('event-date').value,
        time: document.getElementById('event-time').value,
        price: parseFloat(document.getElementById('event-price').value),
        total_capacity: parseInt(document.getElementById('event-capacity').value),
        ticket_link: ticketLinkValue,
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
        const response = await fetch(`${CONFIG.API_ADMIN_URL}/sync-events`, {
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

// === TISK A EXPORT REZERVACÍ ===

function printReservations() {
    if (!lastEventId) {
        alert('Nejdříve si vyberte představení!');
        return;
    }

    const event = eventsData.find(e => e.id === lastEventId);
    if (!event) {
        alert('Představení nenalezeno!');
        return;
    }

    const filtered = allReservations.filter(r => r.event_id === lastEventId);
    const capacity = event.total_capacity || 50;
    
    // Vytvořit řádky s rowspan
    const tableRows = [];
    let rowNumber = 1;
    
    // Zpracovat rezervace s rowspan
    filtered.forEach(res => {
        const ticketCount = res.ticket_count;
        
        // První řádek rezervace - s rowspan pro jméno, email, poznámka
        tableRows.push({
            rowNum: rowNumber,
            name: res.customer_name,
            email: res.customer_email,
            note: res.note || '',
            rowspan: ticketCount,
            isFirst: true
        });
        
        // Další řádky stejné rezervace - bez rowspan sloupců
        for (let i = 1; i < ticketCount; i++) {
            tableRows.push({
                rowNum: rowNumber + i,
                isFirst: false
            });
        }
        
        rowNumber += ticketCount;
    });
    
    // Doplnit prázdné řádky až na kapacitu
    while (tableRows.length < capacity) {
        tableRows.push({
            rowNum: rowNumber,
            name: '',
            email: '',
            note: '',
            rowspan: 1,
            isFirst: true
        });
        rowNumber++;
    }

    // Generování HTML bez posledního sloupce
    let html = `
        <table class="print-table">
            <thead>
                <tr>
                    <th class="print-table-col-num">č.</th>
                    <th class="print-table-col-name">Jméno</th>
                    <th class="print-table-col-email">Email</th>
                    <th class="print-table-col-note">Poznámka</th>
                </tr>
            </thead>
            <tbody>
    `;

    tableRows.forEach((row) => {
        html += `<tr>`;
        html += `<td class="print-table-col-num">${row.rowNum}</td>`;
        
        if (row.isFirst) {
            const rowspanAttr = row.rowspan > 1 ? ` rowspan="${row.rowspan}"` : '';
            html += `<td class="print-table-col-name"${rowspanAttr}>${row.name}</td>`;
            html += `<td class="print-table-col-email"${rowspanAttr}>${row.email}</td>`;
            html += `<td class="print-table-col-note"${rowspanAttr}>${row.note}</td>`;
        }
        
        html += `</tr>`;
    });

    html += `
            </tbody>
        </table>
    `;

    // Zobrazit v modalu
    const printContent = document.getElementById('print-content');
    const printModal = document.getElementById('print-modal');
    printContent.innerHTML = html;
    printModal.style.display = 'block';
}