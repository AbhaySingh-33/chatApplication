export class EmailConfigError extends Error {
	constructor(message) {
		super(message);
		this.name = "EmailConfigError";
	}
}

export class EmailDeliveryError extends Error {
	constructor(message, cause) {
		super(message);
		this.name = "EmailDeliveryError";
		this.cause = cause;
	}
}
