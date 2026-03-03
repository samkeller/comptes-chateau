import axios from "axios";
import { showGlobalToast } from "./GlobalToast";

// Permettre aux cookies d'être envoyés avec chaque requête
axios.defaults.withCredentials = true;

axios.interceptors.response.use( 
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      if (!window.location.pathname.startsWith("/auth")) {
        showGlobalToast({
                severity: 'error',
                summary: "Session expirée",
                detail: "Veuillez vous reconnecter."
            })
        location.replace("/auth");
      }
    }
    return Promise.reject(error);
  }
);
