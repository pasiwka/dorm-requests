const form = document.getElementById('newRequestForm');
const roomDisplay = document.getElementById('roomDisplay');
const message = document.getElementById('message');
const submitBtn = document.querySelector('.auth-btn');  // ← добавить кнопку

const userId = localStorage.getItem('userId');
const userRoom = localStorage.getItem('userRoom');
const userBuilding = localStorage.getItem('userBuilding');

if (roomDisplay && userBuilding && userRoom) {
    roomDisplay.textContent = `${userBuilding}, ${userRoom}`;
}
// Временно добавить для отладки
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

    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Отправка...</span>';
    submitBtn.disabled = true;

    try {
        const requestData = {
            user_id: parseInt(userId),
            category_id: parseInt(selectedCategory.value),
            description: message.value.trim(),
            room_id: 1
        };

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