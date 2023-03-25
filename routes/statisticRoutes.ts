import Route from "@ioc:Adonis/Core/Route";

export default function statisticRoutes() {
    Route.group(() => {
        Route.get("/query-status/:userId", "StatisticsController.queryStatus");
    }).prefix("/stats");
}
