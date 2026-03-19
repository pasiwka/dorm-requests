//закрываем уведомление
const notification= document.querySelector("#closeNotification")
const notificationContent=document.querySelector(".notification")
notification.addEventListener("click", (e) => {
    notificationContent.style.display = "none";
});

//переходим на другую страницу
document.getElementById('loginForm').addEventListener('submit', function(event) {
    event.preventDefault();//позже сделаем бек логика поменяется(это чтобы не было отправки данных на сервак)
    window.location.href = 'new-request.html';
});

