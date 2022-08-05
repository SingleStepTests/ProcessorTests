# SPC700

The SPC700 is a wavetable-based stereo audio processor found in the Super Nintendo which couples a 16-bit DSP to an 8-bit processor with an instruction set inspired by the 6502.

## Source

The generator for these tests has been contributed by David Schneider; a static capture of it is included in this repository but the authoritative original can be found as part of JSMoo: https://github.com/raddad772/jsmoo

One generated set of tests is also included.

## Format

1,000 tests are captured per opcode; arbitrarily more can be obtained via the generator.

Sample test:

	{
		"name": "F1 0009",
		"initial": {
			"pc": 57128,
			"a": 140,
			"x": 47,
			"y": 91,
			"sp": 139,
			"psw": 246,
			"ram": [
				[394, 0],
				[395, 0],
				[57128, 241],
				[57129, 248],
				[65472, 175],
				[65473, 94]
			]
		},
		"final": {
			"a": 140,
			"x": 47,
			"y": 91,
			"sp": 137,
			"pc": 24239,
			"psw": 246,
			"ram": [
				[394, 41],
				[395, 223],
				[57128, 241],
				[57129, 248],
				[65472, 175],
				[65473, 94]
			]
		},
		"cycles": [
			[57128, 241, "read"],
			[57129, 248, "read"],
			[null, null, "wait"],
			[395, 223, "write"],
			[394, 41, "write"],
			[null, null, "wait"],
			[65472, 175, "read"],
			[65473, 94, "read"]
		]
	}

`name` is provided for human consumption and has no formal meaning.

`initial` is the initial state of the processor; `ram` contains a list of values to store in memory prior to execution, each one in the form `[address, value]`.

`final` is the state of the processor and relevant memory contents after execution.

`cycles` provides a cycle-by-cycle breakdown of bus activity in the form `[address, value, type]` where `type` is one of:
* `read`;
* `write`; or
* `wait`.