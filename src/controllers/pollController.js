const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Poll = require("../models/Poll");
const Options = require("../models/Options");
const Vote = require("../models/Vote");

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, name: user.name, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );
};

exports.createUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ message: "Name, email and password are required." });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters." });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: "Email already registered." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });
    const token = generateToken(user);

    res.status(201).json({
      message: "Registered Successfully",
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "user Here" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res
        .status(400)
        .json({ message: "Email and Password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }
    const token = generateToken(user);

    res.status(200).json({
      message: "Login Successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (err) {
    res.status(500).json({ message: "Server Error Here" });
  }
};

exports.createPollWithOptions = async (req, res) => {
  try {
    const { question, options } = req.body;
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res
        .status(400)
        .json({ message: "Question,Atleast two Options required" });
    }
    const poll = await Poll.create({ question });

    const optionDocs = options.map((opt) => ({
      pollId: poll._id,
      text: opt.text,
    }));

    const createdOptions = await Options.insertMany(optionDocs);

    res.status(201).json({ poll, options: createdOptions });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPolls = async (req, res) => {
  try {
    const polls = await Poll.aggregate([
      {
        $lookup: {
          from: "options",
          localField: "_id",
          foreignField: "pollId",
          as: "options",
        },
      },
      {
        $match: {
          "options.0": { $exists: true },
        },
      },
    ]);
    res.json(polls);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getPollById = async (req, res) => {
  try {
    const pollId = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      return res.status(400).json({ message: "Invalid PollId" });
    }
    const poll = await Poll.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(pollId) } },
      {
        $lookup: {
          from: options,
          localField: "_id",
          foreignField: "pollId",
          as: "optios",
        },
      },
    ]);
    if (!poll.length) {
      return res.status(404).json({ message: "Poll not found." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.votePoll= async (req,res)=>{
    try {
        const {pollId,userId,optionId}=req.body
        if(!pollId || !userId || !Array.isArray(optionId) || optionId.length ===0){
            return res.status(400).json({message:"pollId,userId and OptionId are required"})
        }
        if(!mongoose.Types.ObjectId.isValid(pollId) || !mongoose.Types.ObjectId.isValid(userId)){
            return res.status(400).json({message:"Invalid Poll Id or user Id"})
        }
        const invalidIds= optionId.filter((id)=>!mongoose.Types.ObjectId.isValid(id))
        if(invalidIds.length>0){
            return res.status(400).json({message:"Invalid Option Id"})
        }

        const valid= await Options.countDocuments({
            _id:{$in:optionId},
            pollId:pollId
        });
        await Vote.findOneAndUpdate(
            {pollId,userId},
            {optionId:[...new Set(optionId)]},
            {upsert:true,new:true}
        );
        res.status(200).json({ message: "Vote recorded." });
    } catch (error) {
         res.status(500).json({ message: error.message });
    }
}

exports.updatePoll = async (req, res) => {
  try {
    const { id } = req.params;
    const { question, options } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid Poll Id" });
    }
    if (!question || !Array.isArray(options) || options.length < 2) {
      return res
        .status(400)
        .json({ message: "Question and atleast two options are required" });
    }

    const poll = await Poll.findByIdAndUpdate(id, { question }, { new: true });

    if (!poll) {
      return res.status(400).json({ message: "poll Not Found." });
    }

    const updateOptions = await Promise.all(
      options.map(async (opt) => {
        if (opt._id && mongoose.Types.ObjectId.isValid(opt._id)) {
          return await Options.findOneAndUpdate(
            { _id: opt._id, pollId: id },
            { text: opt.text },
            { new: true },
          );
        } else {
          return await Options.create({ pollId: poll._id, text: opt.text });
        }
      }),
    );

    res.status(200).json({
      message: "Poll Updated Successfully",
      poll,
      options: updateOptions.filter(Boolean),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getResults = async (req, res) => {
  try {
    const { pollId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(pollId)) {
      res.status(400).json({ message: "Invalid PollId" });
    }
    const totalVoters = await Vote.countDocuments({
      pollId: new mongoose.Types.ObjectId(pollId),
    });
    const results = await Vote.aggregate([
      { $match: { pollId: new mongoose.Types.ObjectId(pollId) } },
      { $unwind: "$optionId" },
      { $group: { _id: "$optionId", voteCount: { $sum: 1 } } },
      {
        $lookup: {
          from: "options",
          localField: "_id",
          foreignField: "_id",
          as: "option",
        },
      },
      { $unwind: "$option" },
      { $match: { "option.isActive": true } },
      {
        $project: {
          option: "$option.text",
          voteCount: 1,
        },
      },
      { $sort: { voteCount: -1 } },
    ]);
    res.json({ totalVoters, results });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
