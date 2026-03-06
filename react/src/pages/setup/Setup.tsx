import { PageTemplate } from "../PageTemplate";
import NatureSetupCard from "./components/NatureSetupCard";
import PosteSetupCard from "./components/PosteSetupCard";

export default function Setup() {
    return (
        <PageTemplate pageTitle="Configuration">
            <div className="grid">
                <div className="col-12 lg:col-6">
                    <NatureSetupCard/>
                </div>

                <div className="col-12 lg:col-6">
                    <PosteSetupCard />
                </div>
            </div>
        </PageTemplate>
    );
}
