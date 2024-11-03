const express = require('express');
const mongoose = require('mongoose');
const routes = express.Router();
const Path = require('path');
const { urlencoded } = require('body-parser');
const bodyParser = require('body-parser');
const { Console, log } = require('console');
require('dotenv').config()
const Razorpay = require('razorpay'); 
const { RAZORPAY_ID_KEY, RAZORPAY_SECRET_KEY } = process.env;

const razorpay = new Razorpay({
    key_id: RAZORPAY_ID_KEY,
    key_secret: RAZORPAY_SECRET_KEY
});

//Models
const Products = require('../models/products')
const CartItem = require('../models/CartItem')
const Checkout = require('../models/Checkout')
const OrderID = require('../models/orderID')

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

routes.get("/product-details", async (req, res) => {
    const productId = req.query.id;
    try {
        const productArray = await Products.find({ _id: productId });
        const product = productArray[0]; // Access the first product document from the array
        const keyPoints = product.keyPoints;

        res.render('product-details', { product : productArray, keyPoints : keyPoints}); // Render a template for the product page
    } catch (error) {
        res.status(500).send('Product not found');
    }
})

routes.post("/cart", async (req, res) => {
    const productId = req.body.id
    const userId = 1
    try {
        // Check if item already exists in the cart for this user
        let cartItem = await CartItem.findOne({ userId: userId, productId: productId });
        
        if (cartItem) {
          // If item is already in the cart, increment the quantity
          cartItem.quantity += 1;
          await cartItem.save();
        } else {
          // Otherwise, create a new cart item
          cartItem = new CartItem({
            userId: userId,
            productId: productId,
            quantity: 1
          });
          await cartItem.save();
        }
        console.log("Added to cart")
        res.redirect('/cart'); // Redirect to the cart page
        res.status(200);
      } catch (error) {
        console.error(error);
        res.status(500).send("Error adding to cart");
      }
})

// routes/cart.js
routes.get('/cart', async (req, res) => {
    // const userId = req.session.userId; // Get the logged-in user's ID
    const userId = 1; // Get the logged-in user's ID
  
    try {
      // Populate cart items with product details
      const cartItems = await CartItem.find({ userId: userId }).populate('productId');
      let total = 0;
        cartItems.forEach(item => {
            total += item.productId.price * item.quantity;
        });
        console.log(total);
        res.render('cart', {
            cartItems: cartItems,
            total: total,
        });
    } catch (error) {
        console.error('Error fetching cart items:', error);
        res.status(500).send('Server Error');
    }
  });

  routes.post("/cart/update", async (req, res) => {
    const { productId, quantity } = req.body;
    const userId = 1
    try {
        if (quantity <= 0) {
        // Remove the item if quantity is 0
        await CartItem.deleteOne({ userId: userId, productId: productId });
        } else {
        // Otherwise, update the quantity
        await CartItem.findOneAndUpdate({ userId: userId, productId: productId }, { quantity });
        }
        res.redirect('/cart');
    } catch (error) {
        console.error(error);
        res.status(500).send("Error updating cart");
    }
  })
  
routes.get("/checkout/payment", async (req, res) => {
    const userId = Number(req.query.UserID)
    const orderId = String(req.query.OrderID)
    try {
        // Populate cart items with product details
        const cartItems = await CartItem.find({ userId: userId }).populate('productId');
        const costumer = await Checkout.findOne({ userId: userId, orderId: orderId})
        let shippingCharges = 100
        let subTotal = 0;
          cartItems.forEach(item => {
              subTotal += item.productId.price * item.quantity;
          });
        if(costumer.state == "MH" && costumer.city == "Amravati"){
            shippingCharges = 0
        }
        total = subTotal + shippingCharges
          res.render('payment', {
              cartItems: cartItems,
              userId: userId,
              subTotal: subTotal,
              shippingCharges: shippingCharges,
              total: total,
              name: costumer.name,
              email: costumer.email,
              contact: costumer.phoneNumber,
              orderId: costumer.orderId
          });
      } catch (error) {
          console.error('Error fetching cart items:', error);
          res.status(500).send('Server Error');
      }
})

routes.get('/checkout/shipping-info', async (req, res) => {
    userId = req.query.UserID
    res.render('shippingInfo', {
        userId: userId
    })
})

routes.post('/checkout/shipping-info', async (req, res) => {
    const {userId, name, phoneNumber, email, state, country, city, address, pincode} = req.body
    const checkout = await Checkout.findOne({ userId: userId, payFlag: false})
    
    const orderID = await OrderID.countDocuments({userId: userId});
    const orderid = new OrderID({
        userId: userId,
        id: String(orderID + 1)
    });
    const resultID = String(Number(orderID) + 1)
    const tempid = await orderid.save();

    const products = await CartItem.find({userId: userId})
    
    const productsOrdered = products.map(product => ({
        productId: product.productId,
        quantity: product.quantity
    }));
    
    if(checkout == null){
        try{
            const item = new Checkout({
                userId: userId,
                name: name,
                address: address,
                city: city,
                state: state,
                country: country,
                pinCode: pincode,
                payFlag: false,
                amount: 0,
                orderId: resultID,
                productsOrdered: productsOrdered,
                orderCompleted: false,
                email: email,
                phoneNumber: phoneNumber
            });
            const tempVar = await item.save();
            res.redirect(`/checkout/payment?UserID=${userId}&OrderID=${resultID}`)
        } catch (error) {
            console.error('Error adding customer information:', error);
        }
    }
    else{
        try {
            const result = await Checkout.updateOne(
                { userId: userId, payFlag: false},
                { 
                    $set: {
                        userId: userId,
                        name: name,
                        address: address,
                        city: city,
                        state: state,
                        country: country,
                        pinCode: pincode,
                        payFlag: false,
                        amount: 0,
                        orderId: resultID,
                        productsOrdered: productsOrdered,
                        orderCompleted: false,
                        email: email,
                        phoneNumber: phoneNumber
                    }
                }
            );
        
            if (result.matchedCount > 0) {
                console.log('Customer information updated successfully.');
            } else {
                console.log('No customer found with the specified userId.');
            }
            res.redirect(`/checkout/payment?UserID=${userId}&OrderID=${resultID}`)
        } catch (error) {
            console.error('Error updating customer information:', error);
        }
        
    }
});


routes.post('/create-order', async (req, res) => {
    const {currency, receipt, userId } = req.body;
    const cartItems = await CartItem.find({ userId: Number(userId) }).populate('productId');
        let shippingCharges = 100
        let subTotal = 0;
          cartItems.forEach(item => {
              subTotal += item.productId.price * item.quantity;
          });
        const costumer = await Checkout.find({ userId: Number(userId) })
        if(costumer.state == "MH" && costumer.city == "Amravati"){
            shippingCharges = 0
        }
        total = subTotal + shippingCharges
  
    try {
      const order = await razorpay.orders.create({
        amount: total * 100, // amount in the smallest currency unit
        currency,
        receipt,
        payment_capture: '1', // auto capture
      });
  
      res.json(order);
    } catch (error) {
      res.status(500).send({ error: error.message });
    }
  });

routes.post('/payment-success', async(req, res)=>{ 
    
   const {payment_id, amount, order_id, signature, userId, orderId} = req.body
   console.log("Order ID: ", orderId)
   const result = await Checkout.updateOne(
    { userId: Number(userId), orderId: String(orderId) },
    { 
        $set: {
            payFlag: true,
            amount: amount/100,
            orderId: String(order_id),
            orderCompleted: false,
            payment_id: payment_id
        }
    }
);
   console.log(payment_id, order_id, signature, userId)
//    res.status(200).redirect(`/payment-success?orderId=${order_id}`)
    res.status(200).json({ redirectUrl: `/payment-success?orderId=${order_id}` });
});

routes.get('/payment-success', async(req, res)=>{
    const orderId = req.query.orderId;
    console.log("Success", orderId)
    const customer = await Checkout.findOne({orderId: orderId})
    console.log("Success", customer)
    const tempName = customer.name
    console.log(tempName)
    const name = tempName.split(" ")[0]
    res.render('payment-success',{
        orderId: customer.orderId,
        paymentId:customer.payment_id,
        amount:customer.amount,
        name:name,
    })
})

module.exports = routes;