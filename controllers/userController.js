const { validationResult } = require('express-validator'); // Fix import statement
const bcrypt = require('bcryptjs');
const dbConnection = require('../utils/dbConnection'); // Fix the path
const session = require('express-session');
const uniqueFilename = require('unique-filename')


//register
exports.registerPage = async (req, res, next) => {
    try {
        const [checkUserRole] = await dbConnection
            .promise()
            .execute('SELECT user_role FROM hr_db.user where id=?', [
                req.session.userID
            ]);

        if(checkUserRole[0].user_role=='admin')
            res.render("register.ejs")
        else
            res.render("login.ejs")
    } catch (error) {
        
    }
    


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
            const getPhotoName = searchDataPhoto(checkPassQuery[0].photo);
            photoImg=getPhotoName;
        }

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
    let userInfo = await get_user_info(req, res, next)

    const dateFormatter = new Intl.DateTimeFormat('en-US');
    const formattedDate1 = dateFormatter.format(userInfo[0].joined_date);
    const formattedDate2 = dateFormatter.format(new Date('1/1/1971'));
    var p_joined_date=formattedDate1
    if(formattedDate1<formattedDate2)
        p_joined_date=null
    res.render('dashboard.ejs', {
        first_name: first_name,
        last_name: last_name,
        middle_name: middle_name,
        email: email,
        photo: photoImg,
        position: userInfo[0].position_id,
        joined_date:p_joined_date
    });
};

var inputValue;
exports.dashboard = async (req, res, next) => {
    inputValue = req.body.button_dashboard;
    if (inputValue == 'create_request') {
        return res.redirect(`/dashboard/create_request`);
    } else if (inputValue == 'edit_user') {
        return res.redirect(`/dashboard/edit_user`);
    }else if (inputValue == 'vacation_list') {
        return res.redirect(`/dashboard/vacation_list`);
    }else{
        return res.redirect('/dashboard')
    }
};

qs_options=async()=>{
    
}

exports.editUserPage = async (req, res, next) => {
    const roles = [];
    const positions = [];
    try {
        const result= await dbConnection
            .promise()
            .execute('SELECT role FROM hr_db.roles');

        for (const arr of result) {
            for (const row of arr) {
                if (typeof row === 'object' && row !== null && !Array.isArray(row) && 'role' in row) 
                    roles.push(row.role);
            }
        }

        const qs_positions= await dbConnection
            .promise()
            .execute('SELECT position FROM hr_db.position');

        for (const arr of qs_positions) {
            for (const row of arr) {
                if (typeof row === 'object' && row !== null && !Array.isArray(row) && 'position' in row) 
                    positions.push(row.position);
            }
        }

    } catch (error) {
        next(error)
    }
    const userInfo = await get_user_info(req, res, next)
    console.log('userInfo',userInfo)
    res.render('editUser.ejs', {
        first_name: userInfo[0].first_name,
        last_name: userInfo[0].last_name,
        email: userInfo[0].email,
        joined_date: userInfo[0].joined_date,
        positions: positions,
        roles: roles,
        branch:userInfo[0].branch,
        photo: photoImg});
};

get_user_info=async (req, res, next) =>{
    try {
        const [checkPassQueryEmail] = await dbConnection
        .promise()
        .execute('SELECT * FROM hr_db.user where email=?', [
            email,
    ]);
    return checkPassQueryEmail
    } catch (error) {
        console.error('Error fetching user info:', error);
        return null;
    }
}


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
        var role = req.body.roles;
        console.log('role: ', role);
        var position = req.body.positions;
        console.log('positions: ', position);
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
                'UPDATE hr_db.user SET first_name = ?,last_name = ?,email = ?, user_role=?, position_id=?, joined_date = ?,branch = ?,password = ?, photo = ? WHERE id=?',
                [
                    first_name || null,
                    last_name || null,
                    email,
                    role || null,
                    position || null,
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

                //var middle_name = mid_nq[0].middle_name;

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
function searchDataPhoto(photoTemp) {
    const files = fs.readdirSync(require('path').join(__dirname, '../public/'));
    for (const file of files) {
        if (file.data=== photoTemp && file.data !== undefined) {
            return file;
        }
    }
    const randomTmpfile = uniqueFilename(require('path').join(__dirname, '../public/'),'','qwerty');
    fs.writeFileSync(randomTmpfile, photoTemp);
    return require('path').basename(randomTmpfile);
  }

exports.createRequestPage = async (req, res, next) => {
    const vac_types_arr = [];
    const approvers = [];
    try {
     const result= await dbConnection
                .promise()
                .execute('SELECT vac_type_name FROM hr_db.vac_type');

    for (const arr of result) {
        for (const row of arr) {
            if (typeof row === 'object' && row !== null && !Array.isArray(row) && 'vac_type_name' in row) 
                vac_types_arr.push(row.vac_type_name);
        }
    }
    const adminApprovers= await dbConnection
                .promise()
                .execute('SELECT last_name user FROM hr_db.user where user_role="admin"');

    for (const arr of adminApprovers) {
        for (const row of arr) {
            if (typeof row === 'object' && row !== null && !Array.isArray(row) && 'user' in row) 
                approvers.push(row.user);
        }
    }
    
    } catch (error) {
    }
    var supplient=last_name+' '+first_name+' '+middle_name;
    res.render('createRequest.ejs',{
        supplient: supplient,
        approvers: approvers,
        vac_types_arr: vac_types_arr
        });
};

exports.createRequest = async (req, res, next) => {
    
    var supplient= req.body.supplient;
    console.log('supplient: ', supplient);
    var approver = req.body.approvers;
    console.log('approver: ', approver);
    var first_date = req.body.first_date;
    console.log('first_date: ', first_date);
    var last_date = req.body.last_date;
    console.log('last_date: ', last_date);
    var vac_types_arr = req.body.vac_types_arr;
    console.log('vac_types_arr: ', vac_types_arr);
    var condition = req.body.condition;
    console.log('condition: ', condition);
    try {

        const [approver_id]= await dbConnection
                   .promise()
                   .execute('Select id from hr_db.user where last_name=?',[
                    approver,
                ]);

        const [p_user_id]= await dbConnection
                    .promise()
                    .execute('Select id from hr_db.user where email=?',[
                    email,
                ]);
                console.log('p_user_id',p_user_id)
                console.log('approver_id[0].id',approver_id[0].id)
        const [qi_vac_req] = await dbConnection
            .promise()
            .execute('INSERT INTO hr_db.vacation_req(`suppliant_id`,`approver_id`,`first_date`,`last_date`,`vac_type`,`vac_condition`) VALUES(?,?,?,?,?,?);', [
            p_user_id[0].id || null,
            approver_id[0].id || null,
            first_date || null,
            last_date || null,
            vac_types_arr || null,
            condition || null
        ]);
            
        console.log('qi_vac_req', qi_vac_req);
       } catch (error) {
        console.log(error)
       }
       inputValue = req.body.button_dashboard;
       if (inputValue == 'vacation_list') {
           return res.redirect(`/dashboard/vacation_list`);
       }else{
           return res.redirect('/dashboard')
       }
};

exports.vacationListPage = async (req, res, next) => {

    let vac_list=[]
    try {
        const [qs_vac_list] = await dbConnection
        .promise()
        .execute(`
                    SELECT s.*, a.*, vr.first_date, vr.vac_req_id, vr.last_date, vr.vac_type, vr.vac_condition
                    FROM
                    (
                        SELECT u.first_name AS fns, u.last_name AS lns
                        FROM hr_db.user u
                        JOIN hr_db.vacation_req vr ON u.id = vr.suppliant_id
                    ) s,
                    (
                        SELECT u.first_name AS fna, u.last_name AS lna
                        FROM hr_db.user u
                        JOIN hr_db.vacation_req vr ON u.id = vr.approver_id
                    ) a,
                    hr_db.vacation_req vr
                    `);
    vac_list=qs_vac_list;
    } catch (error) {
        console.error('Error fetching user info:', error);
    }

    res.render('vacation_req_list.ejs',{
        vacationList: vac_list
    });
};

exports.vacationList = async (req, res, next) => {
    res.redirect(`/dashboard`);
};

exports.logoutPage = async (req, res, next) => {
    res.render('logout.ejs');
};
