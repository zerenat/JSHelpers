// ==UserScript==
// @name         TableChangeTracker
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  A system to track new table items
// @author       Martin Hein
// @match        ""
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

const changeTracker = {
    tableData: {'tableElement': undefined,
                'tableRows': 0,
                'changeCounter': 0,
                'identificationStrings': [],
               },
    get getTableData(){
        return this.tableData;
    },
    set setTableData(value){
        this.tableData = value;
    },
    get getTableElement(){
        console.log("Retrieving tracked element")
        return this.tableData.tableElement;
    },
    set setTableElement(value){
        console.log("Setting tracked element to: ", value)
        this.tableData.tableElement = value;
    },
    get getTableRows(){
        console.log("retrieving element state")
        return this.tableData.tableRows;
    },
    set setTableRows(value){
        console.log("Setting element state to: ", value)
        this.tableData.tableRows = value;
    },
    get getChangeCounter(){
        return this.tableData.changeCounter;
    },
    set setChangeCounter(value){
        this.tableData.changeCounter = value;
    },
    get getIdentificationStrings(){
        return this.tableData.identificationStrings;
    },
    set setIdentificationStrings(value){
        this.tableData.identificationStrings = value;
    },
    incrementChangeCounter: function(){
        this.tableData.changeCounter += 1;
    },
    checkForChange: function(){
        let tableRowIds = []
        let tableChange = false;
        for (let row of this.tableData.tableElement.childNodes){
            let rowIdString = row.innerText.replace(/[\n\t_ ]/gm, "").split(/(\s)/)[0]
            tableRowIds.push(rowIdString);
            if (!this.tableData.identificationStrings.includes(rowIdString)){
                tableChange = true;
            }
        }
        this.tableData.identificationStrings = tableRowIds;
        if(tableChange){
            if (this.tableData.changeCounter > 0){
                return true;
            } else {
                this.incrementChangeCounter();
                return false;
            }
        } else {
            return false;
        }
    }
}

const audioAlerts = {
    playerElement: document.createElement('audio'),
    soundFileNewTask: "",
    playNotificationNewTask: function (){
        this.playerElement.src = this.soundFileNewTask;
        this.playerElement.preload = 'auto';
        this.playerElement.play()
    },
}

const main = ()=>{
    changeTracker.setTableElement = document.getElementById('Tasks-Editor').children[1].children[0].children[0]
    setInterval(()=>{
        if (changeTracker.checkForChange()){
            audioAlerts.playNotificationNewTask();
        }
    }, 2000);
};

main();