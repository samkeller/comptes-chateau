export default class BaseService {
    protected baseUrl = import.meta.env.VITE_API_URL
    protected apiUrl = import.meta.env.VITE_API_URL + "/api"
}
