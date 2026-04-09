// frontend/js/scriptLogin.js

const notificationClose = document.querySelector("#closeNotification");
const notificationContent = document.querySelector(".notification");

if (notificationClose && notificationContent) {
    notificationClose.addEventListener("click", (e) => {
        e.stopPropagation();
        notificationContent.style.display = "none";
    });
}

document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;
    const errorMessageDiv = document.getElementById('errorMessage');

    errorMessageDiv.style.display = 'none';
    errorMessageDiv.textContent = '';

    if (!phone || !password) {
        showError('Заполните все поля');
        return;
    }

    if (phone.length !== 11) {
        showError('Номер телефона должен содержать 11 цифр');
        return;
    }

    if (password.length < 6) {
        showError('Пароль должен содержать минимум 6 символов');
        return;
    }

    try {
        const submitBtn = document.querySelector('.button--primary');
        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<span>Вход...</span>';
        submitBtn.disabled = true;

        const response = await fetch('http://localhost:3000/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: phone,
                password: password
            })
        });

        const data = await response.json();

        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (data.success) {
            console.log('Данные от сервера:', data);
            console.log('firstName:', data.user.firstName);
            console.log('lastName:', data.user.lastName);

            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userPhone', data.user.phone);
            localStorage.setItem('userFirstName', data.user.firstName || '');
            localStorage.setItem('userLastName', data.user.lastName || '');
            localStorage.setItem('userRoom', data.user.room_number || '');
            localStorage.setItem('userBuilding', data.user.building || '');

            document.body.classList.add('fade-out');

            setTimeout(() => {
                if (data.user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'student.html';
                }
            }, 500);
        }else {
            showError(data.error || 'Ошибка входа. Проверьте номер и пароль.');
        }

    } catch (error) {
        console.error('Ошибка:', error);
        showError('Ошибка подключения к серверу. Убедитесь, что сервер запущен');
        const submitBtn = document.querySelector('.button--primary');
        if (submitBtn) {
            submitBtn.innerHTML = '<span>Вход</span>';
            submitBtn.disabled = false;
        }
    }
});

function showError(message) {
    const errorMessageDiv = document.getElementById('errorMessage');
    errorMessageDiv.textContent = message;
    errorMessageDiv.style.display = 'block';

    setTimeout(() => {
        if (errorMessageDiv) {
            errorMessageDiv.style.display = 'none';
        }
    }, 5000);
}