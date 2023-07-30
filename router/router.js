const express = require('express')
const router = express.Router()

const bodyParser = require("body-parser");
const mongoose = require('mongoose')
const User = mongoose.model('FusioTech')
const bcrypt = require('bcrypt')
const middleware = require('../middleware/middleware.js')
const jwt = require('jsonwebtoken')
const Course = mongoose.model('FusioTech_Course')


router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());

router.post('/deleteCourse', middleware, async (req, res) => {
    console.log("deleteCourse");
    try {
        const courseId = req.body.id;

        // Find the course by its ID and delete it
        const course = await Course.findByIdAndDelete(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        res.status(200).json({ message: 'Course Deleted successfully...' });
    } catch (error) {
        console.log('Error deleting course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/removeCourse', middleware, async (req, res) => {
    console.log("removeCourse");
    try {
        const courseId = req.body.id;
        console.log(req.user.courceId);

        // Remove the courseId from the user's courseId array
        req.user.courceId = req.user.courceId.filter((id) => id !== courseId);
        await req.user.save();

        // Find the course by its ID
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Remove the user's email from the enrollID of the course
        course.enrollID = course.enrollID.filter((email) => email !== req.user.email);
        await course.save();

        res.status(200).json({ message: 'Course removed successfully...' });
    } catch (error) {
        console.log('Error removing course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post('/addCourse', middleware, async (req, res) => {
    console.log("addCourse");
    try {
        const courseId = req.body.id; // Assuming the request body contains the courseId

        // Find the course by courseId
        const course = await Course.findById(courseId);

        if (!course) {
            return res.status(404).json({ error: 'Course not found' });
        }

        // Check if user (req.user) is already enrolled in the course
        if (course.enrollID.includes(req.user.email)) {
            return res.status(400).json({ error: 'User already enrolled in the course' });
        }

        // Check if courseId is already present in the user's courceId array
        if (req.user.courceId.includes(courseId)) {
            return res.status(400).json({ error: 'Course ID already exists in User schema' });
        }

        // Save the user object (req.user) in the enrollID array
        course.enrollID.push(req.user.email);
        await course.save();

        // Save the courseId in the user's courceId array
        req.user.courceId.push(courseId);
        await req.user.save();

        res.status(200).json({ message: 'Course Added Successfully...', path: `User: ${req.user.name} | enrolled Course: ${course.title}` });
    } catch (error) {
        console.log('Error adding course and enrolling user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


router.post("/register", async (req, res) => {
    console.log("register");
    const { name, email, password, CurrentUserType } = req.body;
    if (!name || !email || !password || !CurrentUserType) {
        return res.send({ error: "Fill Complete details" })
    }
    // console.log(name + " " + email + " " + password + " " + CurrentUserType);

    const encryptedPassword = await bcrypt.hash(password, 10);
    try {
        const oldUser = await User.findOne({ email });

        if (oldUser) {
            return res.json({ error: "User Exists" });
        }
        const response = await User.create({
            name,
            email,
            password: encryptedPassword,
            role: CurrentUserType,
        });
        return res.json({ success: "User Registered Successfully" });
        // res.send({ status: "Data Save Succesfully" });
    } catch (error) {
        res.status(400).send({ message: error });
    }
});

router.post("/loginUser", async (req, res) => {
    console.log("loginUser");
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
        return res.json({ error: "User Not found" });
    }
    if (await bcrypt.compare(password, user.password)) {
        console.log(user);
        const token = jwt.sign({ email: user.email, role: user.role, name: user.name }, process.env.JWT_SECRET);

        if (res.status(201)) {
            return res.json({ message: "Login Successfully", token: token, user: user });
        } else {
            return res.json({ error: "error" });
        }
    }
    res.json({ status: "error", error: "Invalid Authentication" });
});


router.post('/uploadVideo', middleware, async (req, res) => {
    try {
        // Check the user's role
        const { role } = req.user;

        if (role === 'User') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        const {
            title,
            createBy,
            courseUrl,
            description,
            syllabus,
            extraDescription,
        } = req.body;
        // Create a new course document
        const course = new Course({
            title,
            createBy,
            courseUrl,
            description,
            syllabus,
            extraDescription,
        });

        // Save the course to the database
        await course.save();
        console.log("Video uploaded");
        res.status(200).json({ message: 'Course Uploaded Successfully...' });
    } catch (error) {
        console.error('Error saving course:', error);
        res.status(500).json({ message: 'Failed to save course' });
    }
});


router.get('/getCourses', middleware, async (req, res) => {
    try {
        // Check the user's role
        const { role, email } = req.user;

        if (role === 'User') {
            return res.status(403).json({ error: 'Unauthorized access' });
        }

        // Find all courses created by the user's email
        const courses = await Course.find({ createBy: email }).sort({ createdAt: 'desc' });

        res.status(200).json({ courses });
    } catch (error) {
        console.error('Error retrieving courses:', error);
        res.status(500).json({ error: 'Failed to retrieve courses' });
    }
});

router.get('/getAllCourses', async (req, res) => {
    console.log("getAllCourses");
    try {
        const courses = await Course.find();
        res.status(200).json({ courses });
    } catch (error) {
        console.error('Error retrieving courses:', error);
        res.status(500).json({ error: 'Failed to retrieve courses' });
    }
});


router.get('/getMyCourses', middleware, async (req, res) => {
    try {
        // Find the user by its ID along with the 'courceId' field
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Extract the courses from the user's 'courceId' array
        const userCourses = user.courceId;

        // Find all courses that match any of the course IDs in the 'userCourses' array
        const courses = await Course.find({ _id: { $in: userCourses } });

        res.status(200).json({ courses });
    } catch (error) {
        console.error('Error retrieving courses:', error);
        res.status(500).json({ error: 'Failed to retrieve courses' });
    }
});


module.exports = router; 