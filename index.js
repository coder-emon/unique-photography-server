const { MongoClient, ServerApiVersion } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000



// middle ware 
app.use(cors())
app.use(express.json())
// app.use(express.urlencoded({ extended: true }));



// const uri = `mongodb+srv://${process.env.user}:${process.env.password}@cluster0.ixsnvhr.mongodb.net/?retryWrites=true&w=majority`;
const uri = "mongodb://127.0.0.1:27017"
const client = new MongoClient(uri);

async function dbConnect() {
    try {
        await client.connect(err => {
            // perform actions on the collection object
            console.log("db connected");

        });
    }
    catch (err) {
        console.error(err);
    }
}


dbConnect().catch(err => console.error(err))
const servicesCollection = client.db("uniquePhotgraphy").collection("services");
const reviewsCollection = client.db("uniquePhotgraphy").collection("reviews");

app.get("/", (req, res) => {
    res.send("Server is running")
})
app.post("/services", async (req, res) => {
    try {
        const services = req.body

        const user = await servicesCollection.insertOne(services)
        res.send(user)
    }
    catch (err) {
        console.error(err)
    }

})
app.get("/services", async (req, res) => {
    try {
        const query = {}
        const quantity = parseInt(req.query.quantity)
        console.log(quantity);
        const cursor = servicesCollection.find(query)
        let services;
        if (quantity) {
            services = await cursor.limit(quantity).toArray()
        } else {
            services = await cursor.toArray()
        }
        res.send(services)
    }
    catch (err) {
        console.error(err)
    }
})
app.get("/servicesbyemail", async (req, res) => {
    try {
        const email = req.params.email
        const query = { email: email }
        const cursor = servicesCollection.find(query)
        const services = await cursor.toArray()
        res.send(services)
    }
    catch (err) {
        console.error(err)
    }
})

app.listen(port, () => {
    client.connect((err) => {
        if (err) {
            console.log(err)
        }
        else {
            console.log("Connected to MongoDB")
        }
    })


    console.log("server is running on port", port)
})
