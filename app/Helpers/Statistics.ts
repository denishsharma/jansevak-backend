import { QueryStatuses } from "App/Helpers/Queries";
import UserQuery from "App/Models/UserQuery";

export async function getQueryStatusSummary(userId: number) {
    const summaryStats = {
        total: 0,
        pending: 0,
        resolved: 0,
        rejected: 0,
        in_progress: 0,
        in_review: 0,
        created: 0,
    };

    // load queries of user
    const queries = await UserQuery.query().where("for_jansevak", userId).orWhere("created_by", userId).orWhere("on_behalf_of", userId).preload("query");

    const resolvedQueries = queries.filter((query) => query.query.status === QueryStatuses.RESOLVED);
    const pendingQueries = queries.filter((query) => query.query.status !== QueryStatuses.RESOLVED && query.query.status !== QueryStatuses.REJECTED);
    const rejectedQueries = queries.filter((query) => query.query.status === QueryStatuses.REJECTED);
    const inProgressQueries = queries.filter((query) => query.query.status === QueryStatuses.IN_PROGRESS);
    const inReviewQueries = queries.filter((query) => query.query.status === QueryStatuses.IN_REVIEW);
    const createdQueries = queries.filter((query) => query.query.status === QueryStatuses.CREATED);

    summaryStats.total = queries.length;
    summaryStats.resolved = resolvedQueries.length;
    summaryStats.pending = pendingQueries.length;
    summaryStats.rejected = rejectedQueries.length;
    summaryStats.in_progress = inProgressQueries.length;
    summaryStats.in_review = inReviewQueries.length;
    summaryStats.created = createdQueries.length;

    return summaryStats;
}
