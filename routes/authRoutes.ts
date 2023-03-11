import Route from "@ioc:Adonis/Core/Route";

export default function authRoutes() {
    Route.group(() => {
        Route.post("/login", "AuthController.login");
        Route.post("/me", "AuthController.me");
        Route.post("/verify", "AuthController.verify");
        Route.post("/generate-otp", "AuthController.generateOtp");
    }).prefix("/auth");
}
