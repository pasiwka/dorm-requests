const form = document.getElementById('newRequestForm');
const roomDisplay = document.getElementById('roomDisplay');
const message = document.getElementById('message');
const submitBtn = document.querySelector('.button--primary');

const userId = localStorage.getItem('userId');

async function getUserRoomFromDB() {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Ошибка получения данных пользователя');
        }

        const user = await response.json();

        if (user.room) {
            return {
                buildingName: user.room.building_name,
                roomNumber: user.room.room_number,
                roomId: null // пока не знаем room_id
            };
        }
        return null;
    } catch (error) {
        console.error('Ошибка:', error);
        return null;
    }
}
async function getRoomId(buildingName, roomNumber) {
    try {
        const response = await fetch('http://localhost:3000/api/rooms/find', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                building_name: buildingName,
                room_number: roomNumber
            })
        });

        if (!response.ok) {
            throw new Error('Комната не найдена');
        }

        const room = await response.json();
        return room.id;
    } catch (error) {
        console.error('Ошибка получения room_id:', error);
        return null;
    }
}
async function updateRoomDisplay() {

    let buildingName = localStorage.getItem('userBuilding');
    let roomNumber = localStorage.getItem('userRoom');

    if (!buildingName || !roomNumber) {
        const userRoom = await getUserRoomFromDB();
        if (userRoom) {
            buildingName = userRoom.buildingName;
            roomNumber = userRoom.roomNumber;
            // Сохраняем в localStorage для будущего использования
            if (buildingName) localStorage.setItem('userBuilding', buildingName);
            if (roomNumber) localStorage.setItem('userRoom', roomNumber);
        }
    }

    // Отображаем комнату
    if (roomDisplay && buildingName && roomNumber) {
        roomDisplay.textContent = `${buildingName}, ${roomNumber}`;
    } else if (roomDisplay) {
        roomDisplay.textContent = 'Корпус не указан, комната не указана';
    }

    return { buildingName, roomNumber };
}

// Отображаем комнату при загрузке страницы
let currentBuildingName = '';
let currentRoomNumber = '';

updateRoomDisplay().then(({ buildingName, roomNumber }) => {
    currentBuildingName = buildingName;
    currentRoomNumber = roomNumber;
});

// Отладка
console.log('=== ОТЛАДКА ===');
console.log('Все элементы с name="category":', document.querySelectorAll('input[name="category"]'));
console.log('Выбранный элемент:', document.querySelector('input[name="category"]:checked'));

form.addEventListener('submit', async function (e) {
    e.preventDefault();

    const selectedCategory = document.querySelector('input[name="category"]:checked');

    if (!selectedCategory) {
        showError('Выберите категорию заявки');
        return;
    }

    if (!message.value.trim()) {
        showError('Напишите описание проблемы');
        return;
    }

    // Получаем актуальные данные о комнате (сначала из localStorage, потом из БД)
    let buildingName = localStorage.getItem('userBuilding');
    let roomNumber = localStorage.getItem('userRoom');

    if (!buildingName || !roomNumber) {
        const userRoom = await getUserRoomFromDB();
        if (userRoom) {
            buildingName = userRoom.buildingName;
            roomNumber = userRoom.roomNumber;
        }
    }

    // Если всё равно нет данных о комнате, показываем ошибку
    if (!buildingName || !roomNumber) {
        showError('Укажите корпус и комнату в профиле перед созданием заявки');
        return;
    }

    // Получаем room_id
    const roomId = await getRoomId(buildingName, roomNumber);

    if (!roomId) {
        showError('Не удалось найти комнату в системе. Проверьте корпус и номер комнаты.');
        return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Отправка...</span>';
    submitBtn.disabled = true;

    try {
        const requestData = {
            user_id: parseInt(userId),
            category_id: parseInt(selectedCategory.value),
            description: message.value.trim(),
            room_id: roomId
        };

        console.log('Отправляем данные:', requestData);

        const response = await fetch('http://localhost:3000/api/requests', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (data.success) {
            window.location.href = 'tracking-request.html';
        } else {
            showError(data.error || 'Ошибка при создании заявки');
        }

    } catch (error) {
        console.error('Ошибка:', error);
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
        showError('Ошибка подключения к серверу');
    }
});

function showError(message) {
    let errorMessageDiv = document.getElementById('errorMessage');

    if (!errorMessageDiv) {
        errorMessageDiv = document.createElement('div');
        errorMessageDiv.id = 'errorMessage';
        errorMessageDiv.className = 'error-message';
        if (form) form.prepend(errorMessageDiv);
    }

    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';

    setTimeout(() => {
        if (errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
        }
    }, 5000);
}