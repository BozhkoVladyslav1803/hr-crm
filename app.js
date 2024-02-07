const express = require('express');
const session = require('express-session');
const morgan = require('morgan');
const dbConnection = require('./utils/dbConnection');
const app = express();
const router = express.Router();
const path = require('path');

const {
    homePage,
    register,
    registerPage,
    login,
    loginPage,
    dashboardPage,
    dashboard,
    logoutPage,
    editUserPage,
    editUser,
    createRequestPage,
    createRequest,
    vacationRequestListPage,
    vacationRequestList,
} = require('./controllers/userController');

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const cookieParser = require('cookie-parser');
app.use(cookieParser());

app.use(express.urlencoded({ extended: false }));
app.use(
    session({
        name: 'session',
        secret: 'q',
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 3600 * 100, //1hr
        },
    })
);

app.use(express.json());
app.use(express.static('public'));

app.use((err, req, res, next) => {
    return res.send('internal server error');
});

router.get('/register', registerPage);
router.post('/register', register);

router.get('/login', loginPage);
router.post('/login', login);

router.get('/dashboard', dashboardPage);
router.post('/dashboard', dashboard);

const fileUpload = require('express-fileupload');
app.use(fileUpload());

router.get('/dashboard/edit_user', editUserPage);
router.post('/dashboard/edit_user',editUser);

router.get('/dashboard/create_request', createRequestPage);
router.post('/dashboard/create_request', createRequest);

router.get('/logout', logoutPage);

app.use('/', router);

app.listen(3000);

app.use(morgan('dev'));

app.get((req, res) => {
    res.status(404).sendFile('./views/404.html', { root: __dirname });
});
