import Event from "@ioc:Adonis/Core/Event";

declare module "@ioc:Adonis/Core/Event" {
    interface EventsList {
        "user:created": {
            id: number,
            email: string,
            phoneNumber: string,
        };
    }
}

// for OTP generation event
Event.on("user:created", "UserListener.onUserCreated");

