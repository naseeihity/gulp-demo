var firstFunc = (function firstFunc() {
    var TITLE = 'WORLD-1';

    return {
        getTitle: function() {
            return TITLE;
        }
    };
})();
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