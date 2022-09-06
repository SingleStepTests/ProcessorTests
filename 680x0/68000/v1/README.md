# 68000

Valid opcodes are bucketed by operation; slightly more than 8,000 tests per operation are provided, giving a total of a little over 1,000,000 tests.

Further:
* 99% of the time, all address pointers begin the test with word-aligned values; and
* a separate 99% of the time, the processor begins the test in supervisor mode.

Sample test:

	{
		"name": "e3ae [LSL.l D1, D6] 5",
		"initial": {
			"d0": 727447539,
			"d1": 123414203,
			"d2": 2116184600,
			"d3": 613751030,
			"d4": 3491619782,
			"d5": 3327815506,
			"d6": 2480544920,
			"d7": 2492542949,
			"a0": 2379291595,
			"a1": 1170063127,
			"a2": 3877821425,
			"a3": 480834161,
			"a4": 998208767,
			"a5": 2493287663,
			"a6": 1026412676,
			"usp": 1546990282,
			"ssp": 2048,
			"sr": 9994,
			"pc": 3072,
			"prefetch": [58286, 50941],
			"ram": [
				[3077, 34],
				[3076, 42]
			]
		},
		"final": {
			"d0": 727447539,
			"d1": 123414203,
			"d2": 2116184600,
			"d3": 613751030,
			"d4": 3491619782,
			"d5": 3327815506,
			"d6": 0,
			"d7": 2492542949,
			"a0": 2379291595,
			"a1": 1170063127,
			"a2": 3877821425,
			"a3": 480834161,
			"a4": 998208767,
			"a5": 2493287663,
			"a6": 1026412676,
			"usp": 1546990282,
			"ssp": 2048,
			"sr": 9988,
			"pc": 3074,
			"prefetch": [50941, 10786],
			"ram": [
				[3077, 34],
				[3076, 42]
			]
		},
		"length": 126,
		"transactions": [
			["r", 4, 6, 3076, ".w", 10786],
			["n", 122]
		]
	}

`name` is provided for human consumption and has no formal meaning.

`initial` is the initial state of the processor:
* `d0`–`d7` are the data registers;
* `a0`–`a6` are the fixed address registers;
* `usp` is the user stack pointer;
* `ssp` is the supervisor stack pointer;
* `sr` is the status register;
* `pc` is the formal program counter, providing a pointer to the location that the next instruction resides at;
* `prefetch` is the current contents of the prefetch queue, with the first item having been fetched earlier than the second; and
* `ram` contains a list of byte values to store in memory prior to execution, each one in the form `[address, value]`.

`final` is the state of the processor and relevant memory contents after execution.

`length` provides the total number of cycles spent in this instruction.

`transactions` provides a list of bus transactions that occurred during execution, in one of two forms:
* `["n", 122]` indicates an idle bus for a duration of 122 cycles;
* `["r", 4, 6, 3076, ".w", 10786]` indicates:
  * `"r"` indicates that the cycle was a read. Other options are `"w"` for a write, or `"t"` for a TAS indivisible read-modify-write;
  * `4` is the length in cycles of the transaction;
  * `6` is the posted function code for this transaction — bit 0 is FC0, bit 1 is FC1 and bit 2 is FC2;
  * `3072` is the address posted for this operation;
  * `".w"` indicates that this was a word access. The alternative is `".b"` for a byte access; and
  * `10786` is the value on the data bus during the transaction. If it was a TAS cycle, it is the final value as written; before and after can be verified via before-and-after RAM state.

All cycle counts assume an immediate DTACK.
	
For byte accesses:
* you can infer UDS or LDS by inspecting the lowest bit of the posted address; and
* the value recorded is that from whichever half of the bus was active — so it'll always be in the range 0 to 255.