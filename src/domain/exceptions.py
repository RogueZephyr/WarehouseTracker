class DomainError(Exception):
    """Base class for domain-layer exceptions."""

    def __init__(self, message: str, code: str = "DOMAIN_ERROR", **kwargs):
        self.message = message
        self.code = code
        self.details = kwargs
        super().__init__(message)


class InvariantViolationError(DomainError):
    """Raised when a domain invariant (always-true rule) is violated."""

    def __init__(self, message: str, **kwargs):
        super().__init__(message, code="INVARIANT_VIOLATION", **kwargs)


class RouteConflictError(DomainError):
    """Raised when a route concurrency rule is violated."""

    def __init__(self, message: str, **kwargs):
        super().__init__(message, code="ROUTE_CONFLICT", **kwargs)
