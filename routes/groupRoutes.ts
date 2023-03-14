import Route from "@ioc:Adonis/Core/Route";

export default function groupRoutes() {
    Route.group(() => {
        Route.post("/create", "GroupsController.createGroup");
        Route.get("/list/:user", "GroupsController.getGroups");

        Route.group(() => {
            Route.get("/member/list", "GroupsController.getFamilyGroupMembers");
            Route.post("/member/create", "GroupsController.createNewMemberForFamilyGroup");
            Route.post("/member/add", "GroupsController.addExistingUserToFamilyGroup");
            Route.post("/member/remove", "GroupsController.removeMemberFromFamilyGroup");
        }).prefix("/family");

        Route.group(() => {
            Route.post("/member/add", "GroupsController.addMemberToGroup");
            Route.post("/member/remove", "GroupsController.removeMemberFromGroup");
            Route.get("/member/list", "GroupsController.getGroupMembers");
        }).prefix("/:id");

    }).prefix("/group");
}
