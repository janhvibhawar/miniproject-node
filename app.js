const express = require('express');
const app = express();
const path = require('path');
const userModel = require("./models/user")
const postModel = require("./models/post")
const cookieParser = require('cookie-parser')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const upload = require("./config/multerconfig");

app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(express.static(path.join(__dirname, "public")));
app.set('view engine' , 'ejs');
app.use(cookieParser());


app.get("/" , (req,res) => {
    res.render("index");
})

app.get("/profile/upload" , (req,res) => {
    res.render("profileupload");
})

app.post("/upload" ,isloggedIn, upload.single("image"), async (req,res) => {
    let user = await userModel.findOne({email: req.user.email});
    user.profilepic = req.file.filename;
    await user.save();
    res.redirect("/profile");
})

app.get("/profile", isloggedIn, async (req, res) => {
    let user = await userModel
        .findOne({ email: req.user.email })
        .populate("posts");

    if (!user) {
        return res.redirect("/login");
    }

    res.render("profile", { user });
});

app.get("/like/:id" ,isloggedIn, async (req,res) => {
    let post = await postModel.findOne({_id: req.params.id}).populate("user");

    if(post.likes.indexOf(req.user.userid) === -1){
        post.likes.push(req.user.userid);   
    }
    else{
        post.likes.splice(post.likes.indexOf(req.user.userid), 1);
    }


    await post.save();
    res.redirect("/profile");
})

app.get("/edit/:id" ,isloggedIn, async (req,res) => {
     let post = await postModel.findOne({_id: req.params.id}).populate("user");

     res.render("edit", {post});
})

app.get("/delete/:id", isloggedIn, async (req, res) => {
    let post = await postModel.findOne({ _id: req.params.id });

    if (!post) return res.redirect("/profile");

    await userModel.findByIdAndUpdate(post.user, {
        $pull: { posts: post._id }
    });

    await postModel.findByIdAndDelete(post._id);

    res.redirect("/profile");
});

app.post("/update/:id" ,isloggedIn, async (req,res) => {
     let post = await postModel.findOneAndUpdate({_id: req.params.id},{content: req.body.content});
     res.redirect("/profile");
})


app.post("/register" , async (req,res) => {
    let {name,username,email,age,password} = req.body;

    let user = await userModel.findOne({email});
    if(user) return res.status(500).send("User already registered");
   

    bcrypt.genSalt(10, (err,salt) => {
        bcrypt.hash(password, salt , async (err,hash) => {
           let user = await userModel.create({
                name,
                username,
                password: hash,
                age,
                email
            });

            let token = jwt.sign({email: email, userid: user._id}, "shhh");
            res.cookie("token", token);
            res.send("Registered");
        })
    })
})

app.get("/login" , (req,res) => {
    res.render("login");
})

app.post("/login" ,async (req,res) => {
    let {email,password} = req.body;

    let user = await userModel.findOne({email});
    if(!user) return res.status(500).send("Something went wrong!")

    bcrypt.compare(password, user.password, function(err,result){
        if(result){
            let token = jwt.sign({email: email, userid: user._id}, "shhh");
            res.cookie("token", token);
            res.status(200).redirect('/profile')
        }       
        else res.redirect("/login");
});
})

app.post("/post" ,isloggedIn, async (req,res) => {
    let user = await userModel.findOne({email: req.user.email});
    let {content} = req.body;

    let post = await postModel.create({
         user: user._id,
         content 
    });

    user.posts.push(post._id);
    await user.save();
    res.redirect("/profile");
})

app.get("/logout" , (req,res) => {
    res.cookie("token", "");
    res.redirect("/login");
})

function isloggedIn(req, res, next) {
    try {
        if (!req.cookies.token) {
            return res.redirect("/login");
        }

        let data = jwt.verify(req.cookies.token, "shhh");
        req.user = data;
        next();
    } catch (err) {
        return res.redirect("/login");
    }
}

app.listen(3000, () => {
    console.log("Server started");
})