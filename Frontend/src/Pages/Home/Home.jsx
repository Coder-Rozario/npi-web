import { useEffect, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { LoadingManagerProvider } from "../../Components/Loading/LoadingManager";

import Intro from "../../Components/Home/Intro";
import NoticeMarquee from "../../Components/Home/NoticeMarque";
import Overview from "../../Components/Home/Overview";

const Buttom_photos = lazy(() => import("../../Components/Home/Buttom_photos"));
const Campus_Activities = lazy(() => import("../../Components/Home/Campus_Activities"));
const CounterSection = lazy(() => import("../../Components/Home/CounterSection"));
const Home_Departments = lazy(() => import("../../Components/Home/Home_Departments"));
const Link_Accreditation = lazy(() => import("../../Components/Home/Link_Accreditation"));
const Achivement = lazy(() => import("../../Components/Home/Achivement"));
const Authority = lazy(() => import("../../Components/Home/Authority"));
const StudentFeedback = lazy(() => import("../Student Feedback/StudentFeedback"));
const PerantsFeedback = lazy(() => import("../parents Feedback/PerantsFeedback"));
const RecentNews = lazy(() => import("../../Components/Home/RecentNews"));

const Home = () => {
  const location = useLocation();

  useEffect(() => {
    const targetId = location.state?.scrollTo || location.hash?.replace('#', '');
    if (targetId) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  }, [location]);

  return (
    <LoadingManagerProvider
      components={[
        "Intro",
        "Notice",
        "Overview",
        "Departments",
        "Counters",
        "Authority",
        "Achivement",
        "Campus",
        "BottomPhotos",
        "StudentFeedback",
        "ParentsFeedback",
        "RecentNews",
        "Accreditation",
      ]}
    >
      <div className="bg-white">
        <Intro />
        <NoticeMarquee />
        <Overview />
        <Suspense fallback={<div className="h-20" />}>
          <Home_Departments />
          <CounterSection />
          <Authority />
          <Achivement />
          <Campus_Activities />
          <Buttom_photos />
          <StudentFeedback />
          <PerantsFeedback />
          <RecentNews />
          <Link_Accreditation />
        </Suspense>
      </div>
    </LoadingManagerProvider>
  );
};

export default Home;
