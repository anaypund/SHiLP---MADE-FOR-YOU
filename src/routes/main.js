const express = require('express');
const mongoose = require('mongoose');
const routes = express.Router();
const Path = require('path');
const { urlencoded } = require('body-parser');
const bodyParser = require('body-parser');
const { Console, log } = require('console');
require('dotenv').config()

//Models
const Products = require('../models/products')

routes.use(bodyParser.urlencoded({ extended: true }))
routes.use(bodyParser.json());
routes.use("/static",express.static("public"))

routes.get("/", async(req,res)=>{
    // Products.create([
    //     {
    //         productName: "Rose Agate Timepiece Resin Wall Clock",
    //         price: 1320,
    //         imagePath: "/static/images/Rose Agate Timepiece Resin Wall Clock.png",
    //         sellerName: "RT Dazzle Art",
    //         sellerID: "seller01",
    //         description: "Make a statement with our vibrant and colorful handmade resin wall clocks! Perfect for adding a pop of color to any room, or as a thoughtful gift for friends and family.",
    //         keyPoints: [
    //             "Handcrafted with care",
    //             "Material: Resin",
    //             "Size: 12 x 12 Inches",
    //             "Eco-friendly and sustainable"
    //         ],
    //         keyWords: ["clock", "resin", "wall clock", "beautiful"],
    //     },
    //     {
    //         productName: "Resin earring",
    //         price: 1320,
    //         imagePath: "/static/images/Resin earring.png",
    //         sellerName: "RT Dazzle Art",
    //         sellerID: "seller01",
    //         description: "Make a statement with our vibrant and colorful handmade resin wall clocks! Perfect for adding a pop of color to any room, or as a thoughtful gift for friends and family.",
    //         keyPoints: [
    //             "Handcrafted with care",
    //             "Material: Resin",
    //             "Size: 12 x 12 Inches",
    //             "Eco-friendly and sustainable"
    //         ],
    //         keyWords: ["clock", "resin", "wall clock", "beautiful"],
    //     },
    // ])
    res.status(200).render("index",{
        Product : await Products.find()
    });
})

module.exports = routes;