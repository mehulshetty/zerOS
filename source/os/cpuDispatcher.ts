/* ------------
   memoryManager.ts

   This virtual memory manager "allocates" and "deallocates" storage in memory..
   ------------ */
module TSOS {
    export class CpuDispatcher {
        constructor() {
        }

        public switchContext() {

            // If the current process is still running, puts it at the back if the ready queue
            if (readyQueue[0].state !== "Terminated") {
                readyQueue[0].saveContext(_CPU);
                readyQueue[0].state = "Ready";
                readyQueue.push(readyQueue.shift());
                readyQueue[0].getContext(_CPU);
                readyQueue[0].state = "Running";
                _MemoryManager.executingPid = readyQueue[0].pid;
            }
            else {
                // Once the process is terminated, the process is removed from the readyQueue and the block
                // in memory where it is stored becomes available
                let terminatedProcess = readyQueue.shift();

                _StdOut.putText
                ("Process " + terminatedProcess.pid + " is terminated.");
                _StdOut.advanceLine();
                _StdOut.putText
                ("Wait Time: " + waitAndTurnaroundTimeTable[terminatedProcess.pid.toString()][0]);
                _StdOut.advanceLine();
                _StdOut.putText
                ("Turnaround Time: " + waitAndTurnaroundTimeTable[terminatedProcess.pid.toString()][1]);
                _StdOut.advanceLine();
                _StdOut.putText("> ");

                terminatedList.push(terminatedProcess.pid);
                let terminatedProcessLocation =
                    Object.keys(_MemoryManager.memoryMap)
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

        public startRunning() {
            readyQueue[0].state = "Running";
            readyQueue[0].getContext(_CPU);
            _MemoryManager.executingPid = readyQueue[0].pid;
        }
    }
}