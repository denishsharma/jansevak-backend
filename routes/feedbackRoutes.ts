import Route from "@ioc:Adonis/Core/Route";

export default function feedbackRoutes() {
    Route.group(() => {
        Route.post("/give", "FeedbacksController.giveFeedback");
        Route.get("/get/user/:userId", "FeedbacksController.getFeedbacksOfUser");
    }).prefix("/feedback");
}
