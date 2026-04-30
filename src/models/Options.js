const mongoose= require('mongoose');

const optionSchema= new mongoose.Schema({
    pollId: {
        type:mongoose.Schema.Types.ObjectId,
        ref:"poll",
        required:true
    },
    text:{
        type:String,
        required:true,
    },
    isActive: {
        type:Boolean,
        default:true
    }
},{timestamps:true});


module.exports = mongoose.model('Options',optionSchema)