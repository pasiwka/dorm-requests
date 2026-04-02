let allRequests = [];
let currentFilter = 'all';

const demoRequests = [
    {
        id: 1,
        who_needed: 'Сантехник',
        description: 'Течёт кран на кухне, вода капает постоянно, нужно заменить прокладку',
        status: 'pending',
        room_number: '101',
        building: 'Силикаты',
        created_at: '2026-04-02 10:30:00'
    },
    {
        id: 2,
        who_needed: 'Электрик',
        description: 'Не работает розетка на кухне, выбивает пробки',
        status: 'approved',
        room_number: '102',
        building: 'Силикаты',
        created_at: '2026-04-02 09:15:00'
    },
    {
        id: 3,
        who_needed: 'Сантехник',
        description: 'Засор в раковине в ванной, вода не уходит',
        status: 'rejected',
        room_number: '103',
        building: 'Крест',
        created_at: '2026-04-01 16:45:00'
    },
    {
        id: 4,
        who_needed: 'Мебель',
        description: 'Сломалась спинка кровати, нужно починить',
        status: 'pending',
        room_number: '104',
        building: 'Силикаты',
        created_at: '2026-04-01 14:20:00'
    },
    {
        id: 5,
        who_needed: 'Электрик',
        description: 'Лампочка перегорела в коридоре',
        status: 'approved',
        room_number: '105',
        building: 'Крест',
        created_at: '2026-03-31 11:00:00'
    },
    {
        id: 6,
        who_needed: 'Сантехник',
        description: 'Сломалась кнопка слива на унитазе',
        status: 'rejected',
        room_number: '106',
        building: 'Силикаты',
        created_at: '2026-03-30 08:30:00'
    },
    {
        id: 7,
        who_needed: 'Мебель',
        description: 'Шкаф разваливается, дверца отпала',
        status: 'pending',
        room_number: '107',
        building: 'Крест',
        created_at: '2026-04-02 12:00:00'
    },
    {
        id: 8,
        who_needed: 'Электрик',
        description: 'Нет света в ванной комнате',
        status: 'approved',
        room_number: '108',
        building: 'Силикаты',
        created_at: '2026-04-01 09:30:00'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    allRequests = [...demoRequests];
    renderRequests();
    setupFilters();
});

function setupFilters() {
    const filterItems = document.querySelectorAll('.filter-list li');

    filterItems.forEach(item => {
        item.addEventListener('click', () => {
            filterItems.forEach(li => li.classList.remove('active'));
            item.classList.add('active');
            const filterText = item.innerText.trim();
            if (filterText === 'Все') {
                currentFilter = 'all';
            } else if (filterText === 'В ожидании') {
                currentFilter = 'pending';
            } else if (filterText === 'Принято') {
                currentFilter = 'approved';
            } else if (filterText === 'Отклонено') {
                currentFilter = 'rejected';
            }
            renderRequests();
        });
    });
}

function renderRequests() {
    const container = document.getElementById('requestsList');
    if (!container) return;

    container.innerHTML = '';

    let filteredRequests = allRequests;
    if (currentFilter !== 'all') {
        filteredRequests = allRequests.filter(r => r.status === currentFilter);
    }

    if (filteredRequests.length === 0) {
        container.innerHTML = `
            <div class="empty-filter-state">
                <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#ccc" stroke-width="1">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p>Нет заявок с таким статусом</p>
            </div>
        `;
        return;
    }

    filteredRequests.forEach(request => {
        const requestCard = createRequestCard(request);
        container.appendChild(requestCard);
    });
}

function createRequestCard(request) {
    const card = document.createElement('div');
    card.className = `request-card ${request.status}`;
    card.onclick = () => showRequestDetails(request);

    const statusText = getStatusText(request.status);
    const statusClass = getStatusClass(request.status);
    const formattedDate = formatDate(request.created_at);

    card.innerHTML = `
        <div class="request-card-footer">
            <span class="request-date"> ${formattedDate}</span>
            <span class="request-room"> ${request.building}, ${request.room_number}</span>
        </div>
        <div class="request-card-header">
            <span class="request-category">${request.who_needed}</span>
            <span class="request-status ${statusClass}">${statusText}</span>
        </div>
        <div class="request-card-description">${truncateText(request.description, 80)}</div>
  
    `;

    return card;
}

function getStatusText(status) {
    const map = {
        'pending': 'В ожидании',
        'approved': 'Принята',
        'rejected': 'Отклонена'
    };
    return map[status] || status;
}

function getStatusClass(status) {
    const map = {
        'pending': 'status-pending',
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return map[status] || 'status-pending';
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return `Сегодня, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}, `;
    } else if (days === 1) {
        return 'Вчера, ';
    } else if (days < 7) {
        return `${days} дня(ей) назад, `;
    } else {
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function showRequestDetails(request) {
    const modalBody = document.getElementById('modalBody');
    if (!modalBody) return;


    document.getElementById('requestModal').style.display = 'flex';
}

function closeModal() {
    document.getElementById('requestModal').style.display = 'none';
}


document.querySelector('.auth-btn')?.addEventListener('click', () => {
    window.location.href = '../pages/student.html';
});

window.onclick = function(event) {
    const modal = document.getElementById('requestModal');
    if (event.target === modal) {
        closeModal();
    }
};