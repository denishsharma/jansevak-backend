import Event from "@ioc:Adonis/Core/Event";

declare module "@ioc:Adonis/Core/Event" {
    interface EventsList {
        "otp:generated": {
            user: {
                id: string;
                phoneNumber: string;
            };
            otp: string;
            expiresAt: string;
        };
    }
}

// for OTP generation event
Event.on("otp:generated", "AuthListener.onOtpGenerated");

