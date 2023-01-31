const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const env = require("dotenv").config();
const newuser = require('./models/newuser');

const app = express();
const port = process.env.PORT || 8000;
const conn = process.env.DataBase;

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
mongoose.set('strictQuery', false); // to not show warning

mongoose.connect(conn, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Database Connected");
}).catch((err) => console.log(err));

app.get('', (req, res) => {
    res.status(200).send('Test API is running');
});

app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }
        else {
            // Checking if user already exists
            const alreadyuser = await newuser.findOne({ username: username });

            // Checking if user exists
            if (alreadyuser) {
                return res.status(422).json({ error: "User Already Exists" });
            }

            // inserting in database
            const user = new newuser({
                username: username,
                email: email,
                password: password,
            })

            // Web token generation
            const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
            user.tokens = user.tokens.concat({ token: token });

            // Saving in database
            const registered = await user.save();
            return res.status(200).json({
                Message: "Successfully Registered",
                User: registered.username,
                Email: registered.email,
                Password: registered.password,
                Token: token,
            });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }
        else {
            // Finding in database
            const user = await newuser.findOne({ username: username });

            // Checking if user exists
            if (!user) {
                return res.status(422).json({ error: "Invalid Credentials" });
            }

            // Checking if password is correct
            if (password !== user.password) {
                return res.status(422).json({ error: "Invalid Credentials" });
            }

            // Web token generation
            const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
            user.tokens = user.tokens.concat({ token: token });

            // Saving in database
            const loggedin = await user.save();

            return res.status(200).json({
                Message: "Successfully Logged In",
                User: loggedin.username,
                Email: loggedin.email,
                Password: loggedin.password,
                Token: token,
            })

        }
    } catch (err) {
        res.status(500).json(err);
    }
});

app.patch("/forgot-password", async (req, res) => {
    try {
        const { username, newpassword } = req.body;

        if (!username || !newpassword) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }
        else {
            // Finding in database
            const user = await newuser.findOne({ username: username });

            // Checking if user exists
            if (!user) {
                return res.status(422).json({ error: "Invalid Credentials" });
            }

            // Web token generation
            const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
            user.tokens = user.tokens.concat({ token: token });
            user.password = newpassword;

            // Saving in database
            const loggedin = await user.save();

            return res.status(200).json({
                Message: "Successfully PassWord Changed",
                User: loggedin.username,
                Email: loggedin.email,
                Password: loggedin.password,
                Token: token,
            })
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

app.listen(port, () => {
    console.log(`Running on https://localhost:${port}`);
});