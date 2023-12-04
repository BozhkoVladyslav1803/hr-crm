const mysql=require('mysql2');
//const dotenv = require("dotenv");
//require('dotenv').config({path:'/first-app/utils/.env'})
const dbConnection = mysql.createPool({
    host: 'localhost',
    user:'root',
    password: 'password',
    database:'hr_db'
  });

module.exports=dbConnection;