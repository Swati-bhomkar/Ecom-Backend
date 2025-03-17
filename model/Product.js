const mongoose=require ('mongoose');

const productsSchema = new mongoose.Schema({
    name :{
        type :String,
        required:true
    },
    price :{

        type:Number,
        required:true
    },
    brand:{
        type:String
    },
    stock:{
        type:Number
    },
    image:{
        type:String
    },
    description:{
        type: String
    },
    user :{
        type:mongoose.Schema.ObjectId,
        ref:'User'
    }
})

const Product =mongoose.model('Product',productsSchema);
module.exports={Product};