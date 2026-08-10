import { useEffect, useMemo, useRef, useState } from "react"
import { Button } from "primereact/button"
import { Card } from "primereact/card"
import { Message } from "primereact/message"
import { Tag } from "primereact/tag"
import ChocoKarate from "@assets/images/chocokarate_flip.png"
import ChocoKarateVsRobot from "@assets/images/chocokaratevsrobot.png"
import { UnmappedAccountLineRuleItem } from "@/services/AccountLineCategorizationService"
import { getUserFullProgress } from "@/utils/levelProgress"
import DojoXpLeaderboard from "./DojoXpLeaderboard"
import { useConnectedUser } from "@/context/ConnectedUserContext"
import { ColoredLabel } from "@/components/datatableBodys/ColoredLabel"
import { Skeleton } from "primereact/skeleton"

interface CategorizationDojoProps {
    unmapped: UnmappedAccountLineRuleItem[]
    onConfirm: (
        pattern: string,
        accountId: number,
        posteId?: number | null,
        natureId?: number | null
    ) => Promise<boolean>
}

export default function CategorizationDojo({ unmapped, onConfirm }: CategorizationDojoProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [isStarted, setIsStarted] = useState(false)
    const [isWinning, setIsWinning] = useState(false)
    const [selectedPoste, setSelectedPoste] = useState(false)
    const [selectedNature, setSelectedNature] = useState(false)
    const { connectedUser, refreshUser } = useConnectedUser()
    const previousLevelRef = useRef(getUserFullProgress(connectedUser?.totalXp ?? 0).level)

    useEffect(() => {
        setCurrentIndex(0)
    }, [unmapped])

    const currentItem = unmapped[currentIndex]
    const remaining = Math.max(0, unmapped.length - currentIndex)
    const currentProgress = useMemo(() => getUserFullProgress(connectedUser?.totalXp ?? 0), [connectedUser?.totalXp])

    useEffect(() => {
        setSelectedPoste(false)
        setSelectedNature(false)
    }, [currentItem])

    useEffect(() => {
        const currentProgress = getUserFullProgress(connectedUser?.totalXp ?? 0)
        const currentLevel = currentProgress.level
        if (currentLevel > previousLevelRef.current) {
            setIsWinning(true)
            const timer = window.setTimeout(() => setIsWinning(false), 2500)
            previousLevelRef.current = currentLevel
            return () => window.clearTimeout(timer)
        }

        previousLevelRef.current = currentLevel
    }, [connectedUser?.totalXp])

    const hasSuggestedPoste = Boolean(currentItem?.suggestedPoste?.id)
    const hasSuggestedNature = Boolean(currentItem?.suggestedNature?.id)
    const canSubmit = (selectedPoste && hasSuggestedPoste) || (selectedNature && hasSuggestedNature)

    const imageSource = !isStarted ? ChocoKarate : ChocoKarateVsRobot

    const statusMessage = useMemo(() => {
        if (!isStarted) {
            return "Prêt pour la session ? Chaque validation aide le système à deviner les patterns du compte et te rapporte de l'XP !"
        }

        if (isWinning) {
            return `Bravo ! Tu viens de passer au niveau ${currentProgress.level} !`
        }

        return "Choisis ce qui te semble juste, puis confirme la règle. Passe si la suggestion n'est pas assez fiable."
    }, [currentProgress.level, isStarted, isWinning])

    const handleStart = () => {
        setIsStarted(true)
    }

    const moveNext = () => {
        setCurrentIndex((prev) => Math.min(prev + 1, unmapped.length))
    }

    const handleConfirm = async () => {
        if (!currentItem || !canSubmit) {
            return
        }
        setIsSubmitting(true)

        try {
            const didSave = await onConfirm(
                currentItem.pattern,
                currentItem.account.id,
                selectedPoste ? currentItem.suggestedPoste?.id ?? null : null,
                selectedNature ? currentItem.suggestedNature?.id ?? null : null,
            )

            if (!didSave) {
                return
            }

            // Keep explicit refresh for resilience when stream reconnects.
            await refreshUser().catch(() => null)
            moveNext()
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleSkip = () => {
        moveNext()
    }

    return (
        <>
            <Card title="Le dojo" className="mb-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    <div className="max-w-xs mx-auto lg:mx-0">
                        <img
                            src={imageSource}
                            alt="Chocokarate"
                            style={{ maxHeight: 260, objectFit: "cover" }}
                            className={`rounded-lg ${isWinning ? "scale-105" : ""}`}
                        />
                    </div>

                    <div className="flex-1 space-y-5">
                        <div className="flex gap-2">
                            <Message
                                text={() => (
                                    <>
                                        <p className="text-lg font-semibold">Bienvenue dans le dojo, un endroit où on fait monter l'XP en validant les règles de catégorisation.</p>
                                        <p>{statusMessage}</p>
                                    </>
                                )}
                                className="grow"
                            />
                            <div className="rounded-lg border border-surface p-4 text-center">
                                <div className="text-sm text-500">Patterns restants</div>
                                <div className="text-3xl font-semibold">{remaining}</div>
                            </div>
                        </div>

                        {!isStarted ? (
                            <div className="space-y-4 rounded-lg border border-surface p-4 bg-surface">
                                <div className="text-sm text-500">Comment ça marche ?</div>
                                <ul className="list-disc px-5 text-sm leading-6">
                                    <li>Appuie sur GO pour lancer la session.</li>
                                    <li>Valide les suggestions de poste et nature en cliquant sur le pouce.</li>
                                    <li>Confirme la règle pour gagner de l'XP et avancer dans le classement.</li>
                                </ul>
                                <Button label="GO" icon="pi pi-play" severity="success" onClick={handleStart} className="mt-3" />
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {!currentItem ? (
                                    <div className="rounded-lg border border-dashed border-surface p-4 text-center text-sm text-700">
                                        <div className="font-semibold mb-2">Aucun pattern à traiter</div>
                                        <div>Lorsque des motifs non catégorisés sont identifiés, ils apparaîtront ici pour validation rapide.</div>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="rounded-lg border border-surface p-4 bg-surface">
                                            <div className="mb-4 flex items-center justify-between gap-4">
                                                <div>
                                                    <div className="text-sm text-500">Pattern proposé</div>
                                                    <div className="text-2xl font-semibold wrap-break-word">{currentItem.pattern}</div>
                                                </div>
                                                <div className="flex flex-col gap-1">
                                                    <Tag value={`${currentItem.account.label}`} severity="info" />
<Tag value={`${currentItem.count} occurrences`} severity="contrast" />
                                                </div>
                                            </div>
                                            <div className="grid gap-3 lg:grid-cols-2">
                                                {
                                                    currentItem.suggestedPoste ? (
                                                        <div className="flex items-center justify-between rounded-lg border border-surface p-3">
                                                            <div>
                                                                <div className="text-sm text-500">Poste suggéré</div>
                                                                <ColoredLabel data={{ ...currentItem.suggestedPoste }} />
                                                            </div>
                                                            <Button
                                                                icon="pi pi-thumbs-up"
                                                                rounded
                                                                severity={selectedPoste ? "success" : "secondary"}
                                                                className="p-button-text"
                                                                aria-label="Valider le poste"
                                                                onClick={() => setSelectedPoste((prev) => !prev)}
                                                            />
                                                        </div>
                                                    ) : <Skeleton />
                                                }
                                                {
                                                    currentItem.suggestedNature ? (
                                                        <div className="flex items-center justify-between rounded-lg border border-surface p-3">
                                                            <div>
                                                                <div className="text-sm text-500">Nature suggérée</div>
                                                                <ColoredLabel data={{ ...currentItem.suggestedNature }} />
                                                            </div>
                                                            <Button
                                                                icon="pi pi-thumbs-up"
                                                                rounded
                                                                severity={selectedNature ? "success" : "secondary"}
                                                                className="p-button-text"
                                                                aria-label="Valider la nature"
                                                                onClick={() => setSelectedNature((prev) => !prev)}
                                                            />
                                                        </div>
                                                    ) : <Skeleton />
                                                }
                                            </div>
                                        </div>

                                        <div className="flex flex-row justify-end gap-3">
                                            <Button
                                                label="Passer"
                                                icon="pi pi-forward"
                                                text
                                                onClick={handleSkip}
                                                disabled={isSubmitting}
                                            />
                                            <Button
                                                label={selectedPoste && selectedNature ? "Valider la séléction" : selectedPoste ? "Valider le poste" : selectedNature ? "Valider la nature" : "Choisis une proposition"}
                                                icon="pi pi-check"
                                                severity="success"
                                                onClick={handleConfirm}
                                                loading={isSubmitting}
                                                disabled={!canSubmit || isSubmitting}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
                <DojoXpLeaderboard />
            </Card>

        </>
    )
}

