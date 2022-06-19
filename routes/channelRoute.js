const { Router } = require("express");
const router = Router();

// Import Middlewares
// const {} = require("../middlewares/taskMiddleware");

// Import Controllers
const channelController = require("../controllers/channelsController");

router.get("/channels/:id", channelController.getOne);
router.post("/channels", channelController.create);
router.put("/channels/:id", channelController.update);
router.delete("/channels/:id", channelController.delete);
module.exports = router;
