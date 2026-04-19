const userId = localStorage.getItem('userId');
const userRole = localStorage.getItem('userRole');

if (!userId || userRole !== 'student') {
    window.location.href = 'login.html';
}

const nameInput = document.getElementById('name');
const surnameInput = document.getElementById('surname');
const buildingInput = document.getElementById('building');
const roomInput = document.getElementById('room');
const form = document.getElementById('loginForm');
const buttons = document.querySelectorAll('.button--primary');
const saveBtn = buttons[0];
const backBtn = buttons[1];

async function loadUserProfile() {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки профиля');
        }

        const user = await response.json();

        if (nameInput) nameInput.value = user.first_name || '';
        if (surnameInput) surnameInput.value = user.last_name || '';

        if (user.room) {
            if (buildingInput) buildingInput.value = user.room.building_name || '';
            if (roomInput) roomInput.value = user.room.room_number || '';
        }

        if (user.first_name) localStorage.setItem('userFirstName', user.first_name);
        if (user.last_name) localStorage.setItem('userLastName', user.last_name);
        if (user.room) {
            localStorage.setItem('userRoom', user.room.room_number || '');
            localStorage.setItem('userBuilding', user.room.building_name || '');
        }

    } catch (error) {
        console.error('Ошибка:', error);
        showError('Не удалось загрузить данные профиля');
    }
}

async function saveUserProfile() {
    const firstName = nameInput ? nameInput.value.trim() : '';
    const lastName = surnameInput ? surnameInput.value.trim() : '';
    const buildingName = buildingInput ? buildingInput.value.trim() : '';
    const roomNumber = roomInput ? roomInput.value.trim() : '';

    if (!firstName || !lastName) {
        showError('Имя и фамилия обязательны для заполнения');
        return;
    }

    const originalText = saveBtn.innerHTML;
    saveBtn.innerHTML = '<span>Сохранение...</span>';
    saveBtn.disabled = true;

    try {
        const userResponse = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                first_name: firstName,
                last_name: lastName
            })
        });

        if (!userResponse.ok) {
            throw new Error('Ошибка сохранения имени и фамилии');
        }

        if (buildingName && roomNumber) {
            const roomResponse = await fetch('http://localhost:3000/api/rooms/find', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    building_name: buildingName,
                    room_number: roomNumber
                })
            });

            if (roomResponse.ok) {
                const room = await roomResponse.json();

                await fetch(`http://localhost:3000/api/residencies/${userId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        room_id: room.id,
                        is_current: true
                    })
                });
            } else {
                showError('Корпус или комната не найдены в системе');
            }
        }
        localStorage.setItem('userFirstName', firstName);
        localStorage.setItem('userLastName', lastName);
        if (buildingName) localStorage.setItem('userBuilding', buildingName);
        if (roomNumber) localStorage.setItem('userRoom', roomNumber);

        showSuccess('Профиль успешно сохранён!');

        setTimeout(() => {
            window.location.href = 'student.html';
        }, 1500);

    } catch (error) {
        console.error('Ошибка:', error);
        showError('Ошибка при сохранении профиля');
    } finally {
        saveBtn.innerHTML = originalText;
        saveBtn.disabled = false;
    }
}

function showError(message) {
    let errorDiv = document.getElementById('profileError');
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = 'profileError';
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

function showSuccess(message) {
    let successDiv = document.getElementById('profileSuccess');
    if (!successDiv) {
        successDiv = document.createElement('div');
        successDiv.id = 'profileSuccess';
        successDiv.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #10b981;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 1000;
        `;
        document.body.appendChild(successDiv);
    }
    successDiv.textContent = message;
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 3000);
}

function goBack() {
    window.location.href = 'student.html';
}

if (form) {
    form.addEventListener('submit', (e) => {
        e.preventDefault();
    });
}

if (saveBtn) {
    saveBtn.addEventListener('click', (e) => {
        e.preventDefault();
        saveUserProfile();
    });
}

if (backBtn) {
    backBtn.addEventListener('click', (e) => {
        e.preventDefault();
        goBack();
    });
}
document.addEventListener('DOMContentLoaded', loadUserProfile);