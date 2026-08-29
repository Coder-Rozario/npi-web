import { API_BASE_URL } from "../../apiConfig";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  RiDoubleQuotesL,
  RiArrowLeftSLine,
  RiArrowRightSLine,
  RiVerifiedBadgeFill,
} from "react-icons/ri";
import { HiOutlineArrowNarrowRight } from "react-icons/hi";
import { useLoadingManager } from "../../Components/Loading/LoadingManager";
import LoadingSpinner from "../../Components/Loading/LoadingSpinner";
import useAutoRefresh from "../../hooks/useAutoRefresh";
import altpic from '../../Images/download.png';

const ParentsFeedback = () => {
  const PARENTS_CACHE_VERSION = "v3_order";

  

  const isCacheValid = () => {
    const ver = sessionStorage.getItem(
      "parents_feedback_version"
    );

    return ver === PARENTS_CACHE_VERSION;
  };

  

  const [feedbackList, setFeedbackList] = useState(() => {
    if (!isCacheValid()) {
      sessionStorage.removeItem("parents_feedback");
      sessionStorage.removeItem(
        "parents_feedback_version"
      );

      return [];
    }

    const cached =
      sessionStorage.getItem("parents_feedback");

    try {
      return cached ? JSON.parse(cached) : [];
    } catch (e) {
      return [];
    }
  });

  const [currentIndex, setCurrentIndex] = useState(0);

  const [paused, setPaused] = useState(false);

  const [expandedFeedbackId, setExpandedFeedbackId] =
    useState(null);

  const [loading, setLoading] = useState(
    !isCacheValid() ||
      !sessionStorage.getItem("parents_feedback")
  );

  const { markLoaded } = useLoadingManager();

  

  useAutoRefresh(
    async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/approved-parents-feedbacks?nocache=${Date.now()}`
        );

        if (!response.ok) {
          throw new Error(`Status: ${response.status}`);
        }

        const data = await response.json();

        const list = Array.isArray(data)
          ? [...data].sort((a, b) => {
              const oA = typeof a.order_index === 'number' ? a.order_index : 0;
              const oB = typeof b.order_index === 'number' ? b.order_index : 0;
              if (oA !== oB) return oA - oB;
              return new Date(b.created_at || 0) - new Date(a.created_at || 0);
            })
          : [];

        setFeedbackList(list);

        sessionStorage.setItem(
          "parents_feedback_version",
          PARENTS_CACHE_VERSION
        );

        if (list.length > 0) {
          sessionStorage.setItem(
            "parents_feedback",
            JSON.stringify(list)
          );
        } else {
          sessionStorage.removeItem(
            "parents_feedback"
          );
        }

        return list;
      } catch (err) {
        console.error('Parents feedback fetch error:', err);
        return feedbackList || [];
      } finally {
        setLoading(false);
        markLoaded("ParentsFeedback");
      }
    },
    [],
    {
      intervalMs: 1200,
      maxIntervalMs: 6000,
      timeoutMs: 7000,

      isReady: (d) =>
        Array.isArray(d),
    }
  );

  

  useEffect(() => {
    if (
      feedbackList.length > 1 &&
      !paused &&
      !expandedFeedbackId
    ) {
      const interval = setInterval(() => {
        setCurrentIndex(
          (prev) =>
            (prev + 1) % feedbackList.length
        );
      }, 6000);

      return () =>
        clearInterval(interval);
    }
  }, [
    feedbackList,
    paused,
    expandedFeedbackId,
  ]);

  

  const currentFeedback =
    (Array.isArray(feedbackList) &&
      feedbackList[currentIndex]) ||
    {};

  

  const getPhotoUrl = (
    photoPath,
    addCacheBuster = true
  ) => {
    if (
      !photoPath ||
      typeof photoPath !== "string"
    ) {
      return altpic;
    }
    const urlRegex = /^(https?:)?\/\//;
    if (
      urlRegex.test(photoPath) ||
      photoPath.startsWith("data:")
    ) {
      return photoPath;
    }

    const normalized =
      photoPath.replace(/\\/g, "/");

    const cleanPath = normalized
      .replace(/^\/?api\/?/, "")
      .replace(/^\/?uploads\/?/, "");

    if (!cleanPath) {
      return null;
    }

    const base =
      API_BASE_URL.replace(/\/$/, "");

    let url =
      `${base}/uploads/${cleanPath}`;

    if (addCacheBuster) {
      url += `?t=${Date.now() % 1000000}`;
    }

    return url;
  };

  const photoSrc =
    getPhotoUrl(currentFeedback.photo) ||
    getPhotoUrl(
      currentFeedback.photo_path
    ) ||
    getPhotoUrl(
      currentFeedback.photo_url
    );

  if (!loading && feedbackList.length === 0) {
    return null;
  }

  const goToPrevious = () => {
    if (feedbackList.length <= 1) {
      return;
    }

    setExpandedFeedbackId(null);

    setCurrentIndex(
      (prev) =>
        (prev - 1 + feedbackList.length) %
        feedbackList.length
    );
  };

  const goToNext = () => {
    if (feedbackList.length <= 1) {
      return;
    }

    setExpandedFeedbackId(null);

    setCurrentIndex(
      (prev) =>
        (prev + 1) % feedbackList.length
    );
  };

  

  return (
    <section
      className="
        relative
        overflow-hidden
        bg-gradient-to-b
        from-white
        via-slate-50
        to-white
        py-16
        md:py-24
      "
    >

      <div
        className="
          absolute
          -top-24
          -left-24
          w-72
          h-72
          bg-blue-100/40
          rounded-full
          blur-3xl
          pointer-events-none
        "
      />

      <div
        className="
          absolute
          -bottom-24
          -right-24
          w-72
          h-72
          bg-cyan-100/30
          rounded-full
          blur-3xl
          pointer-events-none
        "
      />

      {loading && (
        <LoadingSpinner overlay />
      )}

      <div
        className="
          relative
          max-w-6xl
          mx-auto
          px-5
          sm:px-6
          lg:px-8
        "
      >

        <div
          className="
            flex
            flex-col
            lg:flex-row
            lg:items-end
            lg:justify-between
            gap-6
            mb-10
            md:mb-12
          "
        >

          <div className="max-w-2xl">

            <motion.div
              initial={{
                opacity: 0,
                y: 10,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              className="
                inline-flex
                items-center
                gap-2
                px-3.5
                py-1.5
                rounded-full
                bg-blue-50
                border
                border-blue-100
                text-blue-600
                text-xs
                font-bold
                uppercase
                tracking-[0.18em]
                mb-4
              "
            >
              <span
                className="
                  w-1.5
                  h-1.5
                  rounded-full
                  bg-blue-600
                "
              />

              Community Trust
            </motion.div>


            <motion.h2
              initial={{
                opacity: 0,
                y: 15,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.1,
              }}
              className="
                text-3xl
                sm:text-4xl
                md:text-5xl
                font-extrabold
                tracking-tight
                text-slate-900
                leading-tight
              "
            >
              Parents'{" "}
              <span className="text-blue-600">
                Feedback
              </span>
            </motion.h2>


            {/* Description */}

            <motion.p
              initial={{
                opacity: 0,
                y: 15,
              }}
              whileInView={{
                opacity: 1,
                y: 0,
              }}
              viewport={{
                once: true,
              }}
              transition={{
                delay: 0.2,
              }}
              className="
                mt-4
                text-slate-500
                text-sm
                sm:text-base
                leading-7
                max-w-xl
              "
            >
              Read the experiences and
              valuable feedback shared by
              parents and guardians of our
              students.
            </motion.p>

          </div>


          {/* Institutional Note */}

          <motion.div
            initial={{
              opacity: 0,
              x: 20,
            }}
            whileInView={{
              opacity: 1,
              x: 0,
            }}
            viewport={{
              once: true,
            }}
            className="
              hidden
              sm:flex
              items-center
              gap-3
              bg-white
              border
              border-slate-100
              shadow-sm
              rounded-2xl
              px-5
              py-4
            "
          >

            <div
              className="
                w-11
                h-11
                rounded-xl
                bg-blue-50
                text-blue-600
                flex
                items-center
                justify-center
              "
            >
              <RiVerifiedBadgeFill
                className="text-2xl"
              />
            </div>

            <div>

              <p
                className="
                  text-sm
                  font-bold
                  text-slate-900
                "
              >
                Parents & Guardians
              </p>

              <p
                className="
                  text-xs
                  text-slate-500
                  mt-0.5
                "
              >
                Sharing their experiences
              </p>

            </div>

          </motion.div>

        </div>


        {/* Feedback Slider */}

        <div
          onMouseEnter={() =>
            setPaused(true)
          }
          onMouseLeave={() =>
            setPaused(false)
          }
          className="relative"
          aria-busy={
            loading
              ? "true"
              : "false"
          }
        >

          {/* Fixed-height card wrapper prevents layout shift when content changes */}

          <div
            className="
              relative
              h-[430px]
              sm:h-[390px]
              lg:h-[360px]
            "
          >

            <AnimatePresence
              mode="wait"
              initial={false}
            >

              {!loading &&
              feedbackList.length > 0 &&
              currentFeedback.name ? (

                <motion.div
                  key={
                    currentFeedback.id ||
                    currentIndex
                  }
                  initial={{
                    opacity: 0,
                    x: 25,
                  }}
                  animate={{
                    opacity: 1,
                    x: 0,
                  }}
                  exit={{
                    opacity: 0,
                    x: -25,
                  }}
                  transition={{
                    duration: 0.45,
                    ease: [
                      0.22,
                      1,
                      0.36,
                      1,
                    ],
                  }}
                  className="
                    absolute
                    inset-0
                    bg-white
                    rounded-[2rem]
                    border
                    border-slate-100
                    shadow-[0_20px_60px_rgba(15,23,42,0.07)]
                    overflow-hidden
                  "
                >

                  {/* Top Accent */}

                  <div
                    className="
                      absolute
                      top-0
                      left-0
                      right-0
                      h-1
                      bg-gradient-to-r
                      from-blue-600
                      via-cyan-500
                      to-blue-600
                    "
                  />


                  {/* Background Quote */}

                  <RiDoubleQuotesL
                    className="
                      absolute
                      top-4
                      right-5
                      text-[8rem]
                      text-blue-50
                      opacity-70
                      pointer-events-none
                    "
                  />


                  {/* Card Content */}

                  <div
                    className="
                      relative
                      z-10
                      h-full
                      grid
                      lg:grid-cols-[280px_1fr]
                    "
                  >

                    {/* Parent Profile */}

                    <div
                      className="
                        p-7
                        sm:p-9
                        lg:p-10
                        bg-gradient-to-br
                        from-slate-50
                        to-white
                        border-b
                        lg:border-b-0
                        lg:border-r
                        border-slate-100
                        flex
                        items-center
                      "
                    >

                      <div
                        className="
                          flex
                          lg:flex-col
                          items-center
                          lg:items-start
                          gap-5
                          w-full
                        "
                      >

                        {/* Parent Photo */}

                        <div
                          className="
                            relative
                            flex-shrink-0
                          "
                        >

                          {photoSrc ? (

                            <img
                              key={`photo-${
                                currentFeedback.id ||
                                currentIndex
                              }`}
                              src={photoSrc}
                              alt={
                                currentFeedback.name ||
                                "Parent"
                              }
                              className="
                                w-20
                                h-20
                                rounded-2xl
                                object-cover
                                border-4
                                border-white
                                shadow-lg
                              "
                              onError={(e) => {
                                e.currentTarget.onerror =
                                  null;
                                e.currentTarget.src = altpic;
                              }}
                            />

                          ) : null}


                          {/* Initial Avatar */}

                          <div
                            className="
                              avatar-fallback
                              w-20
                              h-20
                              rounded-2xl
                              bg-gradient-to-br
                              from-blue-600
                              to-cyan-500
                              text-white
                              items-center
                              justify-center
                              font-extrabold
                              text-2xl
                              shadow-lg
                            "
                            style={
                              photoSrc
                                ? {
                                    display:
                                      "none",
                                  }
                                : {
                                    display:
                                      "flex",
                                  }
                            }
                          >
                            {currentFeedback.name
                              ?.charAt(0)
                              ?.toUpperCase() ||
                              "P"}
                          </div>


                          {/* Parent Badge */}

                          <div
                            className="
                              absolute
                              -bottom-2
                              -right-2
                              w-7
                              h-7
                              rounded-full
                              bg-white
                              shadow-md
                              flex
                              items-center
                              justify-center
                              text-blue-600
                            "
                          >
                            <RiVerifiedBadgeFill />
                          </div>

                        </div>


                        {/* Parent Information */}

                        <div
                          className="
                            text-left
                          "
                        >

                          <h3
                            className="
                              text-lg
                              font-extrabold
                              text-slate-900
                            "
                          >
                            {currentFeedback.name}
                          </h3>

                          <p
                            className="
                              mt-1
                              text-xs
                              font-bold
                              text-blue-600
                              uppercase
                              tracking-wider
                            "
                          >
                            {currentFeedback.occupation ||
                              "Parent / Guardian"}
                          </p>

                          <p
                            className="
                              mt-3
                              text-xs
                              text-slate-400
                              leading-5
                            "
                          >
                            Parent/Guardian
                            Feedback
                          </p>

                        </div>

                      </div>

                    </div>


                    {/* Feedback Content */}

                    <div
                      className="
                        p-7
                        sm:p-9
                        lg:p-12
                        flex
                        flex-col
                        justify-center
                        min-w-0
                      "
                    >

                      <div
                        className="
                          h-[190px]
                          sm:h-[180px]
                          lg:h-[170px]
                          overflow-y-auto
                          pr-2
                          scrollbar-thin
                          scrollbar-thumb-slate-200
                          scrollbar-track-transparent
                        "
                      >

                        <p
                          className="
                            text-slate-600
                            text-base
                            sm:text-lg
                            leading-8
                          "
                        >
                          "{currentFeedback.message}"
                        </p>

                      </div>


                      {/* Read More / Collapse */}

                      {currentFeedback.message
                        ?.length > 200 && (

                        <button
                          onClick={() =>
                            setExpandedFeedbackId(
                              expandedFeedbackId
                                ? null
                                : currentFeedback.id
                            )
                          }
                          className="
                            mt-4
                            inline-flex
                            items-center
                            gap-2
                            w-fit
                            text-sm
                            font-bold
                            text-slate-900
                            hover:text-blue-600
                            transition-colors
                          "
                        >

                          {expandedFeedbackId
                            ? "Show Less"
                            : "Read Full Feedback"}

                          <HiOutlineArrowNarrowRight
                            className={`
                              text-lg
                              transition-transform
                              ${
                                expandedFeedbackId
                                  ? "-rotate-90"
                                  : ""
                              }
                            `}
                          />

                        </button>

                      )}

                    </div>

                  </div>

                </motion.div>

              ) : !loading &&
                feedbackList.length === 0 ? (

                <motion.div
                  initial={{
                    opacity: 0,
                  }}
                  animate={{
                    opacity: 1,
                  }}
                  className="
                    absolute
                    inset-0
                    flex
                    flex-col
                    items-center
                    justify-center
                    py-20
                    px-6
                    bg-white
                    rounded-[2rem]
                    border
                    border-dashed
                    border-slate-200
                  "
                >

                  <RiDoubleQuotesL
                    className="
                      text-6xl
                      text-blue-100
                      mb-5
                    "
                  />

                  <h3
                    className="
                      text-lg
                      font-bold
                      text-slate-800
                    "
                  >
                    No Parents' Feedback Yet
                  </h3>

                  <p
                    className="
                      mt-2
                      text-sm
                      text-slate-400
                      text-center
                    "
                  >
                    Parents and guardians'
                    feedback will appear here.
                  </p>

                </motion.div>

              ) : null}

            </AnimatePresence>

          </div>


          {/* Slider Controls */}

          {feedbackList.length > 1 && (

            <div
              className="
                flex
                items-center
                justify-between
                mt-6
                sm:mt-8
              "
            >

              {/* Pagination */}

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                {feedbackList.map(
                  (_, index) => (

                    <button
                      key={index}
                      aria-label={`View parent feedback ${
                        index + 1
                      }`}
                      onClick={() => {
                        setCurrentIndex(index);

                        setExpandedFeedbackId(
                          null
                        );
                      }}
                      className={`
                        h-2
                        rounded-full
                        transition-all
                        duration-300
                        ${
                          index === currentIndex
                            ? "w-9 bg-blue-600"
                            : "w-2 bg-slate-200 hover:bg-slate-300"
                        }
                      `}
                    />

                  )
                )}

                <span
                  className="
                    ml-2
                    text-xs
                    font-bold
                    text-slate-400
                  "
                >
                  {String(
                    currentIndex + 1
                  ).padStart(2, "0")}{" "}
                  /{" "}
                  {String(
                    feedbackList.length
                  ).padStart(2, "0")}
                </span>

              </div>


              {/* Navigation Buttons */}

              <div
                className="
                  flex
                  items-center
                  gap-2
                "
              >

                <button
                  onClick={goToPrevious}
                  aria-label="Previous parents feedback"
                  className="
                    w-11
                    h-11
                    rounded-full
                    bg-white
                    border
                    border-slate-200
                    text-slate-700
                    flex
                    items-center
                    justify-center
                    hover:bg-blue-600
                    hover:text-white
                    hover:border-blue-600
                    transition-all
                    shadow-sm
                  "
                >
                  <RiArrowLeftSLine
                    className="text-xl"
                  />
                </button>


                <button
                  onClick={goToNext}
                  aria-label="Next parents feedback"
                  className="
                    w-11
                    h-11
                    rounded-full
                    bg-slate-900
                    text-white
                    flex
                    items-center
                    justify-center
                    hover:bg-blue-600
                    transition-all
                    shadow-sm
                  "
                >
                  <RiArrowRightSLine
                    className="text-xl"
                  />
                </button>

              </div>

            </div>

          )}

        </div>


        {/* Submit Feedback CTA */}

        <motion.div
          initial={{
            opacity: 0,
            y: 15,
          }}
          whileInView={{
            opacity: 1,
            y: 0,
          }}
          viewport={{
            once: true,
          }}
          className="
            mt-10
            flex
            flex-col
            sm:flex-row
            sm:items-center
            justify-between
            gap-5
            p-6
            sm:p-7
            rounded-2xl
          
            text-white
            shadow-xl
          "
        >

          <div>

            <h3
              className="
                text-lg
                text-black
                font-bold
              "
            >
              Share Your Feedback
            </h3>

            <p
              className="
                mt-1
                text-sm
                text-slate-400
              "
            >
              Parents and guardians can
              share their experience with
              our institution.
            </p>

          </div>


          <Link
            to="/Parants_Feedback_Form"
            className="
              inline-flex
              items-center
              justify-center
              gap-3
              px-6
              py-3
              rounded-xl
              bg-white
              text-slate-900
              font-bold
              text-sm
              hover:bg-blue-600
              hover:text-white
              transition-all
              duration-300
              group
              whitespace-nowrap
            "
          >

            Submit Parents' Feedback

            <HiOutlineArrowNarrowRight
              className="
                text-lg
                group-hover:translate-x-1
                transition-transform
              "
            />

          </Link>

        </motion.div>

      </div>

    </section>
  );
};

export default ParentsFeedback;