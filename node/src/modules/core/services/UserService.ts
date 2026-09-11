import { In, type EntityManager, type Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import { User } from "../entities/User";

export default class UserService {
    private readonly userRepo: Repository<User>;

    constructor(manager: EntityManager = AppDataSource.manager) {
        this.userRepo = manager.getRepository(User);
    }

    async getAll(): Promise<User[]> {
        return this.userRepo.find({ order: { username: "ASC" } });
    }

    async getById(id: number): Promise<User | null> {
        return this.userRepo.findOneBy({ id });
    }

    async getByIds(ids: number[]): Promise<User[]> {
        return this.userRepo.findBy({ id: In(ids) });
    }
}