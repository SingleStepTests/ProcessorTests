This repository is in the process of being subdivided by test set and will subsequently be marked as archived; please watch https://github.com/orgs/SingleStepTests/repositories for progress.

# ProcessorTests

This repository contains tests for a variety of processors, provided as an aid to reimplementation.

Each test:
* requires execution of only a single instruction; and
* provides full processor and memory state before and after.

Tests are randomly generated, in substantial volume.

## Methodology

To generate each test set, an implementation is used that:
* conforms to all available documentation, official and third-party;
* passes all other published test sets; and
* has been verified by usage in an emulated machine.

In addition to the standard Git history, test sets are manually versioned to permit for potential future breaking changes in JSON format.

Please report any discrepancies uncovered, either as an issue or via a correcting pull request.

## Other Test Sets

For similar test sets from other, see:
* https://github.com/adtennant/gameboy-test-data for the Game Boy; and
* https://github.com/raddad772/jsmoo/tree/main/misc/tests/GeneratedTests for the Z80, and a separate instance of the SPC 700 tests contributed here.
