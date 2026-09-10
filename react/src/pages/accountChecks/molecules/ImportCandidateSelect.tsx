import { Dropdown, DropdownChangeEvent } from "primereact/dropdown";
import { BanquePostaleImportMatchingCandidate } from "@/interfaces/Externals/BanquePostaleImportResult";
import { toMonetaryAmount } from "@/utils/NumberUtils";
import { parseDateToDisplay } from "@/utils/DatesUtils";

interface ImportCandidateSelectProps {
    candidates: BanquePostaleImportMatchingCandidate[];
    selectedCandidateId: number | null;
    onChange: (candidate: BanquePostaleImportMatchingCandidate) => void;
}

export default function ImportCandidateSelect({
    candidates,
    selectedCandidateId,
    onChange
}: ImportCandidateSelectProps) {
    const handleChange = (event: DropdownChangeEvent): void => {
        const candidate = candidates.find((item) => item.id === event.value);
        if (candidate) {
            onChange(candidate);
        }
    };

    const importLineTemplate = (candidate: BanquePostaleImportMatchingCandidate) => {
        return (
            <div className="flex items-center justify-around gap-2 py-1">
                <span className="w-8 shrink-0 text-xs text-gray-400">
                    l.{candidate.rowNumber}
                </span>
                <span className="w-24 shrink-0 text-sm text-gray-500">
                    {parseDateToDisplay(candidate.dateOperation)}
                </span>
                <div className="min-w-0 flex-1 truncate">
                    {candidate.label}
                </div>
                <span className="w-28 shrink-0 text-right font-semibold tabular-nums">
                    {toMonetaryAmount(candidate.amount)}
                </span>
            </div>
        );
    };

    return (
        <Dropdown
            value={selectedCandidateId}
            options={candidates}
            optionValue="id"
            optionLabel="label"
            onChange={handleChange}
            itemTemplate={(candidate: BanquePostaleImportMatchingCandidate) => importLineTemplate(candidate)}
            valueTemplate={(candidate: BanquePostaleImportMatchingCandidate | null) =>
                candidate ? importLineTemplate(candidate) : "Choisir une ligne du relevé"
            }
            placeholder="Choisir une ligne du relevé"
            className="w-full"
            aria-label="Ligne du relevé à rapprocher"
        />
    );
}