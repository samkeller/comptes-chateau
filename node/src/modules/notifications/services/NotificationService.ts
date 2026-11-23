import type { NotificationDto, NotificationSeverity } from "@chocosous/shared";
import { subDays } from "date-fns";
import { Brackets, type EntityManager, type Repository } from "typeorm";
import { AppDataSource } from "../../../db/dataSource";
import customLog from "../../../jobs/customLog";
import { Notification } from "../entities/Notification";
import { NotificationDismissal } from "../entities/NotificationDismissal";
import { toNotificationDto } from "../mappers/NotificationMapper";
import { notificationProviders } from "../providers";
import type { NotificationContent, NotificationContext, NotificationProvider } from "../NotificationProvider";

export interface PublishNotificationInput extends NotificationContent {
    /** Destinataires ; omis = tous les utilisateurs. */
    recipientUserIds?: number[];
    /** Auteur de l'action, jamais notifié lui-même. */
    actorUserId?: number | null;
}

/** Au-delà, une notification événementielle n'est plus affichée. */
const EVENT_RETENTION_DAYS = 30;

const SEVERITY_RANK: Record<NotificationSeverity, number> = { high: 0, medium: 1, info: 2 };

function byMostImportant(a: NotificationDto, b: NotificationDto): number {
    return SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] || b.occurredAt.localeCompare(a.occurredAt);
}

export default class NotificationService {
    private readonly notificationRepo: Repository<Notification>;
    private readonly dismissalRepo: Repository<NotificationDismissal>;

    constructor(
        private readonly manager: EntityManager = AppDataSource.manager,
        private readonly providers: NotificationProvider[] = notificationProviders,
    ) {
        this.notificationRepo = manager.getRepository(Notification);
        this.dismissalRepo = manager.getRepository(NotificationDismissal);
    }

    /** Publie une notification événementielle (persistée). */
    async publish({ recipientUserIds, actorUserId = null, ...content }: PublishNotificationInput): Promise<void> {
        const recipients = recipientUserIds === undefined ? [null] : [...new Set(recipientUserIds)];
        if (recipients.length === 0) return;

        await this.notificationRepo.save(recipients.map((recipientUserId) => this.notificationRepo.create({
            ...content,
            recipientUserId,
            actorUserId,
        })));
    }

    /** Ignore une notification pour cet utilisateur (idempotent). */
    async dismiss(userId: number, key: string): Promise<void> {
        await this.dismissalRepo.createQueryBuilder()
            .insert()
            .values({ userId, key })
            .orIgnore()
            .execute();
    }

    /** Notifications de l'utilisateur : événements reçus + états calculés par les providers. */
    async getForUser(userId: number, now: Date = new Date()): Promise<NotificationDto[]> {
        const [events, states, dismissedKeys] = await Promise.all([
            this.getEvents(userId, now),
            this.collectFromProviders({ now, manager: this.manager }),
            this.getDismissedKeys(userId),
        ]);

        return [...events, ...states]
            .filter((notification) => !dismissedKeys.has(notification.key))
            .sort(byMostImportant);
    }

    /** Un provider en échec est journalisé puis ignoré : il ne doit pas masquer les autres notifications. */
    private async collectFromProviders(context: NotificationContext): Promise<NotificationDto[]> {
        const results = await Promise.allSettled(this.providers.map((provider) => provider.collect(context)));

        return results.flatMap((result, index) => {
            if (result.status === "fulfilled") return result.value;
            const reason = result.reason instanceof Error ? result.reason.message : String(result.reason);
            customLog("ERROR", `Notification provider "${this.providers[index].name}" failed: ${reason}`, "service");
            return [];
        });
    }

    private async getDismissedKeys(userId: number): Promise<Set<string>> {
        const dismissals = await this.dismissalRepo.find({ where: { userId }, select: { key: true } });
        return new Set(dismissals.map((dismissal) => dismissal.key));
    }

    private async getEvents(userId: number, now: Date): Promise<NotificationDto[]> {
        const events = await this.notificationRepo.createQueryBuilder("notification")
            .where("notification.createdAt >= :since", { since: subDays(now, EVENT_RETENTION_DAYS) })
            .andWhere(new Brackets((qb) => qb
                .where("notification.recipientUserId IS NULL")
                .orWhere("notification.recipientUserId = :userId", { userId })))
            .andWhere(new Brackets((qb) => qb
                .where("notification.actorUserId IS NULL")
                .orWhere("notification.actorUserId <> :userId", { userId })))
            .getMany();

        return events.map(toNotificationDto);
    }
}
