// frontend/js/scriptAdmin.js

let allRequests = [];  // глобальная переменная для хранения всех заявок
let currentStatusFilter = 'all';  // текущий фильтр по статусу
let currentBuildingFilter = 'all';  // текущий фильтр по корпусу

function formatDate(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) {
        return `Сегодня, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (days === 1) {
        return 'Вчера';
    } else if (days < 7) {
        return `${days} дня(ей) назад`;
    } else {
        return `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}.${date.getFullYear()}`;
    }
}

function getStatusClass(status) {
    const map = {
        'pending': 'status-new',
        'approved': 'status-approved',
        'rejected': 'status-rejected',
        'done': 'status-done',
    };
    return map[status] || 'status-new';
}

function getStatusText(status) {
    const map = {
        'pending': 'В ожидании',
        'approved': 'Принята',
        'rejected': 'Отклонена',
        'done': 'Выполнена'
    };
    return map[status] || status;
}

function showError(message) {
    let errorDiv = document.getElementById('adminError');

    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'adminError';
        errorDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #ef4444;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
        `;
        document.body.appendChild(errorDiv);
    }

    errorDiv.textContent = message;
    errorDiv.style.display = 'block';

    setTimeout(() => {
        errorDiv.style.display = 'none';
    }, 3000);
}

function renderRequests(requests, tbody) {
    tbody.innerHTML = '';

    if (requests.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7">По вашему запросу ничего не найдено</td></tr>';
        return;
    }

    requests.forEach(request => {
        const row = document.createElement('tr');
        row.className = 'requests-table__head';

        const studentCell = document.createElement('td');
        studentCell.innerHTML = `
            <div class="student-info">
                <span class="student-name">${request.first_name} ${request.last_name}</span>
            </div>
        `;
        row.appendChild(studentCell);

        const categoryCell = document.createElement('td');
        categoryCell.innerHTML = `<span class="category-badge">${request.category_name}</span>`;
        row.appendChild(categoryCell);

        const descCell = document.createElement('td');
        descCell.className = 'description-cell';
        descCell.textContent = request.description;
        row.appendChild(descCell);

        const roomCell = document.createElement('td');
        roomCell.textContent = request.room_number;
        row.appendChild(roomCell);

        const timeCell = document.createElement('td');
        timeCell.textContent = formatDate(request.created_at);
        row.appendChild(timeCell);

        const statusCell = document.createElement('td');
        const statusClass = getStatusClass(request.status);
        const statusText = getStatusText(request.status);
        statusCell.innerHTML = `<span class="request-status ${statusClass}">${statusText}</span>`;
        row.appendChild(statusCell);

        const actionsCell = document.createElement('td');
        actionsCell.className = 'actions-cell';
        actionsCell.innerHTML = `
            <select class="status-select" data-request-id="${request.id}">
                <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>В ожидании</option>
                <option value="approved" ${request.status === 'approved' ? 'selected' : ''}>Принять</option>
                <option value="rejected" ${request.status === 'rejected' ? 'selected' : ''}>Отклонить</option>
                <option value="done" ${request.status === 'done' ? 'selected' : ''}>Выполнена</option>
            </select>
        `;
        row.appendChild(actionsCell);

        tbody.appendChild(row);
    });
}

function filterRequests() {
    let filtered = [...allRequests];

    // Фильтр по корпусу
    if (currentBuildingFilter !== 'all') {
        filtered = filtered.filter(request => request.building_name === currentBuildingFilter);
    }

    // Фильтр по статусу
    if (currentStatusFilter !== 'all') {
        filtered = filtered.filter(request => request.status === currentStatusFilter);
    }

    // Поиск (если есть текст в поле поиска)
    const searchInput = document.getElementById('search');
    if (searchInput && searchInput.value.trim()) {
        const searchText = searchInput.value.toLowerCase().trim();
        filtered = filtered.filter(request => {
            return request.first_name.toLowerCase().includes(searchText) ||
                request.last_name.toLowerCase().includes(searchText) ||
                request.category_name.toLowerCase().includes(searchText) ||
                request.description.toLowerCase().includes(searchText) ||
                request.room_number.toLowerCase().includes(searchText) ||
                getStatusText(request.status).toLowerCase().includes(searchText);
        });
    }

    const tbody = document.querySelector('tbody');
    renderRequests(filtered, tbody);
}

function setupBuildingFilterHandler() {
    const buildingSelect = document.querySelector('.table-select');

    if (!buildingSelect) {
        console.error('Выпадающий список корпусов не найден');
        return;
    }

    // Обновляем значения в выпадающем списке
    buildingSelect.innerHTML = `
        <option value="all">Все корпуса</option>
        <option value="Силикаты">Силикаты</option>
        <option value="Крест">Крест</option>
        <option value="Временное">Временное</option>
    `;

    buildingSelect.addEventListener('change', () => {
        currentBuildingFilter = buildingSelect.value;

        // Обновляем заголовок
        const titleElement = document.querySelector('.table-wrapper h1');
        if (currentBuildingFilter === 'all') {
            titleElement.textContent = 'Все заявки';
        } else {
            titleElement.textContent = `Заявки корпуса "${currentBuildingFilter}"`;
        }

        filterRequests();
    });
}

function setupStatusFilterHandler() {
    const filterButtons = document.querySelectorAll('.status-filter-btn');

    if (!filterButtons.length) {
        console.error('Кнопки фильтрации не найдены');
        return;
    }

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentStatusFilter = btn.dataset.status;
            filterRequests();
        });
    });
}

async function loadRequests(tbody) {
    try {
        const response = await fetch('http://localhost:3000/api/requests', {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error(`Ошибка HTTP: ${response.status}`);
        }

        const requests = await response.json();
        allRequests = requests;
        renderRequests(requests, tbody);

    } catch (error) {
        console.error('Ошибка загрузки:', error);
        tbody.innerHTML = '<tr><td colspan="7">Ошибка загрузки заявок</td></tr>';
    }
}

function setupStatusChangeHandler(tbody) {
    tbody.addEventListener('change', async function(event) {
        const select = event.target;
        if (!select.classList.contains('status-select')) return;

        const requestId = select.dataset.requestId;
        const newStatus = select.value;
        const oldStatusValue = select.value;

        select.disabled = true;

        try {
            const response = await fetch(`http://localhost:3000/api/requests/${requestId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, admin_comment: "" })
            });

            const data = await response.json();

            if (data.success) {
                const row = select.closest('tr');
                const statusCell = row.querySelector('.request-status');
                statusCell.textContent = getStatusText(newStatus);
                statusCell.className = `request-status ${getStatusClass(newStatus)}`;

                const requestIndex = allRequests.findIndex(r => r.id == requestId);
                if (requestIndex !== -1) {
                    allRequests[requestIndex].status = newStatus;
                }
            } else {
                select.value = oldStatusValue;
                showError(data.error || 'Не удалось изменить статус');
            }
        } catch (error) {
            console.error('Ошибка:', error);
            select.value = oldStatusValue;
            showError('Ошибка подключения к серверу');
        } finally {
            select.disabled = false;
        }
    });
}

function setupSearchHandler() {
    const searchInput = document.getElementById('search');

    if (!searchInput) {
        console.error('Поле поиска не найдено');
        return;
    }

    searchInput.addEventListener('input', () => {
        filterRequests();
    });
}

document.addEventListener('DOMContentLoaded', async function() {
    const tbody = document.querySelector('tbody');

    if (!tbody) {
        console.error('Таблица не найдена');
        return;
    }

    await loadRequests(tbody);
    setupStatusChangeHandler(tbody);
    setupSearchHandler();
    setupStatusFilterHandler();
    setupBuildingFilterHandler();
});