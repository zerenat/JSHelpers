const sessionStore = {
    sessionStore: sessionStorage,
    getSessionItem: function(item){
        return this.sessionStore.getItem(item);
    },
    setSessionItem: function(key, value){
        this.sessionStore.setItem(key, value);
    }
}