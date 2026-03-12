import { PageTemplate } from "../PageTemplate";
import NatureSetupCard from "./components/NatureSetupCard";
import PosteSetupCard from "./components/PosteSetupCard";

export default function Setup() {
    return (
        <PageTemplate pageTitle="Configuration">
            <div className="grid grid-cols-12 gap-6">
                <div className="col-span-12 lg:col-span-6">
                    <NatureSetupCard/>
                </div>

                <div className="col-span-12 lg:col-span-6">
                    <PosteSetupCard />
                </div>
            </div>
        </PageTemplate>
    );
}
