class HttpError extends Error {
    constructor(message, errorCode, error) {
        if (error) console.log(error)
        super(message);
        this.code = errorCode;
    }
}

module.exports = HttpError;