# NES 6502

The NES 6502 is a version of the 6502 that ignores the state of the decimal flag when performing arithmetic.

10,000 tests are provided per opcode. All tests assume a full 64kb of uniquely-mapped RAM is mapped to the processor; **this deviates from the actual memory layout of a NES** regardless of the cartridge in use.

Sample test:

	{
		"name": "b1 71 8b",
		"initial": {
			"pc": 9023,
			"s": 240,
			"a": 47,
			"x": 162,
			"y": 170,
			"p": 170,
			"ram": [
				[9023, 177],
				[9024, 113],
				[9025, 139],
				[113, 169],
				[114, 89],
				[22867, 214],
				[23123, 37]
			]
		},
		"final": {
			"pc": 9025,
			"s": 240,
			"a": 37,
			"x": 162,
			"y": 170,
			"p": 40,
			"ram": [
				[113, 169],
				[114, 89],
				[9023, 177],
				[9024, 113],
				[9025, 139],
				[22867, 214],
				[23123, 37]
			]
		},
		"cycles": [
			[9023, 177, "read"],
			[9024, 113, "read"],
			[113, 169, "read"],
			[114, 89, "read"],
			[22867, 214, "read"],
			[23123, 37, "read"]
		]
	}

`name` is provided for human consumption and has no formal meaning.

`initial` is the initial state of the processor; `ram` contains a list of values to store in memory prior to execution, each one in the form `[address, value]`.

`final` is the state of the processor and relevant memory contents after execution.

`cycles` provides a cycle-by-cycle breakdown of bus activity in the form `[address, value, type]` where `type` is either `read` or `write`.
