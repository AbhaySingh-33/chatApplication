import bcrypt from "bcryptjs";
import User from "../models/user.model.js";
import generateTokenAndSetCookie from "../utils/generateToken.js";
import multer from "multer";  // ye ek middleware hai jo parse karta hai file to uske file name se aur req.file (object me dal deta hai)
import createCloudinaryStorage from "multer-storage-cloudinary";
import dotenv from "dotenv";  // ye env me strored variables ko process.env se acces krne me help karta hai
import mongoSanitize from "express-mongo-sanitize";
dotenv.config();

import pkg from "cloudinary";
const { v2: cloudinary } = pkg;

import jwt from "jsonwebtoken";
import {
  EmailConfigError,
  EmailDeliveryError,
  getClientUrl,
  sendVerificationEmail,
} from "../utils/sendEmail.js";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Multer-Cloudinary storage 
const storage = createCloudinaryStorage({
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

    // Validation
    if (!fullName || !username || !email || !password || !confirmPassword || !gender) {
      return res.status(400).json({ error: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ error: "Passwords don't match" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // const existingUser = await User.findOne({ username });
    // if (existingUser) {
    //   return res.status(409).json({ error: "Username already taken" });
    // }

    // const existingEmail = await User.findOne({ email });
    // if (existingEmail) {
    //   return res.status(409).json({ error: "Email already registered" });
    // }

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

    const clientUrl = getClientUrl();
    if (!clientUrl) {
      throw new EmailConfigError("Missing CLIENT_URL or FRONTEND_URL environment variable");
    }

    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const verificationUrl = `${clientUrl}/verify-email/${token}`;

    let emailSent = true;

    try {
      await sendVerificationEmail({
        to: email,
        fullName,
        verificationLink: verificationUrl,
      });
    } catch (emailError) {
      emailSent = false;
      console.error("Verification email failed:", emailError);
    }

    res.status(201).json({
      message: emailSent
        ? "Registration successful! Check your email for verification link"
        : "Registration successful, but we could not send the verification email right now. Please use resend verification after fixing email configuration.",
      emailSent,
    });
  } catch (error) {
    console.error("Error in signup controller:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ error: "Invalid input data" });
    }
    if (error.code === 11000) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    res.status(500).json({ error: "Registration failed. Please try again later" });
  }
};

export const verifyEmail = async (req, res) => {
  const { token } = req.params;
  try {
    if (!token) {
      return res.status(400).json({ error: "Verification token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(200).json({ message: "Email already verified" });
    }

    user.isVerified = true;
    await user.save();

    res.status(200).json({ message: "Email verified successfully! You can now login" });
  } catch (err) {
    console.error("Error in verifyEmail:", err);
    if (err.name === "JsonWebTokenError") {
      return res.status(400).json({ error: "Invalid verification link" });
    }
    if (err.name === "TokenExpiredError") {
      return res.status(400).json({ error: "Verification link has expired. Please request a new one" });
    }
    res.status(500).json({ error: "Email verification failed. Please try again" });
  }
};

export const resendVerificationEmail = async (req, res) => {
  try {
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { email } = sanitizedBody;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.isVerified) {
      return res.status(400).json({ error: "Email is already verified" });
    }

    const clientUrl = getClientUrl();
    if (!clientUrl) {
      throw new EmailConfigError("Missing CLIENT_URL or FRONTEND_URL environment variable");
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });
    const verificationUrl = `${clientUrl}/verify-email/${token}`;

    await sendVerificationEmail({
      to: user.email,
      fullName: user.fullName,
      verificationLink: verificationUrl,
    });

    res.status(200).json({ message: "Verification email sent successfully" });
  } catch (error) {
    console.error("Error in resendVerificationEmail controller:", error);
    if (error instanceof EmailConfigError || error instanceof EmailDeliveryError) {
      return res.status(503).json({ error: "Unable to send verification email right now. Check email service configuration and try again." });
    }
    res.status(500).json({ error: "Failed to resend verification email" });
  }
};

export const login = async (req, res) => {
  try {
    const sanitizedBody = mongoSanitize.sanitize(req.body);
    const { username, password } = sanitizedBody;
    
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const isPasswordCorrect = await bcrypt.compare(password, user.password);
    if (!isPasswordCorrect) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (!user.isVerified) {
      return res.status(403).json({
        error: "Please verify your email before logging in",
        needsEmailVerification: true,
        email: user.email,
      });
    }

    generateTokenAndSetCookie(user._id, res);

    res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      username: user.username,
      profilePic: user.profilePic,
      friends: user.friends,
    });
  } catch (error) {
    console.error("Error in login controller:", error);
    res.status(500).json({ error: "Login failed. Please try again later" });
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

export const getMe = async (req, res) => {
	try {
		const user = await User.findById(req.user._id).select("-password");
		if (!user) {
			return res.status(404).json({ error: "User not found" });
		}
		res.status(200).json(user);
	} catch (error) {
		console.error("Error in getMe controller", error.message);
		res.status(500).json({ error: "Failed to fetch user data" });
	}
};

export const uploadProfilePicture = upload.single("profilePic");
