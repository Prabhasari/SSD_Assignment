import { comparePassword, hashPassword } from "../helpers/AuthHelper.js";
import shopModel from "../models/shopModel.js";
import userModel from "../models/userModel.js";
import JWT from "jsonwebtoken";
import sanitize from "mongo-sanitize";
import { success, z } from "zod";
import crypto from "crypto";
import dayjs from "dayjs";
import { sendResetEmail } from "../helpers/Mailer.js";

// Register user
export const userRegisterController = async (req, res) => {
  try {
    // Sanitize incoming body fields
    const fullname = sanitize(req.body.fullname);
    const email = sanitize(req.body.email);
    const dob = sanitize(req.body.dob);
    const phone = sanitize(req.body.phone);
    const address = sanitize(req.body.address);
    const shoppingPreference = sanitize(req.body.shoppingPreference);
    const password = sanitize(req.body.password);

    // Basic validation
    if (!fullname) return res.status(400).json({ success: false, message: "Full name is required" });
    if (!email) return res.status(400).json({ success: false, message: "Email is required" });
    if (!dob) return res.status(400).json({ success: false, message: "Date of birth is required" });
    if (!phone) return res.status(400).json({ success: false, message: "Phone number is required" });
    if (!address) return res.status(400).json({ success: false, message: "Residential address is required" });
    if (!password) return res.status(400).json({ success: false, message: "Password is required" });

    // Secure: sanitize input and enforce strict equality
    const sanitizedEmail = sanitize(email);
    const existingUser = await userModel.findOne({ email: { $eq: sanitizedEmail } });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Already registered. Please login.",
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Save new user
    const user = await new userModel({
      fullname,
      email,
      dob,
      phone,
      address,
      shoppingPreference,
      password: hashedPassword,
    }).save();

    res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user._id,
        fullname: user.fullname,
        email: user.email,
        dob: user.dob,
        phone: user.phone,
        address: user.address,
        shoppingPreference: user.shoppingPreference,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Error during registration",
      error: error.message,
    });
  }
};



//update user profile
export const updateUserProfileController = async (req, res) => {
  try {
    // Sanitize user ID
    const userId = sanitize(String(req.user._id));

    // Validate MongoDB ObjectId
    if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).send({
        success: false,
        message: "Invalid user ID",
      });
    }

    const { fullname, email, dob, phone, address, password } = req.body;

    // Fetch the current user
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).send({
        success: false,
        message: "User not found",
      });
    }

    // Validate password length
    if (password && password.length < 8) {
      return res.status(400).send({ 
        success: false,
        message: "Password must be at least 8 characters long" 
      });
    }

    // Hash the new password if provided
    const hashedPassword = password ? await hashPassword(password) : undefined;

    // Update user details
    const updatedUser = await userModel.findByIdAndUpdate(
      userId,
      {
        fullname: fullname || user.fullname,
        email: email || user.email,
        dob: dob || user.dob,
        phone: phone || user.phone,
        address: address || user.address,
        password: hashedPassword || user.password,
      },
      { new: true }
    );

    res.status(200).send({
      success: true,
      message: "Profile updated successfully",
      updatedUser,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send({
      success: false,
      message: "Error while updating profile",
      error,
    });
  }
};


// Shop Registration Controller
  export const shopRegisterController = async (req, res) => {
    try {
      const {
        fullname,
        owner_email,
        owner_contact,
        password,
        nic,
        businessregno,
        tax_id_no,
        shopname,
        email,
        businesstype,
        category,
        description,
        operating_hrs_from,
        operating_hrs_to,
        shoplocation,
        shopcontact,
      } = req.body;
  
      // If the request contains a file (image), convert it to binary
      const logo = {
        data: req.file.buffer, // Store the file buffer (binary data)
        contentType: req.file.mimetype, // Store the content type (e.g., 'image/png')
      };
  
      const hashedPassword = await hashPassword(password)

      // Create the shop object with all details and binary image
      const shop = await new shopModel({
        fullname,
        owner_email,
        owner_contact,
        password:hashedPassword,
        nic,
        businessregno,
        tax_id_no,
        shopname,
        email,
        businesstype,
        category,
        description,
        operating_hrs_from,
        operating_hrs_to,
        shoplocation,
        shopcontact,
        logo, // Save the image data
      }).save();
  
      res.status(201).json({
        success: true,
        message: 'Shop registered successfully',
        shop,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        success: false,
        message: 'Error in registration',
      });
    }
  };


// Zod schema for login validation
const loginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

// ==================== LOGIN ====================
export const userLoginController = async (req, res) => {
  try {
    // validate input
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ success: false, errors: parsed.error.errors });
    }

    const { email, password } = parsed.data;

    // safe query for user
    const user = await userModel.findOne({ email: { $eq: email } });
    if (user) {
      const match = await comparePassword(password, user.password);
      if (match) {
        const token = JWT.sign(
          { _id: user._id, role: user.role },
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        return res.status(200).send({
          success: true,
          message: "Login successful",
          token,
          role: user.role,
          user,
        });
      }
    }

    // safe query for shop
    const shop = await shopModel.findOne({ email: { $eq: email } });
    if (shop) {
      const match = await comparePassword(password, shop.password);
      if (match) {
        const token = JWT.sign(
          { _id: shop._id, role: 2 }, // assuming role 2 = shop owner
          process.env.JWT_SECRET,
          { expiresIn: "7d" }
        );
        return res.status(200).send({
          success: true,
          message: "Shop owner login successful",
          token,
          role: 2,
          shop,
        });
      }
    }

    // no match
    return res.status(400).send({ success: false, message: "Invalid email or password" });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).send({
      success: false,
      message: "Error during login",
      error: error.message,
    });
  }
};



export const updateShopProfileController = async (req, res) => {
  try {
    // Sanitize the user/shop ID
    const shopId = sanitize(String(req.user._id));

    // Validate that it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    const {
      fullname,
      owner_email,
      owner_contact,
      password,
      nic,
      businessregno,
      tax_id_no,
      shopname,
      email,
      businesstype,
      category,
      description,
      operating_hrs_from,
      operating_hrs_to,
      shoplocation,
      shopcontact,
    } = req.body;

    // Find the shop by ID
    const shop = await shopModel.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // Validate password length if provided
    if (password && password.length < 8) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long",
      });
    }

    // Hash the new password if provided
    const hashedPassword = password ? await hashPassword(password) : shop.password;

    // Update shop details
    const updatedShop = await shopModel.findByIdAndUpdate(
      shopId,
      {
        fullname: fullname || shop.fullname,
        owner_email: owner_email || shop.owner_email,
        owner_contact: owner_contact || shop.owner_contact,
        password: hashedPassword,
        nic: nic || shop.nic,
        businessregno: businessregno || shop.businessregno,
        tax_id_no: tax_id_no || shop.tax_id_no,
        shopname: shopname || shop.shopname,
        email: email || shop.email,
        businesstype: businesstype || shop.businesstype,
        category: category || shop.category,
        description: description || shop.description,
        operating_hrs_from: operating_hrs_from || shop.operating_hrs_from,
        operating_hrs_to: operating_hrs_to || shop.operating_hrs_to,
        shoplocation: shoplocation || shop.shoplocation,
        shopcontact: shopcontact || shop.shopcontact,
      },
      { new: true }
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      updatedShop,
    });
  } catch (error) {
    console.error("Error updating shop profile:", error);
    res.status(500).json({
      success: false,
      message: "Error while updating shop profile",
      error: error.message,
    });
  }
};
  

//get all shops
 export const getAllShopsController = async (req, res) => {
    try {
        const shops = await shopModel.find(); // Fetch all shops from the database
        res.status(200).send({
            success: true,
            shops,
        });
    } catch (error) {
        console.error(error);
        res.status(500).send({
            success: false,
            message: 'Error fetching shops',
            error,
        });
    }
};


export const getAllUsersController = async (req, res) => {
    try {
      const users = await userModel.find(); // Fetch all users from the database
      res.status(200).send({
        success: true,
        users,
      });
    } catch (error) {
      console.error(error);
      res.status(500).send({
        success: false,
        message: 'Error fetching users',
        error,
      });
    }
  };


//test controller
export const testcontroller = (req,res) => {
    res.send("Protected route");
}

//delete user profile
export const deleteUserProfileController = async (req, res) => {
  try {
    // Sanitize and cast the user ID
    const userId = sanitize(String(req.user._id));

    // Validate MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    // Check if user exists
    const user = await userModel.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Delete the user safely
    await userModel.findByIdAndDelete(userId);

    // Optional: Delete related data (orders, cart, wishlist) here

    return res.status(200).json({
      success: true,
      message: "User deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete user",
      error: error.message,
    });
  }
};

  

//delete shop profile
export const deleteShopProfileController = async (req, res) => {
  try {
    // Sanitize the user/shop ID
    const shopId = sanitize(String(req.user._id));

    // Validate that it's a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(shopId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid shop ID",
      });
    }

    // Check if the shop exists
    const shop = await shopModel.findById(shopId);
    if (!shop) {
      return res.status(404).json({
        success: false,
        message: "Shop not found",
      });
    }

    // Delete the shop
    await shopModel.findByIdAndDelete(shopId);

    res.status(200).json({
      success: true,
      message: "Shop deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting shop:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete shop",
      error: error.message,
    });
  }
};
  

// export const forgotPasswordController = async (req, res) => {
//   try {
//     const { email, newPassword, re_Password } = req.body;

//     // Validate input fields
//     if (!email) return res.status(400).send({ message: 'Email is required' });
//     if (!newPassword) return res.status(400).send({ message: 'New password is required' });
//     if (!re_Password) return res.status(400).send({ message: 'Please confirm your new password' });
//     if (newPassword !== re_Password) return res.status(400).send({ message: 'Passwords do not match' });

//     // Sanitize email to prevent NoSQL injection
//     const sanitizedEmail = sanitize(email);

//     // Check if the user exists
//     const user = await userModel.findOne({ email: { $eq: sanitizedEmail } });
//     if (!user) {
//       return res.status(404).send({
//         success: false,
//         message: "User with this email does not exist",
//       });
//     }

//     // Hash the new password
//     const hashedPassword = await hashPassword(newPassword);

//     // Update the user's password
//     await userModel.findByIdAndUpdate(user._id, { password: hashedPassword });

//     return res.status(200).send({
//       success: true,
//       message: "Password reset successfully",
//     });

//   } catch (error) {
//     console.error("Forgot password error:", error);
//     return res.status(500).send({
//       success: false,
//       message: 'Something went wrong',
//       error: error.message,
//     });
//   }
// };

export const requestPasswordReset = async (req, res) => {
  try {
    console.log('HIT /auth/reset/request', req.body?.email); // ⬅️ log

    const email = sanitize(req.body.email);
    // Always return 200 to avoid user enumeration
    const user = await userModel.findOne({ email: { $eq: email } }).select("_id email");

    if (user) {
      const token = crypto.randomBytes(32).toString("hex");
      const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

      await userModel.findByIdAndUpdate(user._id, {
        resetTokenHash: tokenHash,
        resetTokenExp : dayjs().add(30, "minute").toDate(),
      });

      // === Send email ===
      const base = process.env.APP_PUBLIC_URL || "http://localhost:5173";
      const resetUrl = `${base}/reset?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

      try {
        const info = await sendResetEmail(email, resetUrl);
        console.log('Mail sent (nodemailer):', info?.messageId || info?.response || 'ok');
      } catch (err) {
        console.warn('Email send failed; fallback link:', resetUrl, err?.message);
      }
    }

    return res.status(200).send({
      success: true,
      message: "If the account exists, a password reset email has been sent.",
    });
  } catch (e) {
    console.error("requestPasswordReset error:", e);
    return res.status(500).send({ success: false, message: "Error requesting reset" });
  }
};

export const performPasswordReset = async (req, res) => {
  try {
    const { email, token, newPassword, re_Password } = req.body;

    if (!newPassword || newPassword.length < 8) 
    return res.status(400).send({ message: "Password must be at least 8 characters long" });

    // Both values come from the same user request; not a secret comparison.
    // Timing attacks do not apply here (no attacker-visible oracle).
    if (newPassword !== re_Password) 
    return res.status(400).send({ message: "Passwords do not match" });

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");

    const user = await userModel.findOne({
      email: { $eq: sanitize(email) },
      resetTokenHash: tokenHash,
      resetTokenExp: { $gt: new Date() },
    }).select("_id");

    if (!user) {
      return res.status(400).send({ success: false, message: "Invalid or expired token" });
    }

    const pwHash = await hashPassword(newPassword);
    await userModel.findByIdAndUpdate(user._id, {
      password: pwHash,
      resetTokenHash: undefined,
      resetTokenExp: undefined,
    });

    // (Optional) Invalidate sessions/JWTs for the user here (if maintain a session store)

    return res.status(200).send({ success: true, message: "Password reset successfully" });
  } catch (e) {
    console.error("performPasswordReset error:", e);
    return res.status(500).send({ success: false, message: "Error performing reset" });
  }
};
  
// Controller to get total user and shop count
export const getTotalUserCountController = async (req, res) => {
  try {
      // Get the total count of users
      const userCount = await userModel.countDocuments();

      res.status(200).send({
          success: true,
          message: "Total user counts fetched successfully",
          data: {
              totalUsers: userCount,
          }
      });
  } catch (error) {
      console.log(error);
      res.status(500).send({
          success: false,
          message: "Error fetching total counts",
          error: error.message,
      });
  }
};

// Controller to get total user and shop count
export const getTotalShopCountController = async (req, res) => {
  try {
      // Get the total count of shops
      const shopCount = await shopModel.countDocuments();

      res.status(200).send({
          success: true,
          message: "Total shop count fetched successfully",
          data: {
              totalShops: shopCount,
          }
      });
  } catch (error) {
      console.log(error);
      res.status(500).send({
          success: false,
          message: "Error fetching total counts",
          error: error.message,
      });
  }
};


// Controller to get user growth over time
export const getUserGrowthController = async (req, res) => {
    try {
        // MongoDB aggregation pipeline to get user count per month
        const userGrowthData = await userModel.aggregate([
            {
                // Match users that have a createdAt timestamp
                $match: {
                    createdAt: { $exists: true }
                }
            },
            {
                // Group users by month and year
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    userCount: { $sum: 1 } // Count users for each group
                }
            },
            {
                // Sort by year and month
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                // Format the month and year for frontend
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    userCount: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: userGrowthData
        });
    } catch (error) {
        console.error("Error fetching user growth data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching user growth data",
            error: error.message
        });
    }
};


// Controller to get shop growth over time
export const getShopGrowthController = async (req, res) => {
    try {
        // MongoDB aggregation pipeline to get shop count per month
        const shopGrowthData = await shopModel.aggregate([
            {
                // Match shops that have a createdAt timestamp
                $match: {
                    createdAt: { $exists: true }
                }
            },
            {
                // Group shops by month and year
                $group: {
                    _id: {
                        month: { $month: "$createdAt" },
                        year: { $year: "$createdAt" }
                    },
                    shopCount: { $sum: 1 } // Count shops for each group
                }
            },
            {
                // Sort by year and month
                $sort: { "_id.year": 1, "_id.month": 1 }
            },
            {
                // Format the month and year for frontend
                $project: {
                    _id: 0,
                    month: {
                        $concat: [
                            { $arrayElemAt: [["", "January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"], "$_id.month"] },
                            " ",
                            { $toString: "$_id.year" }
                        ]
                    },
                    shopCount: 1
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: shopGrowthData
        });
    } catch (error) {
        console.error("Error fetching shop growth data:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching shop growth data",
            error: error.message
        });
    }
};


// Controller to get shop count by category
export const getShopCountByCategoryController = async (req, res) => {
    try {
        const categoryCounts = await shopModel.aggregate([
            {
                $group: {
                    _id: "$category", // Group by the category field
                    count: { $sum: 1 } // Count the number of shops in each category
                }
            }
        ]);

        res.status(200).json({
            success: true,
            data: categoryCounts
        });
    } catch (error) {
        console.error("Error fetching shop count by category:", error);
        res.status(500).json({
            success: false,
            message: "Error fetching shop count by category",
            error: error.message
        });
    }
};


//get promotiom image
export const logoController = async(req,res) => {
    try{
        const shop = await shopModel.findById(req.params.pid).select("logo");
        if(shop.logo){
            res.set("Content-type",shop.logo.contentType);
            return res.status(200).send(shop.logo.data)
        }
    }
    catch(error){
        console.log(error)
        res.status(500).send({
            success:false,
            message:'Error while getting promotion image',
            error
        })
    }
}

