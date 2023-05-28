const userModel = require("../models/userModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const doctorModel = require("../models/doctorModel");
const appointmentModel = require("../models/appointmentModel");
const moment = require("moment");
//register callback

const registerController = async (req, res) => {
  try {
    const exisitingUser = await userModel.findOne({ email: req.body.email });
    if (exisitingUser) {
      return res
        .status(200)
        .send({ message: "User Already Exist", success: false });
    }
    const password = req.body.password;
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    req.body.password = hashedPassword;
    const newUser = new userModel(req.body);
    await newUser.save();
    res.status(201).send({ message: "Register Sucessfully", success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: `Register Controller ${error.message}`,
    });
  }
};

// login callback
const loginController = async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) {
      return res
        .status(200)
        .send({ message: "user not found", success: false });
    }
    // if(user.isBlocked === true){
        
    //     return res
    //     .status(200)
    //     .send({message :"Sorry! You are not allowed to login."});
    // }
    const isMatch = await bcrypt.compare(req.body.password, user.password);
    if (!isMatch) {
      return res
        .status(200)
        .send({ message: "Invalid Email or Password", success: false });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    
    res.status(200).send({ message: "Logged in Successfully", success: true, token });
  } catch (error) {
    console.log(error);
    res.status(500).send({ message: `Error in Login CTRL ${error.message}` });
  }
};

const authController = async (req, res) => {
  try {
    const user = await userModel.findById({ _id: req.body.userId });
    user.password = undefined;
    if (!user) {
      return res.status(200).send({
        message: "user not found",
        success: false,
      });
    } else {
      
      res.status(200).send({
        success: true,
        data: user
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "auth error",
      success: false,
      error,
    });
  }
};

// Appply Doctor CTRL
const applyDoctorController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });

    req.body.timings[0] = moment(req.body.timings[0]).format("HH:mm");
    req.body.timings[1] = moment(req.body.timings[1]).format("HH:mm");
    
    const newDoctor = await doctorModel({ ...req.body, status: "pending"});
    await newDoctor.save();

    
    user.hasApplied = true;
    await user.save();

    // should be used only when admin is present
    const adminUser = await userModel.findOne({ isAdmin: true });
    const notification = adminUser.notification;
    notification.unshift({
      type: "apply-doctor-request",
      message: `${newDoctor.firstName} ${newDoctor.lastName} Has Applied For A Doctor's Post`,
      data: {
        doctorId: newDoctor._id,
        name: newDoctor.firstName + " " + newDoctor.lastName,
        onClickPath: "/admin/doctors",
      },
    });
    await userModel.findByIdAndUpdate(adminUser._id, { notification });
    res.status(201).send({
      success: true,
      message: "Wooh!!! Applied Successfully",
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Applying For Doctor",
    });
  }
};

// Get Notification control
const getAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    const seennotification = user.seennotification;
    const notification = user.notification;
    seennotification.unshift(...notification);
    user.notification = [];
    user.seennotification = notification;
    const updatedUser = await user.save();
    res.status(200).send({
      success: true,
      message: "all notification marked as read",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      message: "Error in notification",
      success: false,
      error,
    });
  }
};


// Delete Notification Control
const deleteAllNotificationController = async (req, res) => {
  try {
    const user = await userModel.findOne({ _id: req.body.userId });
    user.notification = [];
    user.seennotification = [];
    const updatedUser = await user.save();
    updatedUser.password = undefined;
    res.status(200).send({
      success: true,
      message: "Notifications Deleted successfully",
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      message: "Unable to delete all notifications",
      error,
    });
  }
};

//GET ALL DOC
const getAllDoctorsController = async (req, res) => {
  try {
    const doctors = await doctorModel.find({ status: "approved" });
    res.status(200).send({
      success: true,
      message: "Doctors List Fetched Successfully",
      data: doctors,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Fetching list of Doctors",
    });
  }
};

// booking bookingAvailabilityController
const bookingAvailabilityController = async (req, res) => {
  try {
    const date = moment(req.body.date).format("DD-MM-YYYY").toString();
    const fromTime = moment(req.body.fromTime).subtract(0.5, "hours").format("HH:mm").toString();
    // .subtract(0.5, "hours");
      
    const toTime = moment(req.body.fromTime).add(0.5, "hours").format("HH:mm").toString();
    // .add(0.5, "hours");
    
    // const compareValue = string1.localeCompare(string2)
    
    const doctorId = req.body.doctorId;

    const doctor = await doctorModel.findOne({_id: doctorId});
    const startTimeOfDoctor = doctor.timings[0];
    const endTimeOfDoctor = doctor.timings[1];
    if(startTimeOfDoctor > fromTime || endTimeOfDoctor <toTime) {
      return res.status(200).send({
        message: "Doctor is not Available at that time, please select the time within the availability of doctor",
        success: true,
      });
    }

    const appointments1 = await appointmentModel.find({
      doctorId,
      date: date,
      status: "approved",
      $or: [
            {
              $and: [
                { fromTime: { $lt: toTime } },
                { toTime: { $gt: fromTime } }
              ]
            },
            {
              $and: [
                { fromTime: { $gt: fromTime } },
                { toTime: { $lt: toTime } }
              ]
            }
          ]
    });
    

    
    if (appointments1.length > 0 ) {
      return res.status(200).send({
        message: "Appointments are not Available at this time, please select another time within the time of availability of doctor",
        success: true,
      });
    } else {
      return res.status(200).send({
        success: true,
        message: "Appointments available on "+ date +" from "+ fromTime +" to "+ toTime ,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error In Booking",
    });
  }
};

//BOOK APPOINTMENT
const bookAppointmentController = async (req, res) => {
  try {
    const date = req.body.date = moment(req.body.date).format("DD-MM-YYYY");
    const toTime = req.body.toTime = moment(req.body.fromTime).add(0.5,"hours").format("HH:mm");
    const fromTime = req.body.fromTime = moment(req.body.fromTime).subtract(0.5,"hours").format("HH:mm");
    
    const doctorId = req.body.doctorId;

    const doctorFirst = await doctorModel.findOne({_id: doctorId});
    const startTimeOfDoctor = doctorFirst.timings[0];
    const endTimeOfDoctor = doctorFirst.timings[1];
    if(startTimeOfDoctor > fromTime || endTimeOfDoctor <toTime) {
      return res.status(200).send({
        message: "Doctor is not Available at that time, please select the time within the availability of doctor",
        success: true,
      });
    }

    const appointments1 = await appointmentModel.find({
      doctorId,
      date: date,
      status: "approved",
      $or: [
            {
              $and: [
                { fromTime: { $lt: toTime } },
                { toTime: { $gt: fromTime } }
              ]
            },
            {
              $and: [
                { fromTime: { $gt: fromTime } },
                { toTime: { $lt: toTime } }
              ]
            }
          ]
    });
    
    if (appointments1.length > 0 ) {
      return res.status(200).send({
        message: "Appointments are not Available at this time",
        success: true,
      });
    }else{
      req.body.status = "pending";
      const newAppointment = new appointmentModel(req.body);
      await newAppointment.save();
      const doctor = await doctorModel.findOne({ _id: req.body.doctorId });
      const user = await userModel.findOne({ _id: doctor.userId });
      user.notification.unshift({
        type: "New-appointment-request",
        message: "A new Appointment Request from "+ req.body.userInfo,
        onCLickPath: "/users/appointments",
      });
      await user.save();
      res.status(200).send({
        success: true,
        message: "Appointment Booked successfully on "+ req.body.date + " from " + req.body.fromTime + " to " + req.body.toTime,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error While Booking your Appointment",
    });
  }
};


const userAppointmentsController = async (req, res) => {
  try {
    const appointments = await appointmentModel.find({
      userId: req.body.userId,
    });
    res.status(200).send({
      success: true,
      message: "Users Appointments Fetch SUccessfully",
      data: appointments,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send({
      success: false,
      error,
      message: "Error In User Appointments",
    });
  }
};

// JUST FOR TESTING PURPOSE

// const loginController = () => {}
// const registerController = ()=> {}

module.exports = { loginController, 
  registerController,
   authController,
    applyDoctorController ,
     getAllNotificationController,
     deleteAllNotificationController,
     getAllDoctorsController,
     bookAppointmentController,
     bookingAvailabilityController,
     userAppointmentsController,
     
    };
