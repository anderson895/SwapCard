/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState } from "react";
import { Form, Input, Button, message } from "antd";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../../../db";
import { saveUserData } from "../../../helpers/loginThrough";
import { useNavigate } from "react-router-dom";
import { RouterUrl } from "../../../routes";

export const RegistrationPage: React.FC = () => {
  const navigate = useNavigate()
  const [loading,setLoading] = useState(false)
  const onFinish = async (values: {
    username: string;
    email: string;
    password: string;
    phoneNumber:string;
  }) => {
    try {
      setLoading(true)
      const { username, email, password, phoneNumber  } = values;
      // Create a new user with email and password
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      await updateProfile(userCredential.user, {
        displayName: username
      });
      await saveUserData({
        uid: userCredential.user.uid,
        displayName: username,
        email,
        phoneNumber: phoneNumber,
      }, "firestore");
      setLoading(false)
      message.success("Registration successful!");
      navigate(RouterUrl.Login)
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {

        message.error(
          "The email address is already in use. Please use a different email."
        );
        setLoading(false)

      } else {
        console.error("Error registering user:", error);
        message.error("Registration failed. Please try again.");
        setLoading(false)
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-[90%] max-w-md">
        <h2 className="font-semibold text-lg mb-4">Register</h2>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true, message: "Please input your username!" }]}
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
                type: "email",
                message: "Please input a valid email!",
              },
            ]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true, message: "Please input your password!" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item>
            <Button block type="primary" htmlType="submit" loading={loading}>
              Register
            </Button>
          </Form.Item>
          <div className="flex flex-col justify-center items-center text-lg mt-4">
                <a href="/">
                  Already have an account?{" "}
                  <span className="text-[#6a040f]">Login</span>
                </a>
              </div>
        </Form>
      </div>
    </div>
  );
};
