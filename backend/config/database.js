import dns from "dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();


const connectDB = async () => {
  try {
    console.log(process.env.MONGODB_URI);

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  tls: true,
  serverSelectionTimeoutMS: 30000,
});


    console.log(`MongoDB Connected: ${conn.connection.host}`);

  } catch (error) {
    console.error(`MongoDB Connection Error: ${error}`);
    process.exit(1);
  }
};

export default connectDB;
