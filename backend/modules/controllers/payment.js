'use strict';
const { KEY_ID, KEY_SECRET } = process.env;
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { DateTime } = require('luxon');
const Payment = require('../models/payment');
const tokenService = require('../services/admin-token');
const key_id = KEY_ID;
const key_secret = KEY_SECRET;

const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret,
});

let CreatePayment = async (req, res) => {
  const { adminId, activePlan, amount, currency } = req.body;
  const paymentData = {
    amount: amount * 100,
    currency: currency,
  };
  try {
    const order = await razorpay.orders.create(paymentData);
    const payment = new Payment({
      adminId: adminId,
      activePlan: activePlan,
      orderId: order.id,
      amount: amount,
      currency,
    });
    await payment.save();
    res.status(200).json({ order });
  } catch (error) {
    res.status(500).json({ error: 'Payment creation failed !' });
  }
};

let ValidatePayment = async (req, res) => {
  try {
    const paymentId = req.body.payment_id;
    const orderId = req.body.order_id;
    const signature = req.body.signature;
    const email = req.body.email;
    const id = req.body.id;
    const adminInfo = {
      id:id,
      email:email,
    }
    const secretKey = 'TVIz565DG7GB1kzF4Q8uVayK'
    const body = orderId + "|" + paymentId;
    const expectedSignature = crypto
      .createHmac("sha256", secretKey)
      .update(body.toString())
      .digest("hex");
    if (expectedSignature === signature) {
      const updatedPayment = await Payment.findOneAndUpdate(
        { orderId: orderId },
        { status: 'success', },
        { new: true }
      );
      const payload = { id: id, email: email };
      const accessToken = await tokenService.getAccessToken(payload);
      const refreshToken = await tokenService.getRefreshToken(payload);
      if (updatedPayment && accessToken && refreshToken) {
        return res.status(200).json({ success: true,adminInfo: adminInfo, accessToken, refreshToken, message: 'Payment successfully validated.' });
      }
      if (!updatedPayment) {
        return res.status(400).json({ success: false, message: 'Failed to update payment status !' });
      }
      return res.status(400).json({ success: false, message: 'Payment validation failed !' });
    }
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error validating payment !' });
  }
}
module.exports = {
  CreatePayment,
  ValidatePayment
}