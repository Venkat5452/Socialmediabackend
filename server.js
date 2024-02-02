const express = require("express");
const mongoose=require("mongoose");
const cors=require("cors");
const nodemailer=require('nodemailer');
require("dotenv").config();
const server=express()
server.use(express.json()) 
server.use(express.urlencoded())
server.use(cors())
const bcrypt=require('bcryptjs')
mongoose.connect(process.env.MYURL).then(()=>{
    console.log("Connected to DB");
}).catch((err)=>{
    console.log(err);
})

const otpSchema=new mongoose.Schema({
    otp:String,
    email:String,
})

const userSchema=new mongoose.Schema({
    name:String,
    email:String,
    hpassword:String
})
const blogSchema=new mongoose.Schema({
    email:String,
    data:Array
})
const User=new mongoose.model("users",userSchema);
const otpdata=new mongoose.model("otpdata",otpSchema);
const Blogdata=new mongoose.model("Blogdata",blogSchema);
server.post("/login",async(req,res)=>{
    const  {email , password}=req.body;
    const hpassword=await bcrypt.hash(password,6);
    User.findOne({email:email}).then((user)=>{
        if(user && user.hpassword) {
          bcrypt.compare(password,user.hpassword).then(result => {
            if(result===true) {
              res.send({message : "Log in successFull",user:user});
            }
            else {
              res.send({message:"Incorrect Password"});
            }
         })
         .catch(err => {
             console.log(err)
         })
        }
        else {
            res.send({message:"User not Found"})
        }
    }).catch((err) => console.log(err));
  })
  
server.post("/signup",async(req,res)=>{
   const  {name , email, password,otp}=req.body;
   const hpassword=await bcrypt.hash(password,6)
   otpdata.findOne({email:email}).then((user)=> {
    if(user.otp!==otp) {
       res.send("Invalid OTP");
    }
    else {
        const user=new User({
            name,
            email,
            hpassword
        })
        user.save().then(res.send({message : "SuccessFully Registered"}));
    }})
 })
 server.post("/makemail",async(req, res) => {
    const {email,name}=req.body;
    User.findOne({email:email}).then((user)=> {
        if(user) {
            res.send("Email Already Registered");
        }
        else {
        try{
        const otp=Math.floor(100000 + Math.random()*900000);
        const transport=nodemailer.createTransport({
            service:'gmail',
            host: 'smtp.gmail.com',
            port:'587',
            auth:{
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            },
            secureConnection: 'true',
            tls: {
                ciphers: 'SSLv3',
                rejectUnauthorized: false
            }
        });
        let matter= 'Hello ' + name + 'Here is your otp to Sign up for Blogging Website ' + otp + '  Please Dont Share with Anyone , Thank You';
        const mailOptions ={
         from:process.env.EMAIL,
         to :email,
         subject:"EMAIL FOR VERIFICATION",
         html:matter
        }
        otpdata.findOne({email:email}).then((user)=>{
           if(user) {
             user.otp=otp;
             user.save();
           }
           else {
            const newuser= new otpdata({
                email,
                otp
            })
            newuser.save();
           }
        })
        transport.sendMail(mailOptions,(err,info)=>{
         if(err) {
            res.send("Error in sending Mail");
         }
         else {
            res.send("OTP SENT Succesfully");
         }
        })
     }catch(err) {
       res.send(err);
     }
    }
})
})

server.post("/enterdata",async(req,res)=>{
    const {name,Para,ImageLink}=req.body;
    const data={
        name:name,
        Para:Para,
        ImageLink:ImageLink
    }
    const email="venkatsai.bandi2019@gmail.com"
    Blogdata.findOne({email:email}).then((user)=>{
        if(user) {
            user.data.push(data);
            user.save().then(()=>{res.send({message:"Successfully"})});
        }
        else {
            const user=new Blogdata({
                email,
                data
            })
            user.save().then(()=>{res.send({message:"Successfull"})});
        }
    })
})
server.get("/getdata/:email",async(req,res)=>{
    const {email}=req.params;
    Blogdata.findOne({email:email}).then((user)=>{
        if(user) {
            res.send({data:user.data});
        }
        else {
            const user=new Blogdata({
                email,
                data
            })
            user.save().then(()=>{res.send({message:"Successfull"})});
        }
    })
})
server.delete("/delete/:name",async(req,res)=>{
    const {name}=req.params;
    const email="venkatsai.bandi2019@gmail.com";
    Blogdata.findOne({email:email}).then((user)=>{
        if(user){
           const newdata=user.data.filter(x =>x.name !== name);
           user.data=newdata;
           user.save();
           res.send("Successfull");
        }
    })
})
server.listen(9009,()=>{
    console.log("Server running in port 9009");
})