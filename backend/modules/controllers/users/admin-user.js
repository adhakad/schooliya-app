'use strict';
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const speakeasy = require('speakeasy');
const tokenService = require('../../services/admin-token');
const AdminUserModel = require('../../models/users/admin-user');
const OTPModel = require('../../models/otp');
const SchoolKeyModel = require('../../models/users/school-key');

const transporter = nodemailer.createTransport({
    service: "gmail",
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    auth: {
        user: `dhakaddeepak9340700360@gmail.com`,
        pass: 'cbgcwsgpajyhvztj'
    },
});

let LoginAdmin = async (req, res, next) => {
    try {
        let admin = await AdminUserModel.findOne({ email: req.body.email });
        if (!admin) {
            return res.status(404).json({ errorMsg: 'Username or password invalid !' });
        }
        const passwordMatch = await bcrypt.compare(req.body.password, admin.password);

        if (!passwordMatch) {
            return res.status(404).json({ errorMsg: 'Username or password invalid !' });
        }
        if (admin.status == "Inactive") {
            return res.status(400).json({ errorMsg: 'Application access permissions denied, please contact app development company !' });
        }
        if (admin.status == "Active") {
            const payload = { id: admin._id, email: admin.email };
            const accessToken = await tokenService.getAccessToken(payload);
            const refreshToken = await tokenService.getRefreshToken(payload);
            return res.status(200).json({ adminInfo: admin, accessToken, refreshToken });
        }
        return res.status(400).json({ errorMsg: 'Login error !' })
    } catch (error) {
        return res.status(500).json({ errorMsg: 'Internal Server Error !' });
    }
}

let RefreshToken = async (req, res, next) => {
    try {
        const { token } = req.body
        if (token) {
            const payload = await tokenService.verifyRefreshToken(token)
            const accessToken = await tokenService.getAccessToken(payload)
            res.send({ accessToken })
        }
        else {
            res.status(403).send('token Unavailable!!')
        }
    } catch (err) {
        res.status(500).json(err)
    }
}

let SignupAdmin = async (req, res, next) => {
    const secret = speakeasy.generateSecret({ length: 20 });
    const { email, password, name, mobile, city, state, address, pinCode, schoolName, affiliationNumber } = req.body;
    try {

        const checkUser = await AdminUserModel.findOne({ email: email });
        if (checkUser) {
            return res.status(400).json({ errorMsg: "Email already exist !" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const adminData = {
            email: email,
            password: hashedPassword,
            name: name,
            mobile: mobile,
            city: city,
            state: state,
            address: address,
            pinCode: pinCode,
            schoolName: schoolName,
            affiliationNumber: affiliationNumber

        }
        const otpData = {
            email: email,
            secret: secret.base32,
        }

        const [createSignupAdmin, createOTP] = await Promise.all([
            AdminUserModel.create(adminData),
            OTPModel.create(otpData)
        ]);
        if (createSignupAdmin && createOTP) {
            const token = speakeasy.totp({
                secret: createOTP.secret,
                encoding: 'base32'
            });
            const mailOptions = {
                from: {
                    name: 'Schooliya',
                    address: 'dhakaddeepak9340700360@gmail.com'
                },
                to: `${email}`,
                subject: 'OTP for email Verification',
                html: `<div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
                   <p style="color: #666;">You have requested an OTP to varify to your schooliya account. If this was you, please input the code below to continue.</p>
                   <p style="color: #000;margin:10px;letter-spacing:2px;"><strong>${token}</strong></p>
                 </div>`
            };
            let info = await transporter.sendMail(mailOptions);
            return res.status(200).json({ successMsg: 'Admin register successfully.', email: email });
        }
    } catch (error) {
        return res.status(500).json({ errorMsg: 'Internal Server Error !' });
    }
}

let VerifyOTP = async (req, res, next) => {
    try {
        const email = req.body.email;
        const userEnteredOTP = parseInt(req.body.otp);
        const user = await AdminUserModel.findOne({ email: email });
        if (!user) {
            return res.status(404).json({ message: "Email does not exist!" });
        }
        const otp = await OTPModel.findOne({ email: email });
        if (!otp) {
            return res.status(404).json({ message: "Your OTP has expired!" });
        }

        const verified = speakeasy.totp.verify({
            secret: otp.secret,
            encoding: 'base32',
            token: userEnteredOTP,
            window: 6
        });

        if (!verified) {
            return res.status(400).json({ message: "Invalid OTP" });

        }
        return res.status(200).json({ message: "OTP verified successfully" });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

let VarifyForgotAdmin = async (req, res, next) => {
    const { productKey } = req.body;
    const varifiedAdminInfo = {
        productKey: productKey
    }
    try {
        let countAdmin = await AdminUserModel.count();
        if (countAdmin === 1) {
            let checkAdmin = await AdminUserModel.findOne({ status: 'Active' });
            if (!checkAdmin) {
                return res.status(404).json({ errorMsg: "Application access permissions denied, please contact app development company !" });
            }
            const checkProductKey = await SchoolKeyModel.findOne({ status: 'Active' });
            if (!checkProductKey) {
                return res.status(400).json({ errorMsg: "Application access permissions denied, please contact app development company !" });
            }
            const isProductKey = checkProductKey.productKey;
            const productKeyMatch = await bcrypt.compare(productKey, isProductKey);
            if (!productKeyMatch) {
                return res.status(404).json({ errorMsg: 'Product key is invalid !' });
            }
            if (productKeyMatch) {
                return res.status(200).json({ varifiedAdminInfo: varifiedAdminInfo });
            }
        }
        return res.status(404).json({ errorMsg: "Application access permissions denied, please contact app development company !" });
    } catch (error) {
        return res.status(500).json('Internal Server Error !');
    }
}

let ResetForgotAdmin = async (req, res, next) => {
    const { productKey, email, password } = req.body;
    try {
        let checkAdmin = await AdminUserModel.findOne({ status: 'Active' });
        if (!checkAdmin) {
            return res.status(404).json({ errorMsg: "Application access permissions denied, please contact app development company !" });
        }
        const checkProductKey = await SchoolKeyModel.findOne({ status: 'Active' });
        if (!checkProductKey) {
            return res.status(400).json({ errorMsg: "Application access permissions denied, please contact app development company !" });
        }
        const isProductKey = checkProductKey.productKey;
        const productKeyMatch = await bcrypt.compare(productKey, isProductKey);
        if (!productKeyMatch) {
            return res.status(404).json({ errorMsg: 'Product key is invalid !' });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const resetAdminUserInfo = {
            email: email,
            password: hashedPassword,
            status: 'Active',

        }
        const objectId = checkAdmin._id;
        const updateAdminUser = await AdminUserModel.findByIdAndUpdate(objectId, { $set: resetAdminUserInfo }, { new: true });
        if (updateAdminUser) {
            return res.status(200).json({ successMsg: 'Username and password reset successfully.' });
        }
    } catch (error) {
        return res.status(500).json({ errorMsg: 'Internal Server Error !' });
    }
}

module.exports = {
    LoginAdmin,
    RefreshToken,
    SignupAdmin,
    VarifyForgotAdmin,
    ResetForgotAdmin,
    VerifyOTP,
}