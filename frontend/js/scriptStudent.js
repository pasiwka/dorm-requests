const role = localStorage.getItem('userRole');
const userId = localStorage.getItem('userId');

if (role !== 'student') {
    window.location.href = 'login.html';
}

const studentNameEl = document.getElementById('studentName');
const studentInfoEl = document.getElementById('studentInfo');

async function loadUserDataFromDB() {
    try {
        const response = await fetch(`http://localhost:3000/api/users/${userId}`, {
            method: 'GET',
            headers: { 'Content-Type': 'application/json' }
        });

        if (!response.ok) {
            throw new Error('Ошибка загрузки данных пользователя');
        }

        const user = await response.json();
        if (user.first_name) localStorage.setItem('userFirstName', user.first_name);
        if (user.last_name) localStorage.setItem('userLastName', user.last_name);

        if (user.room) {
            localStorage.setItem('userRoom', user.room.room_number || '');
            localStorage.setItem('userBuilding', user.room.building_name || '');
        }

        updateDisplay(user);

    } catch (error) {
        console.error('Ошибка загрузки из БД:', error);
        updateDisplayFromLocalStorage();
    }
}

function updateDisplay(user) {
    const firstName = user.first_name;
    const lastName = user.last_name;
    const roomNumber = user.room?.room_number;
    const buildingName = user.room?.building_name;

    if (firstName && lastName) {
        studentNameEl.textContent = `${firstName} ${lastName}`;
    } else {
        studentNameEl.textContent = 'Студент';
    }

    if (buildingName && roomNumber) {
        studentInfoEl.textContent = `${buildingName}, ${roomNumber}`;
    } else if (studentInfoEl) {
        studentInfoEl.textContent = 'Заполните профиль, чтобы указать имя и комнату';
    }
}
function updateDisplayFromLocalStorage() {
    const firstName = localStorage.getItem('userFirstName');
    const lastName = localStorage.getItem('userLastName');
    const userRoom = localStorage.getItem('userRoom');
    const userBuilding = localStorage.getItem('userBuilding');

    if (firstName && lastName) {
        studentNameEl.textContent = `${firstName} ${lastName}`;
    } else {
        studentNameEl.textContent = 'Студент';
    }

    if (userBuilding && userRoom) {
        studentInfoEl.textContent = `${userBuilding}, ${userRoom}`;
    } else if (studentInfoEl) {
        studentInfoEl.textContent = 'Заполните профиль, чтобы указать имя и комнату';
    }
}
function goToProfile() {
    window.location.href = 'profile.html';
}

function goToNewRequest() {
    window.location.href = 'new-request.html';
}

function goToRequests() {
    window.location.href = 'tracking-request.html';
}

function logout() {
    localStorage.clear();
    document.body.classList.add('fade-out');
    setTimeout(() => {
        window.location.href = 'login.html';
    }, 500);
}

document.addEventListener('DOMContentLoaded', () => {
    loadUserDataFromDB();
});
