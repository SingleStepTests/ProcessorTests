# 68000

Valid opcodes are bucketed by operation; slightly more than 8,000 tests per operation are provided, giving a total of a little over 1,000,000 tests.

Further:
* 99% of the time, all address pointers begin the test with word-aligned values; and
* a separate 99% of the time, the processor begins the test in supervisor mode.

Sample test:

	{
		"name": "e376 [ROXL.w D1, D6] 4",
		"initial": {
			"d0": 2597437614,
			"d1": 1859225450,
			"d2": 1340472931,
			"d3": 3065853194,
			"d4": 3963669262,
			"d5": 1016844446,
			"d6": 3985174945,
			"d7": 78238491,
			"a0": 3380616222,
			"a1": 85315585,
			"a2": 1212848964,
			"a3": 1212222308,
			"a4": 1291036887,
			"a5": 327682288,
			"a6": 2186860863,
			"usp": 355803596,
			"ssp": 2048,
			"sr": 9998,
			"pc": 3072,
			"prefetch": [58230, 38270],
			"ram": [
				[3077, 58],
				[3076, 150]
			]
		},
		"final": {
			"d0": 2597437614,
			"d1": 1859225450,
			"d2": 1340472931,
			"d3": 3065853194,
			"d4": 3963669262,
			"d5": 1016844446,
			"d6": 3985154424,
			"d7": 78238491,
			"a0": 3380616222,
			"a1": 85315585,
			"a2": 1212848964,
			"a3": 1212222308,
			"a4": 1291036887,
			"a5": 327682288,
			"a6": 2186860863,
			"usp": 355803596,
			"ssp": 2048,
			"sr": 10009,
			"pc": 3074,
			"prefetch": [38270, 38458],
			"ram": [
				[3077, 58],
				[3076, 150]
			]
		},
		"length": 4,
		"transactions": [
			["r", 4, 6, 3076, ".w", 38458]
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
* `["n", 123]` indicates an idle bus for a duration of 123 cycles;
* `["r", 4, 6, 3076, ".w", 38458]` indicates:
  * `"r"` indicates that the cycle was a read. Other options are `"w"` for a write, or `"t"` for a TAS atomic read-modify-write;
  * `4` is the length in cycles of the transaction;
  * `6` is the posted function code for this transaction — bit 0 is FC0, bit 1 is FC1 and bit 2 is FC2;
  * `3072` is the address posted for this operation;
  * `".w"` indicates that this was a word access. The alternative is `".b"` for a byte access; and
  * `38458` is the value on the data bus during the transaction.

All cycle counts assume an immediate DTACK.
	
For byte accesses:
* you can infer UDS or LDS by inspecting the lowest bit of the posted address; and
* the value recorded is that from whichever half of the bus was active — so it'll always be in the range 0 to 255.