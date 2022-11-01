/* ------------
   memoryManager.ts

   This virtual memory manager "allocates" and "deallocates" storage in memory..
   ------------ */
var TSOS;
(function (TSOS) {
    class CpuDispatcher {
        constructor() {
        }
        switchContext() {
            // If the current process is still running, puts it at the back if the ready queue
            if (readyQueue[0].state !== "Terminated") {
                readyQueue[0].saveContext(_CPU);
                readyQueue.push(readyQueue.shift());
                readyQueue[0].getContext(_CPU);
                _MemoryManager.executingPid = readyQueue[0].pid;
            }
            else {
                // Once the process is terminated, the process is removed from the readyQueue and the block
                // in memory where it is stored becomes available
                let terminatedProcess = readyQueue.shift();
                let terminatedProcessLocation = Object.keys(_MemoryManager.memoryMap)
                    .find(key => _MemoryManager.memoryMap[key] == terminatedProcess.pid);
                _MemoryManager.memoryMap[terminatedProcessLocation] = -1;
                if (readyQueue.length != 0) {
                    readyQueue[0].getContext(_CPU);
                }
                else {
                    _CPU.isExecuting = false;
                    _MemoryManager.executingPid = -1;
                }
            }
        }
        startRunning() {
            readyQueue[0].getContext(_CPU);
            _MemoryManager.executingPid = readyQueue[0].pid;
        }
    }
    TSOS.CpuDispatcher = CpuDispatcher;
})(TSOS || (TSOS = {}));
//# sourceMappingURL=cpuDispatcher.js.map