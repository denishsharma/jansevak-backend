import User from "App/Models/User";
import Feedback from "App/Models/Feedback";

export enum FeedbackTypes {
    PLATFORM = <any>"platform",
    USER = <any>"user",
    QUERY = <any>"query",
    SUGGESTION = <any>"suggestion",
    OTHER = <any>"other",
}

export const FeedbackTypesValues = [
    FeedbackTypes.PLATFORM,
    FeedbackTypes.USER,
    FeedbackTypes.QUERY,
    FeedbackTypes.SUGGESTION,
    FeedbackTypes.OTHER,
];

export const getAverageRatingForUser = async (user: User) => {
    // get weighted average rating for user between 1 and 5 (1 being the worst and 5 being the best)
    const feedbacks = await Feedback.query().where("receiver_id", user.id).whereIn("type", [FeedbackTypes.USER, FeedbackTypes.QUERY]).whereNotNull("rating").select("rating");
    const avgRating = feedbacks.length > 0 ? feedbacks.reduce((a, b) => a + b.rating, 0) / feedbacks.length : 0;
    return Math.round(avgRating * 10) / 10;
};

export const getAverageQueryRatingForUser = async (user: User) => {
    // get weighted average rating for user between 1 and 5 (1 being the worst and 5 being the best)
    const feedbacks = await Feedback.query().where("receiver_id", user.id).where("type", FeedbackTypes.QUERY).whereNotNull("rating").select("rating");
    const avgRating = feedbacks.length > 0 ? feedbacks.reduce((a, b) => a + b.rating, 0) / feedbacks.length : 0;
    return Math.round(avgRating * 10) / 10;
};

export const getAverageRatingForPlatform = async () => {
    // get weighted average rating for platform between 1 and 5 (1 being the worst and 5 being the best)
    const feedbacks = await Feedback.query().whereIn("type", [FeedbackTypes.PLATFORM]).whereNotNull("rating").select("rating");
    const avgRating = feedbacks.length > 0 ? feedbacks.reduce((a, b) => a + b.rating, 0) / feedbacks.length : 0;
    return Math.round(avgRating * 10) / 10;
};
