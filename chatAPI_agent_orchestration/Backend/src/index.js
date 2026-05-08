import express from "express";
import cors from "cors";
import helmet from "helmet";
import "./db/mongoose.js"; //only needed to make sure that mongoose starts
import Customers from "./models/customers.js";

// const express = require("express");
// const cors = require("cors");
import dotenv from "dotenv";
dotenv.config();

// const chatRoutes = require("./routers/chat");
import chatRoutes from "./routers/chat.js";
import adminRoutes from "./routers/admin.js";
import customerRoutes from "./routers/customer.js";
import leadRoutes from "./routers/lead.js";

const demoDomains = ["test-front-end.com", "soa-form.com"];

const app = express();
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "https://cdnsite.net/widget.js", // your widget CDN
          "'unsafe-inline'", // only if needed for inline init()
        ],
        styleSrc: ["'self'"],
        imgSrc: ["'self'"],
        connectSrc: [
          "'self'",
          "https://backend-site.com", // your backend
        ],
        fontSrc: [
          "'self'",
          "https://fonts.googleapis.com",
          "https://fonts.gstatic.com",
        ],
        frameAncestors: ["'none'"], // Prevent clickjacking
        objectSrc: ["'none'"],
        upgradeInsecureRequests: [],
      },
    },
  }),
);

const corsOptions = {
  origin: async (origin, callback) => {
    // Allow server-side or same-origin requests
    if (!origin) return callback(null, true);

    // Optional: block sandboxed/file origins explicitly
    if (origin === "null") return callback(null, false);

    let url;
    let hostname;
    // Parse + validate origin safely (prevents crashes)
    try {
      url = new URL(origin);
      hostname = url.hostname;
    } catch (err) {
      console.warn("🚫 Invalid Origin header:", origin);
      return callback(null, false);
    }

    // Optional: enforce protocol (recommended if you only serve https frontends)
    if (url.protocol !== "https:") {
      return callback(null, false);
    }

    // Optional: reject weird hostnames early (extra safety; tweak as needed)
    // e.g. blocks very long hostnames, empty hostname, etc.
    if (!hostname || hostname.length > 255) {
      return callback(null, false);
    }

    if (demoDomains.includes(hostname)) {
      return callback(null, true);
    }

    try {
      if (hostname === "sa-admin-tau.vercel.app") {
        return callback(null, true);
      } else if (hostname !== "sa-admin-tau.vercel.app") {
        const customer = await Customers.findOne({
          url: { $in: [hostname] },
        });

        if (customer) {
          return callback(null, true);
        } else {
          return callback(new Error("Not allowed by CORS"));
        }
      }
    } catch (err) {
      console.error("CORS origin error:", err);
      return callback(new Error("Invalid Origin header"));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions)); // enable pre-flight for all routes

const port = process.env.PORT || 3000;
app.use(express.json()); //automatically parses incoming json data to an Object so it can be used

app.get("/health", (req, res) => {
  res.status(200).send("OK");
});

app.use(chatRoutes);
app.use(adminRoutes);
app.use(customerRoutes);
app.use(leadRoutes);

app.listen(port, "0.0.0.0", () => {
  //this starts the server
});
