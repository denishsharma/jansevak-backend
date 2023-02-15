import Route from "@ioc:Adonis/Core/Route";

export default function familyRoutes() {
    Route.group(() => {
        Route.post("/addMember", "FamiliesController.addMember");
        Route.post("/removeMember", "FamiliesController.removeMember");
        Route.post("/updateMember", "FamiliesController.updateMember");
        Route.post("/assignMember", "FamiliesController.assignMember");
    }).prefix("/family");
}
