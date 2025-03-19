const express = require('express');
const app = express();
const {User} = require('./model/User');
const mongoose = require('mongoose');
const cors = require('cors');// connect front5713 to backend8080
const morgan = require('morgan'); //use and run http methods
const bcrypt = require('bcrypt'); //main - secure the password #method to convert into strong 10 digit password
const jwt = require('jsonwebtoken'); //verify authorized user - to compare given things to db things
const {brotliCompressSync} = require('zlib');
const {Product} = require('./Model/Product'); // after creating product schema 
const {Cart} = require('./Model/Cart');

//middleware
app.use(express.json());
app.use(cors()); // calling cors package or method 
app.use(morgan('dev'));


mongoose.connect('mongodb://127.0.0.1:27017/kleProject')
.then(()=>{ // callbacak function
    console.log("DB is connected ")
}).catch((err)=>{
    console.log("DB is not connected ",err)
})

//task - 1 create route for register user
app.post('/register',async(req,res)=>{
    try{
        let {name,email,password} = req.body;

        if(!email || !password || !name){
            return res.status(400).json({message:"Some feilds are missing"});
        }

        //check if user exist or not
        const isUSerAlreadyExist = await User.findOne({email});

        if(isUSerAlreadyExist){
            return res.status(400).json({message:"User already registered"});
        }
        else{
            //salt will generat 10 different symbols
            // hash the password
            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(password,salt); // merging pass with salt

            //generate token
            const token = jwt.sign({email},"supersecret",{expiresIn:'365d'})
            
            //create user
            await User.create({
                name,
                email,
                password : hashedPassword,
                token,
                role : 'user'
            })

            return res.status(201).json({
                message : "USer created successfully"
            })

        }

    }catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
})

//task - 2 create route for login user
app.post('/login',async(req,res)=>{
    try{
        let {email,password} = req.body;

        if(!email || !password){
            return res.status(400).json({message:"Some Fields are Missing"})
        }

        //check user exist or not
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message:"User not registered , Please register first"})
        }

        //compare the entered password
        const isPasswordMatched = bcrypt.compareSync(password,user.password)

        if(!isPasswordMatched){
            return res.status(400).json({
                message:"Invalid Password"
            })
        }
        //user login successfull
        return res.status(200).json({
            id : user._id,     //creates unique id for the user
            name : user.name,
            token : user.token,
            email : user.email,
            role : user.role
        })

    }catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
})

//task - 3 create route to see all products 
app.get('/products',async(req,res)=>{
    try{
        const products = await Product.find();
        res.status(200).json({
            message: "Product found successfully ",
            products:products
        })

    }catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
})

//task - 4 create route to add products
app.post('/add-product',async(req,res)=>{
    try{

        let {name,image,stock,price,description,brand} = req.body;
        let {token} = req.headers; //verify valid user
        let decodedtoken = jwt.verify(token,"supersecret");//supersecret  key comparing 

        const user = await User.findOne({email:decodedtoken.email}); //verify user email

        const product = await Product.create({
            name,
            description,
            image,
            price,
            stock,
            brand,
            user:user._id

        })
        return res.status(201).json({
            message : "Product created successfully ",
            product:product
        })

    }catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
})

//task - 5 to show a particular product
app.get('/product/:id',async(req,res)=>{
    try{
        let {id} = req.params;

        if(!id){
            return res.status(400).json({
                message : "Id not found"
            })
        }

        const {token} = req.headers;
        const decodedtoken = jwt.verify(token,"supersecret");

        if(decodedtoken.email){
            const product = await Product.findById(id);
            if(!product){
                return res.status(400).json({
                    message : "Product Not Found"
                })
            }
            return res.status(200).json({
                message : "Product found",
                product:product
            })
        }

    }catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
})

//task - 6 to update a particular product
app.patch('/product/edit/:id',async(req,res)=>{
    try{
        let {name,description,image,price,brand,stock} = req.body.productData; //pdata is from frontend
        let {id} = req.params;
        let {token} = req.headers;

        //verification
        const decodedtoken = jwt.verify(token,"supersecret");
        
        if(decodedtoken.email){
            const updatedProduct = await Product.findByIdAndUpdate(id,{ //mdb methods
                name,
                description,
                image,
                price,
                brand,
                stock,
            
            })

            return res.status(200).json({
                message : "Product updated Successfully ",
                product:updatedProduct
            })
        }

    }catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
})

//task - 7 to delete product 
app.delete('/product/delete/:id',async(req,res)=>{
    try{

        const {id} = req.params;

        if(!id){
            return res.status(400).json(
                {message : "Product Id not found"}); //to send response to frontend
        }
        const deletedProduct = await Product.findByIdAndDelete(id); //mdb methods

        if(!deletedProduct){
            return res.status(404).json({
                message : "Product not found"
            });
        }

        return res.status(200).json({
            message : "Product Deleted Successfully",
            product:deletedProduct
        })

    }catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
})

//task - 8 to create a cart route
app.get('/cart',async(req,res)=>{
    try{
        const {token} = req.headers;
        const decodedtoken = jwt.verify(token,"supersecret");
        const user = await User.findOne({email:decodedtoken.email}).populate({
            path:'cart',
            populate:{
                path:'products',
                model:'Product'
            }
        })
        if(!user){
            return res.status(400).json({
                message:"User not Found"
            })
        }

        return res.status(200).json({cart:user.cart});

    }
    catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
    

})

//task - 9 to create a route to add product in cart
app.post('/cart/add',async(req,res)=>{
    const body = req.body;
    const productArray = body.products;
    let totalPrice = 0;
    try{
        //find the product and add product price in total
        for(const item of productArray){
            const product = await Product.findById(item)
            if(product){
                totalPrice += product.price;
            }
        }

        const {token} = req.headers;
        const decodedtoken = jwt.verify(token,"supersecret");
        const user = await User.findOne({email:decodedtoken.email});

        if(!user){
            return res.status(404).json({
                message : "User not Found"
            });
        }

        //checking if user already has a cart
        let cart;
        if(user.cart){
            cart = await Cart.findById(user.cart).populate('products');
            
            const existingProductsId = cart.products.map((product)=>{

                product._id.toString()

            })
            //checking if product is existing or not if not just add the products and add the total
            productArray.forEach(async(productId)=>{
                if(!existingProductsId.includes(productId)){
                    cart.products.push(productId);

                    const product = await Product.findById(productId);
                    totalPrice += product.price;

                }
            })

            //update cart.total with the new.total
            cart.total = totalPrice;
            await cart.save();
                
        }else{
            cart = new Cart({
                products: productArray,
                total : totalPrice
            })
            await cart.save();
            user.cart = cart._id;
            await user.save();
        }
        res.status(201).json({
            message : "Cart Updates Successfully",
            cart:cart
        })

    }catch(error){
        console.log(error);
        return req.status(500).json({message : "Internal Server Error"})
    }
})

//task - 10 delete the product from cart
app.delete("/cart/product/delete", async (req, res) => {
    const { productID } = req.body;
    const { token } = req.headers;
  
    try {
      const decodedToken = jwt.verify(token, "supersecret");
      const user = await User.findOne({ email: decodedToken.email }).populate("cart");
  
      if (!user) {
        return res.status(404).json({ message: "User Not Found" });
      }
  
      const cart = await Cart.findById(user.cart).populate("products");
  
      if (!cart) {
        return res.status(404).json({ message: "Cart Not Found" });
      }
  
      const productIndex = cart.products.findIndex(
        (product) => product._id.toString() === productID
      );
  
      if (productIndex === -1) {
        return res.status(404).json({ message: "Product Not Found in Cart" });
      }
  
      cart.products.splice(productIndex, 1);
      cart.total = cart.products.reduce(
        (total, product) => total + product.price,
        0
      );
  
      await cart.save();
  
      res.status(200).json({
        message: "Product Removed from Cart Successfully",
        cart: cart,
      });
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error Removing Product from Cart", error });
    }
  });


app.listen(8080, () => {
    console.log("Server is Started on 8080");
   });
