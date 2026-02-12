const ApiError = require('../utils/apiError');

const errorHandler = (err, req, res, next) => {
    let error = err;

    // Convert non-operational errors to operational error
    if (!(error instanceof ApiError)) {
        const statusCode = error.statusCode || 500;
        const message = error.message || 'Something went wrong';
        error = new ApiError(statusCode, message, false, err.stack);
    }

    const response = {
        statusCode: error.statusCode,
        message: error.isOperational ? error.message : 'Something went wrong', // Hide operational details for generic errors
        ...(process.env.NODE_ENV === 'development' && { stack: error.stack }), // Include stack in dev
    };

    console.error(error); // Log the full error for debugging

    res.status(error.statusCode).send(response);
};

module.exports = errorHandler;
