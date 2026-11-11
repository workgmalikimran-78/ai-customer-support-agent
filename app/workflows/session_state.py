"""Pure helper functions for merging/updating session variables across
flow-engine turns. Spring Boot passes session state in and out on every
call; this module has no external DB dependency."""
from typing import Any, Dict


def merge_variables(current: Dict[str, Any], updates: Dict[str, Any]) -> Dict[str, Any]:
    """Return a new dict with `updates` merged on top of `current`.

    Never mutates the input dicts.
    """
    merged = dict(current or {})
    merged.update(updates or {})
    return merged


def set_variable(variables: Dict[str, Any], key: str, value: Any) -> Dict[str, Any]:
    return merge_variables(variables, {key: value})


def clear_error(variables: Dict[str, Any]) -> Dict[str, Any]:
    if "lastError" not in (variables or {}):
        return dict(variables or {})
    merged = dict(variables)
    merged.pop("lastError", None)
    return merged
