import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import multer from "multer";  // ye ek middleware hai jo parse karta hai file to uske file name se aur req.file (object me dal deta hai)
import { CloudinaryStorage } from "multer-storage-cloudinary";
import dotenv from "dotenv";  // ye env me strored variables ko process.env se acces krne me help karta hai
import mongoSanitize from "express-mongo-sanitize";
dotenv.config();

import pkg from "cloudinary";
const { v2: cloudinary } = pkg;

import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer-Cloudinary storage 
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "profile_pictures",
    allowed_formats: ["jpg", "jpeg", "png"],
  },
});

const upload = multer({ storage });     //ye ek multer ka middleware hai

export const signup = async (req, res) => {
  try {
    // Sanitize input data
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { fullName, username, email, password, confirmPassword, gender } = sanitizedBody;

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords don't match" });
    }

    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(400).json({ error: "Username already exists" });
    }

    const existingEmail = await User.findOne({ email });
    if (existingEmail) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let profilePic = "";
    if (req.file) {
      profilePic = req.file.path;
    } else {
      const boyProfilePic = `https://avatar.iran.liara.run/public/boy?username=${username}`;
      const girlProfilePic = `https://avatar.iran.liara.run/public/girl?username=${username}`;
      profilePic = gender === "male" ? boyProfilePic : girlProfilePic;
    }

    const newUser = new User({
      fullName,
      username,
      email,
      password: hashedPassword,
      gender,
      profilePic,
      isVerified: false,
    });

    await newUser.save();

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${token}`;

    const transporter = nodemailer.createTransport({
      service: "Gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"CHATTRIX" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to ChatApp! Verify your email",
      html: `<p>Hi ${fullName},</p>
       <p>Thanks for signing up! Click <a href="${verificationUrl}">here to verify</a> your email address.</p>
       <p>This link expires in 24 hours.</p>`,
    });

    console.log("email sent");
    console.log("verification URL:", verificationUrl);
    console.log("email to:", email);
    console.log("email info:", info);

    res
      .status(200)
      .json({ message: "User registered. Check email for verification." });
  } catch (error) {
    console.error("Error in signup controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user) return res.status(400).send("Invalid token");

    user.isVerified = true;
    await user.save();

    res.status(200).send("Email verified successfully");
  } catch (err) {
    res.status(400).send("Invalid or expired token");
  }
};

export const login = async (req, res) => {
  try {
    // Sanitize input data
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { username, password } = sanitizedBody;
    
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(400).json({ error: "Invalid username or password" });
    }

    if (!user.isVerified) {
      return res
        .status(403)
        .json({ error: "Please verify your email before logging in." });
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const logout = (req, res) => {
  try {
    res.cookie("jwt", "", { maxAge: 0 });
    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const uploadProfilePicture = upload.single("profilePic");
