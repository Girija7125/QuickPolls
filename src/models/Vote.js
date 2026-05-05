const mongoose = require('mongoose');

const voteSchema = new mongoose.Schema({
    pollId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Poll',
        required:true
    },
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
    },
    optionId:[{
        type:mongoose.Schema.Types.ObjectId,
        ref:'Options'
    }]
},{timestamps:true});

voteSchema.index({pollId:1,userId:1})


module.exports= mongoose.model('Vote',voteSchema)


