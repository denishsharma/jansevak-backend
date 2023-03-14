export enum QueryStatuses {
    CREATED = <any>"created",
    IN_REVIEW = <any>"in_review",
    IN_PROGRESS = <any>"in_progress",
    REJECTED = <any>"rejected",
    RESOLVED = <any>"resolved",
}

export const QueryStatusesValues = [
    QueryStatuses.CREATED,
    QueryStatuses.IN_REVIEW,
    QueryStatuses.IN_PROGRESS,
    QueryStatuses.REJECTED,
    QueryStatuses.RESOLVED,
];


export enum QueryCommentTypes {
    COMMENT = <any>"comment",
    LOG = <any>"log",
}
