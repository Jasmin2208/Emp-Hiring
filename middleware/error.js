const errorMiddleware = (err, req, res, next) => {
  try {
    err.message ||= "Internal Server Error";
    err.statusCode ||= 500;

    return res.status(err.statusCode).json({
      status: "fail",
      message: err.message,
    });
  } catch (error) {
    return res.status(err.statusCode).json({
      error: true,
      message: err.message,
    });
  }
};

class ErrorHandler extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
  }
}

const TryCatch = (passedFunc) => async (req, res, next) => {
  try {
    await passedFunc(req, res, next);
  } catch (error) {
    console.log('Error:', error);
    next(new ErrorHandler(error.message, 500));
  }
}

module.exports = { errorMiddleware, ErrorHandler, TryCatch };
