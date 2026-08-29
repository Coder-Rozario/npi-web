import { useState, useEffect, useCallback, useRef } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PropTypes from 'prop-types';
import axios from 'axios';
import LoadingSpinner from '../Loading/LoadingSpinner';
import { useLoadingManager } from '../Loading/LoadingManager';
import { API_BASE_URL } from "../../apiConfig";

const counterSectionStyles = `
.counter-section {
  width: 100%;
  display: flex;
  margin: 0;
  padding: 50px 20px;
  justify-content: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e0f2fe 100%);
  overflow: visible !important;
  height: auto !important;
  min-height: auto !important;
  box-sizing: border-box;
}

.counter-section .container {
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
  justify-content: center;
  width: 100%;
  max-width: 1200px;
  padding: 0 16px;
  box-sizing: border-box;
  overflow: visible !important;
  height: auto !important;
  min-height: auto !important;
}

.roww {
  width: 100%;
  display: flex;
  gap: 30px;
  justify-content: center;
  flex-wrap: wrap;
  overflow: visible !important;
  height: auto !important;
  min-height: auto !important;
  box-sizing: border-box;
  align-items: stretch;
}

.coll {
  flex: 1 1 calc(33.333% - 20px);
  min-width: 250px;
  max-width: 300px;
  width: 100%;
  padding: 0;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  overflow: visible !important;
  box-sizing: border-box;
}

.counter-box {
  background: linear-gradient(135deg, #ffffff 0%, #f0f9ff 100%);
  border: 2px solid #e0f2fe;
  box-shadow: 0 8px 24px rgba(1, 135, 192, 0.12);
  padding: 35px 30px;
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  min-height: 180px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  width: 100%;
  box-sizing: border-box;
  overflow: visible !important;
  opacity: 1 !important;
  visibility: visible !important;
}

.counter-box:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 16px 36px rgba(1, 135, 192, 0.25);
  border-color: #0187c0;
  background: linear-gradient(135deg, #ffffff 0%, #e0f2fe 100%);
}

.counter-title {
  font-size: 16px;
  color: #065c81;
  margin-bottom: 16px;
  font-weight: 700;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  line-height: 1.4;
  min-height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  word-break: break-word;
}

.counter-number-wrapper {
  font-size: 42px;
  color: #0187c0;
  font-weight: 900;
  display: flex;
  align-items: baseline;
  gap: 4px;
  letter-spacing: -1px;
  justify-content: center;
}

.counter-suffix {
  font-size: 24px;
  color: #0187c0;
  opacity: 0.7;
  font-weight: 700;
}

.counter-section [data-aos],
.counter-box[data-aos],
.roww [data-aos] {
  opacity: 1 !important;
  visibility: visible !important;
  transform: none !important;
}

/* Tablet - 2 cards per row */
@media (max-width: 992px) {
  .coll {
    flex: 0 0 calc(50% - 20px);
    max-width: calc(50% - 20px);
    min-width: 0;
    width: calc(50% - 20px);
  }
}

/* Mobile - Stack 2 cards per row on medium mobile, full wrap */
@media (max-width: 768px) {
  .counter-section {
    padding: 40px 16px;
  }

  .counter-section .container {
    padding: 0;
    gap: 20px;
  }

  .roww {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: center;
    align-items: stretch;
    gap: 20px;
    width: 100%;
  }

  .coll {
    flex: 0 0 calc(50% - 10px);
    max-width: calc(50% - 10px);
    min-width: 0;
    width: calc(50% - 10px);
    padding: 0;
    box-sizing: border-box;
  }

  .counter-box {
    padding: 28px 20px;
    min-height: 150px;
    width: 100%;
    max-width: 100%;
    margin: 0;
  }

  .counter-number-wrapper {
    font-size: 34px;
    gap: 3px;
  }

  .counter-title {
    font-size: 14px;
    min-height: 24px;
    margin-bottom: 12px;
    line-height: 1.3;
  }

  .counter-suffix {
    font-size: 20px;
  }
}

/* Small Mobile - 1 card per row */
@media (max-width: 520px) {
  .counter-section {
    padding: 30px 12px;
  }

  .counter-section .container {
    padding: 0;
    gap: 16px;
  }

  .roww {
    gap: 16px;
    padding: 0;
  }

  .coll {
    flex: 0 0 100%;
    max-width: 100%;
    width: 100%;
    padding: 0 8px;
  }

  .counter-box {
    padding: 24px 18px;
    min-height: 130px;
    max-width: 400px;
    border-radius: 14px;
    margin: 0 auto;
  }

  .counter-number-wrapper {
    font-size: 32px;
    gap: 2px;
  }

  .counter-title {
    font-size: 13px;
    min-height: 22px;
    margin-bottom: 12px;
    letter-spacing: 0.3px;
  }

  .counter-suffix {
    font-size: 18px;
  }
}

/* Very Small Devices - Full width compact cards */
@media (max-width: 380px) {
  .counter-section {
    padding: 24px 8px;
  }

  .counter-section .container {
    gap: 12px;
  }

  .roww {
    gap: 12px;
  }

  .coll {
    padding: 0 4px;
  }

  .counter-box {
    padding: 20px 14px;
    min-height: 115px;
    max-width: 100%;
    border-radius: 12px;
  }

  .counter-number-wrapper {
    font-size: 28px;
  }

  .counter-title {
    font-size: 12px;
    min-height: 20px;
    margin-bottom: 10px;
  }

  .counter-suffix {
    font-size: 16px;
  }
}

/* Extra Small Devices */
@media (max-width: 320px) {
  .counter-section {
    padding: 20px 6px;
  }

  .counter-box {
    padding: 16px 12px;
    min-height: 95px;
    border-radius: 10px;
  }

  .counter-number-wrapper {
    font-size: 24px;
  }

  .counter-title {
    font-size: 11px;
    min-height: 18px;
    margin-bottom: 8px;
  }

  .counter-suffix {
    font-size: 14px;
  }
}
`;

const CounterSection = () => {
  const [counters, setCounters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { markLoaded } = useLoadingManager();

  const fetchCounters = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/counters`);
      if (Array.isArray(response.data) && response.data.length > 0) {
        setCounters(
          response.data.map((counter) => ({
            ...counter,
            value: Math.max(0, Math.floor(Number(counter.value) || 0)),
            duration: Number(counter.duration) || 1000,
          }))
        );
      } else {
        setCounters([]);
      }
    } catch (err) {
      console.error('Counter fetch error:', err);
      setError('Failed to load counters');
      setCounters([]);
    } finally {
      setIsLoading(false);
      markLoaded("Counters");
    }
  }, [markLoaded]);

  useEffect(() => {
    try {
      AOS.init({
        duration: 600,
        once: true,
        offset: 20,
        disable: () => window.innerWidth < 768,
        startEvent: 'DOMContentLoaded',
        initClassName: 'aos-init',
        animatedClassName: 'aos-animate',
      });
    } catch (e) {
      console.warn('AOS init skipped:', e.message);
    }
    fetchCounters();
  }, [fetchCounters]);

  const Counter = ({ title, value, duration }) => {
    const [count, setCount] = useState(0);
    const rafRef = useRef(null);
    const observerRef = useRef(null);
    const elementRef = useRef(null);

    useEffect(() => {
      const easeOutQuad = (t) => t * (2 - t);

      const cleanupAnimation = () => {
        if (rafRef.current) {
          cancelAnimationFrame(rafRef.current);
          rafRef.current = null;
        }
      };

      const animateCount = () => {
        cleanupAnimation();
        setCount(0);
        let startTime = null;

        const step = (timestamp) => {
          if (!startTime) startTime = timestamp;
          const progress = timestamp - startTime;
          const ratio = Math.min(progress / duration, 1);
          const eased = easeOutQuad(ratio);
          setCount(Math.min(Math.floor(value * eased), value));
          if (progress < duration) {
            rafRef.current = requestAnimationFrame(step);
          } else {
            setCount(value);
          }
        };

        rafRef.current = requestAnimationFrame(step);
      };

      const handleIntersect = (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            animateCount();
            return;
          }
        }
        cleanupAnimation();
        setCount(0);
      };

      const el = document.getElementById(`counter-${title}`);
      elementRef.current = el || null;

      if (el && 'IntersectionObserver' in window) {
        observerRef.current = new IntersectionObserver(handleIntersect, {
          threshold: 0.4,
          rootMargin: '0px',
        });
        observerRef.current.observe(el);
      } else {
        animateCount();
      }

      return () => {
        cleanupAnimation();
        if (observerRef.current && elementRef.current) {
          observerRef.current.unobserve(elementRef.current);
          observerRef.current = null;
        }
      };
    }, [duration, title, value]);

    return (
      <div className="counter-box" id={`counter-${title}`} data-aos="zoom-in-up">
        <div className="counter-title">{title}</div>
        <div className="counter-number-wrapper">
          <span className="counter-number">{count}</span>
          <span className="counter-suffix">+</span>
        </div>
      </div>
    );
  };

  Counter.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
  };

  if (!isLoading && counters.length === 0 && !error) {
    return null;
  }

  return (
    <>
      <style>{counterSectionStyles}</style>
      <section className="counter-section relative min-h-[150px]">
        {isLoading && <LoadingSpinner overlay />}
        <div className="container">
          {error && <div className="px-4 text-red-600 text-sm">{error}</div>}
          <div className="roww">
            {counters.map((c) => (
              <div key={c.id ?? c.title} className="coll">
                <Counter title={c.title} value={c.value} duration={c.duration} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default CounterSection;