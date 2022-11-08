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

                return "Process " + (this.pid++).toString() + " created.";
            } else {
                return "All memory locations are full. Clear memory before loading another program."
            }
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
    }
}