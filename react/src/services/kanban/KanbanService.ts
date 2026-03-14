import axios from "axios";
import BaseService from "../BaseService";
import { KanbanBoardDataDto } from "./dto/KanbanBoardDataDto";
import { CreateKanbanTaskDto } from "./dto/CreateKanbanTaskDto";
import KanbanTask from "../../interfaces/kanban/KanbanTask";
import { KanbanComment } from "../../interfaces/kanban/KanbanComment";
import KanbanColumn from "@/interfaces/kanban/KanbanColumn";
import { User } from "@/interfaces/User";

export default class KanbanService extends BaseService {
    
    private kanbanApiUrl = this.apiUrl + "/kanban";

    getBoardData(): Promise<KanbanBoardDataDto> {
        return axios.get(this.kanbanApiUrl + "/board").then(res => {
            return {
                columns: res.data.columns.map((column: any) => new KanbanColumn(column)),
                tasks: res.data.tasks.map((task: any) => new KanbanTask(task)),
                users: res.data.users.map((user: any) => new User(user)),
            }
        });
    }

    getAllTags(): Promise<string[]> {
        return axios.get(this.kanbanApiUrl + "/tags").then(res => res.data);
    }

    createKanbanTask(formData: CreateKanbanTaskDto): Promise<KanbanTask> {
        return axios.post(this.kanbanApiUrl + "/task", formData).then(res => res.data);
    }

    saveKanbanTask(task: CreateKanbanTaskDto, id: number): Promise<KanbanTask> {
        return axios.patch(this.kanbanApiUrl + "/task/" + id, task).then(res => res.data);
    }

    deleteTask(taskId: number): Promise<void> {
        return axios.delete(this.kanbanApiUrl + "/task/" + taskId);
    }

    markTaskAsDone(taskId: number): Promise<void> {
        return axios.patch(this.kanbanApiUrl + `/task/mark-done/${taskId}`);
    }

    getTaskComments(taskId: number): Promise<KanbanComment[]> {
        return axios.get(this.kanbanApiUrl + `/task/${taskId}/comments`).then(res => res.data);
    }

    createComment(taskId: number, content: string): Promise<KanbanComment> {
        return axios.post(this.kanbanApiUrl + `/task/${taskId}/comments`, { taskId, content }).then(res => res.data);
    }

    deleteComment(commentId: number): Promise<void> {
        return axios.delete(this.kanbanApiUrl + `/comment/${commentId}`);
    }
}


