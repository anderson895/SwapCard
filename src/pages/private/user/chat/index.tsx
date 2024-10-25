/* eslint-disable @typescript-eslint/no-explicit-any */
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../db';
import useStore from '../../../../zustand/store/store';
import { selector } from '../../../../zustand/store/store.provider';

export const ChatPage: React.FC<{ conversationId: string }> = ({ conversationId }) => {
  const user = useStore(selector('user'));
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [otherUser, setOtherUser] = useState<any>(null);

  useEffect(() => {
    const messagesRef = collection(db, `conversations/${conversationId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const msgs = snapshot.docs.map(doc => doc.data());
      setMessages(msgs);

      // Determine the other user's ID
      const otherUserId = msgs.length > 0
        ? msgs[0].senderId === user.info?.uid ? msgs[1]?.senderId : msgs[0].senderId
        : null;

      if (otherUserId) {
        // Fetch the other user's profile data
        const otherUserDoc = await getDoc(doc(db, "users", otherUserId));
        if (otherUserDoc.exists()) {
          setOtherUser(otherUserDoc.data());
        }
      }
    });

    return () => unsubscribe();
  }, [conversationId, user.info?.uid]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    await addDoc(collection(db, `conversations/${conversationId}/messages`), {
      text: newMessage,
      senderId: user.info?.uid,
      timestamp: serverTimestamp(),
      displayName: user.info?.displayName
    });
    await updateDoc(doc(db, `conversations/${conversationId}`), {
      lastMessage: newMessage,
      lastMessageTimestamp: serverTimestamp(),
    });
    setNewMessage("");
  };

  return (
    <div className="flex flex-col h-full w-full max-w-md mx-auto border rounded-lg shadow-lg overflow-hidden">
      <header className="bg-blue-600 text-white p-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Chat</h2>
        {otherUser && (
          <Link to={`/Dashboard/User/Profile/${otherUser.uid}`} className="text-white underline">
            View Profile
          </Link>
        )}
      </header>
      <div className="flex-1 p-4 overflow-auto bg-gray-100">
        {messages.map((msg, index) => (
          <div key={index} className={`mb-2 ${msg.senderId === user.info?.uid ? 'text-right' : 'text-left'}`}>
            <div className={`inline-block p-2 rounded-lg ${msg.senderId === user.info?.uid ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}>
              <div className="font-semibold">{msg.senderId === user.info?.uid ? 'Me' : msg.displayName}</div>
              <div>{msg.text}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white p-4 border-t">
        <div className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-1 p-2 border rounded-l-lg"
          />
          <button
            onClick={handleSendMessage}
            className="bg-blue-500 text-white px-4 py-2 rounded-r-lg ml-2"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
};
