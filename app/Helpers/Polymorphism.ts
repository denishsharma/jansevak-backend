import Announcement from "App/Models/Announcement";
import Profile from "App/Models/Profile";

export enum PolymorphicType {
    Announcement = "announcement",
    Complaint = "complaint",
    Profile = "profile",
}

export function getPolymorphicModel(type: PolymorphicType) {
    switch (type) {
        case PolymorphicType.Announcement:
            return Announcement;
        case PolymorphicType.Profile:
            return Profile;
        default:
            return undefined;
    }
}
