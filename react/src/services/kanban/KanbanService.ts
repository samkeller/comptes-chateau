import axios from "axios";
import BaseService from "../BaseService";
import { KanbanBoardDataDto } from "./dto/KanbanBoardDataDto";
import { SaveKanbanTaskDto } from "./dto/SaveKanbanTaskDto";

export default class KanbanService extends BaseService {

    private kanbanApiUrl = this.apiUrl +  "/kanban";

    getBoardData(): Promise<KanbanBoardDataDto>  {
        return axios.get(this.kanbanApiUrl + "/board").then(res =>  res.data);
    }
     
    saveKanbanTask(formData: SaveKanbanTaskDto) {
        return axios.post(this.kanbanApiUrl + "/task", formData)
    }
}


