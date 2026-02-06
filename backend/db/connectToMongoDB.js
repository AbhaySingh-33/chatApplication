import mongoose from "mongoose";
import dns from "dns";

const connectToMongoDB = async () => {
	// Force using Google DNS to resolve connection issues (ECONNREFUSED querySrv)
	// This fixes issues where local system DNS cannot resolve MongoDB Atlas SRV records
	try {
		dns.setServers(['8.8.8.8', '8.8.4.4']);
	} catch (dnsError) {
		console.log("Could not set DNS servers:", dnsError);
	}

	try {
        if (!process.env.MONGO_DB_URI) {
            throw new Error("MONGO_DB_URI is not defined");
        }
		await mongoose.connect(process.env.MONGO_DB_URI);
		console.log("Connected to MongoDB");
	} catch (error) {
		console.log("Error connecting to MongoDB", error.message);
	}
};

export default connectToMongoDB;