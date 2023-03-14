import Announcement from "App/Models/Announcement";
import Profile from "App/Models/Profile";
import Query from "App/Models/Query";

export enum PolymorphicType {
    Announcement = <any>"announcement",
    Profile = <any>"profile",
    Query = <any>"query",
}

export function getPolymorphicModel(type: PolymorphicType) {
    switch (type) {
        case PolymorphicType.Announcement:
            return Announcement;
        case PolymorphicType.Profile:
            return Profile;
        case PolymorphicType.Query:
            return Query;
        default:
            return undefined;
    }
}
