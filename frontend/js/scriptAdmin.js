// Форматирование даты
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

// Получение CSS-класса для статуса
function getStatusClass(status) {
    const map = {
        'pending': 'status-new',     // или 'status-pending'
        'approved': 'status-approved',
        'rejected': 'status-rejected'
    };
    return map[status] || 'status-new';
}

function getStatusText(status) {
    const map = {
        'pending': 'В ожидании',
        'approved': 'Принята',
        'rejected': 'Отклонена'
    };
    return map[status] || status;
}

document.addEventListener('DOMContentLoaded', async function() {
    const tableItem = document.querySelector('tbody');

    try {
        const response = await fetch('http://localhost:3000/api/requests', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const requests = await response.json();

        function renderRequests(requests) {
            const tbody = document.querySelector('tbody');
            tbody.innerHTML = '';

            // Проходим по каждой заявке из массива
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
                categoryCell.innerHTML =
                    `<span class="category-badge">${request.category_name}</span>`;
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
                statusCell.innerHTML = `<span class="status-badge ${statusClass}">${statusText}</span>`;
                row.appendChild(statusCell);

                const actionsCell = document.createElement('td');
                actionsCell.className = 'actions-cell';
                actionsCell.innerHTML = `
            <select class="status-select" data-request-id="${request.id}">
                <option value="pending" ${request.status === 'pending' ? 'selected' : ''}>В ожидании</option>
                <option value="approved" ${request.status === 'approved' ? 'selected' : ''}>Принять</option>
                <option value="rejected" ${request.status === 'rejected' ? 'selected' : ''}>Отклонить</option>
            </select>
        `;
                row.appendChild(actionsCell);
                tbody.appendChild(row);
            });
        }

        renderRequests(requests);

    }catch (error) {
    console.error('Ошибка:', error);
}
});