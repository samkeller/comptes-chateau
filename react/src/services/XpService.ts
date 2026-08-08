import UserService from "./UserService";
import { useXpStore } from "@/stores/useXpStore";

class XpService extends UserService {

    async initializeXpStore() {
        const users = await super.getAllUsers();

        useXpStore.getState().initialize(users);
    }

    /**
    * Ajoute de l'expérience à l'utilisateur connecté et synchronise
    * l'état global XP après la mise à jour côté serveur.
    *
    * Cette surcharge conserve le comportement de UserService.addXP()
    * tout en ajoutant la mise à jour du store Zustand afin que les
    * composants React abonnés soient automatiquement rafraîchis.
    *
    * @param amount - Quantité d'expérience à ajouter.
    * @returns L'utilisateur mis à jour après l'ajout d'expérience.
    */
    public override async addXP(amount: number) {
        const updatedUser = await super.addXP(amount);

        useXpStore.getState().updateUserXp(updatedUser);

        return updatedUser;
    }
}

export default XpService;