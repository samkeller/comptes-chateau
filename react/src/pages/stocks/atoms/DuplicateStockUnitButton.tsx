import StockUnitsService from "@/services/stocks/StockUnitsService";
import { CreateStockUnitDto } from "@/services/stocks/dto/CreateStockUnitDto";
import { Button } from "primereact/button";
import { showGlobalToast } from "@/services/GlobalToast";

interface DuplicateStockUnitButtonProps {
    stockItemId: number;
    stockUnit: CreateStockUnitDto;
    afterDuplicateUnit?: (newUnit: CreateStockUnitDto) => void;
}

const stockUnitsService = new StockUnitsService();

export default function DuplicateStockUnitButton({
    stockItemId,
    stockUnit,
    afterDuplicateUnit,
}: DuplicateStockUnitButtonProps) {

    const handleDuplicate = async () => {
        let newDto: CreateStockUnitDto;

        // Si le stock unit n'a pas encore été créé (pas d'ID), on génère un nouveau DTO avec un clientId unique.
        if (stockUnit.id === undefined) {
            newDto = {
                ...stockUnit,
                clientId: crypto.randomUUID(),
            };
        }
        // Déjà créé ? -> On crée une nouvelle unité de stock (en base) à partir de l'existante.
        else {
            const createdUnit = await stockUnitsService.create(stockItemId, stockUnit);
            newDto = {
                id: createdUnit.id,
                clientId: crypto.randomUUID(),
                locationId: createdUnit.locationId,
                quantity: createdUnit.quantity,
                unit: createdUnit.unit,
                expirationDate: createdUnit.expirationDate ?? undefined,
            };
        }

        afterDuplicateUnit?.(newDto);
    };

    return (
        <Button
            icon="pi pi-copy"
            text
            rounded
            severity="secondary"
            tooltip="Dupliquer"
            onClick={handleDuplicate}
        />
    );
}
