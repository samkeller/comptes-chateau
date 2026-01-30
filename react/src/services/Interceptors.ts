import axios from "axios";
import { Navigate } from "react-router-dom";

// Permettre aux cookies d'être envoyés avec chaque requête
axios.defaults.withCredentials = true;

axios.interceptors.response.use( 
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      if (!window.location.pathname.startsWith("/auth")) {
        Navigate({to: "/auth"});
      }
    }
    return Promise.reject(error);
  }
);
