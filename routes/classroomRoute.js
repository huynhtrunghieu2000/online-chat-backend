const { Router } = require("express");
const router = Router();

// Import Middlewares
// const {} = require("../middlewares/taskMiddleware");

const {
	authenticateToken,
} = require('../middlewares/userMiddleware');

// Import Controllers
const classroomsController = require("../controllers/classroomsController");

router.get("/classrooms",[authenticateToken], classroomsController.getAll);
router.post("/classrooms",[authenticateToken], classroomsController.create);
router.get("/classrooms/:id",[authenticateToken], classroomsController.getOne);
router.post("/classrooms/:id/invite",[authenticateToken], classroomsController.inviteToClassroom);

router.put("/classrooms",[authenticateToken], classroomsController.update);
router.delete("/classrooms",[authenticateToken], classroomsController.delete);
router.post("/classrooms/update_picture",[authenticateToken], classroomsController.updatePicture);
// router.post("/classrooms/send_email", classroomsController.sendEmail);

module.exports = router;
