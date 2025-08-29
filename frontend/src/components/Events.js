import React, { useState, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useAuth } from "../contexts/AuthContexts";
import CreateEventModal from "./CreateEventModal";
import { config } from "../config";
import { getAuthHeader, formatDate, formatTime } from "../utils";

function Events() {
  const { user, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

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
          toast.error("Failed to fetch events");
          console.error("Error fetching events:", err);
        }
      };
      fetchEvents();
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
      toast.success("Event created successfully!");
    } catch (err) {
      setError("Error creating event");
      toast.error(err.response?.data?.message || "Failed to create event");
      console.error("Error creating event:", err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    if (!window.confirm("Are you sure you want to delete this event? This action cannot be undone.")) {
      return;
    }

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
      toast.success("Event deleted successfully!");
    } catch (err) {
      setError("Error deleting event");
      toast.error(err.response?.data?.message || "Failed to delete event");
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
      toast.success(`RSVP updated to ${status}`);
    } catch (err) {
      setError("Error updating RSVP status");
      toast.error(err.response?.data?.message || "Failed to update RSVP");
      console.error("Error updating RSVP status:", err);
    }
  };

  if (authLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-gray-300">Loading events...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <p className="text-red-300">Error: User not authenticated.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white flex items-center">
          <svg className="w-6 h-6 mr-2 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Events
        </h2>
        {user && user.role === "event-organizer" && (
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:from-purple-700 hover:to-pink-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 transition-all duration-200 shadow-lg"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Event
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-900 border border-red-700 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-300 text-sm">{error}</span>
          </div>
        </div>
      )}

      {events.length === 0 ? (
        <div className="text-center py-12">
          <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-gray-400 text-lg">No events found</p>
          <p className="text-gray-500 text-sm mt-2">
            {user?.role === "event-organizer" 
              ? "Create your first event to get started" 
              : "No events are currently available"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event._id}
              className="bg-gray-700 border border-gray-600 rounded-xl p-6 hover:bg-gray-650 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold text-white mb-2">
                  {event.title}
                </h3>
                {event.isPublic && (
                  <span className="bg-green-600 text-green-100 text-xs px-2 py-1 rounded-full">
                    Public
                  </span>
                )}
              </div>
              
              <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                {event.description}
              </p>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {formatDate(event.eventDate)}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(event.eventDate)}
                </div>
                <div className="flex items-center text-sm text-gray-400">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {event.location}
                </div>
              </div>

              <div className="space-y-2">
                {user &&
                user.role === "event-organizer" &&
                event.createdBy === user.id ? (
                  <button
                    onClick={() => handleDeleteEvent(event._id)}
                    className="w-full inline-flex justify-center items-center px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete Event
                  </button>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    {["yes", "maybe", "no"].map((status) => {
                      const currentRSVP = event.attendees?.find((a) => a.email === user.email);
                      const isSelected = currentRSVP?.status === status;
                      
                      const getButtonStyle = (status, isSelected) => {
                        if (isSelected) {
                          switch (status) {
                            case "yes":
                              return "bg-green-600 text-white border-green-500";
                            case "maybe":
                              return "bg-yellow-600 text-white border-yellow-500";
                            case "no":
                              return "bg-red-600 text-white border-red-500";
                            default:
                              return "bg-gray-600 text-white border-gray-500";
                          }
                        }
                        return "bg-gray-700 text-gray-300 border-gray-600 hover:bg-gray-600";
                      };

                      const getButtonLabel = (status) => {
                        switch (status) {
                          case "yes":
                            return "Going";
                          case "maybe":
                            return "Maybe";
                          case "no":
                            return "Not Going";
                          default:
                            return status;
                        }
                      };

                      return (
                        <button
                          key={status}
                          onClick={() => handleRSVP(event._id, status)}
                          className={`px-3 py-2 text-xs font-medium rounded-lg border transition-colors ${getButtonStyle(status, isSelected)}`}
                        >
                          {getButtonLabel(status)}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateEventModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </div>
  );
}

export default Events;