// frontend/js/scriptNewRequest.js

const form = document.getElementById('newRequestForm');
const roomDisplay = document.getElementById('roomDisplay');
const message = document.getElementById('message');
const submitBtn = document.querySelector('.button--primary');

const userId = localStorage.getItem('userId');
const userRoom = localStorage.getItem('userRoom');
const userBuilding = localStorage.getItem('userBuilding');

// Функция для получения room_id по корпусу и номеру комнаты
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

// Отображаем комнату пользователя
if (roomDisplay && userBuilding && userRoom) {
    roomDisplay.textContent = `${userBuilding}, ${userRoom}`;
}

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

    // Получаем актуальный room_id из данных пользователя в localStorage
    const buildingName = localStorage.getItem('userBuilding');
    const roomNumber = localStorage.getItem('userRoom');

    if (!buildingName || !roomNumber) {
        showError('Сначала заполните профиль (укажите корпус и комнату)');
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
            room_id: roomId  // ← теперь динамический!
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
        form.prepend(errorMessageDiv);
    }

    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';

    setTimeout(() => {
        if (errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
        }
    }, 5000);
}