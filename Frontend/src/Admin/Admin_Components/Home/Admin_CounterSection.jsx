import { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import PropTypes from 'prop-types';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API_BASE_URL } from "../../../apiConfig";

const Admin_CounterSection = () => {
  const [counters, setCounters] = useState([]);
  const [selectedCounter, setSelectedCounter] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCounter, setNewCounter] = useState({ title: '', value: 0, duration: 1000 });

  const fetchCounters = () => {
    axios
      .get(`${API_BASE_URL}/counters?t=${new Date().getTime()}`)
      .then((response) => {
        if (Array.isArray(response.data)) {
          setCounters(
            response.data.map((counter) => ({
              ...counter,
              value: Number(counter.value),
              duration: Number(counter.duration) || 1000,
            }))
          );
        }
      })
      .catch((error) => {
        console.error('Error fetching counters:', error);
      });
  };

  useEffect(() => {
    fetchCounters();
  }, []);

  const handleMove = (id, direction) => {
    const index = counters.findIndex(c => c.id === id);
    if (index === -1) return;

    const newCounters = [...counters];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex < 0 || targetIndex >= newCounters.length) return;

    const [moved] = newCounters.splice(index, 1);
    newCounters.splice(targetIndex, 0, moved);

    const orders = newCounters.map((c, idx) => ({ id: c.id, order_index: idx }));

    axios.put(`${API_BASE_URL}/counters-reorder`, { orders })
      .then(() => {
        setCounters(newCounters);
        toast.success("Order updated!");
      })
      .catch(() => toast.error("Failed to reorder"));
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this counter?")) {
      axios.delete(`${API_BASE_URL}/counters/${id}`)
        .then(() => {
          toast.success("Counter deleted!");
          fetchCounters();
        })
        .catch(() => toast.error("Failed to delete"));
    }
  };

  const handleAddCounter = () => {
    if (!newCounter.title) {
      toast.error("Title is required");
      return;
    }
    axios.post(`${API_BASE_URL}/counters`, newCounter)
      .then(() => {
        toast.success("Counter added!");
        setIsAddModalOpen(false);
        setNewCounter({ title: '', value: 0, duration: 1000 });
        fetchCounters();
      })
      .catch(() => toast.error("Failed to add counter"));
  };

  const Counter = ({ title, value, duration, id, index }) => {
    const [count, setCount] = useState(value);
    const [hasAnimated, setHasAnimated] = useState(false);

    const startAnimation = () => {
      if (hasAnimated) return;

      setHasAnimated(true);
      setCount(0);
      let startTime = null;

      const increment = () => {
        if (!startTime) startTime = Date.now();
        const progress = Date.now() - startTime;
        const newCount = Math.min(Math.floor((progress / duration) * value), value);

        setCount(newCount);

        if (progress < duration) {
          requestAnimationFrame(increment);
        }
      };

      requestAnimationFrame(increment);
    };

    useEffect(() => {
      AOS.init({ duration: 1000 });

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !hasAnimated) {
              startAnimation();
            }
          });
        },
        { threshold: 0.5 }
      );

      const section = document.querySelector(`#counter-${id}`);
      if (section) {
        observer.observe(section);
      }

      return () => {
        if (section) {
          observer.unobserve(section);
        }
      };
    }, [id, value, duration]);

    return (
      <div
        className="counter-box p-4 bg-gray-100 shadow-md rounded cursor-pointer relative group text-center"
        id={`counter-${id}`}
        onClick={() => {
          setSelectedCounter({ id, title, value, duration });
          setIsModalOpen(true);
        }}
      >
        <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => { e.stopPropagation(); handleMove(id, 'up'); }}
            className="p-1 bg-white rounded shadow hover:bg-gray-200"
            disabled={index === 0}
            title="Move Left"
          >
            ←
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleMove(id, 'down'); }}
            className="p-1 bg-white rounded shadow hover:bg-gray-200"
            disabled={index === counters.length - 1}
            title="Move Right"
          >
            →
          </button>
          <button
            onClick={(e) => handleDelete(id, e)}
            className="p-1 bg-red-500 text-white rounded shadow hover:bg-red-600"
          >
            ×
          </button>
        </div>
        <div className="counter-title text-lg font-bold">{title}</div>
        <div className="counter-number-wrapper text-3xl font-semibold mt-2">
          <span className="counter-number">{count}</span>
          <span className="counter-suffix text-xl">+</span>
        </div>
      </div>
    );
  };

  Counter.propTypes = {
    title: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    duration: PropTypes.number.isRequired,
    id: PropTypes.number.isRequired,
    index: PropTypes.number.isRequired,
  };

  const handleSave = () => {
    if (selectedCounter) {
      if (!selectedCounter.title || !Number.isFinite(selectedCounter.value)) {
        toast.error("Please provide a valid title and numeric value.");
        return;
      }
      axios
        .put(`${API_BASE_URL}/counters/${selectedCounter.id}`, selectedCounter)
        .then(() => {
          toast.success("Counter updated successfully!");
          fetchCounters();
          setIsModalOpen(false);
        })
        .catch(() => {
          toast.error("Failed to update counter.");
        });
    }
  };

  return (
    <section className="counter-section p-6">
      <div className="container mx-auto">
        <div className="flex flex-wrap justify-center gap-4">
          {counters.map((counter, idx) => (
            <div key={counter.id} className="w-full sm:w-[calc(33.33%-1rem)] lg:w-[calc(25%-1rem)] xl:w-[calc(16.66%-1rem)] min-w-[180px]">
              <Counter
                title={counter.title}
                value={counter.value}
                duration={counter.duration}
                id={counter.id}
                index={idx}
              />
            </div>
          ))}

          <div
            className="w-full sm:w-[calc(33.33%-1rem)] lg:w-[calc(25%-1rem)] xl:w-[calc(16.66%-1rem)] min-w-[180px] counter-box p-4 bg-dashed border-2 border-dashed border-gray-300 rounded flex flex-col items-center justify-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-all min-h-[120px]"
            onClick={() => setIsAddModalOpen(true)}
          >
            <div className="text-4xl text-gray-400 group-hover:text-blue-500">+</div>
            <div className="text-sm font-medium text-gray-500 mt-2">Add New Counter</div>
          </div>
        </div>
      </div>

      {isModalOpen && selectedCounter && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold">Edit Counter</h2>
              <button
                className="text-2xl hover:text-red-200"
                onClick={() => setIsModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Title
                <input
                  type="text"
                  className="mt-1 block w-full border border-blue-400 bg-white text-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCounter.title}
                  onChange={(e) =>
                    setSelectedCounter((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Value
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full border border-blue-400 bg-white text-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={selectedCounter.value}
                  onChange={(e) =>
                    setSelectedCounter((prev) => ({
                      ...prev,
                      value: e.target.value === '' ? '' : Number(e.target.value),
                    }))
                  }
                />
              </label>
              <div className="pt-4">
                <button
                  className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg ${(!selectedCounter.title || !Number.isFinite(selectedCounter.value)) ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                  disabled={!selectedCounter.title || !Number.isFinite(selectedCounter.value)}
                  onClick={handleSave}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setIsAddModalOpen(false)}
        >
          <div
            className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <h2 className="text-lg font-bold">Add New Counter</h2>
              <button
                className="text-2xl hover:text-red-200"
                onClick={() => setIsAddModalOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="px-6 py-6 space-y-4">
              <label className="block text-sm font-semibold text-gray-700">
                Title
                <input
                  type="text"
                  className="mt-1 block w-full border border-blue-400 bg-white text-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newCounter.title}
                  onChange={(e) =>
                    setNewCounter((prev) => ({
                      ...prev,
                      title: e.target.value,
                    }))
                  }
                />
              </label>
              <label className="block text-sm font-semibold text-gray-700">
                Value
                <input
                  type="number"
                  min="0"
                  className="mt-1 block w-full border border-blue-400 bg-white text-black rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newCounter.value}
                  onChange={(e) =>
                    setNewCounter((prev) => ({
                      ...prev,
                      value: e.target.value === '' ? 0 : Number(e.target.value),
                    }))
                  }
                />
              </label>
              <div className="pt-4">
                <button
                  className={`w-full py-3 rounded-xl text-white font-bold transition-all shadow-lg ${!newCounter.title ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'}`}
                  disabled={!newCounter.title}
                  onClick={handleAddCounter}
                >
                  Add Counter
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default Admin_CounterSection;
