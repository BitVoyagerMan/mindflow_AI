const allowlist = ["http://localhost:3000", "http://localhost:8000", "https://mindflow.tools"];
const corsOptions = {
  origin: function (origin, callback) {
    // if (allowlist.includes(origin)) {
      callback(null, true);
    // } else {
    //   callback(new Error("Not allowed by CORS"));
    // }
  },
  credentials: true,
  exposedHeaders: ["WWW-Authenticate"],
};

module.exports = corsOptions;
