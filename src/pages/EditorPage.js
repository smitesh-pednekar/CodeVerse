import React, { useState, useRef, useEffect } from "react";
import { Navigate, useLocation, useNavigate, useParams } from "react-router-dom";
import { Code2, Copy, LogOut, Play, Send, Users, MessageSquare, Terminal } from "lucide-react";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { toast } from "react-hot-toast";
import axios from "axios";

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const reactNavigator = useNavigate();
  const { roomId } = useParams();
  const [clients, setClients] = useState([]);
  const [activeTab, setActiveTab] = useState('input');
  const [isChatOpen, setIsChatOpen] = useState(true);

  useEffect(() => {
    const init = async () => {
      socketRef.current = await initSocket();

      socketRef.current.on("connect_error", (err) => handleErrors(err));
      socketRef.current.on("connect_failed", (err) => handleErrors(err));

      function handleErrors(e) {
        console.log("socket error", e);
        toast.error("Socket connection failed, try again later.");
        reactNavigator("/");
      }

      socketRef.current.emit(ACTIONS.JOIN, {
        roomId,
        username: location.state?.username,
      });

      socketRef.current.on(
        ACTIONS.JOINED,
        ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the room.`);
            console.log(`${username} joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        }
      );

      socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
        toast.success(`${username} left the room.`);
        setClients((prev) => {
          return prev.filter((client) => client.socketId !== socketId);
        });
      });

      socketRef.current.on(ACTIONS.SEND_MESSAGE, ({ message }) => {
        const chatWindow = document.getElementById("chatWindow");
        if (chatWindow) {
          var currText = chatWindow.value;
          currText += message;
          chatWindow.value = currText;
          chatWindow.scrollTop = chatWindow.scrollHeight;
        }
      });
    };
    init();
    return () => {
      socketRef.current?.off(ACTIONS.JOINED);
      socketRef.current?.off(ACTIONS.DISCONNECTED);
      socketRef.current?.off(ACTIONS.SEND_MESSAGE);
      socketRef.current?.disconnect();
    };
  }, []);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID has been copied to your clipboard");
    } catch (err) {
      toast.error("Could not copy the room id");
      console.error(err);
    }
  };

  const leaveRoom = () => {
    reactNavigator("/");
  };

  const inputClicked = () => {
    setActiveTab('input');
    const inputArea = document.getElementById("input");
    if (inputArea) {
      inputArea.placeholder = "Enter your input here";
      inputArea.value = "";
      inputArea.disabled = false;
    }
  };

  const outputClicked = () => {
    setActiveTab('output');
    const inputArea = document.getElementById("input");
    if (inputArea) {
      inputArea.placeholder = "Your output will appear here, Click 'Run code' to see it";
      inputArea.value = "";
      inputArea.disabled = true;
    }
  };

  const runCode = () => {
    const lang = document.getElementById("languageOptions")?.value;
    const input = document.getElementById("input")?.value;
    const code = codeRef.current;

    if (!lang || !code) return;

    toast.loading("Running Code....");

    const data = {
      source_code: code,
      language_id: parseInt(lang),
      stdin: input,
    };

    const options = {
      method: "POST",
      url: "https://judge029.p.rapidapi.com/submissions",
      headers: {
        "content-type": "application/json",
        "X-RapidAPI-Key": "a52ee53b55msh54c87a8c6f3fc4fp112c59jsn6d15c8df96d0",
        "X-RapidAPI-Host": "judge029.p.rapidapi.com"
      },
      params: {
        base64_encoded: "false",
        wait: "true",
        fields: "*"
      },
      data: data,
    };

    axios
      .request(options)
      .then(function (response) {
        let output = "";
        
        if (response.data.stdout) {
          output = response.data.stdout;
        } else if (response.data.stderr) {
          output = response.data.stderr;
        } else if (response.data.compile_output) {
          output = response.data.compile_output;
        } else if (response.data.message) {
          output = response.data.message;
        }
        
        outputClicked();
        const inputArea = document.getElementById("input");
        if (inputArea) {
          inputArea.value = output || "No output generated";
        }
        toast.dismiss();
        toast.success("Code compilation complete");
      })
      .catch(function (error) {
        console.error("API Error:", error);
        toast.dismiss();
        toast.error("Code compilation unsuccessful");
        const inputArea = document.getElementById("input");
        if (inputArea) {
          inputArea.value = "Something went wrong. Please check your code and input.";
        }
      });
  };

  const sendMessage = () => {
    const inputBox = document.getElementById("inputBox");
    if (!inputBox?.value) return;
    
    var message = `> ${location.state.username}:\n${inputBox.value}\n`;
    const chatWindow = document.getElementById("chatWindow");
    if (chatWindow) {
      var currText = chatWindow.value;
      currText += message;
      chatWindow.value = currText;
      chatWindow.scrollTop = chatWindow.scrollHeight;
    }
    inputBox.value = "";
    socketRef.current?.emit(ACTIONS.SEND_MESSAGE, { roomId, message });
  };

  const handleInputEnter = (key) => {
    if (key.code === "Enter") {
      sendMessage();
    }
  };

  if (!location.state) {
    return <Navigate to="/" />;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-56 bg-gray-900 flex flex-col border-r border-gray-700/50">
        <div className="p-4 border-b border-gray-700/50">
          <div className="flex items-center space-x-2">
            <Code2 className="w-6 h-6 text-blue-400" />
            <h1 className="text-xl font-bold text-white">CodeVerse</h1>
          </div>
        </div>

        <div className="flex-1 p-4 space-y-6 overflow-y-auto">
          {/* Connected Users */}
          <div>
            <h3 className="text-gray-400 text-sm font-medium mb-3 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Connected ({clients.length})
            </h3>
            <div className="space-y-2">
              {clients.map((client) => (
                <Client key={client.socketId} username={client.username} />
              ))}
            </div>
          </div>

          {/* Language Selector */}
          <div>
            <label className="text-gray-400 text-sm block mb-2">Language</label>
            <select
              id="languageOptions"
              className="w-full bg-gray-800 text-white rounded-lg p-2 border border-gray-700 hover:border-blue-500 transition-colors"
              defaultValue="71"
            >
              <option value="71">Python3</option>
              <option value="50">C</option>
              <option value="54">C++</option>
              <option value="62">Java</option>
              <option value="63">JavaScript</option>
              <option value="74">TypeScript</option>
              <option value="51">C#</option>
              <option value="68">PHP</option>
              <option value="72">Ruby</option>
              <option value="73">Rust</option>
              <option value="60">Go</option>
              <option value="78">Kotlin</option>
              <option value="83">Swift</option>
            </select>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-4 space-y-2 border-t border-gray-700/50">
          <button
            onClick={runCode}
            className="w-full flex items-center justify-center space-x-2 bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-lg transition-colors"
          >
            <Play className="w-4 h-4" />
            <span>Run Code</span>
          </button>

          <button
            onClick={copyRoomId}
            className="w-full flex items-center justify-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
          >
            <Copy className="w-4 h-4" />
            <span>Copy Room ID</span>
          </button>

          <button
            onClick={leaveRoom}
            className="w-full flex items-center justify-center space-x-2 bg-red-600/20 hover:bg-red-600/30 text-red-500 p-2 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span>Leave Room</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Editor Section with Header */}
        <div className="flex-1 bg-gray-900 flex flex-col">
          {/* macOS-style Header */}
          <div className="h-8 bg-[#1e1e1e] flex items-center px-3 border-b border-gray-700/50">
  <div className="flex space-x-2">
    <div className="w-3 h-3 rounded-full bg-[#ff5f56] ring-1 ring-[#ff5f56]/50 shadow-lg" />
    <div className="w-3 h-3 rounded-full bg-[#ffbd2e] ring-1 ring-[#ffbd2e]/50 shadow-lg" />
    <div className="w-3 h-3 rounded-full bg-[#27c93f] ring-1 ring-[#27c93f]/50 shadow-lg" />
  </div>
</div>
          </div>
        {/* Editor Section */}
        <div className="flex-1 bg-gray-900">
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => {
              codeRef.current = code;
            }}
          />
        </div>

        {/* Input/Output Section */}
        <div className="h-52 bg-gray-900 border-t border-gray-700/50">
          <div className="flex border-b border-gray-700/50">
            <button
              onClick={inputClicked}
              className={`px-6 py-3 flex items-center space-x-2 ${
                activeTab === 'input'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Input</span>
            </button>
            <button
              onClick={outputClicked}
              className={`px-6 py-3 flex items-center space-x-2 ${
                activeTab === 'output'
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-gray-800/50'
                  : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/30'
              }`}
            >
              <Terminal className="w-4 h-4" />
              <span>Output</span>
            </button>
          </div>
          <textarea
            id="input"
            className="w-full h-36 bg-gray-900 text-gray-300 p-4 resize-none focus:outline-none font-mono"
            placeholder="Enter your input here"
          />
        </div>
      </div>

      {/* Right Chat Panel */}
      <div className={`w-80 bg-gray-900 border-l border-gray-700/50 flex flex-col transition-all duration-300 ${isChatOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-gray-700/50 flex justify-between items-center">
          <div className="flex items-center space-x-2 text-gray-300">
            <MessageSquare className="w-4 h-4" />
            <span>Chat</span>
          </div>
          <button
            onClick={() => setIsChatOpen(false)}
            className="text-gray-500 hover:text-gray-400"
          >
            ×
          </button>
        </div>
        <div className="flex-1 p-4">
          <textarea
            id="chatWindow"
            className="w-full h-full bg-gray-800 text-gray-300 p-4 rounded-lg resize-none focus:outline-none"
            placeholder="Chat messages will appear here"
            disabled
          />
        </div>
        <div className="p-4 border-t border-gray-700/50">
          <div className="flex space-x-2">
            <input
              id="inputBox"
              type="text"
              className="flex-1 bg-gray-800 text-white rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type your message..."
              onKeyUp={handleInputEnter}
            />
            <button
              onClick={sendMessage}
              className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Chat Toggle Button (shown when chat is closed) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="fixed right-4 bottom-4 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-lg transition-colors"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default EditorPage;