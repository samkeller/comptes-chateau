import axios from "axios";
import BaseService from "../BaseService";
import { KanbanBoardDataDto } from "./dto/KanbanBoardDataDto";
import { CreateKanbanTaskDto } from "./dto/CreateKanbanTaskDto";
import KanbanTask from "../../interfaces/kanban/KanbanTask";

export default class KanbanService extends BaseService {


    private kanbanApiUrl = this.apiUrl + "/kanban";

    getBoardData(): Promise<KanbanBoardDataDto> {
        return axios.get(this.kanbanApiUrl + "/board").then(res => res.data);
    }

    getAllTags(): Promise<string[]> {
        return axios.get(this.kanbanApiUrl + "/tags").then(res => res.data);
    }

    createKanbanTask(formData: CreateKanbanTaskDto): Promise<KanbanTask> {
        return axios.post(this.kanbanApiUrl + "/task", formData).then(res => res.data);
    }

    saveKanbanTask(task: KanbanTask): Promise<KanbanTask> {
        return axios.patch(this.kanbanApiUrl + "/task/" + task.id, task).then(res => res.data);
    }

    deleteTask(taskId: number): Promise<void> {
        return axios.delete(this.kanbanApiUrl + "/task/" + taskId);
    }
}


