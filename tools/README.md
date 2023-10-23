# JSON Utility scripts

These are some miscellaneous Python utilities for working with JSON test suites.

- addhash.py 
    - This utility will add a SHA256 hash to each test in a test collection. This provides a unique identifier for a test, which is often useful.
- extract.py
    - This utility will find and extract a specific test either by a hash created by the addhash utility, or its numeric index.
- remove.py
    - This utility will find and remove a specific test either by a hash created by the addhash utility, or its numeric index.
- subset.py
    - This utility will create a subset of larger test.
- checkdups.py
    - This utility will check a test suite for duplicate tests.