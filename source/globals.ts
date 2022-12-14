/* ------------
   Globals.ts

   Global CONSTANTS and _Variables.
   (Global over both the OS and Hardware Simulation / Host.)

   This code references page numbers in our text book:
   Operating System Concepts 8th edition by Silberschatz, Galvin, and Gagne.  ISBN 978-0-470-12872-5
   ------------ */

//
// Global CONSTANTS (TypeScript 1.5 introduced const. Very cool.)
//

const APP_NAME: string    = "zerOS";   // 'cause Bob and I were at a loss for a better name.
const APP_VERSION: string = "1.0";   // What did you expect?

const CPU_CLOCK_INTERVAL: number = 100;   // This is in ms (milliseconds) so 1000 = 1 second.

const TIMER_IRQ: number = 0;  // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
							  // NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
const KEYBOARD_IRQ: number = 1;


//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
//
let _CPU: TSOS.Cpu;  // Utilize TypeScript's type annotation system to ensure that _CPU is an instance of the Cpu class.
let _Memory: TSOS.Memory;
let _MemoryAccessor: TSOS.MemoryAccessor;
let _MemoryManager: TSOS.MemoryManager;
let _CPUScheduler: TSOS.CpuScheduler;
let _CPUDispatcher: TSOS.CpuDispatcher;

let _OSClock: number = 0;  // Page 23.

let _Mode: number = 0;     // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.

let _Canvas: HTMLCanvasElement;          // Initialized in Control.hostInit().
let _DrawingContext: any;                // = _Canvas.getContext("2d");  // Assigned here for type safety, but re-initialized in Control.hostInit() for OCD and logic.
let _DefaultFontFamily: string = "sans"; // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
let _DefaultFontSize: number = 13;
let _FontHeightMargin: number = 4;       // Additional space added to font size when advancing a line.

let _Trace: boolean = true;              // Default the OS trace to be on.

// The OS Kernel and its queues.
let _Kernel: TSOS.Kernel;
let _KernelInterruptQueue: TSOS.Queue = null;
let _KernelInputQueue: TSOS.Queue = null;
let _KernelBuffers = null;

// Standard input and output
let _StdIn:  TSOS.Console = null;
let _StdOut: TSOS.Console = null;

// UI
let _Console: TSOS.Console;
let _OsShell: TSOS.Shell;

// At least this OS is not trying to kill you. (Yet.)
let _SarcasticMode: boolean = false;

// Global Device Driver Objects - page 12
let _krnKeyboardDriver: TSOS.DeviceDriverKeyboard  = null;

// Global Disk Driver Objects
let _krnDiskDriver: TSOS.DiskSystemDeviceDriver  = null;

let _hardwareClockID: number = null;

let isCtrl: boolean = false;

let residentList: TSOS.PCB[] = [];
let readyQueue: TSOS.PCB[] = [];
let terminatedList: number[] = [];
let waitAndTurnaroundTimeTable: Object = {};

// For testing (and enrichment)...
var Glados: any = null;  // This is the function Glados() in glados-ip*.js http://alanclasses.github.io/TSOS/test/ .
var _GLaDOS: any = null; // If the above is linked in, this is the instantiated instance of Glados.

let onDocumentLoad = function() {
	TSOS.Control.hostInit();
};
