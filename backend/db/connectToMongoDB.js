import mongoose from "mongoose";
import dns from "dns";

const connectToMongoDB = async () => {
	mongoose.set("bufferCommands", false);

	// Force using Google DNS to resolve connection issues (ECONNREFUSED querySrv)
	// This fixes issues where local system DNS cannot resolve MongoDB Atlas SRV records
	try {
		dns.setServers(['8.8.8.8', '8.8.4.4']);
	} catch (dnsError) {
		console.log("Could not set DNS servers:", dnsError);
	}

	try {
		const mongoUri = process.env.MONGO_DB_URI || process.env.MONGODB_URI;
		if (!mongoUri) {
			throw new Error("MONGO_DB_URI (or MONGODB_URI) is not defined");
		}

		await mongoose.connect(mongoUri, {
			serverSelectionTimeoutMS: 10000,
			socketTimeoutMS: 45000,
			maxPoolSize: 10,
		});
		console.log("Connected to MongoDB");
		return true;
	} catch (error) {
		console.log("Error connecting to MongoDB", error.message);
		throw error;
	}
};

export default connectToMongoDB;