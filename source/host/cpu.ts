/* ------------
     CPU.ts

     Routines for the host CPU simulation, NOT for the OS itself.
     In this manner, it's A LITTLE BIT like a hypervisor,
     in that the Document environment inside a browser is the "bare metal" (so to speak) for which we write code
     that hosts our client OS. But that analogy only goes so far, and the lines are blurred, because we are using
     TypeScript/JavaScript in both the host and client environments.

     This code references page numbers in the text book:
     Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
     ------------ */

module TSOS {

    export class Cpu {

        constructor(public memoryAccessor: TSOS.MemoryAccessor = null,
                    public brkFlag: number = 0x0,
                    public step: number = 0x0,
                    public IR: number = 0x00,
                    public carryFlag: number = 0x0,
                    public PC: number = 0x00,
                    public acc: number = 0x00,
                    public xReg: number = 0x00,
                    public yReg: number = 0x00,
                    public zFlag: number = 0x00,
                    public isExecuting: boolean = false) {
        }

        public init(): void {
            this.clearAll();
        }

        public connectMemoryAccessor(): void {
            this.memoryAccessor = _MemoryAccessor;
        }

        public cycle(): void {
            _Kernel.krnTrace('CPU cycle');
            // TODO: Accumulate CPU usage and profiling statistics here.
            // Do the real work here. Be sure to set this.isExecuting appropriately.
            if(this.isExecuting) {
                _CPUScheduler.schedule();
                this.pulse();
            }
        }

        /**
         * Increases cpuClockCount by 1 and displays the current clock count as a log message
         */
        pulse(): void {

            // Checks the current instruction and handles it accordingly
            switch (this.IR) {

                // Handles the Load Accumulator with Constant instruction
                case 0xA9:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.acc = this.fetch();
                            this.step = 0x0;
                    }
                    break;

                // Handles the Load Accumulator from Memory instruction
                case 0xAD:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x2:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x3:
                            this.acc = this.execute();
                            this.step = 0x0;
                    }
                    break;

                // Handles the Store the Accumulator in Memory instruction
                case 0x8D:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x2:
                            this.decode(this.fetch());
                            this.step += 0x3;
                        case 0x5:
                            this.writeBack(this.acc);
                    }
                    break;

                // Handles the Load the Accumulator from X Register instruction
                case 0x8A:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.acc = this.xReg;
                            this.step = 0x0;
                    }
                    break;

                // Handles the Load the Accumulator from Y Register instruction
                case 0x98:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.acc = this.yReg;
                            this.step = 0x0;
                    }
                    break;

                // Handles the Add with Carry (adds contents of an address to the accumulator and keeps the result in the accumulator) instruction
                case 0x6D:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x2:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x3:
                            this.adder(this.execute());
                            this.step = 0x0;
                    }
                    break;

                // Handles the Load X Register with a Constant instruction
                case 0xA2:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.xReg = this.fetch();
                            this.step = 0x0;
                    }
                    break;

                // Handles the Load X Register from Memory instruction
                case 0xAE:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x2:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x3:
                            this.xReg = this.execute();
                            this.step = 0x0;
                    }
                    break;

                // Handles the Load X Register from Accumulator instruction
                case 0xAA:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.xReg = this.acc;
                            this.step = 0x0;
                    }
                    break;

                // Handles the Load Y Register with a Constant instruction
                case 0xA0:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.yReg = this.fetch();
                            this.step = 0x0;
                    }
                    break;

                // Handles the Load Y Register from Memory instruction
                case 0xAC:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x2:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x3:
                            this.yReg = this.execute();
                            this.step = 0x0;
                    }
                    break;

                // Handles the Load Y Register from Accumulator instruction
                case 0xA8:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.yReg = this.acc;
                            this.step = 0x0;
                    }
                    break;

                // Handles the No Operation instruction
                case 0xEA:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.step = 0x0;
                    }
                    break;

                // Handles the Compare a Byte in Memory to the X Register and Set Zero Flag if Equal instruction
                case 0xEC:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x2:
                            this.decode(this.fetch());
                            this.step += 0x2;
                        case 0x4:
                            this.zFlag = this.execute(this.xReg);
                            this.step = 0x0;
                    }
                    break;

                // Handles the Branch 'n' Bytes if Zero Flag = 0 instruction
                case 0xD0:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            // If Zero Flag is set, then it loads the next instruction in the IR
                            if (this.zFlag == 1) {
                                this.fetch();
                            }
                            // If the Zero Flag is not set, then it changes the PC with the specified value
                            else {
                                this.branchAdder(this.fetch());
                            }
                            this.step = 0x0;
                    }
                    break;

                // Handles the Increment the Value of a Byte instruction
                case 0xEE:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x2:
                            this.decode(this.fetch());
                            this.step += 0x1;
                        case 0x3:
                            this.acc = this.execute();
                            this.step += 0x1;
                        case 0x4:
                            this.adder(0x1);
                            this.step += 0x1;
                        case 0x5:
                            this.writeBack(this.acc);
                    }
                    break;

                // Handles System Calls
                case 0xFF:
                    switch (this.step) {
                        case 0x0:
                            this.IR = this.fetch();
                            this.step += 0x1;
                            break;
                        case 0x1:
                            this.execute();
                        /**
                        case 0x2:
                            this.execute();
                         */
                    }
                    break;

                // Handles the Break instruction (and the first instruction)
                case 0x00:
                    // Loads the first instruction in memory and sets the Break Flag
                    if (this.brkFlag == 0x0) {
                        switch (this.step) {
                            case 0x00:
                                this.IR = this.fetch();
                                this.step += 0x1;
                                this.brkFlag++;
                        }
                    }
                    // SHUTS DOWN THE CPU (and by extension the System)
                    else {
                        // super.log("SYSTEM SHUTDOWN");
                        // process.exit(0);
                        this.clearAll();
                        _Console.advanceLine();
                        _OsShell.putPrompt();
                        readyQueue[0].state = "Terminated";
                        _CPUScheduler.currentQuantum = _CPUScheduler.quantum;
                    }
                    break;

                // Handles Invalid Op Code
                default:
                    _Console.advanceLine();
                    _Console.putText("Process Execution Error: Invalid Op Code <" + this.IR.toString(16) +
                        "> found in the process with PID " + readyQueue[0].pid + ". Process Terminated.");
                    this.clearAll();
                    _Console.advanceLine();
                    _OsShell.putPrompt();
                    readyQueue[0].state = "Terminated";
                    break;
            }

            // Increases the cpuClockCount by one
            // this.cpuClockCount++;
        }

        /**
         * FETCH - Sets the MMU with the address in the PC, increases the PC, and returns data from that address in memory
         */
        fetch(): number {
            this.memoryAccessor.setAddress(this.PC);
            this.PC++;
            return this.memoryAccessor.getData();
        }

        /**
         * DECODE - Decodes the memory address being sent to it and sets the low and high order bytes
         * @param data the data that will be decoded into lob or hob
         */
        decode(data: number): void {
            switch (this.step) {

                // Sets the Low Order Byte
                case 0x1:
                    this.memoryAccessor.setLowOrderByte(data);
                    break;

                // Sets the High Order Byte
                case 0x2:
                    this.memoryAccessor.setHighOrderByte(data);
                    this.memoryAccessor
                        .setAddress(this.memoryAccessor.getAddress() + this.memoryAccessor.getBaseValue());
                    break;
            }
        }

        /**
         * EXECUTE - Executes the instruction
         * @param value1 (optional) the value that has to be compared to a location in memory
         */
        execute(value1?: number): number {
            switch (this.step) {

                // Execute for System Call when xReg == 1 and Execute 1 for System Call when xReg == 2
                case 0x01:
                    switch (this.xReg) {

                        // For System Call when xReg == 1: Prints the number in the Y Register
                        case 0x01:
                            _StdOut.putText(this.yReg.toString(16).toUpperCase());
                            this.step = 0x0;
                            break;

                        // For System Call when xReg == 2:
                        // Sets the PCB with the values in the CPU and sets the PC with the address in the Y Register
                        case 0x02:
                            let tempPC = this.PC;

                            this.PC = this.yReg + this.memoryAccessor.getBaseValue();

                            // Fetches the next byte in memory
                            let data = this.fetch();

                            while(data !== 0x00) {
                                // If data not equal to 0x00, decodes the hexadecimal value in memory to its corresponding ASCII character and prints it
                                _Console.putText(String.fromCharCode(data));
                                data = this.fetch();
                            }

                            // If data is equal to 0x00, returns PC to its original state and sets contextPC back to 0x0000
                            this.PC = tempPC;
                            this.IR = this.fetch();
                            this.step = 0x1;
                    }
                    break;

                // Gets the data from the Memory from the address given in the address member in the MMU
                case 0x03:
                    if(this.memoryAccessor.getAddress() >= this.memoryAccessor.getBaseValue()
                        && this.memoryAccessor.getAddress() < this.memoryAccessor.getBaseValue() + 0x100) {
                        return this.memoryAccessor.getData();
                    }
                    else {
                        this.memoryAccessError();
                    }
                    break;

                // Checks if value1 is equal to a given location in memory
                case 0x04:
                    // Returns 0x1 if value1 is equal to the location in memory
                    let returnData = this.memoryAccessor.getData();
                    if (value1 == returnData) {
                        return 0x1;
                    }
                    // Returns 0x0 if value1 is not equal to the location in memory
                    else {
                        return 0x0;
                    }
            }
        }

        /**
         * WRITE BACK - Writes given data into memory based on the address specified in the address member of the MMU
         * @param data the data that has to be written into memory
         */
        writeBack(data: number): void {
            this.memoryAccessor.writeImmediate(this.memoryAccessor.getAddress(), data);
            this.step = 0x0;
        }

        /**
         * ADDER - Adds the parameter to the number in the accumulator
         * @param number the number to be added to the accumulator
         */
        adder(number: number): void {
            // Is executed if the carryFlag is set to 0x0
            if (this.carryFlag == 0x00) {
                // If there is a carry, sets the accumulator to last two digits of the answer and sets the carryFlag to 0x1
                if (this.acc + number > 0xFF) {
                    this.carryFlag = 0x1;
                    this.acc = this.acc + number - 0x100;
                }
                // If there is no carry, adds the number to the accumulator
                else {
                    this.acc += number;
                }
            }
            // Is executed if the carryFlag is set to 0x1
            else {
                // Sets the carry flag to 0x1 if there is another carry and sets the accumulator to last two digits of the answer
                if (this.acc + number + 0x01 > 0xFF) {
                    this.carryFlag = 0x1;
                    this.acc = this.acc + number + 0x01 - 0x100;
                }
                // If there is no extra carry, adds the number and the carry to the accumulator and sets carryFlag to 0x0
                else {
                    this.acc += number + 0x1;
                    this.carryFlag = 0x0;
                }
            }
        }

        /**
         * BRANCH ADDER - Adds the parameter to the Program Counter
         * @param number the number that has to be added to the program counter
         */
        branchAdder(number: number): void {

            let newPC = this.PC + number;

            if(newPC < this.memoryAccessor.getBaseValue() + 0x100) {
                this.PC = newPC;
            }
            else {
                this.PC = this.memoryAccessor.getBaseValue() + (newPC % 0x100);
            }
        }

        /**
         * Clears all the members of the CPU
         */
        public clearAll(): void {
            this.brkFlag = 0x0;
            this.step = 0x0;
            this.IR = 0x00;
            this.carryFlag = 0x0;
            this.PC = 0x00;
            this.acc = 0x00;
            this.xReg = 0x00;
            this.yReg = 0x00;
            this.zFlag = 0x0;
        }

        /**
         * Calls the BSOD when there's a memory access violation
         */
        public memoryAccessError(): void {
            _Kernel.krnTrapError("Memory Access Violation");
        }
    }
}
