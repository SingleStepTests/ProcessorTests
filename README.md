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

Human fallibility means that some discrepancies may still remain so all test sets are manually versioned, into v1, v2, etc, and notes on known discrepancies in the previous sets will be added when updates are published. This should cause the useful test quantity to grow over time, as well as hand-waving away any potential issues over the long term with repeatable random generation.

As a corollary: please report any discrepancies uncovered, either as an issue or via a correcting pull request.

## Other Test Sets

For similar test sets from other, see:
* https://github.com/adtennant/gameboy-test-data for the Game Boy; and
* https://github.com/raddad772/jsmoo/tree/main/misc/tests/GeneratedTests for the Z80, and a separate instance of the SPC 700 tests contributed here.
