function createObserver (selectorString, callBack){
    const observer = new MutationObserver(mutations => {
        if (document.querySelector(selectorString)) {
            callBack(document.querySelector(selectorString))
            observer.disconnect();
        }
    });
    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true
    });
}