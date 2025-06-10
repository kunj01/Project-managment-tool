import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import CreateEventModal from "./CreateEventModal";
import { config } from "../config";
import { getAuthHeader, formatDate, formatTime } from "../utils";

function Events() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  console.log(
    "Events component render. user:",
    JSON.stringify(user, null, 2),
    "authLoading:",
    authLoading
  );

  useEffect(() => {
    if (!authLoading && user) {
      const fetchEvents = async () => {
        try {
          const response = await axios.get(config.EVENTS.LIST, {
            headers: getAuthHeader(),
          });
          setEvents(response.data);
          setError("");
        } catch (err) {
          setError("Error fetching events");
          console.error("Error fetching events:", err);
        }
      };
      fetchEvents();
    } else if (!authLoading && !user) {
      // If auth is not loading and no user, do nothing (no local loading to set)
    }
  }, [authLoading, user]);

  const handleCreateEvent = async (eventData) => {
    try {
      await axios.post(config.EVENTS.CREATE, eventData, {
        headers: getAuthHeader(),
      });
      if (user) {
        const response = await axios.get(config.EVENTS.LIST, {
          headers: getAuthHeader(),
        });
        setEvents(response.data);
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      setError("Error creating event");
      console.error("Error creating event:", err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    try {
      await axios.delete(config.EVENTS.DELETE(eventId), {
        headers: getAuthHeader(),
      });
      if (user) {
        const response = await axios.get(config.EVENTS.LIST, {
          headers: getAuthHeader(),
        });
        setEvents(response.data);
      }
    } catch (err) {
      setError("Error deleting event");
      console.error("Error deleting event:", err);
    }
  };

  const handleRSVP = async (eventId, status) => {
    try {
      await axios.post(
        config.EVENTS.RSVP(eventId),
        { status },
        { headers: getAuthHeader() }
      );
      if (user) {
        const response = await axios.get(config.EVENTS.LIST, {
          headers: getAuthHeader(),
        });
        setEvents(response.data);
      }
    } catch (err) {
      setError("Error updating RSVP status");
      console.error("Error updating RSVP status:", err);
    }
  };

  if (authLoading) {
    return <div className="text-center">Loading events...</div>;
  }

  if (!user) {
    console.log("Events: User is null after loading, displaying error.");
    return (
      <div className="text-center text-red-500">
        Error: User not authenticated.
      </div>
    );
  }

  console.log("Events: Rendering content. user.role:", user.role);
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Events</h2>
        {user && user.role === "event-organizer" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700"
          >
            Create Event
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <div
            key={event._id}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900">
                {event.title}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{event.description}</p>
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Date:</span>{" "}
                  {formatDate(event.date)}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Time:</span>{" "}
                  {formatTime(event.date)}
                </p>
                <p className="text-sm text-gray-500">
                  <span className="font-medium">Location:</span>{" "}
                  {event.location}
                </p>
              </div>

              <div className="mt-4 space-y-2">
                {user &&
                user.role === "event-organizer" &&
                event.createdBy === user.id ? (
                  <button
                    onClick={() => handleDeleteEvent(event._id)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700"
                  >
                    Delete Event
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    {["attending", "not-attending", "maybe"].map((status) => (
                      <button
                        key={status}
                        onClick={() => handleRSVP(event._id, status)}
                        className={`flex-1 px-4 py-2 text-sm font-medium rounded-md ${
                          event.rsvps.find((r) => r.user === user.id)
                            ?.status === status
                            ? "bg-indigo-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {status
                          .split("-")
                          .map(
                            (word) =>
                              word.charAt(0).toUpperCase() + word.slice(1)
                          )
                          .join(" ")}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}

export default Events;
