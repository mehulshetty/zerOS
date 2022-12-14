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
const APP_NAME = "zerOS"; // 'cause Bob and I were at a loss for a better name.
const APP_VERSION = "1.0"; // What did you expect?
const CPU_CLOCK_INTERVAL = 100; // This is in ms (milliseconds) so 1000 = 1 second.
const TIMER_IRQ = 0; // Pages 23 (timer), 9 (interrupts), and 561 (interrupt priority).
// NOTE: The timer is different from hardware/host clock pulses. Don't confuse these.
const KEYBOARD_IRQ = 1;
//
// Global Variables
// TODO: Make a global object and use that instead of the "_" naming convention in the global namespace.
//
let _CPU; // Utilize TypeScript's type annotation system to ensure that _CPU is an instance of the Cpu class.
let _Memory;
let _MemoryAccessor;
let _MemoryManager;
let _CPUScheduler;
let _CPUDispatcher;
let _OSClock = 0; // Page 23.
let _Mode = 0; // (currently unused)  0 = Kernel Mode, 1 = User Mode.  See page 21.
let _Canvas; // Initialized in Control.hostInit().
let _DrawingContext; // = _Canvas.getContext("2d");  // Assigned here for type safety, but re-initialized in Control.hostInit() for OCD and logic.
let _DefaultFontFamily = "sans"; // Ignored, I think. The was just a place-holder in 2008, but the HTML canvas may have use for it.
let _DefaultFontSize = 13;
let _FontHeightMargin = 4; // Additional space added to font size when advancing a line.
let _Trace = true; // Default the OS trace to be on.
// The OS Kernel and its queues.
let _Kernel;
let _KernelInterruptQueue = null;
let _KernelInputQueue = null;
let _KernelBuffers = null;
// Standard input and output
let _StdIn = null;
let _StdOut = null;
// UI
let _Console;
let _OsShell;
// At least this OS is not trying to kill you. (Yet.)
let _SarcasticMode = false;
// Global Device Driver Objects - page 12
let _krnKeyboardDriver = null;
// Global Disk Driver Objects
let _krnDiskDriver = null;
let _hardwareClockID = null;
let isCtrl = false;
let residentList = [];
let readyQueue = [];
let terminatedList = [];
let waitAndTurnaroundTimeTable = {};
// For testing (and enrichment)...
var Glados = null; // This is the function Glados() in glados-ip*.js http://alanclasses.github.io/TSOS/test/ .
var _GLaDOS = null; // If the above is linked in, this is the instantiated instance of Glados.
let onDocumentLoad = function () {
    TSOS.Control.hostInit();
};
//# sourceMappingURL=globals.js.map