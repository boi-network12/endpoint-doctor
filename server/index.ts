import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from 'cors';

// apiroutes import
// setup clean uphandle
// error handle
// caching

const app = express();

// CORS config
const corsOption = {
    origin: [''],
    credential: true,
    optionsSuccessStatus: 200
}

// Middlewares 


// ROutes




// global error handler
app.use((err: any,req: any,res: any,next: any) => {
    const status = err.status || 500;
    const message = err.message || "Something went wrong";
    res.status(status).json({
        success: false,
        status,
        message
    })
})

// PORT
const PORT = process.env.PORT || 5000;

// Server listen
app.listen(PORT,() => {
    console.log(`Server is running on port ${PORT}`)
})
