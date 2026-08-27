import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import StockLocation from "@/interfaces/stocks/StockLocation";
import FillRemainingHeight from "@/components/layout/FillRemainingHeight";
import { useScreen } from "@/hooks/useScreen";
import AppScrollPanel from "@/components/atoms/primereact/AppScrollPanel";

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
        return (
            <div className={`flex ${className ?? ""}`}>
                <Button
                    outlined={!isSelected}
                    className={`grow`}
                    onClick={() => onSelect(location)}
                    label={location.label}
                />
                {isSelected && (
                    <>
                        <Button
                            icon="pi pi-pencil"
                            outlined
                            size="small"
                            rounded text
                            onClick={() => onEditLocation(location)}
                            tooltip="Renommer"
                            tooltipOptions={{ position: "top" }}
                        />
                        <Button
                            icon="pi pi-trash"
                            outlined
                            severity="danger"
                            size="small"
                            rounded text
                            onClick={() => onDeleteLocation(location)}
                            tooltip="Supprimer"
                            tooltipOptions={{ position: "top" }}
                        />
                    </>
                )}
            </div>
        );
    };

    return (


        <Card
            title="Lieux de stockage"
            className={`h-full min-h-0 ${className ?? ""}`}
            pt={{
                body: {
                    className: "h-full min-h-0 flex flex-col"
                },
                content: {
                    className: "h-full min-h-0 flex flex-col overflow-hidden"
                }
            }}
        >
            {loading ? (
                <div className="flex justify-center p-8">
                    <ProgressSpinner />
                </div>
            ) : (
                <FillRemainingHeight>
                    <div className="flex shrink-0 justify-end mb-4">
                        <Button
                            label="Ajouter"
                            icon="pi pi-plus"
                            size="small"
                            onClick={onAddLocation}
                        />
                    </div>
                    <div className="min-h-0 flex-1">
                        <AppScrollPanel>
                            <div className="flex flex-col gap-2">
                                {locations.map((location) => (
                                    <StockLocationListItem
                                        key={location.id}
                                        location={location}
                                        className="w-full"
                                    />
                                ))}
                            </div>
                        </AppScrollPanel>
                    </div>
                </FillRemainingHeight>
            )}
        </Card>
    )
}
