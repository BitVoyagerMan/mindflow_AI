const fs = require("fs");
const axios = require("axios");
const chargebee = require("chargebee");
const { validationResult } = require("express-validator");

const CustomError = require("../../config/errors/CustomError");
const User = require("../../models/User");

chargebee.configure({
  site: process.env.CHARGEBEE_SITE,
  api_key: process.env.CHARGEBEE_KEY,
});
/* 
  1. FETCH USER PROFILE BY ID
*/
module.exports.fetchUserProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new CustomError(errors.array(), 422, errors.array()[0]?.msg);
    }

    const userId = req.params.id;
    const retrievedUser = await User.findById(userId);

    res.json({
      success: true,
      user: retrievedUser,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

/* 
  2. FETCH PROFILE OF AUTHENTICATED USER
*/
module.exports.fetchAuthUserProfile = async (req, res, next) => {
  try {
    const userId = req.userId;
    let user = await User.findById(userId).lean();
    let data = await getBillingStatus(user.email);
    user.billing = data.res;
    delete user.tokens;
    delete user.password;
    res.json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.saveChat = async (req, res, next) => {
  try {
    const userId = req.userId;
    const user = await User.findById(userId);
    console.log("savechat");
    if (!req.body.text || req.body.text == "") {
      res.json({ success: false, error: "Need chat text!" });
      return;
    }
    let textObj = req.body.text;

    if (!fs.existsSync("./logs")) {
      fs.mkdirSync("./logs");
    }

    if (!fs.existsSync("./bugs")) {
      fs.mkdirSync("./bugs");
    }

    let dir = "./logs/";
    if (req.body.bug) dir = "./bugs/";

    let stream = fs.createWriteStream(
      dir + req.body.method + "_" + new Date().getTime().toString() + ".txt"
    );
    stream.once("open", function (fd) {
      //stream.write("User Email - " + user.email + "\n\n");
      textObj.forEach((item) => {
        if (item.isBot) stream.write("Bot - " + item.text + "\n");
        else stream.write("User - " + item.text + "\n");
      });
      stream.end();
    });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.changeVE = async (req, res, next) => {
  try {
    console.log("change Voice Enable");
    const userId = req.userId;
    const user = await User.findById(userId);
    user.voiceEnable = !user.voiceEnable;
    user.save();
    res.json({ success: true, voiceEnable: user.voiceEnable });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.changeVoiceType = async (req, res, next) => {
  try {
    console.log("change Voice Type");
    const userId = req.userId;
    const user = await User.findById(userId);
    user.voiceType = !user.voiceType;
    user.save();
    res.json({ success: true, voiceType: user.voiceType });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.changePT = async (req, res, next) => {
  try {
    console.log("change Process Tips");
    const userId = req.userId;
    const user = await User.findById(userId);
    user.processTips = !user.processTips;
    user.save();
    res.json({ success: true, processTips: user.processTips });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

module.exports.checkThriveCart = async (req, res, next) => {
  try {
    console.log("checkThriveCart");
    const userId = req.userId;
    const user = await User.findById(userId);
    const config = {
      headers: { Authorization: `Bearer ${process.env.THRIVECART_KEY}` },
    };

    let response = await axios.post(
      "https://thrivecart.com/api/external/customer",
      {
        email: user.email,
      },
      config
    );

    console.log(response.data);

    res.json({ success: true, data: response.data });
  } catch (error) {
    console.log(error);
    res.json({ success: false });
    //next(error);
  }
};

module.exports.checkChargebee = async (req, res, next) => {
  try {
    console.log("checkChargebee");
    const userId = req.userId;
    const user = await User.findById(userId);

    const response = await chargebee.subscription.list({"customer_id[is]": user.email}).request();
    console.log(response.list);
    res.json({ success: true, data: response.list });
  } catch (error) {
    console.log(error);
    res.json({ success: false });
    //next(error);
  }
};



const getBillingStatus = async (email) => {
  const response = await chargebee.subscription
    .list({ "customer_id[is]": email })
    .request();

  let data = { subscriptions: [], res: "A" };
  if (response.list) {
    console.log(response.list);
    response.list.forEach((item) => {
      data.subscriptions.push({
        name: item.subscription.subscription_items[0].item_price_id,
        status: item.subscription.status,
      });
    });
    let r = 0;
    response.list.every((item) => {
      let str =
        item.subscription.subscription_items[0].item_price_id.toLowerCase();

      if (
        (item.subscription.status === "active" ||
          item.subscription.status === "in_trial") &&
        (str.indexOf("mindflow-1cu-freetrial") === 0 ||
          str.indexOf("mindflow-success") === 0 ||
          str.indexOf("mindflow-monthly") === 0)
      ) {
        r = 1;
        return false;
      }
      return true;
    });
    if (r === 1) {
      let r1 = 0;
      response.list.every((item) => {
        let str =
          item.subscription.subscription_items[0].item_price_id.toLowerCase();
        if (
          item.subscription.status === "active" &&
          str.indexOf("mindflow-satori") === 0
        ) {
          r1 = 1;
          return false;
        }
        return true;
      });

      if (r1 === 0) {
        data.res = "C";
      } else {
        data.res = "B";
      }
    } else {
      data.res = "A";
    }
  }
  return data;
};

module.exports.checkBillingStatus = async (req, res, next) => {
  try {
    console.log("checkBillingStatus");
    const email = req.body.email;
    console.log(req.body);
    let data = await getBillingStatus(email);
    console.log(data);
    res.json({ success: true, data: data });
  } catch (error) {
    console.log(error);
    res.json({ success: false });
    //next(error);
  }
};