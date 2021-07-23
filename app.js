const express = require('express');
const app = express();
app.use(express.json());
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const secretKeyForJWT = process.env.JWT_PRIVATE_KEY;


const allUsersData = [];
const parameters = ['username', 'password', 'name', 'year-of-graduation', 'college'];
const login_parameters = ['username', 'password'];

const authenticationMiddleware = (req, res, next) => {
    const authToken = req.headers['auth-token'];
    if (authToken === undefined || authToken === null) {
        res.status(401).json({ message: "'auth-token' is required to access this API!" });
        return;
    }

    // verify the JWT
    jwt.verify(authToken, secretKeyForJWT, (err, decodedInfo) => {
        if (err) {
            res.status(401).json({ message: "Invalid token or token expired!" });
            return;
        }
        
        req.userInfo = decodedInfo;
        next();
    });
};

app.post('/register', (req, res) => {

    const userData = {};
    const errors = {};
    parameters.forEach(key => {
        if (req.body[key] == null || req.body[key] == undefined) {
            errors[key] = `${key} is a required parameter!`;
        }
        else if (req.body[key] == "") {
            errors[key] = `${key} must not be empty!`;
        }
        else {
            userData[key] = req.body[key];
        }
    });

    if (Object.keys(errors).length > 0) {
        res.status(400).json(errors);
        return;
    }

    let usernametaken =false;
    allUsersData.forEach(existingUser => {
        if(existingUser.username==userData.username) usernametaken=true;
    });

    if(usernametaken) {
        res.status(400).json({ message: "username already taken!" });
        return;
    }
    allUsersData.push(userData);
    res.json({message : "Successfully registered!"});
});

app.post('/login', (req,res) => {

    const loginData = {};
    const errors = {};
    const user_login={};
    let login_status=false;
    login_parameters.forEach(key => {
        if (req.body[key] == null || req.body[key] == undefined) {
            errors[key] = `${key} is a required parameter!`;
        }
        else if (req.body[key] == "") {
            errors[key] = `${key} must not be empty!`;
        }
        else {
            allUsersData.forEach(existingUser => {
                if(existingUser.username==req.body.username) {
                    if(existingUser.password==req.body.password) {
                        user_login={
                            username:req.body.username
                        };
                        login_status=true;
                    }
                }
            });
        }
    });
    if (Object.keys(errors).length > 0) {
        res.status(400).json(errors);
        return;
    }

    if (login_status==false){
        res.status(401).json({
            message: 'Username or password incorrect'
        });
    }
    else{
        const token=jwt.sign(user_login, secretKeyForJWT, {expiresIn: 3600});

        res.setHeader("auth-token",token);
        res.json({message: "Successfully logged in!"});
    }

});

app.get('/profiles',(req,res) => {
    const userDataCopy= JSON.parse(JSON.stringify(allUsersData));
    userDataCopy.forEach(user => {
        delete userDataCopy['password'];
    });

    res.json(userDataCopy);
});

app.put('/profile', authenticationMiddleware, (req,res) => {

    const userData = {};
    const errors = {};
    parameters.forEach(key => {
        if (req.body[key] == null || req.body[key] == undefined) {
            errors[key] = `${key} is a required parameter!`;
        }
        else if (req.body[key] == "") {
            errors[key] = `${key} must not be empty!`;
        }
        else {
            userData[key] = req.body[key];
        }
    });

    if (Object.keys(errors).length > 0) {
        res.status(400).json(errors);
        return;
    }

    const username = req.userInfo.username;

    let validUser= false;
    let userIndex=-1;
    for(let i=0;i<allUsersData.length;i++) {
        const exsistingUser=allUsersData[i];
        if(exsistingUser.username==username) {
            validUser=true;
            userIndex=i;
            break;
        }
    }

    // update the user's details corresponding to the found user
    allUsersData[userIndex] = { ...allUsersData[userIndex], ...userData };
    
    res.json({message : "Successfully updated!!"})
    
});

app.listen(7050, () => console.log('Listening on port 7050...'));
