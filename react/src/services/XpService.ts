import UserService from "./UserService";
import { useXpStore } from "@/stores/useXpStore";

class XpService extends UserService {

    async initializeXpStore() {
        const users = await super.getAllUsers();

        useXpStore.getState().initialize(users);
    }
}

export default XpService;