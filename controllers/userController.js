const { validationResult } = require('express-validator'); // Fix import statement
const bcrypt = require('bcryptjs');
const dbConnection = require('../utils/dbConnection'); // Fix the path
const session = require('express-session');

//home
/*exports.homePage = async (req, res, next) => {
    const [row] = await dbConnection.execute(
        "SELECT * FROM 'user' WHERE 'id'=?",
        [req.session.userID]
    );
    if (row.lenght !== 1) {
        return res.redirect('logout.ejs');
    }
    res.render('dashboard', {
        user: row[0],
    });
};*/

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
    });
};

exports.dashboard = async (req, res, next) => {
    var inputValue = req.body.button_dashboard;
    if (inputValue == 'create_request') {
        return res.redirect(`/dashboard/create_request`);
    } else if (inputValue == 'edit_user') {
        return res.redirect(`/dashboard/edit_user`);
    }
};

/*const fs = require("fs");
const inputfile = "profile.jpg";
const outputfile = "output.png";
pool.query("INSERT INTO hr_db.user (photo) VALUES(BINARY(:data))", { data }, function(err, res) {
    if (err) throw err;
    console.log("BLOB data inserted!");
    // Check to read it from DB:
    pool.query("select * from hr_db.user", function(err, res) {
      if (err) throw err;
      const row = res[0];
      // Got BLOB data:
      const data = row.data;
      console.log("BLOB data read!");
      // Converted to Buffer:
      const buf = new Buffer(data, "binary");
      // Write new file out:
      fs.writeFileSync(outputfile, buf);
      console.log("New file output:", outputfile);
    });
  });
// Read buffer of an image file:
const data = readImageFile(inputfile); // `data`'s type is Buffer
console.log(data)

function readImageFile(file) {
  // read binary data from a file:
  const bitmap = fs.readFileSync(file);
  const buf = new Buffer(bitmap);
  return buf;
}
*/

exports.editUserPage = async (req, res, next) => {
    // Check to read it from DB:
    /*pool.query('select * from hr_db.user', function (err, res) {
        if (err) throw err;
        const row = res[0];
        // Got BLOB data:
        const data = row.data;
        console.log('BLOB data read!');
        // Converted to Buffer:
        const buf = new Buffer(data, 'binary');
        // Write new file out:
        fs.writeFileSync(outputfile, buf);
        console.log('New file output:', outputfile);
    });*/
    res.render('editUser.ejs');
};
const fs = require('fs');
const { promisify } = require('util');
const readFileAsync = promisify(fs.readFile);

var path = require('path');
exports.editUser = async (req, res, next) => {
    try {
        let sampleFile;
        let uploadPath;

        if (!req.files || Object.keys(req.files).length === 0) {
            return console.log('No files were uploaded on web.');
        }

        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        sampleFile = req.files.sampleFile;
        console.log('1', sampleFile);
        var data;
        // Use the mv() method to place the file somewhere on your server
        sampleFile.mv('./uploads/' + sampleFile.name, function (err) {
            if (err) {
                return console.log('Error uploading file:', err);
            } else {
                console.log('File uploaded!');
                uploadPath = path.join(
                    __dirname,
                    './uploads/' + sampleFile.name
                );
                console.log('Path:', uploadPath);
                console.log('2', uploadPath);
                fs.readFile(uploadPath, (err, data1) => {
                    if (err) {
                        console.error('Error reading file:', err);
                        return;
                    }
                    console.log('File data:', data1); // Handle the file data here
                    data = data1;
                });
            }
        });

        //email already exists or not?
        const [checkPassQuery] = await dbConnection
            .promise()
            .execute('SELECT * FROM hr_db.user where email=?', [
                req.body.email,
            ]);
        console.log('Rows:', checkPassQuery);
        console.log('пул закритий');
        console.log('lenght ', checkPassQuery.length);
        if (checkPassQuery.length > 0) {
            return res.render('register.ejs', {
                error: 'Email already exists',
            });
        }

        let first_name = req.body.first_name;
        console.log('first_name: ', first_name);
        let last_name = req.body.last_name;
        console.log('last_name: ', last_name);
        let email = req.body.email;
        console.log('email: ', email);
        let password = req.body.password;
        console.log('password: ', password);
        let joined_date = req.body.joined_date;
        console.log('joined_date: ', joined_date);
        let branch = req.body.branch;
        console.log('branch: ', branch);
        console.log('data', data);
        console.log('req.session.userID', req.session.userID);

        const [new_edit] = await dbConnection
            .promise()
            .execute(
                'UPDATE hr_db.user SET first_name = ?,last_name = ?,email = ?,joined_date = ?,branch = ?,password = ?, photo = ? WHERE id=?',
                [
                    first_name || null,
                    last_name || null,
                    email || null,
                    joined_date || null,
                    branch || null,
                    (await bcrypt.hash(password, 12)) || null,
                    data || null,
                    req.session.userID || null,
                ]
            );
        console.log('new_edit', new_edit);
    } catch (err) {
        next(err);
    }
};

exports.createRequestPage = async (req, res, next) => {
    res.render('createRequest.ejs');
};

exports.createRequest = async (req, res, next) => {
    res.render('createRequest.ejs');
};

exports.logoutPage = async (req, res, next) => {
    res.render('logout.ejs');
};
