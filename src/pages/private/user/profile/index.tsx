/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect } from "react";
import {
  Button,
  Upload,
  List,
  Avatar,
  message,
  Image,
  Divider,
  Tabs,
  Switch,
  Form,
  Input,
  Modal,
} from "antd";
import { FaCamera } from "react-icons/fa";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  or,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { CardData, TransactionData, UserProfileData } from "../../../../types";
import { auth, db, storage } from "../../../../db";
import { useParams } from "react-router-dom";
import { RatingComponents } from "./rating";
import { CustomLoader } from "../../../../components/loader";
import {
  saveUserInfo,
  selector,
} from "../../../../zustand/store/store.provider";
import { RatingForm } from "../myoffers/ratingForm";
import useStore from "../../../../zustand/store/store";
import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  verifyBeforeUpdateEmail,
} from "firebase/auth";

const { TabPane } = Tabs;

export const UserProfilePage = () => {
  const { uid } = useParams();
  const [form] = Form.useForm();
  const user = useStore(selector("user"));
  const [isPhoneNumberVisible, setIsPhoneNumberVisible] =
    useState<boolean>(false);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [cards, setCards] = useState<CardData[]>([]);
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null); // For image preview
  const [displayName, setDisplayName] = useState<string>("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // For storing the file object
  const [loading, setLoading] = useState(false);
  const [ratingStatus, setRatingStatus] = useState<Map<string, boolean>>(
    new Map()
  );
  const [isRatingVisible, setIsRatingVisible] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [currentTransaction, setCurrentTransaction] = useState<{
    transactionId: string;
    ratedUserId: string;
    role: "requester" | "receiver";
  } | null>(null);

  useEffect(() => {
    const fetchProfileAndTransactions = async () => {
      if (!uid) return;
      setLoading(true);
      const profileDoc = await getDoc(doc(db, "users", uid));
      if (profileDoc.exists()) {
        const profileData = profileDoc.data() as UserProfileData;
        setIsPhoneNumberVisible(profileData.isPhoneNumberVisible);
        setProfile(profileData);
        setImageUrl(profileData.photoURL || null);
        setDisplayName(profileData.displayName || "");
      }

      // Fetch user's cards
      const cardsSnapshot = await getDocs(
        query(collection(db, "postCards"), where("uid", "==", uid))
      );
      setCards(cardsSnapshot.docs.map((doc) => doc.data() as CardData));

      // Fetch user's transactions
      const transactionsSnapshot = await getDocs(
        query(
          collection(db, "swapTransactions"),
          or(where("receiverId", "==", uid), where("requesterId", "==", uid))
        )
      );

      const transactionsData = await Promise.all(
        transactionsSnapshot.docs.map(async (transactionDoc) => {
          const transaction = {
            id: transactionDoc.id,
            ...transactionDoc.data(),
          } as TransactionData;
          // Fetch requester's and receiver's user data
          const requesterProfileDoc = await getDoc(
            doc(db, "users", transaction.requesterId)
          );
          const receiverProfileDoc = await getDoc(
            doc(db, "users", transaction.receiverId)
          );

          // Fetch card details for requester and receiver
          const requesterCardDoc = await getDoc(
            doc(db, "postCards", transaction.requesterCardId)
          );
          const receiverCardDoc = await getDoc(
            doc(db, "postCards", transaction.receiverCardId)
          );

          return {
            ...transaction,
            requesterDisplayName: requesterProfileDoc.exists()
              ? requesterProfileDoc.data()?.displayName
              : "Unknown User",
            receiverDisplayName: receiverProfileDoc.exists()
              ? receiverProfileDoc.data()?.displayName
              : "Unknown User",
            requesterCardDetails: requesterCardDoc.exists()
              ? requesterCardDoc.data()
              : null,
            receiverCardDetails: receiverCardDoc.exists()
              ? receiverCardDoc.data()
              : null,
          };
        })
      );
      setTransactions(transactionsData);
      setLoading(false);
    };

    fetchProfileAndTransactions();
  }, [uid]);

  useEffect(() => {
    const fetchRatingStatus = async () => {
      const statusMap = new Map<string, boolean>();
      for (const request of transactions) {
        const rated = await hasUserRated(request.id);
        statusMap.set(request.id, rated);
      }
      setRatingStatus(statusMap);
    };

    fetchRatingStatus();
  }, [transactions]);

  const hasUserRated = async (transactionId: string) => {
    try {
      if (uid !== user.info.uid) {
        return false;
      }
      const transactionRef = doc(db, "swapTransactions", transactionId);
      const transactionSnap = await getDoc(transactionRef);
      if (transactionSnap.exists()) {
        const transactionData = transactionSnap.data();
        const isRequester = transactionData.requesterId === uid;
        const role = isRequester
          ? transactionData.requesterRated
          : transactionData.receiverRated;
        return role;
      }
      return false;
    } catch (error) {
      console.error("Failed to check rating status: ", error);
      return false;
    }
  };

  const handlePhoneNumberVisibilityChange = async (checked: boolean) => {
    setIsPhoneNumberVisible(checked);
    // Update the user's profile in Firestore with the new phone number visibility
    try {
      const userDoc = doc(db, "users", user.info.uid);
      await updateDoc(userDoc, {
        isPhoneNumberVisible: checked,
      });
    } catch (error) {
      console.error("Error updating phone number visibility:", error);
    }
  };

  const handleSaveProfile = async () => {
    if (!uid) return;

    try {
      setLoading(true);
      let uploadedImageUrl: string | null = imageUrl;
      if (selectedFile) {
        setLoading(true);
        const storageRef = ref(storage, `profileImages/${uid}`);
        await uploadBytes(storageRef, selectedFile);
        uploadedImageUrl = await getDownloadURL(storageRef);
      }

      // Update profile
      const userRef = doc(db, "users", uid);
      await updateDoc(userRef, {
        displayName,
        photoURL: uploadedImageUrl || imageUrl || null,
      });
      saveUserInfo({
        photoURL: uploadedImageUrl,
      });
      message.success("Profile updated successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Failed to update profile:", error);
      message.error("Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = (file: any) => {
    // Preview image
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Set selected file
    setSelectedFile(file);
    return false; // Prevent default upload behavior
  };

  const handleRate = (transactionId: string, ratedUserId: string) => {
    const transaction = transactions.find((t) => t.id === transactionId);
    if (!transaction) return;

    const isRequester = transaction.requesterId === uid;
    const role = isRequester ? "requester" : "receiver";

    setCurrentTransaction({ transactionId, ratedUserId, role });
    setIsRatingVisible(true);
  };

  const showEditModal = () => {
    setIsModalVisible(true);
  };

  const handleUpdateAdmin = async (values: {
    email: string;
    currentPassword?: string;
    newPassword?: string;
    displayName: string;
    phoneNumber: string;
  }) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("No authenticated user found.");

      // Reload user to get the latest email verification status
      await user.reload();
      const updatedUser = auth.currentUser;

      if (updatedUser && updatedUser.email !== values.email) {
        // Send a verification email to the new address before updating
        await verifyBeforeUpdateEmail(updatedUser, values.email);
        message.info(
          "A verification email has been sent to the new address. Please verify it before updating."
        );

        // Do not update Firestore or Authentication until the email is verified
        return;
      }

      // Update password if provided
      if (values.currentPassword && user.email) {
        const credential = EmailAuthProvider.credential(
          user.email,
          values.currentPassword
        );
        await reauthenticateWithCredential(user, credential);

        // If reauthentication succeeds, update the password
        if (values.newPassword) {
          await updatePassword(user, values.newPassword);
          message.success("Password updated successfully!");
        }
      }

      // Update email in Firestore
      const userDoc = doc(db, "users", user.uid);
      await updateDoc(userDoc, {
        email: values.email,
        displayName: values.displayName,
        phoneNumber: values.phoneNumber,
      });
      form.resetFields();
      setIsModalVisible(false);
    } catch (error: any) {
      const errorCode = error.code;
      if (errorCode == "email-already-in-use") {
        message.error("You already have an account with that email.");
      } else if (errorCode == "auth/invalid-email") {
        message.error("Please provide a valid email");
      } else if (errorCode == "auth/weak-password") {
        message.error("The password is too weak.");
      } else {
        message.error(error.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex justify-center items-center">
        <CustomLoader />
      </div>
    );
  }
  console.log(user);
  return (
    <div className="px-1 md:px-8 py-4 text-white">
      {isRatingVisible && currentTransaction && (
        <RatingForm
          visible={isRatingVisible}
          onClose={() => setIsRatingVisible(false)}
          transactionId={currentTransaction.transactionId}
          ratedUserId={currentTransaction.ratedUserId}
          role={currentTransaction.role}
        />
      )}
      <h1 className="text-2xl font-bold mb-4">User Profile</h1>
      <Divider className="bg-white" />

      {/* Profile Preview */}
      {profile && (
        <div className="relative mb-8 bg-[#13161b] text-white p-2 rounded-md">
          <div className="flex flex-col md:flex-row items-center mb-4">
            <div className="flex flex-col gap-2">
              <div className="relative">
                <Avatar
                  src={previewImage || imageUrl || profile.photoURL}
                  size={150}
                />
                <Upload showUploadList={false} beforeUpload={handleUpload}>
                  <FaCamera
                    color="gray"
                    size={30}
                    className="absolute right-2 bottom-4 cursor-pointer"
                  />
                </Upload>
              </div>
              {selectedFile && (
                <Button
                  type="primary"
                  onClick={handleSaveProfile}
                  className="text-white"
                  loading={loading}
                >
                  Save Profile
                </Button>
              )}
            </div>
            <div className="ml-2 md:ml-4 w-full mt-2 md:mt-0">
              <div className="text-xl font-semibold">{profile.displayName}</div>
              <div className="text-gray-400 break-words overflow-wrap">
                {profile.email}
              </div>
              <div className="text-gray-400 break-words overflow-wrap">
                User ID: {profile.uid}
              </div>{" "}
              {isPhoneNumberVisible && (
                <div className="text-gray-400 break-words overflow-wrap">
                  Phone Number: {profile.phoneNumber}
                </div>
              )}
              {uid === user.info.uid && (
                <div className="mt-2 flex items-center">
                  <span className="text-gray-400 mr-2">Show Phone Number</span>
                  <Switch
                    checked={isPhoneNumberVisible}
                    onChange={handlePhoneNumberVisibilityChange}
                  />
                </div>
              )}
            </div>
          </div>
          <Button
            type="primary"
            className="absolute top-2 right-2"
            onClick={() => showEditModal()}
          >
            Edit Info
          </Button>
        </div>
      )}

      {/* Tabs for Card List, Recent Transactions, and Ratings */}
      <Tabs defaultActiveKey="1">
        <TabPane style={{ color: "white" }} tab="My Card" key="1">
          <div className="flex flex-wrap items-center justify-center gap-4">
            {cards?.map((card: CardData) => (
              <div className="flex flex-col bg-[#13161b] text-white border-6 rounded-md border-[#2d3138] p-2">
                <Image
                  src={card.imageUrl}
                  width={150}
                  height={150}
                  className="object-fill"
                />
                <div className="px-2">
                  <h3 className="text-lg font-bold">{card.cardNumber}</h3>
                  <p className="text-gray-400">{card.playerName}</p>
                  <p className="text-gray-400">{card.playerTeam}</p>
                  <p className="text-gray-400">{card.type}</p>
                  <p className="text-gray-400">{card.collection}</p>
                </div>
              </div>
            ))}
          </div>
        </TabPane>

        <TabPane tab="Recent Transactions" key="2">
          {/* Recent Transactions List */}
          <List
            itemLayout="vertical"
            dataSource={transactions}
            renderItem={(transaction) => {
              const isRequester = transaction.requesterId === uid;
              const userRole = isRequester ? "You requested" : "You received";
              const opponentRole = isRequester ? "from" : "to";
              const opponentId = isRequester
                ? transaction.receiverDisplayName
                : transaction.requesterDisplayName;

              return (
                <List.Item className="bg-[#13161b] text-white p-4 rounded-md mb-4 ">
                  <List.Item.Meta
                    title={
                      <div className="text-lg flex justify-between font-semibold text-white px-4">
                        <p>
                          {userRole} a card {opponentRole}{" "}
                          <span className="text-blue-400">{opponentId}</span>
                        </p>
                        {!ratingStatus.get(transaction.id) && (
                          <Button
                            type="default"
                            onClick={() =>
                              handleRate(transaction.id, transaction.receiverId)
                            }
                          >
                            Rate
                          </Button>
                        )}
                      </div>
                    }
                    description={
                      <div className="text-gray-400 px-4">
                        <div className="flex flex-nowrap justify-between items-center">
                          <p>Transaction ID: {transaction.id}</p>
                          <p>
                            Status:{" "}
                            <span
                              className={`font-semibold ${
                                transaction.status === "accepted"
                                  ? "text-green-400"
                                  : "text-red-400"
                              }`}
                            >
                              {transaction.status}
                            </span>
                          </p>
                          <p>
                            Date:{" "}
                            {transaction.createdAt
                              .toDate()
                              .toLocaleDateString()}
                          </p>
                        </div>
                        <div className="mt-2 flex justify-between items-center flex-col md:flex-row">
                          <div className="flex flex-col justify-center items-center">
                            <p>
                              <strong>Your Card:</strong>{" "}
                              {isRequester
                                ? transaction.requesterCardId
                                : transaction.receiverCardId}
                            </p>
                            <img
                              className="w-[200px] h-[250px]"
                              src={
                                isRequester
                                  ? transaction.requesterCardDetails?.imageUrl
                                  : transaction.receiverCardDetails?.imageUrl
                              }
                              alt=""
                            />
                          </div>
                          <div className="flex flex-col justify-center items-center">
                            <p>
                              <strong>
                                {isRequester
                                  ? transaction.receiverDisplayName
                                  : transaction.requesterDisplayName}
                                's Card:
                              </strong>{" "}
                              {isRequester
                                ? transaction.receiverCardId
                                : transaction.requesterCardId}
                            </p>
                            <img
                              className="w-[200px] h-[250px]"
                              src={
                                isRequester
                                  ? transaction.receiverCardDetails?.imageUrl
                                  : transaction.requesterCardDetails?.imageUrl
                              }
                              alt=""
                            />
                          </div>
                        </div>
                      </div>
                    }
                  />
                </List.Item>
              );
            }}
          />
        </TabPane>

        <TabPane tab="Ratings" key="3">
          <RatingComponents uid={uid} />
        </TabPane>
      </Tabs>
      <Modal
        title="Edit your Information"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleUpdateAdmin}
          initialValues={{
            email: user.info.email,
            displayName: user.info.displayName,
            phoneNumber: user.info.phoneNumber || profile?.phoneNumber,
          }}
        >
          <Form.Item
            label="Display Name"
            name="displayName"
            rules={[
              { required: true, message: "Please enter your Display Name" },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phoneNumber"
            rules={[
              {
                required: true,
                message: "Please input your phone number!",
              },
              {
                pattern: /^(\+971|0)?[1-9][0-9]{8}$/,
                message: "Please input a valid UAE phone number!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Email"
            name="email"
            rules={[
              {
                required: true,
                message: "Please enter a valid email",
                type: "email",
              },
              { type: "email", message: "The input is not a valid email!" },
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            label="Current Password"
            name="currentPassword"
            rules={[
              { required: true, message: "Please enter your current password" },
            ]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item label="New Password" name="newPassword">
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit">
              Update
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};
