import { Router } from "express";
import UserXpService from "../services/UserXpService";


const UserXpRoutes = Router()

const userXpService = new UserXpService()

UserXpRoutes.get("/", async (req, res) => {
    const logs = await userXpService.getAll()
    res.json(logs)
})

UserXpRoutes.get("/actions", async (req, res) => {
    const actions = await userXpService.getActions();
    res.json(actions);
});

export default UserXpRoutes