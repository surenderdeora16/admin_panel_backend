require("dotenv").config();
require('./src/database/connect');
const express = require('express');
const cors = require('cors');
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const cookieParser = require('cookie-parser');
    
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
// const csurf = require("csurf");
const winston = require("winston");
const { seedDatabase } = require('./src/database/seed');

const app = express();

// Logger setup
const logger = winston.createLogger({
    transports: [new winston.transports.File({ filename: "logs/error.log", level: "error" })],
});



// CORS configuration
const allowedOrigins = [process.env.FRONTEND_URL || "http://localhost:5173"];

const corsOptionsDelegate = (req, callback) => {
    const origin = req.header('Origin');

    if (!origin || allowedOrigins.includes(origin)) {
        callback(null, { origin: true, credentials: true });
    } else {
        callback(new Error("CORS policy violation: Origin not allowed"));
    }
};

app.use(cors(corsOptionsDelegate));

// Security middlewares
// app.use(helmet());
// app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

app.use(express.json({ type: "application/json", limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser({}));
// app.use(csurf({ cookie: { httpOnly: true, secure: process.env.IS_HTTPS === "true" } }));


// Static Files
app.use("/uploads", express.static('public/uploads'));
app.all("/uploads/*", (req, res) => res.sendFile(path.resolve(__dirname, './public/uploads/img-not-found.png')));


// Routes
app.get("/", async (req, res) => res.json({ status: true, message: "Api Working fine..!!" }));
app.use('/api-v1', require('./src/routes/index.routes'));



// Seed database route (optional, remove if you want to run separately)
app.get('/seed-database', async (req, res) => {
    try {
      await seedDatabase();
      res.json({ status: true, message: "Database seeded successfully" });
    } catch (error) {
      res.status(500).json({ status: false, message: "Database seeding failed" });
    }
  });

// Error handling
app.use((err, req, res, next) => {
    logger.error(`${req.method} ${req.url} - ${err.message}`);
    res.status(500).json({ status: false, message: "Something went wrong.", data: [] });
});



const PORT = parseInt(process.env.PORT) || 3000;
const httpServer = http.createServer(app);

if (process.env.IS_HTTPS === 'true') {
    https.createServer({
        // key: fs.readFileSync(process.env.CERTIFICATE_KEY_FILE_PATH),
        // cert: fs.readFileSync(process.env.CERTIFICATE_FILE_PATH),
        // ca: fs.readFileSync(process.env.CERTIFICATE_BUNDLE_FILE_PATH),

        // key: fs.readFileSync('/etc/ssl/param.life/param.life.key'),
        // cert: fs.readFileSync('/etc/ssl/param.life/param.life.crt'),
        // ca: fs.readFileSync('/etc/ssl/param.life/param.life-bundle.crt')
    }, app).listen(PORT, () => console.log(`https Server is running on port ${PORT}.`));
} else {
    httpServer.listen(PORT, () => console.log(`http Server is running on port ${PORT}.`));
}

