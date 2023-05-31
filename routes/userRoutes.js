const express = require("express");
const {
  loginController,
  registerController,
  authController,
  applyDoctorController,
  getAllNotificationController,
  deleteAllNotificationController,
  getAllDoctorsController,
  bookAppointmentController,
  bookingAvailabilityController,
  userAppointmentsController,
  userProfileController,
} = require("../controller/userCtrl");
const authMiddleware = require("../middleware/authMiddleware");

//router onject
const router = express.Router();

//routes
//LOGIN || POST
router.post("/login", loginController);

//REGISTER || POST
router.post("/register", registerController);

//Apply Doctor || POST

router.post("/apply-doctor",authMiddleware, applyDoctorController);

// AUTH || POST
router.post('/getUserData',authMiddleware,authController);
// module.exports = router;

// Get Notifications || POST
router.post('/get-all-notification',authMiddleware,getAllNotificationController);

// Delete Notification || POST
router.post('/delete-all-notification',authMiddleware,deleteAllNotificationController);

//GET ALL DOC
router.get("/getAllDoctors", authMiddleware, getAllDoctorsController);

//BOOK APPOINTMENT
router.post("/book-appointment", authMiddleware, bookAppointmentController);

//Booking Availability
router.post(
  "/booking-availability",
  authMiddleware,
  bookingAvailabilityController
);

//Appointments List
router.get("/user-appointments", authMiddleware, userAppointmentsController);


module.exports = router;