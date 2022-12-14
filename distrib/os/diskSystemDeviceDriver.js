/* ----------------------------------
   DiskSystemDeviceDriver.ts

   The Disk System Device Driver.
   ---------------------------------- */
var TSOS;
(function (TSOS) {
    // Extends DeviceDriver
    class DiskSystemDeviceDriver extends TSOS.DeviceDriver {
        constructor() {
            // Override the base method pointers.
            // The code below cannot run because "this" can only be
            // accessed after calling super.
            // super(this.krnKbdDriverEntry, this.krnKbdDispatchKeyPress);
            // So instead...
            super();
            this.driverEntry = this.krnDiskDriverEntry;
            this.isr = this.krnDiskDispatchKeyPress;
        }
        krnDiskDriverEntry() {
            // Initialization routine for this, the kernel-mode Keyboard Device Driver.
            this.status = "loaded";
            // More?
        }
        krnDiskDispatchKeyPress(params) {
        }
        format() {
            if (this.status === "unloaded") {
                let zerosArray = new Array(64).fill("--");
                zerosArray[0x0] = "0";
                for (let track = 0x0; track < 0x4; track++) {
                    for (let sector = 0x0; sector < 0x8; sector++) {
                        for (let block = 0x0; block < 0x8; block++) {
                            let tsb = track.toString() + sector.toString() + block.toString();
                            sessionStorage.setItem(tsb, JSON.stringify(zerosArray));
                        }
                    }
                }
            }
        }
        findUnusedStorageLocation() {
            for (let track = 0x1; track < 0x4; track++) {
                for (let sector = 0x0; sector < 0x8; sector++) {
                    for (let block = 0x0; block < 0x8; block++) {
                        let tsb = track.toString() + sector.toString() + block.toString();
                        let inUse = JSON.parse(sessionStorage.getItem(tsb))[0];
                        if (inUse == "0") {
                            return tsb;
                        }
                    }
                }
            }
            return "";
        }
        create(filename) {
            let track = 0x0;
            for (let sector = 0x0; sector < 0x8; sector++) {
                for (let block = 0x0; block < 0x8; block++) {
                    let tsb = track.toString() + sector.toString() + block.toString();
                    if (tsb != "000") {
                        let inUse = JSON.parse(sessionStorage.getItem(tsb))[0];
                        if (inUse == "0") {
                            let newArray = new Array(64).fill("--");
                            newArray[0x0] = "1";
                            let nextLocation = this.findUnusedStorageLocation();
                            if (nextLocation != "") {
                                let nextLocationArray = new Array(64).fill("--");
                                ;
                                nextLocationArray[0] = "1";
                                sessionStorage.setItem(nextLocation, JSON.stringify(nextLocationArray));
                                newArray[0x1] = nextLocation[0x0];
                                newArray[0x2] = nextLocation[0x1];
                                newArray[0x3] = nextLocation[0x2];
                                let filenameArray = filename.split('')
                                    .map(char => char.charCodeAt(0).toString(16).padStart(2, "0"));
                                let arrayElemNum = 0x4;
                                for (let letter of filenameArray) {
                                    newArray[arrayElemNum] = letter;
                                    arrayElemNum++;
                                }
                                sessionStorage.setItem(tsb, JSON.stringify(newArray));
                                return "File Created";
                            }
                        }
                    }
                }
            }
        }
        findTsb(currentFilename) {
            let track = 0x0;
            for (let sector = 0x0; sector < 0x8; sector++) {
                for (let block = 0x0; block < 0x8; block++) {
                    let tsb = track.toString() + sector.toString() + block.toString();
                    if (tsb != "000") {
                        let filenameArray = JSON.parse(sessionStorage.getItem(tsb));
                        if (filenameArray[0] == "1") {
                            let currentFilenameArray = currentFilename.split('')
                                .map(char => char.charCodeAt(0).toString(16).padStart(2, "0"));
                            let compareFilenameArray = filenameArray.slice(4, currentFilenameArray.length + 4);
                            if (JSON.stringify(currentFilenameArray) == JSON.stringify(compareFilenameArray)) {
                                if (filenameArray[currentFilenameArray.length + 4] == "--") {
                                    return tsb;
                                }
                            }
                        }
                    }
                }
            }
            return "";
        }
        rename(currentFilename, newFilename) {
            let renameTsb = this.findTsb(currentFilename);
            if (this.findTsb(newFilename) != "") {
                return "Filename already exists.";
            }
            let renameTsbArray = JSON.parse(sessionStorage.getItem(renameTsb));
            if (renameTsb != "") {
                let newArray = new Array(64).fill("--");
                newArray[0x0] = renameTsbArray[0x0];
                newArray[0x1] = renameTsbArray[0x1];
                newArray[0x2] = renameTsbArray[0x2];
                newArray[0x3] = renameTsbArray[0x3];
                let filenameArray = newFilename.split('')
                    .map(char => char.charCodeAt(0).toString(16).padStart(2, "0"));
                let arrayElemNum = 0x4;
                for (let letter of filenameArray) {
                    newArray[arrayElemNum] = letter;
                    arrayElemNum++;
                }
                sessionStorage.setItem(renameTsb, JSON.stringify(newArray));
                return "File renamed.";
            }
            else {
                return "File Not Found";
            }
        }
        write(currentFilename, data) {
            let writeTsb = this.findTsb(currentFilename);
            if (writeTsb != "") {
                let currentData = JSON.parse(sessionStorage.getItem(writeTsb));
                // Deletes all data in the file if any data exists
                let deleteTsb = currentData[1].toString() + currentData[2].toString() + currentData[3].toString();
                let deleteItem = JSON.parse(sessionStorage.getItem(deleteTsb));
                while (deleteTsb != "------") {
                    deleteItem[0] = "0";
                    sessionStorage.setItem(deleteTsb, JSON.stringify(deleteItem));
                    deleteTsb = deleteItem[1].toString() + deleteItem[2].toString() + deleteItem[3].toString();
                    deleteItem = JSON.parse(sessionStorage.getItem(deleteTsb));
                }
                // Gets rid of the quotes
                data = data.slice(1, -1);
                let memoryBlocks = Math.floor(data.length / 60) + 1;
                let currentTsb = currentData[1].toString() + currentData[2].toString() + currentData[3].toString();
                for (let block = 0x0; block < memoryBlocks; block++) {
                    let newDataArray = new Array(64).fill("--");
                    newDataArray[0] = "1";
                    let maxChars = 60;
                    if (block == (memoryBlocks - 1)) {
                        maxChars = data.length % 60;
                    }
                    for (let charNum = 0; charNum < maxChars; charNum++) {
                        let characterValue = data.charCodeAt((block * 60) + charNum);
                        newDataArray[4 + charNum] = characterValue.toString(16).padStart(2, "0");
                    }
                    // Finds the next block to store data in
                    if (block < (memoryBlocks - 1)) {
                        let unusedLocation = this.findUnusedStorageLocation();
                        let claimLocation = new Array(64).fill("--");
                        claimLocation[0] = "1";
                        sessionStorage.setItem(unusedLocation, JSON.stringify(claimLocation));
                        newDataArray[1] = unusedLocation[0];
                        newDataArray[2] = unusedLocation[1];
                        newDataArray[3] = unusedLocation[2];
                    }
                    sessionStorage.setItem(currentTsb, JSON.stringify(newDataArray));
                    if (block < (memoryBlocks - 1)) {
                        currentTsb = newDataArray[1].toString() +
                            newDataArray[2].toString() +
                            newDataArray[3].toString();
                    }
                }
                return "Data written.";
            }
            else {
                return "File not found.";
            }
        }
        writeDirect(currentFilename, data) {
            let writeTsb = this.findTsb(currentFilename);
            if (writeTsb != "") {
                let currentData = JSON.parse(sessionStorage.getItem(writeTsb));
                let memoryBlocks = 5;
                let currentTsb = currentData[1].toString() + currentData[2].toString() + currentData[3].toString();
                for (let block = 0x0; block < memoryBlocks; block++) {
                    let newDataArray = new Array(64).fill("--");
                    newDataArray[0] = "1";
                    let maxChars = 60;
                    if (block == (memoryBlocks - 1)) {
                        maxChars = data.length % 60;
                    }
                    for (let charNum = 0; charNum < maxChars; charNum++) {
                        let characterValue = data[(block * 60) + charNum];
                        newDataArray[4 + charNum] = characterValue;
                    }
                    // Finds the next block to store data in
                    if (block < (memoryBlocks - 1)) {
                        let unusedLocation = this.findUnusedStorageLocation();
                        let claimLocation = new Array(64).fill("--");
                        claimLocation[0] = "1";
                        sessionStorage.setItem(unusedLocation, JSON.stringify(claimLocation));
                        newDataArray[1] = unusedLocation[0];
                        newDataArray[2] = unusedLocation[1];
                        newDataArray[3] = unusedLocation[2];
                    }
                    sessionStorage.setItem(currentTsb, JSON.stringify(newDataArray));
                    if (block < (memoryBlocks - 1)) {
                        currentTsb = newDataArray[1].toString() +
                            newDataArray[2].toString() +
                            newDataArray[3].toString();
                    }
                }
                return "Data written.";
            }
        }
        delete(filename) {
            let deleteTsb = this.findTsb(filename);
            if (deleteTsb == "") {
                return "File not found.";
            }
            let deleteItem = JSON.parse(sessionStorage.getItem(deleteTsb));
            let nextTsb = deleteTsb;
            while (nextTsb != "------") {
                deleteItem[0] = "0";
                sessionStorage.setItem(nextTsb, JSON.stringify(deleteItem));
                nextTsb = deleteItem[1].toString() + deleteItem[2].toString() + deleteItem[3].toString();
                deleteItem = JSON.parse(sessionStorage.getItem(nextTsb));
            }
            return "File deleted.";
        }
        list(all) {
            let allFiles = [];
            for (let track = 0x0; track < 0x1; track++) {
                for (let sector = 0x0; sector < 0x8; sector++) {
                    for (let block = 0x0; block < 0x8; block++) {
                        let tsb = track.toString() + sector.toString() + block.toString();
                        let currentData = JSON.parse(sessionStorage.getItem(tsb));
                        if (currentData[0] == "1") {
                            let filename = "";
                            let letterNum = 4;
                            while (currentData[letterNum] != "--") {
                                filename += String.fromCharCode(parseInt(currentData[letterNum], 16));
                                letterNum++;
                            }
                            if (all) {
                                allFiles.push(filename);
                            }
                            else {
                                if (filename[0] != "~") {
                                    allFiles.push(filename);
                                }
                            }
                        }
                    }
                }
            }
            return allFiles;
        }
        read(filename) {
            let readTsb = this.findTsb(filename);
            // If file doesn't exist
            if (readTsb == "") {
                return "File Not Found";
            }
            let readItem = JSON.parse(sessionStorage.getItem(readTsb));
            readTsb = readItem[1].toString() + readItem[2].toString() + readItem[3].toString();
            let dataString = "";
            while (readTsb != "------") {
                readItem = JSON.parse(sessionStorage.getItem(readTsb));
                let letterNum = 4;
                while (readItem[letterNum] != "--") {
                    dataString += String.fromCharCode(parseInt(readItem[letterNum], 16));
                    if (letterNum == 63) {
                        break;
                    }
                    letterNum++;
                }
                readTsb = readItem[1].toString() + readItem[2].toString() + readItem[3].toString();
            }
            return dataString;
        }
        readDirect(filename) {
            let readTsb = this.findTsb(filename);
            let readItem = JSON.parse(sessionStorage.getItem(readTsb));
            readTsb = readItem[1].toString() + readItem[2].toString() + readItem[3].toString();
            let dataArray = new Array(256);
            let arrayItemNum = 0;
            while (readTsb != "------") {
                readItem = JSON.parse(sessionStorage.getItem(readTsb));
                let letterNum = 4;
                while (readItem[letterNum] != "--") {
                    dataArray[arrayItemNum++] = readItem[letterNum];
                    if (letterNum == 63) {
                        break;
                    }
                    letterNum++;
                }
                readTsb = readItem[1].toString() + readItem[2].toString() + readItem[3].toString();
            }
            return dataArray;
        }
        copy(oldFilename, newFilename) {
            let fileExists = this.findTsb(newFilename);
            if (fileExists != "") {
                fileExists = this.findTsb(oldFilename);
                if (fileExists != "") {
                    let data = this.read(oldFilename);
                    this.create(newFilename);
                    this.write(newFilename, data);
                    return "File copy created.";
                }
                else {
                    return "File doesn't exist.";
                }
            }
            else {
                return "Filename already exists.";
            }
        }
    }
    TSOS.DiskSystemDeviceDriver = DiskSystemDeviceDriver;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=diskSystemDeviceDriver.js.map