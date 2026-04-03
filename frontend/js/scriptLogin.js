// закрываем уведомление
const notificationClose = document.querySelector("#closeNotification");
const notificationContent = document.querySelector(".notification");

if (notificationClose && notificationContent) {
    notificationClose.addEventListener("click", (e) => {
        e.stopPropagation();
        notificationContent.style.display = "none";
    });
}


// обрабатываем отправку формы
document.getElementById('loginForm').addEventListener('submit', async function(event) {
    event.preventDefault();

    const phone = document.getElementById('phone').value;
    const password = document.getElementById('password').value;

    try {
        const submitBtn = document.querySelector('.auth-btn');
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

        // Восстанавливаем кнопку
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;

        if (data.success) {
            // Сохраняем данные пользователя в localStorage
            localStorage.setItem('userId', data.user.id);
            localStorage.setItem('userRole', data.user.role);
            localStorage.setItem('userPhone', data.user.phone);
            localStorage.setItem('userFirstName', data.user.first_name || '');
            localStorage.setItem('userLastName', data.user.last_name || '');
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
        } else {
            showError(data.error || 'Ошибка входа. Проверьте номер и пароль.');
        }

    } catch (error) {
        console.error('Ошибка:', error);
        showError('Ошибка подключения к серверу. Убедитесь, что сервер запущен (npm run server)');
        const submitBtn = document.querySelector('.auth-btn');
        submitBtn.innerHTML = '<span>Вход</span>';
        submitBtn.disabled = false;
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

