function secFunc() {
    var titleDom = document.querySelector('.title');
    var title = firstFunc.getTitle();
    titleDom.addEventListener('click', function() {
        titleDom.innerHTML = title;        
    }, false);
}

window.onload = function() {
    secFunc();
}