import React, { useState, useEffect, useRef } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  AlertCircle, 
  Music, 
  Save, 
  Edit, 
  HelpCircle, 
  CheckCircle, 
  Trash2, 
  Download, 
  Search, 
  Filter,
  X,
  ArrowUpDown,
  RefreshCw
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Define all possible scales and their note patterns (semitones)
const SCALES = {
  'Major': [0, 2, 4, 5, 7, 9, 11],
  'Natural Minor': [0, 2, 3, 5, 7, 8, 10],
  'Harmonic Minor': [0, 2, 3, 5, 7, 8, 11],
  'Melodic Minor': [0, 2, 3, 5, 7, 9, 11],
  'Dorian': [0, 2, 3, 5, 7, 9, 10],
  'Phrygian': [0, 1, 3, 5, 7, 8, 10],
  'Lydian': [0, 2, 4, 6, 7, 9, 11],
  'Mixolydian': [0, 2, 4, 5, 7, 9, 10]
};

// All possible musical notes
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

const MusicScaleFinder = () => {
  const [notes, setNotes] = useState(Array(7).fill('C'));
  const [foundScale, setFoundScale] = useState(null);
  const [savedScales, setSavedScales] = useState([]);
  const [songName, setSongName] = useState('');
  const [isEditing, setIsEditing] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBy, setFilterBy] = useState('all');
  const [sortDirection, setSortDirection] = useState('asc');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [scaleToDelete, setScaleToDelete] = useState(null);
  
  const fileDownloadRef = useRef(null);

  // Function to convert notes to indices
  const notesToIndices = (noteArray) => {
    return noteArray.map(note => NOTES.indexOf(note));
  };

  // Function to normalize scale for comparison
  const normalizeScale = (indices) => {
    const firstIndex = indices[0];
    return indices.map(index => (index - firstIndex + 12) % 12);
  };

  const findScale = () => {
    // Convert notes to indices
    const indices = notesToIndices(notes);
    
    // Normalize the scale
    const normalizedScale = normalizeScale(indices);
    
    // Find matching scales
    const matchedScales = [];
    
    Object.entries(SCALES).forEach(([scaleName, pattern]) => {
      if (pattern.every((val, idx) => val === normalizedScale[idx])) {
        const rootNote = notes[0];
        matchedScales.push(`${rootNote} ${scaleName}`);
      }
    });
    
    setFoundScale(matchedScales.length > 0 
      ? matchedScales 
      : ['No matching scale found']
    );
  };

  const saveScale = () => {
    if (!songName.trim()) return;
    
    const scaleToSave = {
      id: Date.now(),
      songName: songName,
      notes: [...notes],
      scale: foundScale ? [...foundScale] : []
    };
    
    setSavedScales([...savedScales, scaleToSave]);
    setSongName('');
    showSuccessNotification('Saved successfully!');
  };

  const updateSavedScale = () => {
    if (!isEditing) return;
    
    const updatedScales = savedScales.map(item => 
      item.id === isEditing.id 
        ? {...item, songName: songName, notes: [...notes], scale: foundScale ? [...foundScale] : []} 
        : item
    );
    
    setSavedScales(updatedScales);
    setSongName('');
    setIsEditing(null);
    showSuccessNotification('Updated successfully!');
  };

  const showSuccessNotification = (message) => {
    setSuccessMessage(message);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const editSavedScale = (scale) => {
    setIsEditing(scale);
    setSongName(scale.songName);
    setNotes([...scale.notes]);
    setFoundScale([...scale.scale]);
  };

  const confirmDeleteScale = (scale, e) => {
    e.stopPropagation();
    setScaleToDelete(scale);
    setShowConfirmDelete(true);
  };

  const deleteSavedScale = () => {
    if (!scaleToDelete) return;
    
    const filteredScales = savedScales.filter(item => item.id !== scaleToDelete.id);
    setSavedScales(filteredScales);
    setShowConfirmDelete(false);
    showSuccessNotification('Deleted successfully!');
    
    // If we're currently editing the deleted scale, reset editing state
    if (isEditing && isEditing.id === scaleToDelete.id) {
      setIsEditing(null);
      setSongName('');
      setNotes(Array(7).fill('C'));
      setFoundScale(null);
    }
  };

  const exportToCSV = () => {
    if (savedScales.length === 0) return;
    
    // Create CSV headers
    let csvContent = "Song Name,Notes,Scale\n";
    
    // Add data rows
    savedScales.forEach(scale => {
      const songName = `"${scale.songName}"`;  // Escape quotes in song names
      const notes = `"${scale.notes.join(' - ')}"`;
      const scaleType = `"${scale.scale.join(' / ')}"`;
      
      csvContent += `${songName},${notes},${scaleType}\n`;
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    // Trigger download
    const link = fileDownloadRef.current;
    link.setAttribute('href', url);
    link.setAttribute('download', 'saved_scales.csv');
    link.click();
  };

  const resetForm = () => {
    setNotes(Array(7).fill('C'));
    setFoundScale(null);
    setSongName('');
    setIsEditing(null);
  };

  const getFilteredScales = () => {
    let filtered = [...savedScales];
    
    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(scale => 
        scale.songName.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Apply scale type filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(scale => 
        scale.scale.some(s => s.includes(filterBy))
      );
    }
    
    // Apply sorting
    filtered.sort((a, b) => {
      if (sortDirection === 'asc') {
        return a.songName.localeCompare(b.songName);
      } else {
        return b.songName.localeCompare(a.songName);
      }
    });
    
    return filtered;
  };

  const toggleSortDirection = () => {
    setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  // Populate scale type options for filter
  const getScaleTypes = () => {
    const types = new Set();
    
    savedScales.forEach(scale => {
      scale.scale.forEach(s => {
        if (s !== 'No matching scale found') {
          const parts = s.split(' ');
          // Skip the root note, join the rest for scale type
          const scaleType = parts.slice(1).join(' ');
          types.add(scaleType);
        }
      });
    });
    
    return Array.from(types);
  };

  useEffect(() => {
    if (isEditing) {
      findScale();
    }
  }, [notes]);

  // Get filtered scales for display
  const filteredScales = getFilteredScales();
  const scaleTypes = getScaleTypes();

  return (
    <div 
      className="bg-gray-900 min-h-screen p-4 text-white"
      style={{ 
        fontFamily: "'Inter', 'Segoe UI', 'Roboto', sans-serif",
        fontWeight: 600,
        backgroundImage: "linear-gradient(to bottom, #0f172a, #111827)",
      }}
    >
      <Card className="w-full max-w-xl mx-auto mt-4 bg-gray-800 border-blue-400 border-2 shadow-xl shadow-blue-500/30 overflow-hidden">
        <CardHeader className="bg-gray-900 rounded-t-lg border-b-2 border-blue-500 p-4">
          <div className="flex justify-between items-center">
            <CardTitle className="text-blue-300 flex items-center text-xl font-extrabold tracking-wide">
              <Music className="mr-2 text-blue-300" size={28} />
              SCALE FINDER
            </CardTitle>
            <div className="flex gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="bg-transparent hover:bg-blue-900/30 rounded-full p-2">
                    <HelpCircle className="text-blue-300 hover:text-blue-100" size={22} />
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 text-white border-blue-500 border-2 font-medium max-w-md">
                  <DialogHeader>
                    <DialogTitle className="text-blue-300 text-xl font-bold">How to Use</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-3 text-gray-100 p-2">
                    <p className="flex items-center">
                      <span className="bg-blue-500 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">1</span> 
                      Select 7 notes that make up your scale
                    </p>
                    <p className="flex items-center">
                      <span className="bg-blue-500 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">2</span> 
                      Click "Find Scale" to identify the musical scale
                    </p>
                    <p className="flex items-center">
                      <span className="bg-blue-500 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">3</span> 
                      Enter a song name to save your scale
                    </p>
                    <p className="flex items-center">
                      <span className="bg-blue-500 text-xs rounded-full w-5 h-5 flex items-center justify-center mr-2">4</span> 
                      You can search, edit, or export your saved scales
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
              <Button 
                onClick={resetForm} 
                variant="ghost" 
                size="sm" 
                title="Reset Form" 
                className="bg-transparent hover:bg-blue-900/30 rounded-full p-2"
              >
                <RefreshCw className="text-blue-300 hover:text-blue-100" size={22} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-7 gap-2">
            {notes.map((note, index) => (
              <div key={index} className="flex flex-col items-center">
                <span className="text-xs mb-1 text-blue-300 font-bold">Note {index + 1}</span>
                <Select
                  value={note}
                  onValueChange={(value) => {
                    const newNotes = [...notes];
                    newNotes[index] = value;
                    setNotes(newNotes);
                  }}
                >
                  <SelectTrigger className="w-full bg-gray-700 border-blue-400 hover:border-blue-300 focus:ring-blue-500 text-white font-bold shadow-md shadow-blue-500/10">
                    <SelectValue placeholder={note} />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-100 border-blue-400 font-bold">
                    {NOTES.map(note => (
                      <SelectItem key={note} value={note} className="text-black hover:bg-blue-100 focus:bg-blue-600 focus:text-white">{note}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
          
          <Button 
            onClick={findScale} 
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg py-6 shadow-lg shadow-blue-600/30 transition-all duration-200 transform hover:scale-102"
          >
            Find Scale
          </Button>
          
          {foundScale && (
            <div className="mt-4 bg-gray-900 p-4 rounded-lg shadow-inner border-2 border-blue-500">
              <h3 className="font-bold text-blue-300 mb-3 flex items-center text-lg">
                <AlertCircle className="mr-2" size={20} />
                Found Scale(s):
              </h3>
              {foundScale.map((scale, index) => (
                <p key={index} className="text-green-300 text-lg font-bold py-1">{scale}</p>
              ))}
            </div>
          )}
          
          <div className="flex space-x-2">
            <Input
              value={songName}
              onChange={(e) => setSongName(e.target.value)}
              placeholder="Enter song name"
              className="flex-grow bg-gray-700 border-blue-400 text-white placeholder-gray-300 font-medium text-lg py-6 shadow-inner"
            />
            {isEditing ? (
              <Button 
                onClick={updateSavedScale} 
                className="bg-green-600 hover:bg-green-500 px-4 shadow-lg shadow-green-600/20"
                aria-label="Update scale"
              >
                <Edit size={20} />
              </Button>
            ) : (
              <Button 
                onClick={saveScale} 
                className="bg-blue-600 hover:bg-blue-500 px-4 shadow-lg shadow-blue-600/20"
                aria-label="Save scale"
              >
                <Save size={20} />
              </Button>
            )}
          </div>
          
          {showSuccess && (
            <div className="flex items-center justify-between text-green-300 bg-gray-900 p-3 rounded border border-green-500 shadow-lg animate-fadeIn">
              <div className="flex items-center">
                <CheckCircle size={20} className="mr-2" />
                <span className="font-bold">{successMessage}</span>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setShowSuccess(false)} className="text-green-300 hover:text-green-100 p-1">
                <X size={16} />
              </Button>
            </div>
          )}
          
          <Tabs defaultValue="list" className="w-full">
            <TabsList className="w-full bg-gray-900 mb-4">
              <TabsTrigger value="list" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Saved Songs
              </TabsTrigger>
              <TabsTrigger value="search" className="flex-1 data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                Search & Filter
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="list" className="mt-0">
              {savedScales.length > 0 ? (
                <>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="font-bold text-blue-300 text-lg">Saved Songs</h3>
                    <Button 
                      onClick={exportToCSV} 
                      variant="outline" 
                      size="sm" 
                      className="text-blue-300 border-blue-500 hover:bg-blue-900/30"
                    >
                      <Download size={16} className="mr-1" /> Export CSV
                    </Button>
                    <a ref={fileDownloadRef} style={{ display: 'none' }}></a>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 scrollbar">
                    {savedScales.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-gray-900 p-3 rounded flex justify-between items-center border border-blue-500 hover:bg-gray-700 cursor-pointer transition-colors duration-200"
                        onClick={() => editSavedScale(item)}
                      >
                        <div>
                          <div className="font-bold text-white">{item.songName}</div>
                          <div className="text-sm text-blue-300 font-medium">{item.notes.join(' - ')}</div>
                          <div className="text-xs text-green-300 mt-1">{item.scale.join(' / ')}</div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => editSavedScale(item)} 
                            className="text-blue-300 hover:text-blue-100 hover:bg-blue-800/30 p-1"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => confirmDeleteScale(item, e)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center p-6 bg-gray-900/50 rounded border border-blue-500/30">
                  <p className="text-gray-300">No saved songs yet. Save a scale to see it here.</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="search" className="mt-0">
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <div className="relative flex-grow">
                    <Input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by song name..."
                      className="w-full bg-gray-700 border-blue-400 text-white pl-10 py-6"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                  </div>
                  
                  <Select value={filterBy} onValueChange={setFilterBy}>
                    <SelectTrigger className="w-40 bg-gray-700 border-blue-400 text-white">
                      <SelectValue placeholder="Filter by" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-100 text-black">
                      <SelectItem value="all">All Scales</SelectItem>
                      {scaleTypes.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    onClick={toggleSortDirection} 
                    variant="outline" 
                    size="icon" 
                    className="border-blue-400 hover:bg-blue-900/30"
                    aria-label={sortDirection === 'asc' ? "Sort descending" : "Sort ascending"}
                  >
                    <ArrowUpDown className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
                  {filteredScales.length > 0 ? (
                    filteredScales.map((item) => (
                      <div 
                        key={item.id} 
                        className="bg-gray-900 p-3 rounded flex justify-between items-center border border-blue-500 hover:bg-gray-700 cursor-pointer"
                        onClick={() => editSavedScale(item)}
                      >
                        <div>
                          <div className="font-bold text-white">{item.songName}</div>
                          <div className="text-sm text-blue-300 font-medium">{item.notes.join(' - ')}</div>
                          <div className="text-xs text-green-300 mt-1">{item.scale.join(' / ')}</div>
                        </div>
                        <div className="flex space-x-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => editSavedScale(item)} 
                            className="text-blue-300 hover:text-blue-100 hover:bg-blue-800/30 p-1"
                          >
                            <Edit size={16} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={(e) => confirmDeleteScale(item, e)} 
                            className="text-red-400 hover:text-red-300 hover:bg-red-900/30 p-1"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center p-6 bg-gray-900/50 rounded border border-blue-500/30">
                      <p className="text-gray-300">No matching songs found.</p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog for Delete */}
      <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
        <DialogContent className="bg-gray-800 text-white border-red-500 border-2 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-red-300 text-lg">Confirm Deletion</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete "{scaleToDelete?.songName}"?</p>
            <p className="text-sm text-gray-300 mt-2">This action cannot be undone.</p>
          </div>
          <div className="flex justify-end space-x-2 mt-2">
            <Button 
              variant="outline" 
              onClick={() => setShowConfirmDelete(false)}
              className="border-gray-500 text-gray-300 hover:bg-gray-700"
            >
              Cancel
            </Button>
            <Button 
              onClick={deleteSavedScale}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      
      {/* CSS for custom scrollbar and animations */}
      <style jsx global>{`
        .scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        
        .scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
          border-radius: 10px;
        }
        
        .scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.5);
          border-radius: 10px;
        }
        
        .scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.8);
        }
        
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out forwards;
        }
        
        .hover\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
};

import React, { useState, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, push, onValue } from "firebase/database";

// 🔹 ตั้งค่า Firebase (นำ Config ของคุณมาใส่ตรงนี้)
const firebaseConfig = {
  apiKey: "AIzaSyBPWYw2rxDbvN3NkGmOjEOacCLo3FmvdL4",
  authDomain: "highhat-firebase.firebaseapp.com",
  projectId: "highhat-firebase",
  storageBucket: "highhat-firebase.firebasestorage.app",
  messagingSenderId: "890111093897",
  appId: "1:890111093897:web:2f748d79efdf1661932a58",
  measurementId: "G-QR94CHX8LK"
};

// 🔹 เชื่อมต่อ Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const App: React.FC = () => {
  const [text, setText] = useState("");
  const [messages, setMessages] = useState<string[]>([]);

  // 📌 โหลดข้อมูลจาก Firebase เรียลไทม์
  useEffect(() => {
    const messagesRef = ref(db, "messages");
    onValue(messagesRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        setMessages(Object.values(data));
      }
    });
  }, []);

  // 📌 ส่งข้อมูลไปยัง Firebase
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() !== "") {
      push(ref(db, "messages"), text); // บันทึกข้อมูลลง Firebase
      setText(""); // เคลียร์ช่องกรอก
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px", fontFamily: "Arial" }}>
      <h2>📢 ข้อความเรียลไทม์</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="พิมพ์ข้อความ..."
          style={{ padding: "10px", width: "60%", marginRight: "10px" }}
        />
        <button type="submit" style={{ padding: "10px 20px", cursor: "pointer" }}>
          ส่ง
        </button>
      </form>

      <div style={{ marginTop: "20px", textAlign: "left", maxWidth: "400px", margin: "20px auto" }}>
        <h3>📌 ข้อความล่าสุด:</h3>
        <ul style={{ listStyleType: "none", padding: 0 }}>
          {messages.map((msg, index) => (
            <li key={index} style={{ background: "#f3f3f3", padding: "10px", margin: "5px 0", borderRadius: "5px" }}>
              {msg}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default App;

