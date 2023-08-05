# 65816

20,000 tests are provided per opcode; 10,000 in native mode and 10,000 in emulated mode. All tests assume a full 16mb of RAM is available to the processor and that the machine is using a single address space.

Sample test:

    {
    	"name": "3d e 1",
    	"initial": {
    		"pc": 9900,
    		"s": 2191,
    		"p": 171,
    		"a": 25345,
    		"x": 100,
    		"y": 124,
    		"dbr": 26,
    		"d": 50304,
    		"pbr": 111,
    		"e": 1,
    		"ram": [
    			[1751932, 14],
    			[7284398, 187],
    			[7284397, 24],
    			[7284396, 61]
    		]
    	},
    	"final": {
    		"pc": 9903,
    		"s": 2191,
    		"p": 43,
    		"a": 25344,
    		"x": 100,
    		"y": 124,
    		"dbr": 26,
    		"d": 50304,
    		"pbr": 111,
    		"e": 1,
    		"ram": [
    			[1751932, 14],
    			[7284398, 187],
    			[7284397, 24],
    			[7284396, 61]
    		]
    	},
    	"cycles": [
    		[7284396, 61, "dp-remx-"],
    		[7284397, 24, "-p-remx-"],
    		[7284398, 187, "-p-remx-"],
    		[1751932, 14, "d--remx-"]
    	]
    }

`name` is provided for human consumption and has no formal meaning.

`initial` is the initial state of the processor; `ram` contains a list of values to store in memory prior to execution, each one in the form `[address, value]`.

`final` is the state of the processor and relevant memory contents after execution.

`cycles` provides a cycle-by-cycle breakdown of bus activity in the form `[address, value, outputs]` where output is a sequence of characters, in the order:

* `d` if VDA is active, otherwise `-`;
* `p` if VPA is active, otherwise `-`;
* `v` if VPB is active, otherwise `-`;
* `r` if RWB signalled a read, otherwise `w`;
* `e` if E is active, otherwise `-`;
* `m` if MX indicated M was active, otherwise `-`;
* `x` if MX indicated X was active, otherwise `-`; and
* `l` if MLB is active, otherwise `-`.

So e.g. `d--remx-` means that VDA was active, VPA and VPB were inactive, RWB signalled a read, E, M and X were active and MLB was inactive.

The environment used does not activate RAM unless one of VDA, VPA or VPB is active, therefore affected bus transactions with the read line set do not produce a `value`. `null` is recorded in its place.
