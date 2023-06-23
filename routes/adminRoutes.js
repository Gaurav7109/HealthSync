const express = require("express");
const {
  getAllUsersController,
  getAllDoctorsController,
  changeAccountStatusController,
  changeUserAccountStatusController,
} = require("../controller/adminCtrl");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

//GET METHOD || USERS
router.get("/getAllUsers", authMiddleware, getAllUsersController);

//GET METHOD || DOCTORS
router.get("/getAllDoctors", authMiddleware, getAllDoctorsController);

//POST Doctor ACCOUNT STATUS
router.post(
  "/changeAccountStatus",
  authMiddleware,
  changeAccountStatusController
);

//POST User ACCOUNT STATUS
router.post(
  "/changeUserAccountStatus",
  authMiddleware,
  changeUserAccountStatusController
);

module.exports = router;