'use client'

import React, { useState } from "react"
import { v4 as uuidV4 } from "uuid"
import { Code,Code2,Users, ArrowRight } from 'lucide-react'
import Button from './ui/Button';
import Input from './ui/Input';
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Home = () => {
  const navigate = useNavigate();
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const createNewRoom = (e) => {
    e.preventDefault();
    const id = uuidV4();
    setRoomId(id);
    toast.success("Created a new room");
  };

  const joinRoom = () => {
    if (!username || !roomId) {
      toast.error("ROOM ID & username are required");
      return;
    }
    navigate(`/editor/${roomId}`, {
      state: {
        username,
      },
    });
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") {
      joinRoom();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex flex-col items-center justify-center p-4">
    <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="p-6 sm:p-8">
        <div className="flex items-center justify-center mb-8">
          <Code2 className="h-12 w-12 text-blue-600" />
          <h1 className="text-3xl font-bold text-gray-900 ml-2">CodeVerse</h1>
        </div>
        <h2 className="text-xl font-semibold text-gray-700 mb-6 text-center">
          Real-time Collaborative Coding
        </h2>
        <div className="space-y-4">
          <Input
            type="text"
            placeholder="Room ID"
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            onKeyUp={handleInputEnter}
          />
          <Input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            onKeyUp={handleInputEnter}
          />
          <Button className="w-full" onClick={joinRoom}>
            <Users className="mr-2 h-4 w-4" /> Join Room
          </Button>
        </div>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an invite? Create a{" "}
            <a
              href="#"
              onClick={createNewRoom}
              className="text-blue-600 hover:underline font-medium"
            >
              new room
            </a>
          </p>
        </div>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
        <a
          href="#"
          className="flex items-center justify-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
        >
          Learn more about CodeVerse
          <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </div>
    </div>
    <footer className="mt-8 text-center text-gray-400 text-sm">
      <p>Made with ❤️ by Smitesh</p>
    </footer>
  </div>
  );
};

export default Home;