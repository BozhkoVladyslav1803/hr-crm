const express=require('express')
const router=express.Router();
const{body}=require("express-validator");

const{
    homePage,
    register,
    registerPage,
    login,
    loginPage
}=require('./controllers/userController');

//router.get('/register',registerPage);
//router.post('/register',register);

module.exports=router;
/*const ifNotLoggedin=(req,res,next)=>{
    if(!req.session.userID){
        return res.redirect('/register');
    }
    next();
}

const ifLoggedin=(req,res,next)=>{
    if(!req.session.userID){
        return res.redirect('/');
    }
    next();
}*/

/*function a1(){
    return console.log(1)
}

function a2(){
    return console.log(2)
}

//router.get('/register',a1, ifLoggedin,a2, registerPage);
router.post(
    "/register",
    //ifLoggedin,
    [
        body("_name", "minimum 3 characters")
        .notEmpty()
        .trim()
        .escape(),
        body("_email","invalid email")
        .notEmpty()
        .trim()
        .isEmail(),
        body("_password","minimum 4 characters")
        .notEmpty()
        .trim()
    ],
    register
);*/

//router.get("/",ifNotLoggedin,homePage);
//router.get('/login',ifLoggedin,loginPage);
/*router.post('/login',
[
    body("email",'ivalid email')
    .notEmpty()
    .escape()
    .trim()
    .isEmail(),
    body("password","minimum 4 characters")
    .notEmpty()
    .trim()
],
login
);*/


/*router.get("/logout.ejs",(req,res,next)=>{
    req.session.destroy((err)=>{
        next(err);
    });
    res.redirect('/login.ejs');
});*/


