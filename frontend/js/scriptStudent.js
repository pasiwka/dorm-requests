const role = localStorage.getItem('userRole');
const userId = localStorage.getItem('userId');
const firstName = localStorage.getItem('userFirstName');
const lastName = localStorage.getItem('userLastName');

if (role !== 'student') {
    window.location.href = 'login.html';
}

const studentNameEl = document.getElementById('studentName');
const studentInfoEl = document.getElementById('studentInfo');

if (firstName && lastName) {
    studentNameEl.textContent = `${firstName} ${lastName}`;
} else {
    studentNameEl.textContent = 'Студент';
    studentInfoEl.textContent = 'Заполните профиль, чтобы указать имя и комнату';
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