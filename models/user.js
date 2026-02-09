const mongoose = require('mongoose');

mongoose.connect(
  "mongodb+srv://janhvibhawar28_db_user:JanhviCode123@cluster0.qlzrydb.mongodb.net/miniproject"
)
.then(() => console.log("MongoDB Connected"))
.catch(err => console.log(err));

const userSchema = mongoose.Schema({
    name : String,
    username : String,
    email : String,
    password : String,
    age : Number,
    profilepic : {
        type : String,
        default : "default.png"
    },
    posts: [{type: mongoose.Schema.Types.ObjectId, ref:"post"}],
});

module.exports = mongoose.model('user', userSchema);