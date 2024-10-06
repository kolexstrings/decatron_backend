const User = require("../models/User");
const Role = require("../models/Role");
const { validationResult } = require("express-validator");
const { ObjectId } = require("mongodb");


const getUsers = async (req, res) => {
  try {
    // const users = await User.find();
    const users = await User.find().select("name role email phone createdAt");
    res.json(users);
  } catch (error) {
    res.status(500).json({ responseMessage: error.message });
  }
};

const editUsers = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ responseCode: 400, responseMessage: errors.array() });
    }
    const { id } = req.body;
    const objectId = new ObjectId(id);
    const userdb = await User.findOne({ _id: objectId });
    if (!userdb) {
      return res.status(404).json({
        responseMessage: "Record not found",
        responseCode: 404,
      });
    } else {
      return res.status(200).json({
        responseMessage: "Record Found",
        responseCode: 200,
        data: {
          name: userdb.name,
          role: userdb.role,
          email: userdb.email,
          phone: userdb.phone,
          id: id,
        },
      });
    }
  } catch (error) {
    res.status(400).json({ responseCode: 400, responseMessage: error.message });
  }
};

const updateUsers = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ responseCode: 400, responseMessage: errors.array() });
  }

  try {
    const { id } = req.body; // id is required
    const userData = {};

    // Only add fields to userData if they are present in req.body
    if (req.body.name) userData.name = req.body.name;
    if (req.body.phone) userData.phone = req.body.phone;
    if (req.body.email) userData.email = req.body.email;
    if (req.body.role) userData.role = req.body.role;
    if (req.body.identificationDocument) userData.identificationDocument = req.body.identificationDocument;
    if (req.body.identificationNo) userData.identificationNo = req.body.identificationNo;

    // If a passport file is uploaded, add it to the userData
    if (req.file) {
      userData.passport = req.file.path; // Assuming passport field stores the file path
    }

    // Check if the role exists in the database if the role is passed
    if (req.body.role) {
      const slug = req.body.role.toLowerCase().replace(/\s+/g, "-");
      const roledb = await Role.findOne({ slug });
      if (!roledb) {
        return res.status(404).json({
          responseMessage: "Role doesn't exist",
          responseCode: 404,
        });
      }
      userData.role = req.body.role;
    }

    // Find and update the user by ID
    const updatedUser = await User.findByIdAndUpdate(id, userData, { new: true }).select("-password");

    if (!updatedUser) {
      return res
        .status(404)
        .json({ responseCode: 404, responseMessage: "User not found" });
    }

    return res.status(200).json({
      responseCode: 200,
      responseMessage: "User updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);

    if (error.name === "MongoError" && error.code === 11000) {
      return res.status(400).json({
        responseCode: 400,
        responseMessage: "Duplicate email address",
      });
    }

    if (error.name === "CastError" && error.kind === "ObjectId") {
      return res
        .status(400)
        .json({ responseCode: 400, responseMessage: "Invalid user ID" });
    }

    return res.status(500).json({
      responseCode: 500,
      responseMessage: "Database connection error",
    });
  }
};


const deleteUser = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res
        .status(400)
        .json({ responseCode: 400, responseMessage: errors.array() });
    }

    const { id } = req.body;
    const objectId = new ObjectId(id);
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ responseCode: 404, responseMessage: "User not found" });
    }

    // Delete the user
    await User.findByIdAndDelete({ _id: objectId });

    // Respond with a success message
    return res.status(200).json({
      responseCode: 200,
      responseMessage: "User deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ responseCode: 500, responseMessage: error.message });
  }
};

const rateUser = async (req, res) => {
  const { rating, reviewerID, comment, userID } = req.body; // Get rating details from the request body
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res
      .status(400)
      .json({ responseCode: 400, responseMessage: errors.array() });
  }
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      responseCode: 400,
      responseMessage: "Rating must be between 1 and 5.",
    });
  }

  try {
    const objectId = new ObjectId(userID);
    const user = await User.findOne({ _id: objectId });

    if (!user) {
      return res
        .status(404)
        .json({ responseCode: 404, responseMessage: "User not found." });
    }

    // Add new rating
    const newRating = {
      rating,
      reviewerID,
      comment,
      createdAt: new Date(),
    };

    user.ratings.push(newRating);

    await user.save();

    res.status(404).json({
      responseCode: 200,
      responseMessage: "Rating added successfully",
      ratings: user.ratings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ responseCode: 500, responseMessage: error.message });
  }
};

const fetchUserRating = async (req, res) => {
  const { userID } = req.body; // Get userID from the request parameters

  try {
    const objectId = new ObjectId(userID);
    const user = await User.findOne({ _id: objectId }, "ratings"); // Only select the 'ratings' field

    if (!user) {
      return res
        .status(404)
        .json({ responseCode: 404, responseMessage: "User not found." });
    }

    // Calculate the average rating
    const ratings = user.ratings;
    const totalRatings = ratings.length;
    const sumOfRatings = ratings.reduce((acc, curr) => acc + curr.rating, 0);
    const averageRating =
      totalRatings > 0 ? (sumOfRatings / totalRatings).toFixed(1) : 0;

    res.status(200).json({
      responseMessage: "Ratings fetched successfully",
      responseCode: 200,
      averageRating: parseFloat(averageRating), // Return the average rating
      ratings: user.ratings,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ responseCode: 500, responseMessage: error.message });
  }
};

module.exports = {
  getUsers,
  editUsers,
  updateUsers,
  deleteUser,
  rateUser,
  fetchUserRating,
};
