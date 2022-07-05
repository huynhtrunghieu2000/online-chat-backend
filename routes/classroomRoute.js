const { Router } = require('express');
const router = Router();

// Import Middlewares
// const {} = require("../middlewares/taskMiddleware");

const { authenticateToken } = require('../middlewares/userMiddleware');

// Import Controllers
const classroomsController = require('../controllers/classroomsController');

router.get('/classrooms/invite', [authenticateToken], classroomsController.getByInviteLink);
router.post('/classrooms/invite', [authenticateToken], classroomsController.joinByInviteCode);

router.get('/classrooms', [authenticateToken], classroomsController.getAll);
router.post('/classrooms', [authenticateToken], classroomsController.create);
router.put('/classrooms', [authenticateToken], classroomsController.update);
router.delete('/classrooms', [authenticateToken], classroomsController.delete);

router.get('/classrooms/:id', [authenticateToken], classroomsController.getOne);
router.put('/classrooms/:id', [authenticateToken], classroomsController.update);
router.delete('/classrooms/:id', [authenticateToken], classroomsController.delete);

router.post('/classrooms/:id/member', [authenticateToken], classroomsController.inviteToClassroom);
router.put('/classrooms/:id/member', [authenticateToken], classroomsController.updateRole);
router.delete('/classrooms/:id/member', [authenticateToken], classroomsController.leaveRoom);

// router.post('/classrooms/:id/event', [authenticateToken], classroomsController.create);
router.post('/classrooms/:id/event', [authenticateToken], classroomsController.createEventForRoom);
router.put('/classrooms/:id/event', [authenticateToken], classroomsController.updateEventForRoom);
router.delete('/classrooms/:id/event', [authenticateToken], classroomsController.deleteEventForRoom);

// router.put('/classrooms/:id/invite', [authenticateToken], classroomsController.updateRole);

// router.post('/classrooms/update_picture', [authenticateToken], classroomsController.updatePicture);
// router.post("/classrooms/send_email", classroomsController.sendEmail);

module.exports = router;
