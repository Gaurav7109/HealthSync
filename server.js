const dotenv = require("dotenv");
const express = require("express");
const colors = require("colors");
const moragan = require("morgan");

const connectDB = require("./config/db");
const path = require('path');

//dotenv conig
dotenv.config();

//mongodb connection
connectDB();

//rest object
const app = express();

//middlewares
app.use(express.json());
app.use(moragan("dev"));

//routes
app.use("/api/v1/users", require("./routes/userRoutes"));
app.use("/api/v1/admin", require("./routes/adminRoutes"));
app.use("/api/v1/doctor",require("./routes/doctorRoutes"));
// JUST FOR TESTING PURPOSE

// app.get("/",(req,res)=>{
//     res.status(200).send({
//         message: "server running"
//     });
// });

// static files for production
app.use(express.static(path.join(__dirname,'./client/build')));

app.get('*',function(req,res){
  res.sendFile(path.join(__dirname, "./client/build/index.html"));
});

//port
const port = process.env.PORT || 4080;
//listen port
app.listen(port, () => {
  // console.log(
  //   `Server Running in ${process.env.DEV_MODE} Mode on port ${process.env.PORT}`
  //     .bgCyan.white
  // );
});
