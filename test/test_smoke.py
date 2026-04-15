"""Smoke tests for the Python test suite.

Those tests are intended to verify that the test runner can execute tests,
and that the test suite is properly configured.

They are not intended to verify any specific functionality of the codebase.

Copyright (c) 2026 EasyRota
"""


def test_smoke() -> None:
    """Verify the test runner can execute a basic passing test."""
    assert True
