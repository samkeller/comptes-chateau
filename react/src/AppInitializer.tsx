// app/AppInitializer.tsx

import { useEffect } from "react";
import XpService from "@/services/XpService";


export default function AppInitializer() {

    useEffect(() => {
        const xpService = new XpService();
        xpService.initializeXpStore();
    }, []);

    return null;
}