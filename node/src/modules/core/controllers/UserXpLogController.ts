import { Router } from "express";
import UserXpService from "../services/UserXpService";


const UserXpLogRoutes = Router()

const userXpService = new UserXpService()

UserXpLogRoutes.get("/", async (req, res) => {
    const logs = await userXpService.getAll()
    res.json(logs)
})

export default UserXpLogRoutes