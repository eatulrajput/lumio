class ApiError extends Error {
  constructor(
    statusCode,
    message = "Something went wrong",
    errors = [],
    stack = "" // Error stack
  ) {
    super(message); // override
    this.statusCode = statusCode;
    ((this.data = null), // what is this, read about it.
      (this.message = message));
    this.success = false; // false because you are handling errors, not response
    this.errors = errors;

    if (stack) {
      this.stack = stack;
    } else {
      Error.captureStackTrace(this, this.contructor);
    }
  }
}

export { ApiError };
