import { beforeEach, describe, expect, it } from "vitest";
import type { CreateKanbanTaskRequest } from "@chocosous/shared";
import { AppError } from "../../../utils/AppError";
import { TEST_USER_ID, testDataSource, fixtures } from "../../../tests/testDbSetup";
import { User } from "../../core/entities/User";
import { KanbanComment } from "../entities/KanbanComment";
import { KanbanTask } from "../entities/KanbanTask";
import KanbanBoardService from "./KanbanBoardService";

describe("KanbanBoardService", () => {
    let service: KanbanBoardService;

    beforeEach(() => {
        service = new KanbanBoardService(testDataSource.manager);
    });

    async function createTask(): Promise<KanbanTask> {
        const column = await fixtures.kanbanColumns.create({ label: "À faire" });
        return fixtures.kanbanTasks.create({ columnId: column.id, title: "Tâche de test" });
    }

    it("does not award completion XP more than once", async () => {
        const task = await createTask();

        await service.markTaskAsDone(task.id, TEST_USER_ID);
        await service.markTaskAsDone(task.id, TEST_USER_ID);

        const user = await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID });
        expect(user.totalXp).toBe(140);
    });

    it("prevents users from deleting another user's comment", async () => {
        const task = await createTask();
        const otherUser = await fixtures.users.create({ username: "autre-utilisateur" });
        const comment = await fixtures.kanbanComments.create({
            content: "Commentaire propriétaire",
            taskId: task.id,
            authorId: TEST_USER_ID,
        });

        await expect(service.deleteComment(comment.id, otherUser.id)).rejects.toMatchObject({
            statusCode: 403,
            code: "KANBAN_COMMENT_FORBIDDEN",
        });
        await expect(testDataSource.getRepository(KanbanComment).findOneBy({ id: comment.id })).resolves.not.toBeNull();
    });

    it("rejects task creation for a missing column before writing or awarding XP", async () => {
        const payload: CreateKanbanTaskRequest = {
            title: "Tâche sans colonne",
            columnId: 999,
        };

        await expect(service.createTask(payload, TEST_USER_ID)).rejects.toBeInstanceOf(AppError);

        const user = await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID });
        expect(user.totalXp).toBe(100);
        expect(await testDataSource.getRepository(KanbanTask).count()).toBe(0);
    });
});
