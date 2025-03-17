const mongoose =require('mongoose'); //takes the package mongoose
const userSchema = new  mongoose.Schema({
    name:{
        type:String,
        required:true,
    },
    email:{                                    //schema
        type:String,
        required:true,
    },
    password:{
        type:String,   
        required:true,
    },
    token:{
        type:String,   
        required:true,
    },
    role:{
        type:String,
        default:"user",
    },
     cart:{
         type:mongoose.Schema.ObjectId,
         ref:"Cart",
     }
});

const User = mongoose.model('User',userSchema);   //creating a collection  which is modul like user
module.exports={User}; //we are exporting user info to app.js
