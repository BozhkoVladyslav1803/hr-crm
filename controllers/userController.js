const { validationResult } = require('express-validator'); // Fix import statement
const bcrypt = require('bcryptjs');
const dbConnection = require('../utils/dbConnection'); // Fix the path
const session = require('express-session');

//register
exports.registerPage = (req, res, next) => {
    res.render('register.ejs');
};

//user regist
exports.register = async (req, res, next) => {
    let first_name = req.body.first_name;
    console.log('email: ', first_name);
    let last_name = req.body.last_name;
    console.log('last_name: ', last_name);
    let middle_name = req.body.middle_name;
    console.log('middle_name: ', middle_name);
    let email = req.body.email;
    console.log('email: ', email);
    let password = req.body.password;
    console.log('password: ', password);

    console.log(req.body);
    const errors = validationResult(req);
    const { body } = req;
    if (!errors.isEmpty()) {
        return res.render('register.ejs', {
            error: errors.array()[0].msg,
        });
    }

    try {
        //email already exists or not?
        const [result] = await dbConnection
            .promise()
            .execute('SELECT * FROM hr_db.user where email=?', [email]);
        console.log('Rows:', result);
        console.log('пул закритий');
        console.log('lenght ', result.length);
        if (result.length > 0) {
            return res.render('register.ejs', {
                error: 'Email already exists',
            });
        }

        //inserting data into user table
        const hashPass = await bcrypt.hash(password, 12);
        console.log('hashPass ', hashPass);
        const [rows] = await dbConnection
            .promise()
            .execute(
                'INSERT INTO hr_db.user(`first_name`,`last_name`,`middle_name`, `email`, `password`) VALUES(?,?,?,?,?)',
                [first_name, last_name, middle_name, email, hashPass]
            );
        console.log('rows', rows);
        const lastInsertIdResult = await dbConnection
            .promise()
            .execute('SELECT LAST_INSERT_ID() as id');
        console.log('lastInsertIdResult', lastInsertIdResult);

        const lastInsertId = lastInsertIdResult[0][0].id;
        console.log('lastInsertId', lastInsertId);

        if (lastInsertId > 0) {
            req.session.userID = lastInsertId;
            return res.redirect('/login');
        } else {
            return res.render('register.ejs', {
                error: 'Failed to register. Please try again.',
            });
        }
    } catch (err) {
        next(err);
    }
};

//login page due to 'get' request
exports.loginPage = (req, res, next) => {
    res.render('login');
};

var first_name;
var last_name;
var middle_name;
var email;
var photoImg;
//login user due to 'post' request
exports.login = async (req, res, next) => {
    email = req.body.email_l;

    console.log(req.body.email_l);
    try {
        const [checkPassQuery] = await dbConnection
            .promise()
            .execute('SELECT * FROM hr_db.user where email=?', [
                req.body.email_l,
            ]);

        first_name = checkPassQuery[0].first_name;
        last_name = checkPassQuery[0].last_name;
        middle_name = checkPassQuery[0].middle_name;
        photoImg=checkPassQuery[0].photo;
        
        if(photoImg){
            const getPhotoName = searchDataPhoto(photoImg.data);
            console.log('getFilePathPhoto',getPhotoName)
            photoImg=getPhotoName;
        }
        console.log('values: ', first_name, email);
        if (!checkPassQuery || checkPassQuery.length === 0) {
            return res.render('login.ejs', {
                error: 'User not found',
            });
        }

        const errors = validationResult(req);
        const { body } = req;
        if (!errors.isEmpty) {
            return res.render('login.ejs', {
                error: errors.array()[0].msg,
            });
        }

        console.log('rows[0].password: ', checkPassQuery[0].password);
        const checkPass = await bcrypt.compare(
            req.body.password_l,
            checkPassQuery[0].password
        );
        if (checkPass == true) {
            req.session.userID = checkPassQuery[0].id;
            console.log('rows[0].password: ', checkPassQuery[0].id);
            //return res.redirect('/dashboard');
            return res.redirect(`/dashboard`);
        }
        res.render('login.ejs', {
            error: 'invalid password',
        });
    } catch (err) {
        next(err);
    }
};

exports.dashboardPage = async (req, res, next) => {
    res.render('dashboard.ejs', {
        first_name: first_name,
        last_name: last_name,
        middle_name: middle_name,
        email: email,
        photo: photoImg
    });
};

var inputValue;

exports.dashboard = async (req, res, next) => {
    inputValue = req.body.button_dashboard;
    if (inputValue == 'create_request') {
        return res.redirect(`/dashboard/create_request`);
    } else if (inputValue == 'edit_user') {
        return res.redirect(`/dashboard/edit_user`);
    }else{
        return res.redirect('/dashboard')
    }
};

exports.editUserPage = async (req, res, next) => {
    res.render('editUser.ejs');
};

const fs = require('fs');
const { promisify } = require('util');
const { dirname } = require('path');
const readFileAsync = promisify(fs.readFile);

exports.editUser = async (req, res, next) => {
    try {
        let sampleFile;
        
        if (!req.files || Object.keys(req.files).length === 0) {
            return console.log('No files were uploaded on web.');
        }

        sampleFile = req.files.sampleFile;
        
        const [checkPassQueryID] = await dbConnection
            .promise()
            .execute('SELECT * FROM hr_db.user where id=?', [
                req.session.userID
            ]);
        
        if(req.body.email!==checkPassQueryID[0].email){
            //email already exists or not?
            const [checkPassQueryEmail] = await dbConnection
                .promise()
                .execute('SELECT * FROM hr_db.user where email=?', [
                    req.body.email,
            ]);
            console.log('Rows:', checkPassQueryEmail);
            console.log('пул закритий');
            console.log('lenght ', checkPassQueryEmail.length);
            if (checkPassQueryEmail.length > 0) {
                return res.render('register.ejs', {
                    error: 'Email already exists'
                });
            }    
        }

        var first_name = req.body.first_name;
        console.log('first_name: ', first_name);
        var last_name = req.body.last_name;
        console.log('last_name: ', last_name);
        var email = req.body.email;
        console.log('email: ', email);
        if(req.body.password)
            var password = req.body.password;
        else 
            if (req.body.password.trim().length === 0) {
                return res.render('editUser.ejs', {
                    error: 'Password is required',
                });
            }
        else
            return res.render('editUser.ejs', {
                error: 'Other errors',
            });
        console.log('password: ', password);
        let joined_date = req.body.joined_date;
        console.log('joined_date: ', joined_date);
        let branch = req.body.branch;
        console.log('branch: ', branch);
        var photo = sampleFile.data;
        console.log('photo', photo);
        console.log('req.session.userID', req.session.userID);

        const [new_edit] = await dbConnection
            .promise()
            .execute(
                'UPDATE hr_db.user SET first_name = ?,last_name = ?,email = ?,joined_date = ?,branch = ?,password = ?, photo = ? WHERE id=?',
                [
                    first_name || null,
                    last_name || null,
                    email,
                    joined_date || null,
                    branch || null,
                    (await bcrypt.hash(password, 12)),
                    photo || null,
                    req.session.userID || null,
                ]
            );
        console.log('new_edit', new_edit);
        const folderPath =require('path').join(__dirname, '../public/');
        const fileNameToSearch = sampleFile.name;
        try {
            const [mid_nq] = await dbConnection
                .promise()
                .execute('SELECT * FROM hr_db.user where email=?', [
                    req.body.email,
                ]);

                var middle_name = mid_nq[0].middle_name;

                const resultFilePath = searchFile(folderPath, fileNameToSearch);
                console.log('resultFilePath',resultFilePath);

                if (resultFilePath) {
                console.log(`Файл знайдено: ${resultFilePath}`);
                } else {
                    fs.writeFileSync(folderPath+fileNameToSearch, sampleFile.data);
                    console.log(`Файл збережено`);
                }
                photoImg=fileNameToSearch;
                inputValue=null;
        } catch (err) {
            next(err);
        }
        res.redirect(`/dashboard`);
    } catch (err) {
        next(err);
    }
};

//пошук файлу в папці
function searchFile(folder, fileName) {
    const files = fs.readdirSync(folder);
  
    for (const file of files) {
      const filePath = require('path').join(folder, file);
      if (file === fileName) {
        return filePath;
      }
    }
    return null;
  }

//пошук файлу в папці
function searchDataPhoto(data) {
    const files = fs.readdirSync(require('path').join(__dirname, '../public/'));
    for (const file of files) {
        if (file.data === data) {
            return file;
        }
    }
    return null;
  }

exports.createRequestPage = async (req, res, next) => {
    res.render('createRequest.ejs');
};

exports.createRequest = async (req, res, next) => {
    res.render('createRequest.ejs');
};

exports.logoutPage = async (req, res, next) => {
    res.render('logout.ejs');
};
