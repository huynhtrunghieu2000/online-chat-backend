const { Router } = require("express");
const router = Router();

// Import Middlewares
// const {} = require("../middlewares/taskMiddleware");

// Import Controllers
const classroomsController = require("../controllers/classroomsController");

router.get("/classrooms", classroomsController.getAll);
router.post("/classrooms", classroomsController.create);
router.get("/classrooms/:id", classroomsController.getOne);
router.post("/classrooms/:id/invite", classroomsController.inviteToClassroom);
router.put("/classrooms", classroomsController.update);
router.delete("/classrooms", classroomsController.delete);
router.post("/classrooms/update_picture", classroomsController.updatePicture);
// router.post("/classrooms/send_email", classroomsController.sendEmail);

module.exports = router;
