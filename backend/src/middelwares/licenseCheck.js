module.exports = (request, response, next) => {
    const licenseKey = request.headers["x-api-key"];
    if (request.originalUrl.startsWith("/uploads/") || licenseKey === process.env.X_API_KEY) {
        next();
    } else {
        response.status(401).json({
            status: false,
            message: "Please provide valid x-api-key.",
            data: []
        })
    }
}