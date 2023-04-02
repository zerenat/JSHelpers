// ==UserScript==
// @name         ModificationTracker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  A system to play notification sound on incoming WAT Task
// @author       Martin Hein - heimarti
// @match        
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

const modificationTracker = {
    trackedElement: undefined,
    firstCheck: true,
    elementState: undefined,
    getTrackedElement: ()=>{
        return this.trackedElement;
    },
    setTrackedElement: (value)=>{
        this.trackedElement = value;
    },
    getElementState: ()=>{
        return this.elementState;
    },
    setElementState: (value)=>{
        this.elementState = value;
    },
    checkForModifications: ()=>{
        if (this.firstCheck){
            this.firstCheck = false;
            this.elementState = this.trackedElement.innerText;
            return false;
        } else{
            if (this.elementState != this.trackedElement.innertText){
                this.elementState = this.trackedElement.innertText;
                return true;
            } else{
                return false;
            }
        }

    },
}

const alertSound= {
    playAlertSound: ()=>{
        console.log("playing alert sound")
    },
}

const main = ()=>{
    console.log('starting script')
    modificationTracker.setTrackedElement = document.getElementById("Tasks-Editor").childNodes[1].childNodes[0].childNodes[0]
    while (true){
        setTimeout(()=>{
            modificationTracker.checkForModifications();
        },500);
    }
};

main();