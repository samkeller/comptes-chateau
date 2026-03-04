import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum BudgetItemCategory {
    INCOMPRESSIBLE = "incompressible",
    COMPRESSIBLE = "compressible",
    EPARGNE = "epargne"
}

@Entity("budget_item")
export class BudgetItem {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: "enum", enum: BudgetItemCategory })
    category: BudgetItemCategory;

    @Column({ type: "varchar", length: 255 })
    label: string;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    amount: number;

    @Column({ type: "boolean", default: true })
    isActive: boolean;

    @Column({ type: "int", default: 0 })
    sortOrder: number;
}
