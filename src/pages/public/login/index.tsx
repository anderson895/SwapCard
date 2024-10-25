import "../../../index.css";
import { useState } from "react";
import { FaFacebookSquare } from "react-icons/fa";
import { Button, Form, Input, message, Modal } from "antd";
import { auth, db, facebookProvider } from "../../../db";
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  UserCredential,
} from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { RouterUrl } from "../../../routes";
import {
  saveAdminInfo,
  saveUserInfo,
} from "../../../zustand/store/store.provider";
import { UserProfileData } from "../../../types";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { PrivacyPolicy } from "./privacyPolicy";
import { FloatingHelpButton } from "./floatingHelpButton";

export const LoginPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);

  const isValidUaePhoneNumber = (phoneNumber: string): boolean => {
    const uaePhoneNumberRegex = /^\+971[0-9]{9}$/;
    return uaePhoneNumberRegex.test(phoneNumber);
  };

  // Handle Facebook Login
  const signInWithFacebook = async () => {
    try {
      const result: UserCredential = await signInWithPopup(
        auth,
        facebookProvider
      );
      const user = result.user;
      setLoading(true);

      // Fetch user document from Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data() as UserProfileData | undefined;
      let phoneNumber: string | null = user.phoneNumber || null;
      if (!phoneNumber && userData) {
        // If phone number is not available from the user object, use Firestore data
        phoneNumber = userData.phoneNumber || null;
      }
        if (!phoneNumber) {
          phoneNumber = await promptPhoneNumber();
          if (!phoneNumber) {
            message.error("Phone number is required to sign in.");
            setLoading(false);
            return;
          }
        }

        if (!userData) {
          // Create user document in Firestore if it doesn't exist
          await setDoc(userDocRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: user.photoURL || "",
            phoneNumber: phoneNumber,
            isVerified: false,
          } as UserProfileData);
        }

      if (userData && userData.isVerified) {
        if (userData.type === "admin") {
          saveAdminInfo({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            provider: "facebook",
          });
        } else {
          saveUserInfo({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: userData.photoURL,
            phoneNumber: userData.phoneNumber,
            provider: "facebook",
          });
        }

        message.success(
          "User signed in with Facebook and details saved successfully!"
        );
        setLoading(false);
        setTimeout(() => {
          if (user.displayName === "Admin") {
            navigate(RouterUrl.AdminHome);
          } else {
            navigate(RouterUrl.UserHomePage);
          }
        }, 2000);
      } else {
        await signOut(auth);
        message.error("Your account is not verified. Please contact support.");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error signing in with Facebook: ", error);
      message.error("Failed to sign in with Facebook.");
      setLoading(false);
    }
  };

  const promptPhoneNumber = async (): Promise<string | null> => {
    return new Promise((resolve) => {
      let phoneNumber = "";
      const validatePhoneNumber = () => {
        if (!isValidUaePhoneNumber(phoneNumber)) {
          message.error(
            "Please enter a valid UAE phone number (e.g., +971XXXXXXXXX)."
          );
          return false;
        }
        return true;
      };
      Modal.confirm({
        title: "Phone Number Required",
        content: (
          <><Form>
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
              <Input onChange={(e) => (phoneNumber = e.target.value)}  />
            </Form.Item>
          </Form></>
        ),
        okText: "Submit",
        cancelText: "Cancel",
        onOk() {
          if (validatePhoneNumber()) {
            resolve(phoneNumber);
          } else {
            resolve(null); // Validation failed, resolve with null
          }
        },
        onCancel() {
          resolve(null); // Canceled by user, resolve with null
        },
      });
    });
  };

  // Handle Email and Password Login
  const onFinish = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      const { email, password } = values;
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, "users", user.uid));
      const userData = userDoc.data() as UserProfileData;

      if (userData && userData.isVerified) {
        if (userData.type === "admin") {
          saveAdminInfo({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            provider: "email",
          });
        } else {
          saveUserInfo({
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || "",
            photoURL: userData.photoURL,
            provider: "email",
          });
        }

        message.success("Logged in successfully!");
        setLoading(false);
        setTimeout(() => {
          if (user.displayName === "Admin") {
            navigate(RouterUrl.AdminHome);
          } else {
            navigate(RouterUrl.UserHomePage);
          }
        }, 2000);
      } else {
        await signOut(auth);
        message.error("Your account is not verified. Please contact support.");
        setLoading(false);
      }
    } catch (error) {
      console.log(error);
      message.error("Invalid email or password.");
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex md:items-center md:justify-center min-h-screen bg-gray-100">
        <div className="bg-white flex p-2 md:p-8 rounded-lg w-full md:w-[70%] z-50 min-h-[300px] h-max flex-wrap flex-col md:flex-row">
          <div className="w-full md:w-1/2 p-2 pr-8">
            <h2 className="font-semibold font-sans">SIGN IN</h2>
            <p className="text-sm">Sign in with your email and password</p>
            <Form layout="vertical" onFinish={onFinish}>
              <Form.Item
                label="Email"
                name="email"
                className="mb-2"
                rules={[
                  { required: true, message: "Please input your email!" },
                ]}
              >
                <Input />
              </Form.Item>
              <Form.Item
                label="Password"
                name="password"
                rules={[
                  { required: true, message: "Please input your password!" },
                ]}
              >
                <Input.Password />
              </Form.Item>

              <Form.Item>
                <Button
                  block
                  type="primary"
                  htmlType="submit"
                  className="z-50"
                  loading={loading}
                >
                  Log in
                </Button>
              </Form.Item>
            </Form>
          </div>
          <div className="w-full md:w-1/2 p-2 flex flex-col h-[300px] justify-top items-center md:border-l-2 pl-4 border-gray-300 gap-8">
            <div className="w-full">
              <h2 className="font-semibold font-sans">REGISTER</h2>
              <p className="text-sm">Not a member yet?</p>
            </div>
            <div className="w-full h-full flex flex-col gap-2 justify-center items-center">
              <button
                onClick={() => navigate(RouterUrl.Registration)}
                className="bg-orange-600 px-0 md:px-4 py-2 rounded-lg text-white w-[90%] hover:bg-orange-700 transition duration-200 flex items-center justify-center gap-4"
              >
                CREATE ACCOUNT
              </button>
              <p className="font-semibold">OR</p>
              <button
                className="bg-sky-600 px-4 py-2 rounded-lg text-white w-[90%] hover:bg-blue-700 transition duration-200 flex items-center justify-center gap-4"
                onClick={() => signInWithFacebook()}
              >
                <FaFacebookSquare size={20} /> Continue with Facebook
              </button>
              <p className="text-center text-sm">
                By registering/signing in, you agree to{" "}
                <span
                  className="text-orange-700 cursor-pointer"
                  onClick={() => setIsPrivacyModalVisible(true)}
                >
                  Privacy Notice
                </span>{" "}
                and{" "}
                <span
                  className="text-orange-700 cursor-pointer"
                >
                  Terms And Conditions
                </span>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
      <FloatingHelpButton />
      {/* Privacy Notice Modal */}
      <Modal
        title="Privacy Notice"
        open={isPrivacyModalVisible}
        width={700}
        onOk={() => setIsPrivacyModalVisible(false)}
        onCancel={() => setIsPrivacyModalVisible(false)}
        footer={null}
      >
        <PrivacyPolicy />
      </Modal>
    </>
  );
};
