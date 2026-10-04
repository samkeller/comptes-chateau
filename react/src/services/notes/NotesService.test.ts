import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NotesService from "./NotesService";

vi.mock("axios", () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        put: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

describe("NotesService", () => {
    const service = new NotesService();

    beforeEach(() => vi.clearAllMocks());

    it("loads active or archived notes using the archive filter", async () => {
        vi.mocked(axios.get).mockResolvedValue({ data: [] });

        await service.getAll(true);

        expect(axios.get).toHaveBeenCalledWith("/api/notes", { params: { archived: true } });
    });

    it("uses the item endpoint for an independent optimistic checkbox update", async () => {
        vi.mocked(axios.patch).mockResolvedValue({ data: { id: 5, isChecked: true } });

        await service.updateItem(2, 5, { isChecked: true });

        expect(axios.patch).toHaveBeenCalledWith("/api/notes/2/items/5", { isChecked: true });
    });

    it("supports note CRUD and archive endpoints", async () => {
        vi.mocked(axios.post).mockResolvedValue({ data: {} });
        vi.mocked(axios.put).mockResolvedValue({ data: {} });
        vi.mocked(axios.patch).mockResolvedValue({ data: {} });
        vi.mocked(axios.delete).mockResolvedValue({});

        await service.create({ title: "Courses", type: "checklist" });
        await service.update(3, { title: "Courses" });
        await service.archive(3);
        await service.unarchive(3);
        await service.delete(3);

        expect(axios.post).toHaveBeenCalledWith("/api/notes", { title: "Courses", type: "checklist" });
        expect(axios.put).toHaveBeenCalledWith("/api/notes/3", { title: "Courses" });
        expect(axios.patch).toHaveBeenNthCalledWith(1, "/api/notes/3/archive");
        expect(axios.patch).toHaveBeenNthCalledWith(2, "/api/notes/3/unarchive");
        expect(axios.delete).toHaveBeenCalledWith("/api/notes/3");
    });
});
