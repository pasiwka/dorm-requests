let allRequests = [];
let currentFilter = 'all';


document.addEventListener('DOMContentLoaded', async () => {
    const userId = localStorage.getItem('userId');

    if (!userId) {
        window.location.href = '../pages/login.html';
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/requests/user/${userId}`,{
            method: 'GET',
            headers: { 'Content-Type': 'application/json' },
        });
        const requests = await response.json();
        allRequests = requests;
        renderRequests();
        setupFilters();
    }catch(err) {
        console.error('Ошибка загрузки:', error);
        showError('Не удалось загрузить заявки');
    }
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
            <span class="request-room"> ${request.building_name}, ${request.room_number}</span>        </div>
        <div class="request-card-header">
            <span class="request-category">${request.category_name}</span>            <span class="request-status ${statusClass}">${statusText}</span>
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


document.querySelector('.button--primary')?.addEventListener('click', () => {
    window.location.href = '../pages/student.html';
});

window.onclick = function(event) {
    const modal = document.getElementById('requestModal');
    if (event.target === modal) {
        closeModal();
    }
};