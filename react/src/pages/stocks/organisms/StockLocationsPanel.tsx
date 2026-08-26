import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { ScrollPanel } from "primereact/scrollpanel";
import StockLocation from "@/interfaces/stocks/StockLocation";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import { useScreen } from "@/hooks/useScreen";

interface StockLocationsPanelProps {
    locations: StockLocation[];
    selectedLocation: StockLocation | null;
    loading: boolean;
    onSelect: (location: StockLocation) => void;
    onAddLocation: () => void;
    onEditLocation: (location: StockLocation) => void;
    onDeleteLocation: (location: StockLocation) => void;
    className?: string;
}

export default function StockLocationsPanel({
    locations,
    selectedLocation,
    loading,
    onSelect,
    onAddLocation,
    onEditLocation,
    onDeleteLocation,
    className,
}: StockLocationsPanelProps) {
    const { isDesktop } = useScreen();

    const StockLocationListItem = (
        { location, className }: {
            location: StockLocation,
            className?: string
        }
    ) => {
        const isSelected = location.id === selectedLocation?.id;
        return <Button
            outlined={!isSelected}
            className={`w-full justify-start ${className ?? ""}`}
            onClick={() => onSelect(location)}
            label={location.label}
        />
    }
    return (
        <Card
            title="Lieux de stockage"
            className={className}
            pt={{ body: { className: "h-full" }, content: { className: "h-full flex flex-col gap-4" } }}
        >
            {loading ? (
                <div className="flex justify-center p-8">
                    <ProgressSpinner />
                </div>
            ) : locations.length === 0 ? (
                <div className="flex flex-col gap-3 text-surface-500">
                    <span>Aucun lieu configuré.</span>
                    <div>
                        <Button label="Créer le premier lieu" onClick={onAddLocation} />
                    </div>
                </div>
            ) : (
                <FillRemainingHeight>
                    <div className="flex h-full min-h-0 flex-col gap-4">
                        {isDesktop ? (
                            <ScrollPanel className="min-h-0 flex-1 min-w-0 px-2">
                                <div className="flex flex-col gap-2">
                                    {locations.map((location) => (
                                        <StockLocationListItem
                                            key={location.id}
                                            location={location}
                                            className="w-full"
                                        />
                                    ))}
                                </div>
                            </ScrollPanel>
                        ) : (
                            <div className="flex gap-3 overflow-x-auto pb-1">
                                {locations.map((location) => (
                                    <StockLocationListItem
                                        key={location.id}
                                        location={location}
                                        className="min-w-44"
                                    />
                                ))}
                            </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                            <Button label="Ajouter un lieu" icon="pi pi-map-marker" size="small" onClick={onAddLocation} />
                            {selectedLocation && (
                                <>
                                    <Button
                                        label="Renommer"
                                        icon="pi pi-pencil"
                                        outlined
                                        size="small"
                                        onClick={() => onEditLocation(selectedLocation)}
                                    />
                                    <Button
                                        label="Supprimer"
                                        icon="pi pi-trash"
                                        outlined
                                        severity="danger"
                                        size="small"
                                        onClick={() => onDeleteLocation(selectedLocation)}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </FillRemainingHeight>
            )}
        </Card>
    );
}
