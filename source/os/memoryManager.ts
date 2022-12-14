/* ------------
   memoryManager.ts

   This virtual memory manager "allocates" and "deallocates" storage in memory..
   ------------ */
module TSOS {
    export class MemoryManager {

        constructor (public memoryAccessor: TSOS.MemoryAccessor = null,
                     public pid = 0,
                     public memoryMap = { 0: -1, 1: -1, 2: -1 },
                     public executingPid = 0x0) {
        }

        /**
         * Stores incoming data memory
         * @param loadDataArray the data to be stored in memory
         */
        public store(loadDataArray: string[]): string {

            // Lets the user know if the program size is too large (greater than 256)
            if (loadDataArray.length > 0x100) {
                return "This program is too long to store in memory."
            }

            // Checks the first location in memory that is available
            let storeLoc: number = -1
            for (let i = 0; i < 3; i++) {
                if (this.memoryMap[i] == -1) {
                    storeLoc = i;
                    break;
                }
            }

            // Checks if there is any location in memory that is available
            if (storeLoc > -1) {

                // Rewrites the memory block with all zeros
                for (let arrayElemNum = 0; arrayElemNum < 0x100; arrayElemNum++) {
                    _MemoryAccessor.writeImmediate(storeLoc * 0x100 + arrayElemNum, 0x00);
                }

                // Writes the input data in memory
                for (let arrayElemNum = 0; arrayElemNum < loadDataArray.length; arrayElemNum++) {
                    _MemoryAccessor.writeImmediate(storeLoc * 0x100 + arrayElemNum, parseInt(loadDataArray[arrayElemNum], 16));
                }

                // TODO: Implement an actual way to map PIDs to their location within memory
                this.memoryMap[storeLoc] = this.pid;

                residentList.push(new PCB(
                    this.pid, storeLoc * 0x100, (storeLoc * 0x100) + 0x100, "Resident", storeLoc * 0x100));

                waitAndTurnaroundTimeTable[this.pid.toString()] = [0,0];
            } else {
                this.storeInDisc(loadDataArray, this.pid);
            }
            return "Process " + (this.pid++).toString() + " created.";
        }

        /**
         * Begins executing a program in the CPU
         * @param commandPid the pid of the command to be executed
         */
        public run (commandPid: number) {

            for(let processNum = 0; processNum < residentList.length; processNum++) {
                if (residentList[processNum].pid == commandPid) {
                    residentList[processNum].state = "Ready";
                    readyQueue.push(residentList[processNum]);
                    residentList.splice(processNum, 1);
                    break;
                }
            }

            if (_CPU.isExecuting == false) {
                _CPUScheduler.start();
                _CPU.isExecuting = true;
            }
        }

        public clearMem () {
            this.memoryMap = { 0: -1, 1: -1, 2: -1 };
        }

        /**
         * Stores a program in the disk
         * @param loadDataArray the array of program data to be stored
         */
        public storeInDisc(loadDataArray: string[], pid: number) {

            let dataArray = new Array(256).fill("00");

            for(let dataItemNum = 0; dataItemNum < loadDataArray.length; dataItemNum++) {
                dataArray[dataItemNum] = loadDataArray[dataItemNum];
            }

            _krnDiskDriver.create("~" + pid);

            _krnDiskDriver.writeDirect("~" + pid, dataArray);

            residentList.push(new PCB(
                pid, 0x000, 0x100, "Resident", 0x000, "Disk"));

            waitAndTurnaroundTimeTable[pid.toString()] = [0,0];
        }

        /**
         * Does Swapping (Most Recently Used)
         * @param inPid the pid of the incoming process
         * @param outPid the pid of the outgoing process
         */
        public swap(inPid: number, outPid: number) {
            // Finds the location of the process to be swapped
            let swapMemoryLoc = parseInt(Object.keys(this.memoryMap).find(key => this.memoryMap[key] === outPid));

            // Puts the process to be swapped out into memory
            let outDataArray = new Array(256);
            for(let address = 0x100 * swapMemoryLoc; address < (0x100 * swapMemoryLoc) + 0x100; address++) {
                outDataArray[address - (0x100 * swapMemoryLoc)] =
                    _MemoryAccessor.getDataImmediate(address).toString(16).padStart(2, "0");
            }

            // Puts the outgoing process on the disk
            let dataArray = new Array(256).fill("00");

            for(let dataItemNum = 0; dataItemNum < outDataArray.length; dataItemNum++) {
                dataArray[dataItemNum] = outDataArray[dataItemNum];
            }

            _krnDiskDriver.create("~" + outPid);

            _krnDiskDriver.writeDirect("~" + outPid, dataArray);

            // Brings the process to be swapped in into memory
            let inDataArray = _krnDiskDriver.readDirect("~" + inPid);
            _krnDiskDriver.delete("~" + inPid);

            // Rewrites the memory block with all zeros
            for (let arrayElemNum = 0; arrayElemNum < 0x100; arrayElemNum++) {
                _MemoryAccessor.writeImmediate(swapMemoryLoc * 0x100 + arrayElemNum, 0x00);
            }

            // Writes the input data in memory
            for (let arrayElemNum = 0; arrayElemNum < inDataArray.length; arrayElemNum++) {
                _MemoryAccessor.writeImmediate(swapMemoryLoc * 0x100 + arrayElemNum, parseInt(inDataArray[arrayElemNum], 16));
            }

            this.memoryMap[swapMemoryLoc] = inPid;

            readyQueue[0].baseRegister = swapMemoryLoc * 0x100;
            readyQueue[0].limitRegister = (swapMemoryLoc * 0x100) + 0x100;
            readyQueue[0].pc = (readyQueue[0].pc % 0x100) + readyQueue[0].baseRegister;
        }

        /**
         * Terminates the process
         * @param terminatePid the pid for the process to be terminated
         */
        public terminateProcess(terminatePid: number) {
            terminatedList.push(terminatePid);

            // Finds the location for the terminated process in the memoryMap
            let terminatedProcessLocation =
                Object.keys(_MemoryManager.memoryMap)
                    .find(key => _MemoryManager.memoryMap[key] == terminatePid);
            _MemoryManager.memoryMap[terminatedProcessLocation] = -1;

            if (readyQueue.length != 0) {
                readyQueue[0].getContext(_CPU);
            }
            else {
                _CPU.isExecuting = false;
                _MemoryManager.executingPid = -1;
            }

            // Checks if there is a process on disk, and fetches the first of such processes to fill
            // in the new memory vacancy
            let queueOrder = -1;

            for(let processNum = 0x0; processNum < readyQueue.length; processNum++) {
                if(readyQueue[processNum].location == "Disk") {
                    queueOrder = processNum;
                    break;
                }
            }

            if(queueOrder > -1) {
                let inPid = readyQueue[queueOrder].pid;
                // Brings the process to be swapped in into memory
                let inDataArray = _krnDiskDriver.readDirect("~" + inPid);
                _krnDiskDriver.delete("~" + inPid);

                // Rewrites the memory block with all zeros
                for (let arrayElemNum = 0; arrayElemNum < 0x100; arrayElemNum++) {
                    _MemoryAccessor.writeImmediate(parseInt(terminatedProcessLocation) * 0x100 + arrayElemNum, 0x00);
                }

                // Writes the input data in memory
                for (let arrayElemNum = 0; arrayElemNum < inDataArray.length; arrayElemNum++) {
                    _MemoryAccessor.writeImmediate(parseInt(terminatedProcessLocation) * 0x100 + arrayElemNum, parseInt(inDataArray[arrayElemNum], 16));
                }

                this.memoryMap[parseInt(terminatedProcessLocation)] = inPid;

                readyQueue[queueOrder].baseRegister = parseInt(terminatedProcessLocation) * 0x100;
                readyQueue[queueOrder].limitRegister = (parseInt(terminatedProcessLocation) * 0x100) + 0x100;
                readyQueue[queueOrder].pc = (readyQueue[queueOrder].pc % 0x100) + readyQueue[queueOrder].baseRegister;
                readyQueue[queueOrder].location = "Memory";
            }
        }
    }
}