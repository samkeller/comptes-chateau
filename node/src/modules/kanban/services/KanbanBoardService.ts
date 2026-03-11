import { AppDataSource } from "../../../db/dataSource";
import { CreateKanbanTaskDto } from "../dto/CreateKanbanTaskDto";
import { KanbanBoardDto } from "../dto/KanbanBoardDto";
import { KanbanColumn } from "../entities/KanbanColumn";
import { KanbanTask } from "../entities/KanbanTask";

export default class KanbanBoardService {

    private kanbanTaskRepo = AppDataSource.getRepository(KanbanTask);
    private kanbanColumnRepo = AppDataSource.getRepository(KanbanColumn);

    async getColumns(): Promise<KanbanColumn[]> {
        return this.kanbanColumnRepo.find();
    }

    async getBoardData(): Promise<KanbanBoardDto> {

        const columns = await this.kanbanColumnRepo.find();
        const tasks = await this.kanbanTaskRepo.find();

        return {
            columns: columns,
            tasks: tasks,
        }
    }

    async saveTask(body: CreateKanbanTaskDto): Promise<KanbanTask> {
        const column = await this.kanbanColumnRepo.findOneBy({ id: body.columnId });

        if (!column) {
            // TODO, custom error class
            throw new Error("KANBAN_COLUMN_NOT_FOUND");
        }

        const task = this.kanbanTaskRepo.create({
            title: body.title,
            column,
        });

        return this.kanbanTaskRepo.save(task);
    }
}