import Images from "../../Pages/Gallery/Images";
import { useCallback, useState } from "react";
import { useLoadingManager } from "../Loading/LoadingManager";
import LoadingSpinner from "../Loading/LoadingSpinner";

const Achivement= () => {
    const [loading, setLoading] = useState(true);
    const [portfolioItems, setPortfolioItems] = useState([]);
    const { markLoaded } = useLoadingManager();
    const onImagesLoaded = useCallback((items = []) => {
        setPortfolioItems(Array.isArray(items) ? items : []);
        setLoading(false);
        markLoaded("Achivement");
    }, [markLoaded]);

    if (!loading && portfolioItems.length === 0) {
        return null;
    }

    return (
        <div className="All_Achievement relative min-h-[300px]"> 
            {loading && <LoadingSpinner overlay />}
            <div className="text-center mb-10 md:mb-16">
                <h2 className="text-2xl md:text-4xl font-extrabold text-slate-900 mb-4">
                    <span style={{ color: '#0186C0' }}>Achievements</span>
                </h2>
                <div className="w-20 md:w-24 h-1.5 bg-[#0186C0] mx-auto rounded-full"></div>
            </div>
            <Images onLoaded={onImagesLoaded} isFullPage={false}/>
        </div>
    );
};

export default Achivement;
