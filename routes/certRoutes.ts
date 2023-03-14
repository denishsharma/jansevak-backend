import Route from "@ioc:Adonis/Core/Route";

export default function certRoutes() {
    Route.group(() => {
        Route.post("/new-nagarik", "CertsController.newNagarik");
    }).prefix("/cert");
}
