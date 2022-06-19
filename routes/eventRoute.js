const { Router } = require("express");
const router = Router();

const {
	authenticateToken,
} = require('../middlewares/userMiddleware');

// Import Controllers
const eventController = require("../controllers/eventController");

router.get("/events",[authenticateToken], eventController.getAllByUserId);
router.post("/events",[authenticateToken], eventController.create);
router.put("/events",[authenticateToken], eventController.update);
router.delete("/events",[authenticateToken], eventController.delete);
router.get("/events/:id",[authenticateToken], eventController.getOne);
// router.post("/events/:id/invite",[authenticateToken], eventController.inviteToClassroom);

// router.put("/events",[authenticateToken], eventController.update);
// router.delete("/events",[authenticateToken], eventController.delete);
// router.post("/events/update_picture",[authenticateToken], eventController.updatePicture);
// router.post("/events/send_email", eventController.sendEmail);

module.exports = router;
