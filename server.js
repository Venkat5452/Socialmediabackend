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
const allBlogsSchema=new mongoose.Schema({
    email:String,
    name:String,
    comments:Array,
    Para:String,
    ImageLink:String,
    Likes:Array
})
const User=new mongoose.model("users",userSchema);
const otpdata=new mongoose.model("otpdata",otpSchema);
const Blogdata=new mongoose.model("Blogdata",blogSchema);
const AllBlogdata=new mongoose.model("AllBlogdata",allBlogsSchema);
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
server.post("/Allblogs",async(req,res)=>{
    const {email,name,Para,ImageLink}=req.body;
    const comments=[];
    AllBlogdata.findOne({email:email,name:name,Para:Para}).then((user)=>{
        if(user){
            res.send({message:"Successfully"});
        }
        else {
            const newuser=new AllBlogdata({
                email,
                name,
                Para,
                ImageLink,
                comments
            })
            newuser.save().then(res.send({message:"Successfull"}));
        }
    })
})
server.post("/enterdata",async(req,res)=>{
    const {email,name,Para,ImageLink}=req.body;
    const data={
        name:name,
        Para:Para,
        ImageLink:ImageLink
    }
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
server.get("/getdata",async(req,res)=>{
    const data= await AllBlogdata.find().sort({_id:-1});
    res.send({data:data});
})
server.post("/delete",async(req,res)=>{
    const {email,name}=req.body;
    AllBlogdata.findOne({email:email,name:name}).then((user)=>{
        if(user){
           AllBlogdata.deleteOne({email:email,name:name}).then(()=>{
            res.send({message:"Successfull"});
           })
        }
        else {
            res.send({message:"Not Found"});
        }
    })
})
server.post("/addcomment",async(req,res)=>{
    const {name,pname,comment}=req.body;
    const data={
        name:pname,
        comment:comment
    }
    AllBlogdata.findOne({name:name}).then((user)=>{
        if(user) {
            user.comments.push(data);
            user.save().then(res.send({message:"Successfull"}));
        }
        else {
            res.send({message:"Not found"});
        }
    })
})
server.post("/likeposts",async(req,res)=>{
    const {email,name}=req.body;
    AllBlogdata.findOne({name:name}).then((user)=>{
        if(user) {
            user.Likes.push(email);
            user.save().then(res.send({message:"SuccessFull"}));
        }
        else {
            res.send({message:"Not Found"});
        }
    })
})
server.post("/unlikeposts",async(req,res)=>{
    const {email,name}=req.body;
    AllBlogdata.findOne({name:name}).then((user)=>{
        if(user) {
            user.Likes=user.Likes.filter(item => item !== email);
            user.save().then(res.send({message:"SuccessFull"}));
        }
        else {
            res.send({message:"Not Found"});
        }
    })
})
server.listen(9009,()=>{
    console.log("Server running in port 9009");
})