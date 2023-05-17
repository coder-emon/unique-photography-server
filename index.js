const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const express = require('express');
const cors = require('cors');
require('dotenv').config()
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000



// middle ware 
app.use(cors())
app.use(express.json())
// app.use(express.urlencoded({ extended: true }));



// const uri = `mongodb+srv://${process.env.user}:${process.env.password}@cluster0.ixsnvhr.mongodb.net/?retryWrites=true&w=majority`;
const uri = "mongodb://127.0.0.1:27017"
const client = new MongoClient(uri);

function verifyJWT (req, res, next) {
    const authHeader = req.headers.authorization
    if(!authHeader){
        return res.status(401).send({message:"Unauthorized access"})
    }
    const token = authHeader.split(" ")[1]
    jwt.verify(token, process.env.Access_Token, function(err, decoded){
        if(err){
            return res.status(401).send({message:"Unauthorized access"})
        }
        req.decoded = decoded
        next()
    })

}
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
app.post("/jwt", (req, res) => {
    const user = req.body
    const token = jwt.sign(user, process.env.Access_Token, {expiresIn: "10h"})
   res.send({token})
})
app.post("/services",verifyJWT, async (req, res) => {
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
        const size = parseInt(req.query.size)
        const page = parseInt(req.query.page)
        const query = {}
        const quantity = parseInt(req.query.quantity)
        console.log(quantity);
        const cursor = servicesCollection.find(query).skip(size*page).limit(size).sort({price:-1})
        const count = await servicesCollection.estimatedDocumentCount()
        let services;
        if (quantity) {
            services = await cursor.limit(quantity).toArray()
        } else {
            services = await cursor.toArray()
        }
        res.send({services, count})
    }
    catch (err) {
        console.error(err)
    }
})
app.get("/servicesbyemail",verifyJWT, async (req, res) => {
    try {
        const decoded = req.decoded
        console.log(decoded)
        const email = req.query.email
        const query = { email: email }
        if(decoded.email !== query.email){
            res.status(403).send({message:"Forbidden Access"})
        }
        // console.log(query);
        const cursor = servicesCollection.find(query)
        const services = await cursor.toArray()
        res.send(services)
    }
    catch (err) {
        console.error(err)
    }
})
app.get("/service/:id", async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const service = await servicesCollection.findOne(query)
        res.send(service)
    }
    catch (err) {
        console.error(err)
    }
})
app.put("/service/:id",verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const service = req.body
        const options = {
            upsert: true,
        }
        const updatedService = {
            $set: service
        }
        const result = await servicesCollection.updateOne(query, updatedService, options)
        res.send(result)
    }
    catch (err) {
        console.error(err)
    }
})
app.patch("/service/:id",verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const {avgRating} = req.body
        
        const updatedService = {
            $set: {
                avgRating
            }
        }
        const result = await servicesCollection.updateOne(query, updatedService)
        res.send(result)
    }
    catch (err) {
        console.error(err)
    }
})
app.delete("/service/:id",verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const query = { _id: ObjectId(id) }
        const result = await servicesCollection.deleteOne(query)
        res.send(result)
    }
    catch (err) {
        console.error(err)
    }
})
app.post("/reviews/",verifyJWT, async (req, res) => {
    try {
        const review = req.body
        const result = await reviewsCollection.insertOne(review)
        res.send(result)
    }
    catch (err) {
        console.error(err)
    }
})

app.get("/reviews/",verifyJWT,  async (req, res) => {
    try {
        const decoded = req.decoded
        const email = req.query.email
        const query = {usermail:email  }
        if(decoded.email !== query.usermail){
            res.status(401).send({message:"Unauthorized access"})
        }
        const cursor = reviewsCollection.find(query).sort({dateNum:1})
        const result = await cursor.toArray()
        res.send(result)
    }
    catch (err) {
        console.error(err)
    }
})
app.get("/review/:id", async (req, res) => {
    try {
        const id = req.params.id
        const query = { service_id: id }
        const cursor = reviewsCollection.find(query).sort({dateNum:-1})
        const result = await cursor.toArray()
        res.send(result)
    }
    catch (err) {
        console.error(err)
    }
})
app.get("/single-review/:id",verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const query = {_id: ObjectId(id) }
       
        const result = await reviewsCollection.findOne(query)
        res.send(result)
    }
    catch (err) {
        console.error(err)
    }
})
app.put("/single-review/:id",verifyJWT, async (req, res) => {
    try {
        const id = req.params.id
        const query = {_id: ObjectId(id) }
       const review = req.body
       const  options = {
        upsert:true
       }
       const updatedReview = {
            $set: review
       }
        const result = await reviewsCollection.updateOne(query, updatedReview, options)
        res.send(result)
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

