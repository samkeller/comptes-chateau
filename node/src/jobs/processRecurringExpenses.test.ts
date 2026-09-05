import { describe, it, expect, beforeEach } from "vitest";
import { testDataSource } from "../tests/testDbSetup";
import { processRecurringExpenses } from "./processRecurringExpenses"
import { JobExecutionLog } from "../modules/core/entities/JobExecutionLog";
import { EntityManager } from "typeorm";
import { RecurringExpense, RecurringExpenseFrequency } from "../modules/accounts/entities/RecurringExpense";
import { Account } from "../modules/accounts/entities/Account";


describe("processRecurringExpenses", () => {
    let entityManager: EntityManager;
    let currentDate: Date;
    let account: Account;

    beforeEach(async () => {
        entityManager = testDataSource.manager;
        currentDate = new Date();

        await entityManager.getRepository(Account).findOne({ where: { id: 1 } }).then(acc => account = acc!);
    });


    async function getLastLog() {
        const repo = await testDataSource.getRepository(JobExecutionLog)

        return repo.findOne({
            order: { createdAt: "DESC" },
            where: {} // Hack typeorm - Besoin d'un where dans un findOne (https://github.com/typeorm/typeorm/issues/9208)
        });
    }

    it("should stop if there are no recurring expenses to process", async () => {
        // Arrange
        const entityManager = testDataSource.manager;
        const currentDate = new Date();
        // Act
        await processRecurringExpenses(entityManager, currentDate);
        // Assert
        expect(true).toBe(true);
        const lastLog = await getLastLog();
        expect(lastLog?.message).toBe("No recurring expenses to process");
    });

    it("should process recurring expenses correctly", async () => {
        // Arrange
        const entityManager = testDataSource.manager;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const tommorow = new Date();
        tommorow.setDate(tommorow.getDate() + 1);

        const mockedRecurringExpenses: RecurringExpense[] = [
            {
                id: 1,
                label: "Loyer",
                solde: 850.00,
                isActive: true,
                nextOccurrence: yesterday,
                frequency: RecurringExpenseFrequency.MONTHLY,

                natureId: null,
                nature: undefined,

                posteId: null,
                poste: undefined,

                accountId: 1,
                account: {
                    id: 1,
                    // ajoute ici les propriétés obligatoires de Account
                } as Account,
            },
            {
                id: 2,
                label: "Netflix",
                solde: 17.99,
                isActive: true,
                nextOccurrence: new Date(),
                frequency: RecurringExpenseFrequency.MONTHLY,

                natureId: null,
                nature: undefined,

                posteId: null,
                poste: undefined,

                accountId: 1,
                account: {
                    id: 1,
                    // ajoute ici les propriétés obligatoires de Account
                } as Account,
            },
            {
                id: 3,
                label: "Assurance habitation",
                solde: 240.00,
                isActive: true,
                nextOccurrence: tommorow,
                frequency: RecurringExpenseFrequency.MONTHLY,

                natureId: null,
                nature: undefined,

                posteId: null,
                poste: undefined,

                accountId: 1,
                account: {
                    id: 1,
                    // ajoute ici les propriétés obligatoires de Account
                } as Account,
            },
        ];


        const recurringRepo = entityManager.getRepository(RecurringExpense);
        await recurringRepo.save(mockedRecurringExpenses);

        const currentDate = new Date();
        // Act
        await processRecurringExpenses(entityManager, currentDate);
        // Assert
        const lastLog = await getLastLog();
        // Deux inserts (pour un la date n'est pas passée)
        expect(lastLog?.message).toBe(`Successfully created 2 accounting lines from recurring expenses`);
    });



    it("should handle edge date case correctly", async () => {
        // Arrange
        const entityManager = testDataSource.manager;
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const tommorow = new Date();
        tommorow.setDate(tommorow.getDate() + 1);

        /**
         * Cas limites qui couplés a des récurrences peuvent poser des problèmes de calcul de dates.
         */

        const edgeCasesDates = [
            /** 31 Aout + récurrence mensuelle (il n'y a pas de 31 septembre) */
            new Date(2023, 7, 31),
            /** 30 Novembre + récurrence trimestrielle (il n'y a pas de 30 février) */
            new Date(2023, 10, 30),
            /** 31 Janvier + récurrence mensuelle (il n'y a pas de 31 février) */
            new Date(2023, 0, 31),
            /** 29 Février + récurrence annuelle (il n'y a pas de 29 février chaque année) */
            new Date(2024, 1, 29),
        ];

        const mockedRecurringExpenses: RecurringExpense[] = [
            {
                id: 1,
                label: "Loyer edgeCase 1",
                solde: 850.00,
                isActive: true,
                nextOccurrence: edgeCasesDates[0],
                frequency: RecurringExpenseFrequency.MONTHLY,

                natureId: null,
                nature: undefined,

                posteId: null,
                poste: undefined,

                accountId: 1,
                account: {
                    id: 1,
                    // ajoute ici les propriétés obligatoires de Account
                } as Account,
            },
            {
                id: 2,
                label: "Netflix edgeCase 2",
                solde: 17.99,
                isActive: true,
                nextOccurrence: edgeCasesDates[1],
                frequency: RecurringExpenseFrequency.QUARTERLY,

                natureId: null,
                nature: undefined,

                posteId: null,
                poste: undefined,

                accountId: 1,
                account: {
                    id: 1,
                    // ajoute ici les propriétés obligatoires de Account
                } as Account,
            },
            {
                id: 3,
                label: "Assurance habitation edgeCase 3",
                solde: 240.00,
                isActive: true,
                nextOccurrence: edgeCasesDates[2],
                frequency: RecurringExpenseFrequency.MONTHLY,

                natureId: null,
                nature: undefined,

                posteId: null,
                poste: undefined,

                accountId: 1,
                account: {
                    id: 1,
                    // ajoute ici les propriétés obligatoires de Account
                } as Account,
            },
            {
                id: 4,
                label: "Assurance voiture edgeCase 4",
                solde: 9.00,
                isActive: true,
                nextOccurrence: edgeCasesDates[3],
                frequency: RecurringExpenseFrequency.YEARLY,

                natureId: null,
                nature: undefined,

                posteId: null,
                poste: undefined,

                accountId: 1,
                account: {
                    id: 1,
                    // ajoute ici les propriétés obligatoires de Account
                } as Account,
            },
        ];


        const recurringRepo = entityManager.getRepository(RecurringExpense);
        await recurringRepo.save(mockedRecurringExpenses);

        const currentDate = new Date();
        // Act
        await processRecurringExpenses(entityManager, currentDate);
        // Assert
        const lastLog = await getLastLog();
        // Deux inserts (pour un la date n'est pas passée)
        expect(lastLog?.message).toBe(`Successfully created 4 accounting lines from recurring expenses`);

        const savedRecurringExpenses = await entityManager.getRepository(RecurringExpense).find();
        console.log("========== SAVED RECURRING EXPENSES ==========");
        console.log(
            savedRecurringExpenses.map(expense => ({
                id: expense.id,
                idType: typeof expense.id,
                label: expense.label,
                nextOccurrence: expense.nextOccurrence,
                nextOccurrenceType: typeof expense.nextOccurrence,
            }))
        );
        console.log("===============================================");


        expect(savedRecurringExpenses).toHaveLength(4);


        /** 31 Aout + récurrence mensuelle (il n'y a pas de 31 septembre) */
        expect(savedRecurringExpenses.find(expense => expense.label === "Loyer edgeCase 1")!.nextOccurrence).toBe("2023-09-30");
        /** 30 Novembre + récurrence trimestrielle (il n'y a pas de 30 février) */
        expect(savedRecurringExpenses.find(expense => expense.label === "Netflix edgeCase 2")!.nextOccurrence).toBe("2024-02-29");
        /** 31 Janvier + récurrence mensuelle (il n'y a pas de 31 février) */
        expect(savedRecurringExpenses.find(expense => expense.label === "Assurance habitation edgeCase 3")!.nextOccurrence).toBe("2023-02-28");
        /** 29 Février + récurrence annuelle (il n'y a pas de 29 février chaque année) */
        expect(savedRecurringExpenses.find(expense => expense.label === "Assurance voiture edgeCase 4")!.nextOccurrence).toBe("2025-02-28");
    });
});