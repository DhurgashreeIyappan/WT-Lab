const express = require("express");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const path = require("path");
const { watch } = require("fs");
require("dotenv").config();

const app = express();
const PORT = 5000;
const uri = process.env.MONGO_URI || "mongodb://localhost:27017";
const client = new MongoClient(uri);

app.use(cors());
app.use(express.json()); 
app.use(express.static(path.join(__dirname, "public")));


async function connectDB() {
    if (!client.topology || !client.topology.isConnected()) {
        await client.connect();
        console.log("Connected to MongoDB");
    }
    return client.db("form");
}


app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.post("/register", async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection("details");
        const result = await collection.insertOne(req.body);
        res.status(201).json({ success: true, insertedId: result.insertedId });
    } catch (error) {
        console.error("Error saving user:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get("/user/:roll_no", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("form");
        const collection = db.collection("details");
        const user = await collection.findOne({ roll_no: req.params.roll_no });

        if (user) {
            res.json({ success: true, user });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

app.put("/update", async (req, res) => {
    try {
        await client.connect();
        const db = client.db("form");
        const collection = db.collection("details");

        const { roll_no, ...updatedData } = req.body;

        const result = await collection.updateOne(
            { roll_no: roll_no },
            { $set: updatedData }
        );

        if (result.matchedCount > 0) {
            res.json({ success: true, message: "Details updated successfully!" });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.get("/read/:roll_no", async (req, res) => {
    try {
        const db = await connectDB();
        const collection = db.collection("details");
        const roll_no = req.params.roll_no;

        const user = await collection.findOne({ roll_no });

        if (user) {
            res.json({ success: true, user });
        } else {
            res.status(404).json({ success: false, message: "User not found" });
        }
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});


app.delete("/delete/:roll_no", async (req, res) => {
    try {
        const db = await connectDB();  
        const collection = db.collection("details");
        const roll_no = req.params.roll_no;

        console.log(`Deleting user with Roll No: ${roll_no}`);

        const result = await collection.deleteOne({ roll_no });

        if (result.deletedCount > 0) {
            res.json({ success: true, message: "User deleted successfully!" });
        } else {
            res.json({ success: false, message: "User not found" });
        }
    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({ success: false, error: error.message });
    }
});



app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});


