const express = require('express');
const router = express.Router();
const controller = require('../controllers/pollController')

router.post("/user",controller.createUser);
router.post("/login",controller.login);
router.post("/poll",controller.createPollWithOptions);
router.get("/polls",controller.getPolls);
router.get("/polls/:id", controller.getPollById);
router.post("/vote", controller.votePoll)












module.exports= router