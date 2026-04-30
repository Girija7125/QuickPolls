require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const pollRoutes = require('./src/routes/pollRoutes');
const cors = require('cors');

const app= express();


app.use(express.json());

if(!process.env.JWT_SECRET){
    console.error('ERROR: JWT_SECRET is not in .env file. server stopped');
    process.exit(1);
}

app.use(cors({
    origin:process.env.FRONTEND_URL
}))

mongoose.connect(process.env.MONGO_URI).then(()=>{
    console.log("MOngoDB Connected Successfully");

    app.use("/api",pollRoutes);


    app.listen(3000,()=>{
        console.log("Server is Running On port 3000");
        
    })
    
}).catch(err => {
    console.log("MongoDB Connection Error:", err);
  });
