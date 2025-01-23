import mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let cachedConnection = (global as any).mongoose;

// Ensure cached connection is available
if (!cachedConnection) {
  cachedConnection = { conn: null, promise: null };
}

async function connectToDatabase() {
  if (cachedConnection.conn) {
    return cachedConnection.conn;
  }

  if (!cachedConnection.promise) {
    const uri = process.env.MONGODB_URI;

    if (!uri) {
      throw new Error(
        "MONGODB_URI is not defined in the environment variables."
      );
    }
    try {
      cachedConnection.promise = mongoose
        .connect(uri)
        .then((mongooseInstance) => {
          console.log("MongoDB connected");
          return mongooseInstance;
        });
    } catch (error) {
      console.log(error);
    }
  }
}
export default connectToDatabase;
