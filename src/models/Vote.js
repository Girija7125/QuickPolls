const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    pollId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'poll',
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'user',
        required:true
    },
    optionId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'options'
    }
},{timestamps:true});


module.exports= mongoose.model('Vote',voteSchema)


