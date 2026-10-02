import { beforeEach, describe, expect, it } from "vitest";
import type { CreateKanbanTaskRequest } from "@chocosous/shared";
import { AppError } from "../../../utils/AppError";
import { TEST_USER_ID, testDataSource } from "../../../tests/testDbSetup";
import { User } from "../../core/entities/User";
import { KanbanColumn } from "../entities/KanbanColumn";
import { KanbanComment } from "../entities/KanbanComment";
import { KanbanTask } from "../entities/KanbanTask";
import KanbanBoardService from "./KanbanBoardService";

describe("KanbanBoardService", () => {
    let service: KanbanBoardService;

    beforeEach(() => {
        service = new KanbanBoardService(testDataSource.manager);
    });

    async function createTask(): Promise<KanbanTask> {
        const column = await testDataSource.getRepository(KanbanColumn).save({
            label: "À faire",
            order: 1,
        });

        return testDataSource.getRepository(KanbanTask).save({
            title: "Tâche de test",
            description: null,
            tags: [],
            priority: "normal",
            columnId: column.id,
            column,
            assignees: [],
            isDone: false,
            doneByUserId: null,
        });
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
        const otherUser = await testDataSource.getRepository(User).save({
            username: "autre-utilisateur",
            avatar: "default-avatar.png",
            passwordHash: "testpasswordhash",
            totalXp: 0,
        });
        const comment = await testDataSource.getRepository(KanbanComment).save({
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
