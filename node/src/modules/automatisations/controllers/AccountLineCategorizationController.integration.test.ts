import request from "supertest";
import { beforeEach, describe, expect, it } from "vitest";
import { AccountLineNature } from "../../accounts/entities/AccountLineNature";
import { User } from "../../core/entities/User";
import { TEST_USER_ID, fixtures, testDataSource } from "../../../tests/testDbSetup";
import { createTestApp } from "../../../tests/testApp";

let app: ReturnType<typeof createTestApp>;
let seededNature: AccountLineNature;
let seededNatureAlt: AccountLineNature;

async function seedBaseData(): Promise<void> {
    seededNature = await fixtures.natures.create({ label: "Charges", color: "#112233" });
    seededNatureAlt = await fixtures.natures.create({ label: "Loisirs", color: "#445566" });
}

describe("AccountLineCategorizationController integration", () => {
    beforeEach(async () => {
        await seedBaseData();

        const { default: accountLineCategorizationRoutes } = await import("./AccountLineCategorizationController");

        app = createTestApp("/categorization", accountLineCategorizationRoutes);
    });

    it("increments user XP by 10 when a rule is created", async () => {
        const response = await request(app)
            .post("/categorization")
            .send({
                label: "Netflix FR",
                accountId: 1,
                natureId: seededNature.id,
            });

        expect(response.status).toBe(201);
        expect(response.body).toMatchObject({
            label: "Netflix fr",
            pattern: "netflix fr",
            accountId: 1,
            natureId: seededNature.id,
        });

        const updatedUser = await testDataSource.getRepository(User).findOneByOrFail({ id: TEST_USER_ID });
        expect(updatedUser.totalXp).toBe(110);
    });

    it("returns hydrated relations after updating a rule", async () => {
        const createdResponse = await request(app)
            .post("/categorization")
            .send({
                label: "Abonnement sport",
                accountId: 1,
                natureId: seededNature.id,
            });

        expect(createdResponse.status).toBe(201);

        const updateResponse = await request(app)
            .put(`/categorization/${createdResponse.body.id}`)
            .send({
                label: "Abonnement sport",
                accountId: 1,
                natureId: seededNatureAlt.id,
            });

        expect(updateResponse.status).toBe(201);
        expect(updateResponse.body.natureId).toBe(seededNatureAlt.id);
        expect(updateResponse.body.nature).toMatchObject({
            id: seededNatureAlt.id,
            label: "Loisirs",
            color: "#445566",
        });
    });
});
