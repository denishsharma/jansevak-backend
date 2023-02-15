import Route from "@ioc:Adonis/Core/Route";

export default function questionRoutes() {
    Route.group(() => {
        Route.get("/list-all", "QuestionController.index");
        Route.get("/show/:slug", "QuestionController.show");
        Route.post("/create", "QuestionController.create");
        Route.post("/update", "QuestionController.update");
        Route.post("/archive", "QuestionController.archive");
    }).prefix("/announcement");
}
