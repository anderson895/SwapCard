/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  where,
  onSnapshot,
  addDoc,
  serverTimestamp,
  updateDoc,
  doc,
  getDoc,
} from "firebase/firestore";
import { List, Avatar, Button, Input } from "antd";
import { FaArrowDown } from "react-icons/fa";
import { FiMessageCircle, FiMinus } from "react-icons/fi";
import useStore from "../../zustand/store/store";
import { selectChats, selector, setOpenChats } from "../../zustand/store/store.provider";
import { db } from "../../db";
import { IoMdClose } from "react-icons/io";
import dayjs from "dayjs"; // Add this import for date formatting

const { TextArea } = Input;

type Conversation = {
  id: string;
  participantIds: string[];
  lastMessage: string;
  lastMessageTimestamp: any;
};

type ParticipantInfo = {
  displayName: string;
  photoUrl: string;
};

export const ChatPageWithList: React.FC = () => {
  const user = useStore(selector("user"));
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [participantsMap, setParticipantsMap] = useState<
    Map<string, ParticipantInfo>
  >(new Map());
  const [receiverName, setReceiverName] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      // Fetch conversations
      const q = query(
        collection(db, "conversations"),
        where("participantIds", "array-contains", user.info?.uid)
      );

      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const convos = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            } as Conversation)
        );
        setConversations(convos);

        // Fetch participant information
        const namesMap = new Map<string, ParticipantInfo>();
        for (const convo of convos) {
          const participantIds = convo.participantIds.filter(
            (id) => id !== user?.uid
          );
          for (const id of participantIds) {
            if (!namesMap.has(id)) {
              const userDoc = await getDoc(doc(db, "users", id));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                namesMap.set(id, {
                  displayName: userData.displayName || "Unknown User",
                  photoUrl: userData.photoURL || "",
                });
              } else {
                namesMap.set(id, {
                  displayName: "Unknown User",
                  photoUrl: "",
                });
              }
            }
          }
        }
        setParticipantsMap(namesMap);
      });

      return () => unsubscribe();
    }
  }, [user]);

  useEffect(() => {
    if (user.conversationId) {
      const messagesRef = collection(
        db,
        `conversations/${user.conversationId}/messages`
      );
      const q = query(messagesRef, orderBy("timestamp", "asc"));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const msgs = snapshot.docs.map((doc) => doc.data());
        setMessages(msgs);
      });

      // Set receiver name
      const convo = conversations.find((c) => c.id === user.conversationId);
      if (convo) {
        const otherParticipants = convo.participantIds.filter(
          (id) => id !== user?.uid
        );
        if (otherParticipants.length > 0) {
          const participant = participantsMap.get(otherParticipants[0]);
          setReceiverName(participant?.displayName || "Unknown User");
        }
      }

      return () => unsubscribe();
    }
  }, [user.conversationId, conversations, participantsMap, user?.uid]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === "") return;

    await addDoc(collection(db, `conversations/${user.conversationId}/messages`), {
      text: newMessage,
      senderId: user.info?.uid,
      timestamp: serverTimestamp(),
      displayName: user.info?.displayName,
    });
    await updateDoc(doc(db, `conversations/${user.conversationId}`), {
      lastMessage: newMessage,
      lastMessageTimestamp: serverTimestamp(),
    });
    setNewMessage("");
  };

  const handleChatClose = () => {
    selectChats(null);
  };

  const formatTimestamp = (timestamp: any) => {
    return dayjs(timestamp?.toDate()).format("ddd HH:mm");
  };
  return (
    <div
      className={`fixed flex h-max ${
        user.isChatOpen ? "w-16" : "w-max"
      } transition-all`}
    >
      <div
        className={`fixed  right-4 ${user.isChatOpen ? "w-16 h-16" : "w-96"} ${
          user.isChatOpen
            ? "bg-gray-800 bottom-5 rounded-full flex justify-center items-center"
            : "bg-white bottom-0 rounded-t-lg"
        }  shadow-lg overflow-hidden transition-all`}
      >
        {!user.isChatOpen ? (
          <>
            {user.conversationId ? (
              <div className="relative flex flex-col h-[400px]">
                <div className="flex-none p-2 pr-0 bg-gray-400 flex justify-between items-center">
                  <span className="text-lg font-semibold">
                    {receiverName || "Chat"}
                  </span>
                  <div className="flex flex-nowrap">
                    <Button
                      type="text"
                      className={`w-full ${
                        user.isChatOpen ? "text-white" : "text-black"
                      }`}
                      onClick={() => setOpenChats(!user.isChatOpen)}
                      icon={
                        user.isChatOpen ? (
                          <FiMessageCircle color="white" size={40} />
                        ) : user.isChatOpen ? (
                          <FaArrowDown />
                        ) : (
                          <FiMinus size={20} />
                        )
                      }
                    />
                    <Button type="text" onClick={handleChatClose}>
                      <IoMdClose size={20} />
                    </Button>
                  </div>
                </div>
                <div className="flex-1 p-4 overflow-auto bg-gray-100">
                  {messages.map((msg, index) => (
                    <div
                      key={index}
                      className={`mb-2 ${
                        msg.senderId === user.info?.uid
                          ? "text-right"
                          : "text-left"
                      }`}
                    >
                      <div
                        className={`flex items-start mb-2 ${
                          msg.senderId === user.info?.uid
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {msg.senderId !== user.info?.uid && (
                          <Avatar
                            src={participantsMap.get(msg.senderId)?.photoUrl}
                            size={40}
                          />
                        )}
                        <div
                          className={`inline-block p-2 rounded-lg ml-2 ${
                            msg.senderId === user.info?.uid
                              ? "bg-blue-500 text-white"
                              : "bg-gray-300"
                          }`}
                        >
                          <div className="font-semibold">
                            {msg.senderId === user.info?.uid
                              ? "Me"
                              : participantsMap.get(msg.senderId)?.displayName}
                          </div>
                          <div>{msg.text}</div>
                          <div className="text-xs">
                            {formatTimestamp(msg.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="bg-white p-4 border-t">
                  <div className="flex">
                    <TextArea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type a message"
                      rows={1}
                      autoSize={{ minRows: 1, maxRows: 4 }}
                      className="flex-1"
                    />
                    <Button
                      onClick={handleSendMessage}
                      className="bg-blue-500 text-white px-4 py-2 ml-2"
                    >
                      Send
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="p-2 bg-gray-400  border-b-2 border-gray-300">
                  <div className="flex justify-between items-center w-full">
                    <p className="text-lg font-semibold">User Chats</p>
                    <Button
                      type="text"
                      className={`w-full ${
                        user.isChatOpen ? "text-white" : "text-black"
                      }`}
                      onClick={() => setOpenChats(!user.isChatOpen)}
                      icon={
                        user.isChatOpen ? (
                          <FiMessageCircle color="white" size={40} />
                        ) : user.isChatOpen ? (
                          <FaArrowDown />
                        ) : (
                          <FiMinus size={20} />
                        )
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col p-4">
                  <List
                    itemLayout="horizontal"
                    dataSource={conversations}
                    renderItem={(conversation) => {
                      const otherParticipantId = conversation.participantIds.find(
                        (id) => id !== user?.uid
                      );
                      const participant = participantsMap.get(
                        otherParticipantId || ""
                      );
                      return (
                        <List.Item
                          key={conversation.id}
                          className="cursor-pointer"
                          onClick={() => selectChats(conversation.id)}
                        >
                          <List.Item.Meta
                            avatar={
                              <Avatar src={participant?.photoUrl} />
                            }
                            title={participant?.displayName || "Unknown User"}
                            description={conversation.lastMessage}
                          />
                        </List.Item>
                      );
                    }}
                  />
                </div>
              </>
            )}
          </>
        ) : (
          <Button
            type="text"
            className=" w-16 h-16 bg-gray-800 text-white rounded-full flex justify-center items-center"
            icon={<FiMessageCircle size={40} />}
            onClick={() => setOpenChats(!user.isChatOpen)}
          />
        )}
      </div>
    </div>
  );
};
