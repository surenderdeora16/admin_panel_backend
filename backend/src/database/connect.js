const mongoose = require("mongoose");

(async () => {
    try {
        let conn = await mongoose.connect(process.env.MONGO_URL)
        console.log(`Database Connected - ${conn.connections[0].host}:${conn.connections[0].port}`);
    } catch (error) {
        console.log(`Database Connection Error :: ${error.message}`);
    }
})()

module.exports = mongoose;