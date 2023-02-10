const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const env = require("dotenv").config();
const bcrypt = require('bcryptjs');
const newuser = require('./models/newuser');
const Post = require('./models/post');

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

app.get("/", (req, res) => {
    res.json({
        Message: "Welcome to Test API",
        Status: "Success",
    })
});

// CRUD operations on social media post
// Creating a post with jwt authentication.
app.post('/createpost', async (req, res) => {
    try {
        const { title, body, image } = req.body;

        if (!title || !body || !image) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }
        else {

            // if image already exists
            const alreadypost = await Post.findOne({ image: image });

            // Checking if user exists
            if (alreadypost) {
                return res.status(422).json({ error: "Post Already Exists" });
            }
            else {
                const post = new Post({
                    title: title,
                    body: body,
                    image: image,
                    like: 0,
                    comments: [],
                })

                // jwt authenticaiton
                const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
                post.tokens = post.tokens.concat({ token: token });


                const createdpost = await post.save();
                return res.status(200).json({
                    Message: "Successfully Created",
                    Title: createdpost.title,
                    Body: createdpost.body,
                    Image: createdpost.image,
                    Like: createdpost.like,
                    Comments: createdpost.comments,
                    Token: token,
                });
            }
        }
    } catch (err) {
        res.status(500).json(err)
    }
});

// Reading all posts
app.get('/allposts', async (req, res) => {
    try {
        const allposts = await Post.find();

        if (allposts.length === 0) {
            return res.status(422).json({ error: "No Posts Found" });
        }
        else {
            return res.status(200).json(allposts);
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// Reading a post
app.get('/readpost/:id', async (req, res) => {
    try {
        const image = req.params.id;
        const post = await Post.find({ image });

        if (post === null) {
            return res.status(422).json({ error: "Post Not Found" });
        }
        else {
            return res.status(200).json(post);
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// Updating a post
app.put('/updatepost/:id', async (req, res) => {
    try {
        const image = req.params.id;
        const { title, body } = req.body;

        if (!title || !body) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }
        else {
            const post = await Post.findOneAndUpdate({ image }, {
                title: title,
                body: body
            }, {
                new: true,
            });

            // jwt authenticaiton
            const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
            post.tokens = post.tokens.concat({ token: token });

            if (!post) {
                return res.status(422).json({ error: "Post Not Found" });
            }
            else {
                return res.status(200).json({
                    Message: "Successfully Updated",
                    Title: post.title,
                    Body: post.body,
                    Image: post.image,
                    Token: token,
                });
            }
        }
    } catch (err) {
        res.status(500).json({ "error": "Post not found" });
    }
});

// Deleting a post
app.delete('/deletepost/:id', async (req, res) => {
    try {
        const image = req.params.id;
        const post = await Post.findOneAndDelete(image);

        if (!post) {
            return res.status(422).json({ error: "Post Not Found" });
        }
        else {
            // jwt authenticaiton
            const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
            post.tokens = post.tokens.concat({ token: token });

            return res.status(200).json({
                Message: "Successfully Deleted",
                Title: post.title,
                Body: post.body,
                Image: post.image,
                Token: token,
            });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// Like a post
app.put('/likepost/:id', async (req, res) => {
    try {
        const image = req.params.id;
        const post = await Post.findOne({ image });

        if (!post) {
            return res.status(422).json({ error: "Post Not Found" });
        }
        else {
            // jwt authenticaiton
            const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
            post.tokens = post.tokens.concat({ token: token });

            post.like = post.like + 1;
            post.save();

            return res.status(200).json({
                Message: "Successfully Liked",
                Title: post.title,
                Body: post.body,
                Image: post.image,
                Like: post.like,
                Comments: post.comments,
                Token: token,
            });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// Comment on a post
app.put('/commentpost/:id', async (req, res) => {
    try {
        const image = req.params.id;
        const { comment } = req.body;

        const post = await Post.findOne({ image });

        if (!comment) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }
        else {
            // jwt authenticaiton
            const token = jwt.sign({ _id: req.body._id }, process.env.SecretKey);
            post.tokens = post.tokens.concat({ token: token });

            post.comments = post.comments.concat({ comment });
            post.save();
            return res.status(200).json({
                Message: "Successfully Commented",
                Title: post.title,
                Body: post.body,
                Image: post.image,
                Like: post.like,
                Comments: post.comments,
                Token: token,
            });
        }
    } catch (err) {
        res.status(500).json(err);
    }
});

// Registering a user
app.post('/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        if (!username || !email || !password) {
            return res.status(422).json({ error: "Please fill all the fields" });
        }
        else {
            // Encrypting password
            const hashpassword = await bcrypt.hash(password, 10);

            // Checking if user already exists
            const alreadyuser = await newuser.findOne({ username: username });

            if (alreadyuser) {
                return res.status(422).json({ error: "User Already Exists" });
            }

            // inserting in database
            const user = new newuser({
                username: username,
                email: email,
                password: hashpassword,
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

// Logging in a user
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
            // Encrypting password
            const isMatch = await bcrypt.compare(password, user.password);

            // Checking if password is correct
            if (!isMatch) {
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
    console.log('Server is running');
});