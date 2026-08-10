

type UserXpActionsPointsKeys =
    "ACCOUNT_LINE_RULE_CREATED" |
    "ACCOUNT_LINE_OPERATION_CREATED" |
    "ACCOUNT_LINE_VALIDATE_ACTION";

const UserXpActionsPoints: { [key in UserXpActionsPointsKeys]: number } = {
    ACCOUNT_LINE_RULE_CREATED: 10,
    ACCOUNT_LINE_OPERATION_CREATED: 5,
    ACCOUNT_LINE_VALIDATE_ACTION: 20
};

export { UserXpActionsPoints, UserXpActionsPointsKeys };