import axios from "axios";
import type {
    CreateNoteItemInput,
    CreateNoteRequest,
    NoteDto,
    NoteItemDto,
    PatchNoteItemRequest,
    UpdateNoteRequest,
} from "@chocosous/shared";
import BaseService from "../BaseService";

export default class NotesService extends BaseService {
    private readonly notesApiUrl = `${this.apiUrl}/notes`;

    getAll(archived = false): Promise<NoteDto[]> {
        return axios.get<NoteDto[]>(this.notesApiUrl, { params: { archived } }).then((response) => response.data);
    }

    create(payload: CreateNoteRequest): Promise<NoteDto> {
        return axios.post<NoteDto>(this.notesApiUrl, payload).then((response) => response.data);
    }

    update(id: number, payload: UpdateNoteRequest): Promise<NoteDto> {
        return axios.put<NoteDto>(`${this.notesApiUrl}/${id}`, payload).then((response) => response.data);
    }

    archive(id: number): Promise<NoteDto> {
        return axios.patch<NoteDto>(`${this.notesApiUrl}/${id}/archive`).then((response) => response.data);
    }

    unarchive(id: number): Promise<NoteDto> {
        return axios.patch<NoteDto>(`${this.notesApiUrl}/${id}/unarchive`).then((response) => response.data);
    }

    delete(id: number): Promise<void> {
        return axios.delete(`${this.notesApiUrl}/${id}`);
    }

    addItem(noteId: number, payload: CreateNoteItemInput): Promise<NoteItemDto> {
        return axios.post<NoteItemDto>(`${this.notesApiUrl}/${noteId}/items`, payload).then((response) => response.data);
    }

    updateItem(noteId: number, itemId: number, payload: PatchNoteItemRequest): Promise<NoteItemDto> {
        return axios.patch<NoteItemDto>(
            `${this.notesApiUrl}/${noteId}/items/${itemId}`,
            payload
        ).then((response) => response.data);
    }

    deleteItem(noteId: number, itemId: number): Promise<void> {
        return axios.delete(`${this.notesApiUrl}/${noteId}/items/${itemId}`);
    }
}
