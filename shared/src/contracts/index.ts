export {
    CreateStockItemSchema,
    UpdateStockItemSchema,
    StockItemsQuerySchema,
    CreateStockLocationSchema,
    UpdateStockLocationSchema,
    STOCK_MOVEMENT_TYPES,
    RecordStockMovementSchema,
} from "./stocks";
export type {
    CreateStockItemDto,
    UpdateStockItemDto,
    StockItemsQueryDto,
    CreateStockLocationDto,
    UpdateStockLocationDto,
    StockMovementType,
    RecordStockMovementDto,
} from "./stocks";

export {
    SaveNatureSchema,
    SavePosteSchema,
    SaveBudgetItemSchema,
    SaveOperationSchema,
    OperationBatchCheckSchema,
    RECURRING_EXPENSE_FREQUENCIES,
    SaveRecurringExpenseSchema,
    DashboardMonthlyByPosteQuerySchema,
} from "./accounts";
export type {
    AccountDto,
    SaveNaturePayload,
    AccountLineNatureDto,
    SavePostePayload,
    AccountLinePosteDto,
    SaveBudgetItemPayload,
    BudgetPosteDto,
    BudgetItemDto,
    UnifiedBudgetLine,
    SaveOperationPayload,
    OperationBatchCheckPayload,
    OperationBatchCheckInput,
    RecurringExpenseFrequency,
    SaveRecurringExpensePayload,
    DashboardOverview,
    MonthlyAggregateByPoste,
    BudgetByPoste,
    DashboardMonthlyByPosteQuery,
} from "./accounts";

export {
    SaveAccountLineRuleSchema,
    SearchAccountLineRulePatternSchema,
} from "./automatisations";
export type {
    SaveAccountLineRuleRequest,
    SearchAccountLineRulePatternRequest,
    UnmappedAccountLineRuleResponse,
} from "./automatisations";

export {
    LoginSchema,
    AvatarSchema,
    ApiErrorSchema,
} from "./core";
export type {
    LoginRequest,
    LoginResponse,
    UserDto,
    AvatarPayload,
    RunRecurringExpensesJobResponse,
    BackupDatabaseJobResponse,
    XpEventType,
    XpUpdatedEvent,
    XpRealtimeEvent,
    ApiErrorBody,
} from "./core";

export {
    KANBAN_TASK_PRIORITIES,
    CreateKanbanTaskSchema,
    CreateKanbanCommentSchema,
} from "./kanban";
export type {
    KanbanTaskPriority,
    CreateKanbanTaskRequest,
    CreateKanbanCommentRequest,
    KanbanCommentResponse,
    KanbanColumnResponse,
    KanbanTaskResponse,
    KanbanBoardResponse,
} from "./kanban";
